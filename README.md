# AmanOS — Life Command Center

Your life operating system. A premium, dark-mode, mobile-first dashboard that turns daily discipline into something you can *see*: a live **Life Score**, an addiction **Dragon** that shrinks as you win, an **Hourglass of Freedom** ticking every clean second, progress rings, charts, and a daily Bhagavad Gita verse.

Built with **Next.js 15 · TypeScript · TailwindCSS · PostgreSQL · Prisma · Recharts · Framer Motion · PWA**.

> **Scope of this build:** the deep, working core engine — Dashboard, auto Life Score (exact weighting), Dragon (6 animated stages), Hourglass, Joint Recovery, daily trackers (protein/water/sleep/steps/NCLEX/gym/BharatFare/spiritual/budget/weight), Gym logging + muscle-recovery heatmap, Daily Planner, 30-day charts, Gita verse, and Achievements. It runs and persists to Postgres today. The heavier analytical modules (full weekly/monthly/quarterly review engines, body-map SVG, custom-metric builders) are the natural next layer on top of this schema.

---

## What's inside

| Module | Status |
|---|---|
| Executive dashboard + Apple-style progress rings | ✅ |
| Life Score (No Joint 30 · Health 25 · NCLEX 20 · BharatFare 10 · Gym 10 · Spiritual 5) with Green/Amber/Red zones | ✅ auto-calculated |
| Dragon system — power 0–100%, 6 stages, shrinks/grows with your day | ✅ animated |
| Hourglass of Freedom — live yr/mo/d/h/m/s since last joint | ✅ |
| Joint Recovery — streak, longest, relapse + craving logging (time/trigger/intensity) | ✅ |
| Protein system — quick-add foods, target 140g, derived from food log | ✅ |
| Water / Sleep / Steps / NCLEX trackers with rings | ✅ |
| Gym — log sets/reps/weight by body part + exercise library | ✅ |
| Muscle recovery heatmap (green = trained, red = neglected) | ✅ |
| Daily Planner with your default schedule + completion % | ✅ |
| Budget — daily/monthly spend, categories, remaining | ✅ |
| Charts (30-day Life Score, Protein, Weight) | ✅ |
| Bhagavad Gita daily verse | ✅ |
| Achievements (First Clean Day → Life Commander) | ✅ auto-unlock |
| PWA (installable, dark theme) | ✅ |

---

## Run it locally

```bash
# 1. install
npm install            # if peer-deps complain: npm install --legacy-peer-deps

# 2. point at a Postgres database
cp .env.example .env
#   set DATABASE_URL — e.g. a free Neon database (https://neon.tech)

# 3. create the schema + seed your settings row
npm run db:migrate     # prisma migrate dev (creates tables)
npm run db:seed        # creates the Settings row + starts your clean streak now

# 4. go
npm run dev            # http://localhost:3000
```

## Deploy (Vercel + Neon, ~5 min)

1. Create a Postgres DB on [Neon](https://neon.tech) and copy the **pooled** connection string.
2. Push this folder to a Git repo and import it into [Vercel](https://vercel.com).
3. In Vercel → Project → Settings → Environment Variables, add `DATABASE_URL`.
4. The `build` script runs `prisma generate && next build` automatically.
5. After the first deploy, apply migrations against the prod DB once:
   ```bash
   DATABASE_URL="<prod-url>" npx prisma migrate deploy
   DATABASE_URL="<prod-url>" npm run db:seed
   ```
   (Or add `prisma migrate deploy` to your Vercel build command.)

## Daily use

- Tap the **rings** quick-add buttons (protein, water) and the **+ / −** steppers (sleep, steps, NCLEX hours).
- Toggle **Gym / BharatFare / Spiritual** done.
- Log **gym sets**, **expenses**, and **weight** inline.
- Stay clean → the **streak** grows, the **Hourglass** keeps ticking, and the **Dragon** visibly weakens through its 6 stages. Hit **Log relapse** only if you slip — it resets the streak and strengthens the dragon (honest feedback).
- The **Life Score** recomputes automatically after every action.

## Configuration

Targets live in the `Settings` table (protein 140g, water 3 L, sleep 8 h, steps 8 000, NCLEX 4 h, daily budget 1 000). Change them in Prisma Studio (`npm run db:studio`) or wire up the `updateSettings` server action to a settings screen.

## Architecture

```
src/
  app/
    actions.ts        # server actions (all mutations) — recompute Life Score + achievements
    page.tsx          # server component: loads data, renders dashboard
    layout.tsx        # dark theme, fonts, PWA
  lib/
    score.ts          # Life Score + Dragon (pure functions)
    data.ts           # dashboard data loader (Prisma → serializable)
    db.ts             # Prisma client singleton
    dates.ts          # day keys + elapsed time
    gita.ts           # verse collection + daily picker
    exercises.ts      # exercise library, foods, categories, planner blocks
  components/
    dashboard-client.tsx   # the executive dashboard (client)
    ring.tsx, dragon.tsx, hourglass.tsx, charts.tsx, gita-card.tsx
prisma/schema.prisma  # Settings, DayLog, FoodEntry, GymSet, Expense, JointEvent, Achievement
```

The Life Score weighting and Dragon thresholds are isolated in `src/lib/score.ts` — change the philosophy in one place and the whole app follows.

Built to make you feel stronger the moment you open it. 🐉⚡
