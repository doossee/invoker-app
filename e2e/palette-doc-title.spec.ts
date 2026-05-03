import { test, expect } from '@playwright/test';

/**
 * Regression: the command palette listed docs by their path-derived
 * basename (`README.md` → "README") instead of the user-facing title
 * (`title: "Welcome"`). Searching for "welcome" returned no results
 * even though the Welcome doc was right there in the sidebar.
 *
 * Fix: when populating doc items, prefer `d.title` over the basename.
 */
test('command palette finds docs by title (Welcome doc → search "welcome")', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open the palette via ⌘K.
  await page.keyboard.press('Meta+k');

  const search = page.locator('input[placeholder*="actions, docs" i]');
  await expect(search).toBeVisible();

  // Search by title — "welcome" must hit the README.md doc.
  await search.fill('welcome');
  await expect(page.getByText(/^Welcome$/).first()).toBeVisible();
});
