/** Standard golf course hole counts — superadmin configures per club. */
export const CLUB_HOLE_COUNTS = [9, 18, 27, 36] as const;

export type ClubHoleCount = (typeof CLUB_HOLE_COUNTS)[number];

export const DEFAULT_CLUB_HOLE_COUNT: ClubHoleCount = 18;

export const CLUB_HOLE_COUNT_OPTIONS = CLUB_HOLE_COUNTS.map((count) => ({
  value: String(count),
  label:
    count === 9
      ? '9 holes (executive course)'
      : count === 18
        ? '18 holes (standard)'
        : count === 27
          ? '27 holes (three nines)'
          : '36 holes (four nines)',
}));

export function isClubHoleCount(value: number): value is ClubHoleCount {
  return (CLUB_HOLE_COUNTS as readonly number[]).includes(value);
}

export function normalizeClubHoleCount(value: unknown): ClubHoleCount {
  return typeof value === 'number' && isClubHoleCount(value) ? value : DEFAULT_CLUB_HOLE_COUNT;
}

export function defaultHoleScores(count: number = DEFAULT_CLUB_HOLE_COUNT): number[] {
  return Array(count).fill(4);
}

export function formatClubHoleCount(count: number): string {
  return `${count} hole${count === 1 ? '' : 's'}`;
}
