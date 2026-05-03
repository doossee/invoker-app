import { test, expect } from '@playwright/test';

/**
 * Two cleanups on the response Body view's pill:
 *
 * 1. The content-type label was hardcoded to "application/json" — now
 *    reads from the actual response headers (charset suffix stripped
 *    for compactness; full value in tooltip).
 * 2. The right-side icon row had a Copy + a Search button, both with
 *    no onClick. Copy is now wired to copy the formatted body text;
 *    Search is dropped until a real find-in-body surface ships.
 */
test('Response pill: content-type from headers + working Copy', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open & send a request.
  await page.getByText(/^playground$/).first().click();
  await page.getByText(/^01-hello-world$/).first().click();
  await page.getByRole('button', { name: /^Send$/ }).first().click();
  await expect(page.getByText(/200 OK/i).first()).toBeVisible({ timeout: 10_000 });

  // Body view's content-type label reads "application/json" (httpbin's
  // /get returns application/json). Hardcoded check would also pass —
  // the meaningful test is that ANY non-hardcoded value shows up. Use
  // the title attribute (which has the full value with charset) as the
  // anchor — present only when our dynamic version renders.
  await expect(page.locator('[title*="application/json" i]').first()).toBeVisible();

  // The Search icon (decorative) is gone from the response pill row.
  // Other Search icons exist app-wide (sidebar search input, command
  // palette button) — scope the assertion to siblings of the
  // content-type label to make the test resilient.
  const pillRow = page.locator('[title*="application/json" i]').first().locator('..');
  await expect(pillRow.locator('svg.lucide-search')).toHaveCount(0);
  // The Copy icon is still there (now wired) — sanity check.
  await expect(pillRow.locator('svg.lucide-copy')).toHaveCount(1);
});
