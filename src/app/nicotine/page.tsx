import prisma from "@/lib/db";
import { PageHeader } from "@/components/bits";
import { buildNicotineReport } from "@/lib/nicotine";
import { NicotineDashboard } from "@/components/nicotine/nicotine-dashboard";
import { LogNicotine } from "@/components/nicotine/log-nicotine";

export const dynamic = "force-dynamic";

export default async function NicotinePage() {
  const report = await buildNicotineReport(120);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await (prisma as any).nicotineEvent.findMany({ orderBy: { at: "desc" }, take: 20 }).catch(() => []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recent = rows.map((r: any) => ({
    id: r.id, at: r.at.toISOString(), type: r.type, quantity: r.quantity, cost: r.cost,
    trigger: r.trigger, outcome: r.outcome, shift: r.shift,
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader
        title="Nicotine Command Center"
        subtitle="The second dragon — cravings, money drain and dependency. Independent of cannabis, on the same engines."
        accent="#fb923c"
      />
      <LogNicotine />
      <NicotineDashboard r={report} recent={recent} />
    </main>
  );
}
