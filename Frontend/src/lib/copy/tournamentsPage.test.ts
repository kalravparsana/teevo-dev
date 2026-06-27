import { describe, expect, it } from 'vitest';
import { getTournamentsPageDescription } from './tournamentsPage';

describe('getTournamentsPageDescription', () => {
  it('returns role-specific copy for each user role', () => {
    expect(getTournamentsPageDescription('superadmin')).toBe(
      'View and manage golf tournaments across the platform.',
    );
    expect(getTournamentsPageDescription('club_admin')).toBe(
      'Schedule and manage golf tournaments for your club.',
    );
    expect(getTournamentsPageDescription('player')).toBe(
      'Browse upcoming tournaments and view schedules at your clubs.',
    );
  });
});
