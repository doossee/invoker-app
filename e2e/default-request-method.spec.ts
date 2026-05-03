import { test, expect } from '@playwright/test';

/**
 * Wires the first General settings row through to actual behaviour:
 * Settings → General → Default request method now drives what method
 * `createInlineTab()` (⌘N / +) picks for fresh untitled requests.
 *
 * Test:
 *   1. Open Settings → General, change default method to POST
 *   2. Close settings, hit ⌘N (or +) — new tab opens with POST badge
 *   3. Re-load page (covers the localStorage persistence path)
 *   4. ⌘N again — still POST
 */
test('Default request method preference drives new untitled requests', async ({ page }) => {
  // Pre-seed localStorage so the store hydrates with POST on first paint.
  // Avoids the chained-Settings-interaction path which has its own UX
  // questions (focus, modal close timing) — that's a separate test.
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('invoker:default-request-method', 'POST');
  });
  // Verify localStorage is set before reload.
  const before = await page.evaluate(() => localStorage.getItem('invoker:default-request-method'));
  expect(before).toBe('POST');
  await page.reload();
  const after = await page.evaluate(() => localStorage.getItem('invoker:default-request-method'));
  expect(after).toBe('POST');

  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // ⌘N opens an Untitled tab.
  await page.keyboard.press('Meta+n');
  await expect(page.getByRole('button', { name: /Untitled/ }).first()).toBeVisible();

  // The URL bar's method <select> reads from the new request — should be POST.
  const methodSelect = page
    .locator('select')
    .filter({ has: page.locator('option[value="PATCH"]') })
    .first();
  await expect(methodSelect).toHaveValue('POST');
});

test('Settings → General → Default request method persists to localStorage', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  await page.getByRole('button', { name: /settings/i }).first().click();
  await page.locator('select').filter({ hasText: 'GET' }).selectOption('PUT');

  // Wait for the change to propagate to localStorage (set is sync in
  // setDefaultRequestMethod but the React render path → useEditorStore
  // → onChange happens inside an event handler).
  await expect
    .poll(async () => {
      return await page.evaluate(() =>
        localStorage.getItem('invoker:default-request-method'),
      );
    })
    .toBe('PUT');
});
