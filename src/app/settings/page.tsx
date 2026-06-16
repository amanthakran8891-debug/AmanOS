import prisma from "@/lib/db";
import { PageHeader } from "@/components/bits";
import { SettingsClient } from "@/components/settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1, lastJointAt: new Date() } });
  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
      <PageHeader title="Settings" subtitle="Tune your targets — the Life Score follows instantly." accent="#22d3ee" />
      <SettingsClient
        initial={{
          proteinTarget: s.proteinTarget,
          waterTarget: s.waterTarget,
          sleepTarget: s.sleepTarget,
          stepsTarget: s.stepsTarget,
          caloriesTarget: s.caloriesTarget,
          nclexHoursTarget: s.nclexHoursTarget,
          dailyBudget: s.dailyBudget,
          gymDaysTarget: s.gymDaysTarget,
          noJointGoalDays: s.noJointGoalDays,
          weightGoal: s.weightGoal ?? 0,
          lastJointAt: s.lastJointAt ? s.lastJointAt.toISOString() : null,
        }}
      />
    </main>
  );
}
