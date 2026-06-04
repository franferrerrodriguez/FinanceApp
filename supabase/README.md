# Supabase — FinanciaApp

Step-by-step setup (security and CLI): **[SETUP.md](SETUP.md)**

## Apply schema

1. Open your project in Supabase → **SQL Editor**.
2. Paste and run [`migrations/001_initial.sql`](migrations/001_initial.sql).
3. If the table already existed without JSON: [`migrations/002_app_data_column.sql`](migrations/002_app_data_column.sql).

## Auth

- **Site URL**: `http://localhost:5173` (development).
- **Redirect URLs**: same URL + production domain.
- **Confirm email**: disabled in production (see [SETUP.md §2](SETUP.md)) — registration without sending emails.

## `app_data` column

JSON with client data that does not yet have dedicated columns (`salaryHistory`, `annualExpenses`, `contributionPlans`, shared expenses, etc.). Frontend migration can be extended to read/write this field.
