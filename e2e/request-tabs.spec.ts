import { test, expect } from '@playwright/test';

/**
 * Regression: the request editor used to label the @directives tab "Params",
 * which collided with the Postman/Insomnia meaning (URL query parameters).
 * Renamed to "Meta" since the tab actually edits file metadata
 * (name / description / tag / auth-mode / …).
 *
 * If a real URL-params editor lands later, it gets its own tab and this
 * test stays — Meta keeps its current scope.
 */
test('request editor exposes a Meta tab (renamed from Params)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();
  await page.getByText(/^playground$/).first().click();
  await page.getByText(/04-post-json/i).first().click();

  await expect(page.getByRole('button', { name: /^Meta$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Params$/ })).toHaveCount(0);
});
