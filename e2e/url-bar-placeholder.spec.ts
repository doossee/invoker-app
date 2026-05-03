import { test, expect } from '@playwright/test';

/**
 * Regression: the URL field's placeholder was "Enter URL or paste cURL..."
 * which strongly implies pasting a curl command will be parsed into
 * method/headers/body. No parser exists — pasting `curl ...` left the
 * raw string sitting in the URL field.
 *
 * Surgical fix: drop the misleading text from the placeholder until a
 * real cURL importer ships. The Missing-features section in BUGS.md
 * tracks the actual feature ask.
 */
test('URL bar placeholder does not advertise cURL paste support (until parser ships)', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open any request to ensure the URL bar renders.
  await page.getByText(/01-hello-world/i).first().click();

  const urlInput = page.locator('input[placeholder*="URL" i], input[placeholder*="http" i]').first();
  await expect(urlInput).toBeVisible();
  const placeholder = await urlInput.getAttribute('placeholder');
  expect(placeholder?.toLowerCase() ?? '').not.toContain('curl');
});
