"use client";

import { useState, useTransition } from "react";
import { logNicotineEvent } from "@/app/actions";

const USE_TYPES = [
  { key: "cigarette", label: "Cigarette", icon: "🚬" },
  { key: "vape", label: "Vape", icon: "💨" },
  { key: "pouch", label: "Pouch", icon: "🟦" },
  { key: "cigar", label: "Cigar", icon: "🪵" },
];
const TRIGGERS = ["stress", "boredom", "coffee", "after-meal", "social", "work-break", "after-shift", "alcohol", "habit", "other"];
const SHIFTS = ["day", "night", "off"];

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-xs capitalize transition ${active ? "border-orange-400 bg-orange-400/15 text-orange-200" : "border-white/10 text-slate-400 hover:border-white/25"}`;

export function LogNicotine() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"craving" | "use">("craving");
  const [useType, setUseType] = useState("cigarette");
  const [quantity, setQuantity] = useState(1);
  const [trigger, setTrigger] = useState("");
  const [shift, setShift] = useState("");
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);

  function reset() { setTrigger(""); setShift(""); setCost(""); setNote(""); setQuantity(1); }

  function submitCraving(outcome: "won" | "lost") {
    start(async () => {
      await logNicotineEvent({ type: "craving", outcome, trigger, shift, note });
      setDone(outcome === "won" ? "💪 Craving resisted — dragon damaged" : "Logged — reset and ride the next one out");
      reset(); setTimeout(() => { setDone(null); setOpen(false); }, 1200);
    });
  }
  function submitUse() {
    start(async () => {
      await logNicotineEvent({ type: useType, quantity, cost: Number(cost) || 0, trigger, shift, note });
      setDone("Logged — the dragon healed a little. Next craving, fight it.");
      reset(); setTimeout(() => { setDone(null); setOpen(false); }, 1200);
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mb-4 w-full rounded-2xl border border-orange-400/30 bg-orange-400/10 py-3 text-sm font-semibold text-orange-200 transition hover:bg-orange-400/20">
        🚬 Log a craving or a slip
      </button>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-orange-400/30 bg-[#0d1322]/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-orange-200">Log nicotine</p>
        <button onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:text-slate-300">close</button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <button onClick={() => setMode("craving")} className={`rounded-xl border py-2 text-sm font-semibold transition ${mode === "craving" ? "border-orange-400/50 bg-orange-400/15 text-orange-300" : "border-white/10 text-slate-400"}`}>Craving</button>
        <button onClick={() => setMode("use")} className={`rounded-xl border py-2 text-sm font-semibold transition ${mode === "use" ? "border-red-400/50 bg-red-400/15 text-red-300" : "border-white/10 text-slate-400"}`}>I used</button>
      </div>

      {mode === "use" && (
        <>
          <p className="mb-1 text-xs text-slate-500">Type</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {USE_TYPES.map((t) => <button key={t.key} onClick={() => setUseType(t.key)} className={chip(useType === t.key)}>{t.icon} {t.label}</button>)}
          </div>
          <div className="mb-3 flex items-center gap-3">
            <label className="text-xs text-slate-400">Qty</label>
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} className="w-20 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-sm text-slate-200" />
            <label className="text-xs text-slate-400">£</label>
            <input type="number" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="cost" className="w-24 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-sm text-slate-200 placeholder:text-slate-600" />
          </div>
        </>
      )}

      <p className="mb-1 text-xs text-slate-500">Trigger</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {TRIGGERS.map((t) => <button key={t} onClick={() => setTrigger(trigger === t ? "" : t)} className={chip(trigger === t)}>{t.replace(/-/g, " ")}</button>)}
      </div>
      <p className="mb-1 text-xs text-slate-500">Shift (nursing)</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {SHIFTS.map((t) => <button key={t} onClick={() => setShift(shift === t ? "" : t)} className={chip(shift === t)}>{t}</button>)}
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="mb-3 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600" />

      {done ? (
        <p className="text-center text-sm font-semibold text-orange-300">{done}</p>
      ) : mode === "craving" ? (
        <div className="grid grid-cols-2 gap-2">
          <button disabled={pending} onClick={() => submitCraving("won")} className="rounded-xl border border-emerald-400/40 bg-emerald-400/15 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400/25 disabled:opacity-50">I resisted it ✓</button>
          <button disabled={pending} onClick={() => submitCraving("lost")} className="rounded-xl border border-red-400/40 bg-red-400/10 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-400/20 disabled:opacity-50">I gave in 💥</button>
        </div>
      ) : (
        <button disabled={pending} onClick={submitUse} className="w-full rounded-xl border border-red-400/40 bg-red-400/15 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-400/25 disabled:opacity-50">Log use</button>
      )}
    </div>
  );
}
