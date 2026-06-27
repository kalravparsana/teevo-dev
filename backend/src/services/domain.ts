import type {
  AppData,
  Booking,
  Club,
  Scorecard,
  Tournament,
  TournamentRegistration,
  User,
} from '../lib/types.js';
import { repo } from './repository.js';

export type StoreError = { code: string; message: string };

function createId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function duplicateEmail(data: AppData, email: string, excludeId?: string): boolean {
  return data.users.some(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== excludeId,
  );
}

function isDateRangeOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const aS = new Date(aStart).getTime();
  const aE = new Date(aEnd).getTime();
  const bS = new Date(bStart).getTime();
  const bE = new Date(bEnd).getTime();
  return aS <= bE && bS <= aE;
}

function teeTimeToIso(date: string, time: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(`${date}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function isTeeTimeWithinClubHours(club: Club, time: string): boolean {
  return time >= club.startTime && time <= club.endTime;
}

function isCasualBookingBlocked(
  tournaments: Tournament[],
  clubId: string,
  teeTimeIso: string,
): Tournament | null {
  const tee = new Date(teeTimeIso).getTime();
  return (
    tournaments.find(
      (t) =>
        t.clubId === clubId &&
        t.blockOtherBookings &&
        (t.status === 'upcoming' || t.status === 'active') &&
        tee >= new Date(t.startsAt).getTime() &&
        tee <= new Date(t.endsAt).getTime(),
    ) ?? null
  );
}

function eligibleGroupsForHandicap(
  groups: Tournament['groups'],
  handicap: number | null,
): Tournament['groups'] {
  if (handicap === null) return groups;
  return groups.filter((g) => {
    const minOk = g.minHandicap === null || handicap >= g.minHandicap;
    const maxOk = g.maxHandicap === null || handicap <= g.maxHandicap;
    return minOk && maxOk;
  });
}

const OPEN_REGISTRATION_STATUSES = new Set<Tournament['status']>(['upcoming', 'active']);

async function persistAppData(data: AppData): Promise<void> {
  const current = await repo.loadAppData();
  const persistList = async <T extends { id: string }>(
    type: 'USER' | 'CLUB' | 'TOURNAMENT' | 'REGISTRATION' | 'BOOKING' | 'SCORECARD',
    next: T[],
    prev: T[],
    put: (item: T) => Promise<void>,
    del: (id: string) => Promise<void>,
  ) => {
    const nextIds = new Set(next.map((x) => x.id));
    for (const item of prev) {
      if (!nextIds.has(item.id)) await del(item.id);
    }
    for (const item of next) await put(item);
  };

  await persistList('USER', data.users, current.users, repo.putUser, repo.deleteUser);
  await persistList('CLUB', data.clubs, current.clubs, repo.putClub, repo.deleteClub);
  await persistList(
    'TOURNAMENT',
    data.tournaments,
    current.tournaments,
    repo.putTournament,
    repo.deleteTournament,
  );
  await persistList(
    'REGISTRATION',
    data.tournamentRegistrations,
    current.tournamentRegistrations,
    repo.putRegistration,
    repo.deleteRegistration,
  );
  await persistList('BOOKING', data.bookings, current.bookings, repo.putBooking, repo.deleteBooking);
  await persistList(
    'SCORECARD',
    data.scorecards,
    current.scorecards,
    repo.putScorecard,
    repo.deleteScorecard,
  );
}

export async function mutate(
  fn: (data: AppData) => { data: AppData; error?: StoreError },
): Promise<{ data?: AppData; error?: StoreError }> {
  const data = await repo.loadAppData();
  const result = fn(data);
  if (result.error) return { error: result.error };
  await persistAppData(result.data);
  return { data: result.data };
}

export const domain = {
  createUser(data: AppData, input: Omit<User, 'id'>) {
    if (duplicateEmail(data, input.email)) {
      return { data, error: { code: 'DUPLICATE_EMAIL', message: 'A user with this email already exists' } };
    }
    if (input.role === 'club_admin' && !input.clubId) {
      return { data, error: { code: 'VALIDATION', message: 'Club admins must be assigned to a club' } };
    }
    const user: User = { ...input, handicap: input.handicap ?? null, id: createId() };
    return { data: { ...data, users: [...data.users, user] } };
  },

  updateUser(data: AppData, id: string, input: Partial<Omit<User, 'id'>>) {
    const existing = data.users.find((u) => u.id === id);
    if (!existing) return { data, error: { code: 'NOT_FOUND', message: 'User not found' } };
    if (input.email && duplicateEmail(data, input.email, id)) {
      return { data, error: { code: 'DUPLICATE_EMAIL', message: 'A user with this email already exists' } };
    }
    const merged = { ...existing, ...input };
    if (merged.role === 'club_admin' && !merged.clubId) {
      return { data, error: { code: 'VALIDATION', message: 'Club admins must be assigned to a club' } };
    }
    return { data: { ...data, users: data.users.map((u) => (u.id === id ? merged : u)) } };
  },

  deleteUser(data: AppData, id: string): AppData {
    return {
      ...data,
      users: data.users.filter((u) => u.id !== id),
      bookings: data.bookings.filter((b) => b.playerId !== id),
      scorecards: data.scorecards.filter((s) => s.playerId !== id),
    };
  },

  createClub(data: AppData, input: Omit<Club, 'id'>): AppData {
    const club: Club = { ...input, id: createId() };
    return { ...data, clubs: [...data.clubs, club] };
  },

  updateClub(data: AppData, id: string, input: Partial<Omit<Club, 'id'>>): AppData {
    return { ...data, clubs: data.clubs.map((c) => (c.id === id ? { ...c, ...input } : c)) };
  },

  deleteClub(data: AppData, id: string): AppData {
    const removedTournamentIds = new Set(
      data.tournaments.filter((t) => t.clubId === id).map((t) => t.id),
    );
    return {
      ...data,
      clubs: data.clubs.filter((c) => c.id !== id),
      users: data.users.map((u) => (u.clubId === id ? { ...u, clubId: null } : u)),
      tournaments: data.tournaments.filter((t) => t.clubId !== id),
      tournamentRegistrations: data.tournamentRegistrations.filter(
        (r) => !removedTournamentIds.has(r.tournamentId),
      ),
      bookings: data.bookings.filter((b) => b.clubId !== id),
      scorecards: data.scorecards.filter((s) => s.clubId !== id),
    };
  },

  createTournament(data: AppData, input: Omit<Tournament, 'id'>) {
    const club = data.clubs.find((c) => c.id === input.clubId);
    if (!club) return { data, error: { code: 'NOT_FOUND', message: 'Club not found' } };
    const overlapping = data.tournaments.some(
      (t) =>
        t.clubId === input.clubId &&
        isDateRangeOverlap(t.startsAt, t.endsAt, input.startsAt, input.endsAt),
    );
    if (overlapping) {
      return {
        data,
        error: { code: 'OVERLAP', message: 'Tournament dates overlap with another tournament at this club' },
      };
    }
    const tournament: Tournament = { ...input, id: createId() };
    return { data: { ...data, tournaments: [...data.tournaments, tournament] } };
  },

  updateTournament(data: AppData, id: string, input: Partial<Omit<Tournament, 'id'>>) {
    const existing = data.tournaments.find((t) => t.id === id);
    if (!existing) return { data, error: { code: 'NOT_FOUND', message: 'Tournament not found' } };
    const merged = { ...existing, ...input };
    const overlapping = data.tournaments.some(
      (t) =>
        t.id !== id &&
        t.clubId === merged.clubId &&
        isDateRangeOverlap(t.startsAt, t.endsAt, merged.startsAt, merged.endsAt),
    );
    if (overlapping) {
      return {
        data,
        error: { code: 'OVERLAP', message: 'Tournament dates overlap with another tournament at this club' },
      };
    }
    return { data: { ...data, tournaments: data.tournaments.map((t) => (t.id === id ? merged : t)) } };
  },

  deleteTournament(data: AppData, id: string): AppData {
    return {
      ...data,
      tournaments: data.tournaments.filter((t) => t.id !== id),
      tournamentRegistrations: data.tournamentRegistrations.filter((r) => r.tournamentId !== id),
      bookings: data.bookings.map((b) => (b.tournamentId === id ? { ...b, tournamentId: null } : b)),
      scorecards: data.scorecards.filter((s) => s.tournamentId !== id),
    };
  },

  registerForTournament(
    data: AppData,
    input: { tournamentId: string; playerId: string; groupId: string },
  ) {
    const tournament = data.tournaments.find((t) => t.id === input.tournamentId);
    if (!tournament) return { data, error: { code: 'NOT_FOUND', message: 'Tournament not found' } };
    if (!OPEN_REGISTRATION_STATUSES.has(tournament.status)) {
      return { data, error: { code: 'ELIGIBILITY', message: 'Registration is closed for this tournament' } };
    }
    const player = data.users.find((u) => u.id === input.playerId);
    if (!player || player.role !== 'player') {
      return { data, error: { code: 'VALIDATION', message: 'Only players can register' } };
    }
    if (player.clubId !== tournament.clubId) {
      return {
        data,
        error: { code: 'ELIGIBILITY', message: 'Join this club before registering for its tournaments' },
      };
    }
    const group = tournament.groups.find((g) => g.id === input.groupId);
    if (!group) {
      return { data, error: { code: 'VALIDATION', message: 'Selected flight is not part of this tournament' } };
    }
    const eligible = eligibleGroupsForHandicap(tournament.groups, player.handicap);
    if (!eligible.some((g) => g.id === input.groupId)) {
      return { data, error: { code: 'ELIGIBILITY', message: 'Your handicap is not eligible for this flight' } };
    }
    const existing = data.tournamentRegistrations.find(
      (r) => r.tournamentId === input.tournamentId && r.playerId === input.playerId,
    );
    if (existing && existing.status !== 'rejected') {
      return { data, error: { code: 'DUPLICATE', message: 'You already registered for this tournament' } };
    }
    const registration: TournamentRegistration = {
      id: createId(),
      tournamentId: input.tournamentId,
      playerId: input.playerId,
      groupId: input.groupId,
      status: 'pending',
      startingHole: null,
      teeTime: null,
      requestedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
    };
    const tournamentRegistrations = existing
      ? data.tournamentRegistrations.map((r) => (r.id === existing.id ? registration : r))
      : [...data.tournamentRegistrations, registration];
    return { data: { ...data, tournamentRegistrations } };
  },

  reviewRegistration(
    data: AppData,
    input: {
      registrationId: string;
      reviewerId: string;
      decision: 'approved' | 'rejected';
      groupId?: string;
      startingHole?: number;
      teeTime?: string;
    },
  ) {
    const registration = data.tournamentRegistrations.find((r) => r.id === input.registrationId);
    if (!registration) return { data, error: { code: 'NOT_FOUND', message: 'Registration not found' } };
    if (registration.status !== 'pending') {
      return { data, error: { code: 'VALIDATION', message: 'This registration was already reviewed' } };
    }
    const tournament = data.tournaments.find((t) => t.id === registration.tournamentId);
    if (!tournament) return { data, error: { code: 'NOT_FOUND', message: 'Tournament not found' } };
    const club = data.clubs.find((c) => c.id === tournament.clubId);
    if (!club) return { data, error: { code: 'NOT_FOUND', message: 'Club not found' } };

    if (input.decision === 'rejected') {
      return {
        data: {
          ...data,
          tournamentRegistrations: data.tournamentRegistrations.map((r) =>
            r.id === registration.id
              ? {
                  ...r,
                  status: 'rejected' as const,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: input.reviewerId,
                }
              : r,
          ),
        },
      };
    }

    if (!input.groupId || !input.startingHole || !input.teeTime) {
      return {
        data,
        error: { code: 'VALIDATION', message: 'Assign a flight, starting hole, and tee time to approve' },
      };
    }
    if (input.startingHole < 1 || input.startingHole > club.holeCount) {
      return {
        data,
        error: { code: 'VALIDATION', message: `Starting hole must be between 1 and ${club.holeCount}` },
      };
    }
    const teeTimeIso = input.teeTime.includes('T') ? input.teeTime : teeTimeToIso(input.teeTime.slice(0, 10), input.teeTime.slice(11, 16));
    const doubleBooked = data.bookings.some(
      (b) => b.clubId === tournament.clubId && b.status !== 'cancelled' && b.teeTime === teeTimeIso,
    );
    if (doubleBooked) {
      return { data, error: { code: 'DOUBLE_BOOKING', message: 'This tee slot is already taken' } };
    }
    const booking: Booking = {
      id: createId(),
      playerId: registration.playerId,
      clubId: tournament.clubId,
      tournamentId: tournament.id,
      teeTime: teeTimeIso,
      status: 'confirmed',
    };
    return {
      data: {
        ...data,
        tournamentRegistrations: data.tournamentRegistrations.map((r) =>
          r.id === registration.id
            ? {
                ...r,
                status: 'approved' as const,
                groupId: input.groupId!,
                startingHole: input.startingHole!,
                teeTime: teeTimeIso,
                reviewedAt: new Date().toISOString(),
                reviewedBy: input.reviewerId,
              }
            : r,
        ),
        bookings: [...data.bookings, booking],
      },
    };
  },

  createBooking(
    data: AppData,
    input: {
      playerId: string;
      clubId: string;
      tournamentId: string | null;
      date: string;
      time: string;
    },
  ) {
    const club = data.clubs.find((c) => c.id === input.clubId);
    if (!club) return { data, error: { code: 'NOT_FOUND', message: 'Club not found' } };
    if (!isTeeTimeWithinClubHours(club, input.time)) {
      return { data, error: { code: 'OUTSIDE_HOURS', message: 'Tee time is outside club operating hours' } };
    }
    const teeTimeIso = teeTimeToIso(input.date, input.time);
    const doubleBooked = data.bookings.some(
      (b) => b.clubId === input.clubId && b.status !== 'cancelled' && b.teeTime === teeTimeIso,
    );
    if (doubleBooked) {
      return { data, error: { code: 'DOUBLE_BOOKING', message: 'This tee time is already booked' } };
    }
    if (!input.tournamentId) {
      const blocked = isCasualBookingBlocked(data.tournaments, input.clubId, teeTimeIso);
      if (blocked) {
        return {
          data,
          error: { code: 'TOURNAMENT_BLOCK', message: `Casual bookings are paused during ${blocked.name}` },
        };
      }
    }
    const booking: Booking = {
      id: createId(),
      playerId: input.playerId,
      clubId: input.clubId,
      tournamentId: input.tournamentId,
      teeTime: teeTimeIso,
      status: 'confirmed',
    };
    return { data: { ...data, bookings: [...data.bookings, booking] } };
  },

  updateBookingStatus(data: AppData, id: string, status: Booking['status']): AppData {
    return { ...data, bookings: data.bookings.map((b) => (b.id === id ? { ...b, status } : b)) };
  },

  saveScorecard(
    data: AppData,
    input: {
      tournamentId: string;
      playerId: string;
      holeScores: number[];
      status: Scorecard['status'];
    },
  ) {
    const tournament = data.tournaments.find((t) => t.id === input.tournamentId);
    if (!tournament) return { data, error: { code: 'NOT_FOUND', message: 'Tournament not found' } };
    const club = data.clubs.find((c) => c.id === tournament.clubId);
    const holeCount = club?.holeCount ?? 18;
    if (input.holeScores.length !== holeCount) {
      return {
        data,
        error: { code: 'VALIDATION', message: `Enter a score for all ${holeCount} holes` },
      };
    }
    const totalScore = input.holeScores.reduce((a, b) => a + b, 0);
    const existing = data.scorecards.find(
      (s) => s.tournamentId === input.tournamentId && s.playerId === input.playerId,
    );
    if (existing) {
      return {
        data: {
          ...data,
          scorecards: data.scorecards.map((s) =>
            s.id === existing.id
              ? { ...s, holeScores: input.holeScores, totalScore, status: input.status }
              : s,
          ),
        },
      };
    }
    const scorecard: Scorecard = {
      id: createId(),
      tournamentId: input.tournamentId,
      playerId: input.playerId,
      clubId: tournament.clubId,
      holeScores: input.holeScores,
      totalScore,
      status: input.status,
      roundDate: new Date().toISOString(),
    };
    return { data: { ...data, scorecards: [...data.scorecards, scorecard] } };
  },

  joinClub(data: AppData, userId: string, clubId: string): AppData {
    return {
      ...data,
      users: data.users.map((u) =>
        u.id === userId && u.role === 'player' ? { ...u, clubId } : u,
      ),
    };
  },
};

export async function ensureUserForAuth(email: string, name?: string): Promise<User> {
  const existing = await repo.findUserByEmail(email);
  if (existing) return existing;
  const result = await mutate((data) =>
    domain.createUser(data, {
      name: name ?? email.split('@')[0],
      email,
      role: 'player',
      clubId: null,
      handicap: null,
    }),
  );
  if (result.error) throw new Error(result.error.message);
  const user = result.data!.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error('Failed to provision user');
  return user;
}
