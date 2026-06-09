# FinanciaApp — Frontend

React 19 + Vite 8 + Zustand + Tailwind + Supabase Auth + PWA (Web Push).

## Environment variables

Copy `.env.example` to `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

Never commit `.env` to the repository.

## Development

```bash
npm install
npm run dev
```

## PWA

```bash
npm run icons   # regenerate PNG icons
npm run build
npm run preview
```

See [`docs/PWA.md`](docs/PWA.md).

## Documentation

- [`functional.md`](functional.md) — data model, modules, roadmap
- [`docs/PWA.md`](docs/PWA.md) — install, push notifications
- [`docs/AUTH.md`](docs/AUTH.md) — auth and privacy notes
