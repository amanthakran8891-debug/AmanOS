import { getDashboardData } from "@/lib/data";
import { prettyDate } from "@/lib/dates";
import { TodayClient } from "@/components/today-client";
import { getOneThing } from "@/lib/one-thing";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const [data, oneThing] = await Promise.all([getDashboardData(), getOneThing()]);
  return <TodayClient data={data} dateLabel={prettyDate()} oneThing={oneThing} />;
}
