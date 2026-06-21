"use client";

// AmanOS — time-aware entry links to the Morning Briefing / Evening Debrief.
// Before noon → morning; after 6pm → evening; midday → both (continue the day).
// A mount guard keeps SSR/client markup matched (shows both until mounted).
import { useEffect, useState } from "react";
import Link from "next/link";

export function RitualLinks() {
  const [hr, setHr] = useState<number | null>(null);
  useEffect(() => setHr(new Date().getHours()), []);

  const showMorning = hr === null ? true : hr < 18; // morning + midday
  const showEvening = hr === null ? true : hr >= 12; // midday + evening

  return (
    <section className="flex flex-wrap gap-2">
      {showMorning && (
        <Link href="/morning" className="card flex-1 min-w-[150px] text-center transition hover:border-cyan-400/50" style={{ background: "linear-gradient(160deg, rgba(34,211,238,0.10), rgba(13,19,34,0.5))" }}>
          <span className="text-[13px] font-bold text-cyan-300">⛟ Morning Briefing →</span>
        </Link>
      )}
      {showEvening && (
        <Link href="/evening" className="card flex-1 min-w-[150px] text-center transition hover:border-violet-400/50" style={{ background: "linear-gradient(160deg, rgba(167,139,250,0.10), rgba(13,19,34,0.5))" }}>
          <span className="text-[13px] font-bold text-violet-300">📋 Evening Debrief →</span>
        </Link>
      )}
    </section>
  );
}
