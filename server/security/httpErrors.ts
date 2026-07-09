import type { Response } from "express";

const isProd = process.env.NODE_ENV === "production";

/** Avoid leaking stack traces / internal errors to clients in production. */
export function safeErrorMessage(err: unknown, fallback = "An unexpected error occurred"): string {
  if (!isProd) {
    return err instanceof Error ? err.message : String(err);
  }
  if (err instanceof Error && "status" in err && typeof (err as { status?: number }).status === "number") {
    const status = (err as { status: number }).status;
    if (status >= 400 && status < 500) return err.message;
  }
  return fallback;
}

export function sendSafeError(res: Response, err: unknown, status = 503, fallback?: string) {
  const code = (err as Error & { status?: number }).status;
  const resolvedStatus = typeof code === "number" && code >= 400 && code < 600 ? code : status;
  res.status(resolvedStatus).json({ error: safeErrorMessage(err, fallback) });
}

export function isProduction(): boolean {
  return isProd;
}

/** Dev bearer tokens (dev:*) are only allowed outside production unless explicitly enabled. */
export function isDevAuthAllowed(): boolean {
  if (!isProd) return true;
  return process.env.ALLOW_DEV_AUTH === "true";
}
