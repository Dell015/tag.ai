'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, Icon, Screen, Splash, toast } from '@/components/ui';
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
        <p className="text-lg text-muted">Room <b className="text-text">{code}</b> doesn&apos;t exist on this phone. Rooms live on the host&apos;s device for now, so open the invite there or host a new one.</p>
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
    rooms.update(code, (r) => withPlayer(r, { id, userId: id, displayName: name, avatarUrl: `c${(r.players.length + 2) % 10}`, isGuest: true }));
    setGuest('');
  };

  if (room.status === 'active') {
    return (
      <Screen title="Game on" back="/">
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
              {room.players.length < 2 ? 'Add at least 2 players' : 'Next: pick a deck'}
            </Button>
          </>
        ) : (
          <p className="pb-2 text-center text-lg text-muted">Waiting for the host to start.</p>
        )
      }
    >
      <section>
        <p className="text-base font-bold text-muted">Room code</p>
        <div className="mt-2 flex gap-1.5" aria-label={code.split('').join(' ')}>
          {code.split('').map((c, i) => (
            <span key={i} className="flex h-[4.5rem] flex-1 items-center justify-center rounded-lg bg-accent text-[3.2rem] font-extrabold text-onaccent" style={{ fontStretch: '75%' }}>{c}</span>
          ))}
        </div>
        <Button variant="secondary" full className="mt-3" onClick={share}><Icon name="share" size={22} />Share invite link</Button>
      </section>

      <h2 className="mb-1 mt-9 flex items-baseline justify-between text-4xl">
        Players <span className="text-lg font-bold text-muted">{room.players.length}/{MAX_PLAYERS}</span>
      </h2>
      <ul>
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
            className="h-tap min-w-0 flex-1 rounded-xl border-2 border-line bg-transparent px-4 text-lg placeholder:text-muted/60 focus:border-accent"
          />
          <Button type="submit" variant="secondary" disabled={full || !guest.trim()}><Icon name="plus" size={20} />Add</Button>
        </form>
      )}
      {isHost && <p className="mt-2 text-sm text-muted">No account needed. Friends without the app play from your phone.</p>}
    </Screen>
  );
}
