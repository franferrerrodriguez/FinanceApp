# FinanciaApp

Personal finance web application (React + Vite + Zustand + Supabase).

Repository: [github.com/franferrerrodriguez/FinanceApp](https://github.com/franferrerrodriguez/FinanceApp)

## Structure

| Folder | Description |
|--------|-------------|
| `frontend/` | SPA + Ionic/Capacitor (Android & iOS) |
| `supabase/` | Initial SQL and backend setup notes |

The functional specification is in [`frontend/functional.md`](frontend/functional.md).

## Quick start

```bash
cd frontend
cp .env.example .env
# Edit .env with your Supabase project (URL + anon key)
npm install
npm run dev
```

Open the URL shown by Vite (default `http://localhost:5173`).

If you see **Outdated Optimize Dep**: stop the dev server, delete `node_modules/.vite`, and run `npm run dev:force`.

## Mobile (Android & iOS)

Same React app wrapped with **Ionic + Capacitor**. Full guide: [`frontend/docs/MOBILE.md`](frontend/docs/MOBILE.md).

```bash
cd frontend
npm install
npm run build:mobile    # build + sync native projects
npm run cap:open:android   # Android Studio → Run
```

Requires Android Studio (Android) or Xcode on macOS (iOS).

## Authentication

**Recommended:** Supabase with **Confirm email disabled** → email/password registration without sending emails. Guide: [`supabase/SETUP.md` §2](supabase/SETUP.md) or `npm run auth:no-email-confirm` with an [access token](https://supabase.com/dashboard/account/tokens).

Cloud-free alternative: `VITE_AUTH_MODE=simple` in `frontend/.env` (account stored only in the browser). See [`frontend/docs/AUTH.md`](frontend/docs/AUTH.md).

## Supabase

Project: `ceduxgxizgkyiexkdyqp` — detailed guide in [`supabase/SETUP.md`](supabase/SETUP.md).

1. `cd frontend && cp .env.example .env` — **public** keys only (publishable/anon). **Do not** commit `.env` to GitHub.
2. In **SQL Editor**, run [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql) (and `002` if applicable).
3. **Authentication → URL Configuration**: `http://localhost:5173`.
4. CLI (optional): `supabase login` → `supabase link --project-ref ceduxgxizgkyiexkdyqp` → `supabase db push`.

**Never** in the repo or in Vite: Postgres password, `service_role`, or `DATABASE_URL` with a password.

## Scripts (`frontend/`)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development |
| `npm run dev:force` | Dev with dependency re-optimization |
| `npm run build` | Production build (`dist/`) |
| `npm test` | Calculation engine tests |
| `npm run lint` | ESLint |
| `npm run build:mobile` | Production build + Capacitor sync |
| `npm run cap:open:android` | Open Android Studio |
| `npm run cap:open:ios` | Open Xcode (macOS) |

## Deployment

Static build from `frontend/`:

```bash
cd frontend && npm run build
```

Upload the contents of `frontend/dist/` to Hostinger, Vercel, Netlify, etc. Set the same `VITE_SUPABASE_*` variables in the hosting panel.

## License

Personal project — private use unless stated otherwise.
