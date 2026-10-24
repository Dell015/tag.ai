'use client';
import { fillDrink } from '@/lib/game/card-kinds';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, Badge, Button, CoinAmount, CoinStack, PAINT, Screen, SegmentedControl, Sheet, toast } from '@/components/ui';
import { COIN_PACKAGES, PACK_CARDS, SHOP_ITEMS, packCardCount, packPreview, type CoinPackage, type ShopItem } from '@/lib/data/shop-catalogue';
import { cardBack } from '@/lib/card-back';
import { formatPot } from '@/lib/game/pot';
import { useProfileStore } from '@/stores/profile-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useAdultOn } from '@/lib/adult';
import { useShopStore } from '@/stores/shop-store';
import { cn } from '@/lib/cn';

type Seg = 'coins' | 'packs' | 'style';
const SEGS: { id: Seg; label: string }[] = [{ id: 'coins', label: 'Coins' }, { id: 'packs', label: 'Packs' }, { id: 'style', label: 'Style' }];

function Preview({ item }: { item: ShopItem }) {
  const box = 'flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl';
  if (item.kind === 'frame') return <span className={box}><Avatar value="c0" name="A" size={40} frame={item.value} /></span>;
  if (item.kind === 'back') return <span className={cn(box, 'border-2 border-line')} style={cardBack(item.value).style} />;
  if (item.kind === 'theme') return <span className={box} style={{ background: `rgb(${item.value})` }} />;
  if (item.kind === 'pack') {
    const tones = Object.values(PAINT); const c = tones[Math.abs(item.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0)) % tones.length];
    return <span className={cn(box, 'rotate-[-4deg] border-[3px] border-[#181310] text-[#181310]')} style={{ background: c }}><span className="display text-3xl">{packCardCount(item.id)}</span></span>;
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
    <Screen title="Shop">
      <div className="sticky top-0 z-10 -mx-4 mb-4 border-b-2 border-line bg-bg px-4 pb-3 pt-1">
        <p className="text-lg">You have <b><CoinAmount value={Number(formatPot(coins))} /></b></p>
        <div className="mt-3"><SegmentedControl<Seg> label="Shop sections" options={SEGS} value={seg} onChange={setSeg} /></div>
      </div>

      {seg === 'coins' && (
        <ul>
          {COIN_PACKAGES.map((p, idx) => (
            <li key={p.id} className="flex items-center gap-4 border-b-2 border-line/60 py-4">
              <CoinStack count={idx + 2} size={48} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-extrabold leading-tight">{p.name}</p>
                {p.badge && <Badge>{p.badge}</Badge>}
                <p className="text-lg text-muted">{p.coins} coins{p.bonus ? `, includes ${p.bonus} bonus` : ''}</p>
              </div>
              <Button onClick={() => setPkg(p)}>P{p.price}</Button>
            </li>
          ))}
        </ul>
      )}

      {seg !== 'coins' && (
        <ul>
          {items.map((i) => {
            const have = owned(i);
            const short = !have && coins < i.price;
            return (
              <li key={i.id} className="flex items-center gap-4 border-b-2 border-line/60 py-4">
                <Preview item={i} />
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-extrabold">{i.name}</p>
                  <p className="text-base leading-snug text-muted">{i.description}{i.kind === 'pack' && ` ${packCardCount(i.id)} cards.`}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {have ? (
                    i.kind === 'pack' ? <Badge tone="ok">Owned</Badge>
                    : <Button variant={equippedNow(i) ? 'primary' : 'secondary'} onClick={() => (equippedNow(i) ? shop.unequip(i.kind as 'frame' | 'back' | 'theme') : shop.equip(i.id))}>{equippedNow(i) ? 'Equipped' : 'Equip'}</Button>
                  ) : (
                    <Button variant="secondary" onClick={() => setItem(i)}>{i.price} coins</Button>
                  )}
                  {short && <span className="text-sm font-bold text-muted">Need {formatPot(i.price - coins)} more</span>}
                </div>
              </li>
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
