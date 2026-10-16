import { redirect } from 'next/navigation';

/** Room codes are retired: one phone runs the whole game. */
export default function Redirect() {
  redirect('/');
}
