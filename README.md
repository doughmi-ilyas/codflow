# CODFlow

Multi-tenant **cash-on-delivery (COD) order management**: a NestJS + PostgreSQL API and a Next.js web app in French, English and Arabic (right-to-left).

Several shops share one database and never see each other's data. Inside a shop, each role (owner, manager, agent, courier) sees and does only what the owner allows. An order moves through a fixed delivery workflow, and the cash couriers collect is tracked against what was expected.

## Why this project

Paying on delivery is how a large share of online orders are settled in Morocco, and job listings for full-stack developers there ask for the same things this project exercises: Next.js (App Router) and TypeScript, a Node.js back end, PostgreSQL, JWT authentication, role-based access, multi-tenant design, Docker and CI. I built it to show those skills on a realistic problem rather than a to-do list.

## What it does

- **Tenant isolation in the database.** Every business table has PostgreSQL row-level security. Requests run as a restricted role with `app.tenant_id` set, so a query cannot read or write another shop's rows even if the application forgot a `WHERE`. Tests prove it (select, insert, update, delete, and "no tenant set").
- **Authentication.** Login by shop + email + password (bcrypt), JWT access token. The web app keeps the token in an `httpOnly` cookie behind a small backend-for-frontend, so browser JavaScript never sees it.
- **Editable permission matrix.** Roles map to permissions per tenant (`orders:create`, `orders:ship`, `stats:read`, ...). The owner edits the matrix; changes apply on the next request. The owner can never remove their own `permissions:manage`.
- **Order workflow.** `new → confirmed → shipped → delivered`, plus `refused → returned`. Skipping steps is rejected (409). Confirming is for the front office, shipping (with a courier) for managers, closing a delivery (with the cash collected) for the assigned courier only. Every move is written to an order history.
- **Cash picture.** `/stats` and the dashboard show orders per status, cash collected, delivered value, the difference, and the value still out on the road. Amounts are integer centimes end to end.
- **Three languages.** French, English and Arabic with RTL layout (logical CSS properties). A test checks that the three dictionaries define exactly the same keys.

## Architecture

```
web/  Next.js 15 (App Router), React 19, Tailwind 4      → calls the API from the server only
api/  NestJS 10, zod validation, node-postgres           → REST + JWT
db    PostgreSQL 16, SQL migrations, row-level security
```

Key files: `api/src/db/migrations/002_row_level_security.sql` (policies), `api/src/db/db.ts` (`withTenant`), `api/src/orders/status.ts` (workflow), `api/src/permissions/` (matrix and guard), `web/app/api/` (login, logout, narrow write proxy).

## Run it

```bash
export JWT_SECRET="$(openssl rand -hex 32)"
docker compose up --build            # PostgreSQL, API on :3001, web on :3000 (the API migrates on start)
```

Demo data (two shops, one team each; local use only):

```bash
cd api && npm ci
DATABASE_URL=postgres://codflow:codflow@localhost:5432/codflow JWT_SECRET=$JWT_SECRET npm run seed
```

Then open <http://localhost:3000>: shop `atlas-shop`, user `owner@atlas-shop.test`, password `demo-password` (also `manager@`, `agent@`, `courier@` with the same shop). Without Docker: `cd api && npm run dev` and `cd web && API_URL=http://localhost:3001 npm run dev`. Configuration is listed in `api/.env.example`. The compose file exposes no database port, so to seed from your machine add `ports: ["5432:5432"]` to the `db` service.

Deploying on DockHosting (managed PostgreSQL, one project per folder): see [docs/deploy-dockhosting.md](docs/deploy-dockhosting.md).

## API

| Method and path | Needs | What |
|---|---|---|
| `POST /auth/login` | none | `{tenant, email, password}` → token |
| `GET /auth/me` | token | current user |
| `POST /orders`, `GET /orders`, `GET /orders/:id` | `orders:create`, `orders:read` | create; list with `status`, `city`, `q`, `page`, `pageSize`; detail with history |
| `PATCH /orders/:id/status` | depends on the move | `{status, courierId?, cashCollectedCents?, note?}` |
| `GET /users/couriers` | `orders:ship` | couriers for dispatch |
| `GET /stats` | `stats:read` | counts and cash summary |
| `GET/PUT /permissions[/:role]` | `permissions:manage` | read and edit the role matrix |

## Tests and CI

- **API: 31 tests** (Jest + supertest): row-level-security isolation, login, the permission matrix, the full delivery workflow including forbidden and invalid moves, courier scoping, filters, pagination, stats.
- **Web: 7 tests** (Vitest): dictionary parity, RTL, money conversion, status buttons.
- **End to end:** `scripts/smoke.sh` logs in through the web app, creates an order and checks that it is listed in French and that the Arabic page is right-to-left.
- **GitHub Actions:** typecheck, API tests against a real PostgreSQL 16 service (locally the same tests run on an in-process PostgreSQL, PGlite), web typecheck, tests and build, the end-to-end smoke test, and Docker builds of both images.

## Results

The latest CI run is green on all four jobs: API (31 tests on PostgreSQL 16), web (typecheck, 7 tests, build), end-to-end smoke test, Docker builds.

## Limits

- No rate limiting or account lockout on login, no refresh tokens or token revocation, no password reset: a production system needs them.
- Users are created by the seed script or SQL; there is no user-management screen yet. Tenants are created with `provisionTenant`, not through a sign-up page.
- No file uploads, notifications or real payment provider. One currency per tenant (default MAD); phone validation covers Moroccan formats only.
- The web interface has not been exercised in a real browser: the CI smoke test checks server-rendered pages, login and the write proxy, not clicks. There are no screenshots yet.

## Licence

MIT, see `LICENSE`.
