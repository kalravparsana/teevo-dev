import type { UserRole } from '@/types/entities';

const CLUBS_PAGE_DESCRIPTION: Record<UserRole, string> = {
  superadmin: 'View and manage golf clubs on the platform.',
  club_admin: 'Manage club settings, operating hours, and tee time slots for your club.',
  player: 'Browse golf clubs and explore tee time availability.',
};

export function getClubsPageDescription(role: UserRole): string {
  return CLUBS_PAGE_DESCRIPTION[role];
}
