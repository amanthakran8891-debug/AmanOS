// All "days" in AmanOS are keyed by local calendar date "YYYY-MM-DD".
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDaysKey(key: string, delta: number): string {
  const d = keyToDate(key);
  d.setDate(d.getDate() + delta);
  return todayKey(d);
}

export function lastNDays(n: number, end: string = todayKey()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDaysKey(end, -i));
  return out;
}

export function prettyDate(d: Date = new Date()): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Whole + part breakdown of an elapsed duration since `since`. */
export function elapsedSince(since: Date, now: Date = new Date()) {
  let ms = Math.max(0, now.getTime() - since.getTime());
  const sec = Math.floor(ms / 1000) % 60;
  const min = Math.floor(ms / 60000) % 60;
  const hrs = Math.floor(ms / 3600000) % 24;
  const totalDays = Math.floor(ms / 86400000);
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);
  const days = (totalDays % 365) % 30;
  return { years, months, days, hours: hrs, minutes: min, seconds: sec, totalDays, totalSeconds: Math.floor(ms / 1000) };
}
