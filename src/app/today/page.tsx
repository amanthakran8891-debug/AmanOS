import { getDashboardData } from "@/lib/data";
import { prettyDate } from "@/lib/dates";
import { TodayClient } from "@/components/today-client";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const data = await getDashboardData();
  return <TodayClient data={data} dateLabel={prettyDate()} />;
}
