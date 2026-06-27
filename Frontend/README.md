# Teevo — Golf Tournament Management

A web application for managing golf tournaments, club operations, tee time bookings, and scorecards. Supports three roles: **Superadmin**, **Club Admin**, and **Player**.

## Features

- **User Management** (Superadmin): Create, edit, and delete users; assign roles and clubs
- **Club Configuration** (Club Admin): Set operating hours and tee time intervals
- **Tournament Management**: Schedule tournaments with overlap validation
- **Bookings**: Book tee times with double-booking prevention
- **Scorecards**: Enter 18-hole scores and view tournament leaderboards

## Quick start

```bash
npm install
npm run dev
```

Open the app and sign in with a demo account (shown on the login page).

### Demo accounts

| Role | Email |
|------|-------|
| Superadmin | `superadmin@teevo.app` |
| Club Admin | `admin@pinevalley.teevo.app` |
| Player | `alex@player.teevo.app` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run test` | Run Vitest unit tests |
| `npm run lint` | ESLint |

## Architecture

- **React 19** + **Vite** + **TypeScript** + **Tailwind CSS 4**
- **React Router** for navigation with role-based route guards
- **Zod** for form validation
- **localStorage** persistence with seeded demo data (no backend required for MVP)

## Routes

| Path | Access |
|------|--------|
| `/dashboard` | All roles |
| `/clubs`, `/clubs/:clubId` | All roles |
| `/tournaments`, `/tournaments/:id` | All roles |
| `/bookings` | Club Admin, Player |
| `/scorecards` | Club Admin, Player |
| `/users` | Superadmin |

## Data model

- **User**: id, name, email, role, clubId
- **Club**: id, name, location, startTime, endTime, teeTimeInterval
- **Tournament**: id, name, clubId, startDate, endDate, status
- **Booking**: id, playerId, clubId, tournamentId, teeTime, status
- **Scorecard**: id, tournamentId, playerId, clubId, holeScores[18], totalScore, status, roundDate
