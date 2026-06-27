import { createId } from '@/lib/id';
import type { Tournament, TournamentGroup, TournamentType } from '@/types/entities';
import { DEFAULT_TOURNAMENT_GROUP_TEMPLATES } from './constants';

function defaultGroups(): TournamentGroup[] {
  return DEFAULT_TOURNAMENT_GROUP_TEMPLATES.map((g) => ({ ...g, id: createId() }));
}

function normalizeGroups(raw: unknown): TournamentGroup[] {
  if (!Array.isArray(raw) || raw.length === 0) return defaultGroups();
  return raw.map((g) => {
    const group = g as Partial<TournamentGroup>;
    return {
      id: group.id ?? createId(),
      name: group.name ?? 'Flight',
      minHandicap: group.minHandicap ?? null,
      maxHandicap: group.maxHandicap ?? null,
    };
  });
}

export function normalizeTournament(raw: Record<string, unknown>): Tournament {
  const legacy = raw as {
    id: string;
    name: string;
    clubId: string;
    status: Tournament['status'];
    startDate?: string;
    endDate?: string;
    startsAt?: string;
    endsAt?: string;
    type?: TournamentType;
    groups?: TournamentGroup[];
    blockOtherBookings?: boolean;
  };

  const startsAt = legacy.startsAt ?? legacy.startDate ?? new Date().toISOString();
  const endsAt = legacy.endsAt ?? legacy.endDate ?? endsAtWithEndOfDay(startsAt);

  return {
    id: legacy.id,
    name: legacy.name,
    clubId: legacy.clubId,
    type: legacy.type ?? 'stroke_play',
    groups: normalizeGroups(legacy.groups),
    startsAt,
    endsAt,
    status: legacy.status,
    blockOtherBookings: legacy.blockOtherBookings ?? false,
  };
}

function endsAtWithEndOfDay(startsAt: string): string {
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  d.setHours(18, 0, 0, 0);
  return d.toISOString();
}

export function createDefaultGroups(): TournamentGroup[] {
  return defaultGroups();
}
