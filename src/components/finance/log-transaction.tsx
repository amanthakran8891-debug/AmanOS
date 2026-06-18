"use client";

import { useState, useTransition } from "react";
import { addTransaction } from "@/app/actions";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/finance";

const chip = (active: boolean, color: string) =>
  `rounded-full border px-3 py-1 text-xs capitalize transition ${active ? `border-${color}-400 bg-${color}-400/15 text-${color}-200` : "border-white/10 text-slate-400 hover:border-white/25"}`;

export function LogTransaction() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState("food");
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  const cats = kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function submit() {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    start(async () => {
      await addTransaction({ kind, category, amount: amt, recurring, note });
      setAmount(""); setNote(""); setRecurring(false);
      setDone(true);
      setTimeout(() => { setDone(false); setOpen(false); }, 1000);
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mb-4 w-full rounded-2xl border border-emerald-400/30 bg-emerald-400/10 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20">
        + Log income or expense
      </button>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-[#0d1322]/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-emerald-200">Log a transaction</p>
        <button onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:text-slate-300">close</button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <button onClick={() => { setKind("expense"); setCategory(EXPENSE_CATEGORIES[2]); }} className={`rounded-xl border py-2 text-sm font-semibold transition ${kind === "expense" ? "border-red-400/50 bg-red-400/15 text-red-300" : "border-white/10 text-slate-400"}`}>Expense</button>
        <button onClick={() => { setKind("income"); setCategory(INCOME_CATEGORIES[0]); }} className={`rounded-xl border py-2 text-sm font-semibold transition ${kind === "income" ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-300" : "border-white/10 text-slate-400"}`}>Income</button>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg font-bold text-slate-400">£</span>
        <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-lg font-bold text-white placeholder:text-slate-600" />
      </div>

      <p className="mb-1 text-xs text-slate-500">Category</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {cats.map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`rounded-full border px-3 py-1 text-xs capitalize transition ${category === c ? "border-emerald-400 bg-emerald-400/15 text-emerald-200" : "border-white/10 text-slate-400 hover:border-white/25"}`}>
            {c.replace(/-/g, " ")}
          </button>
        ))}
      </div>

      <label className="mb-3 flex items-center gap-2 text-xs text-slate-400">
        <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="accent-emerald-400" />
        Recurring (monthly / fixed)
      </label>

      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="mb-3 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600" />

      {done ? (
        <p className="text-center text-sm font-semibold text-emerald-400">✓ Logged</p>
      ) : (
        <button disabled={pending} onClick={submit} className="w-full rounded-xl border border-emerald-400/40 bg-emerald-400/15 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400/25 disabled:opacity-50">Save transaction</button>
      )}
    </div>
  );
}
