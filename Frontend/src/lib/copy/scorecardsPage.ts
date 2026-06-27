import type { UserRole } from '@/types/entities';

const SCORECARDS_PAGE_DESCRIPTION: Record<UserRole, string> = {
  superadmin: 'View scorecards and tournament round results across the platform.',
  club_admin: 'View player scorecards and tournament round results for your club.',
  player: 'Enter 18-hole scores and view your tournament rounds.',
};

export function getScorecardsPageDescription(role: UserRole): string {
  return SCORECARDS_PAGE_DESCRIPTION[role];
}
