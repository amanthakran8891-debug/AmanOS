// Presentational building blocks (server-safe — no hooks).
import Link from "next/link";

export function StatTile({ label, value, sub, color = "#e8edf6", accent }: { label: string; value: React.ReactNode; sub?: string; color?: string; accent?: string }) {
  return (
    <div className="card-tight" style={accent ? { borderColor: `${accent}44` } : undefined}>
      <p className="label">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

export function Bar({ value, max = 100, color = "#34f5c5", label, right }: { value: number; max?: number; color?: string; label?: string; right?: string }) {
  const w = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <div>
      {(label || right) && (
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-300">{label}</span>
          <span className="tabular-nums text-slate-400">{right}</span>
        </div>
      )}
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg">
        <div className="h-full rounded-full" style={{ width: `${w}%`, background: color, boxShadow: `0 0 10px ${color}66` }} />
      </div>
    </div>
  );
}

export function Delta({ from, to, unit = "", invert = false }: { from: number; to: number; unit?: string; invert?: boolean }) {
  const diff = to - from;
  const good = invert ? diff < 0 : diff > 0;
  const color = diff === 0 ? "#94a3b8" : good ? "#34f5c5" : "#fb7185";
  const arrow = diff === 0 ? "→" : diff > 0 ? "↑" : "↓";
  return (
    <span className="tabular-nums" style={{ color }}>
      {arrow} {Math.abs(diff).toFixed(unit === "kg" || unit === "h" ? 1 : 0)}{unit}
    </span>
  );
}

export function PageHeader({ title, subtitle, accent = "#34f5c5" }: { title: string; subtitle?: string; accent?: string }) {
  return (
    <header className="mb-5">
      <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-300">← Command Center</Link>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
        <span style={{ color: accent }} className="glow-text">{title}</span>
      </h1>
      {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
    </header>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card flex items-center justify-center py-10 text-center text-sm text-slate-400">{children}</div>;
}

export function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}
