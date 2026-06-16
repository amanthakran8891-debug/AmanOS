import { getDashboardData, getCeoData } from "@/lib/data";
import { verseForDay } from "@/lib/gita";
import { wisdomForDay } from "@/lib/wisdom";
import { prettyDate } from "@/lib/dates";
import { DashboardClient } from "@/components/dashboard-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  // CEO cockpit data is required by DashboardClient — fetch it in parallel with
  // the dashboard data. getCeoData() takes no args; it loads its own inputs.
  const [data, ceo] = await Promise.all([getDashboardData(), getCeoData()]);
  const verse = verseForDay(data.date);
  const wisdom = wisdomForDay(data.date);
  return <DashboardClient data={data} ceo={ceo} verse={verse} wisdom={wisdom} dateLabel={prettyDate()} />;
}
