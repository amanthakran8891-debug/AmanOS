import { PageHeader } from "@/components/bits";
import { getEveningDebrief } from "@/lib/rituals";
import { EveningDebrief } from "@/components/evening-debrief";

export const dynamic = "force-dynamic";

export default async function EveningPage() {
  const data = await getEveningDebrief();
  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader title="Evening Debrief" subtitle="Your after-action review — close the day, set up tomorrow." accent="#a78bfa" />
      <EveningDebrief data={data} />
    </main>
  );
}
