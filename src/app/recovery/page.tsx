import { getRecoveryData } from "@/lib/data";
import { PageHeader } from "@/components/bits";
import { RecoveryClient } from "@/components/recovery-client";

export const dynamic = "force-dynamic";

export default async function RecoveryPage() {
  const data = await getRecoveryData();
  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader title="Recovery & Freedom" subtitle="An estimated recovery model — personalised by your clean time and daily symptoms." accent="#34f5c5" />
      <RecoveryClient data={data} />
    </main>
  );
}
