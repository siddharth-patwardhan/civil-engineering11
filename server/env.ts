/**
 * Environment variable validation.
 * Call this at server startup to fail fast on missing configuration.
 */
export function validateEnv(): { ok: boolean; missing: string[] } {
  const required = [
    "DATABASE_URL",
    "SUPABASE_JWT_SECRET",
    "GEMINI_API_KEY",
  ];

  const optional = ["PORT", "NODE_ENV"];

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
    console.error("[ENV] Optional variables (not required):");
    for (const key of optional) {
      console.log(`  - ${key} = ${process.env[key] || "(not set)"}`);
    }
    return { ok: false, missing };
  }

  console.log("[ENV] All required environment variables are set.");
  return { ok: true, missing: [] };
}

/**
 * Safe accessor for environment variables with defaults.
 */
export function env(key: string, defaultValue?: string): string {
  return process.env[key] ?? defaultValue ?? "";
}

/**
 * Safe accessor for numeric environment variables.
 */
export function envInt(key: string, defaultValue: number): number {
  const val = process.env[key];
  if (!val) return defaultValue;
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}
