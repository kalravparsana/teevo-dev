import { describe, expect, it } from 'vitest';
import { getBookingsPageDescription } from './bookingsPage';

describe('getBookingsPageDescription', () => {
  it('returns role-specific copy for each user role', () => {
    expect(getBookingsPageDescription('superadmin')).toBe(
      'View and manage tee time bookings across the platform.',
    );
    expect(getBookingsPageDescription('club_admin')).toBe(
      'Schedule and manage tee time bookings for your club.',
    );
    expect(getBookingsPageDescription('player')).toBe(
      'Book tee times and manage your rounds.',
    );
  });
});
