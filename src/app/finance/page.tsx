import prisma from "@/lib/db";
import { PageHeader } from "@/components/bits";
import { ensureSettings } from "@/lib/day";
import { streakDaysFrom } from "@/lib/clean-time";
import { financeReport, type Txn, type Account } from "@/lib/finance";
import { FinanceDashboard } from "@/components/finance/finance-dashboard";
import { LogTransaction } from "@/components/finance/log-transaction";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const [txnRows, expenseRows, accountRows, settings] = await Promise.all([
    prisma.transaction.findMany({ orderBy: { date: "desc" }, take: 5000 }),
    prisma.expense.findMany({ orderBy: { date: "desc" }, take: 5000 }),
    prisma.financeAccount.findMany({ orderBy: { kind: "asc" } }),
    ensureSettings(),
  ]);

  const cleanDays = streakDaysFrom(settings.lastJointAt);

  const transactions: Txn[] = txnRows.map((t) => ({ date: t.date, kind: t.kind, category: t.category, amount: t.amount, recurring: t.recurring }));
  const legacyExpenses = expenseRows.map((e) => ({ date: e.date, category: e.category, amount: e.amount }));
  const accounts: Account[] = accountRows.map((a) => ({ name: a.name, kind: a.kind, balance: a.balance }));

  const report = financeReport({ transactions, legacyExpenses, accounts, cleanDays });

  const recent = txnRows.slice(0, 25).map((t) => ({
    id: t.id, date: t.date, kind: t.kind, category: t.category, amount: t.amount, recurring: t.recurring, note: t.note,
  }));
  const accountList = accountRows.map((a) => ({ id: a.id, name: a.name, kind: a.kind, balance: a.balance, apr: a.apr }));

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader
        title="Finance Command Center"
        subtitle="Your money operating system — cashflow, net worth, freedom fund and the true cost of every habit."
        accent="#34d399"
      />
      <LogTransaction />
      <FinanceDashboard r={report} recent={recent} accounts={accountList} cleanDays={cleanDays} />
    </main>
  );
}
