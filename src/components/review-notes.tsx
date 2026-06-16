"use client";

import { useState, useTransition } from "react";
import { saveReview } from "@/app/actions";

export function ReviewNotes({
  period,
  periodKey,
  lesson,
  focus,
  lessonLabel = "Lesson of the week",
  focusLabel = "Next week focus",
}: {
  period: "week" | "month" | "quarter";
  periodKey: string;
  lesson: string;
  focus: string;
  lessonLabel?: string;
  focusLabel?: string;
}) {
  const [l, setL] = useState(lesson);
  const [f, setF] = useState(focus);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="card">
      <p className="label text-neon-violet">Reflection</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-slate-300">{lessonLabel}</span>
          <textarea className="input mt-1 h-24 resize-none" value={l} onChange={(e) => { setL(e.target.value); setSaved(false); }} placeholder="What did this period teach you?" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-300">{focusLabel}</span>
          <textarea className="input mt-1 h-24 resize-none" value={f} onChange={(e) => { setF(e.target.value); setSaved(false); }} placeholder="What is the single focus next period?" />
        </label>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <button className="btn-neon" disabled={pending} onClick={() => start(async () => { await saveReview(period, periodKey, l, f); setSaved(true); })}>
          {pending ? "Saving…" : "Save reflection"}
        </button>
        {saved && <span className="text-xs text-neon-green">Saved ✓</span>}
      </div>
    </div>
  );
}
