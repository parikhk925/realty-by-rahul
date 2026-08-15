import "server-only";
import crypto from "node:crypto";

/**
 * CRM admin session.
 *
 * A single shared operator account, which is what this is: Rahul's own board,
 * not a multi-user system. Credentials live in env vars, never in the repo.
 *
 * The cookie carries an expiry and an HMAC over it, so it cannot be forged or
 * extended without the signing secret. Comparisons are timing-safe.
 */

export const CRM_COOKIE = "rbr_crm_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function credentials() {
  return {
    user: process.env.CRM_ADMIN_USER?.trim() ?? "",
    password: process.env.CRM_ADMIN_PASSWORD?.trim() ?? "",
    // Falls back to the password so a deployment cannot accidentally sign with
    // an empty key, but a dedicated secret is preferred.
    secret:
      process.env.CRM_SESSION_SECRET?.trim() ||
      process.env.CRM_ADMIN_PASSWORD?.trim() ||
      "",
  };
}

export function isCrmAuthConfigured() {
  const { user, password } = credentials();
  return Boolean(user && password);
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual throws on length mismatch, so compare digests instead —
  // that keeps the comparison constant-time regardless of input length.
  const hashA = crypto.createHash("sha256").update(bufA).digest();
  const hashB = crypto.createHash("sha256").update(bufB).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function verifyCredentials(user: string, password: string): boolean {
  const expected = credentials();
  if (!expected.user || !expected.password) return false;
  // Both compared unconditionally so a wrong username is not faster to reject.
  const userOk = safeEqual(user, expected.user);
  const passOk = safeEqual(password, expected.password);
  return userOk && passOk;
}

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function createSessionValue(): string {
  const { secret } = credentials();
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = String(expires);
  return `${payload}.${sign(payload, secret)}`;
}

export function isValidSessionValue(value: string | undefined): boolean {
  if (!value) return false;
  const { secret } = credentials();
  if (!secret) return false;

  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload, secret);
  if (signature.length !== expected.length) return false;
  if (!safeEqual(signature, expected)) return false;

  const expires = Number(payload);
  return Number.isFinite(expires) && expires > Date.now();
}

export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
