import type { TournamentGroup, TournamentType } from '@/types/entities';

export const TOURNAMENT_TYPE_OPTIONS: { value: TournamentType; label: string }[] = [
  { value: 'stroke_play', label: 'Stroke play' },
  { value: 'match_play', label: 'Match play' },
  { value: 'stableford', label: 'Stableford' },
  { value: 'scramble', label: 'Scramble' },
];

export const DEFAULT_TOURNAMENT_GROUP_TEMPLATES: Omit<TournamentGroup, 'id'>[] = [
  { name: 'Championship Flight', minHandicap: 0, maxHandicap: 10 },
  { name: 'Member Flight', minHandicap: 11, maxHandicap: 24 },
  { name: 'Social Flight', minHandicap: 25, maxHandicap: 36 },
];

export function formatTournamentType(type: TournamentType): string {
  return TOURNAMENT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function formatHandicapRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return 'Any handicap';
  if (min === null) return `Up to ${max}`;
  if (max === null) return `${min}+`;
  return `${min}–${max}`;
}
