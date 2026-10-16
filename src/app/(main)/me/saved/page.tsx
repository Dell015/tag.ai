'use client';
import { Screen } from '@/components/ui';
import { SavedList } from '@/components/library/SavedList';

export default function SavedPage() {
  return (
    <Screen title="Saved cards" back="/me">
      <SavedList />
    </Screen>
  );
}
