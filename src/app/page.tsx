import { getDashboardData, getCeoData } from "@/lib/data";
import { verseForDay } from "@/lib/gita";
import { wisdomForDay } from "@/lib/wisdom";
import { prettyDate } from "@/lib/dates";
import { DashboardClient } from "@/components/dashboard-client";
import { getSmokingSplit, dragonTaxFromSplit } from "@/lib/smoking-split";
import { getMoneySavedInputs, computeMoneySaved } from "@/lib/money-saved";
import { getRecoverySuccess } from "@/lib/recovery-success";
import { getCravingVictory } from "@/lib/craving-victory";
import { getDisciplineHistory } from "@/lib/discipline-history";
import { getBharatfareCeo } from "@/lib/bharatfare-ceo";
import { getCareerCommand } from "@/lib/career";
import { getCleanRuns } from "@/lib/streak-history";
import { getFitness } from "@/lib/fitness";
import { getOneThing } from "@/lib/one-thing";
import { getWeeklyCeoReview } from "@/lib/weekly-review";
import { getRecoveryLogs } from "@/lib/recovery-logs";
import { getFutureSimulation } from "@/lib/future-simulator";
import { getDailyBriefing } from "@/lib/daily-briefing";

export const dynamic = "force-dynamic";

export default async function Home() {
  // CEO cockpit data is required by DashboardClient — fetch it in parallel with
  // the dashboard data. getCeoData() takes no args; it loads its own inputs.
  const [data, ceo, smoking, savedInputs, recoverySuccess, cravingVictory, disciplineHistory, bharatfareCeo, career, cleanRunHistory, fitness, oneThing, weeklyReview, recoveryLogs, future, briefing] = await Promise.all([getDashboardData(), getCeoData(), getSmokingSplit(), getMoneySavedInputs(), getRecoverySuccess(), getCravingVictory(), getDisciplineHistory(), getBharatfareCeo(), getCareerCommand(), getCleanRuns(), getFitness(), getOneThing(), getWeeklyCeoReview(), getRecoveryLogs(), getFutureSimulation(), getDailyBriefing()]);
  const verse = verseForDay(data.date);
  const wisdom = wisdomForDay(data.date);
  return <DashboardClient data={data} ceo={ceo} verse={verse} wisdom={wisdom} dateLabel={prettyDate()} dragonTax={dragonTaxFromSplit(smoking)} moneySaved={computeMoneySaved(smoking, savedInputs)} recoverySuccess={recoverySuccess} cravingVictory={cravingVictory} disciplineHistory={disciplineHistory} bharatfareCeo={bharatfareCeo} career={career} cleanRuns={cleanRunHistory.runs} fitness={fitness} oneThing={oneThing} weeklyReview={weeklyReview} recoveryToday={recoveryLogs.today} future={future} briefing={briefing} />;
}
