import { redirect } from 'next/navigation';

/** Old route kept as a redirect (the Library is gone, decks are chosen before each game). */
export default function Redirect() {
  redirect('/');
}
