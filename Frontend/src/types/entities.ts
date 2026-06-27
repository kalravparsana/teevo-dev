export type UserRole = 'superadmin' | 'club_admin' | 'player';

export type TournamentStatus = 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';

export type TournamentType = 'stroke_play' | 'match_play' | 'stableford' | 'scramble';

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

export type ScorecardStatus = 'draft' | 'submitted';

export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clubId: string | null;
  handicap: number | null;
}

export interface Club {
  id: string;
  name: string;
  location: string;
  logoUrl: string | null;
  holeCount: number;
  startTime: string;
  endTime: string;
  teeTimeInterval: number;
}

export interface TournamentGroup {
  id: string;
  name: string;
  minHandicap: number | null;
  maxHandicap: number | null;
}

export interface Tournament {
  id: string;
  name: string;
  clubId: string;
  type: TournamentType;
  groups: TournamentGroup[];
  startsAt: string;
  endsAt: string;
  status: TournamentStatus;
  blockOtherBookings: boolean;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  playerId: string;
  groupId: string | null;
  status: RegistrationStatus;
  startingHole: number | null;
  teeTime: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface Booking {
  id: string;
  playerId: string;
  clubId: string;
  tournamentId: string | null;
  teeTime: string;
  status: BookingStatus;
}

export interface Scorecard {
  id: string;
  tournamentId: string;
  playerId: string;
  clubId: string;
  holeScores: number[];
  totalScore: number;
  status: ScorecardStatus;
  roundDate: string;
}

export interface AppData {
  users: User[];
  clubs: Club[];
  tournaments: Tournament[];
  tournamentRegistrations: TournamentRegistration[];
  bookings: Booking[];
  scorecards: Scorecard[];
}

export interface Session {
  userId: string;
}
