"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { GitaChapter, GitaVerse, VerseLife } from "@/lib/gita-library";
import { setGitaProgress, toggleSpiritualMark, saveSpiritualNote } from "@/app/actions";

export function GitaReader({ chapter, verses, bookmarks, favourites, notes, life, current }: {
  chapter: GitaChapter; verses: GitaVerse[]; bookmarks: string[]; favourites: string[]; notes: Record<string, string>; life: Record<string, VerseLife>; current: { chapter: number; verse: number };
}) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<void>) => start(() => void fn());
  const [bm, setBm] = useState(new Set(bookmarks));
  const [fav, setFav] = useState(new Set(favourites));
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const toggle = (set: Set<string>, ref: string, type: "bookmark" | "favourite", setter: (s: Set<string>) => void) => {
    const next = new Set(set); next.has(ref) ? next.delete(ref) : next.add(ref); setter(next);
    run(() => toggleSpiritualMark("gita", ref, type));
  };

  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-8">
      <Link href="/spiritual/gita" className="text-xs font-semibold text-slate-500 hover:text-slate-300">← All chapters</Link>
      <header className="mt-2 mb-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neon-violet/70">Chapter {chapter.number}</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-white">{chapter.sanskrit}</h1>
        <p className="text-sm text-slate-300">{chapter.translation} · {chapter.meaning}</p>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400">{chapter.summary}</p>
      </header>

      {verses.length === 0 ? (
        <div className="rounded-2xl border border-neon-amber/30 bg-neon-amber/5 p-5 text-center text-sm text-slate-300">
          <p className="font-semibold text-white">Verses not loaded yet</p>
          <p className="mt-1">The public-domain text (gita/gita, Unlicense) loads via a one-time build: <code className="rounded bg-bg px-1.5 py-0.5 text-neon-amber">node scripts/build-spiritual-data.mjs</code>, then rebuild the app. Nothing is ever hand-written here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {verses.map((v) => {
            const ref = `${v.chapter}.${v.verse}`;
            const isCurrent = current.chapter === v.chapter && current.verse === v.verse;
            return (
              <article key={ref} id={`v${ref}`} className="scroll-mt-20 overflow-hidden rounded-2xl border border-line bg-[#f7f3ea] text-[#2a2620] shadow-sm">
                <div className="flex items-center justify-between border-b border-[#e6ddc9] px-5 py-2">
                  <span className="text-xs font-bold tracking-wider text-[#8a7a55]">{ref}{isCurrent ? " · here" : ""}</span>
                  <div className="flex items-center gap-3 text-[#8a7a55]">
                    <button aria-label="favourite" onClick={() => toggle(fav, ref, "favourite", setFav)} disabled={pending} className="transition hover:scale-110">{fav.has(ref) ? "♥" : "♡"}</button>
                    <button aria-label="bookmark" onClick={() => toggle(bm, ref, "bookmark", setBm)} disabled={pending} className="transition hover:scale-110">{bm.has(ref) ? "🔖" : "🏷"}</button>
                    <button aria-label="note" onClick={() => { setNoteOpen(noteOpen === ref ? null : ref); setNoteText(notes[ref] ?? ""); }} className="text-sm transition hover:scale-110">✎</button>
                  </div>
                </div>
                <div className="px-5 py-4">
                  {v.sanskrit && <p className="whitespace-pre-line text-center font-serif text-lg leading-relaxed text-[#5a2f17]">{v.sanskrit}</p>}
                  {v.transliteration && <p className="mt-2 text-center text-sm italic leading-relaxed text-[#8a7a55]">{v.transliteration}</p>}
                  {v.translation && <p className="mt-3 text-[15px] leading-relaxed text-[#2a2620]"><span className="text-[10px] font-bold uppercase tracking-wide text-[#a8915a]">English</span><br />{v.translation}</p>}
                  {v.hindi && <p className="mt-2 text-[15px] leading-relaxed text-[#3a3228]" lang="hi"><span className="text-[10px] font-bold uppercase tracking-wide text-[#a8915a]">हिंदी</span><br />{v.hindi}</p>}

                  {life[ref] && (
                    <div className="mt-3 rounded-lg border-l-2 border-[#c9a14a] bg-[#f1ead7] px-3 py-2.5">
                      <p className="text-[13px] leading-relaxed text-[#5a4a2a]"><b>In simple words —</b> {life[ref].meaning}</p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-[#5a4a2a]"><b>In your life —</b> {life[ref].application}</p>
                    </div>
                  )}

                  {notes[ref] && noteOpen !== ref && (
                    <p className="mt-3 rounded-lg border-l-2 border-[#c9a14a] bg-[#efe7d3] px-3 py-2 text-sm text-[#5a4a2a]">“{notes[ref]}”</p>
                  )}
                  {noteOpen === ref && (
                    <div className="mt-3">
                      <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} placeholder="Your reflection on this verse…" className="w-full rounded-lg border border-[#d8cdb0] bg-white px-3 py-2 text-sm text-[#2a2620] outline-none focus:border-[#c9a14a]" />
                      <div className="mt-1.5 flex gap-2">
                        <button disabled={pending} onClick={() => { notes[ref] = noteText; run(() => saveSpiritualNote("gita", ref, noteText)); setNoteOpen(null); }} className="rounded-lg bg-[#5a2f17] px-3 py-1.5 text-xs font-semibold text-white">Save reflection</button>
                        <button onClick={() => setNoteOpen(null)} className="rounded-lg border border-[#d8cdb0] px-3 py-1.5 text-xs text-[#8a7a55]">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t border-[#e6ddc9] px-5 py-2">
                  <button disabled={pending} onClick={() => run(() => setGitaProgress(v.chapter, v.verse))} className="text-xs font-semibold text-[#8a7a55] hover:text-[#5a2f17]">Continue from here →</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <nav className="mt-8 flex justify-between text-sm">
        {chapter.number > 1 ? <Link href={`/spiritual/gita/${chapter.number - 1}`} className="text-slate-400 hover:text-white">← Chapter {chapter.number - 1}</Link> : <span />}
        {chapter.number < 18 ? <Link href={`/spiritual/gita/${chapter.number + 1}`} className="text-slate-400 hover:text-white">Chapter {chapter.number + 1} →</Link> : <span />}
      </nav>
    </main>
  );
}
