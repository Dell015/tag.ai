'use client';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, ConfirmSheet, Icon, Screen, Splash } from '@/components/ui';
import { PlayerRow } from '@/components/lobby/PlayerRow';
import { LiveView } from '@/components/lobby/LiveView';
import { FriendInviteSheet } from '@/components/lobby/FriendInviteSheet';
import { useRoom } from '@/hooks/use-room';
import { useRequireProfile } from '@/lib/use-profile';
import { rooms, withPlayer, withoutPlayer, MAX_PLAYERS } from '@/lib/data/rooms';
import { goOnline, leaveOnline } from '@/lib/data/room-sync';
import { useAccountStore } from '@/stores/account-store';
import { toast } from '@/components/ui';

export default function LobbyPage() {
  const params = useParams<{ roomCode: string }>();
  const code = params.roomCode.toUpperCase();
  const router = useRouter();
  const { ready, profile } = useRequireProfile(`/game/${code}`);
  const { status, room } = useRoom(code);
  const [guest, setGuest] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const account = useAccountStore((s) => s.status);
  const [publishing, setPublishing] = useState(false);
  const [origin, setOrigin] = useState('');
  useEffect(() => { setOrigin(window.location.origin); }, []);

  if (!ready || !profile || status === 'loading') return <Splash />;

  if (status === 'missing' || !room) {
    return (
      <Screen title="Game not found" back="/">
        <p className="text-lg text-muted">This room is closed, or the host removed you. Ask for a new code, or start a game from home.</p>
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
    // Online: the game runs on one phone. That phone continues; every other phone watches.
    if (room.online && room.gamePhone) {
      const mine = room.gamePhone === profile.id;
      return (
        <Screen title="Game on" back="/">
          {mine ? (
            <Link href={`/game/${code}/play`} className="mt-2 block"><Button size="lg" full>Continue the game</Button></Link>
          ) : (
            <LiveView room={room} myId={profile.id} onClaimed={() => router.push(`/game/${code}/play`)} />
          )}
        </Screen>
      );
    }
    return (
      <Screen title="Game on" back="/">
        <p className="text-lg text-muted">{isHost ? 'Your game is running.' : "The game is being played on the host's phone."}</p>
        {isHost && <Link href={`/game/${code}/play`} className="mt-6 block"><Button size="lg" full>Resume game</Button></Link>}
      </Screen>
    );
  }

  const full = room.players.length >= MAX_PLAYERS;
  const link = `${origin}/join?code=${code}`;
  const invite = async () => {
    setPublishing(true);
    const res = await goOnline(code);
    setPublishing(false);
    if (!res.ok) toast(res.error, { tone: 'warn' });
  };
  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: 'Join my game on Tag.ai', text: `Room code ${code}`, url: link }); return; }
      await navigator.clipboard.writeText(link); toast('Link copied.', { tone: 'ok' });
    } catch { /* cancelled */ }
  };
  const leave = () => { void leaveOnline(code); rooms.remove(code); router.push('/'); };

  return (
    <Screen
      onBack={isHost && room.players.length > 1 || room.online ? () => setLeaving(true) : () => router.push('/')}
      footer={
        isHost ? (
          <>
            <Button size="lg" full disabled={room.players.length < 2} onClick={() => router.push(`/game/${code}/setup`)}>
              {room.players.length < 2 ? 'Add at least 2 players' : 'Next: buy cards'}
            </Button>
          </>
        ) : (
          <p className="pb-2 text-center text-lg text-muted">Waiting for the host to start. You are in room {code}.</p>
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
      {isHost && <p className="mt-2 text-sm text-muted">Friends without the app can be added by name. They play from this phone.</p>}

      {isHost && (
        <section className="mt-8 rounded-xl border-2 border-line p-4" aria-label="Invite friends">
          {room.online ? (
            <div className="flex items-center gap-4">
              <div className="shrink-0 rounded-lg bg-white p-2"><QRCodeSVG value={link} size={104} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-muted">Room code</p>
                <p className="sign text-4xl tracking-[0.18em]" aria-label={`Room code ${code.split('').join(' ')}`}>{code}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="md" variant="secondary" onClick={share}>Share link</Button>
                  <Button size="md" variant="secondary" onClick={() => setInviting(true)}>Invite a friend</Button>
                </div>
              </div>
            </div>
          ) : account === 'signedIn' ? (
            <>
              <p className="text-lg font-bold">Friends with the app can join from their own phones.</p>
              <p className="mt-1 text-base text-muted">You get a code and a QR to share. They sign up in a minute if they do not have an account. Everyone then adds to the pot from their own wallet.</p>
              <p className="mb-3 mt-1 text-base text-muted">Playing on one phone? Skip this. Add friends by name above and you pay the pot.</p>
              <Button size="lg" full onClick={invite} disabled={publishing}>{publishing ? 'Opening the room' : 'Invite friends'}</Button>
            </>
          ) : (
            <>
              <p className="text-lg font-bold">Want friends to join from their own phones?</p>
              <p className="mb-3 mt-1 text-base text-muted">Online rooms need an account. It takes under a minute.</p>
              <Link href={`/welcome?next=${encodeURIComponent(`/game/${code}`)}`}><Button size="lg" full variant="secondary">Create an account</Button></Link>
            </>
          )}
        </section>
      )}
      <FriendInviteSheet open={inviting} onClose={() => setInviting(false)} code={code} inRoom={room.players.map((p) => p.userId)} />
      <ConfirmSheet open={leaving} title="Leave this game?" body={isHost ? (room.online ? "The room closes for everyone, and the people you added are removed." : "Everyone you added will be removed.") : "You leave this room. You can join again with the code."} confirmLabel="Leave game" danger
        onConfirm={leave} onClose={() => setLeaving(false)} />
    </Screen>
  );
}
