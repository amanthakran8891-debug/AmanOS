"use client";

import { useState, useTransition } from "react";
import {
  ResponsiveContainer, BarChart, Bar, ComposedChart, Line, XAxis, YAxis, Tooltip, Cell, Legend,
} from "recharts";
import { StatTile } from "@/components/bits";
import type { FinanceReport } from "@/lib/finance";
import { upsertAccount, removeAccount, removeTransaction } from "@/app/actions";

const card = "rounded-2xl border border-white/10 bg-[#0d1322]/60 p-4";
const h2 = "text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3";
const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;
const gbp2 = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

interface RecentTxn { id: string; date: string; kind: string; category: string; amount: number; recurring: boolean; note: string | null }
interface Acct { id: string; name: string; kind: string; balance: number; apr: number }

export function FinanceDashboard({ r, recent, accounts, cleanDays }: { r: FinanceReport; recent: RecentTxn[]; accounts: Acct[]; cleanDays: number }) {
  const [busy, setBusy] = useState<string | null>(null);
  const dragonColor = r.financeDragon.tier.color;
  const catData = r.categorySpend.slice(0, 8);
  const catMax = catData[0]?.amount || 1;
  const cashflow = r.cashflow.slice(-12);

  return (
    <div className="space-y-4">
      {/* ── Headline ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Net worth" value={gbp(r.netWorth)} accent={dragonColor} color={r.netWorth >= 0 ? "#34d399" : "#ff5470"} />
        <StatTile label="Net / month" value={gbp(r.netMonth)} sub="last 3 mo avg" color={r.netMonth >= 0 ? "#34d399" : "#ff5470"} accent="#34d399" />
        <StatTile label="Burn rate" value={gbp(r.burnRateMonthly)} sub="spend / month" color="#fb7185" accent="#fb7185" />
        <StatTile label="Health score" value={r.financialHealthScore} sub="of 100" accent="#a78bfa" color="#a78bfa" />
      </div>

      {/* ── Wealth level / Finance Dragon ── */}
      <div className={card} style={{ borderColor: `${dragonColor}55` }}>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className={h2 + " mb-0"}>Wealth level</p>
            <p className="text-xl font-extrabold" style={{ color: dragonColor }}>{r.wealthLevel.tier.icon} {r.wealthLevel.tier.name}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-500">Stage {r.financeDragon.stagesDefeated + 1} · Freedom meter</p>
            <p className="text-xl font-extrabold text-amber-300">{r.freedomMeter}%</p>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full" style={{ width: `${r.wealthLevel.progressPct}%`, background: dragonColor, boxShadow: `0 0 10px ${dragonColor}66` }} />
        </div>
        {r.wealthLevel.next && (
          <p className="mt-1.5 text-[11px] text-slate-500">{gbp(r.wealthLevel.toNext)} to <span style={{ color: r.wealthLevel.next.color }}>{r.wealthLevel.next.icon} {r.wealthLevel.next.name}</span></p>
        )}
      </div>

      {/* ── Cashflow ── */}
      <div className={card}>
        <p className={h2}>Cashflow — income vs expense (monthly)</p>
        {cashflow.length ? (
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={cashflow} margin={{ top: 5, right: 8, bottom: 0, left: -16 }}>
              <XAxis dataKey="key" tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(d) => String(d).slice(2)} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip contentStyle={{ background: "#0d1322", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => gbp2(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="income" fill="#34d399" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" fill="#fb7185" radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="net" stroke="#a78bfa" strokeWidth={2} dot={false} name="net" />
            </ComposedChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-slate-500">Log transactions to see your cashflow.</p>}
      </div>

      {/* ── Forecast + debt ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={card}>
          <p className={h2}>Savings forecast</p>
          {r.netMonth !== 0 ? (
            <div className="space-y-2">
              {r.savingsForecast.map((f) => (
                <div key={f.months} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">In {f.months} months</span>
                  <span className="font-bold tabular-nums" style={{ color: f.value >= r.savings ? "#34d399" : "#fb7185" }}>{gbp(f.value)}</span>
                </div>
              ))}
              <p className="pt-1 text-[11px] text-slate-500">Projected from {gbp(r.savings)} savings at {gbp(r.netMonth)}/mo net.</p>
            </div>
          ) : <p className="text-sm text-slate-500">Log income + expenses to project savings.</p>}
        </div>
        <div className={card}>
          <p className={h2}>Debt</p>
          {r.debt > 0 ? (
            <div className="space-y-1.5">
              <p className="text-2xl font-extrabold text-red-400">{gbp(r.debt)}</p>
              <p className="text-sm text-slate-400">
                {r.debtPayoffMonths === Infinity
                  ? "No payments logged — add a debt payment to forecast payoff."
                  : <>Debt-free in <span className="font-bold text-white">{r.debtPayoffMonths} months</span> at current pace.</>}
              </p>
            </div>
          ) : <p className="text-sm text-emerald-400">✓ No tracked debt. You&apos;re free.</p>}
        </div>
      </div>

      {/* ── Habit cost / Freedom Fund ── */}
      <div className={card} style={{ borderColor: "#f59e0b44" }}>
        <p className={h2}>The true cost of habits</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Weed — lifetime" value={gbp(r.weedCost.lifetime)} sub={`${gbp(r.weedCost.month)} this month`} color="#fb7185" accent="#fb7185" />
          <StatTile label="Nicotine — lifetime" value={gbp(r.nicotineCost.lifetime)} sub={`${gbp(r.nicotineCost.month)} this month`} color="#fb7185" accent="#fb7185" />
          <StatTile label="Saved staying clean" value={gbp(r.moneyRecoveredClean)} sub={`${cleanDays} clean days`} color="#34d399" accent="#34d399" />
          <StatTile label="10-yr if you relapse" value={gbp(r.projected10yrAddiction)} sub="projected drain" color="#f59e0b" accent="#f59e0b" />
        </div>
        {r.freedomFund.total > 0 && (
          <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-sm text-emerald-200">
            🏆 Freedom Fund: you&apos;ve kept <span className="font-bold">{gbp(r.freedomFund.total)}</span> out of smoke — {gbp(r.freedomFund.weedSaved)} weed + {gbp(r.freedomFund.nicotineSaved)} nicotine.
          </p>
        )}
      </div>

      {/* ── Category spend ── */}
      <div className={card}>
        <p className={h2}>Where the money goes</p>
        {catData.length ? (
          <ResponsiveContainer width="100%" height={Math.max(120, catData.length * 28)}>
            <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 16 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(s) => String(s).replace(/-/g, " ")} />
              <Tooltip contentStyle={{ background: "#0d1322", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => gbp2(v)} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {catData.map((d, i) => <Cell key={i} fill={d.amount === catMax ? "#fb7185" : "#34d399"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-slate-500">No expenses logged yet.</p>}
      </div>

      {/* ── Accounts / net worth manager ── */}
      <AccountManager accounts={accounts} savings={r.savings} investments={r.investments} debt={r.debt} />

      {/* ── Recent transactions ── */}
      <div className={card}>
        <p className={h2}>Recent transactions</p>
        {recent.length ? (
          <div className="space-y-1.5">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <span className={`w-16 shrink-0 text-right font-semibold tabular-nums ${t.kind === "income" ? "text-emerald-400" : "text-red-400"}`}>{t.kind === "income" ? "+" : "−"}{gbp(t.amount)}</span>
                <span className="flex-1 truncate text-slate-300 capitalize">{t.category.replace(/-/g, " ")}{t.recurring ? " ↻" : ""}{t.note ? <span className="text-slate-500"> · {t.note}</span> : ""}</span>
                <span className="shrink-0 text-xs text-slate-500">{t.date.slice(5)}</span>
                <button disabled={busy === t.id} onClick={async () => { setBusy(t.id); await removeTransaction(t.id); setBusy(null); }} className="shrink-0 text-xs text-slate-600 hover:text-red-400">✕</button>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-slate-500">No transactions logged yet.</p>}
      </div>
    </div>
  );
}

function AccountManager({ accounts, savings, investments, debt }: { accounts: Acct[]; savings: number; investments: number; debt: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("savings");
  const [balance, setBalance] = useState("");
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  function add() {
    if (!name.trim() || !balance) return;
    start(async () => {
      await upsertAccount({ name: name.trim(), kind, balance: Number(balance) });
      setName(""); setBalance(""); setOpen(false);
    });
  }

  const kindColor: Record<string, string> = { savings: "#34d399", cash: "#38bdf8", investment: "#a78bfa", debt: "#fb7185" };

  return (
    <div className={card}>
      <div className="mb-3 flex items-center justify-between">
        <p className={h2 + " mb-0"}>Accounts &amp; net worth</p>
        <button onClick={() => setOpen((o) => !o)} className="text-xs font-semibold text-emerald-300 hover:text-emerald-200">{open ? "close" : "+ add"}</button>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        <div><p className="text-[10px] uppercase text-slate-500">Savings</p><p className="font-bold text-emerald-400">{gbp(savings)}</p></div>
        <div><p className="text-[10px] uppercase text-slate-500">Investments</p><p className="font-bold text-violet-400">{gbp(investments)}</p></div>
        <div><p className="text-[10px] uppercase text-slate-500">Debt</p><p className="font-bold text-red-400">{gbp(debt)}</p></div>
      </div>

      {open && (
        <div className="mb-3 space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Account name (e.g. Monzo, Loan)" className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600" />
          <div className="flex flex-wrap gap-1.5">
            {["savings", "cash", "investment", "debt"].map((k) => (
              <button key={k} onClick={() => setKind(k)} className={`rounded-full border px-3 py-1 text-xs capitalize transition ${kind === k ? "border-emerald-400 bg-emerald-400/15 text-emerald-200" : "border-white/10 text-slate-400"}`}>{k}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">£</span>
            <input type="number" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Balance" className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600" />
            <button disabled={pending} onClick={add} className="shrink-0 rounded-lg border border-emerald-400/40 bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-300 disabled:opacity-50">Save</button>
          </div>
        </div>
      )}

      {accounts.length ? (
        <div className="space-y-1.5">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: kindColor[a.kind] || "#94a3b8" }} />
              <span className="flex-1 truncate text-slate-300">{a.name} <span className="text-[11px] capitalize text-slate-500">· {a.kind}</span></span>
              <span className="shrink-0 font-bold tabular-nums" style={{ color: a.kind === "debt" ? "#fb7185" : "#e8edf6" }}>{a.kind === "debt" ? "−" : ""}{gbp(a.balance)}</span>
              <button disabled={busy === a.id} onClick={async () => { setBusy(a.id); await removeAccount(a.id); setBusy(null); }} className="shrink-0 text-xs text-slate-600 hover:text-red-400">✕</button>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-slate-500">Add savings, cash, investment and debt accounts to track net worth.</p>}
    </div>
  );
}
