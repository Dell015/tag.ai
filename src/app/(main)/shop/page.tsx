'use client';
import { fillDrink } from '@/lib/game/card-kinds';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Avatar, Badge, Button, CoinCount, CoinStack, PAINT, Screen, SegmentedControl, Sheet, toast } from '@/components/ui';
import { COIN_PACKAGES, PACK_CARDS, SHOP_ITEMS, packCardCount, packPreview, type CoinPackage, type ShopItem } from '@/lib/data/shop-catalogue';
import { cardBack } from '@/lib/card-back';
import { formatPot } from '@/lib/game/pot';
import { useProfileStore } from '@/stores/profile-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useAdultOn } from '@/lib/adult';
import { useShopStore } from '@/stores/shop-store';

type Seg = 'coins' | 'packs' | 'style';
const SEGS: { id: Seg; label: string }[] = [{ id: 'coins', label: 'Coins' }, { id: 'packs', label: 'Packs' }, { id: 'style', label: 'Style' }];

function Preview({ item }: { item: ShopItem }) {
  const box = 'flex h-24 w-full items-center justify-center overflow-hidden rounded-xl bg-raised';
  if (item.kind === 'frame') return <span className={box}><Avatar value="c0" name="A" size={56} frame={item.value} /></span>;
  if (item.kind === 'back') return <span className={box}><span className="block h-[4.5rem] w-14 rotate-[-5deg] rounded-lg border-2 border-black/50" style={cardBack(item.value).style} /></span>;
  if (item.kind === 'theme') return <span className={box} style={{ background: `rgb(${item.value})` }} />;
  if (item.kind === 'pack') {
    const tones = Object.values(PAINT); const c = tones[Math.abs(item.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0)) % tones.length];
    return <span className={box}><span className="flex h-[4.5rem] w-14 rotate-[-5deg] items-center justify-center rounded-lg border-[3px] border-[#181310] text-[#181310]" style={{ background: c }}><span className="display text-3xl">{packCardCount(item.id)}</span></span></span>;
  }
  return null;
}

function ShopInner() {
  const params = useSearchParams();
  const initial = (SEGS.find((s) => s.id === params.get('tab'))?.id ?? 'coins') as Seg;
  const [seg, setSeg] = useState<Seg>(initial);
  const [item, setItem] = useState<ShopItem | null>(null);
  const [pkg, setPkg] = useState<CoinPackage | null>(null);
  const coins = useProfileStore((s) => s.profile?.coins ?? 0);
  const shop = useShopStore();
  const test = useSettingsStore((s) => s.testPurchases);

  const adultOn = useAdultOn();
  const items = SHOP_ITEMS.filter((i) => (!i.adult || adultOn) && (seg === 'packs' ? i.kind === 'pack' : seg === 'style' ? ['frame', 'back', 'theme'].includes(i.kind) : false));
  const owned = (i: ShopItem) => shop.owned.includes(i.id);
  const equippedNow = (i: ShopItem) => shop.equipped[i.kind as 'frame' | 'back' | 'theme'] === i.id;
  const confirm = () => {
    if (!item) return;
    const r = shop.buy(item.id);
    if (r === 'ok') toast(`${item.name} is yours`, { tone: 'ok' });
    else if (r === 'short') toast('Not enough coins', {});
    setItem(null);
  };

  return (
    <Screen title="Shop" wide action={<span className="shrink-0 rounded-lg border-2 border-line px-3 py-1.5 text-base font-extrabold"><CoinCount value={Number(formatPot(coins))} /></span>}>
      <div className="mb-5 mt-1 max-w-md"><SegmentedControl<Seg> label="Shop sections" options={SEGS} value={seg} onChange={setSeg} /></div>

      {seg === 'coins' && (
        <>
          <p className="mb-3 text-base text-muted">Coins pay for the cards in a game. Wild cards are free. Pay with GCash, Maya or card.</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
            {COIN_PACKAGES.map((p, idx) => (
              <motion.li key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28, delay: idx * 0.05 }}
                className="relative flex flex-col rounded-2xl border-2 border-b-4 border-line/60 bg-panel p-3.5">
                {p.badge && <span className="absolute right-3 top-3"><Badge>{p.badge}</Badge></span>}
                <CoinStack count={idx + 2} size={56} />
                <p className="display mt-2 text-[2.2rem] leading-none tabular-nums">{p.coins}</p>
                <p className="text-sm font-bold text-muted">{p.bonus ? `coins, ${p.bonus} bonus` : 'coins'}</p>
                <Button className="mt-3 w-full px-3" onClick={() => setPkg(p)}>P{p.price}</Button>
              </motion.li>
            ))}
          </ul>
        </>
      )}

      {seg !== 'coins' && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {items.map((i, idx) => {
            const have = owned(i);
            const short = !have && coins < i.price;
            return (
              <motion.li key={i.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28, delay: Math.min(idx, 8) * 0.04 }}
                className="flex flex-col rounded-2xl border-2 border-b-4 border-line/60 bg-panel p-2.5">
                <Preview item={i} />
                <p className="mt-2.5 px-1 text-lg font-extrabold leading-tight">{i.name}</p>
                <p className="mt-0.5 flex-1 px-1 text-sm leading-snug text-muted">{i.description}{i.kind === 'pack' && ` ${packCardCount(i.id)} cards.`}</p>
                <div className="mt-3">
                  {have ? (
                    i.kind === 'pack' ? <p className="flex h-tap items-center justify-center rounded-xl bg-ok/15 text-base font-extrabold text-ok">Owned</p>
                    : <Button full variant={equippedNow(i) ? 'primary' : 'secondary'} className="px-3" onClick={() => (equippedNow(i) ? shop.unequip(i.kind as 'frame' | 'back' | 'theme') : shop.equip(i.id))}>{equippedNow(i) ? 'Equipped' : 'Equip'}</Button>
                  ) : (
                    <Button full variant="secondary" className="px-3" onClick={() => setItem(i)}>{i.price} coins</Button>
                  )}
                  {short && <p className="mt-1.5 text-center text-xs font-bold text-muted">Need {formatPot(i.price - coins)} more</p>}
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}

      <Sheet open={!!item} onClose={() => setItem(null)} title={item ? `Buy ${item.name}?` : undefined}>
        {item && (
          <>
            <p className="-mt-2 text-lg text-muted">{item.description}</p>
            {item.kind === 'pack' && (
              <div className="mt-4 space-y-2">
                <p className="text-base font-bold text-muted">A taste of what is inside</p>
                {packPreview(item.id).map((c) => <p key={c.id} className="rounded-xl border-2 border-line p-3 text-lg">{fillDrink(c.text, false)}</p>)}
                <p className="text-sm text-muted">Sample set: {PACK_CARDS[item.id]?.length} cards so far. More are added over time.</p>
              </div>
            )}
            <p className="mt-5 text-xl">{item.price} coins. You will have <b>{formatPot(coins - item.price)}</b> left.</p>
            <div className="mt-5 space-y-3 pb-2">
              {coins >= item.price ? (
                <Button size="lg" full onClick={confirm}>Buy for {item.price} coins</Button>
              ) : (
                <Button size="lg" full onClick={() => { setItem(null); setSeg('coins'); }}>Need {formatPot(item.price - coins)} more coins</Button>
              )}
              <Button full variant="secondary" onClick={() => setItem(null)}>Not now</Button>
            </div>
          </>
        )}
      </Sheet>

      <Sheet open={!!pkg} onClose={() => setPkg(null)} title={pkg ? `${pkg.name}, P${pkg.price}` : undefined}>
        {pkg && (
          <>
            <p className="-mt-2 text-lg text-muted">{pkg.coins} coins{pkg.bonus ? `, with ${pkg.bonus} bonus` : ''}. Pay with GCash, Maya or card.</p>
            <div className="mt-6 space-y-3 pb-2">
              {test ? (
                <Button size="lg" full onClick={() => { shop.testBuyCoins(pkg.id); toast(`Added ${pkg.coins} test coins`, { tone: 'ok' }); setPkg(null); }}>Add {pkg.coins} test coins</Button>
              ) : (
                <Button size="lg" full disabled>Payments open soon</Button>
              )}
              <Button full variant="secondary" onClick={() => setPkg(null)}>Close</Button>
            </div>
          </>
        )}
      </Sheet>
    </Screen>
  );
}

export default function ShopPage() {
  return <Suspense><ShopInner /></Suspense>;
}
