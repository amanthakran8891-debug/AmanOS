// AmanOS — Finance Command Center (built on the shared engines).
import { series, sumBy, sumLastDays, type Ev } from "@/lib/engine/series";
import { savingsForecast, debtPayoffMonths, HORIZONS } from "@/lib/engine/forecast";
import { levelOf, healthScore, meter, dragonFrom, WEALTH_TIERS } from "@/lib/engine/gamify";

export interface Txn { date: string; kind: string; category: string; amount: number; recurring?: boolean }
export interface Account { name: string; kind: string; balance: number }

export const INCOME_CATEGORIES = ["salary", "bharatfare", "side-hustle", "investment-return", "other-income"];
export const EXPENSE_CATEGORIES = ["rent", "bills", "food", "coffee", "weed", "cigarettes", "fuel", "travel", "subscriptions", "shopping", "health", "family", "business", "loan", "credit-card", "savings", "investment", "other"];
const WEED_CATS = new Set(["weed", "cannabis", "joint"]);
const NIC_CATS = new Set(["cigarettes", "cigarette", "nicotine", "vape", "pouches"]);
const DEBT_CATS = new Set(["loan", "credit-card", "debt"]);
const FREEDOM_GOAL = 20000;

const round = (n: number) => Math.round(n * 100) / 100;

export interface FinanceReport {
  income: { week: number; month: number; year: number; total: number };
  expense: { week: number; month: number; year: number; total: number };
  netMonth: number;
  burnRateMonthly: number; // avg monthly expense
  categorySpend: { name: string; amount: number }[];
  cashflow: { key: string; income: number; expense: number; net: number }[]; // monthly
  netWorth: number; savings: number; investments: number; debt: number;
  savingsForecast: { months: number; value: number }[];
  debtPayoffMonths: number;
  weedCost: { week: number; month: number; year: number; lifetime: number };
  nicotineCost: { week: number; month: number; year: number; lifetime: number };
  combinedAddictionLifetime: number;
  projected10yrAddiction: number;
  moneyRecoveredClean: number;
  freedomFund: { weedSaved: number; nicotineSaved: number; total: number };
  // gamification
  wealthLevel: ReturnType<typeof levelOf>;
  financeDragon: ReturnType<typeof dragonFrom>;
  financialHealthScore: number;
  freedomMeter: number;
}

export function financeReport(input: { transactions: Txn[]; legacyExpenses: { date: string; category: string; amount: number }[]; accounts: Account[]; cleanDays: number; now?: number }): FinanceReport {
  const now = input.now ?? Date.now();
  const txnExpenses: Txn[] = input.transactions.filter((t) => t.kind === "expense");
  const income: Txn[] = input.transactions.filter((t) => t.kind === "income");
  const expenses: Txn[] = [
    ...txnExpenses,
    ...input.legacyExpenses.map((e) => ({ date: e.date, kind: "expense", category: e.category, amount: e.amount })),
  ];

  const evIncome: Ev[] = income.map((t) => ({ date: t.date, value: t.amount }));
  const evExpense: Ev[] = expenses.map((t) => ({ date: t.date, value: t.amount }));
  const win = (ev: Ev[], d: number) => round(sumLastDays(ev, d, now));

  // monthly cashflow series
  const incMonthly = series(evIncome, "month", "sum");
  const expMonthly = series(evExpense, "month", "sum");
  const months = [...new Set([...incMonthly.map((m) => m.key), ...expMonthly.map((m) => m.key)])].sort();
  const incMap = Object.fromEntries(incMonthly.map((m) => [m.key, m.value]));
  const expMap = Object.fromEntries(expMonthly.map((m) => [m.key, m.value]));
  const cashflow = months.map((k) => ({ key: k, income: round(incMap[k] ?? 0), expense: round(expMap[k] ?? 0), net: round((incMap[k] ?? 0) - (expMap[k] ?? 0)) }));
  const recent = cashflow.slice(-3);
  const burnRateMonthly = recent.length ? round(recent.reduce((s, m) => s + m.expense, 0) / recent.length) : 0;
  const avgMonthlyNet = recent.length ? round(recent.reduce((s, m) => s + m.net, 0) / recent.length) : 0;

  // accounts → net worth
  const sumKind = (k: string) => input.accounts.filter((a) => a.kind === k).reduce((s, a) => s + (a.balance || 0), 0);
  const savings = round(sumKind("savings") + sumKind("cash"));
  const investments = round(sumKind("investment"));
  const debt = round(sumKind("debt"));
  const netWorth = round(savings + investments - debt);

  // addiction costs
  const weedEv: Ev[] = expenses.filter((e) => WEED_CATS.has(e.category)).map((e) => ({ date: e.date, value: e.amount }));
  const nicEv: Ev[] = expenses.filter((e) => NIC_CATS.has(e.category)).map((e) => ({ date: e.date, value: e.amount }));
  const lifetime = (ev: Ev[]) => round(ev.reduce((s, e) => s + (e.value ?? 0), 0));
  const weedLife = lifetime(weedEv), nicLife = lifetime(nicEv);
  const cost = (ev: Ev[], life: number) => ({ week: win(ev, 7), month: win(ev, 31), year: win(ev, 365), lifetime: life });

  // money recovered: clean days × historical avg daily weed+nic spend
  const allAddictEv = [...weedEv, ...nicEv];
  const spanDays = allAddictEv.length ? Math.max(1, (now - Math.min(...allAddictEv.map((e) => new Date(String(e.date)).getTime()))) / 86400000) : 1;
  const avgDailyAddict = round((weedLife + nicLife) / spanDays);
  const moneyRecoveredClean = round(avgDailyAddict * input.cleanDays);
  const weedSaved = round((weedLife / spanDays) * input.cleanDays);
  const nicotineSaved = round((nicLife / spanDays) * input.cleanDays);

  // debt payoff: monthly recurring debt payments
  const monthlyDebtPay = round(expenses.filter((e) => DEBT_CATS.has(e.category) && new Date(String(e.date)).getTime() >= now - 31 * 86400000).reduce((s, e) => s + e.amount, 0)) || avgMonthlyNet;

  // gamification
  const incomeYear = win(evIncome, 365) || 1;
  const savingsRate = Math.max(0, avgMonthlyNet) / Math.max(1, burnRateMonthly + Math.max(0, avgMonthlyNet));
  const emergencyCover = burnRateMonthly ? savings / (burnRateMonthly * 3) : 1;
  const debtRatio = incomeYear ? debt / incomeYear : 0;
  const financialHealthScore = healthScore([
    { value: savingsRate, weight: 0.3 },
    { value: Math.min(1, emergencyCover), weight: 0.3 },
    { value: 1 - Math.min(1, debtRatio), weight: 0.25 },
    { value: avgMonthlyNet > 0 ? 1 : 0, weight: 0.15 },
  ]);

  return {
    income: { week: win(evIncome, 7), month: win(evIncome, 31), year: win(evIncome, 365), total: lifetime(evIncome) },
    expense: { week: win(evExpense, 7), month: win(evExpense, 31), year: win(evExpense, 365), total: lifetime(evExpense) },
    netMonth: avgMonthlyNet,
    burnRateMonthly,
    categorySpend: Object.entries(sumBy(expenses, (e) => e.category, (e) => e.amount)).map(([name, amount]) => ({ name, amount: round(amount) })).sort((a, b) => b.amount - a.amount),
    cashflow,
    netWorth, savings, investments, debt,
    savingsForecast: [3, 6, 12].map((m) => ({ months: m, value: savingsForecast(savings, avgMonthlyNet, m) })),
    debtPayoffMonths: debtPayoffMonths(debt, monthlyDebtPay),
    weedCost: cost(weedEv, weedLife),
    nicotineCost: cost(nicEv, nicLife),
    combinedAddictionLifetime: round(weedLife + nicLife),
    projected10yrAddiction: Math.round(avgDailyAddict * 365 * 10),
    moneyRecoveredClean,
    freedomFund: { weedSaved, nicotineSaved, total: round(weedSaved + nicotineSaved) },
    wealthLevel: levelOf(netWorth, WEALTH_TIERS),
    financeDragon: dragonFrom(netWorth, WEALTH_TIERS),
    financialHealthScore,
    freedomMeter: meter(savings, FREEDOM_GOAL),
  };
}

export { HORIZONS };
