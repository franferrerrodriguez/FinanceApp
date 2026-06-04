# FinanciaApp — Frontend

React 19 + Vite 8 + Zustand + Tailwind + Supabase Auth + Ionic/Capacitor (Android/iOS).

## Environment variables

Copy `.env.example` to `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Never commit `.env` to the repository.

## Development

```bash
npm install
npm run dev
```

## Mobile

```bash
npm run build:mobile
npm run cap:open:android   # or cap:run:android
```

See [`docs/MOBILE.md`](docs/MOBILE.md).

## Documentation

- [`functional.md`](functional.md) — data model, modules, roadmap
- [`docs/MOBILE.md`](docs/MOBILE.md) — Android / iOS workflow
- [`docs/AUTH.md`](docs/AUTH.md) — auth and privacy notes
