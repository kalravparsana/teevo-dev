import type { User, UserRole } from '@/types/entities';

export type NavItem = {
  label: string;
  path: string;
  roles: UserRole[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', roles: ['superadmin', 'club_admin', 'player'] },
  { label: 'Clubs', path: '/clubs', roles: ['superadmin', 'club_admin', 'player'] },
  { label: 'Tournaments', path: '/tournaments', roles: ['superadmin', 'club_admin', 'player'] },
  { label: 'Bookings', path: '/bookings', roles: ['club_admin', 'player'] },
  { label: 'Scorecards', path: '/scorecards', roles: ['club_admin', 'player'] },
  { label: 'User Management', path: '/users', roles: ['superadmin'] },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function canManageUsers(user: User): boolean {
  return user.role === 'superadmin';
}

export function canManageClubs(user: User): boolean {
  return user.role === 'superadmin';
}

export function canConfigureClub(user: User, clubId: string): boolean {
  return user.role === 'superadmin' || (user.role === 'club_admin' && user.clubId === clubId);
}

export function canManageTournaments(user: User, clubId: string): boolean {
  return canConfigureClub(user, clubId);
}

export function canManageBookings(user: User): boolean {
  return user.role === 'club_admin' || user.role === 'player';
}

export function canViewClub(user: User, clubId: string): boolean {
  if (user.role === 'superadmin') return true;
  if (user.role === 'club_admin') return user.clubId === clubId;
  return true;
}

export function getAccessibleClubIds(user: User, allClubIds: string[]): string[] {
  if (user.role === 'superadmin') return allClubIds;
  if (user.role === 'club_admin' && user.clubId) return [user.clubId];
  return allClubIds;
}
