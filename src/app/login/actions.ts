"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

export async function login(password: string, next: string): Promise<{ error: string } | void> {
  const expected = process.env.AMANOS_PASSWORD;
  if (!expected) return { error: "AMANOS_PASSWORD is not set on the server." };
  if (password !== expected) return { error: "Wrong password." };

  const token = await createSession(30);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 86400,
  });
  redirect(next && next.startsWith("/") ? next : "/");
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
