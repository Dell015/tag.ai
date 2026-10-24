'use client';
import Link from 'next/link';
import { Button, EmptyState, Screen, Spot } from '@/components/ui';

export default function CardsPage() {
  return (
    <Screen title="Cards">
      <EmptyState art={<Spot name="bubble" />} title="The feed is coming."
        body="Soon you can post truths, dares and what ifs here, cheer the good ones, and the top cards each month become a stack in the shop."
        action={<Link href="/me/suggest" className="block"><Button size="lg" full variant="secondary">Try the sample card board</Button></Link>} />
    </Screen>
  );
}
