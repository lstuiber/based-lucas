# Oura OAuth2 Flows

Oura uses OAuth2 authorization code grant. The refresh token is stored in an `httpOnly` cookie on the backend — the browser never sees it. The access token lives only in JS memory and is never persisted.

## 1. First-Time Login

User visits the homepage with no existing session.

```
Browser (index.html)           Express                     Oura
        │                         │                           │
        │  GET /api/auth/status   │                           │
        │  (sends cookies)        │                           │
        │────────────────────────>│                           │
        │  { loggedIn: false }    │                           │
        │<────────────────────────│                           │
        │                         │                           │
   "Connect Oura" button appears  │                           │
        │                         │                           │
   user clicks button             │                           │
        │                         │                           │
        │  redirect to Oura authorize URL                     │
        │────────────────────────────────────────────────────>│
        │                         │                           │
        │            user approves in Oura UI                 │
        │                         │                           │
        │  redirect to dashboard.html?code=ABC                │
        │<────────────────────────────────────────────────────│
        │                         │                           │
        │  POST /api/oura/token   │                           │
        │  { code: ABC }          │                           │
        │────────────────────────>│                           │
        │                         │  POST /oauth/token        │
        │                         │  { code, client_id, ... } │
        │                         │──────────────────────────>│
        │                         │  { access_token,          │
        │                         │    refresh_token }        │
        │                         │<──────────────────────────│
        │                         │                           │
        │                  refresh_token saved to httpOnly cookie
        │                         │                           │
        │  { access_token }       │                           │
        │<────────────────────────│                           │
        │                         │                           │
   history.replaceState()         │                           │
   (removes ?code= from URL)      │                           │
        │                         │                           │
        │  POST /api/sleep        │                           │
        │  { accessToken }        │                           │
        │────────────────────────>│                           │
        │                         │  GET /v2/usercollection/sleep
        │                         │──────────────────────────>│
        │                         │  sleep data               │
        │                         │<──────────────────────────│
        │  sleep data             │                           │
        │<────────────────────────│                           │
```

## 2. Return Visit / Page Reload

User visits `dashboard.html` directly or reloads — no `?code=` in the URL.

```
Browser (dashboard.html)       Express                     Oura
        │                         │                           │
   no ?code= in URL               │                           │
        │                         │                           │
        │  POST /api/refresh      │                           │
        │  (sends refreshToken cookie automatically)          │
        │────────────────────────>│                           │
        │                         │  POST /oauth/token        │
        │                         │  { grant_type:            │
        │                         │    refresh_token, ... }   │
        │                         │──────────────────────────>│
        │                         │  { access_token,          │
        │                         │    refresh_token }        │
        │                         │<──────────────────────────│
        │                         │                           │
        │                  new refresh_token replaces old cookie (rotation)
        │                         │                           │
        │  { access_token }       │                           │
        │<────────────────────────│                           │
        │                         │                           │
        │  POST /api/sleep ...    │                           │
```

## 3. Expired Access Token Mid-Session

The Oura access token has a limited lifetime. When it expires, the next data request returns 401.

```
Browser                        Express                     Oura
        │                         │                           │
        │  POST /api/sleep        │                           │
        │  { accessToken: old }   │                           │
        │────────────────────────>│                           │
        │                         │  GET /v2/usercollection/sleep
        │                         │──────────────────────────>│
        │                         │  401 Unauthorized         │
        │                         │<──────────────────────────│
        │  401                    │                           │
        │<────────────────────────│                           │
        │                         │                           │
        │  POST /api/refresh      │                           │
        │────────────────────────>│                           │
        │                         │  POST /oauth/token        │
        │                         │  { grant_type:            │
        │                         │    refresh_token }        │
        │                         │──────────────────────────>│
        │                         │  { access_token (new) }   │
        │                         │<──────────────────────────│
        │  { access_token }       │                           │
        │<────────────────────────│                           │
        │                         │                           │
        │  POST /api/sleep (retry)│                           │
        │  { accessToken: new }   │                           │
        │────────────────────────>│                           │
        │  sleep data             │                           │
        │<────────────────────────│                           │
```

## 4. No Refresh Token (Session Expired or Never Logged In)

```
Browser (dashboard.html)       Express
        │                         │
   no ?code= in URL               │
        │                         │
        │  POST /api/refresh      │
        │────────────────────────>│
        │                         │
        │   no refreshToken cookie → 401 { error: 'No refresh token' }
        │<────────────────────────│
        │                         │
   catch → redirect to /          │
        │                         │
   "Connect Oura" button shown    │
   (restart flow 1)               │
```

## Token Storage

| Token | Where stored | Accessible to JS |
|---|---|---|
| `access_token` | JS memory only | Yes (required to call APIs) |
| `refresh_token` | `httpOnly` cookie on backend | No (XSS-safe) |

The `access_token` is intentionally not persisted to `localStorage` — losing it on reload is acceptable because the refresh token can silently issue a new one in flow 2.
