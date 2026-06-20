import { PageHeader } from "@/components/bits";
import { getBharatfareCeo } from "@/lib/bharatfare-ceo";
import { BharatfareCeoPanel } from "@/components/bharatfare-ceo";

export const dynamic = "force-dynamic";

export default async function BharatfarePage() {
  const ceo = await getBharatfareCeo();
  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader title="BharatFare CEO" subtitle="Run the business on numbers — visitors, leads, bookings, revenue, profit." accent="#22c55e" />
      <BharatfareCeoPanel data={ceo} />
    </main>
  );
}
