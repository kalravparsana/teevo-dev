import type { AppData, User } from '@/types/entities';
import { apiFetch } from '@/lib/api/client';

export async function fetchAppData(): Promise<AppData> {
  return apiFetch<AppData>('/api/v1/app-data');
}

export async function fetchSession(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>('/api/v1/auth/session');
}

export async function fetchLoginUrl(): Promise<{ url: string; state: string }> {
  return apiFetch<{ url: string; state: string }>('/api/v1/auth/login-url');
}

export async function exchangeAuthCode(code: string): Promise<{
  tokens: { access_token: string; id_token: string; refresh_token?: string };
  user: User;
}> {
  return apiFetch('/api/v1/auth/callback', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function presignUpload(
  filename: string,
  contentType: string,
): Promise<{ uploadUrl: string; key: string }> {
  return apiFetch('/api/v1/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ filename, contentType }),
  });
}

export async function createClubApi(input: Omit<import('@/types/entities').Club, 'id'>): Promise<void> {
  await apiFetch('/api/v1/clubs', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateClubApi(
  id: string,
  input: Partial<Omit<import('@/types/entities').Club, 'id'>>,
): Promise<void> {
  await apiFetch(`/api/v1/clubs/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export async function deleteClubApi(id: string): Promise<void> {
  await apiFetch(`/api/v1/clubs/${id}`, { method: 'DELETE' });
}

export async function createUserApi(input: Omit<User, 'id'>): Promise<void> {
  await apiFetch('/api/v1/users', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateUserApi(id: string, input: Partial<Omit<User, 'id'>>): Promise<void> {
  await apiFetch(`/api/v1/users/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export async function deleteUserApi(id: string): Promise<void> {
  await apiFetch(`/api/v1/users/${id}`, { method: 'DELETE' });
}

export async function createTournamentApi(
  input: Omit<import('@/types/entities').Tournament, 'id'>,
): Promise<void> {
  await apiFetch('/api/v1/tournaments', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateTournamentApi(
  id: string,
  input: Partial<Omit<import('@/types/entities').Tournament, 'id'>>,
): Promise<void> {
  await apiFetch(`/api/v1/tournaments/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export async function deleteTournamentApi(id: string): Promise<void> {
  await apiFetch(`/api/v1/tournaments/${id}`, { method: 'DELETE' });
}

export async function createBookingApi(input: {
  playerId: string;
  clubId: string;
  tournamentId: string | null;
  date: string;
  time: string;
}): Promise<void> {
  await apiFetch('/api/v1/bookings', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateBookingStatusApi(
  id: string,
  status: import('@/types/entities').Booking['status'],
): Promise<void> {
  await apiFetch(`/api/v1/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export async function saveScorecardApi(input: {
  tournamentId: string;
  playerId: string;
  holeScores: number[];
  status: import('@/types/entities').Scorecard['status'];
}): Promise<void> {
  await apiFetch('/api/v1/scorecards', { method: 'POST', body: JSON.stringify(input) });
}

export async function registerForTournamentApi(input: {
  tournamentId: string;
  groupId: string;
}): Promise<void> {
  await apiFetch('/api/v1/tournament-registrations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function reviewRegistrationApi(
  id: string,
  input: {
    decision: 'approved' | 'rejected';
    groupId?: string;
    startingHole?: number;
    teeTime?: string;
  },
): Promise<void> {
  await apiFetch(`/api/v1/tournament-registrations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function joinClubApi(userId: string, clubId: string): Promise<void> {
  await apiFetch(`/api/v1/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ clubId }),
  });
}
