import {
  getCronHealth,
  getCronIntervalMs,
  isCronEnabled,
  loadCronState,
  saveCronState,
} from "./state.js";
import { runSixDayMaintenance } from "./jobs/sixDayMaintenance.js";

let timer: ReturnType<typeof setTimeout> | null = null;
let running = false;

async function executeSixDayMaintenance(trigger: "startup" | "scheduled") {
  if (running) {
    console.warn("[cron] Skipping overlapping 6-day maintenance run");
    return;
  }

  running = true;
  const started = Date.now();
  console.log(`[cron] Starting 6-day maintenance (${trigger})...`);

  try {
    const result = await runSixDayMaintenance();
    const message = `purged=${result.purgedNotifications} reminders=${result.approvalReminders} auditPruned=${result.prunedAuditEvents}`;
    saveCronState({
      lastSixDayMaintenanceRun: started,
      lastSixDayMaintenanceStatus: "ok",
      lastSixDayMaintenanceMessage: message,
    });
    console.log(`[cron] 6-day maintenance completed: ${message}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    saveCronState({
      lastSixDayMaintenanceRun: started,
      lastSixDayMaintenanceStatus: "error",
      lastSixDayMaintenanceMessage: msg,
    });
    console.error("[cron] 6-day maintenance failed:", err);
  } finally {
    running = false;
  }
}

function msUntilNextRun(): number {
  const intervalMs = getCronIntervalMs();
  const state = loadCronState();
  const last = state.lastSixDayMaintenanceRun;
  if (last == null) return 0;
  const elapsed = Date.now() - last;
  return Math.max(intervalMs - elapsed, 0);
}

function scheduleNext() {
  if (timer) clearTimeout(timer);
  const delay = msUntilNextRun();
  timer = setTimeout(() => {
    void executeSixDayMaintenance("scheduled").finally(() => scheduleNext());
  }, delay || 1_000);

  const health = getCronHealth();
  console.log(
    `[cron] Next 6-day maintenance at ${health.nextRunAt ?? "immediately"} (every ${health.intervalDays} days)`,
  );
}

/** Starts the repeating 6-day cron job. Safe to call once at server boot. */
export function startSixDayCron() {
  if (!isCronEnabled()) {
    console.log("[cron] Disabled via CRON_ENABLED=false");
    return;
  }

  const due = msUntilNextRun() === 0;
  if (due) {
    void executeSixDayMaintenance("startup").finally(() => scheduleNext());
  } else {
    scheduleNext();
  }
}

/** Manual trigger for ops / scripts. */
export async function triggerSixDayMaintenanceNow() {
  await executeSixDayMaintenance("scheduled");
}

export function stopSixDayCron() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export { getCronHealth };
