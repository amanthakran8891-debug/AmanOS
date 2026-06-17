# Craving Analytics Engine (AmanOS)

_Built 2026-06-18. First command center of the AmanOS → Personal OS evolution._

## What it does

Every craving is now stored forever with full context, and turned into insight —
not just a counter.

**Log** (`/cravings` → "⚔ Log a craving"): intensity 1–10, trigger, location,
emotion, note, and the outcome — **I resisted it (won)** or **I used (lost)**.
A "lost" also records a relapse on the cannabis timeline.

**Analytics** (`/cravings`):
- **Victory stats** — cravings won, lost, victory rate %, avg intensity.
- **Danger windows** — most dangerous hour (e.g. 08:00–10:00), day, location,
  top trigger, top emotion, and last-7d-vs-prev-7d trend.
- **Graphs (recharts)** — cravings over time (30d, total + lost), by hour of day,
  intensity distribution.
- **Heatmap** — day × hour grid, intensity-shaded.
- **Breakdowns** — by trigger / location / emotion.
- **Recent log** — last 20, deletable.

It's linked from the home dashboard as a command-center card.

## Files

- `prisma/schema.prisma` — new `Craving` model (at, intensity, trigger, location,
  emotion, outcome, note).
- `prisma/migrations/20260618120000_add_craving/migration.sql` — creates the table.
- `src/lib/cravings.ts` — pure analytics (victory rate, heatmap, danger windows,
  daily/weekly/monthly series, trend) + curated trigger/location/emotion lists.
- `src/app/actions.ts` — `logCraving` + `removeCraving` server actions.
- `src/app/cravings/page.tsx` — the page (server-reads + computes analytics).
- `src/components/cravings/craving-dashboard.tsx` — charts/heatmap/insights (client).
- `src/components/cravings/log-craving.tsx` — quick-log form (client).
- `src/components/dashboard-client.tsx` — home nav card.

## Deploy (required — schema changed)

```
npm run db:deploy      # applies the new migration (creates "Craving")
npm run db:generate    # regenerates the Prisma client (adds prisma.craving)
npm run build && npm start   # or your deploy flow
```
Until `db:generate` runs, `prisma.craving` won't exist on the client and the
build will error — this is expected after a schema change.

## How this seeds the rest of the 15-command-center plan

The pattern here — **model → analytics lib → server actions → page + recharts +
heatmap + gamified stats** — is the template for the next command centers:
Nicotine (own model + dragon), Finance (Expense exists; add dashboard + cost
analytics + Freedom Fund), Nursing (Shift model + correlation), Life Timeline,
Future Simulator, Recovery Risk AI. The Craving data also feeds Recovery Risk AI
(cravings-by-day/sleep) and the Recovery Command Center's victory stats.

## Suggested next

1. **Recovery Command Center upgrade** — surface won/lost + victory rate +
   longest hour/day streak on `/recovery` (uses this engine's data).
2. **Nicotine Command Center** — clone this pattern for cigarettes (own dragon).
3. **Finance Command Center** — biggest missing area (dashboard + cost analytics +
   Freedom Fund) on the existing `Expense` model.
