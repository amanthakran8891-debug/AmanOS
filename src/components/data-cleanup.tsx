"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { findDuplicateRelapses, deleteRelapseDuplicates, archiveRelapsesBefore, findSuspiciousRelapseDays, collapseRelapseDaysToOne } from "@/app/actions";

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
  const today = new Date().toISOString().slice(0, 10);
  const [archiveDate, setArchiveDate] = useState(today);
  const [archiveResult, setArchiveResult] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [suspicious, setSuspicious] = useState<{ date: string; count: number }[] | null>(null);
  const [suspResult, setSuspResult] = useState<string | null>(null);

  const scanSuspicious = () =>
    start(() =>
      void findSuspiciousRelapseDays(4).then((d) => { setSuspicious(d); setSuspResult(null); }),
    );

  const collapseDay = (date: string) =>
    start(() =>
      void collapseRelapseDaysToOne([date]).then((n) => {
        setSuspResult(`Kept the earliest relapse on ${date}, removed ${n} duplicate${n === 1 ? "" : "s"}.`);
        setSuspicious((s) => (s ? s.filter((x) => x.date !== date) : s));
        router.refresh();
      }),
    );

  const archive = () =>
    start(() =>
      void archiveRelapsesBefore(new Date(archiveDate).toISOString()).then((n) => {
        setArchiveResult(`Archived ${n} relapse log${n === 1 ? "" : "s"} before ${archiveDate}.`);
        setConfirmArchive(false);
        router.refresh();
      }),
    );

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

      {/* Suspicious days — unrealistic relapse counts on a single day */}
      <div className="mt-4 rounded-xl border border-line bg-surface-2/40 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Suspicious days</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Days with ≥ 4 relapse logs — almost always double-tap/test spam. Collapse keeps the earliest, removes the rest.</p>
          </div>
          <button className="btn-ghost !py-1.5 text-xs" disabled={pending} onClick={scanSuspicious}>Scan days</button>
        </div>
        {suspResult && <p className="mt-2 text-sm font-semibold text-neon-green">{suspResult}</p>}
        {suspicious && suspicious.length === 0 && !suspResult && (
          <p className="mt-2 text-sm text-slate-400">No suspicious days found. 🎉</p>
        )}
        {suspicious && suspicious.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {suspicious.map((d) => (
              <div key={d.date} className="flex items-center justify-between rounded-lg border border-line bg-surface-2/50 px-3 py-2">
                <span className="text-[12px] text-slate-300"><span className="font-semibold text-neon-amber">{d.count}</span> relapses on {d.date}</span>
                <button className="btn-danger !py-1 text-[11px]" disabled={pending} onClick={() => collapseDay(d.date)}>Collapse to 1</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Option C — archive test data before a date */}
      <div className="mt-4 rounded-xl border border-line bg-surface-2/40 p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Archive test data</p>
        <p className="mt-0.5 text-[11px] text-slate-500">Remove relapse logs before a date (e.g. development/test entries). Cravings &amp; victories are kept.</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input type="date" className="input max-w-[160px]" value={archiveDate} onChange={(e) => { setArchiveDate(e.target.value); setConfirmArchive(false); }} />
          {!confirmArchive ? (
            <button className="btn-ghost !py-1.5 text-xs" disabled={pending} onClick={() => setConfirmArchive(true)}>Archive before this date</button>
          ) : (
            <button className="btn-danger !py-1.5 text-xs" disabled={pending} onClick={archive}>Confirm — archive now</button>
          )}
        </div>
        {archiveResult && <p className="mt-2 text-sm font-semibold text-neon-green">{archiveResult}</p>}
      </div>

      <p className="mt-3 text-[11px] font-semibold text-neon-red/90">⚠ These actions cannot be undone unless the database is restored from a backup.</p>
    </div>
  );
}
