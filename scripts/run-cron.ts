import "dotenv/config";
import { triggerSixDayMaintenanceNow } from "./server/cron/scheduler.js";

void triggerSixDayMaintenanceNow()
  .then(() => {
    console.log("[cron:run] Done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[cron:run] Failed:", err);
    process.exit(1);
  });
