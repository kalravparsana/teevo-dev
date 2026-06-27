/**
 * Seeds DynamoDB with Teevo demo data (mirrors Frontend/src/data/seed.ts).
 * Usage: TEEVO_TABLE_NAME=... AWS_REGION=... node scripts/seed.mjs
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const CLUB_1 = 'club-pine-valley';
const CLUB_2 = 'club-oak-ridge';
const USER_SUPER = 'user-superadmin';
const USER_ADMIN_1 = 'user-admin-pine';
const USER_ADMIN_2 = 'user-admin-oak';
const USER_PLAYER_1 = 'user-player-alex';
const USER_PLAYER_2 = 'user-player-sam';
const USER_PLAYER_3 = 'user-player-jordan';
const TOURNAMENT_1 = 'tournament-spring-open';
const TOURNAMENT_2 = 'tournament-summer-classic';
const TOURNAMENT_3 = 'tournament-fall-invitational';
const TOURNAMENT_4 = 'tournament-winter-classic';
const BOOKING_1 = 'booking-1';
const BOOKING_2 = 'booking-2';
const BOOKING_3 = 'booking-3';
const BOOKING_4 = 'booking-4';
const BOOKING_5 = 'booking-5';
const SCORECARD_1 = 'scorecard-1';
const SCORECARD_2 = 'scorecard-2';
const SCORECARD_3 = 'scorecard-3';
const GROUP_SPRING_CHAMP = 'group-spring-championship';
const GROUP_SPRING_MEMBER = 'group-spring-member';
const GROUP_SPRING_SOCIAL = 'group-spring-social';
const GROUP_FALL_CHAMP = 'group-fall-championship';
const GROUP_FALL_MEMBER = 'group-fall-member';
const REG_SPRING_ALEX = 'registration-spring-alex';
const REG_FALL_JORDAN = 'reg-fall-jordan';

function daysFromNow(days, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function seedData() {
  const now = new Date();
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  return {
    clubs: [
      {
        id: CLUB_1,
        name: 'Pine Valley Golf Club',
        location: 'Augusta, GA',
        logoUrl: '/clubs/pine-valley.svg',
        holeCount: 18,
        startTime: '07:00',
        endTime: '18:00',
        teeTimeInterval: 10,
      },
      {
        id: CLUB_2,
        name: 'Oak Ridge Country Club',
        location: 'Scottsdale, AZ',
        logoUrl: '/clubs/oak-ridge.svg',
        holeCount: 9,
        startTime: '06:30',
        endTime: '19:00',
        teeTimeInterval: 12,
      },
    ],
    users: [
      { id: USER_SUPER, name: 'Jordan Masters', email: 'superadmin@teevo.app', role: 'superadmin', clubId: null, handicap: null },
      { id: USER_ADMIN_1, name: 'Casey Brooks', email: 'admin@pinevalley.teevo.app', role: 'club_admin', clubId: CLUB_1, handicap: null },
      { id: USER_ADMIN_2, name: 'Riley Hart', email: 'admin@oakridge.teevo.app', role: 'club_admin', clubId: CLUB_2, handicap: null },
      { id: USER_PLAYER_1, name: 'Alex Morgan', email: 'alex@player.teevo.app', role: 'player', clubId: CLUB_1, handicap: 8 },
      { id: USER_PLAYER_2, name: 'Sam Chen', email: 'sam@player.teevo.app', role: 'player', clubId: CLUB_2, handicap: 22 },
      { id: USER_PLAYER_3, name: 'Jordan Lee', email: 'jordan.lee@player.teevo.app', role: 'player', clubId: CLUB_1, handicap: 15 },
    ],
    tournaments: [
      {
        id: TOURNAMENT_1,
        name: 'Spring Open Championship',
        clubId: CLUB_1,
        type: 'stroke_play',
        groups: [
          { id: GROUP_SPRING_CHAMP, name: 'Championship Flight', minHandicap: 0, maxHandicap: 10 },
          { id: GROUP_SPRING_MEMBER, name: 'Member Flight', minHandicap: 11, maxHandicap: 24 },
          { id: GROUP_SPRING_SOCIAL, name: 'Social Flight', minHandicap: 25, maxHandicap: 36 },
        ],
        startsAt: daysFromNow(7, 7, 0),
        endsAt: daysFromNow(14, 18, 0),
        status: 'upcoming',
        blockOtherBookings: true,
      },
      {
        id: TOURNAMENT_2,
        name: 'Summer Classic',
        clubId: CLUB_2,
        type: 'stableford',
        groups: [
          { id: 'group-summer-member', name: 'Member Flight', minHandicap: 0, maxHandicap: 24 },
          { id: 'group-summer-social', name: 'Social Flight', minHandicap: 25, maxHandicap: null },
        ],
        startsAt: daysFromNow(14, 8, 0),
        endsAt: daysFromNow(21, 17, 30),
        status: 'draft',
        blockOtherBookings: false,
      },
      {
        id: TOURNAMENT_3,
        name: 'Fall Invitational',
        clubId: CLUB_1,
        type: 'stroke_play',
        groups: [
          { id: GROUP_FALL_CHAMP, name: 'Championship Flight', minHandicap: 0, maxHandicap: 12 },
          { id: GROUP_FALL_MEMBER, name: 'Member Flight', minHandicap: 13, maxHandicap: 28 },
        ],
        startsAt: daysFromNow(-1, 7, 30),
        endsAt: daysFromNow(7, 18, 0),
        status: 'active',
        blockOtherBookings: true,
      },
      {
        id: TOURNAMENT_4,
        name: 'Winter Classic',
        clubId: CLUB_2,
        type: 'scramble',
        groups: [{ id: 'group-winter-open', name: 'Open Flight', minHandicap: null, maxHandicap: null }],
        startsAt: daysFromNow(-7, 9, 0),
        endsAt: daysFromNow(-1, 16, 0),
        status: 'completed',
        blockOtherBookings: false,
      },
    ],
    tournamentRegistrations: [
      {
        id: REG_SPRING_ALEX,
        tournamentId: TOURNAMENT_1,
        playerId: USER_PLAYER_1,
        groupId: GROUP_SPRING_CHAMP,
        status: 'pending',
        startingHole: null,
        teeTime: null,
        requestedAt: daysFromNow(-2, 10, 0),
        reviewedAt: null,
        reviewedBy: null,
      },
      {
        id: REG_FALL_JORDAN,
        tournamentId: TOURNAMENT_3,
        playerId: USER_PLAYER_3,
        groupId: GROUP_FALL_MEMBER,
        status: 'approved',
        startingHole: 1,
        teeTime: daysFromNow(1, 14, 0),
        requestedAt: daysFromNow(-3, 11, 0),
        reviewedAt: daysFromNow(-2, 9, 30),
        reviewedBy: USER_ADMIN_1,
      },
    ],
    bookings: [
      { id: BOOKING_1, playerId: USER_PLAYER_1, clubId: CLUB_1, tournamentId: TOURNAMENT_1, teeTime: daysFromNow(2, 9, 0), status: 'confirmed' },
      { id: BOOKING_2, playerId: USER_PLAYER_2, clubId: CLUB_2, tournamentId: TOURNAMENT_2, teeTime: daysFromNow(3, 10, 30), status: 'confirmed' },
      { id: BOOKING_3, playerId: USER_PLAYER_3, clubId: CLUB_1, tournamentId: TOURNAMENT_3, teeTime: daysFromNow(1, 14, 0), status: 'confirmed' },
      { id: BOOKING_4, playerId: USER_PLAYER_1, clubId: CLUB_1, tournamentId: null, teeTime: daysFromNow(5, 8, 0), status: 'confirmed' },
      { id: BOOKING_5, playerId: USER_PLAYER_2, clubId: CLUB_2, tournamentId: TOURNAMENT_4, teeTime: daysFromNow(4, 11, 0), status: 'confirmed' },
    ],
    scorecards: [
      {
        id: SCORECARD_1,
        tournamentId: TOURNAMENT_3,
        playerId: USER_PLAYER_1,
        clubId: CLUB_1,
        holeScores: [4, 5, 3, 4, 4, 5, 3, 4, 4, 4, 5, 3, 4, 4, 5, 3, 4, 4],
        totalScore: 72,
        status: 'submitted',
        roundDate: now.toISOString(),
      },
      {
        id: SCORECARD_2,
        tournamentId: TOURNAMENT_3,
        playerId: USER_PLAYER_3,
        clubId: CLUB_1,
        holeScores: [5, 4, 4, 5, 4, 4, 4, 5, 4, 4, 4, 5, 4, 4, 4, 5, 4, 5],
        totalScore: 78,
        status: 'draft',
        roundDate: yesterday.toISOString(),
      },
      {
        id: SCORECARD_3,
        tournamentId: TOURNAMENT_4,
        playerId: USER_PLAYER_3,
        clubId: CLUB_2,
        holeScores: [4, 4, 4, 5, 4, 3, 4, 4, 5],
        totalScore: 37,
        status: 'submitted',
        roundDate: lastWeek.toISOString(),
      },
    ],
  };
}

function entityKeys(type, id) {
  return { pk: `${type}#${id}`, sk: 'PROFILE' };
}

function gsi1(type, id) {
  return { gsi1pk: `TYPE#${type}`, gsi1sk: id };
}

function gsi2Email(email, userId) {
  return { gsi2pk: `EMAIL#${email.toLowerCase()}`, gsi2sk: `USER#${userId}` };
}

async function putEntity(doc, table, entityType, record) {
  const id = record.id;
  const item = {
    ...record,
    ...entityKeys(entityType, id),
    ...gsi1(entityType, id),
    entityType,
  };
  if (entityType === 'USER' && record.email) {
    Object.assign(item, gsi2Email(record.email, id));
  }
  await doc.send(new PutCommand({ TableName: table, Item: item }));
}

const tableName = process.env.TEEVO_TABLE_NAME;
const region = process.env.AWS_REGION ?? 'us-east-1';

if (!tableName) {
  console.error('TEEVO_TABLE_NAME is required');
  process.exit(1);
}

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
const data = seedData();

for (const user of data.users) await putEntity(doc, tableName, 'USER', user);
for (const club of data.clubs) await putEntity(doc, tableName, 'CLUB', club);
for (const t of data.tournaments) await putEntity(doc, tableName, 'TOURNAMENT', t);
for (const r of data.tournamentRegistrations) await putEntity(doc, tableName, 'REGISTRATION', r);
for (const b of data.bookings) await putEntity(doc, tableName, 'BOOKING', b);
for (const s of data.scorecards) await putEntity(doc, tableName, 'SCORECARD', s);

console.log(`Seeded ${tableName}`);
