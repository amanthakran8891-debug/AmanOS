import { PageHeader } from "@/components/bits";
import { getFitness } from "@/lib/fitness";
import { FitnessPanel } from "@/components/fitness";

export const dynamic = "force-dynamic";

export default async function FitnessPage() {
  const fitness = await getFitness();
  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader title="Fitness Command Center" subtitle="Weight, strength, body metrics and consistency — measured, not guessed." accent="#a3e635" />
      <FitnessPanel data={fitness} />
    </main>
  );
}
