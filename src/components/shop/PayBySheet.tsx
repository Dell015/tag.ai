'use client';
import { useEffect, useState } from 'react';
import { Button, SegmentedControl, Sheet, toast } from '@/components/ui';
import { PAY, PAY_WAIT_MINUTES, type PayMethod } from '@/lib/pay-config';
import { cancelPaymentRequest, createPaymentRequest, myPaymentRequests, type PaymentRequest } from '@/lib/supabase/account';
import type { CoinPackage } from '@/lib/data/shop-catalogue';

/** QR image with a plain fallback until the owner adds the file. */
function Qr({ method }: { method: PayMethod }) {
  const [bad, setBad] = useState(false);
  const cfg = PAY[method];
  return (
    <div className="mx-auto flex w-full max-w-[16rem] flex-col items-center">
      {bad ? (
        <div className="flex aspect-square w-full items-center justify-center rounded-xl border-2 border-dashed border-line p-4 text-center text-base text-muted">The {cfg.label} QR is not here yet. Ask the admin to send it.</div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cfg.image} alt={`${cfg.label} QR code`} onError={() => setBad(true)} className="aspect-square w-full rounded-xl border-2 border-line bg-white object-contain p-2" />
      )}
      {cfg.accountName && <p className="mt-2 text-base font-semibold">{cfg.accountName}</p>}
    </div>
  );
}

/** Beta coin purchase: shows the notice, makes a reference code, shows the QR. The admin credits the coins by hand. */
export function PayBySheet({ pkg, existing, onClose }: { pkg: CoinPackage | null; existing?: PaymentRequest | null; onClose: () => void }) {
  const [req, setReq] = useState<PaymentRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<PayMethod>('gcash');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (existing) setReq(existing); else if (!pkg) { setReq(null); setError(null); } }, [pkg, existing]);

  const start = async () => {
    if (!pkg) return;
    setBusy(true); setError(null);
    const r = await createPaymentRequest(pkg.id);
    setBusy(false);
    if (r.ok && r.data) setReq(r.data); else setError(r.error ?? 'Could not start. Try again.');
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
            <li><b>2.</b> Type this code in the payment message so we know it is you:
              <button onClick={() => void copy()} className="mt-2 flex w-full items-center justify-between rounded-xl border-2 border-accent bg-accent/10 px-4 py-3">
                <span className="display text-3xl tracking-wider">{req.ref}</span><span className="text-base font-bold text-muted">Copy</span>
              </button>
            </li>
            <li><b>3.</b> Wait for a message in <b>Me, Inbox</b>. It says Coins added, and your coins are in your wallet.</li>
          </ol>
          <div className="mb-4 mt-5 max-w-md"><SegmentedControl<PayMethod> label="Pay with" value={method} onChange={setMethod} options={[{ id: 'gcash', label: PAY.gcash.label }, { id: 'bank', label: PAY.bank.label }]} /></div>
          <Qr method={method} />
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
