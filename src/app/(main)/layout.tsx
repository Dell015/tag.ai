'use client';
import { BottomNav } from '@/components/ui/BottomNav';
import { Splash } from '@/components/ui/Splash';
import { useRequireProfile } from '@/lib/use-profile';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireProfile();
  if (!ready) return <Splash />;
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1">{children}</div>
      <BottomNav />
    </div>
  );
}
