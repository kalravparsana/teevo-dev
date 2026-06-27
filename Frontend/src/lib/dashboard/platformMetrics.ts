import type { AppData, Booking, Scorecard, Tournament, UserRole } from '@/types/entities';

export type ClubSummary = {
  clubId: string;
  tournamentCount: number;
  activeTournamentCount: number;
  confirmedBookingCount: number;
  adminCount: number;
  playerCount: number;
};

export type TournamentStatusCounts = Record<
  'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled',
  number
>;

const TOURNAMENT_STATUSES = [
  'draft',
  'upcoming',
  'active',
  'completed',
  'cancelled',
] as const satisfies readonly (keyof TournamentStatusCounts)[];

export function countUsersByRole(users: AppData['users']): Record<UserRole, number> {
  return {
    superadmin: users.filter((u) => u.role === 'superadmin').length,
    club_admin: users.filter((u) => u.role === 'club_admin').length,
    player: users.filter((u) => u.role === 'player').length,
  };
}

export function countTournamentsByStatus(
  tournaments: AppData['tournaments'],
): TournamentStatusCounts {
  return Object.fromEntries(
    TOURNAMENT_STATUSES.map((status) => [
      status,
      tournaments.filter((t) => t.status === status).length,
    ]),
  ) as TournamentStatusCounts;
}

export function getClubSummaries(data: AppData): ClubSummary[] {
  return data.clubs.map((club) => ({
    clubId: club.id,
    tournamentCount: data.tournaments.filter((t) => t.clubId === club.id).length,
    activeTournamentCount: data.tournaments.filter(
      (t) =>
        t.clubId === club.id && t.status !== 'cancelled' && t.status !== 'completed',
    ).length,
    confirmedBookingCount: data.bookings.filter(
      (b) => b.clubId === club.id && b.status === 'confirmed',
    ).length,
    adminCount: data.users.filter(
      (u) => u.clubId === club.id && u.role === 'club_admin',
    ).length,
    playerCount: data.users.filter((u) => u.clubId === club.id && u.role === 'player')
      .length,
  }));
}

export function getActiveTournaments(tournaments: Tournament[]): Tournament[] {
  return tournaments
    .filter((t) => t.status !== 'cancelled' && t.status !== 'completed')
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

export function getUpcomingBookings(bookings: Booking[]): Booking[] {
  const now = Date.now();
  return bookings
    .filter((b) => b.status === 'confirmed' && new Date(b.teeTime).getTime() >= now)
    .sort((a, b) => new Date(a.teeTime).getTime() - new Date(b.teeTime).getTime());
}

export function getRecentScorecards(scorecards: Scorecard[], limit = 5): Scorecard[] {
  return [...scorecards]
    .sort((a, b) => new Date(b.roundDate).getTime() - new Date(a.roundDate).getTime())
    .slice(0, limit);
}

export type PlatformActivityType = 'booking' | 'scorecard' | 'tournament';

export type PlatformActivityItem = {
  id: string;
  type: PlatformActivityType;
  timestamp: string;
  title: string;
  subtitle: string;
  href: string;
  badge: string;
};

export function getPlatformActivity(data: AppData, limit = 10): PlatformActivityItem[] {
  const items: PlatformActivityItem[] = [];

  for (const booking of getUpcomingBookings(data.bookings)) {
    const player = data.users.find((u) => u.id === booking.playerId);
    const club = data.clubs.find((c) => c.id === booking.clubId);
    items.push({
      id: `booking-${booking.id}`,
      type: 'booking',
      timestamp: booking.teeTime,
      title: `${player?.name ?? 'Player'} booked a tee time`,
      subtitle: club?.name ?? '',
      href: `/clubs/${booking.clubId}`,
      badge: booking.status,
    });
  }

  for (const scorecard of data.scorecards) {
    const player = data.users.find((u) => u.id === scorecard.playerId);
    const tournament = data.tournaments.find((t) => t.id === scorecard.tournamentId);
    items.push({
      id: `scorecard-${scorecard.id}`,
      type: 'scorecard',
      timestamp: scorecard.roundDate,
      title: `${player?.name ?? 'Player'} — score ${scorecard.totalScore}`,
      subtitle: tournament?.name ?? '',
      href: `/tournaments/${scorecard.tournamentId}`,
      badge: scorecard.status,
    });
  }

  for (const tournament of data.tournaments) {
    const club = data.clubs.find((c) => c.id === tournament.clubId);
    items.push({
      id: `tournament-${tournament.id}`,
      type: 'tournament',
      timestamp: tournament.startsAt,
      title: tournament.name,
      subtitle: club?.name ?? '',
      href: `/tournaments/${tournament.id}`,
      badge: tournament.status,
    });
  }

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
