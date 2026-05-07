import { test, expect } from '@playwright/test';

/**
 * Regression: clicking "Format JSON" (or pressing ⌘⇧F) on a body
 * containing non-JSON content was a complete no-op — no error, no
 * toast, no visual feedback. Users tested the button on
 * XML / form-data / plain text bodies and assumed it was broken.
 *
 * The fix: the button label briefly flips to "Invalid JSON" (red) on
 * a parse failure and "Nothing to format" (amber) on an empty body,
 * then auto-resets to "Format JSON" after 1.5s.
 */
test('Format JSON button shows feedback on invalid input', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Expand the playground folder so its files are in the DOM.
  await page.getByText(/^playground$/).first().click();

  // Open the JSON-bodied request.
  await page.getByText(/04-post-json/i).first().click();

  // Body tab is the default. The button reads "Format JSON" initially.
  const formatBtn = page.getByRole('button', { name: /^Format JSON$/ });
  await expect(formatBtn).toBeVisible();

  // Type something that's NOT valid JSON into the body editor (the
  // CodeMirror editor responds to `keyboard.type` after a click).
  // First select all + delete to wipe the JSON body.
  const editor = page.locator('.cm-editor').first();
  await editor.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  await page.keyboard.type('this is not json at all');

  // Click Format JSON — the label should transition to "Invalid JSON".
  await page.getByRole('button', { name: /^Format JSON$/ }).click();
  await expect(page.getByRole('button', { name: /^Invalid JSON$/ })).toBeVisible();

  // After 1.5s timeout it auto-resets back to "Format JSON".
  await expect(page.getByRole('button', { name: /^Format JSON$/ })).toBeVisible({
    timeout: 3000,
  });
});

test('Format JSON button shows "Nothing to format" on empty body', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Expand the playground folder so its files are in the DOM.
  await page.getByText(/^playground$/).first().click();

  // Open a GET request (no body by default).
  await page.getByText(/01-hello-world/i).first().click();

  await page.getByRole('button', { name: /^Format JSON$/ }).click();
  await expect(page.getByRole('button', { name: /^Nothing to format$/ })).toBeVisible();
});
