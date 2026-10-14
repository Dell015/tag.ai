import { Avatar } from '@/components/ui';

export function PlayerRow({ name, avatar, isHost, isGuest, isYou, onRemove }: {
  name: string; avatar: string; isHost?: boolean; isGuest?: boolean; isYou?: boolean; onRemove?: () => void;
}) {
  return (
    <li className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl bg-surface px-3 ring-1 ring-white/10">
      <Avatar value={avatar} size={48} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xl font-bold">{name}{isYou && <span className="ml-2 text-sm font-semibold text-muted">you</span>}</div>
        <div className="text-sm text-muted">{isHost ? '👑 Host' : isGuest ? 'Guest · on this phone' : 'Joined'}</div>
      </div>
      {onRemove && (
        <button onClick={onRemove} aria-label={`Remove ${name}`} className="h-tap w-tap rounded-2xl text-xl text-muted active:bg-white/10">✕</button>
      )}
    </li>
  );
}
