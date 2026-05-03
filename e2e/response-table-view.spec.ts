import { test, expect } from '@playwright/test';

/**
 * Regression: Response → Table view used to print the entire JSON.stringify
 * of object/array cells (e.g. httpbin's `headers` field), making rows
 * hundreds of chars wide. The footer also said "1 rows" regardless of count.
 *
 * Fix renders object cells as a compact chip (`{N keys}` / `[N items]`)
 * with the full JSON on hover, and pluralises the row counter correctly.
 */
test('Table view collapses object cells and pluralises row counter', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open a request and Send so we have a JSON response.
  await page.getByText(/^playground$/).first().click();
  await page.getByText(/^01-hello-world$/).first().click();
  await page.getByRole('button', { name: /^Send$/ }).first().click();
  // Wait for the response status badge to appear (proxy for "request done").
  await expect(page.getByText(/200 OK/i).first()).toBeVisible({ timeout: 10_000 });

  // Switch to the Table view of the response body.
  await page.getByRole('button', { name: /^Table$/ }).click();

  // The httpbin "/get" response has a `headers` object — the chip should
  // appear instead of the raw JSON string.
  await expect(page.getByText(/^\{\d+ keys?\}$/).first()).toBeVisible();

  // Pluralisation: there's exactly one row in this response.
  await expect(page.getByText(/^1 row$/)).toBeVisible();
});
