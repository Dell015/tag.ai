'use client';
import { useAccountStore } from '@/stores/account-store';
import { signOutServer } from '@/lib/supabase/account';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Button, Chip, ConfirmSheet, ListRow, Plate, Screen, Section, SegmentedControl, Sheet, TextField, Toggle, toast } from '@/components/ui';
import { PRESET_TOPICS, normalizeTopic } from '@/lib/game/comfort-filters';
import { DRINK_RULE_TEMPLATES, MAX_CUSTOM_RULES } from '@/lib/game/setup-options';
import { useSettingsStore, type Language, type MotionPref, type PotStyle, type TextSize } from '@/stores/settings-store';
import { useProfileStore } from '@/stores/profile-store';
import { useGameStore } from '@/stores/game-store';
import { useWalletStore } from '@/stores/wallet-store';

const BUILD = 'a1';

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return <Section title={title} hint={hint}><Plate>{children}</Plate></Section>;
}

function Block({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="px-4 py-3.5">
      <p className="text-[1.05rem] font-bold leading-tight">{label}</p>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ToggleRow({ label, hint, k }: { label: string; hint?: string; k: 'vibration' | 'sounds' | 'keepAwake' | 'swipe' | 'confirmTrash' | 'showPips' | 'showRules' | 'leftHanded' | 'highContrast' | 'nonDrinkingDefault' | 'testPurchases' }) {
  const v = useSettingsStore((s) => s[k]);
  const set = useSettingsStore((s) => s.set);
  return <ListRow label={label} hint={hint} right={<Toggle checked={v} onChange={(x) => set(k, x)} label={label} />} />;
}

export default function SettingsPage() {
  const router = useRouter();
  const s = useSettingsStore();
  const signOut = useProfileStore((p) => p.signOut);
  const connected = useAccountStore((a) => a.status === 'signedIn');
  const trashedCount = useProfileStore((p) => p.trashedCardIds.length);
  const resetGame = useGameStore((g) => g.resetGame);
  const [word, setWord] = useState('');
  const [rule, setRule] = useState('');
  const [ask, setAsk] = useState<null | 'profile' | 'game' | 'all'>(null);
  const [taps, setTaps] = useState(0);
  const [sheet, setSheet] = useState<null | 'topics' | 'rules'>(null);

  const customTopics = s.skipTopics.filter((t) => !(PRESET_TOPICS as readonly string[]).includes(t) && t !== '18+ Cards');
  const toggleTopic = (t: string) => s.set('skipTopics', s.skipTopics.includes(t) ? s.skipTopics.filter((x) => x !== t) : [...s.skipTopics, t]);

  const exportData = () => {
    const p = useProfileStore.getState();
    const data = { exportedAt: new Date().toISOString(), profile: p.profile, savedCardIds: p.savedCardIds, trashedCardIds: p.trashedCardIds, settings: useSettingsStore.getState() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tagai-data.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Data exported', { tone: 'ok' });
  };

  const wipe = () => {
    try { Object.keys(window.localStorage).filter((k) => k.startsWith('tagai')).forEach((k) => window.localStorage.removeItem(k)); } catch { /* ignore */ }
    window.location.href = '/welcome';
  };

  const versionTap = () => {
    const n = taps + 1;
    setTaps(n);
    if (n === 5 && !s.hiddenUnlocked) { s.set('hiddenUnlocked', true); toast('Hidden options unlocked', { tone: 'ok' }); }
  };

  return (
    <Screen title="Settings" back="/me">
      <Group title="Game defaults">
        <ListRow label="Topics to skip" hint="Cards on these topics never show up." value={s.skipTopics.length ? `${s.skipTopics.length} skipped` : 'None'} onClick={() => setSheet('topics')} />
        <Block label="Default drink rules">
          <div className="flex flex-wrap gap-2">
            {DRINK_RULE_TEMPLATES.map((t) => <Chip key={t.id} selected={s.defaultDrinkRule === t.id} onClick={() => s.set('defaultDrinkRule', t.id)}>{t.name}</Chip>)}
          </div>
        </Block>
        <ToggleRow k="nonDrinkingDefault" label="Non-drinking by default" hint="Forfeits instead of drinks." />
        <ListRow label="My custom rules" hint={`Up to ${MAX_CUSTOM_RULES}. Added to every game you host.`} value={s.customRules.length} onClick={() => setSheet('rules')} />
        <Block label="Default pot style" hint="Who covers the coin pot.">
          <SegmentedControl<PotStyle> label="Pot style" value={s.potStyle} onChange={(v) => s.set('potStyle', v)} options={[{ id: 'solo', label: 'I pay it all' }, { id: 'split', label: 'Split' }, { id: 'chipin', label: 'Chip in' }]} />
        </Block>
      </Group>

      <Group title="Playing">
        <ToggleRow k="vibration" label="Vibration" hint="Android only. iPhones do not vibrate from web apps." />
        <ToggleRow k="sounds" label="Sounds" hint="Card sounds when you reveal, finish or skip a card." />
        {s.sounds && (
          <Block label="Volume">
            <input type="range" min={0} max={1} step={0.1} value={s.volume} onChange={(e) => s.set('volume', Number(e.target.value))} aria-label="Volume" className="h-tap w-full accent-[rgb(var(--accent))]" />
          </Block>
        )}
        <ToggleRow k="keepAwake" label="Keep screen awake" hint="The screen stays on during a game." />
        <ToggleRow k="swipe" label="Swipe gestures" hint="Off means buttons only." />
        <Block label="Undo time" hint="How long the Undo button stays on screen.">
          <SegmentedControl<'3' | '5' | '8'> label="Undo time" value={String(s.undoSeconds) as '3' | '5' | '8'} onChange={(v) => s.set('undoSeconds', Number(v) as 3 | 5 | 8)} options={[{ id: '3', label: '3 s' }, { id: '5', label: '5 s' }, { id: '8', label: '8 s' }]} />
        </Block>
        <ToggleRow k="confirmTrash" label="Confirm before trashing" hint="Undo already covers a mistake." />
        <ToggleRow k="showPips" label="Show intensity squares" />
        <ToggleRow k="showRules" label="Show rules line" hint="The drink rules under the heat bar." />
        <ToggleRow k="leftHanded" label="Left-handed layout" hint="Mirrors the order of the action buttons." />
      </Group>

      <Group title="Display and access">
        <Block label="Card text size">
          <SegmentedControl<TextSize> label="Card text size" value={s.textSize} onChange={(v) => s.set('textSize', v)} options={[{ id: 'normal', label: 'Normal' }, { id: 'large', label: 'Large' }, { id: 'xlarge', label: 'Extra large' }]} />
        </Block>
        <Block label="Motion">
          <SegmentedControl<MotionPref> label="Motion" value={s.motion} onChange={(v) => s.set('motion', v)} options={[{ id: 'system', label: 'System' }, { id: 'reduce', label: 'Reduced' }, { id: 'full', label: 'Full' }]} />
        </Block>
        <ToggleRow k="highContrast" label="High contrast" hint="Stronger borders and lighter secondary text." />
        <Block label="Language" hint="Interface labels. Card content is already in Taglish.">
          <SegmentedControl<Language> label="Language" value={s.language} onChange={(v) => { s.set('language', v); if (v !== 'en') toast('Only English is ready so far', {}); }} options={[{ id: 'en', label: 'English' }, { id: 'fil', label: 'Filipino' }, { id: 'taglish', label: 'Taglish' }]} />
        </Block>
      </Group>

      <Group title="Cards">
        <ListRow icon="trash" tone="orange" label="Trashed cards" hint="Cards you will not see again. Undo them here." value={trashedCount} href="/me/settings/trashed" />
      </Group>

      <Group title="Your data">
        <ListRow label="Export my data" hint="Downloads a JSON file." onClick={exportData} />
        <ListRow label="Clear game in progress" danger onClick={() => setAsk('game')} />
        <ListRow label={connected ? 'Sign out' : 'Reset profile'} danger onClick={() => setAsk('profile')} />
        <ListRow label="Clear all local data" danger onClick={() => setAsk('all')} />
        {s.hiddenUnlocked && <ToggleRow k="testPurchases" label="Test purchases" hint="Developer. Lets you add test coins in the Shop." />}
      </Group>

      <Group title="About">
        <ListRow label="Terms" href="/legal/terms" />
        <ListRow label="Privacy" href="/legal/privacy" />
        <ListRow label="Send feedback" hint="Opens your mail app." onClick={() => { window.location.href = 'mailto:hello@tag.ai?subject=tag.ai%20feedback'; }} />
        <ListRow label="Version" value={`0.1 (${BUILD})`} onClick={versionTap} />
      </Group>


      <Sheet open={sheet === 'topics'} onClose={() => setSheet(null)} title="Topics to skip">
        <p className="-mt-3 mb-4 text-base text-muted">Cards on these topics never show up.</p>
        <div className="flex flex-wrap gap-2">
            {PRESET_TOPICS.map((t) => <Chip key={t} selected={s.skipTopics.includes(t)} onClick={() => toggleTopic(t)}>{t}</Chip>)}
            {customTopics.map((t) => <Chip key={t} selected onClick={() => toggleTopic(t)}>{t}</Chip>)}
          </div>
          <form className="mt-3 flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); const w = normalizeTopic(word); if (w && !s.skipTopics.includes(w)) s.set('skipTopics', [...s.skipTopics, w]); setWord(''); }}>
            <div className="min-w-0 flex-1"><TextField label="Add a word" value={word} maxLength={20} onChange={(e) => setWord(e.target.value)} /></div>
            <Button type="submit" variant="secondary" disabled={!word.trim()}>Add</Button>
          </form>
      </Sheet>
      <Sheet open={sheet === 'rules'} onClose={() => setSheet(null)} title="My custom rules">
        <p className="-mt-3 mb-3 text-base text-muted">{`Up to ${MAX_CUSTOM_RULES}. They are added to every game you host.`}</p>
        <ul>
            {s.customRules.map((r) => (
              <li key={r} className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-lg">{r}</span>
                <button onClick={() => s.removeRule(r)} className="h-tap px-2 text-base font-extrabold text-danger">Remove</button>
              </li>
            ))}
          </ul>
          {s.customRules.length < MAX_CUSTOM_RULES && (
            <form className="mt-2 flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (s.addRule(rule)) setRule(''); }}>
              <div className="min-w-0 flex-1"><TextField label="New rule" value={rule} maxLength={60} onChange={(e) => setRule(e.target.value)} /></div>
              <Button type="submit" variant="secondary" disabled={!rule.trim()}>Add</Button>
            </form>
          )}
      </Sheet>

      <ConfirmSheet open={ask === 'game'} title="Clear the game in progress?" body="The current game on this phone ends and cannot be resumed." confirmLabel="Clear game" danger onConfirm={() => { const left = useGameStore.getState().settlePot(); if (left > 0) useWalletStore.getState().apply('refund', left, 'Unused pot returned'); resetGame(); toast('Game cleared', {}); }} onClose={() => setAsk(null)} />
      <ConfirmSheet open={ask === 'profile'} title={connected ? 'Sign out?' : 'Reset your profile?'} body={connected ? 'Your coins and saved cards stay in your account. Sign in again with your email to get them back.' : 'Your name, coins, saved and trashed cards on this phone are removed.'} confirmLabel={connected ? 'Sign out' : 'Reset profile'} danger onConfirm={() => { if (connected) { void signOutServer().then(() => router.replace('/welcome')); return; } useWalletStore.getState().clear(); signOut(); router.replace('/welcome'); }} onClose={() => setAsk(null)} />
      <ConfirmSheet open={ask === 'all'} title="Clear all local data?" body="Everything tag.ai stored on this phone is erased, including settings." confirmLabel="Clear everything" danger onConfirm={wipe} onClose={() => setAsk(null)} />
    </Screen>
  );
}
