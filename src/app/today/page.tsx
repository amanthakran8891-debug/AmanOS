import { getDashboardData } from "@/lib/data";
import { prettyDate } from "@/lib/dates";
import { TodayClient } from "@/components/today-client";
import { getOneThing } from "@/lib/one-thing";
import { getDailyBriefing } from "@/lib/daily-briefing";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const [data, oneThing, briefing] = await Promise.all([getDashboardData(), getOneThing(), getDailyBriefing()]);
  return <TodayClient data={data} dateLabel={prettyDate()} oneThing={oneThing} briefing={briefing} />;
}
