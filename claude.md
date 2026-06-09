React + TypeScript project using Vite for frontend, Express for backend, and PostgreSQL for a database. Basic CSS to be used with best practices like flexbox and grid. Playwright to be used for testing. GitHub Actions for CI/CD pipelines.

## Documentation rule

Always update the corresponding file(s) in `docs/` when modifying a component, feature, or API endpoint. Mapping:
- `src/backend/server.js` → `docs/api/backend.md`
- `src/api/oura.ts` or `src/hooks/useOuraAuth.ts` → `docs/integrations/oura.md`
- Auth flow changes → `docs/auth/oura-oauth.md`
- New pages or components → `docs/architecture.md`
- New integrations → `docs/integrations/<name>.md`
- Stack, commands, or setup changes → `docs/development.md` + `docs/architecture.md`

## Stack
- Frontend: React 19, TypeScript, Vite, React Router
- Backend: Node.js, Express (JavaScript)
- Database: PostgreSQL

## Commands

`npm run dev:all` to run frontend and backend together

`npm run dev` to run frontend only (Vite, port 5173)

`cd src/backend && node server.js` to run backend only (Express, port 3000)

## Frontend structure

```
src/
  main.tsx          — React entry point
  App.tsx           — Router (/, /dashboard, /stats)
  types/oura.ts     — Oura API types
  api/oura.ts       — API call functions
  hooks/            — Custom React hooks
  pages/            — Route-level components
  components/       — Reusable UI components
  style.css         — Global styles
```

## API proxy

The Vite dev server proxies `/api/*` to `http://localhost:3000`, so frontend code uses relative `/api/...` paths.

## Database
`hubdb` is the name of the database and has already been created
