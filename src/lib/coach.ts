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
  nextBestMove: string | null; // prevention action from the prediction engine
  cleanWeeksMilestoneSoon: { day: number; daysAway: number } | null;
}

/** The exact prompt a future LLM would receive — single swap point. */
export function buildCoachPrompt(ctx: CoachContext): string {
  return [
    `You are ${ctx.name}'s recovery field commander. Output a SHORT, command-style briefing.`,
    `Format exactly: "Risk: <band>. Danger window: <window>. Today's command: <prevention action(s)>. Emergency: <one emergency action>."`,
    `Be terse and imperative. No pep talk. Use their data:`,
    `- Relapse risk: ${ctx.riskBand} (${ctx.riskScore}/100)`,
    `- Danger window: ${ctx.dangerWindowLabel ?? "none flagged"}`,
    `- Highest-leverage missing habit: ${ctx.nextBestMove ?? "none"}`,
    `Always include exactly one prevention action and one emergency action.`,
  ].join("\n");
}

/** Deterministic, command-style briefing — the always-available default.
 *  Always carries one prevention action and one emergency action. */
export function ruleBasedBriefing(ctx: CoachContext): string {
  const window = ctx.dangerWindowLabel ?? "none flagged";

  // Prevention command — the highest-leverage missing habit, plus a time-guard.
  const prevention = ctx.nextBestMove ?? "hold your routine";
  const guard = ctx.dangerWindowLabel
    ? `No phone in your room during ${ctx.dangerWindowLabel}`
    : "Guard your evening routine";

  // Emergency command — always present.
  const emergency = "if a craving hits, launch Dragon Attack Mode — do not negotiate";

  return `Risk: ${ctx.riskBand}. Danger window: ${window}. Today's command: ${prevention}. ${guard}. Emergency: ${emergency}.`;
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
