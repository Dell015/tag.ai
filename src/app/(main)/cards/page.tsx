'use client';
import Link from 'next/link';
import { Button, Screen } from '@/components/ui';

const SAMPLE = [
  { kind: 'truth', label: 'Truth', text: 'Who here would you trust with your phone unlocked?', r: -9, x: -34, y: 14 },
  { kind: 'dare', label: 'Dare', text: 'Let the group send one text from your phone.', r: 7, x: 30, y: 6 },
  { kind: 'vote', label: 'Vote', text: 'Who is most likely to cry at a wedding?', r: -1, x: 0, y: 0 },
];

export default function CardsPage() {
  return (
    <Screen title="Cards">
      <div aria-hidden className="relative mx-auto mt-4 h-60 max-w-xs">
        {SAMPLE.map((c) => (
          <div key={c.kind} data-kind={c.kind} className="absolute inset-x-10 top-0 flex h-52 flex-col justify-between rounded-2xl border-[3px] border-[#181310] bg-accent p-4 text-onaccent"
            style={{ transform: `translate(${c.x}px, ${c.y}px) rotate(${c.r}deg)` }}>
            <span className="sign text-sm">{c.label}</span>
            <span className="display text-[1.7rem] leading-[1.05]">{c.text}</span>
          </div>
        ))}
      </div>
      <h2 className="mt-4 text-[2.4rem] leading-[0.95]">Cards from everyone, coming soon.</h2>
      <p className="mt-3 text-base text-muted">Post truths, dares and what ifs, cheer the good ones, and the top cards each month become a stack in the shop.</p>
      <Link href="/me/suggest" className="mt-6 block"><Button size="lg" full>Suggest a card</Button></Link>
    </Screen>
  );
}
