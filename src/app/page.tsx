import { getDashboardData } from "@/lib/data";
import { verseForDay } from "@/lib/gita";
import { wisdomForDay } from "@/lib/wisdom";
import { prettyDate } from "@/lib/dates";
import { DashboardClient } from "@/components/dashboard-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getDashboardData();
  const verse = verseForDay(data.date);
  const wisdom = wisdomForDay(data.date);
  return <DashboardClient data={data} verse={verse} wisdom={wisdom} dateLabel={prettyDate()} />;
}
