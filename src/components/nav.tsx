"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  icon: string;
  /** Optional prefix match for active-state (e.g. "/reviews" matches nested routes). */
  match?: string;
};

const TABS: Tab[] = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/today", label: "Today", icon: "✓" },
  { href: "/discipline", label: "Discipline", icon: "⚖" },
  { href: "/recovery", label: "Recovery", icon: "🛡" },
  { href: "/nclex", label: "NCLEX", icon: "📚" },
  { href: "/gym", label: "Gym", icon: "🏋" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

const REVIEW_TABS = [
  { href: "/reviews/weekly", label: "Weekly" },
  { href: "/reviews/monthly", label: "Monthly" },
  { href: "/reviews/quarterly", label: "Quarterly" },
];

export function ReviewTabs() {
  const path = usePathname();
  return (
    <div className="mb-4 inline-flex rounded-xl border border-line bg-surface-2 p-1">
      {REVIEW_TABS.map((t) => {
        const active = path === t.href;
        return (
          <Link key={t.href} href={t.href} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${active ? "bg-neon-green/15 text-neon-green" : "text-slate-400 hover:text-white"}`}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

export function Nav() {
  const path = usePathname();
  if (path === "/login") return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-stretch justify-around px-2">
        {TABS.map((t) => {
          const active = t.match ? path.startsWith(t.match) : path === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition ${active ? "text-neon-green" : "text-slate-500 hover:text-slate-300"}`}
            >
              <span className={`text-lg leading-none ${active ? "glow-text" : ""}`}>{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
