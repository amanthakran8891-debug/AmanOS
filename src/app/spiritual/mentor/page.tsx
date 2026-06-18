import Link from "next/link";
import prisma from "@/lib/db";
import { todayKey } from "@/lib/dates";
import { selectMentorVerse, journeyStage, MISSION_META, type MissionImpact } from "@/lib/gita-aman";
import { MentorReflection } from "@/components/spiritual/mentor-reflection";

export const dynamic = "force-dynamic";

async function recoveryContext() {
  const today = todayKey();
  const start = new Date(today + "T00:00:00");
  const since2 = new Date(Date.now() - 2 * 86400000);
  const [lostToday, recent, day] = await Promise.all([
    prisma.craving.findFirst({ where: { at: { gte: start }, outcome: "lost" } }).catch(() => null),
    prisma.craving.findMany({ where: { at: { gte: since2 } } }).catch(() => []),
    prisma.dayLog.findUnique({ where: { date: today } }).catch(() => null),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ]) as [any, { intensity: number }[], { jointClean: boolean; lifeScore: number } | null];

  const avgCraving = recent.length ? recent.reduce((s, c) => s + c.intensity, 0) / recent.length : 0;
  return {
    dateKey: today,
    relapseToday: !!lostToday || (day ? day.jointClean === false : false),
    highCraving: avgCraving >= 6 || !!lostToday,
    lowDiscipline: day ? day.lifeScore < 50 : false,
  };
}

const Dots = ({ n }: { n: number }) => (
  <span className="tabular-nums">{"●".repeat(Math.max(0, Math.min(3, n)))}<span className="text-slate-700">{"○".repeat(Math.max(0, 3 - n))}</span></span>
);

export default async function MentorPage() {
  const ctx = await recoveryContext();
  const { verse, prioritised } = selectMentorVerse(ctx);
  const stage = journeyStage(verse.stage);
  const existing = await prisma.spiritualNote.findFirst({ where: { kind: "mentor", ref: verse.ref }, orderBy: { createdAt: "desc" } }).catch(() => null);

  const layer = (tag: string, color: string, title: string, body: string) => (
    <div className="mt-3 rounded-2xl border p-4" style={{ borderColor: `${color}40`, background: `${color}0c` }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>{tag}</p>
      <p className="mt-1 text-sm font-semibold text-white">{title}</p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-slate-200">{body}</p>
    </div>
  );

  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-8">
      <header className="mb-5">
        <Link href="/spiritual" className="text-xs font-semibold text-slate-500 hover:text-slate-300">← Spiritual</Link>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white">🦚 Krishna Explains It To Aman</h1>
        <p className="text-sm text-slate-400">Not scripture to read — a mentor explaining your own life back to you.</p>
      </header>

      {/* Journey banner */}
      <div className="rounded-2xl border border-neon-violet/30 bg-gradient-to-br from-[#1a1530] to-surface p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neon-violet/80">Your Gita journey · Chapter {stage.stage}</p>
        <p className="mt-0.5 text-lg font-bold text-white">{stage.title}</p>
        <p className="text-sm text-slate-400">{stage.subtitle}</p>
        {prioritised && (
          <p className="mt-2 rounded-lg border border-neon-amber/30 bg-neon-amber/10 px-3 py-1.5 text-[12.5px] text-neon-amber">
            Today’s verse was chosen for where you are right now — self-control and discipline, not a random page.
          </p>
        )}
      </div>

      {/* Original verse */}
      <div className="mt-4 rounded-2xl border border-line bg-surface-2/60 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet">Original verse</p>
          <span className="rounded-full border border-neon-violet/40 px-2.5 py-0.5 text-[11px] font-semibold text-neon-violet">{verse.ref.replace("Bhagavad Gita ", "")}</span>
        </div>
        <p className="mt-2 font-semibold leading-relaxed text-neon-violet/90">{verse.sanskrit}</p>
        <p className="mt-1 text-sm italic text-slate-400">{verse.transliteration}</p>
        <p className="mt-2 text-base font-bold leading-snug text-white">{verse.translation}</p>
      </div>

      {/* The mentor layers (each independently narratable for future audio) */}
      {layer("📖 Story mode", "#38bdf8", "The same teaching, as a story", verse.story)}
      {layer("🎯 Aman mode", "#34d399", "What this means for your life today", verse.aman)}
      {layer("🦚 Krishna’s advice to Aman", "#a78bfa", "Spoken plainly, friend to friend", verse.krishna)}

      {/* Life mission connection */}
      <div className="mt-3 rounded-2xl border border-line bg-surface-2/60 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">How this verse moves your life</p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
          {MISSION_META.map((mm) => (
            <div key={mm.key} className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{mm.icon} {mm.label}</span>
              <span style={{ color: "#a78bfa" }}><Dots n={verse.mission[mm.key as keyof MissionImpact]} /></span>
            </div>
          ))}
        </div>
      </div>

      {/* Reflection journaling */}
      <MentorReflection verseRef={verse.ref} question={verse.reflection} initial={existing?.text ?? ""} />

      <p className="mt-4 text-center text-[11px] text-slate-600">Each layer is written to be read aloud — audio narration mode is coming. Come back tomorrow for the next step on the path.</p>
    </main>
  );
}
