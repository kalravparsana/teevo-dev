import { describe, expect, it } from 'vitest';
import { getClubsPageDescription } from './clubsPage';

describe('getClubsPageDescription', () => {
  it('returns role-specific copy for each user role', () => {
    expect(getClubsPageDescription('superadmin')).toBe(
      'View and manage golf clubs on the platform.',
    );
    expect(getClubsPageDescription('club_admin')).toBe(
      'Manage club settings, operating hours, and tee time slots for your club.',
    );
    expect(getClubsPageDescription('player')).toBe(
      'Browse golf clubs and explore tee time availability.',
    );
  });
});
