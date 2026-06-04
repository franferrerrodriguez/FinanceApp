# Supabase setup (FinanciaApp)

## What goes where (security)

| Secret | Frontend / GitHub? | Use |
|--------|---------------------|-----|
| **Publishable / anon key** | Yes in build (Vite `VITE_*`) | React client; protected with **RLS** |
| **Service role key** | **Never** in frontend or Git | Server scripts / Edge Functions only |
| **Postgres password** (`postgresql://postgres:…`) | **Never** in frontend or Git | Local CLI, DBeaver, or Supabase dashboard only |
| **`frontend/.env`** | **Not** in Git (`.gitignore`) | Local development |

The public key in the browser bundle is normal in Supabase; security comes from RLS policies, not hiding that key.

## 1. Local variables (done if `frontend/.env` exists)

```bash
cd frontend
cp .env.example .env
# Edit URL and public key from Dashboard → Settings → API
```

Restart Vite after changing `.env`.

## 2. No confirmation emails (recommended)

For **email + password without sending emails** on sign-up:

1. Open [Authentication → Providers → Email](https://supabase.com/dashboard/project/ceduxgxizgkyiexkdyqp/auth/providers).
2. Disable **Confirm email** (or “Confirmar email” in the Spanish UI).
3. Save.

Effect: when you click “Sign up” you are logged in immediately; no inbox link and no `over_email_send_rate_limit` quota from confirmations.

**From the terminal** (token from [Account → Access Tokens](https://supabase.com/dashboard/account/tokens)):

```bash
SUPABASE_ACCESS_TOKEN='sbp_...' npm run auth:no-email-confirm
```

Locally, `supabase/config.toml` already has `auth.email.enable_confirmations = false` (only applies if you use `supabase start`).

## 3. Schema in the cloud

**Option A — script (from repo root):**

```bash
npm install
SUPABASE_DB_PASSWORD='your-postgres-password' npm run db:migrate
```

The password goes only in the terminal, never in Git.

**Option B — Dashboard:** [SQL Editor](https://supabase.com/dashboard/project/ceduxgxizgkyiexkdyqp) → `migrations/001_initial.sql` and `002`.

**Verify frontend public key:**

```bash
npm run db:verify
```

## 4. CLI (optional): login, init, link, push

Install CLI: https://supabase.com/docs/guides/cli

```bash
cd /path/to/FinanceApp
supabase login
# supabase/config.toml already exists with project_id ceduxgxizgkyiexkdyqp
supabase link --project-ref ceduxgxizgkyiexkdyqp
supabase db push
```

`supabase link` stores the link in `.temp/` (ignored by Git). **Do not** save the Postgres password in the repo.

## 5. `over_email_send_rate_limit` (email rate limit exceeded)

**What it means:** not a wrong password or email. Supabase limits **how many auth emails** your project can send per hour (registration confirmation, magic link, etc.). Each “Sign up” with confirmation enabled counts as **one email sent**.

**Why it happens:** many registration attempts while testing → many confirmation emails → quota exhausted (on the free plan it is often low, e.g. 2–4/hour depending on settings).

**Solutions:**

| Option | Action |
|--------|--------|
| Wait | ~1 hour and the counter resets |
| Raise quota | [Rate Limits](https://supabase.com/dashboard/project/ceduxgxizgkyiexkdyqp/auth/rate-limits) → **Rate limit for sending emails** (e.g. 30 in dev) |
| Dev without email | Section **2** above (disable **Confirm email**) |
| Production | Configure your own SMTP (SendGrid, Resend, etc.) with a higher quota |

## 6. Other rate limits (too many logins/sign-ups)

1. [Authentication → Rate Limits](https://supabase.com/dashboard/project/ceduxgxizgkyiexkdyqp/auth/rate-limits)
2. Raise **Rate limit for sign-ups and sign-ins** if the error refers to attempts, not email.

## 7. Auth in the dashboard

**Authentication → URL Configuration**

- Site URL: `http://localhost:5173`
- Redirect URLs: `http://localhost:5173/**` and your production domain

## 8. Deployment (Vercel / Hostinger)

In the hosting panel, environment variables (secrets):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not use the database password on static hosting.

## 9. If you leaked the Postgres password

Rotate it in **Project Settings → Database → Reset database password** and do not paste it in chats or Git.
