"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { ChalisaLine } from "@/lib/chalisa";
import { setChalisaProgress, toggleSpiritualMark } from "@/app/actions";

export function ChalisaReader({ title, lines, hasText, streak, favourites, readToday }: {
  title: string; lines: ChalisaLine[]; hasText: boolean; streak: { current: number; best: number }; favourites: string[]; readToday: boolean;
}) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<void>) => start(() => void fn());
  const [fav, setFav] = useState(new Set(favourites));
  const [done, setDone] = useState(readToday);

  const toggleFav = (ref: string) => {
    const next = new Set(fav); next.has(ref) ? next.delete(ref) : next.add(ref); setFav(next);
    run(() => toggleSpiritualMark("chalisa", ref, "favourite"));
  };

  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-8">
      <Link href="/spiritual" className="text-xs font-semibold text-slate-500 hover:text-slate-300">← Spiritual</Link>
      <header className="mt-2 mb-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neon-amber/70">Devotion</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">{streak.current > 0 ? `${streak.current}-day streak · best ${streak.best}` : "Read today to start your streak."}</p>
      </header>

      {/* Read-today */}
      <button
        disabled={pending || done}
        onClick={() => { setDone(true); run(() => setChalisaProgress(Math.max(lines.length, 1))); }}
        className={`mb-6 w-full rounded-2xl border py-3 text-sm font-semibold transition ${done ? "border-neon-green/40 bg-neon-green/10 text-neon-green" : "border-neon-amber/40 bg-neon-amber/10 text-neon-amber hover:bg-neon-amber/20"}`}
      >
        {done ? "✓ Read today — streak kept" : "Mark today's reading complete"}
      </button>

      {!hasText ? (
        <div className="rounded-2xl border border-neon-amber/30 bg-neon-amber/5 p-5 text-center text-sm text-slate-300">
          <p className="font-semibold text-white">Text not loaded yet</p>
          <p className="mt-1">The Hanuman Chalisa loads via the data build so the sacred text is never hand-typed here. Set <code className="rounded bg-bg px-1.5 py-0.5 text-neon-amber">HANUMAN_CHALISA_URL</code> to a source you trust and run <code className="rounded bg-bg px-1.5 py-0.5 text-neon-amber">node scripts/build-spiritual-data.mjs</code>.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lines.map((l) => {
            const ref = `line-${l.index}`;
            return (
              <article key={ref} className="overflow-hidden rounded-2xl border border-line bg-[#faf5ea] text-[#2a2620] shadow-sm">
                <div className="flex items-center justify-between border-b border-[#ece2cc] px-5 py-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#a8915a]">{l.type}</span>
                  <button aria-label="favourite" onClick={() => toggleFav(ref)} disabled={pending} className="text-[#a8915a] transition hover:scale-110">{fav.has(ref) ? "♥" : "♡"}</button>
                </div>
                <div className="px-5 py-4 text-center">
                  {l.devanagari && <p className="whitespace-pre-line font-serif text-lg leading-relaxed text-[#7a3b12]">{l.devanagari}</p>}
                  {l.transliteration && <p className="mt-2 text-sm italic text-[#a8915a]">{l.transliteration}</p>}
                  {l.meaning && <p className="mt-2 text-sm leading-relaxed text-[#2a2620]">{l.meaning}</p>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
