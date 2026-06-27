# Backend Plan — Teevo R1 / Release 1.0.0

**Execution mode:** Serverless (AWS CloudFormation)

**Integration UI root:** `Frontend/` (bootstrapped from `launchpad-frontend/`)

## Discovery summary

The Teevo SPA stores all domain data in `localStorage` via `src/lib/storage.ts` and `src/data/seed.ts`. `TeevoContext` exposes CRUD and business actions mirroring `src/store/actions.ts`. Auth is email-based demo login against seeded users — no external OAuth SDK in the UI today.

**Entities:** users, clubs, tournaments, tournamentRegistrations, bookings, scorecards

**Upload surface:** `ImageUpload` on Clubs page stores club logos as data URLs (max 512 KB). Requires S3 presigned URLs in cloud mode.

## Auth — Amazon Cognito

- Cognito User Pool + app client (email username, hosted UI)
- Optional Google federation via Cognito identity provider (env-driven)
- Flow: `GET /api/v1/auth/login-url` → hosted UI → `POST /api/v1/auth/callback` (code + PKCE) → JWT verification (JWKS) → map `email` claim to DynamoDB user
- Protected routes: API Gateway JWT authorizer + handler-side role checks
- `VITE_USE_LOCAL_DATA=true` preserves demo email login for local dev without Cognito

**Env vars (names only):**

| Backend | Frontend |
|---------|----------|
| `COGNITO_USER_POOL_ID` | `VITE_COGNITO_USER_POOL_ID` |
| `COGNITO_CLIENT_ID` | `VITE_COGNITO_CLIENT_ID` |
| `COGNITO_REGION` | `VITE_COGNITO_REGION` |
| `COGNITO_DOMAIN` | `VITE_COGNITO_DOMAIN` |
| `OAUTH_REDIRECT_URI` | `VITE_OAUTH_REDIRECT_URI` |
| `JWT_ISSUER` | — |

## Network

- API Gateway HTTP API with CORS for CloudFront origin
- Throttling: default stage limits
- No VPC (Lambdas access DynamoDB/S3 via AWS service endpoints)

## Compute

- Single Node.js 20 Lambda (`ApiHandler`) behind API Gateway HTTP API
- Routes mirror `/api/v1/<resource>[/:id]` structure

## Storage

- Dedicated private S3 bucket `UploadsBucket` for club logos
- `POST /api/v1/uploads/presign` returns presigned PUT URL
- `GET` logos served via presigned GET or public CloudFront path (presigned GET)

## Database — DynamoDB

Single table `TeevoTable`:

| PK | SK | Purpose |
|----|-----|---------|
| `USER#<id>` | `PROFILE` | User record |
| `CLUB#<id>` | `PROFILE` | Club record |
| `TOURNAMENT#<id>` | `PROFILE` | Tournament (+ embedded groups) |
| `REGISTRATION#<id>` | `PROFILE` | Tournament registration |
| `BOOKING#<id>` | `PROFILE` | Booking |
| `SCORECARD#<id>` | `PROFILE` | Scorecard |

GSI1 (`Gsi1Index`): `gsi1pk=TYPE#<entity>`, `gsi1sk=<id>` — list all entities of a type

GSI2 (`Gsi2Index`): `gsi2pk=EMAIL#<email>`, `gsi2sk=USER#<id>` — email lookup for auth sync

Seed script ports `seed.ts` data into DynamoDB after deploy.

## API contract

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/v1/health` | Health check | Public |
| GET | `/api/v1/auth/login-url` | Cognito authorize URL | Public |
| POST | `/api/v1/auth/callback` | Exchange code for tokens | Public |
| GET | `/api/v1/auth/session` | Current user profile | JWT |
| GET | `/api/v1/app-data` | Full AppData bundle | JWT |
| GET/POST | `/api/v1/users` | List/create users | JWT (superadmin) |
| GET/PATCH/DELETE | `/api/v1/users/:id` | User CRUD | JWT |
| GET/POST | `/api/v1/clubs` | List/create clubs | JWT |
| GET/PATCH/DELETE | `/api/v1/clubs/:id` | Club CRUD | JWT |
| GET/POST | `/api/v1/tournaments` | Tournament CRUD | JWT |
| GET/PATCH/DELETE | `/api/v1/tournaments/:id` | Tournament CRUD | JWT |
| GET/POST | `/api/v1/tournament-registrations` | Registrations | JWT |
| PATCH | `/api/v1/tournament-registrations/:id` | Review registration | JWT |
| GET/POST | `/api/v1/bookings` | Bookings | JWT |
| PATCH | `/api/v1/bookings/:id` | Update booking status | JWT |
| GET/POST | `/api/v1/scorecards` | Scorecards | JWT |
| PATCH | `/api/v1/scorecards/:id` | Update scorecard | JWT |
| POST | `/api/v1/uploads/presign` | S3 presigned URL | JWT |

Response shapes match `src/types/entities.ts` exactly. Errors: `{ error: { code, message } }`.

## Shared utility layer

`backend/src/lib/`: config, auth (JWT verify), dynamodb client, errors, response helpers, validation (zod), logger.

## Frontend wire-up

1. `src/lib/api/client.ts` — fetch with Bearer token
2. `src/lib/api/resources.ts` — REST calls matching endpoints above
3. `src/lib/auth/cognito.ts` — hosted UI redirect + callback handling
4. `TeevoContext` — when `VITE_API_BASE_URL` set, load/mutate via API; else localStorage
5. `LoginPage` — Cognito sign-in when API mode; demo accounts when local mode
6. `ImageUpload` — presigned upload when API mode

## Environment examples

- `backend/.env.example` — runtime vars for local Lambda testing
- `Frontend/.env.example` — `VITE_API_BASE_URL`, Cognito vars, `VITE_USE_LOCAL_DATA`

## Unified deploy script

Root `deploy.sh`:

- Phase A: `npm ci && npm run build && npm run package:lambda` → S3 upload using `LambdaCodeS3Bucket`/`LambdaCodeS3Key` from `backend/parameters.json`
- Phase B: backend CFN (`BACKEND_STACK_NAME`)
- Phase C: frontend CFN (`FRONTEND_STACK_NAME`) in parallel
- Phase D (documented): capture outputs → set `VITE_*` → `npm run build` → `s3 sync` → CloudFront invalidation

## Integration steps

1. Deploy backend + frontend stacks
2. Run `npm run seed` in backend with table name from stack output
3. Set `Frontend/.env` from stack outputs
4. Build and sync SPA to S3
5. Create Cognito users matching seed emails (or run seed which creates app users; users sign up via hosted UI)

## Assumptions

- Cognito users must use seed emails to map to app roles on first login (auto-provision player role if unknown email)
- Club logos in API mode use S3 keys stored in `logoUrl` field (HTTPS URL)
- Local dev defaults to `VITE_USE_LOCAL_DATA=true` for zero-config preview

## Backend Components Coverage Report

| Component | Application (planned files) | Infrastructure (planned IaC resources) |
|-----------|----------------------------|------------------------------------------|
| Auth | `src/lib/auth.ts`, `src/handlers/auth.ts`, `src/handlers/router.ts` | `AWS::Cognito::UserPool`, `AWS::Cognito::UserPoolClient`, `AWS::ApiGatewayV2::Authorizer` |
| Network | `src/lib/response.ts` (CORS headers) | `AWS::ApiGatewayV2::Api`, `AWS::ApiGatewayV2::Stage` (throttling), CORS config |
| Compute | `src/handlers/api.ts`, `src/handlers/router.ts`, `src/services/*` | `AWS::Lambda::Function`, `AWS::ApiGatewayV2::Integration`, `AWS::ApiGatewayV2::Route` |
| Storage | `src/handlers/uploads.ts` | `AWS::S3::Bucket` (UploadsBucket), IAM `s3:PutObject`/`GetObject` on Lambda role |
| Database | `src/lib/dynamodb.ts`, `src/services/*`, `scripts/seed.mjs` | `AWS::DynamoDB::Table` (TeevoTable + GSI1 + GSI2) |
| Frontend Hosting | `Frontend/vite build` (Step 3) | `Frontend/cloudformation-template.yaml`: S3 + CloudFront OAC |
