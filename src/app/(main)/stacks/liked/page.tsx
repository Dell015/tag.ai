'use client';
import { Screen } from '@/components/ui';
import { SavedList } from '@/components/library/SavedList';

export default function LikedPage() {
  return (
    <Screen title="Liked cards" back="/stacks">
      <SavedList />
    </Screen>
  );
}
