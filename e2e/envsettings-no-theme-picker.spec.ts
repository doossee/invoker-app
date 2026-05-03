import { test, expect } from '@playwright/test';

/**
 * Regression: the "Manage environments..." modal (EnvSettings) used to
 * include its own Theme section that duplicated Settings → Appearance.
 * Two sources of truth, slightly different visual treatments, and the
 * theme picker has nothing to do with environments. Drop it — the
 * Settings → Appearance pane (PR #30) is canonical.
 */
test('EnvSettings modal no longer includes the duplicate Theme picker', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Click the env switcher in the sidebar footer (newly-labelled button).
  await page.getByRole('button', { name: /Switch environment/i }).first().click();
  await page.getByRole('button', { name: /Manage environments/i }).click();

  await expect(page.getByText(/^Environments$/).first()).toBeVisible();

  // The Theme section header should NOT be inside this modal anymore.
  await expect(page.getByText(/^Theme$/)).toHaveCount(0);
});
