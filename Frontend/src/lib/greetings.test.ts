import { describe, expect, it } from 'vitest';
import {
  formatDashboardGreeting,
  getTimeOfDay,
  getTimeOfDayGreeting,
} from './greetings';

function atLocalHour(hour: number): Date {
  const d = new Date(2026, 4, 30, hour, 0, 0, 0);
  return d;
}

describe('greetings', () => {
  it('maps hours to time of day', () => {
    expect(getTimeOfDay(atLocalHour(6))).toBe('morning');
    expect(getTimeOfDay(atLocalHour(11))).toBe('morning');
    expect(getTimeOfDay(atLocalHour(12))).toBe('afternoon');
    expect(getTimeOfDay(atLocalHour(16))).toBe('afternoon');
    expect(getTimeOfDay(atLocalHour(17))).toBe('evening');
    expect(getTimeOfDay(atLocalHour(23))).toBe('evening');
  });

  it('returns the matching greeting phrase', () => {
    expect(getTimeOfDayGreeting(atLocalHour(9))).toBe('Good morning');
    expect(getTimeOfDayGreeting(atLocalHour(14))).toBe('Good afternoon');
    expect(getTimeOfDayGreeting(atLocalHour(20))).toBe('Good evening');
  });

  it('formats dashboard greeting with first name', () => {
    expect(formatDashboardGreeting('Casey', atLocalHour(9))).toBe('Good morning, Casey');
    expect(formatDashboardGreeting('Casey', atLocalHour(14))).toBe('Good afternoon, Casey');
    expect(formatDashboardGreeting('Casey', atLocalHour(20))).toBe('Good evening, Casey');
  });

  it('omits name when empty', () => {
    expect(formatDashboardGreeting('   ', atLocalHour(9))).toBe('Good morning');
  });
});
