/** The public address people should open when you share a link. Set NEXT_PUBLIC_APP_URL (for example https://tagai.vercel.app) so links never say localhost. */
export function appOrigin(): string {
  const set = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim().replace(/\/+$/, '');
  if (set && !/localhost|127\.0\.0\.1/.test(set)) return set;
  return typeof window === 'undefined' ? '' : window.location.origin;
}
