import { getWeeklyReview, getMonthlyReview } from "@/lib/reviews";
import { PageHeader } from "@/components/bits";
import { ReportsClient } from "@/components/reports-client";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [weekly, monthly] = await Promise.all([getWeeklyReview(), getMonthlyReview()]);
  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
      <PageHeader title="Reports" subtitle="Download your weekly & monthly reports — CSV, JSON or print to PDF." accent="#fbbf24" />
      <ReportsClient weekly={weekly} monthly={monthly} />
    </main>
  );
}
