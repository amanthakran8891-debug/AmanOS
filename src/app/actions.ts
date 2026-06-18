"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { todayKey } from "@/lib/dates";
import { lifeScore, type DayInput, type Targets } from "@/lib/score";
import { ensureDay, ensureSettings as getSettings } from "@/lib/day";
import { streakDaysFrom, cleanSecondsFrom } from "@/lib/clean-time";

function toTargets(s: { proteinTarget: number; waterTarget: number; sleepTarget: number; stepsTarget: number; nclexHoursTarget: number }): Targets {
  return {
    proteinTarget: s.proteinTarget,
    waterTarget: s.waterTarget,
    sleepTarget: s.sleepTarget,
    stepsTarget: s.stepsTarget,
    nclexHoursTarget: s.nclexHoursTarget,
  };
}

/** Recompute and persist the life score for a given day. */
async function recompute(date: string) {
  const [day, settings] = await Promise.all([prisma.dayLog.findUnique({ where: { date } }), getSettings()]);
  if (!day) return;
  const input: DayInput = {
    jointClean: day.jointClean,
    proteinG: day.proteinG,
    waterMl: day.waterMl,
    sleepHours: day.sleepHours,
    steps: day.steps,
    nclexHours: day.nclexHours,
    bharatfareDone: day.bharatfareDone,
    gymDone: day.gymDone,
    spiritualDone: day.spiritualDone,
  };
  const { total } = lifeScore(input, toTargets(settings));
  await prisma.dayLog.update({ where: { date }, data: { lifeScore: total } });
  await maintainRecords();
  await checkAchievements();
}

/** Ratchet the permanent recovery records forward. The current clean run is
 *  persisted whenever it exceeds the stored best, so the record is saved even
 *  without a relapse to trigger it. Records only ever go up. */
async function maintainRecords() {
  const settings = await getSettings();
  const liveRunSec = cleanSecondsFrom(settings.lastJointAt);
  if (liveRunSec > settings.bestCleanRunSec) {
    await prisma.settings.update({ where: { id: 1 }, data: { bestCleanRunSec: liveRunSec } });
  }
}

async function unlock(key: string) {
  await prisma.achievement.upsert({ where: { key }, update: {}, create: { key } });
}

async function checkAchievements() {
  const settings = await getSettings();
  const streak = streakDaysFrom(settings.lastJointAt);
  if (streak >= 1) await unlock("first-clean-day");
  if (streak >= 7) await unlock("7-days-clean");
  if (streak >= 30) await unlock("30-days-clean");
  if (streak >= 100) await unlock("100-days-clean");

  const today = await prisma.dayLog.findUnique({ where: { date: todayKey() } });
  if (today) {
    if (today.proteinG >= settings.proteinTarget) await unlock("protein-master");
    if (today.gymDone) await unlock("gym-warrior");
    if (today.nclexHours >= settings.nclexHoursTarget) await unlock("nclex-grinder");
    if (today.bharatfareDone) await unlock("bharatfare-builder");
    if (today.lifeScore >= 90) await unlock("life-commander");
  }
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function addWater(ml: number) {
  const date = todayKey();
  const day = await ensureDay(date);
  await prisma.dayLog.update({ where: { date }, data: { waterMl: Math.max(0, day.waterMl + ml) } });
  await recompute(date);
  revalidatePath("/");
}

export async function setField(
  field: "sleepHours" | "steps" | "nclexHours" | "nclexQuestions" | "weightKg" | "bodyFat" | "caloriesKcal",
  value: number,
) {
  const date = todayKey();
  await ensureDay(date);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.dayLog.update({ where: { date }, data: { [field]: value } } as any);
  await recompute(date);
  revalidatePath("/");
}

export async function toggleFlag(flag: "bharatfareDone" | "gymDone" | "spiritualDone") {
  const date = todayKey();
  const day = await ensureDay(date);
  const current = (day as unknown as Record<string, boolean>)[flag];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.dayLog.update({ where: { date }, data: { [flag]: !current } } as any);
  await recompute(date);
  revalidatePath("/");
}

export async function addFood(name: string, proteinG: number, calories: number) {
  const date = todayKey();
  await ensureDay(date);
  await prisma.foodEntry.create({ data: { date, name, proteinG, calories } });
  await syncFood(date);
  revalidatePath("/");
}

export async function removeFood(id: string) {
  const entry = await prisma.foodEntry.findUnique({ where: { id } });
  if (!entry) return;
  await prisma.foodEntry.delete({ where: { id } });
  await syncFood(entry.date);
  revalidatePath("/");
}

async function syncFood(date: string) {
  const agg = await prisma.foodEntry.aggregate({
    where: { date },
    _sum: { proteinG: true, calories: true },
  });
  await ensureDay(date);
  await prisma.dayLog.update({
    where: { date },
    data: { proteinG: agg._sum.proteinG ?? 0, caloriesKcal: agg._sum.calories ?? 0 },
  });
  await recompute(date);
}

export async function logGymSet(bodyPart: string, exercise: string, sets: number, reps: number, weightKg: number) {
  const date = todayKey();
  await ensureDay(date);
  await prisma.gymSet.create({ data: { date, bodyPart, exercise, sets, reps, weightKg } });
  await prisma.dayLog.update({ where: { date }, data: { gymDone: true } });
  await recompute(date);
  revalidatePath("/");
  revalidatePath("/gym");
}

export async function addExpense(category: string, amount: number, note: string) {
  const date = todayKey();
  await ensureDay(date);
  await prisma.expense.create({ data: { date, category, amount, note: note || null } });
  revalidatePath("/");
}

// ── Finance Command Center ───────────────────────────────────────────────────
/** Log an income or expense transaction. */
export async function addTransaction(input: {
  kind: "income" | "expense"; category: string; amount: number; date?: string; recurring?: boolean; note?: string;
}) {
  await prisma.transaction.create({
    data: {
      date: input.date || todayKey(),
      kind: input.kind === "income" ? "income" : "expense",
      category: input.category || "other",
      amount: Math.max(0, Math.round((input.amount || 0) * 100) / 100),
      recurring: !!input.recurring,
      note: input.note || null,
    },
  });
  revalidatePath("/finance");
  revalidatePath("/");
}

export async function removeTransaction(id: string) {
  await prisma.transaction.delete({ where: { id } }).catch(() => {});
  revalidatePath("/finance");
}

export async function updateTransaction(id: string, data: { category: string; amount: number; note: string }) {
  await prisma.transaction.update({
    where: { id },
    data: { category: data.category, amount: Math.max(0, data.amount), note: data.note || null },
  }).catch(() => {});
  revalidatePath("/finance");
}

/** Create or update a balance account (net-worth / debt-payoff tracking). */
export async function upsertAccount(input: { id?: string; name: string; kind: string; balance: number; apr?: number }) {
  const data = {
    name: input.name || "Account",
    kind: input.kind || "savings",
    balance: Math.round((input.balance || 0) * 100) / 100,
    apr: Math.max(0, input.apr || 0),
  };
  if (input.id) await prisma.financeAccount.update({ where: { id: input.id }, data }).catch(() => {});
  else await prisma.financeAccount.create({ data });
  revalidatePath("/finance");
  revalidatePath("/");
}

export async function removeAccount(id: string) {
  await prisma.financeAccount.delete({ where: { id } }).catch(() => {});
  revalidatePath("/finance");
}

// ── Nicotine Command Center ──────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ndb = prisma as any;

/** Log a nicotine event: a use (cigarette/vape/pouch/cigar), a relapse, or a
 *  craving (won = resisted, lost = used). */
export async function logNicotineEvent(input: {
  type: string; quantity?: number; nicotineMg?: number; cost?: number;
  trigger?: string; location?: string; emotion?: string; outcome?: "won" | "lost"; shift?: string; note?: string;
}) {
  await ndb.nicotineEvent.create({
    data: {
      type: input.type || "cigarette",
      quantity: Math.max(1, Math.round(input.quantity || 1)),
      nicotineMg: Math.max(0, input.nicotineMg || 0),
      cost: Math.max(0, Math.round((input.cost || 0) * 100) / 100),
      trigger: input.trigger || null,
      location: input.location || null,
      emotion: input.emotion || null,
      outcome: input.type === "craving" ? (input.outcome === "lost" ? "lost" : "won") : null,
      shift: input.shift || null,
      note: input.note || null,
    },
  }).catch(() => {});
  revalidatePath("/nicotine");
  revalidatePath("/correlations");
  revalidatePath("/");
}

export async function removeNicotineEvent(id: string) {
  await ndb.nicotineEvent.delete({ where: { id } }).catch(() => {});
  revalidatePath("/nicotine");
}

export async function setNicotineGoal(input: {
  quitDate?: string | null; dailyLimit?: number; reductionPlan?: string;
  pricePerUnit?: number; mgPerUnit?: number; baselinePerDay?: number;
}) {
  const data = {
    quitDate: input.quitDate ? new Date(input.quitDate) : null,
    dailyLimit: Math.max(0, Math.round(input.dailyLimit ?? 0)),
    reductionPlan: input.reductionPlan || null,
    pricePerUnit: Math.max(0, input.pricePerUnit ?? 0.6),
    mgPerUnit: Math.max(0, input.mgPerUnit ?? 12),
    baselinePerDay: Math.max(0, Math.round(input.baselinePerDay ?? 10)),
  };
  await ndb.nicotineGoal.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data }).catch(() => {});
  revalidatePath("/nicotine");
  revalidatePath("/");
}

export async function addCraving(craving: string, trigger: string, intensity: number) {
  await prisma.jointEvent.create({ data: { type: "craving", craving, trigger, intensity } });
  revalidatePath("/");
}

// ── Mission Board — one-click completion ──────────────────────────────────────
/** Complete a board mission in one tap by marking its underlying habit done. */
export async function completeMission(key: "gym" | "nclex" | "protein" | "spiritual") {
  const date = todayKey();
  const day = await ensureDay(date);
  const s = await getSettings();
  if (key === "gym") await prisma.dayLog.update({ where: { date }, data: { gymDone: true } });
  else if (key === "spiritual") await prisma.dayLog.update({ where: { date }, data: { spiritualDone: true } });
  else if (key === "protein") await prisma.dayLog.update({ where: { date }, data: { proteinG: Math.max(day.proteinG, s.proteinTarget) } });
  else if (key === "nclex") await prisma.dayLog.update({ where: { date }, data: { nclexHours: Math.max(day.nclexHours, s.nclexHoursTarget) } });
  await recompute(date);
  revalidatePath("/");
  revalidatePath("/intelligence");
}

// ── Data hygiene — collapse a day's relapses to a single log ───────────────────
/** Keep the earliest relapse on each given day, delete the rest. For cleaning up
 *  obvious test/spam days (e.g. "11 relapses logged"). Relapse events only. */
export async function collapseRelapseDaysToOne(dates: string[]): Promise<number> {
  const days = (dates || []).filter((d) => typeof d === "string" && d.length === 10);
  let deleted = 0;
  for (const date of days) {
    const events = await prisma.jointEvent.findMany({ where: { type: "relapse" }, orderBy: { at: "asc" } });
    const sameDay = events.filter((e) => {
      const x = e.at;
      const k = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
      return k === date;
    });
    if (sameDay.length <= 1) continue;
    const toDelete = sameDay.slice(1).map((e) => e.id);
    const res = await prisma.jointEvent.deleteMany({ where: { id: { in: toDelete }, type: "relapse" } });
    deleted += res.count;
  }
  revalidatePath("/intelligence");
  revalidatePath("/");
  return deleted;
}

// ── Dragon Attack Mode — emergency craving intervention ───────────────────────
/** Record the outcome of a Dragon Attack Mode session. A survived session also
 *  logs a resisted craving so the prediction engine and analytics learn from it;
 *  a loss logs it as a relapse signal. Powers Recovery XP mission rewards. */
export async function logDragonAttack(input: {
  survived: boolean; missionsCompleted: number; durationSec: number; intensity?: number; trigger?: string; note?: string;
}) {
  const intensity = Math.min(10, Math.max(0, Math.round(input.intensity ?? 7)));
  const missions = Math.min(5, Math.max(0, Math.round(input.missionsCompleted)));
  await prisma.dragonAttack.create({
    data: {
      survived: !!input.survived,
      durationSec: Math.max(0, Math.round(input.durationSec)),
      missionsCompleted: missions,
      intensity,
      trigger: input.trigger || null,
      note: input.note || null,
    },
  }).catch(() => {});
  // Feed the analytics + prediction engines with the craving outcome (won/lost).
  // Note: a lost session logs a craving outcome only — it does NOT reset the
  // clean clock. Use "Log relapse" for an actual relapse.
  await prisma.craving.create({
    data: { intensity: Math.max(1, intensity), trigger: input.trigger || null, outcome: input.survived ? "won" : "lost", note: "Dragon Attack Mode" },
  }).catch(() => {});
  await prisma.jointEvent.create({
    data: { type: "craving", craving: null, trigger: input.trigger || null, intensity },
  }).catch(() => {});
  revalidatePath("/intelligence");
  revalidatePath("/cravings");
  revalidatePath("/");
}

// ── Data hygiene — duplicate relapse cleanup (safe, preview-first) ────────────
interface DuplicateRelapseGroup {
  keep: { id: string; at: string; trigger: string | null };
  duplicates: { id: string; at: string; trigger: string | null }[];
}

/** Detect relapse logs clustered within a short window (likely test/dupe entries).
 *  Groups by proximity to the FIRST event in a cluster; the earliest is kept,
 *  the rest are flagged as duplicates. Only relapse events are ever considered —
 *  cravings and victories are never touched. Returns a preview; deletes nothing. */
export async function findDuplicateRelapses(windowMinutes = 8): Promise<DuplicateRelapseGroup[]> {
  const events = await prisma.jointEvent.findMany({ where: { type: "relapse" }, orderBy: { at: "asc" } });
  const windowMs = Math.max(1, windowMinutes) * 60000;
  const groups: typeof events[] = [];
  let cluster: typeof events = [];
  for (const e of events) {
    if (cluster.length === 0) { cluster = [e]; continue; }
    if (e.at.getTime() - cluster[0].at.getTime() <= windowMs) cluster.push(e);
    else { if (cluster.length > 1) groups.push(cluster); cluster = [e]; }
  }
  if (cluster.length > 1) groups.push(cluster);

  return groups.map((g) => ({
    keep: { id: g[0].id, at: g[0].at.toISOString(), trigger: g[0].trigger },
    duplicates: g.slice(1).map((d) => ({ id: d.id, at: d.at.toISOString(), trigger: d.trigger })),
  }));
}

/** Delete specific duplicate relapse logs by id. Hard-guarded to type=relapse so
 *  cravings/victories can never be removed by this path. */
export async function deleteRelapseDuplicates(ids: string[]): Promise<number> {
  const clean = (ids || []).filter((s) => typeof s === "string" && s.length > 0);
  if (clean.length === 0) return 0;
  const res = await prisma.jointEvent.deleteMany({ where: { id: { in: clean }, type: "relapse" } });
  revalidatePath("/intelligence");
  revalidatePath("/");
  return res.count;
}

// ── Craving Analytics Engine ─────────────────────────────────────────────────
/** Log a craving with full context + outcome (won = resisted, lost = used). */
export async function logCraving(input: {
  intensity: number; trigger?: string; location?: string; emotion?: string; outcome: "won" | "lost"; note?: string;
}) {
  await prisma.craving.create({
    data: {
      intensity: Math.min(10, Math.max(1, Math.round(input.intensity || 5))),
      trigger: input.trigger || null,
      location: input.location || null,
      emotion: input.emotion || null,
      outcome: input.outcome === "lost" ? "lost" : "won",
      note: input.note || null,
    },
  });
  // A lost craving is a relapse signal — also record it on the cannabis timeline.
  if (input.outcome === "lost") {
    await prisma.jointEvent.create({ data: { type: "relapse", trigger: input.trigger || null, intensity: Math.round(input.intensity || 5) } }).catch(() => {});
  }
  revalidatePath("/cravings");
  revalidatePath("/recovery");
  revalidatePath("/");
}

export async function removeCraving(id: string) {
  await prisma.craving.delete({ where: { id } }).catch(() => {});
  revalidatePath("/cravings");
}

// ── Edit / delete (correct mistakes easily) ──────────────────────────────────
export async function updateFood(id: string, name: string, proteinG: number, calories: number) {
  const entry = await prisma.foodEntry.findUnique({ where: { id } });
  if (!entry) return;
  await prisma.foodEntry.update({ where: { id }, data: { name, proteinG, calories } });
  await syncFood(entry.date);
  revalidatePath("/");
}

export async function removeExpense(id: string) {
  await prisma.expense.delete({ where: { id } }).catch(() => {});
  revalidatePath("/");
}

export async function updateExpense(id: string, category: string, amount: number, note: string) {
  await prisma.expense.update({ where: { id }, data: { category, amount, note: note || null } }).catch(() => {});
  revalidatePath("/");
}

export async function removeGymSet(id: string) {
  const set = await prisma.gymSet.findUnique({ where: { id } });
  if (!set) return;
  await prisma.gymSet.delete({ where: { id } });
  const remaining = await prisma.gymSet.count({ where: { date: set.date } });
  if (remaining === 0) {
    await prisma.dayLog.update({ where: { date: set.date }, data: { gymDone: false } }).catch(() => {});
    await recompute(set.date);
  }
  revalidatePath("/");
  revalidatePath("/gym");
}

export async function updateGymSet(id: string, sets: number, reps: number, weightKg: number) {
  await prisma.gymSet.update({ where: { id }, data: { sets, reps, weightKg } }).catch(() => {});
  revalidatePath("/");
  revalidatePath("/gym");
}

export async function removeJointEvent(id: string) {
  await prisma.jointEvent.delete({ where: { id } }).catch(() => {});
  revalidatePath("/");
}

export async function setNote(text: string) {
  const date = todayKey();
  await ensureDay(date);
  await prisma.dayLog.update({ where: { date }, data: { notes: text || null } });
  revalidatePath("/");
}

/** Joint smoked — relapse. Resets the clean streak / hourglass, strengthens the dragon. */
export async function relapse(trigger: string, note: string) {
  const settings = await getSettings();
  const prevStreak = streakDaysFrom(settings.lastJointAt);
  const prevRunSec = cleanSecondsFrom(settings.lastJointAt); // full precision of the run we're ending
  await prisma.jointEvent.create({ data: { type: "relapse", trigger: trigger || null, note: note || null } });
  await prisma.settings.update({
    where: { id: 1 },
    data: {
      lastJointAt: new Date(),
      // Records are PERMANENT — a relapse resets the clock, never the achievements.
      longestStreakDays: Math.max(settings.longestStreakDays, prevStreak),
      bestCleanRunSec: Math.max(settings.bestCleanRunSec, prevRunSec),
      recCumulativeCleanDays: settings.recCumulativeCleanDays + prevStreak,
      recRelapseCount: settings.recRelapseCount + 1,
    },
  });
  const date = todayKey();
  await ensureDay(date);
  await prisma.dayLog.update({ where: { date }, data: { jointClean: false } });
  await recompute(date);
  revalidatePath("/");
}

/** Re-affirm a clean day (undo an accidental relapse toggle for today). */
export async function markCleanToday() {
  const date = todayKey();
  await ensureDay(date);
  await prisma.dayLog.update({ where: { date }, data: { jointClean: true } });
  await recompute(date);
  revalidatePath("/");
}

/** Mark that the morning/night check-in was used today (discipline component). */
export async function markCheckin() {
  const date = todayKey();
  await ensureDay(date);
  await prisma.dayLog.update({ where: { date }, data: { checkinDone: true } });
  revalidatePath("/");
  revalidatePath("/discipline");
}

export async function resetStreakAnchor(to: Date) {
  await prisma.settings.update({ where: { id: 1 }, data: { lastJointAt: to } });
  revalidatePath("/");
}

export async function updateSettings(data: Record<string, number>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.settings.update({ where: { id: 1 }, data: data as any });
  await recompute(todayKey());
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/today");
}

// ── NCLEX / AHPRA Command Center ─────────────────────────────────────────────

/** Log a study session. Rolls up into the day's NCLEX counters + Life Score. */
export async function logNclexSession(topic: string, questions: number, correct: number, minutes: number) {
  const date = todayKey();
  const day = await ensureDay(date);
  const q = Math.max(0, Math.round(questions));
  const c = Math.max(0, Math.min(q, Math.round(correct)));
  const m = Math.max(0, Math.round(minutes));
  await prisma.nclexSession.create({ data: { date, topic, questions: q, correct: c, minutes: m } });
  await prisma.dayLog.update({
    where: { date },
    data: {
      nclexQuestions: day.nclexQuestions + q,
      nclexCorrect: day.nclexCorrect + c,
      nclexHours: Math.round((day.nclexHours + m / 60) * 100) / 100,
    },
  });
  await recompute(date);
  revalidatePath("/");
  revalidatePath("/nclex");
}

export async function deleteNclexSession(id: string) {
  const s = await prisma.nclexSession.findUnique({ where: { id } });
  if (!s) return;
  await prisma.nclexSession.delete({ where: { id } });
  const day = await prisma.dayLog.findUnique({ where: { date: s.date } });
  if (day) {
    await prisma.dayLog.update({
      where: { date: s.date },
      data: {
        nclexQuestions: Math.max(0, day.nclexQuestions - s.questions),
        nclexCorrect: Math.max(0, day.nclexCorrect - s.correct),
        nclexHours: Math.max(0, Math.round((day.nclexHours - s.minutes / 60) * 100) / 100),
      },
    });
    await recompute(s.date);
  }
  revalidatePath("/nclex");
  revalidatePath("/");
}

export async function setNclexExam(dateISO: string | null, name: string) {
  await prisma.settings.update({
    where: { id: 1 },
    data: { nclexExamDate: dateISO ? new Date(dateISO) : null, nclexExamName: name || "NCLEX-RN" },
  });
  revalidatePath("/nclex");
  revalidatePath("/");
}

// ── Recovery & Freedom Command Center ────────────────────────────────────────

export async function updateRecoveryProfile(data: {
  recUseLevel?: string;
  recJointsPerDay?: number;
  recUseYears?: number;
  recActivityLevel?: string;
  recExerciseFreq?: number;
  recBaselineWeight?: number | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.settings.update({ where: { id: 1 }, data: data as any });
  revalidatePath("/recovery");
  revalidatePath("/");
}

export async function logSymptoms(
  values: {
    cravings: number; anxiety: number; irritability: number; sleep: number; appetite: number;
    motivation: number; focus: number; mood: number; restlessness: number; boredom: number;
  },
  note: string,
) {
  const date = todayKey();
  await prisma.symptomLog.upsert({
    where: { date },
    update: { ...values, note: note || null },
    create: { date, ...values, note: note || null },
  });
  revalidatePath("/recovery");
  revalidatePath("/");
}

// ── Spiritual Command Center ─────────────────────────────────────────────────

async function logReading(kind: "gita" | "chalisa" | "reflection") {
  const date = todayKey();
  await prisma.spiritualReadingLog.upsert({
    where: { date_kind: { date, kind } },
    create: { date, kind, count: 1 },
    update: { count: { increment: 1 } },
  });
}

export async function setGitaProgress(chapter: number, verse: number) {
  await prisma.spiritualProgress.upsert({
    where: { id: 1 },
    create: { id: 1, gitaChapter: chapter, gitaVerse: verse },
    update: { gitaChapter: chapter, gitaVerse: verse },
  });
  await logReading("gita");
  revalidatePath("/spiritual");
  revalidatePath("/character");
}

export async function setChalisaProgress(line: number) {
  await prisma.spiritualProgress.upsert({
    where: { id: 1 },
    create: { id: 1, chalisaLine: line },
    update: { chalisaLine: line },
  });
  await logReading("chalisa");
  revalidatePath("/spiritual");
  revalidatePath("/character");
}

export async function toggleSpiritualMark(kind: string, ref: string, type: "bookmark" | "favourite") {
  const existing = await prisma.spiritualMark.findUnique({ where: { kind_ref_type: { kind, ref, type } } });
  if (existing) await prisma.spiritualMark.delete({ where: { id: existing.id } });
  else await prisma.spiritualMark.create({ data: { kind, ref, type } });
  revalidatePath("/spiritual");
}

export async function saveSpiritualNote(kind: string, ref: string, text: string) {
  if (!text.trim()) return;
  const existing = await prisma.spiritualNote.findFirst({ where: { kind, ref }, orderBy: { createdAt: "desc" } });
  if (existing) await prisma.spiritualNote.update({ where: { id: existing.id }, data: { text: text.trim() } });
  else await prisma.spiritualNote.create({ data: { kind, ref, text: text.trim() } });
  await logReading("reflection");
  revalidatePath("/spiritual");
  revalidatePath("/character");
}

export async function deleteSpiritualNote(id: string) {
  await prisma.spiritualNote.delete({ where: { id } }).catch(() => {});
  revalidatePath("/spiritual");
}

export async function saveReview(period: string, periodKey: string, lesson: string, focus: string) {
  await prisma.review.upsert({
    where: { period_periodKey: { period, periodKey } },
    update: { lesson: lesson || null, focus: focus || null },
    create: { period, periodKey, lesson: lesson || null, focus: focus || null },
  });
  revalidatePath(`/reviews/${period === "week" ? "weekly" : period === "month" ? "monthly" : "quarterly"}`);
}
