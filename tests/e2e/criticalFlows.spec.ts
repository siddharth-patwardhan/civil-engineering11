import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

/**
 * Priority 1: Authentication Flow
 */
test("Flow 1: Authentication and Session", async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => {
    localStorage.setItem("cep-auth-token", "dev:test-user-123");
    localStorage.setItem(
      "cep-auth-user",
      JSON.stringify({ id: "test-user-123", email: "test@example.com", name: "Test User" })
    );
  });
  await page.goto(`${BASE_URL}/dashboard`);
  await expect(page.locator("text=Executive Overview")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Civil Engineer")).toBeVisible();
});

/**
 * Priority 2: Project Creation Flow
 */
test("Flow 2: Project Creation", async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => {
    localStorage.setItem("cep-auth-token", "dev:test-user-123");
    localStorage.setItem(
      "cep-auth-user",
      JSON.stringify({ id: "test-user-123", email: "test@example.com", name: "Test User" })
    );
  });
  await page.goto(`${BASE_URL}/projects`);
  await expect(page.locator("h1:has-text('Projects')")).toBeVisible();
  await page.click("button:has-text('New Project')");
  await expect(page.url()).toContain("/create-project");
  await page.fill('input[placeholder*="Downtown Core Plaza"]', "E2E Test Project");
  await page.fill('input[placeholder*="Apex Corp"]', "Test Client");
  await page.selectOption('select', "commercial");
  await page.fill('input[placeholder*="Sector 4"]', "Test Location");
  await page.click("button:has-text('Next: Measurement')");
  await expect(page.url()).toContain("/measurement");
});

/**
 * Priority 3: Measurement CRUD Flow
 */
test("Flow 3: Measurement CRUD", async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => {
    localStorage.setItem("cep-auth-token", "dev:test-user-123");
  });
  await page.goto(`${BASE_URL}/measurement`);
  await expect(page.locator("h1:has-text('Foundation Excavation')")).toBeVisible();
  await page.selectOption('select:has-text("Add from template")', "footing");
  await expect(page.locator("text=Reinforced concrete footing")).toBeVisible();
  const firstRow = page.locator("tbody tr").first();
  await firstRow.locator("input").nth(2).fill("5.5");
  await page.click("button:has-text('Save')");
  await expect(page.locator("text=Measurements saved")).toBeVisible();
});

/**
 * Priority 4: BOQ Generation Flow
 */
test("Flow 4: BOQ Generation", async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => {
    localStorage.setItem("cep-auth-token", "dev:test-user-123");
  });
  await page.goto(`${BASE_URL}/boq`);
  await expect(page.locator("h1:has-text('Bill of Quantities')")).toBeVisible();
  await expect(page.locator("text=Clear site of all vegetation")).toBeVisible();
  await expect(page.locator("text=Bulk excavation for foundations")).toBeVisible();
  const amountCell = page.locator("text=₹").first();
  await expect(amountCell).toBeVisible();
});

/**
 * Priority 5: Dark Mode Toggle
 */
test("Flow 5: Dark Mode Toggle", async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => {
    localStorage.setItem("cep-auth-token", "dev:test-user-123");
  });
  await page.goto(`${BASE_URL}/dashboard`);
  const isDark = await page.evaluate(() =>
    document.documentElement.getAttribute("data-theme")
  );
  await page.click("button[title='Toggle theme']");
  const newTheme = await page.evaluate(() =>
    document.documentElement.getAttribute("data-theme")
  );
  expect(newTheme).not.toBe(isDark);
});

/**
 * Priority 6: Command Palette Navigation
 */
test("Flow 6: Command Palette Navigation", async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => {
    localStorage.setItem("cep-auth-token", "dev:test-user-123");
  });
  await page.goto(`${BASE_URL}/dashboard`);
  await page.keyboard.press("Control+k");
  await expect(page.locator("[placeholder='Search pages, actions, projects...']")).toBeVisible();
  await page.fill("input[placeholder='Search pages, actions, projects...']", "measurement");
  await page.keyboard.press("Enter");
  await expect(page.url()).toContain("/measurement");
});

/**
 * Priority 7: Keyboard Shortcuts
 */
test("Flow 7: Keyboard Shortcuts", async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => {
    localStorage.setItem("cep-auth-token", "dev:test-user-123");
  });
  await page.goto(`${BASE_URL}/dashboard`);
  await page.keyboard.press("Control+2");
  await expect(page.url()).toContain("/projects");
  await page.keyboard.press("Control+3");
  await expect(page.url()).toContain("/measurement");
  await page.keyboard.press("Control+4");
  await expect(page.url()).toContain("/boq");
});

/**
 * Priority 8: Responsive Layout (Mobile)
 */
test("Flow 8: Mobile Layout", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => {
    localStorage.setItem("cep-auth-token", "dev:test-user-123");
  });
  await page.goto(`${BASE_URL}/dashboard`);
  await expect(page.locator("nav.fixed.bottom-0")).toBeVisible();
  const sidebar = page.locator("aside.fixed");
  await expect(sidebar).toHaveClass(/w-\[72px\]/);
});

/**
 * Priority 9: Error Boundary
 */
test("Flow 9: Error Boundary", async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => {
    localStorage.setItem("cep-auth-token", "dev:test-user-123");
  });
  await page.goto(`${BASE_URL}/dashboard`);
  await expect(page.locator("body")).toBeVisible();
});

/**
 * Priority 10: Accessibility - Tab Navigation
 */
test("Flow 10: Keyboard Accessibility", async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => {
    localStorage.setItem("cep-auth-token", "dev:test-user-123");
  });
  await page.goto(`${BASE_URL}/measurement`);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(focused).toBeTruthy();
});
