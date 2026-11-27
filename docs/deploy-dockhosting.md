# Deploy CODFlow on DockHosting

Two apps and one database: `api/` (NestJS), `web/` (Next.js) and a managed PostgreSQL. Steps follow the [DockHosting docs](https://docs.dockhosting.dev/docs) (GitHub deploys, Docker stack, databases).

Both folders have a `Dockerfile`, and DockHosting builds with it when it exists. Each image listens on `PORT` on `0.0.0.0`.

## 1. The API

1. In the dashboard, create a project from GitHub: repository `codflow`, branch `main`, **App folder `api`**.
2. Create a **PostgreSQL 16** database in the same screen and link it. The app then receives `DATABASE_URL`.
3. Add variables:
   - `JWT_SECRET`: a long random string (`openssl rand -hex 32`).
   - `CORS_ORIGIN`: leave empty. The browser never calls the API directly; the web app calls it from its server.
   - `SEED_DEMO=true` (optional, for a public demo): creates two demo shops on first start, see the README for the logins. Remove it for anything real.
4. Deploy. The API runs the SQL migrations on start. Check `https://<api-address>/health` returns `{"status":"ok"}`.

## 2. The web app

1. Create a second project from the same repository, **App folder `web`**.
2. Variable: `API_URL` = the API's address (`https://<api-address>`), or its private address if DockHosting shows one for linked apps.
3. Deploy, then open the web address, `/fr/login`: shop `atlas-shop`, user `owner@atlas-shop.test`, password `demo-password` (only if `SEED_DEMO=true`).

## Notes

- Pushes to `main` redeploy each project (Auto-deploy). Turn it off in Settings if you prefer manual Redeploy.
- Free plans may put idle apps to sleep; the first request after a pause is slower.
- Do not run your own database inside an image; use the managed one. Uploaded files are not used by this app.
- Demo logins are public in the README: a demo instance must hold no real data.
