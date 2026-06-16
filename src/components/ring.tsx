"use client";

import { motion } from "framer-motion";

export function Ring({
  value,
  max = 100,
  size = 120,
  stroke = 12,
  color = "#34f5c5",
  track = "#16203a",
  label,
  center,
  glow = true,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
  center?: React.ReactNode;
  glow?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={glow ? { filter: `drop-shadow(0 0 8px ${color}55)` } : undefined}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {center}
        {label && <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>}
      </div>
    </div>
  );
}

export function MiniRing({
  value,
  max,
  color,
  title,
  display,
}: {
  value: number;
  max: number;
  color: string;
  title: string;
  display: string;
}) {
  return (
    <div className="card-tight flex flex-col items-center gap-1">
      <Ring
        value={value}
        max={max}
        size={92}
        stroke={9}
        color={color}
        center={<span className="text-sm font-bold tabular-nums text-white">{display}</span>}
      />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</span>
    </div>
  );
}
