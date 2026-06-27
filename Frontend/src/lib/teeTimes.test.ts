import { describe, expect, it } from 'vitest';
import { generateTeeTimeSlots, isTeeTimeWithinClubHours } from './teeTimes';
import type { Club } from '@/types/entities';

const club: Club = {
  id: 'c1',
  name: 'Test',
  location: 'Test',
  logoUrl: null,
  holeCount: 18,
  startTime: '08:00',
  endTime: '10:00',
  teeTimeInterval: 30,
};

describe('teeTimes', () => {
  it('generates slots at interval', () => {
    expect(generateTeeTimeSlots(club)).toEqual(['08:00', '08:30', '09:00', '09:30']);
  });

  it('validates hours', () => {
    expect(isTeeTimeWithinClubHours(club, '08:00')).toBe(true);
    expect(isTeeTimeWithinClubHours(club, '10:00')).toBe(false);
  });
});
