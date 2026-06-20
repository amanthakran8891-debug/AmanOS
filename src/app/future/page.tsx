import { PageHeader } from "@/components/bits";
import { getFutureSimulation } from "@/lib/future-simulator";
import { FutureSimulatorPanel } from "@/components/future-simulator";

export const dynamic = "force-dynamic";

export default async function FuturePage() {
  const sim = await getFutureSimulation();
  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader title="Future Aman Simulator" subtitle="Where today’s habits lead — a directional estimate across 30/90/180/365 days." accent="#a78bfa" />
      <FutureSimulatorPanel data={sim} />
    </main>
  );
}
