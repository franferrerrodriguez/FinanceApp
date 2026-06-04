# Authentication and privacy (Spain / EU)

This is **not legal advice**. It summarizes technical options for a personal project.

## Simple mode (`VITE_AUTH_MODE=simple`)

- Email and password **only on the device** (localStorage).
- Password: **PBKDF2** hash (SHA-256, 120,000 iterations) + random salt. The plain password is not stored.
- **No** confirmation emails, **no** OAuth, **no** `service_role` or secret keys in the frontend.
- Financial data (`financia_app_data`) stays in the same browser; there is currently **no** per-user cloud copy or cross-device sync.

### Compliance (guidance, not a guarantee)

| Topic | Simple mode |
|-------|-------------|
| GDPR / LOPDGDD (Spain) | You remain the data controller if you publish the app. State in a **privacy policy** what you store (email, financial data), where (user’s browser), and rights (access, erasure). |
| Consent | Clear notice at registration; no confirmation email required if you send no emails. |
| Security | Suitable for personal use; for a public deployment consider HTTPS, risk notices (data only on this device), and no password recovery without a backend. |
| Minors / sensitive data | Not designed for health data or special categories. |

## Supabase mode (default)

- Auth managed by Supabase (email/password, JWT in localStorage).
- To **avoid** email limits in development: disable **Confirm email** in the dashboard (see `supabase/SETUP.md`).
- Data sync with RLS; the **anon** key in the client is normal; security comes from RLS policies.

## Enable simple mode

```bash
# frontend/.env
VITE_AUTH_MODE=simple
```

Restart `npm run dev`. `VITE_SUPABASE_*` is not required to sign in (cloud sync is disabled).
