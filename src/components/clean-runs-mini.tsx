"use client";

// AmanOS — compact "Last 10 Clean Runs" list for the Hourglass of Freedom card.
// Reuses the exact-duration streak runs. Default shows top 3; tap to show all 10.
// The ongoing run ticks live.
import { useEffect, useState } from "react";
import { formatDHM, type CleanRun } from "@/lib/streak-history";

const fmtTs = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const TYPE_STYLE: Record<string, string> = { Joint: "text-emerald-300", Cigarette: "text-amber-300", Both: "text-rose-300" };

export function CleanRunsMini({ runs }: { runs: CleanRun[] }) {
  const top10 = runs.slice(0, 10);
  const [showAll, setShowAll] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!top10.some((r) => r.ongoing)) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [top10]);

  if (top10.length === 0) return null;
  const live = (r: CleanRun) => (r.ongoing ? Math.max(0, nowMs - new Date(r.startISO).getTime()) : r.durationMs);
  const shown = showAll ? top10 : top10.slice(0, 3);

  return (
    <div className="mt-3 border-t border-line/60 pt-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Last 10 clean runs</p>
      <ol className="mt-1.5 space-y-1">
        {shown.map((r) => (
          <li key={r.index} className="flex items-baseline justify-between gap-2 text-[11px]">
            <span className="shrink-0 tabular-nums font-semibold text-slate-100">
              {r.index}. {formatDHM(live(r))}
              {r.ongoing && <span className="ml-1 text-[9px] text-neon-green">live</span>}
            </span>
            <span className="truncate text-right text-slate-500">
              {fmtTs(r.startISO)} → {r.ongoing ? <span className="text-neon-green">Ongoing</span> : fmtTs(r.endISO!)}
              {!r.ongoing && r.endedByType && <span className={`ml-1 ${TYPE_STYLE[r.endedByType] ?? ""}`}>· {r.endedByType}</span>}
            </span>
          </li>
        ))}
      </ol>
      {top10.length > 3 && (
        <button onClick={() => setShowAll((v) => !v)} className="mt-1.5 text-[11px] font-semibold text-blue-300 hover:text-blue-200">
          {showAll ? "Show less" : `Show all ${top10.length}`}
        </button>
      )}
    </div>
  );
}
