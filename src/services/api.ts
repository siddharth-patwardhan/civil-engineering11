const CSRF_COOKIE = "cep_csrf";
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCsrfCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function coreFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const method = (init.method ?? "GET").toUpperCase();
  if (MUTATING.has(method)) {
    const csrf = readCsrfCookie();
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }

  const res = await fetch(path, { ...init, headers, credentials: "include" });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { error?: string };
      msg = j.error ?? msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function fetchBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  const headers = new Headers(init.headers);
  const method = (init.method ?? "GET").toUpperCase();
  if (MUTATING.has(method)) {
    const csrf = readCsrfCookie();
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }
  const res = await fetch(path, { ...init, headers, credentials: "include" });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { error?: string };
      msg = j.error ?? msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.blob();
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  jobTitle?: string | null;
  phone?: string | null;
}

export interface OrganizationProfile {
  id: string;
  name: string;
  registrationId: string | null;
  contactEmail: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  currency: string;
  taxRate: number;
  unitSystem: string;
  precision: number;
  isStandardsDefault: string | null;
  setupComplete: boolean;
}

export interface AuthSession {
  user: AuthUser;
  organization: OrganizationProfile | null;
  orgRole: string | null;
  needsSetup: boolean;
  defaultProjectId: string | null;
}

export const api = {
  fetch: coreFetch,
  fetchBlob,

  async session(): Promise<AuthSession> {
    return coreFetch<AuthSession>("/api/auth/session");
  },

  /** @deprecated Use session() */
  async me(): Promise<AuthUser> {
    const s = await coreFetch<AuthSession>("/api/auth/session");
    return s.user;
  },

  async signIn(email: string, name?: string) {
    return coreFetch<AuthSession>("/api/auth/sign-in", {
      method: "POST",
      body: JSON.stringify({ email, name }),
    });
  },

  async devSession(email?: string) {
    return api.signIn(email ?? "dev@local.test", "Local Developer");
  },

  async completeSetup(payload: Record<string, unknown>) {
    return coreFetch<AuthSession>("/api/auth/setup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getOrganization() {
    return coreFetch<{ organization: OrganizationProfile; orgRole: string }>("/api/organization");
  },

  async updateOrganization(payload: Record<string, unknown>) {
    return coreFetch<{ organization: OrganizationProfile }>("/api/organization", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async logout() {
    await coreFetch<void>("/api/auth/logout", { method: "POST" });
  },
};
