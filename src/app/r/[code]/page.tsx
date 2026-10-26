'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Splash } from '@/components/ui';
import { REF_KEY } from '@/lib/supabase/referral';

/** An invite link: remember who invited you, then go and make an account. */
export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  useEffect(() => {
    const c = (code ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    try { if (c.length === 6) window.localStorage.setItem(REF_KEY, c); } catch { /* private mode */ }
    router.replace('/welcome');
  }, [code, router]);
  return <Splash />;
}
