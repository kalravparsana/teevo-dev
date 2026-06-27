import type { UserRole } from '@/types/entities';

const ROLE_LABELS: Record<UserRole, string> = {
  club_admin: 'Admins',
  player: 'Players',
  superadmin: 'Super Admin',
};

export function TeamRoleCounts({ counts }: { counts: Record<UserRole, number> }) {
  const items: { role: UserRole; count: number }[] = [
    { role: 'club_admin', count: counts.club_admin },
    { role: 'player', count: counts.player },
    { role: 'superadmin', count: counts.superadmin },
  ];

  return (
    <div className="mb-4 grid grid-cols-3 gap-1.5 sm:gap-2">
      {items.map((item) => (
        <div
          key={item.role}
          className="flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-lg bg-fairway-50 px-1 py-2 text-center sm:px-1.5"
        >
          <p className="text-lg font-semibold leading-none tabular-nums text-fairway-900">
            {item.count}
          </p>
          <p className="mt-1 line-clamp-2 min-w-0 w-full break-words text-[10px] leading-tight text-muted sm:text-[11px]">
            {ROLE_LABELS[item.role]}
          </p>
        </div>
      ))}
    </div>
  );
}
