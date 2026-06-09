# FinanciaApp — PWA

FinanciaApp is a **Progressive Web App**: install it from the browser and use it like a native app, with optional push notifications for monthly close reminders.

## Install

1. Open the app in **Chrome** (Android) or **Safari** (iOS 16.4+).
2. **Android:** menu → *Instalar app* / *Añadir a pantalla de inicio*.
3. **iOS:** Share → *Añadir a pantalla de inicio*.

The app opens in standalone mode (no browser chrome).

## Push notifications

1. Sign in with a Supabase account.
2. On the Dashboard or Account page, tap **Activar** in the notifications banner.
3. Allow notifications when prompted.

Reminders are sent on the **28th of each month at 09:00** (via Supabase Edge Function `monthly-close-reminder`).

### Setup (developer)

```bash
npx web-push generate-vapid-keys
```

Add to `frontend/.env`:

```
VITE_VAPID_PUBLIC_KEY=<public key>
```

Add to Supabase → Edge Functions → Secrets:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_EMAIL`

Apply migration `003_push_subscriptions.sql`, deploy functions:

```bash
supabase functions deploy send-push
supabase functions deploy monthly-close-reminder
```

Schedule `monthly-close-reminder` in Supabase Dashboard → Edge Functions → Schedules:

- Cron: `0 9 28 * *`

## Build

```bash
cd frontend
npm run icons   # regenerate PNG icons from favicon.svg
npm run build
npm run preview
```

## Tech

| Layer | Choice |
|-------|--------|
| UI | React + Tailwind |
| Icons | lucide-react |
| Offline | vite-plugin-pwa + Workbox |
| Push | Web Push API + Supabase `push_subscriptions` |
