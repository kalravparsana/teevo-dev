import type { Booking, Club } from '@/types/entities';

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function generateTeeTimeSlots(club: Club): string[] {
  const start = parseTimeToMinutes(club.startTime);
  const end = parseTimeToMinutes(club.endTime);
  const slots: string[] = [];

  for (let t = start; t < end; t += club.teeTimeInterval) {
    slots.push(minutesToTimeString(t));
  }
  return slots;
}

export function teeTimeToIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function getBookedTimesForDate(
  bookings: Booking[],
  clubId: string,
  date: string,
): Set<string> {
  const booked = new Set<string>();
  for (const b of bookings) {
    if (b.clubId !== clubId || b.status === 'cancelled') continue;
    const d = new Date(b.teeTime);
    const dateKey = d.toISOString().slice(0, 10);
    if (dateKey === date) {
      const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      booked.add(time);
    }
  }
  return booked;
}

export function isTeeTimeWithinClubHours(club: Club, time: string): boolean {
  const t = parseTimeToMinutes(time);
  const start = parseTimeToMinutes(club.startTime);
  const end = parseTimeToMinutes(club.endTime);
  return t >= start && t < end;
}
