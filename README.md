# FinanciaApp

Aplicación web de finanzas personales (React + Vite + Zustand + Supabase).

Repositorio: [github.com/franferrerrodriguez/FinanceApp](https://github.com/franferrerrodriguez/FinanceApp)

## Estructura

| Carpeta | Descripción |
|---------|-------------|
| `frontend/` | SPA (código de la app) |
| `supabase/` | SQL inicial y notas de configuración del backend |

La especificación funcional está en [`frontend/functional.md`](frontend/functional.md).

## Inicio rápido

```bash
cd frontend
cp .env.example .env
# Edita .env con tu proyecto Supabase (URL + anon key)
npm install
npm run dev
```

Abre la URL que muestre Vite (por defecto `http://localhost:5173`).

Si ves **Outdated Optimize Dep**: para el servidor, borra `node_modules/.vite` y ejecuta `npm run dev:force`.

## Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta el script [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql).
3. En **Authentication → URL Configuration**, añade `http://localhost:5173` (y tu dominio de producción).
4. Copia **Project URL** y **anon public key** a `frontend/.env`.

## Scripts (`frontend/`)

| Comando | Uso |
|---------|-----|
| `npm run dev` | Desarrollo |
| `npm run dev:force` | Dev con reoptimización de dependencias |
| `npm run build` | Build de producción (`dist/`) |
| `npm test` | Tests del motor de cálculos |
| `npm run lint` | ESLint |

## Despliegue

Build estático desde `frontend/`:

```bash
cd frontend && npm run build
```

Sube el contenido de `frontend/dist/` a Hostinger, Vercel, Netlify, etc. Define las mismas variables `VITE_SUPABASE_*` en el panel del hosting.

## Licencia

Proyecto personal — uso privado salvo que indiques lo contrario.
