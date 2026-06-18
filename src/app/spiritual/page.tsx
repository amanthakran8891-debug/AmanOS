import Link from "next/link";
import { getSpiritualData } from "@/lib/data";
import { getChapter } from "@/lib/gita-library";

export const dynamic = "force-dynamic";

export default async function SpiritualPage() {
  const d = await getSpiritualData();
  const ch = getChapter(d.gita.chapter);
  const mission = [
    { key: "gita", label: "Read a Gita verse", done: d.today.readGita, href: `/spiritual/gita/${d.gita.chapter}` },
    { key: "chalisa", label: "Read the Hanuman Chalisa", done: d.today.readChalisa, href: "/spiritual/chalisa" },
    { key: "reflection", label: "Write one reflection", done: d.today.wroteReflection, href: `/spiritual/gita/${d.gita.chapter}` },
  ];
  const missionDone = mission.filter((m) => m.done).length;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-8">
      <header className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neon-violet/80">Spiritual</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">A quiet place to read & reflect</h1>
        <p className="mt-1 text-sm text-slate-400">{d.streak.current > 0 ? `${d.streak.current}-day reading streak · best ${d.streak.best}` : "Begin your reading streak today."}</p>
      </header>

      {/* Daily spiritual mission */}
      <section className="rounded-2xl border border-line bg-surface-2/60 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-200">Today&apos;s practice</p>
          <span className="text-xs text-slate-500">{missionDone}/3</span>
        </div>
        <div className="mt-3 space-y-2">
          {mission.map((m) => (
            <Link key={m.key} href={m.href} className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${m.done ? "border-neon-green/40 bg-neon-green/10" : "border-line bg-surface hover:border-neon-violet/40"}`}>
              <span className={`grid h-6 w-6 place-items-center rounded-full border text-xs ${m.done ? "border-neon-green bg-neon-green text-bg" : "border-slate-600 text-transparent"}`}>✓</span>
              <span className={`text-sm ${m.done ? "text-slate-400 line-through" : "text-white"}`}>{m.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Krishna Explains It To Aman — mentor mode */}
      <Link href="/spiritual/mentor" className="mt-4 block rounded-2xl border border-neon-violet/40 bg-gradient-to-br from-[#221a3a] to-surface p-5 transition hover:border-neon-violet/70">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-neon-violet/90">🦚 Krishna Explains It To Aman</p>
          <span className="text-[11px] text-neon-violet">mentor →</span>
        </div>
        <p className="mt-1 text-lg font-bold text-white">Today&rsquo;s verse, explained for your real life</p>
        <p className="mt-1 text-sm text-slate-400">Story mode · Aman mode · Krishna&rsquo;s advice · a reflection to journal. Recovery-aware on hard days.</p>
      </Link>

      {/* Continue reading — Gita */}
      <Link href={`/spiritual/gita/${d.gita.chapter}`} className="mt-4 block rounded-2xl border border-line bg-gradient-to-br from-[#1a1530] to-surface p-5 transition hover:border-neon-violet/50">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-neon-violet/80">Bhagavad Gita · continue</p>
          <span className="text-xs tabular-nums text-slate-500">{d.gita.progressPct}%</span>
        </div>
        <p className="mt-1 text-lg font-bold text-white">{ch?.translation ?? "Chapter"} — {d.gita.chapter}.{d.gita.verse}</p>
        {d.gita.lastVerseTranslation && <p className="mt-1 line-clamp-2 text-sm text-slate-300">“{d.gita.lastVerseTranslation}”</p>}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg">
          <div className="h-full rounded-full bg-gradient-to-r from-neon-violet to-neon-cyan" style={{ width: `${d.gita.progressPct}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">{d.gita.hasVerses ? `${d.gita.loaded} of ${d.gita.total} verses loaded` : "Run the data build to load the verses"}</p>
      </Link>

      {/* Hanuman Chalisa */}
      <Link href="/spiritual/chalisa" className="mt-3 block rounded-2xl border border-line bg-gradient-to-br from-[#2a1d12] to-surface p-5 transition hover:border-neon-amber/50">
        <p className="text-xs font-semibold uppercase tracking-wider text-neon-amber/80">Hanuman Chalisa</p>
        <p className="mt-1 text-lg font-bold text-white">Read with devotion</p>
        <p className="mt-1 text-sm text-slate-400">{d.chalisa.hasText ? `${d.chalisa.lineCount} verses · daily reading streak ${d.streak.current}d` : "Text loads via the data build"}</p>
      </Link>

      {/* Library */}
      <section className="mt-5 grid grid-cols-3 gap-2">
        <Link href="/spiritual/gita" className="rounded-xl border border-line bg-surface-2 py-3 text-center text-sm font-semibold text-slate-200 hover:text-white">📖 All chapters</Link>
        <Link href="/character" className="rounded-xl border border-line bg-surface-2 py-3 text-center text-sm font-semibold text-slate-200 hover:text-white">🕉 Wisdom</Link>
        <Link href="/" className="rounded-xl border border-line bg-surface-2 py-3 text-center text-sm font-semibold text-slate-200 hover:text-white">⌂ Home</Link>
      </section>

      {/* Bookmarks / Favourites / Notes summary */}
      {(d.bookmarks.length > 0 || d.favourites.length > 0 || d.notes.length > 0) && (
        <section className="mt-5 rounded-2xl border border-line bg-surface-2/60 p-5">
          <p className="text-sm font-semibold text-slate-200">Your library</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {d.favourites.slice(0, 8).map((f) => (
              <Link key={`fav-${f.kind}-${f.ref}`} href={f.kind === "gita" ? `/spiritual/gita/${f.ref.split(".")[0]}#v${f.ref}` : "/spiritual/chalisa"} className="rounded-full border border-neon-amber/30 bg-neon-amber/10 px-3 py-1 text-neon-amber">♥ {f.ref}</Link>
            ))}
            {d.bookmarks.slice(0, 8).map((b) => (
              <Link key={`bm-${b.kind}-${b.ref}`} href={b.kind === "gita" ? `/spiritual/gita/${b.ref.split(".")[0]}#v${b.ref}` : "/spiritual/chalisa"} className="rounded-full border border-neon-violet/30 bg-neon-violet/10 px-3 py-1 text-neon-violet">🔖 {b.ref}</Link>
            ))}
          </div>
          {d.notes.length > 0 && <p className="mt-2 text-[11px] text-slate-500">{d.notes.length} reflection{d.notes.length === 1 ? "" : "s"} saved</p>}
        </section>
      )}
    </main>
  );
}
