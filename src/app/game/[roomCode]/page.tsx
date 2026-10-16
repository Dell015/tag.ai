'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, ConfirmSheet, Icon, Screen, Splash } from '@/components/ui';
import { PlayerRow } from '@/components/lobby/PlayerRow';
import { useRoom } from '@/hooks/use-room';
import { useRequireProfile } from '@/lib/use-profile';
import { rooms, withPlayer, withoutPlayer, MAX_PLAYERS } from '@/lib/data/rooms';

export default function LobbyPage() {
  const params = useParams<{ roomCode: string }>();
  const code = params.roomCode.toUpperCase();
  const router = useRouter();
  const { ready, profile } = useRequireProfile(`/game/${code}`);
  const { status, room } = useRoom(code);
  const [guest, setGuest] = useState('');
  const [leaving, setLeaving] = useState(false);

  if (!ready || !profile || status === 'loading') return <Splash />;

  if (status === 'missing' || !room) {
    return (
      <Screen title="Game not found" back="/">
        <p className="text-lg text-muted">This game is not on this phone. Start a new one from home.</p>
        <Link href="/" className="mt-6 block"><Button full>Back home</Button></Link>
      </Screen>
    );
  }

  const isHost = room.hostId === profile.id;
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
      onBack={isHost && room.players.length > 1 ? () => setLeaving(true) : () => router.push('/')}
      footer={
        isHost ? (
          <>
            <Button size="lg" full disabled={room.players.length < 2} onClick={() => router.push(`/game/${code}/setup`)}>
              {room.players.length < 2 ? 'Add at least 2 players' : 'Next: buy cards'}
            </Button>
          </>
        ) : (
          <p className="pb-2 text-center text-lg text-muted">Waiting for the host to start.</p>
        )
      }
    >
      <h2 className="mb-1 mt-2 flex items-baseline justify-between text-4xl">
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
      {isHost && <p className="mt-2 text-sm text-muted">One phone runs the whole game. Friends do not need the app.</p>}
      <ConfirmSheet open={leaving} title="Leave this game?" body="Everyone you added will be removed." confirmLabel="Leave game" danger
        onConfirm={() => { rooms.remove(code); router.push('/'); }} onClose={() => setLeaving(false)} />
    </Screen>
  );
}
