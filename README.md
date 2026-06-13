# FinanciaApp

Personal finance web application: React 19, Vite, Zustand, Tailwind CSS, Supabase (auth + cloud sync), PWA with Web Push.

Repository: [github.com/franferrerrodriguez/FinanceApp](https://github.com/franferrerrodriguez/FinanceApp)

## Project structure

| Path | Description |
|------|-------------|
| [`frontend/`](frontend/) | SPA (PWA). Source, tests, Vite config |
| [`supabase/`](supabase/) | SQL migrations, Edge Functions, CLI config |
| [`scripts/`](scripts/) | Database and auth maintenance (Node, run from repo root) |
| [`frontend/functional.md`](frontend/functional.md) | Functional specification |

**Supabase project (FinApp):** `rzvtrvpcsttgtqcqarmh` (region `eu-west-1`).

Dashboard: `https://supabase.com/dashboard/project/rzvtrvpcsttgtqcqarmh`

---

## Quick start (frontend)

```bash
cd frontend
cp .env.example .env
# Edit .env — Supabase URL + publishable/anon key (see below)
npm install
npm run dev
```

Open the URL shown by Vite (default `http://localhost:5173`).

**Troubleshooting:** if you see *Outdated Optimize Dep*, stop the dev server, delete `node_modules/.vite`, and run `npm run dev:force`.

---

## Environment variables (`frontend/.env`)

Copy from [`frontend/.env.example`](frontend/.env.example). File is gitignored — never commit it.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes (Supabase mode) | `https://rzvtrvpcsttgtqcqarmh.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Yes | Publishable key (`sb_publishable_…`) or anon JWT from **Settings → API** |
| `VITE_VAPID_PUBLIC_KEY` | For push | From `npx web-push generate-vapid-keys` |
| `VITE_AUTH_MODE` | No | Set to `simple` for local-only auth (no cloud). See [`frontend/docs/AUTH.md`](frontend/docs/AUTH.md) |

**Never** put in `.env` or Git: Postgres password, `service_role`, or `DATABASE_URL` with credentials.

Restart Vite after changing `.env`.

---

## Supabase setup

Detailed security and dashboard steps: [`supabase/SETUP.md`](supabase/SETUP.md).

### 1. Create schema in the cloud

From the **repo root** (installs `pg` for scripts):

```bash
npm install
SUPABASE_DB_PASSWORD='your-postgres-password' npm run db:migrate
```

Password: Supabase → **Project Settings → Database → Database password** (reset if unknown).

Alternative: paste migrations manually in **SQL Editor** ([`supabase/migrations/`](supabase/migrations/)) in order `001` → `004`.

### 2. Verify frontend keys (no DB password)

```bash
npm run db:verify
```

Checks `frontend/.env` URL + anon key against the REST API.

### 3. Auth in dashboard

- **Authentication → URL Configuration:** Site URL `http://localhost:5173` (+ production domain when deployed).
- **Confirm email:** disabled (recommended) — sign-up without inbox confirmation. Dashboard or:

```bash
SUPABASE_ACCESS_TOKEN='sbp_...' npm run auth:no-email-confirm
```

Token: [Account → Access Tokens](https://supabase.com/dashboard/account/tokens).

### 4. CLI (optional)

```bash
supabase login
supabase link --project-ref rzvtrvpcsttgtqcqarmh
supabase db push
```

`project_id` is already set in [`supabase/config.toml`](supabase/config.toml).

---

## Database scripts (repo root)

All scripts connect via the **session pooler** (`aws-0-eu-west-1.pooler.supabase.com`) — required when direct `db.*.supabase.co` is IPv6-only.

Default project ref: `rzvtrvpcsttgtqcqarmh`. Override with `SUPABASE_PROJECT_REF` or `SUPABASE_DB_REGION`.

| Command | Purpose |
|---------|---------|
| `npm run db:migrate` | Apply all SQL migrations (idempotent) |
| `npm run db:reset` | Drop app tables, delete all auth users, re-apply migrations |
| `npm run db:delete-user -- email@example.com` | Delete one user (CASCADE on public data) |
| `npm run db:verify` | Test REST API + publishable key from `frontend/.env` |
| `npm run auth:no-email-confirm` | Disable email confirmation via Management API |

### Apply migrations

```bash
SUPABASE_DB_PASSWORD='...' npm run db:migrate
```

### Full reset (destructive)

```bash
SUPABASE_DB_PASSWORD='...' SUPABASE_DB_RESET_CONFIRM=yes npm run db:reset
```

After reset: clear browser localStorage keys `financia_app_data` and `financia_cloud_user_id`.

### Delete one user

```bash
SUPABASE_DB_PASSWORD='...' npm run db:delete-user -- user@example.com
```

### Migrations

| File | Content |
|------|---------|
| `001_initial.sql` | Tables, RLS, profile trigger |
| `002_app_data_column.sql` | JSONB `app_data` on `user_settings` |
| `003_push_subscriptions.sql` | Web Push subscriptions |
| `004_snapshot_gain_loss.sql` | `gain_loss_euros` on snapshots |

---

## Frontend scripts (`frontend/`)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run dev:force` | Dev with dependency re-optimization |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm test` | Unit tests (calculation engine, sync, macros, etc.) |
| `npm run lint` | ESLint |
| `npm run icons` | Generate PWA PNG icons |

---

## Features (high level)

- **Dashboard:** patrimony KPIs, macro charts (INE inflation, Euribor, ECB deposit rate)
- **Balance:** assets, liabilities, monthly close, amortization
- **Projection:** long-term scenarios with configurable returns
- **Cloud sync:** Zustand + Supabase when authenticated (RLS per user)
- **PWA:** installable app, offline shell, push reminders — [`frontend/docs/PWA.md`](frontend/docs/PWA.md)
- **i18n:** Spanish / English

---

## Authentication modes

| Mode | Config | Notes |
|------|--------|-------|
| **Supabase** (default) | `VITE_SUPABASE_*` in `.env` | Email/password, cloud sync |
| **Simple** | `VITE_AUTH_MODE=simple` | Browser-only, no Supabase |

See [`frontend/docs/AUTH.md`](frontend/docs/AUTH.md).

---

## Deployment

Static build from `frontend/`:

```bash
cd frontend && npm run build
```

Deploy `frontend/dist/` to Vercel, Netlify, Hostinger, etc.

Set the same `VITE_SUPABASE_*` and `VITE_VAPID_PUBLIC_KEY` in the hosting panel. Add the production URL to Supabase **Authentication → URL Configuration**.

Skills in [`.agents/skills/`](.agents/skills/) cover Vercel deploy with tokens if needed.

---

## CI

GitHub Actions (`.github/workflows/ci.yml`) on `main`: `npm ci`, `npm test`, `npm run build` in `frontend/`.

---

## Security checklist

| Secret | Frontend / Git? |
|--------|-----------------|
| Publishable / anon key | Yes (Vite `VITE_*`) — protected by RLS |
| Service role key | **Never** |
| Postgres password | **Never** — terminal scripts only |
| `SUPABASE_ACCESS_TOKEN` | **Never** — one-off CLI only |

---

## License

Personal project — private use unless stated otherwise.
