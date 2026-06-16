// Anatomical recovery map. Server-safe (no hooks). Colours each muscle group
// by days since last trained: green = fresh/recovered-recently, red = neglected.
const recColor = (days: number | null) =>
  days == null ? "#334155" : days <= 1 ? "#34f5c5" : days <= 3 ? "#a3e635" : days <= 6 ? "#fbbf24" : "#fb7185";

const recLabel = (days: number | null) => (days == null ? "never" : days === 0 ? "today" : `${days}d`);

export function BodyMap({ recency }: { recency: Record<string, number | null> }) {
  const c = (k: string) => recColor(recency[k]);
  const region = (k: string) => ({ fill: c(k), opacity: recency[k] == null ? 0.35 : 0.92 });

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="label">Body Map · recovery</p>
        <div className="flex items-center gap-2 text-[9px] text-slate-400">
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "#34f5c5" }} /> fresh</span>
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "#fb7185" }} /> neglected</span>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {/* FRONT */}
        <figure className="rounded-2xl border border-line bg-bg/40 p-2">
          <svg viewBox="0 0 120 220" className="mx-auto h-56">
            <ellipse cx="60" cy="18" rx="13" ry="15" fill="#1e2942" />
            {/* shoulders */}
            <ellipse cx="33" cy="50" rx="13" ry="11" {...region("Shoulders")} />
            <ellipse cx="87" cy="50" rx="13" ry="11" {...region("Shoulders")} />
            {/* chest */}
            <rect x="38" y="44" width="44" height="30" rx="12" {...region("Chest")} />
            {/* biceps */}
            <rect x="20" y="60" width="12" height="34" rx="6" {...region("Biceps")} />
            <rect x="88" y="60" width="12" height="34" rx="6" {...region("Biceps")} />
            {/* abs */}
            <rect x="44" y="76" width="32" height="40" rx="8" {...region("Abs")} />
            {/* legs */}
            <rect x="42" y="120" width="16" height="74" rx="8" {...region("Legs")} />
            <rect x="62" y="120" width="16" height="74" rx="8" {...region("Legs")} />
          </svg>
          <figcaption className="text-center text-[10px] font-semibold text-slate-400">Front</figcaption>
        </figure>

        {/* BACK */}
        <figure className="rounded-2xl border border-line bg-bg/40 p-2">
          <svg viewBox="0 0 120 220" className="mx-auto h-56">
            <ellipse cx="60" cy="18" rx="13" ry="15" fill="#1e2942" />
            <ellipse cx="33" cy="50" rx="13" ry="11" {...region("Shoulders")} />
            <ellipse cx="87" cy="50" rx="13" ry="11" {...region("Shoulders")} />
            {/* back / lats */}
            <path d="M38 46 H82 L76 110 H44 Z" {...region("Back")} />
            {/* triceps */}
            <rect x="20" y="60" width="12" height="34" rx="6" {...region("Triceps")} />
            <rect x="88" y="60" width="12" height="34" rx="6" {...region("Triceps")} />
            {/* legs (hamstrings) */}
            <rect x="42" y="120" width="16" height="74" rx="8" {...region("Legs")} />
            <rect x="62" y="120" width="16" height="74" rx="8" {...region("Legs")} />
          </svg>
          <figcaption className="text-center text-[10px] font-semibold text-slate-400">Back</figcaption>
        </figure>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {["Chest", "Back", "Legs", "Shoulders", "Biceps", "Triceps", "Abs", "Cardio"].map((p) => (
          <div key={p} className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-center">
            <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: recColor(recency[p]) }} />
            <span className="text-[9px] text-slate-300">{p}</span>
            <span className="block text-[9px] text-slate-500">{recLabel(recency[p])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
