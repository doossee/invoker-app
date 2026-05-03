import { test, expect } from '@playwright/test';

/**
 * Regression: when the transport returned `status: 0, error: "..."`
 * (DNS fail / CORS / invalid URL / network down / Tauri plugin
 * error) the response panel showed the ERR badge + "1" (the line-
 * number gutter for an empty body) and absolutely nothing else. The
 * actual error message was never surfaced — users had to open the
 * dev console to find out what failed.
 *
 * This is the same symptom the user reported as "Tauri Send → ERR
 * 5ms 0B body shows 1" in BUGS.md. Not Tauri-specific — happens any
 * time the transport bails out before getting an HTTP response.
 *
 * Fix: render `response.error` in a red error tile instead of the
 * empty body view.
 */
test('Send to an invalid URL surfaces the transport error in the body view', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // ⌘N spawns an Untitled tab with a "https://" placeholder URL — bare
  // protocol with no host. fetch() rejects → status=0, error set.
  await page.keyboard.press('Meta+n');
  await page.getByRole('button', { name: /^Send$/ }).first().click();

  // Wait for the request to return (very fast — fetch fails synchronously).
  await expect(page.getByText(/^ERR$/i)).toBeVisible({ timeout: 5_000 });

  // The new error tile shows the heading + the underlying message.
  await expect(page.getByText(/^Request failed$/)).toBeVisible();
  // Some non-empty error text appears below — exact wording depends on
  // the browser's fetch implementation, so just assert SOMETHING is there.
  await expect(
    page.getByText(/transport returned no HTTP response/i),
  ).toBeVisible();
});
