import { PageHeader } from "@/components/bits";
import { getMorningBriefing } from "@/lib/rituals";
import { MorningBriefing } from "@/components/morning-briefing";

export const dynamic = "force-dynamic";

export default async function MorningPage() {
  const data = await getMorningBriefing();
  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader title="Morning Briefing" subtitle="Your daily mission briefing — read it before anything else." accent="#22d3ee" />
      <MorningBriefing data={data} />
    </main>
  );
}
