import prisma from "@/lib/db";
import { todayKey } from "@/lib/dates";
import { suggestWorkout, coachingForDay } from "@/lib/workouts";
import { GymClient } from "@/components/gym-client";
import { PageHeader } from "@/components/bits";

export const dynamic = "force-dynamic";

const RECOVERY_PARTS = ["Chest", "Back", "Legs", "Shoulders", "Biceps", "Triceps", "Abs", "Cardio"];

export default async function GymPage() {
  const date = todayKey();
  const sets = await prisma.gymSet.findMany({ where: { date }, orderBy: { createdAt: "desc" } });

  const recency: Record<string, number | null> = {};
  for (const p of RECOVERY_PARTS) {
    const last = await prisma.gymSet.findFirst({ where: { bodyPart: p }, orderBy: { date: "desc" } });
    recency[p] = last ? Math.max(0, Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000)) : null;
  }

  const suggestion = suggestWorkout(recency);
  const coaching = coachingForDay(date);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
      <PageHeader title="Gym" subtitle="Pick a mode, train the suggestion, log every set." accent="#fb7185" />
      <GymClient
        suggestion={suggestion}
        coaching={coaching}
        recency={recency}
        todaySets={sets.map((g) => ({ id: g.id, bodyPart: g.bodyPart, exercise: g.exercise, sets: g.sets, reps: g.reps, weightKg: g.weightKg }))}
      />
    </main>
  );
}
