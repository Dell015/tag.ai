'use client';
import { useEffect, useState } from 'react';
import { Button, SegmentedControl, Sheet, toast } from '@/components/ui';
import { PAY, PAY_METHODS, PAY_WAIT_MINUTES, type PayMethod } from '@/lib/pay-config';
import { receiptJpeg } from '@/lib/avatar-photo';
import { useAccountStore } from '@/stores/account-store';
import { cancelPaymentRequest, createPaymentRequest, myPaymentRequests, uploadReceipt, type PaymentRequest } from '@/lib/supabase/account';
import type { CoinPackage } from '@/lib/data/shop-catalogue';

/** The QR cut out of the screenshot and zoomed to fill its box. Tap it to see it bigger. */
function QrPicture({ method, php, onError }: { method: PayMethod; php: number; onError: () => void }) {
  const { crop: c, image, label } = PAY[method];
  return (
    <span className="relative block aspect-square w-full overflow-hidden rounded-xl border-2 border-line bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image(php)} alt={`${label} QR code for P${php}`} onError={onError} draggable={false}
        className="absolute max-w-none" style={{ width: `${100 / c.w}%`, left: `${(-c.x / c.w) * 100}%`, top: `${(-c.y / c.w) * c.ratio * 100}%` }} />
    </span>
  );
}

function Qr({ method, php }: { method: PayMethod; php: number }) {
  const [bad, setBad] = useState(false);
  const [big, setBig] = useState(false);
  useEffect(() => setBad(false), [method, php]);
  const cfg = PAY[method];
  return (
    <div className="mx-auto flex w-full max-w-[19rem] flex-col items-center">
      {bad ? (
        <div className="flex aspect-square w-full items-center justify-center rounded-xl border-2 border-dashed border-line p-4 text-center text-base text-muted">The {cfg.label} QR is not here yet. Ask the admin to send it.</div>
      ) : (
        <button type="button" aria-label="Show the QR bigger" onClick={() => setBig(true)} className="w-full"><QrPicture method={method} php={php} onError={() => setBad(true)} /></button>
      )}
      {!bad && <p className="mt-2 text-sm font-semibold text-muted">Tap the QR to make it bigger</p>}
      {cfg.accountName && <p className="mt-1 text-base font-semibold">{cfg.accountName}</p>}
      {big && !bad && (
        <button type="button" aria-label="Close" onClick={() => setBig(false)} className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-black/85 p-4">
          <span className="block w-full max-w-[28rem]"><QrPicture method={method} php={php} onError={() => setBad(true)} /></span>
          <span className="text-lg font-bold text-white">{cfg.label}, P{php}. Tap anywhere to close.</span>
        </button>
      )}
    </div>
  );
}

/** Beta coin purchase: shows the notice, makes a reference code, shows the QR. The admin credits the coins by hand. */
export function PayBySheet({ pkg, existing, onClose }: { pkg: CoinPackage | null; existing?: PaymentRequest | null; onClose: () => void }) {
  const [req, setReq] = useState<PaymentRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<PayMethod>('gcash');
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<'none' | 'busy' | 'done'>('none');
  const userId = useAccountStore((st) => st.userId);

  useEffect(() => { if (existing) setReq(existing); else if (!pkg) { setReq(null); setError(null); setReceipt('none'); } }, [pkg, existing]);

  const start = async () => {
    if (!pkg) return;
    setBusy(true); setError(null);
    const r = await createPaymentRequest(pkg.id);
    setBusy(false);
    if (r.ok && r.data) setReq(r.data); else setError(r.error ?? 'Could not start. Try again.');
  };
  const sendReceipt = async (file: File | undefined) => {
    if (!file || !req || !userId) return;
    if (!file.type.startsWith('image/')) { toast('Pick a screenshot or photo of your receipt.', {}); return; }
    setReceipt('busy');
    try {
      const r = await uploadReceipt(req.id, userId, await receiptJpeg(file));
      if (r.ok) { setReceipt('done'); toast('Receipt sent', { tone: 'ok' }); } else { setReceipt('none'); toast(r.error ?? 'Could not send the receipt.', { tone: 'warn' }); }
    } catch { setReceipt('none'); toast('Could not read that image.', {}); }
  };
  const copy = async () => {
    if (!req) return;
    try { await navigator.clipboard.writeText(req.ref); toast('Code copied', { tone: 'ok' }); } catch { toast(`Your code is ${req.ref}`, {}); }
  };

  return (
    <Sheet open={!!pkg || !!existing} onClose={onClose} title={req ? `${req.coins} coins for P${req.price_php}` : pkg ? `${pkg.coins} coins for P${pkg.price}` : undefined}>
      {pkg && !req && (
        <div className="pb-2">
          <p className="rounded-xl bg-raised px-4 py-3 text-lg font-semibold">This part of tag.ai is still being built.</p>
          <p className="mt-3 text-lg text-muted">For now you can pay with a QR code. Your coins are added within {PAY_WAIT_MINUTES} minutes, usually much faster.</p>
          {error && <p role="alert" className="mt-3 text-base font-bold text-danger">{error}</p>}
          <div className="mt-6 space-y-3">
            <Button size="lg" full disabled={busy} onClick={() => void start()}>{busy ? 'One moment' : 'Show me how to pay'}</Button>
            <Button full variant="secondary" onClick={onClose}>Not now</Button>
          </div>
        </div>
      )}
      {req && (
        <div className="pb-2">
          <ol className="space-y-3 text-lg">
            <li><b>1.</b> Pay exactly <b>P{req.price_php}</b> to the QR below.</li>
            <li><b>2.</b> Type this code in the payment message, or upload your receipt, so we know it is you:
              <button onClick={() => void copy()} className="mt-2 flex w-full items-center justify-between rounded-xl border-2 border-accent bg-accent/10 px-4 py-3">
                <span className="display text-3xl tracking-wider">{req.ref}</span><span className="text-base font-bold text-muted">Copy</span>
              </button>
            </li>
            <li className="list-none">
              <label className={`flex min-h-[3rem] w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-4 text-center text-base font-bold ${receipt === 'done' ? 'border-ok text-ok' : 'border-line'}`}>
                {receipt === 'busy' ? 'Sending' : receipt === 'done' ? 'Receipt sent. Tap to send another.' : 'Upload my receipt'}
                <input type="file" accept="image/*" className="sr-only" disabled={receipt === 'busy'} onChange={(e) => { void sendReceipt(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
            </li>
            <li><b>3.</b> Wait for a message in <b>Me, Inbox</b>. It says Coins added, and your coins are in your wallet.</li>
          </ol>
          <div className="mb-4 mt-5 max-w-md"><SegmentedControl<PayMethod> label="Pay with" value={method} onChange={setMethod} options={PAY_METHODS.map((m) => ({ id: m, label: PAY[m].label }))} /></div>
          <Qr method={method} php={req.price_php} />
          <p className="mt-4 text-base text-muted">Paid the wrong amount or forgot the code? Message the admin with your payment screenshot.</p>
          <div className="mt-5 space-y-3">
            <Button size="lg" full onClick={() => { toast('Thanks. Your coins are coming.', { tone: 'ok' }); onClose(); }}>I have paid</Button>
            <Button full variant="secondary" onClick={() => { void cancelPaymentRequest(req.id); onClose(); }}>Cancel this request</Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

/** Requests that are still waiting, so a player can find their code again. */
export function PendingPayments({ version, onOpen }: { version: number; onOpen: (r: PaymentRequest) => void }) {
  const [rows, setRows] = useState<PaymentRequest[]>([]);
  useEffect(() => { void myPaymentRequests().then((r) => { if (r.ok) setRows((r.data ?? []).filter((x) => x.status === 'pending')); }); }, [version]);
  if (rows.length === 0) return null;
  return (
    <section className="mb-5 rounded-xl border-2 border-line p-3">
      <h3 className="text-xl font-extrabold">Waiting for payment</h3>
      <ul className="mt-2 divide-y divide-line/60">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-2">
            <span className="text-base"><b>{r.ref}</b>, {r.coins} coins for P{r.price_php}</span>
            <button className="shrink-0 text-base font-bold underline" onClick={() => onOpen(r)}>Details</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
