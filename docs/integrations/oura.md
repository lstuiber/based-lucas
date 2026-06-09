# Oura Integration

## Overview

Connects to the Oura Ring API v2 to pull sleep, readiness, and activity scores.

**External API spec:** `openapi-1.34.json` (Oura API v2, OpenAPI 3.1.0)

## OAuth2 Setup

1. Register an application at https://cloud.ouraring.com/oauth/applications
2. Set redirect URI to `http://localhost:5173/dashboard`
3. Add credentials to `.env` — see [development.md](../development.md)

**Scopes requested**

| Scope | Data |
|---|---|
| `daily` | Daily activity, readiness, sleep summaries |
| `heartrate` | Heart rate time series |
| `personal` | Age, weight, biological sex, email |

For the full OAuth2 flow see [auth/oura-oauth.md](../auth/oura-oauth.md).

## Frontend code

| File | Purpose |
|---|---|
| `src/api/oura.ts` | Typed fetch wrappers for all endpoints |
| `src/hooks/useOuraAuth.ts` | Auth hook — code exchange or token refresh on mount |
| `src/pages/Dashboard.tsx` | Fetches all three scores in parallel, renders tiles |
| `src/pages/Home.tsx` | Auth status check, Connect Oura button |
| `src/components/ScoreTile.tsx` | Reusable score tile — accepts `label` + `DailyScore` data |
| `src/types/oura.ts` | `DailyScore`, `DailySleep`, `DailyReadiness`, `DailyActivity` interfaces |

## Endpoints Used

| Frontend call | Backend route | Oura endpoint | Returns |
|---|---|---|---|
| `getAuthStatus()` | `GET /api/auth/status` | — | `{ loggedIn }` |
| `exchangeCode(code)` | `POST /api/oura/token` | `POST /oauth/token` | `{ access_token }` |
| `refreshAccessToken()` | `POST /api/refresh` | `POST /oauth/token` | `{ access_token }` |
| `fetchDailySleep(token)` | `POST /api/sleep` | `GET /v2/usercollection/daily_sleep` | `DailySleep \| null` |
| `fetchDailyReadiness(token)` | `POST /api/readiness` | `GET /v2/usercollection/daily_readiness` | `DailyReadiness \| null` |
| `fetchDailyActivity(token)` | `POST /api/activity` | `GET /v2/usercollection/daily_activity` | `DailyActivity \| null` |

All three score endpoints use yesterday→today date range and return the most recent record.

## Endpoints Available (not yet integrated)

| Endpoint | Data |
|---|---|
| `/v2/usercollection/heartrate` | Heart rate time series |
| `/v2/usercollection/personal_info` | User profile |
| `/v2/usercollection/workout` | Workout sessions |
| `/v2/usercollection/daily_spo2` | Blood oxygen |

## Known Gaps

- Date range is computed server-side as yesterday → today; no user-configurable range
- No webhook subscription — all data fetched on-demand
