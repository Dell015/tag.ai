'use client';
import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Button, Sheet } from '@/components/ui';

/** Pulls a room code out of a scanned QR: the join link, or the bare 6 characters. */
export function codeFromScan(text: string): string | null {
  const m = /[?&]code=([A-Za-z0-9]{6})\b/.exec(text) ?? /^\s*([A-Za-z0-9]{6})\s*$/.exec(text);
  return m ? m[1].toUpperCase() : null;
}

/** Scan a room's QR code with the camera, right inside the app so nobody has to sign in again. */
export function QrScanner({ open, onClose, onCode }: { open: boolean; onClose: () => void; onCode: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const cb = useRef(onCode);
  useEffect(() => { cb.current = onCode; });

  useEffect(() => {
    if (!open) return;
    let stop = false;
    let stream: MediaStream | undefined;
    let raf = 0;
    setError('');
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (stop) { stream.getTracks().forEach((t) => t.stop()); return; }
        const v = video.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const Detector = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
        const detector = Detector ? new Detector({ formats: ['qr_code'] }) : null;
        const tick = async () => {
          if (stop) return;
          if (v.readyState >= 2 && ctx) {
            let text: string | null = null;
            try {
              if (detector) text = (await detector.detect(v))[0]?.rawValue ?? null;
              else {
                canvas.width = v.videoWidth; canvas.height = v.videoHeight;
                ctx.drawImage(v, 0, 0);
                const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
                text = jsQR(img.data, img.width, img.height)?.data ?? null;
              }
            } catch { /* keep looking */ }
            const code = text ? codeFromScan(text) : null;
            if (code) { stop = true; stream?.getTracks().forEach((t) => t.stop()); cb.current(code); return; }
          }
          raf = requestAnimationFrame(() => void tick());
        };
        void tick();
      } catch {
        setError('The camera is not available. Allow camera access in your browser settings, or type the code instead.');
      }
    })();
    return () => { stop = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, [open]);

  return (
    <Sheet open={open} onClose={onClose} title="Scan the QR code">
      {error ? (
        <p role="alert" className="text-lg text-danger">{error}</p>
      ) : (
        <>
          <p className="-mt-2 mb-4 text-base text-muted">Point the camera at the QR code on the host&apos;s phone.</p>
          <video ref={video} muted playsInline className="aspect-square w-full rounded-2xl border-2 border-line bg-black object-cover" />
        </>
      )}
      <Button full variant="secondary" className="mt-4" onClick={onClose}>Type the code instead</Button>
    </Sheet>
  );
}
