// ─────────────────────────────────────────────────────────────────────────────
// AmanOS — Future Aman Messages (Phase 2, #6).
// Personal, earned letters from your future self, unlocked at clean milestones.
// ─────────────────────────────────────────────────────────────────────────────

export interface FutureMessage {
  day: number;
  title: string;
  unlocked: boolean;
  isLatest: boolean; // most recently unlocked
  message: string;
}

const MESSAGES: { day: number; title: string; message: string }[] = [
  {
    day: 1, title: "Survivor",
    message: "You made it through day one. That was the hardest door — and you walked through it. I remember this day. It's where everything started to change. Keep going.",
  },
  {
    day: 3, title: "Fighter",
    message: "Three days. The fog is lifting and the cravings are loud, but you're still here. You're not just surviving now — you're fighting back. I'm proud of you for not negotiating.",
  },
  {
    day: 7, title: "Warrior",
    message: "A full week clean. Your sleep, your focus, your mornings — they're already different. You proved the streak can hold. Now defend it like the warrior you've become.",
  },
  {
    day: 30, title: "Dragon Slayer",
    message: "Thirty days. Look how far you carried us. The dragon is wounded and it knows it. This is the version of you I always knew existed. Don't hand back what you fought for.",
  },
  {
    day: 90, title: "Freedom Master",
    message: "Ninety days clean. This isn't a streak anymore — it's who you are. Freedom feels normal now. From here, you're not running from the past; you're building the life I'm living. Thank you.",
  },
];

export function futureMessages(streakDays: number): FutureMessage[] {
  const unlockedDays = MESSAGES.filter((m) => streakDays >= m.day).map((m) => m.day);
  const latest = unlockedDays.length ? Math.max(...unlockedDays) : null;
  return MESSAGES.map((m) => ({
    day: m.day,
    title: m.title,
    message: m.message,
    unlocked: streakDays >= m.day,
    isLatest: m.day === latest,
  }));
}

/** The next message still locked, with days remaining. */
export function nextFutureMessage(streakDays: number): { day: number; title: string; daysAway: number } | null {
  const next = MESSAGES.find((m) => m.day > streakDays);
  return next ? { day: next.day, title: next.title, daysAway: next.day - streakDays } : null;
}
