import { test, expect } from '@playwright/test';

/**
 * "Follow system theme" toggle in Settings → Appearance auto-picks
 * Invoker Light or Invoker Dark from `prefers-color-scheme` and
 * re-evaluates on `change`. Picking a specific theme via the swatch
 * cards turns it off (standard pattern: VSCode, GitHub, Linear).
 */
test('Follow system theme: light preference renders Invoker Light', async ({
  browser,
}) => {
  const ctx = await browser.newContext({ colorScheme: 'light' });
  const page = await ctx.newPage();
  try {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: /try sample/i }).first().click();
    await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

    await page.getByRole('button', { name: /settings/i }).first().click();
    await page.getByRole('button', { name: /^Appearance$/ }).first().click();

    // Toggle "Follow system theme" on. The toggle is the only one in
    // the Appearance pane besides "Reduce motion" (which is decorative
    // and below it in the DOM order — pick the first one).
    await page.getByText(/^Follow system theme$/).locator('..').locator('..').locator('button').first().click();

    // Page should now be using the light variant.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  } finally {
    await ctx.close();
  }
});

test('Follow system theme: dark preference renders Invoker Dark', async ({
  browser,
}) => {
  const ctx = await browser.newContext({ colorScheme: 'dark' });
  const page = await ctx.newPage();
  try {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('invoker:theme-follow-system', '1');
    });
    await page.reload();
    await page.getByRole('button', { name: /try sample/i }).first().click();
    await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  } finally {
    await ctx.close();
  }
});

test('Picking an explicit theme turns Follow-system off', async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: 'light' });
  const page = await ctx.newPage();
  try {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('invoker:theme-follow-system', '1');
    });
    await page.reload();
    await page.getByRole('button', { name: /try sample/i }).first().click();
    await expect(page.getByText(/Sample collection/i).first()).toBeVisible();
    // Sanity: starts in light because the OS prefers light + follow is on.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    // Pick Catppuccin Mocha (a dark variant) explicitly.
    await page.getByRole('button', { name: /settings/i }).first().click();
    await page.getByRole('button', { name: /^Appearance$/ }).first().click();
    await page.locator('[data-theme-id="catppuccin-mocha"]').click();

    // Theme flips to dark, AND the follow-system flag is now off in storage.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const stored = await page.evaluate(() =>
      localStorage.getItem('invoker:theme-follow-system'),
    );
    expect(stored).toBe('0');
  } finally {
    await ctx.close();
  }
});
