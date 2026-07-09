# Security Best Practices Audit Report

**Project:** Civil Engineering Estimation Platform  
**Stack:** React 19 (Vite SPA) + Express 4 + Prisma/PostgreSQL  
**Date:** July 9, 2026  
**Status:** Findings remediated in this pass unless marked *Open*

## Executive Summary

The application had several **critical authentication bypasses** (forgeable `dev:` tokens and unauthenticated AI endpoints) and **information disclosure** risks (raw error strings leaked to clients). This audit identified 12 findings. **All critical and high findings are now remediated**, including HttpOnly cookie sessions with CSRF protection.

Production deployments must set `NODE_ENV=production`, `SUPABASE_JWT_SECRET`, and must **not** set `ALLOW_DEV_AUTH=true`.

---

## Critical

### SEC-001 — Forgeable `dev:` bearer tokens accepted in all environments

**Impact:** Any attacker could impersonate any user by sending `Authorization: Bearer dev:<uuid>` without a real login.

**Location:** `server/middleware/auth.ts` lines 24–33

**Status:** ✅ Fixed

**Remediation applied:**
- `dev:` tokens are rejected when `NODE_ENV === 'production'` unless `ALLOW_DEV_AUTH=true` is explicitly set.
- Dev token user IDs must match UUID format.

---

### SEC-002 — `/api/auth/dev-session` creates users/orgs without production guard

**Impact:** Unauthenticated callers could provision accounts and obtain valid session tokens in production.

**Location:** `server/routes/auth.ts` lines 6–8, `server/createApp.ts` line 53

**Status:** ✅ Fixed

**Remediation applied:**
- `devSessionHandler` returns `403` when dev auth is disabled in production.

---

## High

### SEC-003 — `/api/analyze-structure` was unauthenticated

**Impact:** Anonymous users could invoke Gemini API calls, exhausting quota and incurring cost.

**Location:** `server/createApp.ts` lines 55–59 (now behind `authMiddleware`)

**Status:** ✅ Fixed

**Remediation applied:**
- Endpoint moved inside authenticated `/api` router.
- Input validated with Zod (`description` max 4000 chars).
- AI rate limiter retained (`aiLimiter`).

---

### SEC-004 — Auth token stored in browser storage (XSS exfiltration risk)

**Impact:** Any XSS vulnerability allows theft of bearer tokens and full account takeover.

**Location:** `src/services/api.ts`, `server/security/cookies.ts`, `server/middleware/csrf.ts`

**Status:** ✅ Fixed

**Remediation applied:**
- Auth token stored in **HttpOnly** `cep_auth` cookie (not readable by JavaScript).
- CSRF double-submit cookie (`cep_csrf` + `X-CSRF-Token` header) on mutating API requests.
- `Secure` flag enabled in production (`COOKIE_SECURE=false` to override for local TLS testing).
- `SameSite=Lax` on all auth cookies.
- Bearer token header still supported for API clients without cookies.
- `AuthProvider` + `useAuth()` hook for session state; `POST /api/auth/logout` clears cookies.

---

### SEC-005 — Internal errors leaked via `String(e)` in API responses

**Impact:** Stack traces, SQL errors, and file paths could be exposed to clients, aiding reconnaissance.

**Location:** Multiple route handlers, e.g. `server/routes/projects.ts` lines 44–46, `server/routes/boq.ts`, `server/routes/measurements.ts`

**Status:** ✅ Fixed

**Remediation applied:**
- Added `server/security/httpErrors.ts` with `safeErrorMessage()` / `sendSafeError()`.
- All route catch blocks now return sanitized messages in production.

---

## Medium

### SEC-006 — Permissive JSON body limit (10 MB)

**Impact:** Large payload DoS against server memory.

**Location:** `server/createApp.ts` line 46

**Status:** ✅ Fixed — reduced to `1mb` JSON / `256kb` urlencoded.

---

### SEC-007 — Missing `X-Powered-By` disable and centralized error handler

**Impact:** Framework fingerprinting; unhandled errors may leak internals.

**Location:** `server/createApp.ts` lines 24, 84–88

**Status:** ✅ Fixed

---

### SEC-008 — CSP allowed `'unsafe-inline'` scripts in production

**Impact:** Inline script injection harder to block via CSP.

**Location:** `server/createApp.ts` lines 33–34

**Status:** ✅ Fixed for production (`scriptSrc: ['self']` only). Dev retains `'unsafe-inline'` for Vite HMR.

---

### SEC-009 — Assistant endpoint returned raw model output on validation failure

**Impact:** Unparsed model responses leaked to clients, potentially containing prompt fragments.

**Location:** `server/routes/assistantPublic.ts` lines 79–82

**Status:** ✅ Fixed — generic `502` messages only; no `details`/`raw` fields.

---

## Low

### SEC-010 — `AppBootstrap` auto-called dev session on every page load

**Impact:** Unexpected auth side effects; unnecessary API traffic.

**Location:** `src/features/app/AppBootstrap.tsx` lines 9–10

**Status:** ✅ Fixed — bootstrap runs only when `import.meta.env.DEV`.

---

### SEC-011 — PDF export filename not sanitized (*new*)

**Impact:** Response header injection via crafted filenames.

**Location:** `server/routes/reports.ts`

**Status:** ✅ Fixed — non-alphanumeric characters stripped from attachment filenames.

---

### SEC-012 — Missing UUID validation on project route params (*new*)

**Impact:** Invalid IDs reach database layer; minor enumeration surface.

**Location:** `server/middleware/validateParams.ts`, `server/routes/projects.ts` line 21

**Status:** ✅ Fixed

---

## Performance Improvements Applied

| Change | Location | Benefit |
|--------|----------|---------|
| React Query `staleTime: 60s`, `gcTime: 5m` defaults | `src/App.tsx` | Fewer redundant refetches |
| Dashboard `staleTime: 2m` | `src/pages/DashboardNew.tsx` | Stable dashboard metrics |
| Reduced body parser limits | `server/createApp.ts` | Lower memory per request |
| `refetchOnWindowFocus: false` (existing) | `src/App.tsx` | Less network churn on tab focus |

---

## Production Checklist

1. Set `NODE_ENV=production`
2. Set `DATABASE_URL`, `GEMINI_API_KEY`, `SUPABASE_JWT_SECRET`
3. Do **not** set `ALLOW_DEV_AUTH` unless intentionally overriding
4. Terminate TLS at your reverse proxy (nginx, Cloudflare, etc.)
5. Sessions use HttpOnly cookies — no client-side token storage required

---

## Verification

```bash
npm run lint
npm test
```

E2E auth seeding updated to call `/api/auth/dev-session` and store token in `sessionStorage`.
