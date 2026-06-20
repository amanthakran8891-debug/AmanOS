// AmanOS — compact "Today's Recovery Logs" for the Home Joint Recovery card.
import Link from "next/link";
import type { RecoveryDayLog } from "@/lib/recovery-logs";

export function RecoveryLogsMini({ today }: { today: RecoveryDayLog }) {
  return (
    <div className="mt-3 border-t border-line/60 pt-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Today’s recovery logs</p>
        <Link href="/recovery" className="text-[11px] font-semibold text-blue-300 hover:text-blue-200">View all logs →</Link>
      </div>
      <p className="mt-1 text-[12px] text-slate-300">
        Cravings: <span className="font-semibold text-slate-100">{today.cravings}</span>
        {" · "}Resisted: <span className="font-semibold text-emerald-300">{today.resisted}</span>
        {" · "}Lost: <span className="font-semibold text-rose-300">{today.lost}</span>
        {" · "}Relapses: <span className="font-semibold text-rose-300">{today.relapses}</span>
      </p>
    </div>
  );
}
