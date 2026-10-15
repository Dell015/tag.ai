import { redirect } from 'next/navigation';

/** Old route kept as a redirect (the new home is /me). */
export default function Redirect() {
  redirect('/me');
}
