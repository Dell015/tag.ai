'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, Screen, toast } from '@/components/ui';
import { Splash } from '@/components/ui/Splash';
import { PlayerRow } from '@/components/lobby/PlayerRow';
import { useRoom } from '@/hooks/use-room';
import { useRequireProfile } from '@/lib/use-profile';
import { joinRoom } from '@/lib/data/join';
import { rooms, withPlayer, withoutPlayer, MAX_PLAYERS } from '@/lib/data/rooms';

export default function LobbyPage() {
  const params = useParams<{ roomCode: string }>();
  const code = params.roomCode.toUpperCase();
  const router = useRouter();
  const { ready, profile } = useRequireProfile(`/game/${code}`);
  const { status, room } = useRoom(code);
  const [guest, setGuest] = useState('');
  const joined = useRef(false);

  // Arriving from an invite link: join automatically while the room is in the lobby.
  useEffect(() => {
    if (!ready || !profile || !room || joined.current) return;
    if (!room.players.some((p) => p.userId === profile.id)) {
      joined.current = true;
      const res = joinRoom(code, profile);
      if (!res.ok) toast(res.error, { tone: 'warn' });
    }
  }, [ready, profile, room, code]);

  if (!ready || !profile || status === 'loading') return <Splash />;

  if (status === 'missing' || !room) {
    return (
      <Screen title="Room not found" back="/">
        <p className="text-lg text-muted">Room <b className="text-ink">{code}</b> doesn&apos;t exist on this phone. Rooms live on the host&apos;s device for now, so open the invite there or host a new one.</p>
        <Link href="/" className="mt-6 block"><Button full>Back home</Button></Link>
      </Screen>
    );
  }

  const isHost = room.hostId === profile.id;
  const link = typeof window !== 'undefined' ? `${window.location.origin}/game/${code}` : '';

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Join my tag.ai game', text: `Room ${code}`, url: link });
      else {
        await navigator.clipboard.writeText(link);
        toast('Invite link copied', { tone: 'ok' });
      }
    } catch { /* cancelled */ }
  };

  const addGuest = () => {
    const name = guest.trim();
    if (name.length < 1) return;
    const id = `guest-${Math.random().toString(36).slice(2, 10)}`;
    rooms.update(code, (r) => withPlayer(r, { id, userId: id, displayName: name, avatarUrl: ['🥳','😜','🤪','🤠','😏','🥴','🦊','🐸'][r.players.length % 8], isGuest: true }));
    setGuest('');
  };

  if (room.status === 'active') {
    return (
      <Screen title="Game on 🍻" back="/">
        <p className="text-lg text-muted">{isHost ? 'Your game is running.' : "The game is being played on the host's phone."}</p>
        {isHost && <Link href={`/game/${code}/play`} className="mt-6 block"><Button size="lg" full>Resume game</Button></Link>}
      </Screen>
    );
  }

  const full = room.players.length >= MAX_PLAYERS;

  return (
    <Screen
      back="/"
      footer={
        isHost ? (
          <>
            <Button size="lg" full disabled={room.players.length < 2} onClick={() => router.push(`/game/${code}/setup`)}>
              {room.players.length < 2 ? 'Add at least 2 players' : 'Next: pick the vibe'}
            </Button>
          </>
        ) : (
          <p className="pb-2 text-center text-lg text-muted">Waiting for the host to start…</p>
        )
      }
    >
      <section className="rounded-card bg-surface p-5 text-center ring-1 ring-white/10">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted">Room code</p>
        <p className="mt-1 font-display text-6xl font-extrabold tracking-[0.2em]" aria-label={code.split('').join(' ')}>{code}</p>
        <Button variant="secondary" className="mt-4" onClick={share}>📤 Share invite</Button>
      </section>

      <h2 className="mb-3 mt-8 flex items-baseline justify-between text-2xl font-extrabold">
        Players <span className="text-base font-semibold text-muted">{room.players.length}/{MAX_PLAYERS}</span>
      </h2>
      <ul className="space-y-2">
        {[...room.players].sort((a, b) => a.turnOrder - b.turnOrder).map((p) => (
          <PlayerRow
            key={p.userId}
            name={p.displayName}
            avatar={p.avatarUrl}
            isHost={p.userId === room.hostId}
            isGuest={p.isGuest}
            isYou={p.userId === profile.id}
            onRemove={isHost && p.userId !== room.hostId ? () => rooms.update(code, (r) => withoutPlayer(r, p.userId)) : undefined}
          />
        ))}
      </ul>

      {isHost && (
        <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); addGuest(); }}>
          <input
            value={guest}
            maxLength={16}
            disabled={full}
            onChange={(e) => setGuest(e.target.value)}
            placeholder="Add a friend by name"
            aria-label="Guest name"
            className="h-tap min-w-0 flex-1 rounded-2xl bg-surface px-4 text-lg ring-1 ring-white/10 placeholder:text-muted/60"
          />
          <Button type="submit" variant="secondary" disabled={full || !guest.trim()}>Add</Button>
        </form>
      )}
      {isHost && <p className="mt-2 text-sm text-muted">No account needed — friends without the app can play from your phone.</p>}
    </Screen>
  );
}
