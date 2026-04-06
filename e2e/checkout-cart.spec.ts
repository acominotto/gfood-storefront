import { expect, test } from "@playwright/test";

/**
 * Automates manual matrix #1 (incognito-style): add → drawer → checkout.
 * Requires a running app with WooCommerce Store API (`E2E_BASE_URL`) and at least one in-stock product on the home catalog.
 */
test("catalog add → cart drawer → checkout shows line items", async ({ page }, testInfo) => {
  testInfo.skip(!process.env.E2E_BASE_URL, "Set E2E_BASE_URL (e.g. http://127.0.0.1:3000) to run e2e");

  await page.goto("/en", { waitUntil: "domcontentloaded" });

  const addBtn = page.getByRole("button", { name: "Add" }).first();
  await expect(addBtn).toBeVisible({ timeout: 30_000 });
  await addBtn.click();

  const cartBtn = page.getByRole("button", { name: /Cart, 1 item/i });
  await expect(cartBtn).toBeVisible({ timeout: 30_000 });
  await cartBtn.click();

  await page.getByRole("link", { name: "Go to checkout" }).click();

  await expect(page.getByText("Your cart is empty")).not.toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Checkout").first()).toBeVisible();
});
