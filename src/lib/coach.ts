// ─────────────────────────────────────────────────────────────────────────────
// AmanOS — AI Daily Coach (#9) + Recovery Intelligence Reports (#4).
//
// Rule-based and deterministic TODAY (no external API, fully private, offline),
// but LLM-READY: `generateBriefing` takes an optional async generator so a model
// can be swapped in later via one function, while `buildCoachPrompt` already
// produces the prompt it would receive. The rule-based path is the fallback.
// Correlations use the shared engine/correlate primitive.
// ─────────────────────────────────────────────────────────────────────────────

import { conditionalLift } from "@/lib/engine/correlate";

// ── Daily Coach ───────────────────────────────────────────────────────────────
export interface CoachContext {
  name: string;
  streakDays: number;
  riskBand: "Low" | "Medium" | "High";
  riskScore: number;
  topRiskReason: string | null;
  dangerWindowLabel: string | null;
  protectiveToday: string[];
  gymDoneToday: boolean;
  cleanWeeksMilestoneSoon: { day: number; daysAway: number } | null;
}

/** The exact prompt a future LLM would receive — single swap point. */
export function buildCoachPrompt(ctx: CoachContext): string {
  return [
    `You are ${ctx.name}'s recovery coach. Write a 2–3 sentence daily briefing.`,
    `Be direct, warm, and specific. No fluff. Use their data:`,
    `- Clean streak: ${ctx.streakDays} days`,
    `- Today's relapse risk: ${ctx.riskBand} (${ctx.riskScore}/100)`,
    `- Top risk driver: ${ctx.topRiskReason ?? "none"}`,
    `- Most dangerous window: ${ctx.dangerWindowLabel ?? "unknown"}`,
    `- Protective wins already done today: ${ctx.protectiveToday.join(", ") || "none yet"}`,
    `End with one concrete directive for the next few hours.`,
  ].join("\n");
}

/** Deterministic, data-driven briefing — the always-available default. */
export function ruleBasedBriefing(ctx: CoachContext): string {
  const parts: string[] = [];
  const risk = ctx.riskBand.toLowerCase();

  // Opening — streak framing.
  if (ctx.streakDays === 0) parts.push(`${ctx.name}, day zero is a decision, not a failure — let's stack a clean day.`);
  else if (ctx.streakDays < 7) parts.push(`${ctx.name}, ${ctx.streakDays} day${ctx.streakDays === 1 ? "" : "s"} clean — the streak is still fragile, so protect it.`);
  else parts.push(`${ctx.name}, your ${ctx.streakDays}-day streak is real momentum — don't give it back.`);

  // Risk + the why.
  if (ctx.topRiskReason) parts.push(`Today your greatest risk is ${ctx.topRiskReason.toLowerCase()}.`);
  else parts.push(`Today's risk reads ${risk}.`);

  // The directive.
  const directives: string[] = [];
  if (!ctx.gymDoneToday) directives.push("get the gym done before evening — it deals double damage");
  if (ctx.dangerWindowLabel) directives.push(`don't negotiate with cravings around ${ctx.dangerWindowLabel}`);
  if (directives.length === 0 && ctx.protectiveToday.length) directives.push("keep stacking the wins you've already started");
  if (directives.length === 0) directives.push("just win today");

  parts.push(`Plan: ${directives.slice(0, 2).join(", and ")}.`);
  return parts.join(" ");
}

export type BriefingGenerator = (prompt: string) => Promise<string>;

/** LLM-ready entry point. Pass a generator to use a model; omit for rule-based. */
export async function generateBriefing(ctx: CoachContext, generate?: BriefingGenerator): Promise<string> {
  if (!generate) return ruleBasedBriefing(ctx);
  try {
    const out = (await generate(buildCoachPrompt(ctx))).trim();
    return out || ruleBasedBriefing(ctx);
  } catch {
    return ruleBasedBriefing(ctx);
  }
}

// ── Weekly Intelligence Report ────────────────────────────────────────────────
export interface Insight {
  key: string;
  label: string;      // "Gym days"
  pct: number;        // magnitude of change in craving frequency (%)
  direction: "down" | "up";
  detail: string;     // "reduced craving frequency by 42%"
  n: number;          // days the comparison is based on
}

export interface IntelligenceReport {
  headline: string;
  helped: Insight[];  // behaviours that lowered craving frequency
  hurt: Insight[];    // conditions that raised it
  enoughData: boolean;
}

export interface ReportContext {
  /** Per-day craving counts, keyed YYYY-MM-DD. */
  cravingsByDay: Record<string, number>;
  /** Boolean condition flags per day. */
  flags: { key: string; label: string; helpful: boolean; byDay: Record<string, boolean> }[];
}

/** Build helped/hurt insights from conditional lift on craving frequency. */
export function weeklyIntelligenceReport(ctx: ReportContext): IntelligenceReport {
  const dayCount = Object.keys(ctx.cravingsByDay).length;
  const helped: Insight[] = [];
  const hurt: Insight[] = [];

  for (const f of ctx.flags) {
    const lift = conditionalLift(f.byDay, ctx.cravingsByDay);
    if (lift.nOn < 2 || lift.nOff < 2) continue; // need both sides
    const pct = lift.pct; // (onAvg - offAvg)/offAvg
    if (pct <= -10) {
      helped.push({ key: f.key, label: f.label, pct: Math.abs(pct), direction: "down", detail: `reduced craving frequency by ${Math.abs(pct)}%`, n: lift.nOn + lift.nOff });
    } else if (pct >= 10) {
      hurt.push({ key: f.key, label: f.label, pct, direction: "up", detail: `raised craving frequency by ${pct}%`, n: lift.nOn + lift.nOff });
    }
  }

  helped.sort((a, b) => b.pct - a.pct);
  hurt.sort((a, b) => b.pct - a.pct);

  const enoughData = dayCount >= 10;
  let headline: string;
  if (!enoughData) headline = "Log a bit more and patterns will emerge — keep tracking cravings and habits.";
  else if (helped[0]) headline = `This week ${helped[0].label.toLowerCase()} ${helped[0].detail}.`;
  else if (hurt[0]) headline = `Watch out: ${hurt[0].label.toLowerCase()} ${hurt[0].detail} this week.`;
  else headline = "No strong patterns this week — steady as you go.";

  return { headline, helped, hurt, enoughData };
}
