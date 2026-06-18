"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { findDuplicateRelapses, deleteRelapseDuplicates } from "@/app/actions";

interface DuplicateRelapseGroup {
  keep: { id: string; at: string; trigger: string | null };
  duplicates: { id: string; at: string; trigger: string | null }[];
}

export function DataCleanup() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [scanned, setScanned] = useState(false);
  const [groups, setGroups] = useState<DuplicateRelapseGroup[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<string | null>(null);

  const scan = () =>
    start(() =>
      void findDuplicateRelapses(8).then((g) => {
        setGroups(g);
        setScanned(true);
        setResult(null);
        // pre-select every duplicate by default
        const sel: Record<string, boolean> = {};
        for (const grp of g) for (const d of grp.duplicates) sel[d.id] = true;
        setSelected(sel);
      }),
    );

  const totalDupes = groups.reduce((s, g) => s + g.duplicates.length, 0);
  const chosen = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);

  const remove = () =>
    start(() =>
      void deleteRelapseDuplicates(chosen).then((n) => {
        setResult(`Deleted ${n} duplicate relapse log${n === 1 ? "" : "s"}.`);
        setGroups([]);
        setSelected({});
        router.refresh();
      }),
    );

  const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">🧹 Duplicate Log Cleanup</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Finds relapse logs within 8 minutes of each other (test/double entries). Cravings &amp; victories are never touched.</p>
        </div>
        <button className="btn-ghost !py-1.5 text-xs" disabled={pending} onClick={scan}>{pending && !scanned ? "Scanning…" : "Scan"}</button>
      </div>

      {result && <p className="mt-3 text-sm font-semibold text-neon-green">{result}</p>}

      {scanned && groups.length === 0 && !result && (
        <p className="mt-3 text-sm text-slate-400">No duplicate relapse logs found. 🎉</p>
      )}

      {groups.length > 0 && (
        <>
          <p className="mt-3 text-xs font-semibold text-neon-amber">{totalDupes} likely duplicate{totalDupes === 1 ? "" : "s"} across {groups.length} cluster{groups.length === 1 ? "" : "s"}. Review before deleting:</p>
          <div className="mt-2 space-y-2">
            {groups.map((g, gi) => (
              <div key={gi} className="rounded-xl border border-line bg-surface-2/50 p-3">
                <p className="text-[11px] text-slate-400">✓ Keep <span className="font-semibold text-neon-green">{fmt(g.keep.at)}</span>{g.keep.trigger ? ` · ${g.keep.trigger}` : ""}</p>
                <div className="mt-1.5 space-y-1">
                  {g.duplicates.map((d) => (
                    <label key={d.id} className="flex cursor-pointer items-center gap-2 text-[12px] text-slate-300">
                      <input type="checkbox" className="accent-neon-red" checked={!!selected[d.id]} onChange={(e) => setSelected((s) => ({ ...s, [d.id]: e.target.checked }))} />
                      <span className="text-neon-red">✕</span>
                      <span>{fmt(d.at)}{d.trigger ? ` · ${d.trigger}` : ""}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button className="btn-danger mt-3 w-full !py-2 text-sm" disabled={pending || chosen.length === 0} onClick={remove}>
            Delete {chosen.length} selected duplicate{chosen.length === 1 ? "" : "s"}
          </button>
        </>
      )}
    </div>
  );
}
