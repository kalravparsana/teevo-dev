import { describe, expect, it } from 'vitest';
import {
  CLUB_HOLE_COUNTS,
  defaultHoleScores,
  formatClubHoleCount,
  isClubHoleCount,
  normalizeClubHoleCount,
} from './holeCount';

describe('holeCount', () => {
  it('normalizes invalid values to 18', () => {
    expect(normalizeClubHoleCount(undefined)).toBe(18);
    expect(normalizeClubHoleCount(12)).toBe(18);
  });

  it('accepts standard hole counts', () => {
    for (const count of CLUB_HOLE_COUNTS) {
      expect(isClubHoleCount(count)).toBe(true);
      expect(normalizeClubHoleCount(count)).toBe(count);
    }
  });

  it('builds default score arrays', () => {
    expect(defaultHoleScores(9)).toHaveLength(9);
    expect(defaultHoleScores(18)).toHaveLength(18);
  });

  it('formats hole count labels', () => {
    expect(formatClubHoleCount(9)).toBe('9 holes');
    expect(formatClubHoleCount(1)).toBe('1 hole');
  });
});
