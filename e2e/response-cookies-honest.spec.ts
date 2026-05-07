import { test, expect } from '@playwright/test';

/**
 * Regression: the response-panel "Cookies" tab was always rendered as a
 * static empty state — `<CookiesView />` was called with no props, so
 * any Set-Cookie in the response was ignored. (For browser-mode the
 * Set-Cookie header is invisible to JS anyway per the Fetch spec, but
 * Tauri's HTTP plugin DOES expose it, and the previous implementation
 * dropped it on the floor either way.)
 *
 * The fix: `CookiesView` now accepts `headers` + `isBrowserMode` props,
 * parses Set-Cookie via `lib/parse-cookies`, and surfaces an honest
 * empty state explaining that browsers don't expose Set-Cookie when
 * none is present in browser-mode.
 *
 * Unit coverage for the parser lives in
 * `src/lib/parse-cookies.test.ts`. This e2e covers the integration:
 * sending a real request via httpbin.org, opening Cookies, asserting
 * the honest browser-mode empty state.
 */
test('Response → Cookies tab renders the honest browser-mode empty state', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Expand the playground folder so its files are in the DOM.
  // (The old dashboard used to surface this file directly; the new
  // Pinned/Recent dashboard starts empty.)
  await page.getByText(/^playground$/).first().click();

  // Open the 01-hello-world request (GET to httpbin.org).
  await page.getByText(/01-hello-world/i).first().click();

  // Send the request.
  await page.getByRole('button', { name: /^Send$/ }).click();

  // Wait for the response timing pill to appear (e.g. "200 OK 851 ms").
  await expect(page.getByText(/200 OK/)).toBeVisible({ timeout: 10000 });

  // Click the Cookies tab in the response panel.
  await page.getByRole('button', { name: /^Cookies$/ }).click();

  // Browser-mode: Set-Cookie is forbidden, so the empty state should be
  // honest about why.
  await expect(page.getByText(/No cookies set/)).toBeVisible();
  await expect(
    page.getByText(/Browsers don.?t expose Set-Cookie to scripts/i),
  ).toBeVisible();
});
