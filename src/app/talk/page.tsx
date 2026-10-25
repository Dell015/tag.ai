'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { haptic } from '@/lib/haptics';
import { useRouter } from 'next/navigation';
import { Button, Chip, Icon, NumberStepper, RollNumber, Screen, Splash } from '@/components/ui';
import { useRequireProfile } from '@/lib/use-profile';
import { useSettingsStore } from '@/stores/settings-store';
import { useWalletStore } from '@/stores/wallet-store';
import { useTalkStore } from '@/stores/talk-store';
import { TALK_GROUPS, type TalkGroupId } from '@/lib/data/talk-topics';
import { PRESET_TOPICS } from '@/lib/game/comfort-filters';
import { MAX_NAME, MAX_PLAYERS, TALK_MAX, TALK_MIN, TALK_PRICE, TALK_STEP, buildTalkQueue, cleanNames, talkCost, talkPool } from '@/lib/game/talk';
import { formatPot, formatPrice } from '@/lib/game/pot';

export default function TalkSetupPage() {
  const router = useRouter();
  const { ready, profile } = useRequireProfile('/talk');
  const defaults = useSettingsStore((s) => s.skipTopics);
  const active = useTalkStore((s) => s.active);
  const roster = useTalkStore((s) => s.roster ?? []);
  const [names, setNames] = useState<string[] | null>(null);
  const [who, setWho] = useState('');
  const [groups, setGroups] = useState<TalkGroupId[]>(TALK_GROUPS.map((g) => g.id));
  const [skip, setSkip] = useState<string[] | null>(null);
  const [word, setWord] = useState('');
  const [count, setCount] = useState(20);

  const players = names ?? (roster.length ? roster : profile ? [profile.username] : []);
  const addPlayer = () => { setNames(cleanNames([...players, who])); setWho(''); };
  const filters = skip ?? defaults.filter((t) => t !== '18+ Cards');
  const pool = useMemo(() => talkPool(groups, filters), [groups, filters]);
  const perGroup = useMemo(() => Object.fromEntries(TALK_GROUPS.map((g) => [g.id, talkPool([g.id], filters).length])), [filters]);
  if (!ready || !profile) return <Splash />;

  const max = Math.min(TALK_MAX, pool.length);
  const n = Math.min(count, max);
  const total = talkCost(n);
  const enough = profile.coins + 1e-9 >= total;
  const custom = filters.filter((f) => !(PRESET_TOPICS as readonly string[]).includes(f));
  const toggleGroup = (id: TalkGroupId) => setGroups(groups.includes(id) ? groups.filter((g) => g !== id) : [...groups, id]);
  const toggleFilter = (t: string) => setSkip(filters.includes(t) ? filters.filter((x) => x !== t) : [...filters, t]);
  const addWord = () => { const w = word.trim(); if (w && !filters.includes(w)) setSkip([...filters, w]); setWord(''); };

  const start = () => {
    const queue = buildTalkQueue(n, groups, filters);
    if (queue.length === 0 || !useWalletStore.getState().apply('pot', -talkCost(queue.length), 'Topic deck')) return;
    useTalkStore.getState().start(queue, players.length >= 2 ? cleanNames(players) : []);
    router.push('/talk/play');
  };

  const blocked = groups.length === 0 ? 'Pick at least one group' : pool.length < TALK_MIN ? 'Too few topics, change the groups' : !enough ? 'Not enough coins' : null;
  const input = 'h-tap min-w-0 flex-1 rounded-xl border-2 border-line bg-transparent px-4 text-lg placeholder:text-muted/60 focus:border-accent';

  return (
    <Screen mode="family" back="/" title="Topic deck"
      footer={<Button size="lg" full disabled={blocked !== null} onClick={start}>{blocked ?? `Start, ${formatPot(total)} coins`}</Button>}>
      {active && <Link href="/talk/play" className="mb-5 block"><Button full variant="secondary">Resume your topics</Button></Link>}
      <p className="-mt-1 mb-6 text-lg text-muted">Things to talk about. No turns, no shots, no pot. Tap for the next topic and go back whenever you like.</p>

      <div className="trim mb-4 h-3 rounded-full" aria-hidden />
      <h2 className="sign text-3xl">Who is playing</h2>
      <p className="mb-3 mt-1 text-base text-muted">Optional. With two or more names the app says who goes first, records everyone&apos;s answer and shows who was on the other side most often.</p>
      <div className="flex flex-wrap gap-2">
        {players.map((n, i) => <Chip key={n} selected data-group={TALK_GROUPS[i % TALK_GROUPS.length].id} className="sign inline-flex items-center gap-2 !text-base" onClick={() => setNames(players.filter((x) => x !== n))}>{n}<Icon name="close" size={16} /></Chip>)}
      </div>
      {players.length < MAX_PLAYERS && (
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); addPlayer(); }}>
          <input value={who} onChange={(e) => setWho(e.target.value)} maxLength={MAX_NAME} placeholder="Add a name" aria-label="Player name" className={input} />
          <Button type="submit" variant="secondary" disabled={!who.trim()}>Add</Button>
        </form>
      )}

      <h2 className="sign mt-8 text-3xl">What to talk about</h2>
      <p className="mb-3 mt-1 text-base text-muted">Tap to leave a group out.</p>
      <div className="grid grid-cols-2 gap-3">
        {TALK_GROUPS.map((g) => {
          const on = groups.includes(g.id);
          return (
            <button key={g.id} data-group={g.id} aria-pressed={on} onClick={() => { haptic('tap'); toggleGroup(g.id); }}
              className={`relative flex min-h-[7rem] flex-col justify-between overflow-hidden rounded-2xl border-2 p-3 text-left transition-[transform,opacity] active:scale-95 ${on ? 'border-accent bg-accent text-onaccent' : 'border-accent/50 bg-transparent text-text opacity-60'}`}>
              <span><span className="sign block text-lg leading-tight">{g.label}</span><span className="mt-1 block text-sm font-semibold leading-snug opacity-80">{g.hint}</span></span>
              <span className="mt-2 flex items-center justify-between text-sm font-extrabold">
                <span>{perGroup[g.id]} topics</span>
                <span aria-hidden className={`grid h-6 w-6 place-items-center rounded-full border-2 ${on ? 'border-current' : 'border-accent/60'}`}>{on ? <Icon name="check" size={14} /> : null}</span>
              </span>
            </button>
          );
        })}
      </div>

      <h2 className="sign mt-8 text-3xl">How many topics</h2>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-base font-bold">{formatPrice(TALK_PRICE)} coins a topic<span className="block font-semibold text-muted">{pool.length} in the deck</span></p>
        <NumberStepper label="topics" value={n} min={Math.min(TALK_MIN, max)} max={max} step={TALK_STEP} onChange={setCount} />
      </div>

      <h2 className="sign mt-8 text-3xl">Skip these topics</h2>
      <p className="mb-3 mt-1 text-base text-muted">Topics about these are left out. Nobody has to explain why.</p>
      <div className="flex flex-wrap gap-2">
        {PRESET_TOPICS.map((t) => <Chip key={t} selected={filters.includes(t)} onClick={() => toggleFilter(t)}>{t}</Chip>)}
        {custom.map((w) => <Chip key={w} selected onClick={() => toggleFilter(w)}>{w}<Icon name="close" size={16} /></Chip>)}
      </div>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); addWord(); }}>
        <input value={word} onChange={(e) => setWord(e.target.value)} maxLength={24} placeholder="Add a word, like ex" aria-label="Custom word" className={input} />
        <Button type="submit" variant="secondary" disabled={!word.trim()}>Add</Button>
      </form>

      <p className="mt-6 border-t-2 border-line pt-4 text-2xl font-extrabold">{n} topics for <RollNumber value={total} format={formatPot} /> coins.</p>
      <p className="mt-2 text-lg">You have <b>{formatPot(profile.coins)} coins</b>. Topics you do not get to come back to you.</p>
      {!enough && <p className="mt-2 text-lg font-bold text-danger">You are {formatPot(total - profile.coins)} coins short. <Link href="/shop" className="underline">Add coins</Link></p>}
    </Screen>
  );
}
