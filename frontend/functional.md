FINANCIA APP — Functional Specification v1.0

Complete technical specification · React + Vite + Zustand + Supabase
Version: 1.0 · June 2026


Table of Contents

1. Product Overview
2. Technical Architecture
3. Data Model (Supabase)
4. Module: Onboarding
5. Module: Dashboard
6. Module: Net Worth Balance
7. Module: Future Projection
8. Configurable Financial Parameters
9. Financial Calculation Engine
10. REST API (Supabase)
11. Authentication and Local Persistence
12. Iteration Roadmap


1. Product Overview

FinanciaApp is a personal finance web application designed so anyone can have a clear, accurate, and projectable view of their net worth, cashflow, and financial progression over time. The goal is not a simple spreadsheet, but an intelligent tool that calculates, projects, and alerts based on the user's real data.

1.1 Value Proposition

- Real-time net worth with historical monthly snapshots
- Detailed cashflow: net income vs. fixed expenses vs. variable expenses vs. savings/investment
- Long-term financial projection with real compound interest (not only nominal)
- Auditable, modifiable financial parameters with technically correct defaults
- Smooth onboarding with data saved locally before registration is required
- Supabase backend: no own server, free tier sufficient for personal use

1.2 Target Users

Professionals aged 25–45 with stable income who want to optimize their savings and investment. Advanced financial knowledge is not required, but the tool is designed not to oversimplify the underlying calculations.

1.3 Design Principles

- Data first: no number is shown without the user being able to see how it is calculated
- Modifiability: all relevant parameters are editable with reasoned defaults
- Financial coherence: formulas respect financial standards (real vs. nominal return, inflation, Fisher equation)
- Progressive disclosure: works without an account, enriches when the user registers
- Mobile-first but usable on desktop


2. Technical Architecture

2.1 Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Frontend | React 18 + Vite | Fast SPA, mature ecosystem, easy deploy on Hostinger/Vercel |
| Global state | Zustand | Lightweight, no boilerplate, ideal for mutable financial state |
| Styling | Tailwind CSS | Fast utilities, visual consistency, simple dark mode |
| Charts | Recharts | Native React components, good support for time series |
| Backend / DB | Supabase (PostgreSQL) | Free tier sufficient, integrated auth, auto-generated REST API |
| Local storage | localStorage + Zustand persist | Functional data before registration |
| Deploy | Hostinger (static) or Vercel | Vite build → dist folder → upload to hosting |
| Environment variables | .env (VITE_SUPABASE_URL, ANON_KEY) | Never hardcode credentials |

2.2 Project Folder Structure

```
src/
  ├── components/         → Reusable UI components
  ├── modules/
  │   ├── onboarding/     → Initial setup stepper
  │   ├── dashboard/      → Main view with metrics
  │   ├── balance/        → Assets, liabilities, snapshots
  │   └── projection/     → Configurable future projection
  ├── store/              → Zustand stores (user, assets, settings)
  ├── lib/
  │   ├── supabase.js     → Supabase client
  │   ├── calculations.js → Financial calculation engine (PURE, no side effects)
  │   └── constants.js    → Default parameters
  ├── hooks/              → Custom hooks (useAssets, useProjection...)
  └── utils/              → Formatters, validators
```

2.3 Persistence Flow

- Phase 1 (no account): all data lives in Zustand + localStorage. The user works normally.
- "Save progress" banner appears after 10 minutes of active use or when closing the tab (beforeunload).
- On registration: localStorage data is migrated automatically to Supabase (silent upsert).
- Phase 2 (with account): bidirectional sync. Supabase as source of truth.
- Configurable parameters are stored in the user_settings table, never hardcoded in the frontend.


3. Data Model (Supabase / PostgreSQL)

3.1 Table: profiles

```sql
CREATE TABLE profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id),
  name           TEXT,
  age            INTEGER,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
```

3.2 Table: user_settings

Stores all configurable financial parameters for the user. One row per user.

```sql
CREATE TABLE user_settings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID REFERENCES profiles(id) UNIQUE NOT NULL,

  -- INCOME
  monthly_net_salary          NUMERIC(12,2),        -- Monthly net salary
  other_monthly_income        NUMERIC(12,2) DEFAULT 0,

  -- MONTHLY FIXED EXPENSES
  mortgage_rent               NUMERIC(10,2) DEFAULT 0,
  utilities                   NUMERIC(10,2) DEFAULT 0,   -- electricity + water + gas
  insurance                   NUMERIC(10,2) DEFAULT 0,
  subscriptions               NUMERIC(10,2) DEFAULT 0,
  other_fixed_expenses        NUMERIC(10,2) DEFAULT 0,

  -- INVESTMENT PARAMETERS (modifiable, with reasoned defaults)
  index_fund_nominal_return   NUMERIC(5,4) DEFAULT 0.0600,  -- 6.00%
  index_fund_real_return      NUMERIC(5,4) DEFAULT 0.0400,  -- 4.00%
  use_real_return             BOOLEAN DEFAULT TRUE,          -- TRUE = use real return
  expected_inflation          NUMERIC(5,4) DEFAULT 0.0200,  -- 2.00% (ECB target)
  pension_plan_return         NUMERIC(5,4) DEFAULT 0.0350,  -- 3.50% typical nominal Spain
  savings_account_return      NUMERIC(5,4) DEFAULT 0.0250,  -- 2.50% interest-bearing accounts 2026
  annual_salary_increase      NUMERIC(5,4) DEFAULT 0.0150,  -- 1.50% salary increase

  -- PROJECTION PARAMETERS
  projection_years            INTEGER DEFAULT 25,
  monthly_investment_amount   NUMERIC(10,2) DEFAULT 0,      -- 0 = use free cashflow automatically

  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);
```

3.3 Table: assets

```sql
CREATE TABLE assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) NOT NULL,
  name        TEXT NOT NULL,    -- "Santander Current Account"
  -- Categories: bank | investment | real_estate | cash | pension | other
  category    TEXT NOT NULL,
  provider    TEXT,             -- "Indexa Capital", "Myinvestor", "Trade Republic"...
  notes       TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

Asset categories and their treatment:

| Category | Key | Return in projection |
|----------|-----|----------------------|
| Current / debit account | bank | 0% (non-yielding cash) |
| Interest-bearing account / deposit | bank | savings_account_return (default 2.5%) |
| Index funds | investment | index_fund_real_return or nominal per config |
| Pension plans | pension | pension_plan_return (default 3.5%) |
| Cash | cash | 0% |
| Primary residence | real_estate | Not projected as income generator (illiquid) |
| Investment property | real_estate | Configurable: gross rental yield − expenses |
| Other | other | Individually configurable |

3.4 Table: liabilities

```sql
CREATE TABLE liabilities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES profiles(id) NOT NULL,
  name             TEXT NOT NULL,
  -- Categories: mortgage | personal_loan | credit_card | family_debt | other
  category         TEXT NOT NULL,
  monthly_payment  NUMERIC(10,2) DEFAULT 0,   -- monthly installment (for cashflow)
  interest_rate    NUMERIC(5,4),               -- annual interest rate
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
```

3.5 Table: monthly_snapshots

Each snapshot closes the month and stores the exact value of each asset and liability. It is the source for the historical table and evolution charts.

```sql
CREATE TABLE monthly_snapshots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) NOT NULL,
  asset_id     UUID REFERENCES assets(id),       -- NULL if liability
  liability_id UUID REFERENCES liabilities(id),  -- NULL if asset
  snapshot_date DATE NOT NULL,                   -- always last day of month
  value        NUMERIC(14,2) NOT NULL,            -- positive assets, NEGATIVE liabilities
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset_id, snapshot_date),
  UNIQUE(liability_id, snapshot_date)
);
```

**Important note:** Liability values in monthly_snapshots must be stored as negative. This allows net worth to be calculated with a simple sum: NW = Σ(all values for the month).


4. Module: Onboarding (Stepper)

Onboarding is shown only the first time the user accesses the app (localStorage key: onboarding_completed = false). It consists of 5 steps. Data is saved to Zustand in real time as the user progresses.

4.1 Stepper Steps

| Step | Title | Fields | UX notes |
|------|-------|--------|----------|
| 1 | Welcome | Name, age | Welcoming screen. CTA: "Get started" |
| 2 | Your income | Monthly net salary, other monthly net income | Always NET. Tooltip explaining gross vs. net |
| 3 | Fixed expenses | Mortgage/rent, utilities, insurance, subscriptions, other | Subtotal calculated in real time as they type |
| 4 | Your investment | Monthly investment contribution, products used | Shows resulting cashflow: income − expenses − investment = free |
| 5 | Summary | Initial net worth, cashflow, calculated savings rate | Button: "Get started". Option to register now or later |

4.2 "Save Progress" Banner Logic

- Activates after 10 minutes of active use (timer with Zustand) or on window.beforeunload.
- Shows a non-blocking modal with two options: "Sign up" and "Continue without account".
- If they choose to sign up, the auth form is minimal: email + password.
- After registration, migrateLocalToSupabase() is called, which upserts all local data.
- The banner does not appear again if the user dismisses it (localStorage key: banner_dismissed).


5. Module: Dashboard

5.1 Main KPIs

| KPI | Calculation | Format / Alert |
|-----|-------------|----------------|
| Net Worth | Σ(assets) + Σ(liabilities) — liabilities are negative | € with thousands separator. Green if up, red if down |
| Total Assets | Σ(current month asset snapshots) | €, breakdown by category in tooltip |
| Total Liabilities | Σ(liability snapshots, negative value) | € in red |
| Savings Rate | (monthly_savings / total_net_income) × 100 | ≥20% green · 10–20% yellow · <10% red |
| Free Cashflow | income − fixed_expenses − investment_contribution | €/month. If negative → visual alert |
| Monthly Change | (NW_current − NW_previous) / NW_previous | |

5.2 Charts

- Line: Net worth evolution (Y axis: €, X axis: months). Two series: "Net Worth" and "Total Assets". Last 12 months available.
- Horizontal stacked bar (normalized): cashflow — income vs. fixed expenses vs. variable expenses vs. investment vs. free.
- Donut: Asset distribution by category (Banks / Investments / Real estate / Pensions / Cash / Other).
- Mini-table: Top 3 assets and Top 3 liabilities by weight in net worth.

5.3 Smart Alerts

```
⚠️  ALERT 1: Negative free cashflow → "Your expenses exceed your income this month"
⚠️  ALERT 2: Savings rate < 10% → "You are saving less than 10% of your salary"
⚠️  ALERT 3: Credit card debt > 0 → "You have credit card debt. Consider paying it off first"
⚠️  ALERT 4: Negative net worth → "Your debt exceeds your assets. Review your liabilities"
```


6. Module: Net Worth Balance

6.1 Asset Management

The user can add, edit, and deactivate assets. Each asset has a category that determines how it is grouped in summaries and what estimated return is applied in projections.

Asset form fields:

- Name (free text)
- Category (select with predefined options)
- Provider (free text: "Indexa Capital", "Myinvestor", "Revolut"...)
- Notes (optional)

6.2 Liability Management

Each liability has:

- Name and category
- Monthly payment → added to fixed expenses for cashflow calculation
- Interest rate → for future amortization calculations (iteration 3)
- Current debt value → entered in the monthly snapshot as a negative value

6.3 Monthly Close (Snapshot)

The "monthly close" is the action by which the user records the current value of each asset and liability. It is not automatic: the user decides when to close the month (ideally the last day of each month).

Monthly close UX:

- "Close month" button in the module header.
- When clicked, a form opens listing all assets and liabilities.
- Previous month's values are pre-filled — the user only changes what has changed.
- On confirm, records are inserted into monthly_snapshots.

6.4 Historical Summary Table

The table shows columns per month (maximum 12 months visible, horizontal scroll) and rows per asset/liability.

Automatically calculated summary rows:

- Total per category: Banks, Investments, Real estate, Pensions, Cash, Other
- Total Assets, Total Liabilities, Net Worth
- Month-over-month change in € and %


7. Module: Future Projection

7.1 Module Inputs

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| Years to project | 25 | 5–50 | Time horizon |
| Monthly contribution | auto (free cashflow) | manual | Default = dashboard free cashflow |
| Return type | Real | Real / Nominal | Selector with tooltip explanation |
| Fund return (real) | 4.00% | 0–15% | After inflation. Default: MSCI World historical real average |
| Fund return (nominal) | 6.00% | 0–18% | Without discounting inflation |
| Expected inflation | 2.00% | 0–8% | Long-term ECB target |
| Pension plan return | 3.50% | 0–10% | Conservative estimate for pension plans in Spain |
| Interest-bearing account return | 2.50% | 0–6% | Typical interest-bearing accounts Spain June 2026 |
| Annual salary increase | 1.50% | 0–10% | Conservative estimate: ECB inflation target |
| % of salary to investment | auto | 0–100% | If active, contribution grows with salary |

7.2 Predefined Scenarios

| Scenario | Fund return (real) | Inflation | Salary increase | Description |
|----------|-------------------|-----------|-----------------|-------------|
| Conservative | 3.00% | 2.50% | 1.00% | Flat markets, high inflation, no promotions |
| Moderate | 4.00% | 2.00% | 1.50% | Realistic base scenario for Spain 2026+ |
| Optimistic | 6.00% | 1.50% | 2.50% | Strong equity cycle, career growth |
| Custom | free | free | free | User configures each parameter |

7.3 Projection Outputs

- Area chart: projected net worth vs. contributions only (no return) → visualizes the power of compound interest.
- Compound interest generated: projected_final_net_worth − sum_of_total_contributions
- Automatic milestones on the chart: ×2 current net worth, ×5, ×10.
- Detailed annual table: year | opening net worth | annual contribution | return generated | closing net worth.
- FIRE indicator (Financial Independence Retire Early): estimated year when annual returns equal annual expenses.


8. Configurable Financial Parameters

8.1 Nominal vs. Real Return — Fundamental Concept

**CRITICAL for the development team:** this distinction must be clear in the UI and in all calculations.

- **Nominal return:** what the fund reports officially, without discounting inflation.
- **Real return:** actual purchasing power gained.

Fisher equation:

```
r_real = (1 + r_nominal) / (1 + inflation) - 1
```

Example with app defaults:

```
Nominal:   6.00%
Inflation: 2.00%
Real:      (1.06 / 1.02) - 1 = 3.92% ≈ 4.00%
```

When to use each:

- **Real return** → long-term projections where future expenses are expressed in TODAY's euros (constant purchasing power). Default mode and the correct one.
- **Nominal return** → useful to compare with other investments or financial products that report in nominal terms.

The UI must communicate this with an informational banner when the user switches between modes.

8.2 Justification of Default Values

| Parameter | Default | Technical justification |
|-----------|---------|-------------------------|
| Index fund nominal return | 6.00% | Historical MSCI World average in EUR ~7% annual over last 50 years. 6% used discounting product costs (~0.5–1% typical TER at Indexa/Myinvestor) |
| Index fund real return | 4.00% | Fisher: (1.06/1.02)−1 = 3.92%, rounded to 4%. Consistent with Vanguard and Research Affiliates studies for diversified global portfolios |
| Expected inflation | 2.00% | Official ECB target. Standard for long-term financial planning in the Eurozone |
| Pension plan return | 3.50% | Conservative for equity/mixed pension plans in Spain. Pension plans have higher tax on withdrawal, so somewhat lower expected return than free funds is justified |
| Interest-bearing account return | 2.50% | Average offer in Spain June 2026 (Openbank, Revolut, Trade Republic, MyInvestor). Review every 6 months per ECB policy |
| Annual salary increase | 1.50% | Inflation target (2%) minus a small discount. Conservative as planning baseline |

8.3 Parameters Configuration Screen

Accessible from: Profile > Financial parameters

Each parameter shows:

- Slider + numeric field editable at the same time
- Tooltip with explanation and justification of the default value
- Individual "Restore default" button
- "Restore all defaults" button at the bottom of the screen
- Projection recalculates in real time when any parameter changes (debounce 300ms)
- Contextual notice: "You are using real return. Results are expressed in today's euros (constant purchasing power)."


9. Financial Calculation Engine

All formulas live in `src/lib/calculations.js` as pure functions (no side effects, no access to global state). This facilitates unit testing and debugging.

9.1 Dashboard Formulas

| Concept | Formula | Notes |
|---------|---------|-------|
| Net Worth | NW = Σ(assets_month) + Σ(liabilities_month) | Liabilities are negative. NW can be negative |
| NW Change | ((NW_current − NW_previous) / \|NW_previous\|) × 100 | Use absolute value of denominator |
| Savings Rate | (monthly_savings / total_net_income) × 100 | savings = income − fixed_expenses − var_expenses |
| Free Cashflow | CF = net_income − fixed_expenses − monthly_investment | Can be negative (alert) |

9.2 Projection Formulas

| Concept | Formula | Notes |
|---------|---------|-------|
| Future Value (contributions) | FV = C × [((1+r)^n − 1) / r] | C=periodic contribution, r=rate per period, n=periods |
| Future Value (initial capital) | FV_0 = PV × (1+r)^n | PV=current net worth, r=annual rate, n=years |
| Total FV | FV_total = FV_0 + FV_contributions | Sum projected current capital + contributions |
| Real return (Fisher) | r_real = (1 + r_nom) / (1 + inflation) − 1 | Always apply when use_real_return = TRUE |
| Monthly rate from annual | r_month = (1 + r_annual)^(1/12) − 1 | Correct conversion. NEVER divide by 12 |
| Compound interest generated | IC = FV_total − (initial_net_worth + total_contributions) | What investment generates on its own |
| FIRE year | Year when FV × r_real >= annual_expenses | annual_expenses = (fixed + variable expenses) × 12 |
| Salary with increase | S_n = S_0 × (1 + salary_increase)^n | Updates contribution if % of salary is active |

**CRITICAL — Monthly rate:**

```
CORRECT:   r_month = (1 + 0.06)^(1/12) - 1 = 0.004868 (0.4868%)
INCORRECT: r_month = 0.06 / 12 = 0.005 (0.5%)
```

The accumulated difference over 25 years can be thousands of euros.

9.3 Reference Code — src/lib/calculations.js

```javascript
// src/lib/calculations.js — PURE FUNCTIONS, no imports from global state

/**
 * Converts nominal return to real using the Fisher equation
 * @param {number} nominalRate - Annual nominal rate (0.06 = 6%)
 * @param {number} inflationRate - Annual inflation (0.02 = 2%)
 * @returns {number} Annual real rate
 */
export const nominalToReal = (nominalRate, inflationRate) =>
  (1 + nominalRate) / (1 + inflationRate) - 1;

/**
 * Monthly rate from annual — correct method (twelfth root, NOT divide by 12)
 * @param {number} annualRate - Effective annual rate
 * @returns {number} Effective monthly rate
 */
export const annualToMonthly = (annualRate) =>
  Math.pow(1 + annualRate, 1 / 12) - 1;

/**
 * Future Value of periodic monthly contributions (ordinary annuities)
 * @param {number} monthlyContrib - Monthly contribution in €
 * @param {number} annualRate     - Effective annual rate (already converted: real or nominal)
 * @param {number} years          - Horizon in years
 * @returns {number} Future value in €
 */
export const futureValueContributions = (monthlyContrib, annualRate, years) => {
  const r = annualToMonthly(annualRate);
  const n = years * 12;
  if (r === 0) return monthlyContrib * n;
  return monthlyContrib * ((Math.pow(1 + r, n) - 1) / r);
};

/**
 * Future Value of initial capital (no additional contributions)
 * @param {number} presentValue - Initial capital in €
 * @param {number} annualRate   - Effective annual rate
 * @param {number} years        - Horizon in years
 * @returns {number} Future value in €
 */
export const futureValueLumpSum = (presentValue, annualRate, years) =>
  presentValue * Math.pow(1 + annualRate, years);

/**
 * Full year-by-year projection — returns table with all intermediate data
 *
 * @param {object} params
 * @param {number} params.initialPatrimony          - Current net worth in €
 * @param {number} params.monthlyContrib            - Monthly contribution in €
 * @param {number} params.annualRate                - Rate already converted (real or nominal per config)
 * @param {number} params.years                     - Years to project
 * @param {number} params.annualSalaryIncrease       - Annual salary increase (0.015 = 1.5%)
 * @param {boolean} params.contribGrowsWithSalary    - If true, contribution grows with salary
 * @returns {Array<{year, patrimonioInicio, aportacionAnual, rentabilidadGenerada, patrimonioFin, totalAportaciones, interesCompuestoTotal}>}
 */
export const buildProjectionTable = ({
  initialPatrimony,
  monthlyContrib,
  annualRate,
  years,
  annualSalaryIncrease = 0.015,
  contribGrowsWithSalary = false,
}) => {
  const table = [];
  let patrimonioInicio = initialPatrimony;
  let contrib = monthlyContrib;
  let totalAportaciones = 0;

  for (let year = 1; year <= years; year++) {
    if (contribGrowsWithSalary && year > 1) {
      contrib *= (1 + annualSalaryIncrease);
    }

    const r = annualToMonthly(annualRate);
    const fvCapital = patrimonioInicio * Math.pow(1 + annualRate, 1);
    const fvContrib = r === 0
      ? contrib * 12
      : contrib * ((Math.pow(1 + r, 12) - 1) / r);

    const patrimonioFin = fvCapital + fvContrib;
    const aportacionAnual = contrib * 12;
    totalAportaciones += aportacionAnual;
    const interesGenerado = patrimonioFin - initialPatrimony - totalAportaciones;

    table.push({
      year,
      patrimonioInicio:       Math.round(patrimonioInicio),
      aportacionAnual:        Math.round(aportacionAnual),
      rentabilidadGenerada:   Math.round(patrimonioFin - patrimonioInicio - aportacionAnual),
      patrimonioFin:          Math.round(patrimonioFin),
      totalAportaciones:      Math.round(totalAportaciones),
      interesCompuestoTotal:  Math.round(interesGenerado),
    });

    patrimonioInicio = patrimonioFin;
  }

  return table;
};

/**
 * Calculates FIRE year: when projected annual returns
 * cover the user's annual expenses
 *
 * @param {Array}  projectionTable  - Output from buildProjectionTable()
 * @param {number} annualExpenses   - Annual expenses in € (fixed + variable expenses) × 12
 * @param {number} annualRate       - Annual return rate used in projection
 * @returns {number|null} FIRE year or null if not reached within horizon
 */
export const calcFIREYear = (projectionTable, annualExpenses, annualRate) => {
  return projectionTable.find(
    row => row.patrimonioFin * annualRate >= annualExpenses
  )?.year ?? null;
};

/**
 * Calculates current net worth from an array of snapshots
 * @param {Array<{value: number}>} snapshots - Current month snapshots
 * @returns {number} Net worth (positive assets + negative liabilities)
 */
export const calcNetWorth = (snapshots) =>
  snapshots.reduce((sum, s) => sum + s.value, 0);

/**
 * Monthly savings rate
 * @param {number} totalIncome    - Total monthly net income
 * @param {number} fixedExpenses  - Monthly fixed expenses
 * @param {number} varExpenses    - Monthly variable expenses (estimated)
 * @returns {number} Savings rate between 0 and 1
 */
export const calcSavingsRate = (totalIncome, fixedExpenses, varExpenses = 0) => {
  if (totalIncome <= 0) return 0;
  const savings = totalIncome - fixedExpenses - varExpenses;
  return Math.max(0, savings / totalIncome);
};

/**
 * Monthly free cashflow
 * @param {number} totalIncome         - Total net income
 * @param {number} fixedExpenses       - Monthly fixed expenses
 * @param {number} monthlyInvestment   - Monthly investment contribution
 * @returns {number} Free cashflow (can be negative)
 */
export const calcFreeCashflow = (totalIncome, fixedExpenses, monthlyInvestment) =>
  totalIncome - fixedExpenses - monthlyInvestment;
```

9.4 Default Constants — src/lib/constants.js

```javascript
// src/lib/constants.js

export const DEFAULT_SETTINGS = {
  // Investment returns
  indexFundNominalReturn:  0.0600,  // 6.00% — MSCI World historical average in EUR adjusted for costs
  indexFundRealReturn:     0.0400,  // 4.00% — Fisher: (1.06/1.02)-1 = 3.92% ≈ 4%
  useRealReturn:           true,    // Projections in constant purchasing power by default
  expectedInflation:       0.0200,  // 2.00% — Official ECB target
  pensionPlanReturn:       0.0350,  // 3.50% — Conservative pension plan Spain (nominal)
  savingsAccountReturn:    0.0250,  // 2.50% — Interest-bearing accounts Spain June 2026

  // Projection
  projectionYears:         25,
  annualSalaryIncrease:    0.0150,  // 1.50% — Inflation target minus discount

  // Savings rate benchmarks for dashboard color alerts
  SAVINGS_RATE_GREEN:      0.20,    // ≥20% = green
  SAVINGS_RATE_YELLOW:     0.10,    // 10-20% = yellow
                                    // <10% = red
};

export const ASSET_CATEGORIES = [
  { value: 'bank',         label: 'Bank / Current account' },
  { value: 'investment',   label: 'Index funds / ETF' },
  { value: 'pension',      label: 'Pension plan' },
  { value: 'cash',         label: 'Cash' },
  { value: 'real_estate',  label: 'Real estate' },
  { value: 'other',        label: 'Other asset' },
];

export const LIABILITY_CATEGORIES = [
  { value: 'mortgage',      label: 'Mortgage' },
  { value: 'personal_loan', label: 'Personal loan' },
  { value: 'credit_card',   label: 'Credit card' },
  { value: 'family_debt',   label: 'Family debt' },
  { value: 'other',         label: 'Other debt' },
];

export const PROJECTION_SCENARIOS = {
  conservative: {
    label:               'Conservative',
    indexFundRealReturn: 0.0300,
    expectedInflation:   0.0250,
    annualSalaryIncrease:0.0100,
  },
  moderate: {
    label:               'Moderate',
    indexFundRealReturn: 0.0400,
    expectedInflation:   0.0200,
    annualSalaryIncrease:0.0150,
  },
  optimistic: {
    label:               'Optimistic',
    indexFundRealReturn: 0.0600,
    expectedInflation:   0.0150,
    annualSalaryIncrease:0.0250,
  },
};
```

10. REST API (Supabase)

Supabase auto-generates a REST API for each table with Row Level Security (RLS) enabled. The React client uses the @supabase/supabase-js SDK. All business logic lives in the frontend (calculations.js) or in Edge Functions for critical operations.

10.1 Main Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /rest/v1/user_settings | GET / PATCH | JWT | Get or update financial parameters |
| /rest/v1/assets | GET / POST / PATCH / DELETE | JWT | Assets CRUD |
| /rest/v1/liabilities | GET / POST / PATCH / DELETE | JWT | Liabilities CRUD |
| /rest/v1/monthly_snapshots | GET / POST | JWT | Get history or insert monthly close |
| /rest/v1/profiles | GET / PATCH | JWT | User profile |
| /auth/v1/signup | POST | anon key | Registration with email + password |
| /auth/v1/token | POST | anon key | Login, obtain JWT |
| /functions/v1/migrate-local | POST | JWT | Edge Function: migrate localStorage → Supabase |

10.2 Security — Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;

-- Standard policy: user can only access their own data
CREATE POLICY "user_own_data" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- (Repeat for assets, liabilities, monthly_snapshots)
```

**Never use the service_role key in the frontend.** Only in Edge Functions or server migration scripts.

10.3 Supabase Client — src/lib/supabase.js

```javascript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

10.4 localStorage → Supabase Migration

```javascript
// src/lib/migrateLocalToSupabase.js
import { supabase } from './supabase';
import { useAppStore } from '../store/appStore';

export const migrateLocalToSupabase = async (userId) => {
  const { assets, liabilities, snapshots, settings } = useAppStore.getState();

  try {
    // 1. Upsert settings
    if (settings) {
      await supabase
        .from('user_settings')
        .upsert({ ...settings, user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });
    }

    // 2. Upsert assets
    if (assets.length) {
      await supabase.from('assets').upsert(
        assets.map(a => ({ ...a, user_id: userId })),
        { ignoreDuplicates: true }
      );
    }

    // 3. Upsert liabilities
    if (liabilities.length) {
      await supabase.from('liabilities').upsert(
        liabilities.map(l => ({ ...l, user_id: userId })),
        { ignoreDuplicates: true }
      );
    }

    // 4. Upsert snapshots
    if (snapshots.length) {
      await supabase.from('monthly_snapshots').upsert(
        snapshots.map(s => ({ ...s, user_id: userId })),
        { ignoreDuplicates: true }
      );
    }

    // 5. Clear localStorage after successful migration
    localStorage.removeItem('financia_app_data');
    return { success: true };

  } catch (error) {
    console.error('Migration failed:', error);
    // Local data is kept to retry on next login
    return { success: false, error };
  }
};
```

11. Authentication and Local Persistence

11.1 Session States

| State | Description | Behavior |
|-------|-------------|----------|
| guest_no_data | First visit, no data | Shows onboarding stepper |
| guest_with_data | Completed onboarding, no account | App functional with localStorage. Save banner active |
| authenticated | Registered and logged in | Data in Supabase. Banner gone. Active sync |
| returning_guest | Has localStorage from previous session | Loads local data directly, no onboarding |

11.2 Main Zustand Store

```javascript
// src/store/appStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      sessionStatus: 'guest_no_data', // guest_no_data | guest_with_data | authenticated | returning_guest

      // Onboarding
      onboardingCompleted: false,
      bannerDismissed: false,
      activeMinutes: 0,

      // Financial data
      settings: null,       // user_settings
      assets: [],           // assets[]
      liabilities: [],      // liabilities[]
      snapshots: [],        // monthly_snapshots[]

      // Actions
      setUser: (user) => set({ user, sessionStatus: 'authenticated' }),
      setSettings: (settings) => set({ settings }),
      addAsset: (asset) => set(s => ({ assets: [...s.assets, asset] })),
      addLiability: (liability) => set(s => ({ liabilities: [...s.liabilities, liability] })),
      addSnapshot: (snapshot) => set(s => ({ snapshots: [...s.snapshots, snapshot] })),
      completeOnboarding: () => set({ onboardingCompleted: true, sessionStatus: 'guest_with_data' }),
      dismissBanner: () => set({ bannerDismissed: true }),
      incrementActiveMinutes: () => set(s => ({ activeMinutes: s.activeMinutes + 1 })),
    }),
    {
      name: 'financia_app_data',
      partialize: (state) => ({
        onboardingCompleted: state.onboardingCompleted,
        bannerDismissed: state.bannerDismissed,
        settings: state.settings,
        assets: state.assets,
        liabilities: state.liabilities,
        snapshots: state.snapshots,
      }),
    }
  )
);
```

12. Iteration Roadmap

**Iteration 1 — MVP (4–6 weeks)**

- Onboarding stepper (5 steps) + localStorage persistence
- Dashboard with 6 KPIs + net worth evolution chart + cashflow bar
- Net worth balance: assets and liabilities CRUD + monthly close + historical table
- Future projection: calculation engine + chart + annual table
- Configurable parameters with justified defaults
- Basic Supabase auth (signup + login) + local data migration
- "Save progress" banner

**Iteration 2 — Enrichment (3–4 weeks)**

- FIRE indicator with visual milestone on projection chart
- Smart alerts on dashboard
- Donut chart asset distribution
- Dark mode
- PWA for mobile access without installation
- Export balance to PDF / CSV

**Iteration 3 — Power features (4–6 weeks)**

- Investment tracking: actual vs. estimated returns
- Early mortgage amortization calculator
- Financial goals module (emergency fund, purchase, travel...)
- Monthly notification to close the month

**Iteration 4 — Advanced**

- Bank statement import CSV/OFX
- Expense analysis by category (Sankey charts)
- Basic multi-currency (USD, GBP with exchange rate)
- Family mode: multiple profiles under one account


Notes for Cursor AI

How to use this document efficiently:

- Always start by passing Section 3 (data model) and Section 9 (calculation engine) as base context before building any module.
- Per module: add the corresponding section (4 for onboarding, 5 for dashboard, etc.) to context when building that module.
- The calculations.js file in section 9.3 must be created first and must not import anything from outside lib/. It is the mathematical source of truth for the entire app.
- The constants.js defaults (section 9.4) are the values that will populate user_settings when a new user completes onboarding.
- RLS in Supabase must be enabled before any testing with real data (section 10.2).
