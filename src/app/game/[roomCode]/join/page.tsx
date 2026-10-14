import { redirect } from 'next/navigation';

/** Old invite-link shape: forward to the new join screen with the code prefilled. */
export default function LegacyJoin({ params }: { params: { roomCode: string } }) {
  redirect(`/join?code=${encodeURIComponent(params.roomCode)}`);
}
