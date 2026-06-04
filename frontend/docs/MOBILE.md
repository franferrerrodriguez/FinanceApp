# FinanciaApp — Mobile (Ionic + Capacitor)

One React codebase powers the web SPA and native Android/iOS shells.

## Stack

| Layer | Package |
|-------|---------|
| UI | React + Tailwind (unchanged) |
| Icons | `@ionic/react` (`IonIcon` + ionicons) |
| Native bridge | Capacitor 8 |
| Android / iOS | `frontend/android/`, `frontend/ios/` |

We do **not** use `@ionic/react-router` (it targets React Router v5; this app uses v7).

## Bottom navigation

Main sections use a fixed bottom bar (`BottomNavBar`) on **Capacitor** (Android/iOS) or when the **web viewport is ≤ 767px**.

| Tab | Route |
|-----|-------|
| Dashboard | `/dashboard` |
| Balance (Patrimonio) | `/balance` |
| Projection | `/projection` |

- **Web desktop (wide):** top header tabs (Dashboard / Patrimonio / Proyección).

Account (`/cuenta`) stays in the profile menu, not in the tab bar.

## Prerequisites

### Android (first)

- [Android Studio](https://developer.android.com/studio) (SDK 34+, build-tools)
- JDK 17+
- Device or emulator

### iOS (later, macOS only)

- Xcode 15+
- CocoaPods (`sudo gem install cocoapods`) if Xcode asks for it
- Apple Developer account for TestFlight / App Store

## Environment

Same as web — `frontend/.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

Rebuild after changing env vars (`npm run build:mobile`).

In Supabase → **Authentication → URL Configuration**, add when using magic links / OAuth:

- `financiaapp://login-callback`
- `com.cartia.financiaapp://login-callback`

## Daily workflow

```bash
cd frontend

# Web dev (unchanged)
npm run dev

# After UI changes → sync native projects
npm run build:mobile

# Open Android Studio
npm run cap:open:android
# Run ▶ on emulator or USB device

# Or CLI run (device/emulator must be ready)
npm run cap:run:android
```

iOS (on Mac):

```bash
npm run cap:open:ios
# or
npm run cap:run:ios
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build:mobile` | Vite production build + `cap sync` |
| `npm run cap:sync` | Copy `dist/` and update native plugins |
| `npm run cap:open:android` | Open Android Studio |
| `npm run cap:open:ios` | Open Xcode |
| `npm run cap:run:android` | Build, sync, run on Android |
| `npm run cap:run:ios` | Build, sync, run on iOS |

## Storage on device

- **Web:** `localStorage` (Zustand persist + Supabase JWT).
- **Native:** same API in the WebView, mirrored to `@capacitor/preferences` for durability (`src/lib/appStorage.js`).
- On launch, `NativeStorageBootstrap` loads Preferences before Zustand rehydrates.

## Native behaviour

`useCapacitorShell` (in `AppProviders`):

- Hides splash after storage hydration
- Status bar style from theme (light/dark)
- Listens for `appUrlOpen` (deep links / future Supabase redirects)

## Play Store checklist (Android)

1. `npm run build:mobile`
2. Android Studio → **Build → Generate Signed Bundle / APK** (AAB recommended)
3. Privacy policy URL (RGPD: Supabase + on-device data)
4. Test login, offline onboarding, cloud sync

## Troubleshooting

| Issue | Fix |
|-------|-----|
| White screen on Android | Run `npm run build:mobile`; check Logcat |
| Auth / API errors | `androidScheme: 'https'` in `capacitor.config.ts` (already set) |
| Old UI in app | `npm run build:mobile` before run |
| Gradle sync failed | Open Android Studio, let it download SDK |

## Project layout

```
frontend/
  capacitor.config.ts
  android/          # Android Studio project
  ios/              # Xcode project
  src/
    lib/platform.js
    lib/appStorage.js
    hooks/useCapacitorShell.js
    components/NativeStorageBootstrap.jsx
```
