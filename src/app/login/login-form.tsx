"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { login } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        start(async () => {
          const res = await login(password, next);
          if (res?.error) setError(res.error);
        });
      }}
      className="card w-full max-w-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-neon-green to-neon-violet text-base font-black text-bg">A</span>
        <div>
          <p className="text-lg font-extrabold text-white">AmanOS</p>
          <p className="text-[11px] text-slate-400">Private — authorised access only</p>
        </div>
      </div>

      <label className="block">
        <span className="label">Password</span>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          className="input mt-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </label>

      {error && <p className="mt-2 text-sm text-neon-red">{error}</p>}

      <button type="submit" disabled={pending || !password} className="btn-neon mt-4 w-full">
        {pending ? "Unlocking…" : "Enter AmanOS"}
      </button>
    </motion.form>
  );
}
