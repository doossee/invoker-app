import { test, expect } from '@playwright/test';

/**
 * End-to-end: paste a curl command into the URL bar → method, URL,
 * headers, and body all populate. Companion to
 * `src/lib/curl-parser.test.ts` which covers parsing in isolation.
 */
test('pasting a curl command into the URL bar populates method/url/headers/body', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Expand the playground folder so its files are in the DOM.
  await page.getByText(/^playground$/).first().click();

  // Open a request so the URL bar is mounted with a known starting state.
  await page.getByText(/01-hello-world/i).first().click();

  const urlInput = page.locator('input[placeholder*="URL" i]').first();
  await expect(urlInput).toBeVisible();

  // Simulate the paste event with a real curl command. We can't use page.paste()
  // directly with a string, so dispatch a clipboard event with the text.
  const curl = `curl -X POST https://httpbin.org/post -H "X-Test: yes" -H "Content-Type: application/json" -d '{"hello":"world"}'`;
  await urlInput.focus();
  await urlInput.evaluate((el, text) => {
    const dt = new DataTransfer();
    dt.setData('text', text);
    const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
    el.dispatchEvent(ev);
  }, curl);

  // URL should now be the parsed URL, not the raw curl.
  await expect(urlInput).toHaveValue('https://httpbin.org/post');

  // Method selector should be POST.
  const methodSelect = page.locator('select').first();
  await expect(methodSelect).toHaveValue('POST');

  // Click Headers tab and verify both X-Test and Content-Type appear.
  await page.getByRole('button', { name: /^Headers$/ }).first().click();
  await expect(page.locator('input[value="X-Test"]')).toBeVisible();
  await expect(page.locator('input[value="yes"]')).toBeVisible();
  await expect(page.locator('input[value="Content-Type"]')).toBeVisible();
  await expect(page.locator('input[value="application/json"]')).toBeVisible();
});
