import { describe, expect, it } from 'vitest';
import { seedData } from '@/data/seed';
import {
  countTournamentsByStatus,
  countUsersByRole,
  getActiveTournaments,
  getClubSummaries,
  getPlatformActivity,
  getUpcomingBookings,
} from './platformMetrics';

describe('platformMetrics', () => {
  const data = seedData();

  it('counts users by role', () => {
    expect(countUsersByRole(data.users)).toEqual({
      superadmin: 1,
      club_admin: 2,
      player: 3,
    });
  });

  it('counts tournaments by status', () => {
    const counts = countTournamentsByStatus(data.tournaments);
    expect(counts.upcoming).toBe(1);
    expect(counts.draft).toBe(1);
    expect(counts.active).toBe(1);
    expect(counts.completed).toBe(1);
  });

  it('summarizes each club', () => {
    const summaries = getClubSummaries(data);
    expect(summaries).toHaveLength(2);
    expect(summaries[0]?.activeTournamentCount).toBeGreaterThanOrEqual(1);
  });

  it('returns active tournaments sorted by start date', () => {
    const active = getActiveTournaments(data.tournaments);
    expect(active.length).toBe(3);
    expect(new Date(active[0]!.startsAt).getTime()).toBeLessThanOrEqual(
      new Date(active[1]!.startsAt).getTime(),
    );
  });

  it('returns only future confirmed bookings', () => {
    const upcoming = getUpcomingBookings(data.bookings);
    expect(upcoming.length).toBe(5);
    expect(upcoming.every((b) => b.status === 'confirmed')).toBe(true);
  });

  it('builds a merged platform activity feed', () => {
    const activity = getPlatformActivity(data, 20);
    expect(activity.length).toBeGreaterThan(0);
    expect(activity.some((a) => a.type === 'booking')).toBe(true);
    expect(activity.some((a) => a.type === 'tournament')).toBe(true);
    expect(activity.some((a) => a.type === 'scorecard')).toBe(true);
  });
});
