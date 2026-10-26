import { Avatar, Icon } from '@/components/ui';

export function PlayerRow({ name, avatar, isHost, isGuest, isYou, onRemove, viewerIsHost }: {
  name: string; avatar: string; isHost?: boolean; isGuest?: boolean; viewerIsHost?: boolean; isYou?: boolean; onRemove?: () => void;
}) {
  return (
    <li className="flex min-h-[4.75rem] items-center gap-4 border-b-2 border-line/60 py-2">
      <Avatar value={avatar} name={name} size={52} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-2xl font-extrabold">{name}{isYou && <span className="ml-2 text-base font-semibold text-muted">you</span>}</div>
        <div className="text-base text-muted">{isHost ? 'Host' : isGuest ? (viewerIsHost ? 'Guest, plays from this phone' : 'Guest') : 'Joined'}</div>
      </div>
      {onRemove && (
        <button onClick={onRemove} aria-label={`Remove ${name}`} className="flex h-tap w-tap items-center justify-center text-muted active:text-text"><Icon name="close" /></button>
      )}
    </li>
  );
}
