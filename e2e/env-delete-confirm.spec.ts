import { test, expect } from '@playwright/test';

/**
 * Regression: clicking the trash icon next to an environment in
 * Settings → Environments deleted it instantly with no confirmation.
 * Risky for envs holding multiple variables — same risk profile as
 * the dirty ⌘W close (PR #25) and the sidebar Delete (PR #51), both
 * of which already prompt.
 *
 * The fix: `handleDelete` calls `window.confirm` first; cancel keeps
 * the env intact.
 */
test('Env delete asks for confirmation; cancel keeps the env', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open the env switcher → Manage environments.
  await page.locator('button:has-text("dev")').first().click();
  await page.getByRole('button', { name: /Manage environments/ }).click();
  await expect(
    page.getByRole('heading', { name: /^Environments$/ }),
  ).toBeVisible();

  // Both default envs (dev, stage) should be visible.
  await expect(page.getByText(/^dev$/).first()).toBeVisible();
  await expect(page.getByText(/^stage$/).first()).toBeVisible();

  // Cancel the next confirm dialog and click Delete on dev.
  page.once('dialog', (d) => {
    expect(d.message()).toMatch(/delete environment.*dev/i);
    void d.dismiss();
  });
  await page.getByRole('button', { name: /Delete environment/ }).first().click();

  // dev still present (cancel honored).
  await expect(page.getByText(/^dev$/).first()).toBeVisible();
});

test('Env delete confirmation accept actually deletes', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  await page.locator('button:has-text("dev")').first().click();
  await page.getByRole('button', { name: /Manage environments/ }).click();
  await expect(
    page.getByRole('heading', { name: /^Environments$/ }),
  ).toBeVisible();

  // Accept this time. There are 2 default envs (dev, stage) — we
  // delete the second (stage) so the user-visible name "stage" is
  // gone afterwards. Keep dev so we don't have to handle the "no
  // active env" UI state.
  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: /Delete environment/ }).nth(1).click();

  await expect(page.getByText(/^stage$/)).toHaveCount(0);
  await expect(page.getByText(/^dev$/).first()).toBeVisible();
});
