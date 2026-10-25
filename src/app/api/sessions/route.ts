import { NextResponse } from 'next/server';

/**
 * Retired. Rooms used to be created here against an older database. Nothing calls this any more, and an
 * unused endpoint that touches the database is only attack surface, so it answers 410 and does nothing.
 */
const gone = () => NextResponse.json({ error: 'Gone' }, { status: 410 });
export const GET = gone;
export const POST = gone;
