'use client';
import { useRouter } from 'next/navigation';
import { Badge, Screen } from '@/components/ui';

export default function Page() {
  const router = useRouter();
  return (
    <Screen title="Terms of use" onBack={() => router.back()}>
      <Badge tone="line">Draft</Badge>
      <p className="mt-4 text-lg text-muted">This is placeholder text while the app is being built. It is not legal advice and will be replaced before launch.</p>
      <h2 className="mb-1 mt-8 text-3xl">Who can play</h2>
      <p className="text-lg text-muted">tag.ai is for people aged 18 and over. You are responsible for how much you drink and for getting home safely.</p>
      <h2 className="mb-1 mt-8 text-3xl">Your content</h2>
      <p className="text-lg text-muted">Cards you write stay yours. Do not post anything unlawful or hateful. We may remove decks that break these rules.</p>
      <h2 className="mb-1 mt-8 text-3xl">Coins</h2>
      <p className="text-lg text-muted">Coins pay for cards and shop items. They have no cash value and cannot be exchanged for money.</p>
    </Screen>
  );
}
