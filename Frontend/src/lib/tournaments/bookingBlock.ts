import type { Tournament } from '@/types/entities';

const BLOCKING_STATUSES = new Set<Tournament['status']>(['upcoming', 'active']);

export function isCasualBookingBlocked(
  tournaments: Tournament[],
  clubId: string,
  teeTimeIso: string,
): Tournament | null {
  const tee = new Date(teeTimeIso).getTime();
  if (Number.isNaN(tee)) return null;

  return (
    tournaments.find(
      (t) =>
        t.clubId === clubId &&
        t.blockOtherBookings &&
        BLOCKING_STATUSES.has(t.status) &&
        new Date(t.startsAt).getTime() <= tee &&
        tee <= new Date(t.endsAt).getTime(),
    ) ?? null
  );
}

export function hasActiveBookingBlock(tournaments: Tournament[], clubId: string): boolean {
  const now = Date.now();
  return tournaments.some(
    (t) =>
      t.clubId === clubId &&
      t.blockOtherBookings &&
      BLOCKING_STATUSES.has(t.status) &&
      new Date(t.startsAt).getTime() <= now &&
      now <= new Date(t.endsAt).getTime(),
  );
}
