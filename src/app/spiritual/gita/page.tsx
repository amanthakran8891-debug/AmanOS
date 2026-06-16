import Link from "next/link";
import { CHAPTERS, chapterLoadedCount, HAS_VERSES, TOTAL_VERSES, LOADED_VERSES } from "@/lib/gita-library";
import { GitaSearch } from "@/components/spiritual/gita-search";

export const dynamic = "force-dynamic";

export default function GitaLibraryPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-8">
      <header className="mb-5">
        <Link href="/spiritual" className="text-xs font-semibold text-slate-500 hover:text-slate-300">← Spiritual</Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Bhagavad Gita</h1>
        <p className="text-sm text-slate-400">18 chapters · {TOTAL_VERSES} verses{HAS_VERSES ? ` · ${LOADED_VERSES} loaded` : ""}.</p>
      </header>

      {HAS_VERSES ? (
        <GitaSearch />
      ) : (
        <div className="mb-5 rounded-2xl border border-neon-amber/30 bg-neon-amber/5 p-4 text-sm text-slate-300">
          The verse text is public-domain (gita/gita, Unlicense) and loads via a one-time data build. Run <code className="rounded bg-bg px-1.5 py-0.5 text-neon-amber">node scripts/build-spiritual-data.mjs</code>, then rebuild. Chapter summaries below are available now.
        </div>
      )}

      <div className="space-y-2">
        {CHAPTERS.map((c) => {
          const loaded = chapterLoadedCount(c.number);
          return (
            <Link key={c.number} href={`/spiritual/gita/${c.number}`} className="block rounded-2xl border border-line bg-surface-2/60 p-4 transition hover:border-neon-violet/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neon-violet/70">Chapter {c.number}</p>
                  <p className="text-base font-bold text-white">{c.translation} <span className="font-normal text-slate-400">· {c.meaning}</span></p>
                  <p className="mt-0.5 font-serif text-sm text-slate-300">{c.sanskrit}</p>
                </div>
                <span className="shrink-0 text-[10px] tabular-nums text-slate-500">{HAS_VERSES ? `${loaded}/${c.versesCount}` : `${c.versesCount}`}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">{c.summary}</p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
