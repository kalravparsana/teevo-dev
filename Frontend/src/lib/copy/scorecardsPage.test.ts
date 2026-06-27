import { describe, expect, it } from 'vitest';
import { getScorecardsPageDescription } from './scorecardsPage';

describe('getScorecardsPageDescription', () => {
  it('returns role-specific copy for each user role', () => {
    expect(getScorecardsPageDescription('superadmin')).toBe(
      'View scorecards and tournament round results across the platform.',
    );
    expect(getScorecardsPageDescription('club_admin')).toBe(
      'View player scorecards and tournament round results for your club.',
    );
    expect(getScorecardsPageDescription('player')).toBe(
      'Enter 18-hole scores and view your tournament rounds.',
    );
  });
});
