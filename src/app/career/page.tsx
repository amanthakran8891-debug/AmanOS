import { PageHeader } from "@/components/bits";
import { getCareerCommand } from "@/lib/career";
import { CareerPanel } from "@/components/career";

export const dynamic = "force-dynamic";

export default async function CareerPage() {
  const career = await getCareerCommand();
  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader title="Career Command Center" subtitle="Protect your registration, clear investigations, and drive the job search." accent="#22d3ee" />
      <CareerPanel data={career} />
    </main>
  );
}
