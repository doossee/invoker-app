import { test, expect } from '@playwright/test';

/**
 * Regression: inline `ivk` blocks embedded in folder READMEs render a
 * Run button, but the button only flipped a dead state flag — it never
 * fired the request, and the Response tab showed a static
 * "Press Run to see the response." placeholder forever.
 *
 * Caught while dogfooding playground/README.md, which has a runnable
 *   GET https://httpbin.org/get
 * block. Network log confirmed: clicking Run made zero HTTP requests.
 *
 * The fix wires the existing `useRequest` hook into the inline block:
 * Run → run() → cache result → Response tab renders status + body.
 *
 * This e2e drives the user-visible flow:
 *   1. Try sample
 *   2. Open the playground folder (its README has the runnable block)
 *   3. Click Run
 *   4. Switch to the Response tab
 *   5. See real status (200 OK) and a non-empty body containing httpbin's
 *      reflected origin / args fields.
 */
test('inline-ivk Run button actually executes the request and shows the response', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Click the playground folder name to open its README tab.
  await page.getByText(/^playground$/).first().click();
  // The folder README tab opens — confirm by the "Try this" heading.
  await expect(page.getByRole('heading', { name: /Try this/i })).toBeVisible();

  // The inline block has a Run button. Click it.
  const run = page.getByRole('button', { name: /^Run$/ }).first();
  await run.click();

  // Switch to Response tab on the inline block.
  await page.getByRole('button', { name: /^response$/i }).first().click();

  // Real response should have replaced the placeholder. httpbin echoes
  // back fields like "origin" and "args" — we don't assert exact content,
  // just that the placeholder is gone and SOME response data is present.
  await expect(
    page.getByText(/Press Run to see the response\./),
  ).toHaveCount(0, { timeout: 10_000 });

  // A 200 status badge or body content with httpbin fields should appear.
  // Match either: a "200" status anywhere in the inline block, or one of
  // httpbin's well-known echo fields ("url" / "origin" / "args").
  const respIndicator = page.getByText(
    /\b(200|"url":|"origin":|"args":)/,
  ).first();
  await expect(respIndicator).toBeVisible({ timeout: 10_000 });
});
