'use client';
import { Button } from '@/components/ui';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col justify-center px-5">
      <h1 className="text-[5rem] leading-[0.9]">Something broke.</h1>
      <p className="mt-4 text-lg text-muted">Your game is saved on this phone. Try again, and if it keeps happening, go back home and resume.</p>
      <div className="mt-8 space-y-3">
        <Button size="lg" full onClick={reset}>Try again</Button>
        <a href="/" className="block"><Button size="lg" variant="secondary" full>Back home</Button></a>
      </div>
    </div>
  );
}
