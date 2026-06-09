# Backend API Reference

Base URL: `http://localhost:3000` (proxied from `localhost:5173/api/*` by Vite in dev)

All requests that read/write the session require `credentials: 'include'` so the browser sends the `refreshToken` cookie.

---

## `GET /api/auth/status`

Checks whether the user has an active session without making any external API calls.

**Response**
```json
{ "loggedIn": true }
```

---

## `POST /api/oura/token`

Exchanges a one-time Oura authorization code for an access token. Called once after the OAuth2 redirect lands on `/dashboard?code=...`.

**Request body** (`application/x-www-form-urlencoded`)

| Field | Description |
|---|---|
| `code` | Authorization code from the Oura OAuth2 redirect |

**Response** `200`
```json
{ "access_token": "...", "token_type": "Bearer", "expires_in": 86400 }
```

**Side effect:** sets an `httpOnly` `refreshToken` cookie.

**Errors** — `400` malformed/spent code · `500` upstream error

---

## `POST /api/refresh`

Uses the `refreshToken` cookie to get a new access token. Called on page reload or after a `401` from a data endpoint.

**Request body:** none (token read from cookie)

**Response** `200`
```json
{ "access_token": "...", "token_type": "Bearer", "expires_in": 86400 }
```

**Side effect:** rotates the `refreshToken` cookie.

**Errors** — `401` no cookie present · `4xx/5xx` Oura rejected the token

---

## Score endpoints

`/api/sleep`, `/api/readiness`, and `/api/activity` all share the same contract. They proxy to Oura's daily score collections, fetching yesterday → today and returning the most recent record.

**Request body** (`application/x-www-form-urlencoded`)

| Field | Description |
|---|---|
| `accessToken` | Oura access token |

**Response** `200` — single daily score object, or `null` if no data for the range.

```json
{
  "id": "...",
  "day": "2026-06-07",
  "score": 82,
  "timestamp": "2026-06-07T00:00:00+00:00",
  "contributors": { ... }
}
```

**Errors** — `401` access token expired (client refreshes and retries) · `500` upstream error

| Route | Oura endpoint |
|---|---|
| `POST /api/sleep` | `GET /v2/usercollection/daily_sleep` |
| `POST /api/readiness` | `GET /v2/usercollection/daily_readiness` |
| `POST /api/activity` | `GET /v2/usercollection/daily_activity` |

---

---

## Withings endpoints

### `GET /api/withings/auth/status`

Checks whether the user has an active Withings session.

**Response**
```json
{ "loggedIn": true }
```

---

### `POST /api/withings/token`

Exchanges a one-time Withings authorization code for tokens. Called after the OAuth2 redirect lands on `/?code=...&state=withings`.

**Request body** (`application/x-www-form-urlencoded`)

| Field | Description |
|---|---|
| `code` | Authorization code from the Withings OAuth2 redirect |

**Response** `200`
```json
{ "access_token": "...", "userid": 363, "expires_in": 10800, "token_type": "Bearer" }
```

**Side effect:** sets an `httpOnly` `withingsRefreshToken` cookie.

**Errors** — `400` bad/spent code · `500` upstream error

---

### `POST /api/withings/refresh`

Uses the `withingsRefreshToken` cookie to get a new access token.

**Request body:** none (token read from cookie)

**Response** `200`
```json
{ "access_token": "...", "userid": 363, "expires_in": 10800 }
```

**Side effect:** rotates the `withingsRefreshToken` cookie.

**Errors** — `401` no cookie present · `4xx/5xx` Withings rejected the token

---

### `POST /api/withings/measures`

Fetches the most recent body composition measurement from the last 30 days.

**Request body** (`application/x-www-form-urlencoded`)

| Field | Description |
|---|---|
| `accessToken` | Withings access token |

**Response** `200`
```json
{
  "date": 1749340800,
  "weight": 165.3,
  "muscle": 89.2,
  "fat": 32.1,
  "water": 57.4
}
```

| Field | Unit | Notes |
|---|---|---|
| `date` | Unix timestamp | Date of measurement |
| `weight` | lbs | Converted from kg |
| `muscle` | lbs | Converted from kg |
| `fat` | lbs | Converted from kg |
| `water` | % | `hydration_kg / weight_kg × 100` — matches Withings app display |

Returns `null` if no measurements found in the last 30 days.

**Errors** — `401` access token expired · `400` Withings API error

---

## Average score endpoints

`/api/sleep/averages`, `/api/readiness/averages`, and `/api/activity/averages` fetch 90 days of history and return mean scores for 7, 30, and 90-day windows. Called lazily when the user expands a score tile.

**Request body** (`application/x-www-form-urlencoded`)

| Field | Description |
|---|---|
| `accessToken` | Oura access token |

**Response** `200`
```json
{ "avg7": 78, "avg30": 81, "avg90": 79 }
```

Values are rounded integers, or `null` if no scored records exist in that window.

| Route | Oura endpoint |
|---|---|
| `POST /api/sleep/averages` | `GET /v2/usercollection/daily_sleep` (90d) |
| `POST /api/readiness/averages` | `GET /v2/usercollection/daily_readiness` (90d) |
| `POST /api/activity/averages` | `GET /v2/usercollection/daily_activity` (90d) |
