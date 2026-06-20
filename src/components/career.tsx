// AmanOS — Phase 2, item 3: Career Command Center panel (presentational, pure).
import type { CareerCommand, RiskLevel } from "@/lib/career";

const RISK_COLOR: Record<RiskLevel, string> = {
  Low: "#34f5c5", Elevated: "#fbbf24", High: "#fb923c", Critical: "#fb7185",
};
const STAGE_COLOR: Record<string, string> = {
  applied: "#94a3b8", interview: "#22d3ee", offer: "#34f5c5", rejected: "#fb7185",
};
const LABEL: Record<string, string> = {
  "up-to-date": "Up to date", "due-soon": "Due soon", overdue: "Overdue",
  none: "None", ongoing: "Ongoing", suspended: "Suspended", resolved: "Resolved",
  registered: "Registered", conditions: "Conditions", lapsed: "Lapsed", removed: "Removed",
};
const cap = (s: string) => LABEL[s] ?? s;

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold" style={{ color: color ?? "#e2e8f0" }}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}

export function CareerPanel({ data: d }: { data: CareerCommand }) {
  const bandColor = d.progressScore >= 85 ? "#34f5c5" : d.progressScore >= 65 ? "#a3e635" : d.progressScore >= 40 ? "#22d3ee" : "#fb7185";
  const dDays = (n: number | null) => (n == null ? "—" : n < 0 ? `${Math.abs(n)}d overdue` : `${n}d`);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">🩺 Career Command Center</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Registration, revalidation, investigations & the job pipeline.</p>
        </div>
        <span className="chip" style={{ color: RISK_COLOR[d.riskLevel], borderColor: `${RISK_COLOR[d.riskLevel]}55` }}>● {d.riskLevel} risk</span>
      </div>

      {/* Next action */}
      <div className="mt-3 rounded-xl border p-3" style={{ borderColor: `${RISK_COLOR[d.riskLevel]}40`, background: `${RISK_COLOR[d.riskLevel]}10` }}>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Next action</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-100">{d.nextAction}</p>
      </div>

      {/* Progress score */}
      <div className="mt-3 rounded-xl border border-line bg-surface-2/50 p-3 text-center">
        <p className="text-3xl font-extrabold" style={{ color: bandColor }}>{d.progressScore}<span className="text-base text-slate-500">/100</span></p>
        <p className="mt-0.5 text-sm font-bold" style={{ color: bandColor }}>{d.band}</p>
        <p className="mt-1 text-[10px] text-slate-500">Registration {d.scoreBreakdown.registration} · Revalidation {d.scoreBreakdown.revalidation} · Investigation {d.scoreBreakdown.investigation} · Job search {d.scoreBreakdown.jobSearch}</p>
      </div>

      {/* Status */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="NMC" value={cap(d.status.nmcStatus)} color={d.status.nmcStatus === "registered" ? "#34f5c5" : "#fbbf24"} />
        <Stat label="Revalidation" value={cap(d.status.revalidationStatus)} sub={d.status.revalidationDate ? `due ${dDays(d.daysToRevalidation)}` : undefined} />
        <Stat label="NHS investigation" value={cap(d.status.nhsInvestigationStatus)} color={d.status.nhsInvestigationStatus === "none" || d.status.nhsInvestigationStatus === "resolved" ? "#34f5c5" : "#fb7185"} />
        <Stat label="Suspension review" value={d.status.suspensionReviewDate ? dDays(d.daysToSuspensionReview) : "—"} sub={d.status.suspensionReviewDate ?? undefined} />
      </div>

      {/* Funnel */}
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">Application funnel</p>
      <div className="mt-1.5 grid grid-cols-4 gap-2">
        <Stat label="Applied" value={String(d.funnel.applied)} />
        <Stat label="Interview" value={String(d.funnel.interview)} color="#22d3ee" />
        <Stat label="Offer" value={String(d.funnel.offer)} color="#34f5c5" />
        <Stat label="Rejected" value={String(d.funnel.rejected)} color="#fb7185" />
      </div>

      {/* Applications */}
      {d.applications.length > 0 ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-wide text-slate-500">
                <th className="py-1.5 pr-2">Organisation</th>
                <th className="py-1.5 pr-2">Role</th>
                <th className="py-1.5 pr-2">Sent</th>
                <th className="py-1.5 pr-2 text-right">Stage</th>
              </tr>
            </thead>
            <tbody>
              {d.applications.map((a, i) => (
                <tr key={`${a.organisation}-${i}`} className="border-b border-line/40 last:border-0">
                  <td className="py-1.5 pr-2 text-slate-300">{a.organisation}</td>
                  <td className="py-1.5 pr-2 text-slate-400">{a.role}</td>
                  <td className="py-1.5 pr-2 text-slate-500">{a.dateSent}</td>
                  <td className="py-1.5 pr-2 text-right font-semibold" style={{ color: STAGE_COLOR[a.stage] }}>{a.stage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-[12px] text-slate-500">No applications logged yet — add rows in <code className="text-slate-400">src/data/career.ts</code>.</p>
      )}

      {d.status.notes ? <p className="mt-3 text-[11px] text-slate-400">📝 {d.status.notes}</p> : null}
    </div>
  );
}
