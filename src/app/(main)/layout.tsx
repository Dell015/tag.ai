'use client';
import { usePathname } from 'next/navigation';
import { BottomNav, isTabPath } from '@/components/ui/BottomNav';
import { Splash } from '@/components/ui/Splash';
import { useRequireProfile } from '@/lib/use-profile';
import { cn } from '@/lib/cn';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireProfile();
  const path = usePathname();
  if (!ready) return <Splash />;
  return (
    <div className="min-h-dvh">
      {/* Room for the fixed tab bar on the five top-level screens only. */}
      <div className={cn('min-h-dvh', isTabPath(path) && 'pb-[calc(4.25rem+max(env(safe-area-inset-bottom),16px))]')}>{children}</div>
      <BottomNav />
    </div>
  );
}
