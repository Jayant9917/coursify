import { test, expect } from "@playwright/test";

test("public landing page is reachable", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Skillnest/i);
  await expect(page.getByRole("link", { name: /courses/i }).first()).toBeVisible();
});
