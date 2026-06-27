import { describe, expect, it } from 'vitest';
import { seedData } from '@/data/seed';
import * as actions from './actions';

describe('store actions', () => {
  const base = seedData();

  it('rejects duplicate email on createUser', () => {
    const { error } = actions.createUser(base, {
      name: 'Duplicate',
      email: 'superadmin@teevo.app',
      role: 'player',
      clubId: null,
      handicap: null,
    });
    expect(error?.code).toBe('DUPLICATE_EMAIL');
  });

  it('rejects double booking', () => {
    const booking = base.bookings[0];
    const date = new Date(booking.teeTime).toISOString().slice(0, 10);
    const time = `${String(new Date(booking.teeTime).getHours()).padStart(2, '0')}:${String(new Date(booking.teeTime).getMinutes()).padStart(2, '0')}`;
    const { error } = actions.createBooking(base, {
      playerId: 'user-player-sam',
      clubId: booking.clubId,
      tournamentId: null,
      date,
      time,
    });
    expect(error?.code).toBe('DOUBLE_BOOKING');
  });

  it('creates user with unique email', () => {
    const { data, error } = actions.createUser(base, {
      name: 'New Player',
      email: 'new@player.teevo.app',
      role: 'player',
      clubId: 'club-pine-valley',
      handicap: null,
    });
    expect(error).toBeUndefined();
    expect(data.users.some((u) => u.email === 'new@player.teevo.app')).toBe(true);
  });

  it('computes scorecard total', () => {
    const { data } = actions.createOrUpdateScorecard(base, {
      tournamentId: 'tournament-summer-classic',
      playerId: 'user-player-sam',
      holeScores: Array(9).fill(5),
      status: 'submitted',
    });
    const card = data.scorecards.find((s) => s.playerId === 'user-player-sam');
    expect(card?.totalScore).toBe(45);
  });
});
