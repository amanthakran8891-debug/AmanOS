"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import type { SerpentBattle } from "@/lib/serpent";
import type { NicotineReport } from "@/lib/nicotine";
import { SerpentGlyph } from "./serpent-glyph";
import { NicotineDashboard } from "./nicotine-dashboard";
import { logNicotineEvent, completeMission } from "@/app/actions";

const THREAT_LABEL = { LOW: "LOW", MODERATE: "MODERATE", HIGH: "HIGH", EXTREME: "EXTREME" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SerpentClient({ battle, report, recent }: { battle: SerpentBattle; report: NicotineReport; recent: any[] }) {
  const s = battle.state;

  // Live nicotine-free time.
  const [ms, setMs] = useState(battle.freeMs);
  useEffect(() => {
    const base = Date.now() - battle.freeMs;
    const id = setInterval(() => setMs(Date.now() - base), 1000);
    return () => clearInterval(id);
  }, [battle.freeMs]);
  const sec = Math.max(0, Math.floor(ms / 1000));
  const free = `${Math.floor(sec / 86400)}d ${String(Math.floor((sec % 86400) / 3600)).padStart(2, "0")}h ${String(Math.floor((sec % 3600) / 60)).padStart(2, "0")}m ${String(sec % 60).padStart(2, "0")}s`;

  return (
    <div className="space-y-4">
      {/* ── HERO: enemy first ── */}
      <div className="card relative overflow-hidden" style={{ background: `radial-gradient(120% 90% at 50% 0%, ${s.color}22, rgba(13,19,34,0.7) 60%)` }}>
        <div className="flex items-center justify-between">
          <p className="text-lg font-black text-white">🐍 Smoke Serpent</p>
          <span className="rounded-full border px-2.5 py-0.5 text-[11px] font-black" style={{ color: s.color, borderColor: `${s.color}66`, background: `${s.color}1a` }}>
            THREAT: {THREAT_LABEL[s.threat]}
          </span>
        </div>

        <SerpentGlyph threat={s.threat} eye={s.eye} color={s.color} heavySmoke={s.heavySmoke} warningPulse={s.warningPulse} />
        <p className="text-center text-[11px] italic text-slate-400">{s.posture}</p>

        {/* HP bar */}
        <div className="mt-3">
          <div className="flex items-end justify-between">
            <span className="label">Smoke Serpent HP</span>
            <span className="font-mono text-sm font-bold" style={{ color: s.color }}>{s.hpCurrent} / {s.hpMax} · {s.threatPct}%</span>
          </div>
          <div className="mt-1 h-3 overflow-hidden rounded-full bg-bg">
            <motion.div className="h-full rounded-full" style={{ background: s.color, boxShadow: `0 0 12px ${s.color}aa` }} initial={{ width: 0 }} animate={{ width: `${s.threatPct}%` }} transition={{ duration: 0.8 }} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-line bg-surface-2/60 p-3">
            <p className="label">Nicotine-Free</p>
            <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-neon-green">{free}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface-2/60 p-3">
            <p className="label">Today&apos;s Damage</p>
            <p className="mt-0.5 text-lg font-black text-neon-green">−{battle.damage.total} HP</p>
          </div>
        </div>
        {battle.damage.healedToday > 0 && (
          <p className="mt-2 text-center text-[11px] font-semibold text-neon-red">⚠ Nicotine use today healed the serpent +{battle.damage.healedToday} HP.</p>
        )}
      </div>

      {/* ── Mission Board ── */}
      <NicotineMissions board={battle.missions} />

      {/* ── Arena ── */}
      <div className="card">
        <div className="flex items-center justify-between">
          <p className="label text-neon-red">⚔ Smoke Serpent Arena</p>
          <span className="text-sm font-black text-neon-green">−{battle.damage.total} HP today</span>
        </div>
        <div className="mt-3 space-y-1.5">
          {battle.damage.items.map((it) => (
            <div key={it.key} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${it.done ? "border-neon-green/40 bg-neon-green/10" : "border-line bg-surface-2/50"}`}>
              <span className="text-lg">{it.icon}</span>
              <span className={`flex-1 text-sm font-semibold ${it.done ? "text-neon-green" : "text-white"}`}>{it.label}{it.count && it.count > 1 ? ` ×${it.count}` : ""}</span>
              <span className={`text-sm font-bold ${it.done ? "text-neon-green" : "text-slate-500"}`}>−{it.hp} HP</span>
              <span className={`grid h-6 w-6 place-items-center rounded-full border-2 text-xs ${it.done ? "border-neon-green bg-neon-green text-bg" : "border-line text-transparent"}`}>✓</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Analytics: locked progression OR full dashboard ── */}
      {battle.analyticsUnlocked ? (
        <NicotineDashboard r={report} recent={recent} />
      ) : (
        <div className="card">
          <p className="label">🔒 Locked Systems</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Keep logging — advanced analytics unlock as data builds.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {battle.locked.map((l) => (
              <div key={l.key} className={`rounded-xl border p-3 ${l.locked ? "border-line bg-surface-2/40" : "border-neon-green/40 bg-neon-green/10"}`}>
                <p className="text-sm font-bold text-slate-300">{l.locked ? "🔒" : "✓"} {l.label}</p>
                <p className="text-[11px] text-slate-500">{l.locked ? `Unlocks in ${l.unlocksInDays} more day${l.unlocksInDays === 1 ? "" : "s"}` : "Unlocked"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Intelligence ── */}
      <div className="card">
        <p className="label text-neon-cyan">🧠 Smoke Serpent Intelligence</p>
        {battle.intel.enough ? (
          <ul className="mt-2 space-y-1.5">
            {battle.intel.insights.map((i, idx) => (
              <li key={idx} className="flex gap-2 text-[13px] text-slate-300"><span className="text-neon-cyan">•</span>{i}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-400">Not enough data yet — insights appear once you&apos;ve logged about a week of cravings and use.</p>
        )}
      </div>

      {/* ── Honest cost ── */}
      <CostCard cost={battle.cost} />

      {/* ── Progression ── */}
      <Progression battle={battle} report={report} />
    </div>
  );
}

function NicotineMissions({ board }: { board: SerpentBattle["missions"] }) {
  const [pending, start] = useTransition();
  const act = (m: SerpentBattle["missions"]["missions"][number]) => {
    if (m.done) return;
    if (m.action === "gym") start(() => void completeMission("gym"));
    else if (m.action === "craving-won") start(() => void logNicotineEvent({ type: "craving", outcome: "won" }));
  };
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="label text-neon-green">⚔ Today&apos;s Nicotine Mission</p>
        <span className="chip text-[11px] font-bold">{board.completed} / {board.total}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg">
        <div className="h-full rounded-full bg-neon-green" style={{ width: `${Math.round((board.completed / board.total) * 100)}%`, boxShadow: "0 0 10px rgba(52,245,197,0.6)" }} />
      </div>
      <div className="mt-3 space-y-2">
        {board.missions.map((m) => (
          <div key={m.key} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${m.done ? "border-neon-green/40 bg-neon-green/10" : "border-line bg-surface-2/60"}`}>
            <span className="text-lg">{m.icon}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold ${m.done ? "text-neon-green" : "text-white"}`}>{m.label}</p>
              <p className="text-[11px] font-semibold" style={{ color: m.rewardKind === "hp" ? "#fb7185" : "#a78bfa" }}>{m.reward}</p>
            </div>
            {m.done ? (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-neon-green text-bg">✓</span>
            ) : m.action === "passive" ? (
              <span className="text-[11px] font-semibold text-slate-500">in progress</span>
            ) : (
              <button className="btn-neon !px-3 !py-1.5 text-xs" disabled={pending} onClick={() => act(m)}>Done</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CostCard({ cost }: { cost: SerpentBattle["cost"] }) {
  const c = cost.currency;
  const rows: [string, string][] = [
    ["Daily", `${c}${cost.daily}`],
    ["Monthly", `${c}${cost.monthly.toLocaleString()}`],
    ["Yearly", `${c}${cost.yearly.toLocaleString()}`],
    ["5-year", `${c}${cost.fiveYear.toLocaleString()}`],
    ["10-year", `${c}${cost.tenYear.toLocaleString()}`],
  ];
  return (
    <div className="card">
      <p className="label">💸 Honest Cost</p>
      <div className="mt-1 rounded-xl border border-line bg-surface-2/50 px-3 py-2 text-[11px] text-slate-400">
        Assumptions: {cost.assumptions.cigsPerDay} cigarettes/day · {c}{cost.assumptions.pricePerUnit}/unit · {c}{cost.assumptions.pricePerPack}/pack of {cost.assumptions.packSize}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {rows.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-line bg-surface-2/60 p-3">
            <p className="text-lg font-extrabold tabular-nums text-neon-red">{v}</p>
            <p className="text-[10px] font-semibold text-slate-400">{k} cost</p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[12px]">
        <span className="text-slate-400">Saved so far: <span className="font-bold text-neon-green">{c}{cost.savedSoFar.toLocaleString()}</span></span>
        <span className="text-slate-400">Spent (logged): <span className="font-bold text-slate-200">{c}{cost.spentLogged.toLocaleString()}</span></span>
      </div>
    </div>
  );
}

function Progression({ battle, report }: { battle: SerpentBattle; report: NicotineReport }) {
  const p = battle.progress;
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">Serpent Progression</p>
          <p className="mt-0.5 text-lg font-black text-white">{p.rank.icon} {p.rank.name}</p>
        </div>
        {p.next && <span className="chip text-[11px]">{p.daysToNext}d → {p.next.name}</span>}
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg">
        <div className="h-full rounded-full bg-gradient-to-r from-neon-amber to-neon-green" style={{ width: `${p.progressPct}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {report.badges.map((b) => (
          <span key={b.key} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${b.earned ? "border-neon-amber/50 bg-neon-amber/10 text-neon-amber" : "border-line bg-surface-2/40 text-slate-600"}`}>
            {b.earned ? b.icon : "🔒"} {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
