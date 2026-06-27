import type { AppData, Session, User } from '@/types/entities';
import { seedData } from '@/data/seed';
import { normalizeClubHoleCount } from '@/lib/clubs/holeCount';
import { normalizeTournament } from '@/lib/tournaments/normalize';

const DATA_KEY = 'teevo:data';
const SESSION_KEY = 'teevo:session';

function normalizeUser(user: User): User {
  return {
    ...user,
    handicap: user.handicap ?? null,
  };
}

function normalizeData(data: AppData): AppData {
  const raw = data as AppData & { tournamentRegistrations?: AppData['tournamentRegistrations'] };
  return {
    ...data,
    users: data.users.map(normalizeUser),
    clubs: data.clubs.map((club) => ({
      ...club,
      logoUrl: club.logoUrl ?? null,
      holeCount: normalizeClubHoleCount(club.holeCount),
    })),
    tournaments: data.tournaments.map((t) =>
      normalizeTournament(t as unknown as Record<string, unknown>),
    ),
    tournamentRegistrations: raw.tournamentRegistrations ?? [],
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) {
      const seeded = seedData();
      saveData(seeded);
      return seeded;
    }
    return normalizeData(JSON.parse(raw) as AppData);
  } catch {
    const seeded = seedData();
    saveData(seeded);
    return seeded;
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null): void {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function resetData(): AppData {
  const seeded = seedData();
  saveData(seeded);
  return seeded;
}
