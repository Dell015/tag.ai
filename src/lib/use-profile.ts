'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/stores/profile-store';
import { useHydrated } from '@/lib/hydration';

/** Returns the profile once hydrated; sends people without one to /welcome. */
export function useRequireProfile(next?: string) {
  const hydrated = useHydrated();
  const profile = useProfileStore((s) => s.profile);
  const router = useRouter();
  useEffect(() => {
    if (hydrated && !profile) router.replace(next ? `/welcome?next=${encodeURIComponent(next)}` : '/welcome');
  }, [hydrated, profile, router, next]);
  return { ready: hydrated && !!profile, profile };
}
