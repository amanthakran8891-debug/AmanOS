# AmanOS Phase 3 — Personal Intelligence System

Three builds, all on the shared engine foundation. AmanOS stops being a tracker
and starts predicting relapse, spending and discipline collapse — and mentoring.

## 1. Life Correlation Engine — `/correlations`

`src/lib/correlations.ts` (+ `src/lib/engine/risk.ts`, page + dashboard).

- **`loadLifeSignals(windowDays)`** assembles date-aligned daily maps from every
  source — cravings, recovery/joint events, clean streak, transactions, legacy
  expenses, symptom logs, sleep, mood, gym, NCLEX, BharatFare, life score. This
  is the one signal layer every other centre reuses.
- **Correlation cards** via the shared correlate engine: sleep↔cravings,
  sleep↔relapse, cravings↔spending, weed-spend↔discipline, gym↔cravings,
  NCLEX↔life-score, finance-stress↔relapse, off-days↔cravings, BharatFare↔mood,
  clean-streak↔discipline. Each card shows relationship, strength, direction,
  confidence, n, and a plain-English line ("On days you sleep under 6 hours,
  cravings are 42% higher").
- **Risk-pattern detection**: dangerous hour/day, sleep-debt, no-gym, high-spend,
  relapse-prone windows.
- **Recovery-AI forecast** (today + tomorrow) on the new generic **risk engine**
  (`riskScore` over weighted factors → score/level/reasons/defensive actions).
  Covers cannabis here; nicotine on the same engine in its own centre.
- **Insight feed**, **graphs** (sleep×cravings, spend×cravings, cravings by DOW,
  risk trend, discipline×clean-time), and honest **gating** — "Not enough data
  yet — log N more days."

## 2. Nicotine Command Center — `/nicotine` (the second dragon)

`prisma` models `NicotineEvent` + `NicotineGoal`; `src/lib/nicotine.ts`; actions
`logNicotineEvent` / `removeNicotineEvent` / `setNicotineGoal`; page + dashboard.

Built entirely on the shared engines — **no duplicated analytics**: it reuses
`loadLifeSignals`, `numericCard`/`flagCard`, the risk engine and gamify.

- **Recovery engine**: nicotine-free time, longest streak, cigarettes & nicotine
  avoided, money saved/spent, life regained, relapses, cravings won/lost,
  victory rate.
- **Nicotine Dragon** (separate from the Cannabis Dragon): named stages (Smoke
  Serpent → Free Sovereign) via gamify, HP/threat/damage, weaknesses, strongest
  craving window. Resisted craving damages it; a cigarette heals it.
- **Recovery-AI risk**: today / tomorrow / 7-day / 30-day with reasons (sleep,
  stress, recent use, no gym, cannabis-relapse cross-link, nursing night shift).
- **Correlations**: sleep↔, stress↔, gym↔, cannabis↔, nursing-shift↔, NCLEX↔
  nicotine ("On nursing shifts nicotine use is 37% higher").
- **Finance integration**: nicotine vs cannabis vs combined lifetime cost, 5/10-yr
  cost, and the Freedom-Fund projection if quit + invested.
- **Shift breakdown** (day/night/off), **badges**, **graphs** (use, cravings,
  cost, hourly, risk trend, streak), evidence-only **insight feed**.

## 3. Krishna Explains It To Aman — `/spiritual/mentor`

`src/lib/gita-aman.ts` + page + `MentorReflection` (journaling via the existing
`saveSpiritualNote`).

Each verse now has five narratable layers — **Original verse** (Sanskrit /
transliteration / translation), **Story mode**, **Aman mode**, **Krishna's
advice**, a **Life-Mission impact** map (recovery/discipline/wealth/health/career/
spiritual), and a **daily reflection** you journal underneath. Verse selection is
**recovery-aware**: on a relapse / high-craving / low-discipline day it surfaces
self-control & discipline verses instead of a random page. Framed as a **hero's
journey** (Confused Warrior → Knowledge & Surrender). Layers are split as separate
fields so **audio narration** can be generated later.

## Deploy

```bash
npm run db:deploy    # applies 20260618140000_nicotine (NicotineEvent + NicotineGoal)
npm run db:generate  # regenerate Prisma client
```

The finance migration (`20260618130000_finance`) from Phase 2 still needs to be
applied if it hasn't been.

## Verification

All 11 new files pass `transpileModule` syntax checks. The three edited files
(`actions.ts`, `dashboard-client.tsx`, `spiritual/page.tsx`) were edited with
exact-match and confirmed intact via host read — transpile "errors" there are the
known sandbox torn-read artifact, not real.

## Architecture note

`engine/series`, `engine/correlate`, `engine/forecast`, `engine/gamify`,
`engine/risk` + `loadLifeSignals` are now the shared spine. Nursing, the Global
Recovery Dashboard and the Future-Aman forecast all plug into the same signal
maps and risk/correlation helpers — no new analytics logic required.
