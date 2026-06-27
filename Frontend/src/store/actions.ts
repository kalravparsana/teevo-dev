import type {
  AppData,
  Booking,
  Club,
  Scorecard,
  Tournament,
  TournamentRegistration,
  User,
} from '@/types/entities';
import { createId } from '@/lib/id';
import { isDateRangeOverlap } from '@/lib/dates';
import { teeTimeToIso, isTeeTimeWithinClubHours } from '@/lib/teeTimes';
import { isCasualBookingBlocked } from '@/lib/tournaments/bookingBlock';
import { eligibleGroupsForHandicap } from '@/lib/tournaments/groups';

export type StoreError = { code: string; message: string };

function duplicateEmail(data: AppData, email: string, excludeId?: string): boolean {
  return data.users.some(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== excludeId,
  );
}

function isValidTournamentRange(startsAt: string, endsAt: string): boolean {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  return start <= end;
}

const OPEN_REGISTRATION_STATUSES = new Set<Tournament['status']>(['upcoming', 'active']);

export function createUser(
  data: AppData,
  input: Omit<User, 'id'>,
): { data: AppData; error?: StoreError } {
  if (duplicateEmail(data, input.email)) {
    return { data, error: { code: 'DUPLICATE_EMAIL', message: 'A user with this email already exists' } };
  }
  if (input.role === 'club_admin' && !input.clubId) {
    return { data, error: { code: 'VALIDATION', message: 'Club admins must be assigned to a club' } };
  }
  const user: User = { ...input, handicap: input.handicap ?? null, id: createId() };
  return { data: { ...data, users: [...data.users, user] } };
}

export function updateUser(
  data: AppData,
  id: string,
  input: Partial<Omit<User, 'id'>>,
): { data: AppData; error?: StoreError } {
  const existing = data.users.find((u) => u.id === id);
  if (!existing) return { data, error: { code: 'NOT_FOUND', message: 'User not found' } };
  if (input.email && duplicateEmail(data, input.email, id)) {
    return { data, error: { code: 'DUPLICATE_EMAIL', message: 'A user with this email already exists' } };
  }
  const merged = { ...existing, ...input };
  if (merged.role === 'club_admin' && !merged.clubId) {
    return { data, error: { code: 'VALIDATION', message: 'Club admins must be assigned to a club' } };
  }
  const users = data.users.map((u) => (u.id === id ? merged : u));
  return { data: { ...data, users } };
}

export function deleteUser(data: AppData, id: string): AppData {
  return {
    ...data,
    users: data.users.filter((u) => u.id !== id),
    bookings: data.bookings.filter((b) => b.playerId !== id),
    scorecards: data.scorecards.filter((s) => s.playerId !== id),
  };
}

export function createClub(data: AppData, input: Omit<Club, 'id'>): AppData {
  const club: Club = { ...input, id: createId() };
  return { ...data, clubs: [...data.clubs, club] };
}

export function updateClub(data: AppData, id: string, input: Partial<Omit<Club, 'id'>>): AppData {
  const clubs = data.clubs.map((c) => (c.id === id ? { ...c, ...input } : c));
  return { ...data, clubs };
}

export function deleteClub(data: AppData, id: string): AppData {
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
}

export function createTournament(
  data: AppData,
  input: Omit<Tournament, 'id'>,
): { data: AppData; error?: StoreError } {
  const club = data.clubs.find((c) => c.id === input.clubId);
  if (!club) return { data, error: { code: 'NOT_FOUND', message: 'Club not found' } };
  if (!isValidTournamentRange(input.startsAt, input.endsAt)) {
    return { data, error: { code: 'VALIDATION', message: 'Invalid tournament schedule' } };
  }
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
}

export function updateTournament(
  data: AppData,
  id: string,
  input: Partial<Omit<Tournament, 'id'>>,
): { data: AppData; error?: StoreError } {
  const existing = data.tournaments.find((t) => t.id === id);
  if (!existing) return { data, error: { code: 'NOT_FOUND', message: 'Tournament not found' } };
  const merged = { ...existing, ...input };
  const club = data.clubs.find((c) => c.id === merged.clubId);
  if (!club) return { data, error: { code: 'NOT_FOUND', message: 'Club not found' } };
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
  const tournaments = data.tournaments.map((t) => (t.id === id ? merged : t));
  return { data: { ...data, tournaments } };
}

export function deleteTournament(data: AppData, id: string): AppData {
  return {
    ...data,
    tournaments: data.tournaments.filter((t) => t.id !== id),
    tournamentRegistrations: data.tournamentRegistrations.filter((r) => r.tournamentId !== id),
    bookings: data.bookings.map((b) =>
      b.tournamentId === id ? { ...b, tournamentId: null } : b,
    ),
    scorecards: data.scorecards.filter((s) => s.tournamentId !== id),
  };
}

export function registerForTournament(
  data: AppData,
  input: { tournamentId: string; playerId: string; groupId: string },
): { data: AppData; error?: StoreError } {
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
    return {
      data,
      error: { code: 'ELIGIBILITY', message: 'Your handicap is not eligible for this flight' },
    };
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
}

export function reviewRegistration(
  data: AppData,
  input: {
    registrationId: string;
    reviewerId: string;
    decision: 'approved' | 'rejected';
    groupId?: string;
    startingHole?: number;
    teeTime?: string;
  },
): { data: AppData; error?: StoreError } {
  const registration = data.tournamentRegistrations.find((r) => r.id === input.registrationId);
  if (!registration) {
    return { data, error: { code: 'NOT_FOUND', message: 'Registration not found' } };
  }
  if (registration.status !== 'pending') {
    return { data, error: { code: 'VALIDATION', message: 'This registration was already reviewed' } };
  }

  const tournament = data.tournaments.find((t) => t.id === registration.tournamentId);
  if (!tournament) {
    return { data, error: { code: 'NOT_FOUND', message: 'Tournament not found' } };
  }

  const club = data.clubs.find((c) => c.id === tournament.clubId);
  if (!club) return { data, error: { code: 'NOT_FOUND', message: 'Club not found' } };

  if (input.decision === 'rejected') {
    const tournamentRegistrations = data.tournamentRegistrations.map((r) =>
      r.id === registration.id
        ? {
            ...r,
            status: 'rejected' as const,
            reviewedAt: new Date().toISOString(),
            reviewedBy: input.reviewerId,
          }
        : r,
    );
    return { data: { ...data, tournamentRegistrations } };
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

  const group = tournament.groups.find((g) => g.id === input.groupId);
  if (!group) {
    return { data, error: { code: 'VALIDATION', message: 'Selected flight is not part of this tournament' } };
  }

  const tee = new Date(input.teeTime).getTime();
  const tStart = new Date(tournament.startsAt).getTime();
  const tEnd = new Date(tournament.endsAt).getTime();
  if (tee < tStart || tee > tEnd) {
    return {
      data,
      error: { code: 'VALIDATION', message: 'Tee time must fall within the tournament schedule' },
    };
  }

  const teeDate = input.teeTime.slice(0, 10);
  const teeTimeStr = `${String(new Date(input.teeTime).getHours()).padStart(2, '0')}:${String(new Date(input.teeTime).getMinutes()).padStart(2, '0')}`;

  if (!isTeeTimeWithinClubHours(club, teeTimeStr)) {
    return {
      data,
      error: { code: 'OUTSIDE_HOURS', message: 'Tee time is outside club operating hours' },
    };
  }

  const teeTimeIso = teeTimeToIso(teeDate, teeTimeStr);
  const doubleBooked = data.bookings.some(
    (b) =>
      b.clubId === tournament.clubId &&
      b.status !== 'cancelled' &&
      b.teeTime === teeTimeIso,
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

  const tournamentRegistrations = data.tournamentRegistrations.map((r) =>
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
  );

  return {
    data: {
      ...data,
      tournamentRegistrations,
      bookings: [...data.bookings, booking],
    },
  };
}

export function createBooking(
  data: AppData,
  input: {
    playerId: string;
    clubId: string;
    tournamentId: string | null;
    date: string;
    time: string;
  },
): { data: AppData; error?: StoreError } {
  const club = data.clubs.find((c) => c.id === input.clubId);
  if (!club) return { data, error: { code: 'NOT_FOUND', message: 'Club not found' } };

  if (!isTeeTimeWithinClubHours(club, input.time)) {
    return {
      data,
      error: { code: 'OUTSIDE_HOURS', message: 'Tee time is outside club operating hours' },
    };
  }

  const teeTimeIso = teeTimeToIso(input.date, input.time);
  const doubleBooked = data.bookings.some(
    (b) =>
      b.clubId === input.clubId &&
      b.status !== 'cancelled' &&
      b.teeTime === teeTimeIso,
  );
  if (doubleBooked) {
    return { data, error: { code: 'DOUBLE_BOOKING', message: 'This tee time is already booked' } };
  }

  if (!input.tournamentId) {
    const blocked = isCasualBookingBlocked(data.tournaments, input.clubId, teeTimeIso);
    if (blocked) {
      return {
        data,
        error: {
          code: 'TOURNAMENT_BLOCK',
          message: `Casual bookings are paused during ${blocked.name}`,
        },
      };
    }
  }

  if (input.tournamentId) {
    const tournament = data.tournaments.find((t) => t.id === input.tournamentId);
    if (!tournament) {
      return { data, error: { code: 'NOT_FOUND', message: 'Tournament not found' } };
    }
    if (tournament.clubId !== input.clubId) {
      return { data, error: { code: 'VALIDATION', message: 'Tournament does not belong to this club' } };
    }
    const bookingTime = new Date(teeTimeIso).getTime();
    const tStart = new Date(tournament.startsAt).getTime();
    const tEnd = new Date(tournament.endsAt).getTime();
    if (bookingTime < tStart || bookingTime > tEnd) {
      return {
        data,
        error: { code: 'ELIGIBILITY', message: 'Booking time is outside tournament schedule' },
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
}

export function updateBookingStatus(
  data: AppData,
  id: string,
  status: Booking['status'],
): AppData {
  const bookings = data.bookings.map((b) => (b.id === id ? { ...b, status } : b));
  return { ...data, bookings };
}

export function createOrUpdateScorecard(
  data: AppData,
  input: {
    tournamentId: string;
    playerId: string;
    holeScores: number[];
    status: Scorecard['status'];
  },
): { data: AppData; error?: StoreError } {
  const tournament = data.tournaments.find((t) => t.id === input.tournamentId);
  if (!tournament) return { data, error: { code: 'NOT_FOUND', message: 'Tournament not found' } };

  const club = data.clubs.find((c) => c.id === tournament.clubId);
  const holeCount = club?.holeCount ?? 18;
  if (input.holeScores.length !== holeCount) {
    return {
      data,
      error: {
        code: 'VALIDATION',
        message: `Enter a score for all ${holeCount} holes`,
      },
    };
  }

  const totalScore = input.holeScores.reduce((a, b) => a + b, 0);
  const existing = data.scorecards.find(
    (s) => s.tournamentId === input.tournamentId && s.playerId === input.playerId,
  );

  if (existing) {
    const scorecards = data.scorecards.map((s) =>
      s.id === existing.id
        ? { ...s, holeScores: input.holeScores, totalScore, status: input.status }
        : s,
    );
    return { data: { ...data, scorecards } };
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
}

export function joinClub(data: AppData, userId: string, clubId: string): AppData {
  const users = data.users.map((u) =>
    u.id === userId && u.role === 'player' ? { ...u, clubId } : u,
  );
  return { ...data, users };
}
