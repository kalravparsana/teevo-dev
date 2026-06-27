import type { UserRole } from '@/types/entities';

/** Panel and stat label for in-progress tournaments (draft, upcoming, active). */
export const DASHBOARD_ACTIVE_TOURNAMENTS_TITLE = 'Active Tournaments';

const DASHBOARD_PAGE_DESCRIPTION: Record<UserRole, string> = {
  superadmin:
    'A platform-wide view of every club, tournament, booking, and user on Teevo—track key metrics, monitor the tournament pipeline, review recent activity and scorecards, and stay ahead of upcoming tee times and registrations from one central dashboard.',
  club_admin: 'Tournaments, registrations, and upcoming bookings.',
  player: 'See your upcoming tournaments and confirmed tee times.',
};

export function getDashboardPageDescription(role: UserRole): string {
  return DASHBOARD_PAGE_DESCRIPTION[role];
}
