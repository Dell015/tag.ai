'use client';
import { useRouter } from 'next/navigation';
import { Badge, Screen } from '@/components/ui';

export default function Page() {
  const router = useRouter();
  return (
    <Screen title="Privacy" onBack={() => router.back()}>
      <Badge tone="line">Draft</Badge>
      <p className="mt-4 text-lg text-muted">This is placeholder text while the app is being built. It is not legal advice and will be replaced before launch.</p>
      <h2 className="mb-1 mt-8 text-3xl">What we keep</h2>
      <p className="text-lg text-muted">Right now everything stays on your phone: your nickname, coins, saved cards and decks.</p>
      <h2 className="mb-1 mt-8 text-3xl">Accounts later</h2>
      <p className="text-lg text-muted">When accounts arrive, we will store your nickname, email and the decks you choose to share. We will say so here before that happens.</p>
      <h2 className="mb-1 mt-8 text-3xl">Deleting your data</h2>
      <p className="text-lg text-muted">Use Settings, Clear all local data, to remove everything from this phone.</p>
    </Screen>
  );
}
