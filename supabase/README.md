# Supabase — FinanciaApp

## Aplicar esquema

1. Abre tu proyecto en Supabase → **SQL Editor**.
2. Pega y ejecuta [`migrations/001_initial.sql`](migrations/001_initial.sql).

## Auth

- **Site URL**: `http://localhost:5173` (desarrollo).
- **Redirect URLs**: misma URL + dominio de producción.
- Email confirmation: si está activado, el usuario debe confirmar el email antes de tener sesión completa.

## Columna `app_data`

JSON con datos del cliente que aún no tienen columnas propias (`salaryHistory`, `annualExpenses`, `contributionPlans`, gastos compartidos, etc.). La migración desde el frontend puede ampliarse para leer/escribir este campo.
