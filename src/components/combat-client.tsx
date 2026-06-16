"use client";

import { motion } from "framer-motion";
import type { CombatData } from "@/lib/data";

export function CombatClient({ data }: { data: CombatData }) {
  const { xp, level, rank, nextRank, xpIntoLevel, xpToNext, levelProgressPct, combatPower, maxed, dragon, totals, bosses, equipment, chapters, battleLog, victory } = data;

  return (
    <div className="space-y-4">
      {/* ── Victory ── */}
      {victory && (
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="card relative overflow-hidden text-center" style={{ background: "linear-gradient(160deg, rgba(52,245,197,0.18), rgba(13,19,34,0.7))", borderColor: "rgba(52,245,197,0.5)" }}>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-neon-green">Victory</p>
          <h2 className="mt-1 text-2xl font-extrabold text-white glow-text">{victory.milestone} days clean</h2>
          <p className="text-sm text-slate-300">You defeated <b className="text-white">{victory.bossName}</b> — another part of the Dragon.</p>
          <div className="mt-3 space-y-1.5 text-left text-xs">
            <p className="text-slate-300"><b className="text-neon-green">Improved:</b> {victory.improved}</p>
            <p className="text-slate-300"><b className="text-neon-cyan">Gained:</b> {victory.gained}</p>
            <p className="text-slate-300"><b className="text-neon-amber">Next:</b> {victory.next}</p>
          </div>
        </motion.div>
      )}

      {/* ── Combat HUD ── */}
      <div className="card" style={{ background: "linear-gradient(160deg, rgba(167,139,250,0.12), rgba(13,19,34,0.6))" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="label">Your rank</p>
            <p className="text-2xl font-extrabold text-white">Lvl {level} · <span className="text-neon-violet glow-text">{rank}</span></p>
            <p className="text-[11px] text-slate-400">{maxed ? "Maximum rank reached." : nextRank ? `Next: Lvl ${nextRank.level} ${nextRank.name}` : ""}</p>
          </div>
          <div className="text-right">
            <p className="label">Combat Power</p>
            <p className="text-3xl font-extrabold tabular-nums text-white">{combatPower}</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>XP {xp.toLocaleString()}</span>
            <span>{maxed ? "MAX" : `${xpIntoLevel}/${xpToNext} to Lvl ${level + 1}`}</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-bg">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-neon-violet to-neon-cyan" initial={{ width: 0 }} animate={{ width: `${levelProgressPct}%` }} transition={{ duration: 0.8 }} />
          </div>
        </div>
      </div>

      {/* ── Dragon status ── */}
      <div className="card">
        <div className="flex items-center justify-between">
          <p className="label">Dragon status</p>
          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: `${dragon.threatColor}22`, color: dragon.threatColor }}>Threat: {dragon.threat}</span>
        </div>
        <div className="mt-3 space-y-2">
          <StatBar label="Health" value={dragon.health} color="#fb7185" hint="falls as you stay clean & disciplined" />
          <StatBar label="Armor" value={dragon.armor} color="#f97316" hint="falls as your discipline rises" />
          <StatBar label="Attack Power" value={dragon.attackPower} color="#fbbf24" hint="rises with cravings & missed targets" />
        </div>
        <p className="mt-2 text-[11px] text-slate-400">The Dragon weakens only when you get stronger. It cannot be cheated — these bars move with real logged behaviour.</p>
      </div>

      {/* ── Campaign map ── */}
      <div className="card">
        <p className="label">Campaign</p>
        <div className="mt-3 space-y-2">
          {chapters.map((c) => (
            <div key={c.n} className={`rounded-xl border px-3 py-2 ${c.status === "current" ? "border-neon-cyan/60 bg-neon-cyan/10" : c.status === "done" ? "border-neon-green/40 bg-neon-green/5" : "border-line bg-surface-2"}`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-bold ${c.status === "locked" ? "text-slate-500" : "text-white"}`}>{c.status === "done" ? "✅" : c.status === "current" ? "📍" : "🔒"} Ch.{c.n} · {c.name}</p>
                <span className="text-[11px] tabular-nums text-slate-400">{c.progressPct}%</span>
              </div>
              <p className="text-[11px] text-slate-400">{c.tagline}</p>
              {c.status !== "locked" && (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg">
                  <div className="h-full rounded-full" style={{ width: `${c.progressPct}%`, background: c.status === "done" ? "#34f5c5" : "#22d3ee" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bosses ── */}
      <div className="card">
        <p className="label">Boss fights</p>
        <div className="mt-3 space-y-2">
          {bosses.map((b) => (
            <div key={b.key} className={`rounded-xl border px-3 py-3 ${b.status === "active" ? "border-neon-red/60 bg-neon-red/8" : b.status === "defeated" ? "border-neon-green/40 bg-neon-green/5" : "border-line bg-surface-2"}`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-bold ${b.status === "locked" ? "text-slate-500" : "text-white"}`}>
                  {b.status === "defeated" ? "💀" : b.status === "active" ? "⚔️" : "🔒"} {b.name}{b.final ? " 👑" : ""}
                </p>
                <span className="text-[11px] font-bold" style={{ color: b.status === "defeated" ? "#34f5c5" : b.status === "active" ? "#fb7185" : "#64748b" }}>
                  {b.status === "defeated" ? "DEFEATED" : `${b.day} days`}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">{b.desc}</p>
              {b.status === "active" && (
                <>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg">
                    <div className="h-full rounded-full bg-neon-red" style={{ width: `${b.progressPct}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">Reward: +{b.reward} XP · permanent Dragon damage · {b.progressPct}% there</p>
                </>
              )}
              {b.status === "defeated" && <p className="mt-1 text-[10px] text-neon-green">+{b.reward} XP claimed · permanent damage dealt</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Equipment ── */}
      <div className="card">
        <p className="label">Equipment <span className="text-slate-500">· habits forged into gear</span></p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {equipment.map((e) => (
            <div key={e.key} className={`rounded-2xl border p-3 ${e.unlocked ? "border-neon-amber/50 bg-neon-amber/8" : "border-line bg-surface-2 opacity-80"}`}>
              <div className="flex items-center justify-between">
                <span className="text-lg">{e.unlocked ? "⚔️" : "🔒"}</span>
                <span className="text-[11px] font-bold" style={{ color: e.unlocked ? "#fbbf24" : "#64748b" }}>+{e.bonus} CP</span>
              </div>
              <p className={`mt-1 text-sm font-bold ${e.unlocked ? "text-white" : "text-slate-400"}`}>{e.name}</p>
              <p className="text-[10px] text-slate-400">{e.source}</p>
              <p className="mt-1 text-[10px]" style={{ color: e.unlocked ? "#34f5c5" : "#64748b" }}>{e.unlocked ? "Equipped" : e.requirement} · {e.progress}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Battle log ── */}
      <div className="card">
        <p className="label">Battle log</p>
        {battleLog.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No battles logged yet. Complete real actions today and the campaign begins.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {battleLog.map((day) => (
              <div key={day.date}>
                <div className="flex items-center justify-between border-b border-line pb-1">
                  <p className="text-xs font-bold text-slate-200">{day.label}</p>
                  {day.totalDamage > 0 && <span className="text-[11px] font-bold text-neon-green">−{day.totalDamage} dmg dealt</span>}
                </div>
                <div className="mt-1.5 space-y-1">
                  {day.entries.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-14 shrink-0 font-bold tabular-nums" style={{ color: e.kind === "damage" ? "#34f5c5" : "#fb7185" }}>
                        {e.kind === "damage" ? `+${e.amount}` : `−${e.amount}`}
                      </span>
                      <span className={e.kind === "damage" ? "text-slate-300" : "text-neon-red/90"}>
                        {e.kind === "damage" ? "Damage" : "Dragon retaliated"} · {e.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Lifetime totals ── */}
      <div className="card">
        <p className="label">Lifetime campaign record</p>
        <div className="mt-2 grid grid-cols-4 gap-2 text-center">
          <Tot label="Clean" v={totals.cleanDays} />
          <Tot label="Study" v={totals.studyDays} />
          <Tot label="Gym" v={totals.gymDays} />
          <Tot label="Protein" v={totals.proteinDays} />
          <Tot label="Sleep" v={totals.sleepDays} />
          <Tot label="BharatFare" v={totals.bharatfareDays} />
          <Tot label="Weekly wins" v={totals.weeklyMissions} />
          <Tot label="Bosses" v={totals.bossesDefeated} />
        </div>
      </div>

      <p className="px-1 pb-2 text-center text-[11px] text-slate-500">XP is calculated from your real logged history — nothing here can be faked. The Dragon is every habit, excuse and weakness between you and your future.</p>
    </div>
  );
}

function StatBar({ label, value, color, hint }: { label: string; value: number; color: string; hint: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-slate-200">{label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{value}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg">
        <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.9 }} />
      </div>
      <p className="text-[10px] text-slate-500">{hint}</p>
    </div>
  );
}

function Tot({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 py-2">
      <p className="text-lg font-extrabold tabular-nums text-white">{v}</p>
      <p className="text-[9px] uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
