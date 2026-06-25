import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateRoomCode } from '@/lib/validators';
import QRCode from 'qrcode';

const MAX_ROOM_CODE_RETRIES = 5;

/**
 * POST /api/sessions
 *
 * Creates a new game session with a unique room code.
 * Requires authenticated user. The authenticated user becomes the host.
 *
 * Returns: { sessionId, roomCode, joinUrl, qrCodeDataUrl }
 */
export async function POST() {
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please log in to create a session.' },
      { status: 401 }
    );
  }

  // 2. Generate unique room code (retry on collision)
  let roomCode: string | null = null;

  for (let attempt = 0; attempt < MAX_ROOM_CODE_RETRIES; attempt++) {
    const candidate = generateRoomCode();

    // Check uniqueness across active sessions (status 'lobby' or 'active')
    const { data: existing, error: checkError } = await supabase
      .from('sessions')
      .select('id')
      .eq('room_code', candidate)
      .in('status', ['lobby', 'active'])
      .limit(1);

    if (checkError) {
      // RLS may block this query — treat as no collision found.
      // The UNIQUE constraint on room_code will catch actual collisions on insert.
      roomCode = candidate;
      break;
    }

    if (!existing || existing.length === 0) {
      roomCode = candidate;
      break;
    }
  }

  if (!roomCode) {
    return NextResponse.json(
      { error: 'Failed to generate a unique room code. Please try again.' },
      { status: 500 }
    );
  }

  // 3. Create session record in Supabase with status "lobby"
  const { data: session, error: insertError } = await supabase
    .from('sessions')
    .insert({
      host_id: user.id,
      room_code: roomCode,
      status: 'lobby',
      card_count_target: 20, // default, host can change in setup
    })
    .select('id, room_code')
    .single();

  if (insertError || !session) {
    console.error('[Sessions API] Insert error:', insertError?.message, insertError?.code, insertError?.details);
    return NextResponse.json(
      { error: `Failed to create session: ${insertError?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }

  // 4. Also add the host as the first player in session_players
  const { error: playerError } = await supabase.from('session_players').insert({
    session_id: session.id,
    user_id: user.id,
    display_name: user.user_metadata?.username || user.email || 'Host',
    turn_order: 0,
  });

  if (playerError) {
    // Non-critical — session was created but host wasn't added as player.
    // Log but don't fail the request.
    console.error('Failed to add host as session player:', playerError);
  }

  // 5. Generate join URL and QR code
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const joinUrl = `${baseUrl}/game/${roomCode}/join`;

  let qrCodeDataUrl: string | null = null;
  try {
    qrCodeDataUrl = await QRCode.toDataURL(joinUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch {
    // QR generation is non-critical — return session data without it
    console.error('Failed to generate QR code');
  }

  // 6. Return session data
  return NextResponse.json({
    sessionId: session.id,
    roomCode: session.room_code,
    joinUrl,
    qrCodeDataUrl,
  });
}
