"use client";

import { useState } from "react";

interface Command {
  key: string;
  label: string;
  done: boolean;
  manual?: boolean; // self-checked (not tracked from data)
}

/** Today's Command — a sharp directive checklist. Tracked items reflect real
 *  data; non-trackable guards (e.g. "no phone in room") are manual self-checks. */
export function CommandCard({
  gymDone,
  nclexDone,
  proteinDone,
  cleanToday,
  dangerWindowLabel,
}: {
  gymDone: boolean;
  nclexDone: boolean;
  proteinDone: boolean;
  cleanToday: boolean;
  dangerWindowLabel: string | null;
}) {
  const [manual, setManual] = useState<Record<string, boolean>>({});

  const commands: Command[] = [
    { key: "gym", label: "Gym before 8 PM", done: gymDone },
    { key: "phone", label: dangerWindowLabel ? `No phone in room ${dangerWindowLabel}` : "No phone in room 9–11 PM", done: !!manual.phone, manual: true },
    { key: "nclex", label: "NCLEX 30–50 questions", done: nclexDone },
    { key: "survive", label: "Survive until midnight", done: cleanToday },
  ];
  void proteinDone; // protein lives on the Mission Board; kept out of the command list to stay sharp

  const completed = commands.filter((c) => c.done).length;
  const pct = Math.round((completed / commands.length) * 100);

  return (
    <div className="card" style={{ background: "linear-gradient(160deg, rgba(52,245,197,0.10), rgba(13,19,34,0.6))" }}>
      <div className="flex items-center justify-between">
        <p className="label text-neon-green">⚡ Today&apos;s Command</p>
        <span className="text-sm font-black text-neon-green">{completed}/{commands.length}</span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg">
        <div className="h-full rounded-full bg-neon-green transition-all" style={{ width: `${pct}%`, boxShadow: "0 0 10px rgba(52,245,197,0.6)" }} />
      </div>

      <ol className="mt-3 space-y-1.5">
        {commands.map((c, i) => {
          const row = (
            <>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-xs ${c.done ? "border-neon-green bg-neon-green text-bg" : "border-line text-transparent"}`}>✓</span>
              <span className="text-[13px] font-semibold text-slate-500">{i + 1}.</span>
              <span className={`flex-1 text-sm font-semibold ${c.done ? "text-slate-400 line-through" : "text-white"}`}>{c.label}</span>
            </>
          );
          return c.manual ? (
            <li key={c.key}>
              <button onClick={() => setManual((m) => ({ ...m, [c.key]: !m[c.key] }))} className="flex w-full items-center gap-2.5 text-left">
                {row}
              </button>
            </li>
          ) : (
            <li key={c.key} className="flex items-center gap-2.5">{row}</li>
          );
        })}
      </ol>
    </div>
  );
}
