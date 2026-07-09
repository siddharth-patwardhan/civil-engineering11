import fs from "node:fs";
import path from "node:path";

export interface CronState {
  lastSixDayMaintenanceRun: number | null;
  lastSixDayMaintenanceStatus: "ok" | "error" | "skipped" | null;
  lastSixDayMaintenanceMessage: string | null;
}

const STATE_DIR = path.join(process.cwd(), "data");
const STATE_FILE = path.join(STATE_DIR, "cron-state.json");

const DEFAULT_STATE: CronState = {
  lastSixDayMaintenanceRun: null,
  lastSixDayMaintenanceStatus: null,
  lastSixDayMaintenanceMessage: null,
};

export function loadCronState(): CronState {
  try {
    if (!fs.existsSync(STATE_FILE)) return { ...DEFAULT_STATE };
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    return { ...DEFAULT_STATE, ...JSON.parse(raw) } as CronState;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveCronState(patch: Partial<CronState>) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const next = { ...loadCronState(), ...patch };
  fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2), "utf8");
}

export function getCronIntervalDays(): number {
  const parsed = Number(process.env.CRON_INTERVAL_DAYS ?? "6");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 6;
}

export function getCronIntervalMs(): number {
  return getCronIntervalDays() * 24 * 60 * 60 * 1000;
}

export function isCronEnabled(): boolean {
  return process.env.CRON_ENABLED !== "false";
}

export function getCronHealth() {
  const state = loadCronState();
  const intervalMs = getCronIntervalMs();
  const last = state.lastSixDayMaintenanceRun;
  const nextRunAt =
    last != null ? new Date(last + intervalMs).toISOString() : null;
  const due =
    last == null || Date.now() - last >= intervalMs;

  return {
    enabled: isCronEnabled(),
    intervalDays: getCronIntervalDays(),
    lastRunAt: last != null ? new Date(last).toISOString() : null,
    nextRunAt,
    due,
    status: state.lastSixDayMaintenanceStatus,
    message: state.lastSixDayMaintenanceMessage,
  };
}
