import type { CookieOptions, Request, Response } from "express";
import { randomBytes } from "node:crypto";
import { isProduction } from "./httpErrors.js";

export const AUTH_COOKIE = "cep_auth";
export const CSRF_COOKIE = "cep_csrf";

const AUTH_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function useSecureCookies(): boolean {
  if (!isProduction()) return false;
  return process.env.COOKIE_SECURE !== "false";
}

function baseCookieOptions(maxAgeSec: number): CookieOptions {
  return {
    path: "/",
    maxAge: maxAgeSec * 1000,
    sameSite: "lax",
    secure: useSecureCookies(),
  };
}

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

export function getCookie(req: Request, name: string): string | undefined {
  return parseCookies(req)[name];
}

export function setAuthCookies(res: Response, token: string) {
  const csrf = randomBytes(32).toString("hex");
  res.cookie(AUTH_COOKIE, token, {
    ...baseCookieOptions(AUTH_MAX_AGE_SEC),
    httpOnly: true,
  });
  // Readable by JS so the SPA can attach X-CSRF-Token on mutating requests.
  res.cookie(CSRF_COOKIE, csrf, {
    ...baseCookieOptions(AUTH_MAX_AGE_SEC),
    httpOnly: false,
  });
}

export function clearAuthCookies(res: Response) {
  const clearOpts: CookieOptions = {
    path: "/",
    sameSite: "lax",
    secure: useSecureCookies(),
  };
  res.clearCookie(AUTH_COOKIE, { ...clearOpts, httpOnly: true });
  res.clearCookie(CSRF_COOKIE, { ...clearOpts, httpOnly: false });
}
