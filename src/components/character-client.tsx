"use client";

import { motion } from "framer-motion";
import type { RpgData } from "@/lib/data";

export function CharacterClient({ data }: { data: RpgData }) {
  const { character, records, combos } = data;

  return (
    <div className="space-y-4">
      {/* ── Character header ── */}
      <div className="card relative overflow-hidden" style={{ background: "linear-gradient(165deg, rgba(167,139,250,0.16), rgba(13,19,34,0.72))", borderColor: "rgba(167,139,250,0.4)" }}>
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-neon-violet to-neon-cyan text-2xl font-black text-bg">A</div>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-extrabold tracking-tight text-white">AMAN</p>
            <p className="text-sm font-bold text-neon-violet">Lvl {character.level} · {character.rank}</p>
          </div>
          <div className="text-right">
            <p className="label">Combat Power</p>
            <p className="text-2xl font-extrabold tabular-nums text-white">{character.combatPower}</p>
          </div>
        </div>
      </div>

      {/* ── Attributes ── */}
      <div className="card">
        <p className="label">Attributes <span className="text-slate-500">· each grows only from real action</span></p>
        <div className="mt-3 space-y-2.5">
          {character.attributes.map((a) => (
            <div key={a.key} className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg" style={{ background: `${a.color}1f` }}>{a.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-white">{a.label} <span className="text-xs font-semibold" style={{ color: a.color }}>Lv {a.level}</span></span>
                  <span className="text-[10px] text-slate-500">{a.proof}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${a.progressPct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: a.color, boxShadow: `0 0 8px ${a.color}66` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Personal records ── */}
      <div className="card">
        <p className="label">Personal records <span className="text-slate-500">· hard-won, harder to beat</span></p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {records.map((r) => (
            <div key={r.key} className="rounded-2xl border border-line bg-surface-2 p-3">
              <div className="flex items-center justify-between">
                <span className="text-lg">{r.icon}</span>
                <span className="text-lg font-extrabold tabular-nums text-white">{r.value}</span>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">{r.label}</p>
              <p className="text-[10px] text-slate-500">{r.date ? `Set ${r.date}` : r.hint}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Combos ── */}
      <div className="card">
        <p className="label">Combos <span className="text-slate-500">· keep the chain alive</span></p>
        <div className="mt-3 space-y-2">
          {combos.map((c) => {
            const broken = !c.active;
            const pct = c.nextTier ? Math.min(100, Math.round((c.current / c.nextTier) * 100)) : 100;
            return (
              <div key={c.key} className={`rounded-xl border px-3 py-2.5 ${broken ? "border-line bg-surface-2 opacity-70" : "bg-surface-2"}`} style={broken ? undefined : { borderColor: `${c.color}55` }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{c.icon} {c.label} combo</span>
                  <span className="text-sm font-extrabold tabular-nums" style={{ color: broken ? "#64748b" : c.color }}>
                    {broken ? "broken" : `${c.current}🔥`}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg">
                  <div className="h-full rounded-full transition-all" style={{ width: `${broken ? 0 : pct}%`, background: c.color }} />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  {c.nextTier ? `Next tier at ${c.nextTier} · ` : "Max tier reached · "}best {c.best}
                  {broken && c.best > 0 ? " — chain broken, rebuild it" : ""}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <p className="px-1 pb-2 text-center text-[11px] text-slate-500">Every stat on this page is computed from your real logged history. Nothing here can be faked or bought — only earned.</p>
    </div>
  );
}
