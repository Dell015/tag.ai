import { redirect } from 'next/navigation';

/** Old route kept as a redirect (the new home is /library?tab=saved). */
export default function Redirect() {
  redirect('/library?tab=saved');
}
