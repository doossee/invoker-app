import { test, expect } from '@playwright/test';

/**
 * Regression: the AuthTab "Basic Auth" password field used
 * `<input type="text">`, rendering the user's password in plaintext on
 * screen. Switched to `type="password"` so the browser masks it like
 * any other password input.
 *
 * Bearer-token field stays as `type="text"` since users routinely paste
 * `{{token}}` placeholders and need to see what they typed before the
 * request fires; matches the existing curl / HTTP-tools convention
 * (Postman, Insomnia, Bruno all show bearer tokens as plain text).
 */
test('AuthTab Basic Auth password field is masked, username field is not', async ({
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

  // Open any request to mount the editor.
  await page.getByText(/01-hello-world/i).first().click();

  // Switch to Auth tab.
  await page.getByRole('button', { name: /^Auth$/ }).click();

  // Pick Basic Auth — the AuthTab's <select> has option values
  // "none" / "bearer" / "basic" and is the only select with a "basic"
  // option (URL-bar method select doesn't have one).
  const authSelect = page.locator('select:has(option[value="basic"])');
  await authSelect.selectOption('basic');

  // Username field should remain plaintext.
  const username = page.locator('input[placeholder="username"]');
  await expect(username).toHaveAttribute('type', 'text');

  // Password field should be masked.
  const password = page.locator('input[placeholder="password"]');
  await expect(password).toHaveAttribute('type', 'password');
});
