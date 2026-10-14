'use client';
import { useEffect, useState } from 'react';
import { rooms, type Room } from '@/lib/data/rooms';
import { useSessionStore } from '@/stores/session-store';

type Status = 'loading' | 'ready' | 'missing';

function applyRoom(room: Room) {
  useSessionStore.getState().setSession({
    sessionId: room.code,
    roomCode: room.code,
    hostId: room.hostId,
    status: room.status,
    players: room.players,
    agreedPlayers: room.agreedPlayers,
    ...room.config,
  });
}

function roomFromStore(base: Room): Room {
  const s = useSessionStore.getState();
  return {
    ...base,
    status: s.status,
    players: s.players,
    agreedPlayers: s.agreedPlayers,
    config: {
      cardCountTarget: s.cardCountTarget,
      gameMode: s.gameMode,
      comfortFilters: s.comfortFilters,
      drinkRuleTemplate: s.drinkRuleTemplate,
      customDrinkRules: s.customDrinkRules,
      nonDrinkingMode: s.nonDrinkingMode,
    },
  };
}

const sameRoom = (a: Room, b: Room) =>
  JSON.stringify([a.status, a.players, a.agreedPlayers, a.config]) ===
  JSON.stringify([b.status, b.players, b.agreedPlayers, b.config]);

/**
 * Loads a room into the session store, keeps it in sync with the repository
 * (other tabs/devices) and writes local changes back. This is what the old game
 * page was missing (CLAUDE.md bug #1): the store was never hydrated.
 */
export function useRoom(code: string): { status: Status; room: Room | null } {
  const [status, setStatus] = useState<Status>('loading');
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    const initial = rooms.get(code);
    if (!initial) {
      setStatus('missing');
      return;
    }
    applyRoom(initial);
    setRoom(initial);
    setStatus('ready');

    const unsubRepo = rooms.subscribe(code, (next) => {
      if (!next) {
        setStatus('missing');
        return;
      }
      setRoom(next);
      applyRoom(next);
    });

    const unsubStore = useSessionStore.subscribe(() => {
      const stored = rooms.get(code);
      if (!stored) return;
      const local = roomFromStore(stored);
      if (!sameRoom(stored, local)) rooms.update(code, () => local);
    });

    return () => {
      unsubRepo();
      unsubStore();
    };
  }, [code]);

  return { status, room };
}
