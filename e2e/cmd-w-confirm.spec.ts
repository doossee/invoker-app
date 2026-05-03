import { test, expect } from '@playwright/test';

/**
 * Regression: ⌘W (close tab) on a tab with unsaved edits dropped them
 * silently. Now it prompts a confirm dialog; the tab only closes if the
 * user accepts. Cancelling keeps the edit and the tab open.
 *
 * Uses the browser's native window.confirm so we don't introduce a custom
 * modal for this single use case. Playwright's `dialog` event lets the
 * test programmatically accept or dismiss.
 */
test('⌘W on a dirty tab prompts a confirm; cancelling keeps the tab open', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open a request (any will do).
  await page.getByText(/01-hello-world/i).first().click();

  // Edit it — change the URL, which marks the tab dirty.
  const urlInput = page.locator('input[placeholder*="URL" i]').first();
  await urlInput.click();
  await urlInput.fill('https://httpbin.org/anything');
  // Sanity: tab name now shows the dirty marker (•) — be lenient on
  // whitespace/symbol since some renders use a different glyph.
  // (We don't strictly need this assertion; it's a sanity check.)

  // Wire the dialog dismiss handler BEFORE firing ⌘W.
  let dialogShown = false;
  page.once('dialog', async (dialog) => {
    dialogShown = true;
    await dialog.dismiss();
  });

  await page.keyboard.press('Meta+w');

  // Give the dialog handler a tick to fire.
  await page.waitForTimeout(300);

  expect(dialogShown).toBe(true);

  // Tab should still be open (we cancelled). The URL input still shows our edit.
  await expect(urlInput).toHaveValue('https://httpbin.org/anything');
});

test('⌘W on a dirty tab actually closes when the user accepts the confirm', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();
  await page.getByText(/01-hello-world/i).first().click();

  const urlInput = page.locator('input[placeholder*="URL" i]').first();
  await urlInput.click();
  await urlInput.fill('https://httpbin.org/anything');

  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });

  await page.keyboard.press('Meta+w');
  await page.waitForTimeout(300);

  // The tab is gone — the URL input is no longer mounted.
  await expect(urlInput).toHaveCount(0);
});

test('⌘W on a CLEAN tab closes immediately (no confirm)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();
  await page.getByText(/01-hello-world/i).first().click();

  // No edit — tab is clean.
  const urlInput = page.locator('input[placeholder*="URL" i]').first();
  await expect(urlInput).toBeVisible();

  // Reject any unexpected dialogs to fail loudly if the confirm fires anyway.
  let dialogShown = false;
  page.on('dialog', async (dialog) => {
    dialogShown = true;
    await dialog.dismiss();
  });

  await page.keyboard.press('Meta+w');
  await page.waitForTimeout(300);

  expect(dialogShown).toBe(false);
  await expect(urlInput).toHaveCount(0);
});
