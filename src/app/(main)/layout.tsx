'use client';
import { usePathname } from 'next/navigation';
import { BottomNav, isTabPath } from '@/components/ui/BottomNav';
import { TopBar } from '@/components/ui/TopBar';
import { SideNav } from '@/components/ui/SideNav';
import { Splash } from '@/components/ui/Splash';
import { useRequireProfile } from '@/lib/use-profile';
import { cn } from '@/lib/cn';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireProfile();
  const path = usePathname();
  if (!ready) return <Splash />;
  return (
    <div className="min-h-dvh">
      {/* Desktop: a left sidebar replaces the floating tab bar. */}
      <SideNav />
      <div className="lg:pl-64" data-topbar={isTabPath(path) ? '' : undefined}>
        {/* Phone: room for the floating tab bar on the five top-level screens only. */}
        {isTabPath(path) && <TopBar />}
        <div className={cn('min-h-dvh', isTabPath(path) && 'pb-[calc(5.5rem+max(env(safe-area-inset-bottom),14px))] lg:pb-0')}>{children}</div>
      </div>
      <BottomNav />
    </div>
  );
}
