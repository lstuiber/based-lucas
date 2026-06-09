# Development

## Prerequisites

- Node.js 18+
- PostgreSQL (database: `hubdb`)
- An Oura developer application — register at https://cloud.ouraring.com/oauth/applications

## Setup

```bash
npm install
cd src/backend && npm install
```

Create a `.env` file in the project root:

```
VITE_oura_client_id=your_client_id
oura_client_id=your_client_id
oura_secret=your_client_secret
```

`VITE_` prefix exposes the client ID to the Vite frontend (used in the OAuth redirect URL). The unprefixed versions are used by the Express backend only and are never sent to the browser.

## Commands

| Command | Description |
|---|---|
| `npm run dev:all` | Start frontend (Vite) and backend (Express) concurrently |
| `npm run dev` | Frontend only — Vite dev server on port 5173 |
| `npm run dev:backend` | Backend only — Express on port 3000 |
| `npm run build` | Production Vite build (TypeScript checked, React compiled) |

## Ports

| Service | Port |
|---|---|
| Vite frontend | 5173 |
| Express backend | 3000 |

## Type checking

```bash
npx tsc --noEmit
```

The TypeScript config (`tsconfig.json`) covers all files under `src/`. The backend (`src/backend/`) stays in JavaScript for now.

## Oura OAuth redirect URI

The redirect URI registered in your Oura developer application must be:

```
http://localhost:5173/dashboard
```

Note: this changed from `dashboard.html` when the project migrated to React Router.
