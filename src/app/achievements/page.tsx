import { getDashboardData } from "@/lib/data";
import { PageHeader } from "@/components/bits";
import { AchievementsClient } from "@/components/achievements-client";

export const dynamic = "force-dynamic";

type Day = { jointClean: boolean; gymDone: boolean; nclexHours: number; proteinG: number; sleepHours: number; bharatfareDone: boolean };

function streak(history: Day[], hit: (d: Day) => boolean) {
  let cur = 0;
  let longest = 0;
  for (const d of history) {
    if (hit(d)) {
      cur++;
      longest = Math.max(longest, cur);
    } else cur = 0;
  }
  return { current: cur, longest };
}

export default async function AchievementsPage() {
  const data = await getDashboardData();
  const h = data.history as unknown as Day[];
  const s = data.settings;

  const gym = streak(h, (d) => d.gymDone);
  const nclex = streak(h, (d) => d.nclexHours >= s.nclexHoursTarget);
  const protein = streak(h, (d) => d.proteinG >= s.proteinTarget);
  const sleep = streak(h, (d) => d.sleepHours >= s.sleepTarget);
  const bf = streak(h, (d) => d.bharatfareDone);

  const records = [
    { label: "Joint-Free", icon: "🚭", current: data.streakDays, longest: Math.max(s.longestStreakDays, data.streakDays), color: "#34f5c5" },
    { label: "Gym", icon: "🏋", current: gym.current, longest: gym.longest, color: "#fb7185" },
    { label: "NCLEX", icon: "📚", current: nclex.current, longest: nclex.longest, color: "#fbbf24" },
    { label: "Protein", icon: "🥩", current: protein.current, longest: protein.longest, color: "#a78bfa" },
    { label: "Sleep", icon: "😴", current: sleep.current, longest: sleep.longest, color: "#22d3ee" },
    { label: "BharatFare", icon: "✈", current: bf.current, longest: bf.longest, color: "#34f5c5" },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
      <PageHeader title="Streak Wall" subtitle="Your records and unlocks — game-style." accent="#fbbf24" />
      <AchievementsClient records={records} unlocked={data.achievements} streakDays={data.streakDays} />
    </main>
  );
}
