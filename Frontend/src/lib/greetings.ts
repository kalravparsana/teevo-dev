export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

const TIME_OF_DAY_PHRASE: Record<TimeOfDay, string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
};

/** Local hour buckets: morning before noon, afternoon before 5pm, else evening. */
export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function getTimeOfDayGreeting(date: Date = new Date()): string {
  return TIME_OF_DAY_PHRASE[getTimeOfDay(date)];
}

export function formatDashboardGreeting(firstName: string, date: Date = new Date()): string {
  const trimmed = firstName.trim();
  const phrase = getTimeOfDayGreeting(date);
  return trimmed ? `${phrase}, ${trimmed}` : phrase;
}
