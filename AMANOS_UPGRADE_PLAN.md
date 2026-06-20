# AmanOS — Life OS Upgrade Plan (35 features, phased)
**Reviewed against the real codebase:** Next 15 + Prisma/Postgres. Existing models: Settings, DayLog, NclexSession, SymptomLog, JointEvent, Craving, NicotineEvent, NicotineGoal, DragonAttack/State, ForecastLog, Transaction, Review, GymSet, etc. Existing libs: recovery, nicotine, cost, damage, dragon-intel, recovery-timeline, prediction, score, cravings, reviews, finance, nclex, missions, correlations.

**Why phased, not one dump:** this is ~2–4 weeks of work on an app you use daily. I cannot run `prisma migrate` or `next build` against your live Postgres from here, so shipping 35 features (12+ new schema fields, migrations, libs, pages) blind would almost certainly break the app. Each phase below is a self-contained, build-testable changeset. Status tags: **[exists]** already there, **[partial]** present but needs extension, **[new]** to build.

---

## ✅ Done now (this turn)
- **Relapse duplicate-prevention guard** in `logCraving` (`src/app/actions.ts`): a 5-minute debounce so double-taps can't create duplicate relapses (root cause of "18 relapses in a day"). Build-safe, no migration.

---

## PHASE 0 — Data Integrity (do first; everything depends on trustworthy data) — req #11
**Status:** history-dedupe functions **[exist]** (`findDuplicateRelapses`, `deleteRelapseDuplicates`, `collapseRelapseDaysToOne`, `archiveRelapsesBefore`); prevention **[done above]**; cleanup-runner UI + confidence caps **[new]**.
- Wire a one-screen **"Data Hygiene" panel** (in `/settings` or `/intelligence`) to preview + run `findDuplicateRelapses` and delete dupes (functions exist, need a button).
- Apply the same debounce to any other relapse/nicotine create paths (`logDragonAttack`, `logNicotineEvent`, settings clock-reset).
- **Analytics confidence caps:** in `recovery.ts`/`cravings.ts`, cap impossible per-day relapse counts and flag low-confidence days. 
- *You run* the actual dedupe against your Postgres (I can't reach your DB); I provide the runner + a `scripts/dedupe-relapses.ts`.
**Files:** `src/app/actions.ts` [partial], `src/lib/recovery.ts` [partial], `src/app/settings/page.tsx` or `/intelligence` [new panel], `scripts/dedupe-relapses.ts` [new].

## PHASE 1 — Recovery & Nicotine analytics foundation (reqs: Recovery History, Smoking Analytics, Dragon Tax, Money Saved, Recovery Intelligence, Score, Timeline, Success Rate, Craving Victory)
Most of this is **[partial]** — the data models already support it; you need aggregation + display.
- **Streak history (last 7/14/21 clean runs)** — derive runs from ordered `JointEvent` relapses: start, end, duration, relapse type, cost. **[new lib]** `src/lib/streak-history.ts` + table/timeline component. (reqs: Recovery History, #12)
- **Smoking analytics split** — Joints (`JointEvent` relapse count × £5) vs Cigarettes (`NicotineEvent` type=cigarette quantity × £0.50): totals, 7d/30d/year/lifetime + cost. Extend `cost.ts`/`damage.ts` [partial]. *(Note: current `NicotineGoal.pricePerUnit` defaults to £0.6 — your spec says £0.50; I'll make joint=£5/cig=£0.50 explicit constants.)*
- **Financial Damage / 🐉 Dragon Tax** — today/7d/30d/year/lifetime via `Joints×£5 + Cigs×£0.50`; "money saved vs previous month" + "since longest relapse period"; "what it'd be if invested". `damage.ts`/`dragon-intel.ts` [partial] → card [new].
- **Money Saved dashboard** (Lost vs Saved) — counterpart card. [new]
- **Recovery Intelligence** — avg streak, best/current streak, relapses 30/90d, most-dangerous day & hour, top trigger, auto-insights ("72% of relapses 9–11 PM"). `recovery.ts`/`cravings.ts` [partial] — heatmap math largely exists for cravings, extend to relapses.
- **Recovery Score /100** (streak + relapses30d + cravings resisted + cost avoided) with ↑/→/↓ trend. `score.ts` [partial].
- **Recovery Timeline heatmap** (30/90/365d; green=clean, red=relapse, yellow=craving) GitHub-style. `recovery-timeline.ts` [partial] → calendar-heatmap component [new].
- **Recovery Success Rate** (total days, clean days, use days, %). Uses `Settings.recCumulativeCleanDays` + relapse history. [new card]
- **Craving Victory System** — log time/intensity/outcome; victories, victory rate, strongest day/hour. `Craving` model + `cravings.ts` already support this; `/cravings` page **[exists]** — extend display.

## PHASE 2 — Mission dashboards (reqs: NCLEX #1, BharatFare CEO #2, Career #6, Fitness #9)
- **NCLEX Mission Dashboard** — exam date, days remaining, completed/remaining, required/day, weekly goal, accuracy trend, readiness score. Data exists (`Settings.nclexExamDate/nclexDailyQGoal`, `NclexSession`, `DayLog.nclexQuestions`); `nclex.ts` [partial] → rebuild `/nclex` page. **High value, mostly aggregation.**
- **BharatFare CEO Dashboard** — visitors, leads, WhatsApp/affiliate clicks, bookings, revenue, profit, conversion, CEO score. ⚠ **Depends on a data source** (BharatFare's DB/GSC/WhatsApp logs). Needs an integration decision — manual entry vs API pull. `ceo.ts` [partial].
- **Career Command Center** — NMC, revalidation, NHS investigation, applications, interviews, progress score. **[new model]** `CareerItem` + migration + `/career` page.
- **Fitness Progress** — weight, waist, chest, arms, body-fat, photos, strength; feeds Life Score. `DayLog` has weightKg/bodyFat; **[new]** body-measurement model + progress-photo handling + `/gym` extension.

## PHASE 3 — Intelligence layer (reqs: ONE Thing #10, Weekly CEO Review #8, Future Simulator #5)
- **ONE Thing system** — generate today's single priority from the weakest/most-urgent pillar; show on Home + `/today`. `missions.ts`/`coach.ts` [partial] → new generator + prominent card.
- **Weekly CEO Review (auto every Sunday)** — biggest win/failure, best/weak habit, per-pillar summaries, next-week focus. `reviews.ts` [partial] + a scheduled generation. (Scheduling = a cron/scheduled task.)
- **Future Aman Simulator** — 30/90/180/365-day projected Life Score per pillar from current trend. `prediction.ts` [partial] → projection lib + panel.

---

## Dependencies & sequencing logic
1. **Phase 0** first — no point building dashboards on corrupt relapse data.
2. **Phase 1** next — the recovery/nicotine analytics are the densest part of your spec and share one data foundation.
3. **Phase 2** — independent mission dashboards (NCLEX is the highest-value, do it first within the phase; BharatFare CEO is blocked on a data-source decision).
4. **Phase 3** — the "OS brain" that sits on top of everything.

## Two decisions I need from you
- **BharatFare CEO metrics source:** manual entry, or pull from BharatFare's DB/GSC/WhatsApp logs? (Determines whether #2 is a form or an integration.)
- **Joint/cigarette price constants:** spec says joint £5 / cigarette £0.50, but `NicotineGoal.pricePerUnit` currently defaults to £0.60 — confirm I standardise to £0.50 (and whether that should retro-apply to historical cost).

## How I'll run each phase
Per phase: schema/migration (if any) → lib(s) → server actions → page/components → I give you the **migrate + build commands to run** (your machine/DB) → you confirm green → next phase. Every phase is independently revertible.

**Recommend starting:** Phase 0 finish (hygiene panel + caps + dedupe script) — smallest, unblocks trust in all recovery numbers. Say the word and I'll build it.
