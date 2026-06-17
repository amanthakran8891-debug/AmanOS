import prisma from "@/lib/db";
import { PageHeader } from "@/components/bits";
import { cravingAnalytics, type CravingRow } from "@/lib/cravings";
import { CravingDashboard } from "@/components/cravings/craving-dashboard";
import { LogCraving } from "@/components/cravings/log-craving";

export const dynamic = "force-dynamic";

export default async function CravingsPage() {
  const rows = await prisma.craving.findMany({ orderBy: { at: "desc" }, take: 2000 });
  const analytics = cravingAnalytics(rows as CravingRow[]);
  const recent = rows.slice(0, 20).map((r) => ({
    id: r.id,
    at: r.at.toISOString(),
    intensity: r.intensity,
    trigger: r.trigger,
    location: r.location,
    emotion: r.emotion,
    outcome: r.outcome,
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader
        title="Craving Analytics"
        subtitle="Every craving, stored forever — your danger windows, triggers and victory rate."
        accent="#f59e0b"
      />
      <LogCraving />
      <CravingDashboard a={analytics} recent={recent} />
    </main>
  );
}
