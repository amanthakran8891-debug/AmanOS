# AmanOS Phase 2 — Scalable Foundation + Finance Command Center

This phase delivers the **shared engine layer** every future command center plugs
into, plus the first center built on it: **Finance**. The point is not isolated
features — it's one analytics/forecasting/correlation/gamification spine that
Nicotine, Nursing, the Life Correlation Engine, Recovery AI and the Global
Dashboard will all reuse without rewriting maths.

## The engines (`src/lib/engine/`)

| Engine | File | What it gives every center |
|---|---|---|
| Series / Analytics | `series.ts` | `series(events, "day\|week\|month\|year", "sum\|count\|avg")`, `sumBy`, `dailyMap`, `sumLastDays`. Feed any `{date,value}` stream → graph-ready buckets. |
| Correlation | `correlate.ts` | `pearson`, `correlateDaily`, `conditionalLift`, `strength`, `phrase`. "X days are tied to Y." |
| Forecasting | `forecast.ts` | `linearTrend`, `projectNext`, `savingsForecast`, `debtPayoffMonths`, `horizonProjection` over 30/90/180/365. |
| Gamification | `gamify.ts` | `levelOf`, `healthScore`, `meter`, `dragonFrom`, tier ladders (`WEALTH_TIERS`). Dragons, levels, health scores from any number. |

Design rule: engines are **pure functions over plain data** — no Prisma, no React.
Each command center does its own DB read, maps rows to `{date,value}`, and calls
the engines. That keeps them testable and means a new center is "map data → call
engines → render," never "reinvent the stats."

## Finance Command Center

**Data model** (`prisma/schema.prisma`, migration `20260618130000_finance`):

- `Transaction` — unified `{date, kind (income|expense), category, amount, recurring, note}`.
  The single source of truth going forward.
- `FinanceAccount` — `{name, kind (savings|investment|debt|cash), balance, apr}`,
  one row per account; current balances drive net worth / debt payoff.
- Legacy `Expense` rows are still read as an expense source so nothing is lost.

**Logic** (`src/lib/finance.ts`, `financeReport(...)`) — all via the engines:

- Income / expense / net by week·month·year·lifetime; monthly **burn rate**.
- **Cashflow** monthly series (income vs expense vs net) via `series`.
- **Net worth** = savings + investments − debt from accounts.
- **Savings forecast** (3/6/12 mo) via `savingsForecast`; **debt payoff months** via `debtPayoffMonths`.
- **Category spend** via `sumBy`.
- **True cost of habits**: lifetime/this-month weed + nicotine spend; **money saved
  staying clean** = clean days × historical avg daily addiction spend; 10-year
  projected drain if relapsed; **Freedom Fund** total kept out of smoke.
- **Gamification**: Wealth Level + Finance Dragon (`WEALTH_TIERS`), 0–100 Financial
  Health Score (savings rate, emergency-fund cover, debt ratio, positive cashflow),
  Freedom Meter toward a £20k goal.

**Surface**:

- `src/app/finance/page.tsx` (server) → reads transactions + legacy expenses +
  accounts + clean days → `financeReport` → renders.
- `src/components/finance/finance-dashboard.tsx` — tiles, wealth/dragon, cashflow
  (ComposedChart), forecast, debt, habit cost, category breakdown, account manager,
  recent transactions.
- `src/components/finance/log-transaction.tsx` — quick income/expense logger.
- Server actions: `addTransaction`, `removeTransaction`, `updateTransaction`,
  `upsertAccount`, `removeAccount`.
- `/finance` nav card added to the dashboard.

## Deploy

```bash
npm run db:deploy    # apply 20260618130000_finance migration
npm run db:generate  # regenerate Prisma client (Transaction + FinanceAccount)
```

## Verification

The four new files (`finance.ts`, `finance/page.tsx`, `finance-dashboard.tsx`,
`log-transaction.tsx`) pass `transpileModule` syntax checks clean. `actions.ts`
and `dashboard-client.tsx` were edited (exact-match) and confirmed intact via
host read — the transpile "errors" on those two are the known mount torn-copy
artifact, not real.

## Next centers (all reuse the engines)

1. **Nicotine** — mirror of Finance/Craving: log per-cigarette/vape, cost via
   finance categories, quit forecast via `forecast`, Nicotine Dragon via `gamify`.
2. **Nursing (NCLEX)** upgrade — readiness forecast via `forecast`, weak-topic via `sumBy`.
3. **Life Correlation Engine** — pull `dailyMap` from every center, run
   `correlateDaily` / `conditionalLift` to surface "weed days → −X% NCLEX accuracy."
4. **Recovery AI** — relapse-risk score from correlated leading indicators.
5. **Global Analytics Dashboard** — one page composing every center's engine output.
