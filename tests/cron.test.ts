import { describe, expect, it } from "vitest";
import { getCronIntervalDays, getCronIntervalMs } from "../server/cron/state.js";

describe("cron interval config", () => {
  it("defaults to 6 days", () => {
    const prev = process.env.CRON_INTERVAL_DAYS;
    delete process.env.CRON_INTERVAL_DAYS;
    expect(getCronIntervalDays()).toBe(6);
    expect(getCronIntervalMs()).toBe(6 * 24 * 60 * 60 * 1000);
    if (prev !== undefined) process.env.CRON_INTERVAL_DAYS = prev;
  });

  it("respects CRON_INTERVAL_DAYS override", () => {
    const prev = process.env.CRON_INTERVAL_DAYS;
    process.env.CRON_INTERVAL_DAYS = "3";
    expect(getCronIntervalDays()).toBe(3);
    if (prev !== undefined) process.env.CRON_INTERVAL_DAYS = prev;
    else delete process.env.CRON_INTERVAL_DAYS;
  });
});
