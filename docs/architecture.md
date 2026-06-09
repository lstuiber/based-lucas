# Architecture

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router |
| Backend | Node.js, Express (JavaScript) |
| Database | PostgreSQL |
| Testing | Playwright |
| CI/CD | GitHub Actions (planned) |

## Project Structure

```
based-lucas/
├── index.html                  # Single HTML entry point
├── vite.config.ts              # Vite + React plugin + API proxy
├── tsconfig.json               # TypeScript config
├── src/
│   ├── main.tsx                # React entry — mounts <App> to #root
│   ├── App.tsx                 # React Router route definitions
│   ├── vite-env.d.ts           # Vite type references
│   ├── style.css               # Global styles
│   ├── types/
│   │   ├── oura.ts             # Oura API TypeScript interfaces
│   │   └── withings.ts         # Withings API TypeScript interfaces
│   ├── api/
│   │   ├── oura.ts             # Typed fetch wrappers for all Oura endpoints
│   │   ├── withings.ts         # Typed fetch wrappers for Withings endpoints
│   │   └── weather.ts          # weather.gov API — current obs + hourly forecast
│   ├── hooks/
│   │   ├── useOuraAuth.ts      # Oura auth hook (code exchange + token refresh)
│   │   ├── useWithingsAuth.ts  # Withings auth hook (code exchange + token refresh)
│   │   └── useWeather.ts       # Fetches current + hourly weather on mount
│   ├── utils/
│   │   └── weatherIcons.ts     # Maps NWS icon URLs to emoji + formats hour labels
│   ├── pages/
│   │   ├── Home.tsx            # / — Connect Oura button
│   │   ├── Dashboard.tsx       # /dashboard — OAuth callback + data tiles
│   │   ├── Stats.tsx           # /stats — placeholder
│   │   ├── Weather.tsx         # /weather — current + hourly weather tiles
│   │   ├── Oura.tsx            # /oura — placeholder
│   │   ├── Withings.tsx        # /withings — placeholder
│   │   ├── Habits.tsx          # /habits — placeholder
│   │   └── Settings.tsx        # /settings — placeholder
│   ├── components/
│   │   ├── Navbar.tsx                # Sticky top navigation bar
│   │   ├── ScoreTile.tsx             # Oura score tile (Sleep / Readiness / Activity)
│   │   ├── WithingsTile.tsx          # Withings body composition tile
│   │   ├── CurrentWeatherTile.tsx    # Current conditions: temp, feels like, wind, humidity
│   │   └── HourlyForecastTile.tsx    # 24-hour scrollable forecast strip
│   └── backend/
│       ├── server.js           # Express API server
│       └── db.js               # PostgreSQL pool
├── docs/                       # Documentation
└── .env                        # Secrets (not committed)
```

## Routing

React Router (`BrowserRouter`) handles client-side routing. Vite's dev server serves `index.html` for all paths.

| Path | Page | Purpose |
|---|---|---|
| `/` | Dashboard | OAuth callback landing, Oura + Withings tiles |
| `/?code=ABC` | Dashboard | Oura redirects here after user approves |
| `/?code=ABC&state=withings` | Dashboard | Withings redirects here after user approves |
| `/stats` | Stats | Placeholder |
| `/weather` | Weather | Current conditions + 24-hour forecast from weather.gov |
| `/oura` | Oura | Placeholder |
| `/withings` | Withings | Placeholder |
| `/habits` | Habits | Placeholder |
| `/settings` | Settings | Placeholder |

## Request Flow Overview

```
Browser (Vite :5173)      Vite Proxy         Express (:3000)      Oura API
       │                      │                     │                  │
       │  GET /api/auth/status │                     │                  │
       │─────────────────────>│── /api/auth/status ->│                  │
       │<─────────────────────│<── { loggedIn } ─────│                  │
       │                      │                     │                  │
       │  POST /api/oura/token │                     │                  │
       │─────────────────────>│──────────────────── >│                  │
       │                      │                     │─ POST /oauth/token>│
       │                      │                     │<─ { tokens } ─────│
       │                      │   (refresh_token → httpOnly cookie)     │
       │<─────────────────────│<── { access_token } ─│                  │
       │                      │                     │                  │
       │  POST /api/sleep      │                     │                  │
       │─────────────────────>│──────────────────── >│                  │
       │                      │                     │─ GET /daily_sleep >│
       │                      │                     │<─ sleep data ─────│
       │<─────────────────────│<── { day, score } ───│                  │
```

### API Proxy

The Vite dev server proxies all `/api/*` requests to `http://localhost:3000`. Frontend code uses relative `/api/...` paths — no hardcoded ports. Cookies are scoped to `localhost:5173` through the proxy, so `credentials: 'include'` works correctly.

See [auth/oura-oauth.md](./auth/oura-oauth.md) for the full login and token refresh flows.
