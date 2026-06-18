"use client";

import { useState, useTransition, useEffect } from "react";
import { motion } from "framer-motion";
import type { RecoveryData } from "@/lib/data";
import {
  SCORE_META, SYMPTOM_KEYS, SYMPTOM_META, USE_LEVELS, TIMELINE,
  BODY_TIMELINE, bodyPhase, recoveryScoresAt,
  type SymptomKey, type UseLevel, type RecoveryScores,
} from "@/lib/recovery";
import { logSymptoms, updateRecoveryProfile } from "@/app/actions";
import { cleanDaysFloat } from "@/lib/clean-time";

const confColor = { low: "#fb7185", medium: "#fbbf24", high: "#34f5c5" } as const;

export function RecoveryClient({ data }: { data: RecoveryData }) {
  const { model, cleanDays, profile, today, longestStreak } = data;
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<void>) => start(() => void fn());

  const phase = TIMELINE[model.phaseIndex] ?? TIMELINE[0];

  // Live recovery — recomputes every second so progress is visible in real time.
  const [live, setLive] = useState<RecoveryScores | null>(null);
  useEffect(() => {
    if (!data.lastJointAt) return;
    const tick = () => setLive(recoveryScoresAt(cleanDaysFloat(data.lastJointAt), data.liveInputs.level as UseLevel, data.liveInputs.symptomAvg, data.liveInputs.longestStreak));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data.lastJointAt, data.liveInputs]);
  const scores = live ?? model.scores;
  const freedom = scores.freedom;
  const bp = bodyPhase(cleanDays);
  const dayFloat = data.lastJointAt ? cleanDaysFloat(data.lastJointAt) : cleanDays;
  const prevScores = recoveryScoresAt(Math.max(0, dayFloat - 1), data.liveInputs.level as UseLevel, data.liveInputs.symptomAvg, data.liveInputs.longestStreak);
  const journeyPct = Math.round((cleanDays / 365) * 1000) / 10;

  return (
    <div className="space-y-4">
      {/* ── Freedom hero ── */}
      <div className="card relative overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(52,245,197,0.14), rgba(13,19,34,0.6))" }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="label">Freedom Score · live</p>
            <p className="text-5xl font-extrabold tabular-nums text-white glow-text">{freedom.toFixed(2)}<span className="text-2xl text-slate-400">%</span></p>
            <p className="text-xs text-slate-400">{cleanDays} clean {cleanDays === 1 ? "day" : "days"} · best ever {longestStreak}d</p>
            <p className="mt-1 text-[11px] font-semibold text-neon-cyan">📡 Recovery Journey · Day {cleanDays} of 365 · {journeyPct}%</p>
          </div>
          <FreedomRing pct={freedom} />
        </div>
        <div className="mt-3 rounded-xl bg-bg/50 px-3 py-2">
          <p className="text-sm font-bold text-neon-green">{phase.title}</p>
          <p className="text-xs text-slate-300">{phase.body}</p>
        </div>
      </div>

      {/* ── Living Body recovery — real-time ── */}
      <div className="card">
        <div className="flex items-center justify-between">
          <p className="label">Living Body recovery <span className="ml-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-neon-green align-middle" /> <span className="text-[10px] font-normal text-slate-500">live</span></p>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: `${confColor[model.confidence]}22`, color: confColor[model.confidence] }}>
            {model.confidence} confidence
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SCORE_META.filter((s) => s.key !== "freedom").map((s) => {
            const v = scores[s.key];
            return (
              <div key={s.key} className="rounded-2xl border border-line bg-surface-2 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-base font-bold tabular-nums" style={{ color: s.color }}>{v.toFixed(2)}%</span>
                </div>
                <p className="text-right text-[10px] font-bold text-neon-green">▲ +{Math.max(0, v - prevScores[s.key]).toFixed(1)}% today</p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-300">{s.label}</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${v}%`, background: s.color }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">Every minute clean moves these forward — slowly, like real biology. {model.confidenceNote}</p>
      </div>

      {/* ── Body timeline — what's happening inside my body ── */}
      <div className="card">
        <p className="label">What&apos;s happening inside your body</p>
        {bp.current && (
          <div className="mt-2 rounded-xl border border-neon-cyan/40 bg-neon-cyan/8 px-3 py-2">
            <p className="text-sm font-bold text-neon-cyan">Now · {bp.current.title}</p>
            <p className="text-xs text-slate-300">{bp.current.body}</p>
          </div>
        )}
        {bp.next && (
          <div className="mt-2 rounded-xl border border-line bg-surface-2 px-3 py-2">
            <p className="text-xs font-bold text-slate-200">Next · {bp.next.title} <span className="font-normal text-slate-500">in {Math.max(0, bp.next.day - cleanDays)} day{bp.next.day - cleanDays === 1 ? "" : "s"}</span></p>
            <p className="text-[11px] text-slate-400">{bp.next.body}</p>
          </div>
        )}
        <div className="mt-3 space-y-1">
          {BODY_TIMELINE.map((b, i) => {
            const done = cleanDays >= b.day;
            const isNow = i === bp.currentIndex;
            return (
              <div key={b.day} className="flex items-center gap-2 text-xs">
                <span>{done ? (isNow ? "🔹" : "✅") : "⚪"}</span>
                <span className={`w-14 shrink-0 tabular-nums ${done ? "text-slate-300" : "text-slate-600"}`}>Day {b.day}</span>
                <span className={done ? "text-slate-200" : "text-slate-500"}>{b.title.replace(/^Day \d+ · /, "")}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Relapse resilience note ── */}
      <div className="card" style={{ borderColor: "rgba(167,139,250,0.3)" }}>
        <p className="text-sm font-semibold text-neon-violet">A relapse is a setback, not the end.</p>
        <p className="mt-1 text-xs text-slate-300">If you slip, the clean streak resets and your Freedom Score dips — but Habit Rewire and Brain Recovery keep a floor from your best-ever {longestStreak}-day streak. Progress you&apos;ve built isn&apos;t wiped to zero. You restart from experience, not from scratch.</p>
      </div>

      {/* ── THC burden curve ── */}
      <div className="card">
        <p className="label">Estimated THC burden</p>
        <BurdenCurve model={model} cleanDays={cleanDays} />
        <p className="mt-2 text-[11px] text-slate-400">{model.burden.caption}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-bg/50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Burden remaining (est.)</p>
            <p className="text-sm font-bold text-white tabular-nums">{Math.min(model.burden.lowPct, model.burden.highPct)}–{Math.max(model.burden.lowPct, model.burden.highPct)}%</p>
          </div>
          <div className="rounded-lg bg-bg/50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Detection window ({model.level.label})</p>
            <p className="text-sm font-bold text-white tabular-nums">{model.detection.low}–{model.detection.high} days{model.detection.clearedLikely ? " · likely cleared" : ""}</p>
          </div>
        </div>
      </div>

      {/* ── Recovery timeline ── */}
      <div className="card">
        <p className="label">Recovery timeline</p>
        <div className="mt-3 space-y-2">
          {TIMELINE.map((p, i) => {
            const active = i === model.phaseIndex;
            const done = i < model.phaseIndex;
            return (
              <div key={p.title} className={`flex gap-3 rounded-xl border px-3 py-2 transition ${active ? "border-neon-green/60 bg-neon-green/10" : done ? "border-line bg-surface-2 opacity-70" : "border-line bg-surface-2"}`}>
                <span className="mt-0.5 text-sm">{done ? "✅" : active ? "🔹" : "⚪"}</span>
                <div>
                  <p className={`text-xs font-bold ${active ? "text-neon-green" : "text-slate-200"}`}>{p.title}</p>
                  <p className="text-[11px] text-slate-400">{p.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Daily symptom tracker ── */}
      <SymptomTracker today={today} pending={pending} onSave={(vals, note) => run(() => logSymptoms(vals, note))} />

      {/* ── Personal recovery profile ── */}
      <ProfileEditor profile={profile} pending={pending} onSave={(p) => run(() => updateRecoveryProfile(p))} />

      <p className="px-1 pb-2 text-center text-[11px] text-slate-500">
        This is a motivational recovery estimate, not a medical THC test or diagnosis. Ranges are based on published cannabis-recovery data and personalised by your inputs.
      </p>
    </div>
  );
}

// ── Freedom ring ──────────────────────────────────────────────────────────────
function FreedomRing({ pct }: { pct: number }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0 -rotate-90">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#1e2942" strokeWidth="8" />
      <motion.circle cx="40" cy="40" r={r} fill="none" stroke="#34f5c5" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }} transition={{ duration: 1 }}
        style={{ filter: "drop-shadow(0 0 6px rgba(52,245,197,0.6))" }} />
    </svg>
  );
}

// ── THC burden curve (low/high band) ───────────────────────────────────────────
function BurdenCurve({ model, cleanDays }: { model: RecoveryData["model"]; cleanDays: number }) {
  const pts = model.burden.points;
  const W = 320, H = 120, padL = 28, padB = 18, padT = 8;
  const maxDay = pts[pts.length - 1].day || 1;
  const x = (day: number) => padL + (day / maxDay) * (W - padL - 6);
  const y = (v: number) => padT + (1 - v / 100) * (H - padT - padB);

  const highLine = pts.map((p) => `${x(p.day)},${y(p.high)}`).join(" ");
  const bandPath =
    `M ${pts.map((p) => `${x(p.day)},${y(p.high)}`).join(" L ")} ` +
    `L ${[...pts].reverse().map((p) => `${x(p.day)},${y(p.low)}`).join(" L ")} Z`;
  const nowX = x(Math.min(cleanDays, maxDay));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full">
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={padL} x2={W - 6} y1={y(g)} y2={y(g)} stroke="#1e2942" strokeWidth="1" />
          <text x={padL - 4} y={y(g) + 3} textAnchor="end" fontSize="8" fill="#64748b">{g}</text>
        </g>
      ))}
      <path d={bandPath} fill="rgba(52,245,197,0.16)" stroke="none" />
      <polyline points={highLine} fill="none" stroke="#34f5c5" strokeWidth="2" />
      {cleanDays <= maxDay && (
        <g>
          <line x1={nowX} x2={nowX} y1={padT} y2={H - padB} stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x={nowX} y={H - 4} textAnchor="middle" fontSize="8" fill="#fbbf24">day {cleanDays}</text>
        </g>
      )}
      <text x={W - 6} y={H - 4} textAnchor="end" fontSize="8" fill="#64748b">{maxDay}d</text>
    </svg>
  );
}

// ── Daily symptom tracker ──────────────────────────────────────────────────────
function SymptomTracker({ today, onSave, pending }: { today: RecoveryData["today"]; onSave: (v: Record<SymptomKey, number>, note: string) => void; pending: boolean }) {
  const init = () => {
    const o = {} as Record<SymptomKey, number>;
    for (const k of SYMPTOM_KEYS) o[k] = today ? (today as unknown as Record<string, number>)[k] ?? 5 : 5;
    return o;
  };
  const [vals, setVals] = useState<Record<SymptomKey, number>>(init);
  const [note, setNote] = useState(today?.note ?? "");

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="label">Daily symptom check-in</p>
        {today && <span className="text-[10px] font-semibold text-neon-green">✓ logged today</span>}
      </div>
      <p className="mt-1 text-[11px] text-slate-400">Rate each 0–10. This tunes your recovery forecast.</p>
      <div className="mt-3 space-y-2.5">
        {SYMPTOM_KEYS.map((k) => {
          const meta = SYMPTOM_META[k];
          const v = vals[k];
          const good = meta.positive ? v / 10 : 1 - v / 10;
          const col = good > 0.66 ? "#34f5c5" : good > 0.4 ? "#fbbf24" : "#fb7185";
          return (
            <div key={k} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-xs text-slate-300">{meta.icon} {meta.label}</span>
              <input type="range" min={0} max={10} value={v} onChange={(e) => setVals({ ...vals, [k]: Number(e.target.value) })}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-bg accent-neon-green" style={{ accentColor: col }} />
              <span className="w-6 text-right text-xs font-bold tabular-nums" style={{ color: col }}>{v}</span>
            </div>
          );
        })}
      </div>
      <input className="input mt-3" placeholder="Note (trigger, win, anything)…" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn-neon mt-2 w-full" disabled={pending} onClick={() => onSave(vals, note)}>{pending ? "Saving…" : today ? "Update check-in" : "Save check-in"}</button>
    </div>
  );
}

// ── Personal recovery profile ───────────────────────────────────────────────────
function ProfileEditor({ profile, onSave, pending }: { profile: RecoveryData["profile"]; onSave: (p: { recUseLevel?: string; recJointsPerDay?: number; recUseYears?: number; recActivityLevel?: string; recExerciseFreq?: number; recBaselineWeight?: number | null }) => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<UseLevel>((profile.recUseLevel as UseLevel) ?? "chronic");
  const [joints, setJoints] = useState(String(profile.recJointsPerDay));
  const [years, setYears] = useState(String(profile.recUseYears));
  const [activity, setActivity] = useState(profile.recActivityLevel);
  const [exFreq, setExFreq] = useState(String(profile.recExerciseFreq));
  const [weight, setWeight] = useState(profile.recBaselineWeight != null ? String(profile.recBaselineWeight) : "");

  const spec = USE_LEVELS[level];

  return (
    <div className="card">
      <button className="flex w-full items-center justify-between" onClick={() => setOpen((o) => !o)}>
        <span className="label">Personal recovery profile</span>
        <span className="text-xs text-slate-400">{USE_LEVELS[(profile.recUseLevel as UseLevel) ?? "chronic"].label} {open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <div>
            <p className="mb-1 text-xs text-slate-400">Use level</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.values(USE_LEVELS)).map((l) => (
                <button key={l.key} onClick={() => setLevel(l.key)}
                  className={`rounded-xl border px-3 py-2 text-left text-xs transition ${level === l.key ? "border-neon-green/60 bg-neon-green/10" : "border-line bg-surface-2"}`}>
                  <span className={`font-bold ${level === l.key ? "text-neon-green" : "text-white"}`}>{l.label}</span>
                  <span className="block text-[10px] text-slate-400">{l.blurb}</span>
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Detection window ≈ {spec.detectLow}–{spec.detectHigh} days · slower clearance assumed for heavier use.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-400">Joints/day (avg)<input className="input mt-1" inputMode="decimal" value={joints} onChange={(e) => setJoints(e.target.value)} /></label>
            <label className="text-xs text-slate-400">Years of use<input className="input mt-1" inputMode="decimal" value={years} onChange={(e) => setYears(e.target.value)} /></label>
            <label className="text-xs text-slate-400">Exercise days/wk<input className="input mt-1" inputMode="numeric" value={exFreq} onChange={(e) => setExFreq(e.target.value)} /></label>
            <label className="text-xs text-slate-400">Weight (kg)<input className="input mt-1" inputMode="decimal" placeholder="optional" value={weight} onChange={(e) => setWeight(e.target.value)} /></label>
            <label className="col-span-2 text-xs text-slate-400">Activity level
              <select className="input mt-1" value={activity} onChange={(e) => setActivity(e.target.value)}>
                <option value="sedentary">Sedentary</option><option value="light">Light</option><option value="moderate">Moderate</option><option value="active">Active</option>
              </select>
            </label>
          </div>
          <button className="btn-neon w-full" disabled={pending} onClick={() => onSave({
            recUseLevel: level,
            recJointsPerDay: parseFloat(joints) || 0,
            recUseYears: parseFloat(years) || 0,
            recActivityLevel: activity,
            recExerciseFreq: parseInt(exFreq || "0", 10),
            recBaselineWeight: weight === "" ? null : parseFloat(weight),
          })}>{pending ? "Saving…" : "Save profile"}</button>
        </div>
      )}
    </div>
  );
}
