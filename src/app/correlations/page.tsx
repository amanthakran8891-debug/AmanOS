import { PageHeader } from "@/components/bits";
import { buildCorrelationReport } from "@/lib/correlations";
import { CorrelationDashboard } from "@/components/correlations/correlation-dashboard";

export const dynamic = "force-dynamic";

export default async function CorrelationsPage() {
  const report = await buildCorrelationReport(120);
  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader
        title="Life Correlations"
        subtitle="Why your life improves or slips — patterns discovered across every signal, and tomorrow's relapse risk."
        accent="#38bdf8"
      />
      <CorrelationDashboard r={report} />
    </main>
  );
}
