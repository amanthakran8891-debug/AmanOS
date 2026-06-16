"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Floating "Today" action button — always one tap from logging your day.
 *  Hidden on the Today page itself and the login screen. Sits above the nav. */
export function StickyToday() {
  const path = usePathname();
  if (path === "/today" || path === "/login") return null;
  return (
    <Link
      href="/today"
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-neon-green to-neon-cyan px-5 py-3 text-sm font-bold text-bg shadow-glow active:scale-95"
    >
      ✓ Today
    </Link>
  );
}
