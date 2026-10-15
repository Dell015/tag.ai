'use client';
import { useState } from 'react';
import { Badge, Screen, SegmentedControl } from '@/components/ui';

type Range = 'week' | 'all';
const BOARDS: { title: string; rows: [string, number][] }[] = [
  { title: 'Most copied card', rows: [['Jollibee is better than McDo. Fight me.', 412], ['Who here talks the most when drunk?', 377], ['Dance for 10 seconds without music.', 301], ['Would you ghost someone for a free meal?', 266], ['Adobo needs soy sauce. No exceptions.', 240]] },
  { title: 'Top deck creators', rows: [['spicygal', 610], ['titacora', 520], ['lovebirds_ph', 410], ['kuyamigs', 340], ['chaoskid', 270]] },
  { title: 'Most played card', rows: [['What is the pettiest reason you broke up?', 1280], ['Roast the person on your left.', 1104], ['Who is most likely to cry at karaoke?', 990], ['Name your worst ex in three words.', 871], ['Call your last text and say hi.', 760]] },
  { title: 'Top hosts', rows: [['chaoskid', 88], ['kuyamigs', 71], ['hr_hindi_nakatingin', 64], ['byahero', 52], ['millennial_mom', 47]] },
];

export default function LeaderboardPage() {
  const [range, setRange] = useState<Range>('week');
  const k = range === 'week' ? 1 : 3.4;
  return (
    <Screen title="Leaderboard" back="/me">
      <p className="mb-3 flex items-center gap-2 text-base text-muted"><Badge tone="line">Sample data</Badge> Real rankings arrive with accounts.</p>
      <SegmentedControl<Range> label="Time range" value={range} onChange={setRange} options={[{ id: 'week', label: 'This week' }, { id: 'all', label: 'All time' }]} />
      {BOARDS.map((b) => (
        <section key={b.title} className="mt-8">
          <h2 className="mb-1 text-3xl">{b.title}</h2>
          <ol>
            {b.rows.map(([name, n], i) => (
              <li key={name} className="flex items-center gap-3 border-b-2 border-line/60 py-3">
                <span className="display w-8 text-3xl text-muted">{i + 1}</span>
                <span className="min-w-0 flex-1 text-lg font-bold leading-snug">{name}</span>
                <span className="shrink-0 text-lg font-extrabold tabular-nums">{Math.round(n * k)}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </Screen>
  );
}
