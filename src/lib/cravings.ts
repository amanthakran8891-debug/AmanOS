// AmanOS — Craving Analytics Engine.
// Pure analytics over Craving rows: victory rate, heatmaps, danger windows,
// trends. No DB import — the page passes rows in.

export interface CravingRow {
  at: Date | string;
  intensity: number;
  trigger?: string | null;
  location?: string | null;
  emotion?: string | null;
  outcome: string; // "won" | "lost"
}

export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface NameCount { name: string; count: number; won: number; lost: number }
export interface CravingAnalytics {
  total: number;
  won: number;
  lost: number;
  victoryRate: number; // %
  avgIntensity: number;
  byHour: number[]; // [24]
  byDay: number[]; // [7] Sun..Sat
  byIntensity: number[]; // [10] index 0 = intensity 1
  heatmap: number[][]; // [7][24]
  byTrigger: NameCount[];
  byLocation: NameCount[];
  byEmotion: NameCount[];
  daily: { date: string; total: number; won: number; lost: number }[];
  weekly: { week: string; total: number }[];
  monthly: { month: string; total: number }[];
  mostDangerousHour: string; // "08:00–10:00"
  mostDangerousDay: string;
  mostDangerousLocation: string;
  topTrigger: string;
  topEmotion: string;
  last7: number;
  prev7: number;
  trendPct: number; // last7 vs prev7
}

function topOf(list: NameCount[]): string {
  return list.length ? list[0].name : "—";
}

function tally(rows: CravingRow[], pick: (r: CravingRow) => string | null | undefined): NameCount[] {
  const m = new Map<string, NameCount>();
  for (const r of rows) {
    const k = (pick(r) || "").trim() || "unknown";
    const e = m.get(k) ?? { name: k, count: 0, won: 0, lost: 0 };
    e.count++;
    if (r.outcome === "lost") e.lost++; else e.won++;
    m.set(k, e);
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
}

export function cravingAnalytics(rows: CravingRow[], now = new Date()): CravingAnalytics {
  const byHour = Array(24).fill(0);
  const byDay = Array(7).fill(0);
  const byIntensity = Array(10).fill(0);
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  const dayMap = new Map<string, { total: number; won: number; lost: number }>();
  const weekMap = new Map<string, number>();
  const monthMap = new Map<string, number>();
  let won = 0, lost = 0, intensitySum = 0;
  const nowMs = now.getTime();
  let last7 = 0, prev7 = 0;

  for (const r of rows) {
    const d = new Date(r.at);
    const h = d.getHours();
    const dow = d.getDay();
    byHour[h]++;
    byDay[dow]++;
    heatmap[dow][h]++;
    const it = Math.min(10, Math.max(1, Math.round(r.intensity || 0)));
    byIntensity[it - 1]++;
    intensitySum += it;
    if (r.outcome === "lost") lost++; else won++;
    const ds = d.toISOString().slice(0, 10);
    const de = dayMap.get(ds) ?? { total: 0, won: 0, lost: 0 };
    de.total++; if (r.outcome === "lost") de.lost++; else de.won++; dayMap.set(ds, de);
    const wk = isoWeek(d);
    weekMap.set(wk, (weekMap.get(wk) ?? 0) + 1);
    const mo = ds.slice(0, 7);
    monthMap.set(mo, (monthMap.get(mo) ?? 0) + 1);
    const ageDays = (nowMs - d.getTime()) / 86400000;
    if (ageDays <= 7) last7++; else if (ageDays <= 14) prev7++;
  }

  const total = rows.length;
  const peakHour = byHour.indexOf(Math.max(...byHour, 0));
  const peakDay = byDay.indexOf(Math.max(...byDay, 0));
  const byTrigger = tally(rows, (r) => r.trigger);
  const byLocation = tally(rows, (r) => r.location);
  const byEmotion = tally(rows, (r) => r.emotion);
  const pad = (n: number) => String(n).padStart(2, "0");

  const daily = [...dayMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, v]) => ({ date, ...v }));
  const weekly = [...weekMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([week, t]) => ({ week, total: t }));
  const monthly = [...monthMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([month, t]) => ({ month, total: t }));

  return {
    total, won, lost,
    victoryRate: total ? Math.round((won / total) * 100) : 0,
    avgIntensity: total ? Math.round((intensitySum / total) * 10) / 10 : 0,
    byHour, byDay, byIntensity, heatmap,
    byTrigger, byLocation, byEmotion,
    daily, weekly, monthly,
    mostDangerousHour: total ? `${pad(peakHour)}:00–${pad((peakHour + 2) % 24)}:00` : "—",
    mostDangerousDay: total ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][peakDay] : "—",
    mostDangerousLocation: topOf(byLocation),
    topTrigger: topOf(byTrigger),
    topEmotion: topOf(byEmotion),
    last7, prev7,
    trendPct: prev7 ? Math.round(((last7 - prev7) / prev7) * 100) : (last7 ? 100 : 0),
  };
}

function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Curated option lists for the quick-log form.
export const TRIGGERS = ["boredom", "stress", "habit", "social", "celebration", "loneliness", "anxiety", "after-meal", "after-shift", "other"];
export const LOCATIONS = ["bedroom", "living-room", "kitchen", "work", "car", "outside", "friend's", "other"];
export const EMOTIONS = ["stress", "boredom", "anxiety", "sadness", "anger", "tired", "happy", "neutral"];
