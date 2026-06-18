"use client";

import { useState, useTransition } from "react";
import { saveSpiritualNote } from "@/app/actions";

export function MentorReflection({ verseRef, question, initial }: { verseRef: string; question: string; initial: string }) {
  const [text, setText] = useState(initial);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    if (!text.trim()) return;
    start(async () => {
      await saveSpiritualNote("mentor", verseRef, text.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="mt-3 rounded-2xl border border-neon-amber/30 bg-neon-amber/5 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neon-amber">Daily reflection</p>
      <p className="mt-1 text-sm font-semibold text-white">{question}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Write honestly — just for you…"
        className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-neon-amber/50 focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-end gap-3">
        {saved && <span className="text-xs text-neon-green">✓ Saved to your reflections</span>}
        <button disabled={pending || !text.trim()} onClick={save} className="rounded-xl border border-neon-amber/40 bg-neon-amber/15 px-4 py-2 text-sm font-bold text-neon-amber transition hover:bg-neon-amber/25 disabled:opacity-50">
          {pending ? "Saving…" : "Save reflection"}
        </button>
      </div>
    </div>
  );
}
