const TOKEN_KEY = "civil_estimation_auth_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

async function coreFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { ...init, headers });
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

export const api = {
  TOKEN_KEY,
  getToken,
  setToken(token: string | null) {
    if (typeof window === "undefined") return;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },

  fetch: coreFetch,

  async devSession(email?: string) {
    const data = await coreFetch<{ token: string; defaultProjectId: string }>(
      "/api/auth/dev-session",
      {
        method: "POST",
        body: JSON.stringify({ email: email ?? "dev@local.test" }),
      },
    );
    api.setToken(data.token);
    return data;
  },
};
