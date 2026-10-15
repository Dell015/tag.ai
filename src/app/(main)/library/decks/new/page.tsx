'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Splash } from '@/components/ui';
import { useDeckStore } from '@/stores/deck-store';

/** Creates an empty deck and opens the editor. */
export default function NewDeckPage() {
  const router = useRouter();
  const create = useDeckStore((s) => s.create);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const d = create();
    router.replace(`/library/decks/${d.id}/edit`);
  }, [create, router]);
  return <Splash />;
}
