import { test, expect } from '@playwright/test';

/**
 * Regression: the "+" button at the end of the editor tab row had a
 * `title="New tab"` and a Plus icon but no `onClick` — clicking it
 * did nothing. Decorative button.
 *
 * The fix: wire it to `createInlineTab()` (same store action that
 * powers the welcome page's "+ New request" and the dashboard's
 * "Create" button).
 */
test('EditorTabs "+" button creates a new inline request tab', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open one request to mount the editor + tab row.
  await page.getByText(/01-hello-world/i).first().click();

  // Initial state: exactly one tab.
  await expect(page.getByRole('button', { name: /^X$/ }).first()).toHaveCount(0); // sanity
  const initialTabs = page.locator('[role="button"]:has(svg.lucide-x)');
  // Prefer asserting on the visible "01-hello-world" being the current tab.
  await expect(page.getByText(/^01-hello-world$/).first()).toBeVisible();

  // Click the "+" new-tab button.
  await page.getByRole('button', { name: /^New tab$/ }).click();

  // After clicking +: a new tab labelled "Untitled" opens (the store
  // sets `name: 'Untitled'` on inline tabs; uniqueness is encoded in
  // the path's timestamp, not the visible label).
  await expect(page.getByText(/^Untitled$/).first()).toBeVisible({
    timeout: 5000,
  });
});
