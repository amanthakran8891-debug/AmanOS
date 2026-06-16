#!/usr/bin/env node
/**
 * build-spiritual-data.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Populates src/data/spiritual/gita-verses.json with the FULL, authentic
 * Bhagavad Gita (700 verses) from the gita/gita dataset — Unlicense / public
 * domain (https://github.com/gita/gita). Nothing is hand-written or invented.
 *
 * Run once:  node scripts/build-spiritual-data.mjs
 *
 * Optional Hanuman Chalisa: set HANUMAN_CHALISA_URL to a JSON source you trust
 * and this script will write src/data/spiritual/hanuman-chalisa.json too.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "data", "spiritual");
const BASE = "https://raw.githubusercontent.com/gita/gita/main/data";

const ENGLISH_AUTHOR_PREF = [16, 21, 18, 19]; // Sivananda, Purohit, Adidevananda, Gambirananda

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

async function buildGita() {
  console.log("Fetching Bhagavad Gita (Unlicense / public domain) …");
  const [verses, translations] = await Promise.all([
    getJson(`${BASE}/verse.json`),
    getJson(`${BASE}/translation.json`),
  ]);

  // Index English translations by verse_id, honouring author preference.
  const byVerse = new Map();
  for (const t of translations) {
    const lang = (t.lang || t.language || "").toLowerCase();
    if (lang !== "english") continue;
    const vid = t.verse_id ?? t.verseId;
    const existing = byVerse.get(vid);
    const rank = (a) => { const i = ENGLISH_AUTHOR_PREF.indexOf(a); return i === -1 ? 99 : i; };
    if (!existing || rank(t.author_id) < rank(existing.author_id)) byVerse.set(vid, t);
  }

  const out = verses
    .map((v) => {
      const t = byVerse.get(v.id);
      return {
        chapter: v.chapter_number,
        verse: v.verse_number,
        sanskrit: (v.slok || v.text || "").trim(),
        transliteration: (v.transliteration || "").trim(),
        translation: (t?.description || "").trim(),
      };
    })
    .filter((v) => v.sanskrit)
    .sort((a, b) => (a.chapter - b.chapter) || (a.verse - b.verse));

  const payload = {
    _source: "gita/gita dataset — Unlicense / public domain (https://github.com/gita/gita). English translation by the listed traditional commentators.",
    _builtAt: new Date().toISOString(),
    verses: out,
  };
  await writeFile(join(OUT, "gita-verses.json"), JSON.stringify(payload, null, 0));
  console.log(`✓ Wrote ${out.length} verses to gita-verses.json`);
  if (out.length < 690) console.warn(`! Expected ~700 verses — got ${out.length}. Check the upstream source.`);
}

async function buildChalisa() {
  const url = process.env.HANUMAN_CHALISA_URL;
  if (!url) {
    console.log("• Skipping Hanuman Chalisa (set HANUMAN_CHALISA_URL to a trusted JSON source to load it).");
    return;
  }
  try {
    console.log(`Fetching Hanuman Chalisa from ${url} …`);
    const data = await getJson(url);
    // Expect an array of { devanagari, transliteration, meaning } or { type, devanagari, transliteration, meaning }.
    const arr = Array.isArray(data) ? data : data.lines || data.verses || [];
    const lines = arr.map((l, i) => ({
      index: i,
      type: l.type || (i === 0 ? "doha" : "chaupai"),
      devanagari: l.devanagari || l.hindi || l.text || "",
      transliteration: l.transliteration || l.iast || "",
      meaning: l.meaning || l.translation || l.english || "",
    })).filter((l) => l.devanagari);
    if (!lines.length) throw new Error("no usable lines parsed");
    await writeFile(join(OUT, "hanuman-chalisa.json"), JSON.stringify({ _source: url, title: "Hanuman Chalisa", lines }, null, 0));
    console.log(`✓ Wrote ${lines.length} Hanuman Chalisa lines.`);
  } catch (e) {
    console.warn(`! Hanuman Chalisa not loaded: ${e.message}. Placeholder left in place.`);
  }
}

await buildGita();
await buildChalisa();
console.log("Done.");
