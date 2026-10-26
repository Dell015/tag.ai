'use client';
import { QRCodeSVG } from 'qrcode.react';
import { Button, toast } from '@/components/ui';

/** The room code and QR, so someone standing next to you can join (also while the game is running). */
export function InviteCode({ code, size = 112 }: { code: string; size?: number }) {
  const link = `${typeof window === 'undefined' ? '' : window.location.origin}/join?code=${code}`;
  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: 'Join my game on Tag.ai', text: `Room code ${code}`, url: link }); return; }
      await navigator.clipboard.writeText(link); toast('Link copied.', { tone: 'ok' });
    } catch { /* cancelled */ }
  };
  return (
    <div className="flex items-center gap-4">
      <div className="shrink-0 rounded-lg bg-white p-2"><QRCodeSVG value={link} size={size} /></div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold text-muted">Room code</p>
        <p className="sign text-4xl tracking-[0.18em]" aria-label={`Room code ${code.split('').join(' ')}`}>{code}</p>
        <Button size="md" variant="secondary" className="mt-2" onClick={share}>Share link</Button>
      </div>
    </div>
  );
}
