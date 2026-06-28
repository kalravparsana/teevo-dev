import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { randomBytes } from 'node:crypto';
import { loadConfig } from '../lib/config.js';
import { buildLoginUrl, exchangeCodeForTokens, verifyBearerToken } from '../lib/auth.js';
import { forbidden, unauthorized } from '../lib/errors.js';
import { corsHeaders, handleError, json } from '../lib/response.js';
import type { AuthUser, User } from '../lib/types.js';
import { createPresignedUpload, repo } from '../services/repository.js';
import { domain, ensureUserForAuth, mutate } from '../services/domain.js';

type RouteContext = {
  method: string;
  path: string;
  pathParams: Record<string, string>;
  body: unknown;
  authUser: AuthUser | null;
  appUser: User | null;
  origin?: string;
};

function parseBody(event: APIGatewayProxyEventV2): unknown {
  if (!event.body) return null;
  try {
    return JSON.parse(event.body);
  } catch {
    return null;
  }
}

function matchRoute(method: string, path: string): { pattern: RegExp; params: string[] } | null {
  const routes: Array<{ method: string; pattern: string; params: string[] }> = [
    { method: 'GET', pattern: '^/health$', params: [] },
    { method: 'GET', pattern: '^/api/v1/health$', params: [] },
    { method: 'GET', pattern: '^/api/v1/auth/login-url$', params: [] },
    { method: 'POST', pattern: '^/api/v1/auth/callback$', params: [] },
    { method: 'GET', pattern: '^/api/v1/auth/session$', params: [] },
    { method: 'GET', pattern: '^/api/v1/app-data$', params: [] },
    { method: 'GET', pattern: '^/api/v1/users$', params: [] },
    { method: 'POST', pattern: '^/api/v1/users$', params: [] },
    { method: 'GET', pattern: '^/api/v1/users/([^/]+)$', params: ['id'] },
    { method: 'PATCH', pattern: '^/api/v1/users/([^/]+)$', params: ['id'] },
    { method: 'DELETE', pattern: '^/api/v1/users/([^/]+)$', params: ['id'] },
    { method: 'GET', pattern: '^/api/v1/clubs$', params: [] },
    { method: 'POST', pattern: '^/api/v1/clubs$', params: [] },
    { method: 'GET', pattern: '^/api/v1/clubs/([^/]+)$', params: ['id'] },
    { method: 'PATCH', pattern: '^/api/v1/clubs/([^/]+)$', params: ['id'] },
    { method: 'DELETE', pattern: '^/api/v1/clubs/([^/]+)$', params: ['id'] },
    { method: 'GET', pattern: '^/api/v1/tournaments$', params: [] },
    { method: 'POST', pattern: '^/api/v1/tournaments$', params: [] },
    { method: 'GET', pattern: '^/api/v1/tournaments/([^/]+)$', params: ['id'] },
    { method: 'PATCH', pattern: '^/api/v1/tournaments/([^/]+)$', params: ['id'] },
    { method: 'DELETE', pattern: '^/api/v1/tournaments/([^/]+)$', params: ['id'] },
    { method: 'GET', pattern: '^/api/v1/tournament-registrations$', params: [] },
    { method: 'POST', pattern: '^/api/v1/tournament-registrations$', params: [] },
    { method: 'PATCH', pattern: '^/api/v1/tournament-registrations/([^/]+)$', params: ['id'] },
    { method: 'GET', pattern: '^/api/v1/bookings$', params: [] },
    { method: 'POST', pattern: '^/api/v1/bookings$', params: [] },
    { method: 'PATCH', pattern: '^/api/v1/bookings/([^/]+)$', params: ['id'] },
    { method: 'GET', pattern: '^/api/v1/scorecards$', params: [] },
    { method: 'POST', pattern: '^/api/v1/scorecards$', params: [] },
    { method: 'PATCH', pattern: '^/api/v1/scorecards/([^/]+)$', params: ['id'] },
    { method: 'POST', pattern: '^/api/v1/uploads/presign$', params: [] },
  ];
  for (const route of routes) {
    if (route.method !== method) continue;
    const re = new RegExp(route.pattern);
    if (re.test(path)) return { pattern: re, params: route.params };
  }
  return null;
}

function extractParams(path: string, match: { pattern: RegExp; params: string[] }): Record<string, string> {
  const m = path.match(match.pattern);
  const out: Record<string, string> = {};
  match.params.forEach((name, i) => {
    out[name] = m?.[i + 1] ?? '';
  });
  return out;
}

async function requireAppUser(ctx: RouteContext): Promise<User> {
  if (!ctx.appUser) throw unauthorized();
  return ctx.appUser;
}

function requireRole(user: User, roles: User['role'][]): void {
  if (!roles.includes(user.role)) throw forbidden();
}

export async function routeRequest(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> {
  const origin = event.headers.origin;
  const method = event.requestContext.http.method;
  const path = event.rawPath;

  if (method === 'GET' && (path === '/health' || path === '/api/v1/health')) {
    return json(200, { status: 'ok' }, origin, ['*']);
  }

  const cfg = loadConfig();

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(origin, cfg.corsOrigins) };
  }

  const match = matchRoute(method, path);
  if (!match) {
    return json(404, { error: { code: 'NOT_FOUND', message: 'Route not found' } }, origin, cfg.corsOrigins);
  }

  const pathParams = extractParams(path, match);
  const body = parseBody(event);
  const isPublic =
    path === '/health' ||
    path === '/api/v1/health' ||
    path === '/api/v1/auth/login-url' ||
    path === '/api/v1/auth/callback';

  let authUser: AuthUser | null = null;
  let appUser: User | null = null;

  if (!isPublic) {
    authUser = await verifyBearerToken(event.headers.authorization);
    appUser = await ensureUserForAuth(authUser.email);
  }

  const ctx: RouteContext = { method, path, pathParams, body, authUser, appUser, origin };

  try {
    return await dispatch(ctx, cfg.corsOrigins);
  } catch (err) {
    return handleError(err, origin, cfg.corsOrigins);
  }
}

async function dispatch(
  ctx: RouteContext,
  corsOrigins: string[],
): Promise<APIGatewayProxyStructuredResultV2> {
  const { path, method, body, pathParams, origin } = ctx;

  if ((path === '/health' || path === '/api/v1/health') && method === 'GET') {
    return json(200, { status: 'ok' }, origin, corsOrigins);
  }

  if (path === '/api/v1/auth/login-url' && method === 'GET') {
    const state = randomBytes(16).toString('hex');
    return json(200, { url: buildLoginUrl(state), state }, origin, corsOrigins);
  }

  if (path === '/api/v1/auth/callback' && method === 'POST') {
    const code = (body as { code?: string })?.code;
    if (!code) return json(400, { error: { code: 'VALIDATION', message: 'code is required' } }, origin, corsOrigins);
    const tokens = await exchangeCodeForTokens(code);
    const user = await ensureUserForAuth(
      JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString()).email as string,
    );
    return json(200, { tokens, user }, origin, corsOrigins);
  }

  if (path === '/api/v1/auth/session' && method === 'GET') {
    const user = await requireAppUser(ctx);
    return json(200, { user }, origin, corsOrigins);
  }

  if (path === '/api/v1/app-data' && method === 'GET') {
    await requireAppUser(ctx);
    const data = await repo.loadAppData();
    return json(200, data, origin, corsOrigins);
  }

  if (path === '/api/v1/uploads/presign' && method === 'POST') {
    await requireAppUser(ctx);
    const { filename, contentType } = body as { filename?: string; contentType?: string };
    if (!filename || !contentType) {
      return json(400, { error: { code: 'VALIDATION', message: 'filename and contentType are required' } }, origin, corsOrigins);
    }
    const key = `uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const uploadUrl = await createPresignedUpload(key, contentType);
    return json(200, { uploadUrl, key, publicUrl: `s3://${process.env.UPLOADS_BUCKET_NAME}/${key}` }, origin, corsOrigins);
  }

  const user = await requireAppUser(ctx);

  if (path === '/api/v1/users' && method === 'GET') {
    requireRole(user, ['superadmin']);
    return json(200, { users: await repo.listUsers() }, origin, corsOrigins);
  }
  if (path === '/api/v1/users' && method === 'POST') {
    requireRole(user, ['superadmin']);
    const result = await mutate((data) => domain.createUser(data, body as Omit<User, 'id'>));
    if (result.error) return json(400, { error: result.error }, origin, corsOrigins);
    return json(201, { users: result.data!.users }, origin, corsOrigins);
  }
  if (path.startsWith('/api/v1/users/') && method === 'PATCH') {
    requireRole(user, ['superadmin']);
    const result = await mutate((data) => domain.updateUser(data, pathParams.id, body as Partial<User>));
    if (result.error) return json(400, { error: result.error }, origin, corsOrigins);
    return json(200, { user: result.data!.users.find((u) => u.id === pathParams.id) }, origin, corsOrigins);
  }
  if (path.startsWith('/api/v1/users/') && method === 'DELETE') {
    requireRole(user, ['superadmin']);
    await mutate((data) => ({ data: domain.deleteUser(data, pathParams.id) }));
    return json(204, {}, origin, corsOrigins);
  }

  if (path === '/api/v1/clubs' && method === 'GET') {
    return json(200, { clubs: await repo.listClubs() }, origin, corsOrigins);
  }
  if (path === '/api/v1/clubs' && method === 'POST') {
    requireRole(user, ['superadmin', 'club_admin']);
    const result = await mutate((data) => ({ data: domain.createClub(data, body as never) }));
    return json(201, { clubs: result.data!.clubs }, origin, corsOrigins);
  }
  if (path.startsWith('/api/v1/clubs/') && method === 'PATCH') {
    requireRole(user, ['superadmin', 'club_admin']);
    const result = await mutate((data) => ({ data: domain.updateClub(data, pathParams.id, body as never) }));
    return json(200, { club: result.data!.clubs.find((c) => c.id === pathParams.id) }, origin, corsOrigins);
  }
  if (path.startsWith('/api/v1/clubs/') && method === 'DELETE') {
    requireRole(user, ['superadmin']);
    await mutate((data) => ({ data: domain.deleteClub(data, pathParams.id) }));
    return json(204, {}, origin, corsOrigins);
  }

  if (path === '/api/v1/tournaments' && method === 'GET') {
    return json(200, { tournaments: await repo.listTournaments() }, origin, corsOrigins);
  }
  if (path === '/api/v1/tournaments' && method === 'POST') {
    requireRole(user, ['superadmin', 'club_admin']);
    const result = await mutate((data) => domain.createTournament(data, body as never));
    if (result.error) return json(400, { error: result.error }, origin, corsOrigins);
    return json(201, { tournaments: result.data!.tournaments }, origin, corsOrigins);
  }
  if (path.startsWith('/api/v1/tournaments/') && method === 'PATCH') {
    requireRole(user, ['superadmin', 'club_admin']);
    const result = await mutate((data) => domain.updateTournament(data, pathParams.id, body as never));
    if (result.error) return json(400, { error: result.error }, origin, corsOrigins);
    return json(200, { tournament: result.data!.tournaments.find((t) => t.id === pathParams.id) }, origin, corsOrigins);
  }
  if (path.startsWith('/api/v1/tournaments/') && method === 'DELETE') {
    requireRole(user, ['superadmin', 'club_admin']);
    await mutate((data) => ({ data: domain.deleteTournament(data, pathParams.id) }));
    return json(204, {}, origin, corsOrigins);
  }

  if (path === '/api/v1/tournament-registrations' && method === 'POST') {
    const input = body as { tournamentId: string; groupId: string };
    const result = await mutate((data) =>
      domain.registerForTournament(data, { ...input, playerId: user.id }),
    );
    if (result.error) return json(400, { error: result.error }, origin, corsOrigins);
    return json(201, { tournamentRegistrations: result.data!.tournamentRegistrations }, origin, corsOrigins);
  }
  if (path.startsWith('/api/v1/tournament-registrations/') && method === 'PATCH') {
    requireRole(user, ['superadmin', 'club_admin']);
    const input = body as {
      decision: 'approved' | 'rejected';
      groupId?: string;
      startingHole?: number;
      teeTime?: string;
    };
    const result = await mutate((data) =>
      domain.reviewRegistration(data, { registrationId: pathParams.id, reviewerId: user.id, ...input }),
    );
    if (result.error) return json(400, { error: result.error }, origin, corsOrigins);
    return json(200, { tournamentRegistrations: result.data!.tournamentRegistrations }, origin, corsOrigins);
  }

  if (path === '/api/v1/bookings' && method === 'POST') {
    const input = body as {
      playerId: string;
      clubId: string;
      tournamentId: string | null;
      date: string;
      time: string;
    };
    const result = await mutate((data) => domain.createBooking(data, input));
    if (result.error) return json(400, { error: result.error }, origin, corsOrigins);
    return json(201, { bookings: result.data!.bookings }, origin, corsOrigins);
  }
  if (path.startsWith('/api/v1/bookings/') && method === 'PATCH') {
    const { status } = body as { status: string };
    const result = await mutate((data) => ({
      data: domain.updateBookingStatus(data, pathParams.id, status as never),
    }));
    return json(200, { bookings: result.data!.bookings }, origin, corsOrigins);
  }

  if (path === '/api/v1/scorecards' && method === 'POST') {
    const input = body as {
      tournamentId: string;
      playerId: string;
      holeScores: number[];
      status: string;
    };
    const result = await mutate((data) => domain.saveScorecard(data, input as never));
    if (result.error) return json(400, { error: result.error }, origin, corsOrigins);
    return json(201, { scorecards: result.data!.scorecards }, origin, corsOrigins);
  }

  return json(404, { error: { code: 'NOT_FOUND', message: 'Route not found' } }, origin, corsOrigins);
}
