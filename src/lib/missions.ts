// ─────────────────────────────────────────────────────────────────────────────
// AmanOS — Mission Board (Phase 3). The decision engine: "what to do next."
// Max 3 missions, generated from the day's gaps and ordered by recovery impact,
// each with a clear reward. Pure — data passed in; one-click completion via the
// completeMission server action.
// ─────────────────────────────────────────────────────────────────────────────

import { DAMAGE } from "@/lib/damage";
import { RECOVERY_XP } from "@/lib/recovery-xp";

export type MissionKey = "gym" | "nclex" | "protein" | "spiritual";

export interface Mission {
  key: MissionKey;
  icon: string;
  label: string;
  sub: string;
  done: boolean;
  reward: { xp: number; dragonHp: number; lifeScore: number };
  primaryReward: string; // headline reward string
}

export interface MissionBoard {
  missions: Mission[]; // up to 3
  completed: number;
  total: number;
}

export interface MissionInput {
  today: { gymDone: boolean; nclexHours: number; proteinG: number; spiritualDone: boolean };
  targets: { nclexHoursTarget: number; proteinTarget: number };
  /** Higher risk pushes the hardest-hitting habits to the top. */
  riskBand: "Low" | "Medium" | "High";
}

export function buildMissionBoard(input: MissionInput): MissionBoard {
  const t = input.today;
  const nclexGoal = Math.max(0.1, input.targets.nclexHoursTarget);
  const proteinGoal = Math.max(1, input.targets.proteinTarget);

  const all: Mission[] = [
    {
      key: "gym", icon: "🏋", label: "Gym session", sub: "Train before evening",
      done: t.gymDone,
      reward: { xp: 15, dragonHp: DAMAGE.gym * 2, lifeScore: 10 },
      primaryReward: `Dragon −${(DAMAGE.gym * 2).toLocaleString()} HP`,
    },
    {
      key: "nclex", icon: "📚", label: "NCLEX target", sub: `Hit ${nclexGoal}h of questions`,
      done: t.nclexHours >= nclexGoal,
      reward: { xp: 25, dragonHp: DAMAGE.nclex, lifeScore: 20 },
      primaryReward: "+25 XP",
    },
    {
      key: "protein", icon: "🥩", label: "Protein goal", sub: `Reach ${proteinGoal}g`,
      done: t.proteinG >= proteinGoal,
      reward: { xp: 10, dragonHp: Math.round(DAMAGE.protein * 1.5), lifeScore: 8 },
      primaryReward: `Dragon −${Math.round(DAMAGE.protein * 1.5)} HP`,
    },
    {
      key: "spiritual", icon: "🕉", label: "Spiritual / Gita", sub: "Read one verse",
      done: t.spiritualDone,
      reward: { xp: RECOVERY_XP.cravingDefeated, dragonHp: DAMAGE.gita, lifeScore: 5 },
      primaryReward: "− craving strength",
    },
  ];

  // Impact order; under elevated risk, gym & study lead even harder.
  const baseOrder: MissionKey[] = input.riskBand === "Low"
    ? ["nclex", "gym", "protein", "spiritual"]
    : ["gym", "nclex", "protein", "spiritual"];
  const rank = (k: MissionKey) => baseOrder.indexOf(k);

  // Undone first, then by impact order — surface the highest-leverage gaps.
  const sorted = [...all].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return rank(a.key) - rank(b.key);
  });
  const missions = sorted.slice(0, 3);

  return { missions, completed: missions.filter((m) => m.done).length, total: missions.length };
}
