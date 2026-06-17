"use client";

import { useState, useTransition } from "react";
import { logCraving } from "@/app/actions";
import { TRIGGERS, LOCATIONS, EMOTIONS } from "@/lib/cravings";

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-xs capitalize transition ${active ? "border-amber-400 bg-amber-400/15 text-amber-200" : "border-white/10 text-slate-400 hover:border-white/25"}`;

export function LogCraving() {
  const [open, setOpen] = useState(false);
  const [intensity, setIntensity] = useState(5);
  const [trigger, setTrigger] = useState("");
  const [location, setLocation] = useState("");
  const [emotion, setEmotion] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState<"won" | "lost" | null>(null);

  function submit(outcome: "won" | "lost") {
    start(async () => {
      await logCraving({ intensity, trigger, location, emotion, outcome, note });
      setDone(outcome);
      setTrigger(""); setLocation(""); setEmotion(""); setNote(""); setIntensity(5);
      setTimeout(() => { setDone(null); setOpen(false); }, 1200);
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mb-4 w-full rounded-2xl border border-amber-400/30 bg-amber-400/10 py-3 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/20">
        ⚔ Log a craving
      </button>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-amber-400/30 bg-[#0d1322]/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-amber-200">Log a craving</p>
        <button onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:text-slate-300">close</button>
      </div>

      <label className="mb-1 block text-xs text-slate-400">Intensity: <span className="font-semibold text-amber-300">{intensity}/10</span></label>
      <input type="range" min={1} max={10} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="mb-3 w-full accent-amber-400" />

      <p className="mb-1 text-xs text-slate-500">Trigger</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {TRIGGERS.map((t) => <button key={t} onClick={() => setTrigger(trigger === t ? "" : t)} className={chip(trigger === t)}>{t.replace(/-/g, " ")}</button>)}
      </div>
      <p className="mb-1 text-xs text-slate-500">Location</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {LOCATIONS.map((t) => <button key={t} onClick={() => setLocation(location === t ? "" : t)} className={chip(location === t)}>{t.replace(/-/g, " ")}</button>)}
      </div>
      <p className="mb-1 text-xs text-slate-500">Emotion</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {EMOTIONS.map((t) => <button key={t} onClick={() => setEmotion(emotion === t ? "" : t)} className={chip(emotion === t)}>{t}</button>)}
      </div>

      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="mb-3 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600" />

      {done ? (
        <p className={`text-center text-sm font-semibold ${done === "won" ? "text-emerald-400" : "text-red-400"}`}>{done === "won" ? "💪 Logged — craving defeated" : "Logged — reset and ride the next one out"}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button disabled={pending} onClick={() => submit("won")} className="rounded-xl border border-emerald-400/40 bg-emerald-400/15 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400/25 disabled:opacity-50">I resisted it ✓</button>
          <button disabled={pending} onClick={() => submit("lost")} className="rounded-xl border border-red-400/40 bg-red-400/10 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-400/20 disabled:opacity-50">I used 💥</button>
        </div>
      )}
    </div>
  );
}
