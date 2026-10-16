import { redirect } from 'next/navigation';

/** Retired with the Library. Decks are chosen before each game now. */
export default function Redirect() {
  redirect('/');
}
