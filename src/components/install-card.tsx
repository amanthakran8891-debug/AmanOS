"use client";

import { useEffect, useState } from "react";

export function InstallCard() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem("amanos_install_dismissed")) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);
  if (!show) return null;
  const dismiss = () => {
    try { localStorage.setItem("amanos_install_dismissed", "1"); } catch {}
    setShow(false);
  };
  return (
    <div className="card relative" style={{ background: "linear-gradient(160deg, rgba(34,211,238,0.10), rgba(13,19,34,0.55))" }}>
      <button onClick={dismiss} className="absolute right-3 top-3 text-slate-500 hover:text-white" aria-label="Dismiss">✕</button>
      <p className="label text-neon-cyan">📲 Install AmanOS on your phone</p>
      <div className="mt-2 space-y-1 text-sm text-slate-200">
        <p><span className="font-semibold text-white">iPhone:</span> Safari → Share → <span className="font-semibold">Add to Home Screen</span></p>
        <p><span className="font-semibold text-white">Android:</span> Chrome → ⋮ menu → <span className="font-semibold">Add to Home Screen</span></p>
      </div>
      <p className="mt-2 text-xs text-slate-400">Opens full-screen like a native app — your first thing in the morning, last thing at night.</p>
      <button onClick={dismiss} className="btn-ghost mt-2 !py-1 !text-xs">Got it</button>
    </div>
  );
}
