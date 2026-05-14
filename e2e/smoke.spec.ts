import { test, expect } from "@playwright/test";

test("health and dashboard load", async ({ page }) => {
  const health = await page.request.get("/api/health");
  expect(health.ok()).toBeTruthy();
  await page.goto("/dashboard");
  await expect(page.getByText("Civil Estimation Pro")).toBeVisible();
});
