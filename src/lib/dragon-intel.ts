// ─────────────────────────────────────────────────────────────────────────────
// AmanOS — Dragon Weakness System / Dragon Intelligence (Phase 2, #5).
//
// The dragon isn't just an HP bar. It has exploitable WEAKNESSES (your strongest
// habits) and signature ATTACKS (your real triggers, emotions and danger window).
// This turns the fight into strategy: hit the weaknesses, defend the attacks.
// Pure — data passed in.
// ─────────────────────────────────────────────────────────────────────────────

import { DAMAGE } from "@/lib/damage";

export interface Weakness {
  key: string;
  icon: string;
  label: string;
  multiplier: string;   // display, e.g. "2× damage"
  effect: string;       // what it does to the dragon
  exploitedToday: boolean;
  damageToday: number;  // effective damage dealt via this vector today
}

export interface DragonAttackVector {
  key: string;
  icon: string;
  label: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

export interface DragonIntel {
  weaknesses: Weakness[];
  attacks: DragonAttackVector[];
  exploitedCount: number;
  totalWeaknesses: number;
  exploitPct: number;
  cravingResistancePct: number; // mental resistance from study
  cravingDampenPct: number;     // craving strength reduction from spiritual
  summary: string;
}

export interface DragonIntelInput {
  today: {
    jointClean: boolean;
    gymDone: boolean;
    proteinG: number;
    nclexHours: number;
    spiritualDone: boolean;
  };
  targets: { proteinTarget: number; nclexHoursTarget: number };
  topTriggers: { name: string; count: number }[];
  topEmotions: { name: string; count: number }[];
  dangerWindowLabel: string | null;
  riskiestDay: string | null;
}

export function computeDragonIntel(input: DragonIntelInput): DragonIntel {
  const t = input.today;
  const proteinHit = t.proteinG >= Math.max(1, input.targets.proteinTarget);
  const nclexHit = t.nclexHours >= Math.max(0.1, input.targets.nclexHoursTarget);

  const weaknesses: Weakness[] = [
    {
      key: "gym", icon: "🏋", label: "Gym", multiplier: "2× damage",
      effect: "Training is the dragon's deepest wound — double damage.",
      exploitedToday: t.gymDone, damageToday: t.gymDone ? DAMAGE.gym * 2 : 0,
    },
    {
      key: "protein", icon: "🥩", label: "Protein", multiplier: "1.5× damage",
      effect: "Physical strength denies the dragon its foothold.",
      exploitedToday: proteinHit, damageToday: proteinHit ? Math.round(DAMAGE.protein * 1.5) : 0,
    },
    {
      key: "nclex", icon: "📚", label: "NCLEX Study", multiplier: "+ mental resistance",
      effect: "An occupied mind resists craving attacks.",
      exploitedToday: nclexHit, damageToday: nclexHit ? DAMAGE.nclex : 0,
    },
    {
      key: "spiritual", icon: "🕉", label: "Spiritual", multiplier: "− craving strength",
      effect: "Practice weakens the dragon's strongest weapon: the craving itself.",
      exploitedToday: t.spiritualDone, damageToday: t.spiritualDone ? DAMAGE.gita : 0,
    },
  ];

  const exploitedCount = weaknesses.filter((w) => w.exploitedToday).length;
  const cravingResistancePct = nclexHit ? 20 : 0;
  const cravingDampenPct = t.spiritualDone ? 15 : 0;

  // The dragon's signature attacks — derived from real history.
  const attacks: DragonAttackVector[] = [];
  if (input.dangerWindowLabel) {
    attacks.push({ key: "window", icon: "🕛", label: "Ambush window", detail: input.dangerWindowLabel, severity: "high" });
  }
  const topTrig = input.topTriggers[0];
  if (topTrig) {
    attacks.push({ key: "trigger", icon: "⚡", label: `Trigger: ${topTrig.name}`, detail: `${topTrig.count} past strikes`, severity: topTrig.count >= 5 ? "high" : "medium" });
  }
  const topEmo = input.topEmotions[0];
  if (topEmo) {
    attacks.push({ key: "emotion", icon: "🌀", label: `Emotion: ${topEmo.name}`, detail: `${topEmo.count} past strikes`, severity: topEmo.count >= 5 ? "high" : "medium" });
  }
  if (input.riskiestDay) {
    attacks.push({ key: "day", icon: "📅", label: `Weekday: ${input.riskiestDay}`, detail: "Relapses cluster here", severity: "medium" });
  }
  if (attacks.length === 0) {
    attacks.push({ key: "unknown", icon: "❔", label: "Unknown attacks", detail: "Log cravings to reveal the dragon's tactics", severity: "low" });
  }

  const summary =
    exploitedCount >= 3
      ? "You're exploiting most weaknesses — the dragon is on the back foot."
      : exploitedCount >= 1
        ? "Some weaknesses hit. Stack more to break it faster."
        : "No weaknesses exploited yet today — the dragon is unharmed.";

  return {
    weaknesses,
    attacks,
    exploitedCount,
    totalWeaknesses: weaknesses.length,
    exploitPct: Math.round((exploitedCount / weaknesses.length) * 100),
    cravingResistancePct,
    cravingDampenPct,
    summary,
  };
}
