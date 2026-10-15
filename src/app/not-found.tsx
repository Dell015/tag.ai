import Link from 'next/link';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col justify-center px-5">
      <h1 className="text-[5rem] leading-[0.9]">Wrong turn.</h1>
      <p className="mt-4 text-lg text-muted">That page doesn&apos;t exist.</p>
      <Link href="/" className="mt-8 block"><Button size="lg" full>Back home</Button></Link>
    </div>
  );
}
