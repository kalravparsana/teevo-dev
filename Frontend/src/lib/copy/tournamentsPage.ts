import type { UserRole } from '@/types/entities';

const TOURNAMENTS_PAGE_DESCRIPTION: Record<UserRole, string> = {
  superadmin: 'View and manage golf tournaments across the platform.',
  club_admin: 'Schedule and manage golf tournaments for your club.',
  player: 'Browse upcoming tournaments and view schedules at your clubs.',
};

export function getTournamentsPageDescription(role: UserRole): string {
  return TOURNAMENTS_PAGE_DESCRIPTION[role];
}
