import { redirect } from 'next/navigation';

/** Old route kept as a redirect (saved cards now live under Me). */
export default function Redirect() {
  redirect('/me/saved');
}
