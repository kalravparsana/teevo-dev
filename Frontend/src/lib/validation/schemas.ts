import { z } from 'zod';
import { CLUB_HOLE_COUNTS } from '@/lib/clubs/holeCount';
import { TOURNAMENT_TYPE_OPTIONS } from '@/lib/tournaments/constants';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['superadmin', 'club_admin', 'player']),
  clubId: z.string().nullable(),
  handicap: z.number().min(0).max(54).nullable().optional(),
});

const clubLogoUrlSchema = z
  .string()
  .min(1, 'Club logo is required')
  .refine(
    (value) => value.startsWith('data:image/') || /^https?:\/\//.test(value),
    'Upload a valid image file (PNG, JPG, WebP, or SVG)',
  );

const clubLogoUrlOptionalSchema = z
  .string()
  .nullable()
  .refine(
    (value) =>
      value === null ||
      value.startsWith('data:image/') ||
      /^https?:\/\//.test(value),
    'Upload a valid image file (PNG, JPG, WebP, or SVG)',
  );

const clubHoleCountSchema = z
  .number()
  .int('Hole count must be a whole number')
  .refine(
    (value) => (CLUB_HOLE_COUNTS as readonly number[]).includes(value),
    `Choose ${CLUB_HOLE_COUNTS.join(', ')} holes`,
  );

const clubFieldsSchema = z.object({
  name: z.string().min(1, 'Club name is required'),
  location: z.string().min(1, 'Location is required'),
  holeCount: clubHoleCountSchema,
  startTime: z.string().regex(timeRegex, 'Use HH:MM format'),
  endTime: z.string().regex(timeRegex, 'Use HH:MM format'),
  teeTimeInterval: z.number().min(5, 'Minimum 5 minutes').max(60, 'Maximum 60 minutes'),
});

const clubHoursRefine = <T extends z.ZodTypeAny>(schema: T) =>
  schema.refine((data: { startTime: string; endTime: string }) => data.startTime < data.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export const clubSchema = clubHoursRefine(
  clubFieldsSchema.extend({
    logoUrl: clubLogoUrlOptionalSchema,
  }),
);

export const clubCreateSchema = clubHoursRefine(
  clubFieldsSchema.extend({
    logoUrl: clubLogoUrlSchema,
  }),
);

const tournamentGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Group name is required'),
  minHandicap: z.number().min(0).max(54).nullable(),
  maxHandicap: z.number().min(0).max(54).nullable(),
});

const tournamentTypeValues = TOURNAMENT_TYPE_OPTIONS.map((o) => o.value) as [
  (typeof TOURNAMENT_TYPE_OPTIONS)[number]['value'],
  ...(typeof TOURNAMENT_TYPE_OPTIONS)[number]['value'][],
];

export const tournamentSchema = z
  .object({
    name: z.string().min(1, 'Tournament name is required'),
    clubId: z.string().min(1, 'Club is required'),
    type: z.enum(tournamentTypeValues),
    groups: z.array(tournamentGroupSchema).min(1, 'Add at least one group'),
    startsAt: z.string().min(1, 'Start date and time are required'),
    endsAt: z.string().min(1, 'End date and time are required'),
    status: z.enum(['draft', 'upcoming', 'active', 'completed', 'cancelled']),
    blockOtherBookings: z.boolean(),
  })
  .refine((data) => new Date(data.startsAt).getTime() <= new Date(data.endsAt).getTime(), {
    message: 'End must be on or after start',
    path: ['endsAt'],
  });

export const tournamentRegistrationSchema = z.object({
  tournamentId: z.string().min(1),
  groupId: z.string().min(1, 'Select a flight'),
});

export const registrationApprovalSchema = z.object({
  groupId: z.string().min(1, 'Assign a flight'),
  startingHole: z.number().int().min(1).max(36),
  teeTimeLocal: z.string().min(1, 'Assign a tee time'),
});

export const bookingSchema = z.object({
  clubId: z.string().min(1),
  tournamentId: z.string().nullable(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().regex(timeRegex, 'Select a tee time'),
});

export function scorecardSchemaForHoleCount(holeCount: number) {
  return z.object({
    tournamentId: z.string().min(1),
    holeScores: z
      .array(z.number().min(1, 'Minimum score is 1').max(15, 'Maximum score is 15'))
      .length(holeCount, `Enter a score for all ${holeCount} holes`),
  });
}

export type UserForm = z.infer<typeof userSchema>;
export type ClubForm = z.infer<typeof clubSchema>;
export type ClubCreateForm = z.infer<typeof clubCreateSchema>;
export type TournamentForm = z.infer<typeof tournamentSchema>;
export type BookingForm = z.infer<typeof bookingSchema>;

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
