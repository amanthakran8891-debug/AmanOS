// Bhagavad Gita library — loads the verified public-domain data files and
// provides navigation/search/progress helpers. No scripture is defined here;
// it all comes from src/data/spiritual/*.json (see scripts/build-spiritual-data.mjs).

import chaptersData from "@/data/spiritual/gita-chapters.json";
import versesData from "@/data/spiritual/gita-verses.json";
import { VERSES as LIFE_VERSES } from "@/lib/gita";

export interface GitaChapter {
  number: number; sanskrit: string; transliteration: string; translation: string;
  meaning: string; versesCount: number; summary: string;
}
export interface GitaVerse { chapter: number; verse: number; sanskrit: string; transliteration: string; translation: string; hindi?: string }

// ── "Relate to your life" layer — reuses the curated reflections in gita.ts.
// meaning = plain-words explanation · application = how it applies to your life.
export interface VerseLife { meaning: string; application: string }
const LIFE = new Map<string, VerseLife>();
for (const v of LIFE_VERSES) {
  const m = v.ref.match(/(\d+)\.(\d+)/); // "Bhagavad Gita 2.47" / "2.62-63" → 2.47 / 2.62
  if (m) LIFE.set(`${m[1]}.${m[2]}`, { meaning: v.meaning, application: v.application });
}
/** Plain-language meaning + life application for a verse, if one is curated. */
export function verseLife(chapter: number, verse: number): VerseLife | null {
  return LIFE.get(`${chapter}.${verse}`) ?? null;
}

export const CHAPTERS = (chaptersData.chapters as GitaChapter[]).slice().sort((a, b) => a.number - b.number);
const VERSES = (versesData.verses as GitaVerse[]);
export const TOTAL_VERSES = CHAPTERS.reduce((s, c) => s + c.versesCount, 0); // 700
export const LOADED_VERSES = VERSES.length;
export const HAS_VERSES = LOADED_VERSES > 0;

const byKey = new Map(VERSES.map((v) => [`${v.chapter}.${v.verse}`, v]));

export const refOf = (v: { chapter: number; verse: number }) => `${v.chapter}.${v.verse}`;
export function getChapter(n: number): GitaChapter | undefined { return CHAPTERS.find((c) => c.number === n); }
export function chapterVerses(n: number): GitaVerse[] { return VERSES.filter((v) => v.chapter === n).sort((a, b) => a.verse - b.verse); }
export function chapterLoadedCount(n: number): number { return VERSES.reduce((s, v) => s + (v.chapter === n ? 1 : 0), 0); }
export function getVerse(ch: number, v: number): GitaVerse | undefined { return byKey.get(`${ch}.${v}`); }

/** Absolute 1-based index of a chapter/verse position within all 700 verses. */
export function verseAbsoluteIndex(ch: number, v: number): number {
  let idx = 0;
  for (const c of CHAPTERS) {
    if (c.number < ch) idx += c.versesCount;
    else if (c.number === ch) { idx += Math.min(v, c.versesCount); break; }
  }
  return idx;
}
export function progressPct(ch: number, v: number): number {
  return Math.max(0, Math.min(100, Math.round((verseAbsoluteIndex(ch, v) / TOTAL_VERSES) * 100)));
}

export function nextRef(ch: number, v: number): { chapter: number; verse: number } | null {
  const c = getChapter(ch); if (!c) return null;
  if (v < c.versesCount) return { chapter: ch, verse: v + 1 };
  const next = getChapter(ch + 1); return next ? { chapter: ch + 1, verse: 1 } : null;
}
export function prevRef(ch: number, v: number): { chapter: number; verse: number } | null {
  if (v > 1) return { chapter: ch, verse: v - 1 };
  const prev = getChapter(ch - 1); return prev ? { chapter: ch - 1, verse: prev.versesCount } : null;
}

export function searchVerses(q: string, limit = 40): GitaVerse[] {
  const s = q.trim().toLowerCase();
  if (s.length < 2) return [];
  return VERSES.filter((v) =>
    v.translation.toLowerCase().includes(s) ||
    v.transliteration.toLowerCase().includes(s) ||
    v.sanskrit.includes(q.trim()) ||
    `${v.chapter}.${v.verse}` === s,
  ).slice(0, limit);
}
