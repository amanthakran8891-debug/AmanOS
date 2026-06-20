import { getWeeklyReview, getMonthlyReview } from "@/lib/reviews";
import { PageHeader } from "@/components/bits";
import { ReportsClient } from "@/components/reports-client";
import { getWeeklyCeoReview } from "@/lib/weekly-review";
import { WeeklyReviewPanel } from "@/components/weekly-review";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [weekly, monthly, ceoReview] = await Promise.all([getWeeklyReview(), getMonthlyReview(), getWeeklyCeoReview()]);
  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
      <PageHeader title="Reports" subtitle="Download your weekly & monthly reports — CSV, JSON or print to PDF." accent="#fbbf24" />
      <div className="mb-4">
        <WeeklyReviewPanel data={ceoReview} />
      </div>
      <ReportsClient weekly={weekly} monthly={monthly} />
    </main>
  );
}
