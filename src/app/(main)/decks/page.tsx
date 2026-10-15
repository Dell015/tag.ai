import { redirect } from 'next/navigation';

/** Old route kept as a redirect (the new home is /library). */
export default function Redirect() {
  redirect('/library');
}
