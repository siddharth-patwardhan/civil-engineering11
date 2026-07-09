/**
 * Environment variable validation.
 * Call this at server startup to fail fast on missing configuration.
 */
export function validateEnv(): { ok: boolean; missing: string[] } {
  const isProd = process.env.NODE_ENV === "production";
  const required = ["DATABASE_URL", "GEMINI_API_KEY"];
  if (isProd) {
    required.push("SUPABASE_JWT_SECRET");
  }

  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key] || process.env[key]!.trim() === "") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error("[ENV] Missing required environment variables:");
    for (const key of missing) {
      console.error(`  - ${key}`);
    }
    return { ok: false, missing };
  }

  console.log("[ENV] All required environment variables are set.");
  return { ok: true, missing: [] };
}
