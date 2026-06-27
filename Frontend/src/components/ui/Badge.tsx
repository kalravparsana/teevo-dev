import { cn } from '@/lib/cn';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900',
  approved: 'bg-fairway-100 text-fairway-800',
  rejected: 'bg-red-100 text-red-800',
  draft: 'bg-sand-200 text-ink',
  upcoming: 'bg-blue-100 text-blue-800',
  active: 'bg-fairway-100 text-fairway-800',
  completed: 'bg-fairway-700 text-white',
  cancelled: 'bg-red-100 text-red-800',
  confirmed: 'bg-fairway-100 text-fairway-800',
  submitted: 'bg-gold-500/20 text-gold-600',
  superadmin: 'bg-gold-500/20 text-gold-700',
  club_admin: 'bg-fairway-100 text-fairway-800',
  player: 'bg-sand-200 text-ink',
};

export function Badge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-center text-xs font-medium leading-tight capitalize',
        statusStyles[status] ?? 'bg-sand-200 text-ink',
        className,
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
