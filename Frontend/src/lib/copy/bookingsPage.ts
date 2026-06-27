import type { UserRole } from '@/types/entities';

const BOOKINGS_PAGE_DESCRIPTION: Record<UserRole, string> = {
  superadmin: 'View and manage tee time bookings across the platform.',
  club_admin: 'Schedule and manage tee time bookings for your club.',
  player: 'Book tee times and manage your rounds.',
};

export function getBookingsPageDescription(role: UserRole): string {
  return BOOKINGS_PAGE_DESCRIPTION[role];
}
