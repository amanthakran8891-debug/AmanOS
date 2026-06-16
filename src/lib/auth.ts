// Single-user session token — edge-compatible (Web Crypto HMAC-SHA256).
// Works in both middleware (edge) and server actions (node). No dependencies.

export const SESSION_COOKIE = "amanos_session";
const enc = new TextEncoder();

function secret(): string {
  return process.env.AMANOS_SECRET || "amanos-dev-secret-change-me";
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return b64url(new Uint8Array(sig));
}

/** Create a signed session token valid for `days`. */
export async function createSession(days = 30): Promise<string> {
  const payload = `aman.${Date.now() + days * 86400000}`;
  return `${payload}.${await hmac(payload)}`;
}

/** Verify signature + expiry. Constant-time-ish compare. */
export async function verifySession(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const i = token.lastIndexOf(".");
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const [tag, expStr] = payload.split(".");
  const exp = Number(expStr);
  if (tag !== "aman" || !Number.isFinite(exp) || Date.now() > exp) return false;
  const expected = await hmac(payload);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let k = 0; k < sig.length; k++) diff |= expected.charCodeAt(k) ^ sig.charCodeAt(k);
  return diff === 0;
}
