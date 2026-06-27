import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_ACTIVE_TOURNAMENTS_TITLE,
  getDashboardPageDescription,
} from './dashboardPage';

describe('DASHBOARD_ACTIVE_TOURNAMENTS_TITLE', () => {
  it('labels the active tournaments panel and stat', () => {
    expect(DASHBOARD_ACTIVE_TOURNAMENTS_TITLE).toBe('Active Tournaments');
  });
});

describe('getDashboardPageDescription', () => {
  it('returns role-specific copy for each user role', () => {
    expect(getDashboardPageDescription('superadmin')).toBe(
      'A platform-wide view of every club, tournament, booking, and user on Teevo—track key metrics, monitor the tournament pipeline, review recent activity and scorecards, and stay ahead of upcoming tee times and registrations from one central dashboard.',
    );
    expect(getDashboardPageDescription('club_admin')).toBe(
      'Tournaments, registrations, and upcoming bookings.',
    );
    expect(getDashboardPageDescription('player')).toBe(
      'See your upcoming tournaments and confirmed tee times.',
    );
  });
});
