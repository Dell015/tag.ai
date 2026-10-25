import { getBrowserClient } from '@/lib/supabase/browser';
import { supabaseConfigured } from '@/lib/supabase/config';

/**
 * Avatar values: "c0".."c9" is a colour, "p:<user id>/<time>.jpg" is a photo in the public avatars bucket,
 * "d:<data url>" is a photo kept on this phone only (used when there is no account server).
 */
export function photoSrc(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith('d:')) return value.slice(2);
  if (value.startsWith('p:') && process.env.NEXT_PUBLIC_SUPABASE_URL) return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${value.slice(2)}`;
  return null;
}

/** Crops to a centred square and scales down to a small JPEG, so uploads are tiny whatever the original was. */
export async function squareJpeg(file: File, side = 256): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = side;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot resize photos.');
  ctx.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, side, side);
  bmp.close();
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not read that photo.'))), 'image/jpeg', 0.82));
}

const toDataUrl = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(b); });

/** Turns a picked photo into an avatar value. With an account it uploads to storage; otherwise it stays on the phone. */
export async function photoToAvatar(file: File, userId: string | null): Promise<{ ok: true; value: string } | { ok: false; error: string }> {
  if (!file.type.startsWith('image/')) return { ok: false, error: 'Pick an image file.' };
  try {
    const blob = await squareJpeg(file);
    const sb = supabaseConfigured && userId ? getBrowserClient() : null;
    if (!sb || !userId) return { ok: true, value: `d:${await toDataUrl(blob)}` };
    const path = `${userId}/${Date.now()}.jpg`;
    const { error } = await sb.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) return { ok: false, error: 'Could not upload the photo. Try again.' };
    return { ok: true, value: `p:${path}` };
  } catch {
    return { ok: false, error: 'Could not read that photo.' };
  }
}
