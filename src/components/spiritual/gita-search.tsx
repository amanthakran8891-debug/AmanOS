"use client";

import Link from "next/link";
import { useState } from "react";
import { searchVerses } from "@/lib/gita-library";

export function GitaSearch() {
  const [q, setQ] = useState("");
  const results = q.trim().length >= 2 ? searchVerses(q, 25) : [];

  return (
    <div className="mb-5">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search the Gita — a word, a theme, or 2.47…"
        className="w-full rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-violet/60"
      />
      {results.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {results.map((v) => (
            <Link key={`${v.chapter}.${v.verse}`} href={`/spiritual/gita/${v.chapter}#v${v.chapter}.${v.verse}`} className="block rounded-xl border border-line bg-surface px-3 py-2 transition hover:border-neon-violet/40">
              <p className="text-[11px] font-semibold text-neon-violet/70">{v.chapter}.{v.verse}</p>
              <p className="line-clamp-2 text-xs text-slate-300">{v.translation}</p>
            </Link>
          ))}
        </div>
      )}
      {q.trim().length >= 2 && results.length === 0 && <p className="mt-2 text-xs text-slate-500">No verses match “{q}”.</p>}
    </div>
  );
}
