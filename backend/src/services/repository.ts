import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { loadConfig } from '../lib/config.js';
import { entityKeys, getDocClient, gsi1, gsi2Email } from '../lib/dynamodb.js';
import type {
  AppData,
  Booking,
  Club,
  Scorecard,
  Tournament,
  TournamentRegistration,
  User,
} from '../lib/types.js';
import { notFound } from '../lib/errors.js';

type EntityType = 'USER' | 'CLUB' | 'TOURNAMENT' | 'REGISTRATION' | 'BOOKING' | 'SCORECARD';

function stripMeta<T extends Record<string, unknown>>(item: T): Omit<T, 'pk' | 'sk' | 'gsi1pk' | 'gsi1sk' | 'gsi2pk' | 'gsi2sk' | 'entityType'> {
  const { pk, sk, gsi1pk, gsi1sk, gsi2pk, gsi2sk, entityType, ...rest } = item;
  return rest as Omit<T, 'pk' | 'sk' | 'gsi1pk' | 'gsi1sk' | 'gsi2pk' | 'gsi2sk' | 'entityType'>;
}

async function listByType<T>(entityType: EntityType): Promise<T[]> {
  const cfg = loadConfig();
  const result = await getDocClient().send(
    new QueryCommand({
      TableName: cfg.tableName,
      IndexName: 'Gsi1Index',
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: { ':pk': `TYPE#${entityType}` },
    }),
  );
  return (result.Items ?? []).map((item) => stripMeta(item) as T);
}

async function getById<T>(entityType: EntityType, id: string): Promise<T | null> {
  const cfg = loadConfig();
  const keys = entityKeys(entityType, id);
  const result = await getDocClient().send(
    new GetCommand({ TableName: cfg.tableName, Key: keys }),
  );
  return result.Item ? (stripMeta(result.Item) as T) : null;
}

async function putEntity(entityType: EntityType, record: { id: string; email?: string }): Promise<void> {
  const cfg = loadConfig();
  const id = String(record.id);
  const item: Record<string, unknown> = {
    ...(record as Record<string, unknown>),
    ...entityKeys(entityType, id),
    ...gsi1(entityType, id),
    entityType,
  };
  if (entityType === 'USER' && record.email) {
    Object.assign(item, gsi2Email(String(record.email), id));
  }
  await getDocClient().send(new PutCommand({ TableName: cfg.tableName, Item: item }));
}

async function deleteEntity(entityType: EntityType, id: string): Promise<void> {
  const cfg = loadConfig();
  await getDocClient().send(
    new DeleteCommand({ TableName: cfg.tableName, Key: entityKeys(entityType, id) }),
  );
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const cfg = loadConfig();
  const result = await getDocClient().send(
    new QueryCommand({
      TableName: cfg.tableName,
      IndexName: 'Gsi2Index',
      KeyConditionExpression: 'gsi2pk = :email',
      ExpressionAttributeValues: { ':email': `EMAIL#${email.toLowerCase()}` },
      Limit: 1,
    }),
  );
  const item = result.Items?.[0];
  return item ? (stripMeta(item) as User) : null;
}

export async function loadAppData(): Promise<AppData> {
  const [users, clubs, tournaments, tournamentRegistrations, bookings, scorecards] =
    await Promise.all([
      listByType<User>('USER'),
      listByType<Club>('CLUB'),
      listByType<Tournament>('TOURNAMENT'),
      listByType<TournamentRegistration>('REGISTRATION'),
      listByType<Booking>('BOOKING'),
      listByType<Scorecard>('SCORECARD'),
    ]);
  return { users, clubs, tournaments, tournamentRegistrations, bookings, scorecards };
}

export const repo = {
  getUser: (id: string) => getById<User>('USER', id),
  listUsers: () => listByType<User>('USER'),
  putUser: (user: User) => putEntity('USER', user),
  deleteUser: (id: string) => deleteEntity('USER', id),

  getClub: (id: string) => getById<Club>('CLUB', id),
  listClubs: () => listByType<Club>('CLUB'),
  putClub: (club: Club) => putEntity('CLUB', club),
  deleteClub: (id: string) => deleteEntity('CLUB', id),

  getTournament: (id: string) => getById<Tournament>('TOURNAMENT', id),
  listTournaments: () => listByType<Tournament>('TOURNAMENT'),
  putTournament: (t: Tournament) => putEntity('TOURNAMENT', t),
  deleteTournament: (id: string) => deleteEntity('TOURNAMENT', id),

  getRegistration: (id: string) => getById<TournamentRegistration>('REGISTRATION', id),
  listRegistrations: () => listByType<TournamentRegistration>('REGISTRATION'),
  putRegistration: (r: TournamentRegistration) => putEntity('REGISTRATION', r),
  deleteRegistration: (id: string) => deleteEntity('REGISTRATION', id),

  getBooking: (id: string) => getById<Booking>('BOOKING', id),
  listBookings: () => listByType<Booking>('BOOKING'),
  putBooking: (b: Booking) => putEntity('BOOKING', b),
  deleteBooking: (id: string) => deleteEntity('BOOKING', id),

  getScorecard: (id: string) => getById<Scorecard>('SCORECARD', id),
  listScorecards: () => listByType<Scorecard>('SCORECARD'),
  putScorecard: (s: Scorecard) => putEntity('SCORECARD', s),
  deleteScorecard: (id: string) => deleteEntity('SCORECARD', id),

  loadAppData,
  findUserByEmail,
};

export async function createPresignedUpload(key: string, contentType: string): Promise<string> {
  const cfg = loadConfig();
  const s3 = new S3Client({ region: cfg.region });
  const command = new PutObjectCommand({
    Bucket: cfg.uploadsBucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: 900 });
}

export async function seedAll(data: AppData): Promise<void> {
  for (const user of data.users) await putEntity('USER', user);
  for (const club of data.clubs) await putEntity('CLUB', club);
  for (const tournament of data.tournaments) await putEntity('TOURNAMENT', tournament);
  for (const reg of data.tournamentRegistrations) await putEntity('REGISTRATION', reg);
  for (const booking of data.bookings) await putEntity('BOOKING', booking);
  for (const scorecard of data.scorecards) await putEntity('SCORECARD', scorecard);
}

export async function clearTable(): Promise<void> {
  const cfg = loadConfig();
  const result = await getDocClient().send(new ScanCommand({ TableName: cfg.tableName }));
  for (const item of result.Items ?? []) {
    await getDocClient().send(
      new DeleteCommand({
        TableName: cfg.tableName,
        Key: { pk: item.pk, sk: item.sk },
      }),
    );
  }
}

export async function requireUser(id: string): Promise<User> {
  const user = await repo.getUser(id);
  if (!user) throw notFound('User not found');
  return user;
}
