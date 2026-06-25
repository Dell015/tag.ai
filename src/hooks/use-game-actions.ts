'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/stores/game-store';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SyncQueueItem {
  id: string;
  type: 'trash' | 'heart';
  cardId: string;
  userId: string;
  retryCount: number;
  createdAt: number;
}

const STORAGE_KEY = 'tag_ai_pending_syncs';
const MAX_RETRIES = 3;

// ─── Sync Queue Helpers ──────────────────────────────────────────────────────

function loadPersistedQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as SyncQueueItem[];
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

function persistQueue(queue: SyncQueueItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    if (queue.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    }
  } catch {
    // Ignore storage errors
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Provides card interaction handlers that update Zustand
 * and fire-and-forget sync to Supabase.
 *
 * Key behaviors:
 * - flipCard: just calls game store's flipCard
 * - dismissCard: calls game store's dismissCard
 * - trashCard: calls game store's trashCard + queues Supabase insert to user_trashed_cards
 * - heartCard: calls game store's heartCard + queues Supabase insert to saved_cards
 * - Maintains a retry queue in memory. If a Supabase call fails, add to queue with retry count
 * - Detect online/offline via navigator.onLine and online/offline events
 * - When offline: queue all syncs, show isOnline: false
 * - When back online: flush queue in order (max 3 retries per item)
 * - If all retries fail for session end: persist to localStorage
 */
export function useGameActions(): {
  flipCard: () => void;
  dismissCard: (direction: 'left' | 'right') => void;
  trashCard: (cardId: string, userId: string) => void;
  heartCard: (cardId: string, userId: string) => void;
  isOnline: boolean;
} {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const queueRef = useRef<SyncQueueItem[]>(loadPersistedQueue());
  const flushingRef = useRef(false);

  // ─── Online/Offline Detection ────────────────────────────────────────────

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Flush any persisted items on mount (e.g., from a previous session)
    if (navigator.onLine && queueRef.current.length > 0) {
      flushQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Sync Execution ──────────────────────────────────────────────────────

  const executeSyncItem = useCallback(async (item: SyncQueueItem): Promise<boolean> => {
    try {
      const supabase = createClient();

      if (item.type === 'trash') {
        const { error } = await supabase
          .from('user_trashed_cards')
          .upsert(
            { user_id: item.userId, card_id: item.cardId },
            { onConflict: 'user_id,card_id' }
          );
        return !error;
      } else if (item.type === 'heart') {
        const { error } = await supabase
          .from('saved_cards')
          .upsert(
            { user_id: item.userId, card_id: item.cardId },
            { onConflict: 'user_id,card_id' }
          );
        return !error;
      }

      return false;
    } catch {
      return false;
    }
  }, []);

  // ─── Queue Flush ─────────────────────────────────────────────────────────

  const flushQueue = useCallback(async () => {
    if (flushingRef.current) return;
    if (queueRef.current.length === 0) return;

    flushingRef.current = true;

    const failedItems: SyncQueueItem[] = [];

    // Process items in order
    while (queueRef.current.length > 0) {
      const item = queueRef.current.shift()!;
      const success = await executeSyncItem(item);

      if (!success) {
        const updatedItem = { ...item, retryCount: item.retryCount + 1 };

        if (updatedItem.retryCount >= MAX_RETRIES) {
          // Max retries exhausted — persist to localStorage for next app open
          failedItems.push(updatedItem);
        } else {
          // Put back in queue for another attempt
          queueRef.current.push(updatedItem);
        }
      }
    }

    // Persist items that failed all retries
    if (failedItems.length > 0) {
      queueRef.current = failedItems;
      persistQueue(failedItems);
    } else {
      persistQueue([]);
    }

    flushingRef.current = false;
  }, [executeSyncItem]);

  // ─── Enqueue Sync ────────────────────────────────────────────────────────

  const enqueueSync = useCallback((type: 'trash' | 'heart', cardId: string, userId: string) => {
    const item: SyncQueueItem = {
      id: generateId(),
      type,
      cardId,
      userId,
      retryCount: 0,
      createdAt: Date.now(),
    };

    queueRef.current.push(item);

    if (isOnline) {
      // Fire-and-forget: attempt to sync immediately
      flushQueue();
    } else {
      // Offline: persist queue for later
      persistQueue(queueRef.current);
    }
  }, [isOnline, flushQueue]);

  // ─── Game Action Handlers ────────────────────────────────────────────────

  const flipCard = useCallback(() => {
    useGameStore.getState().flipCard();
  }, []);

  const dismissCard = useCallback((_direction?: 'left' | 'right') => {
    void _direction; // direction may be used for future animations
    useGameStore.getState().dismissCard();
  }, []);

  const trashCard = useCallback((cardId: string, userId: string) => {
    // Update local Zustand state immediately
    useGameStore.getState().trashCard();
    // Queue Supabase sync (fire-and-forget)
    enqueueSync('trash', cardId, userId);
  }, [enqueueSync]);

  const heartCard = useCallback((cardId: string, userId: string) => {
    // Update local Zustand state immediately
    useGameStore.getState().heartCard();
    // Queue Supabase sync (fire-and-forget)
    enqueueSync('heart', cardId, userId);
  }, [enqueueSync]);

  return {
    flipCard,
    dismissCard,
    trashCard,
    heartCard,
    isOnline,
  };
}
