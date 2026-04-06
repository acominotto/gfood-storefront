import { expect, test } from "@playwright/test";

test("login page loads", async ({ page }) => {
  await page.goto("/fr/login");
  await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();
});
