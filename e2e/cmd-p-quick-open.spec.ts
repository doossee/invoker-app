import { test, expect } from '@playwright/test';

/**
 * ⌘P was listed in Settings → Keyboard as "Jump to request" but no handler
 * was wired — pressing it did nothing. ⌘K already opens the command
 * palette, which IS the quick-open surface; bind ⌘P as an alias so the
 * settings panel doesn't lie. Matches VSCode/Cursor convention.
 *
 * "Run test suite" (⌘⇧T) was also listed but unwired and there's no
 * collection-wide test runner yet — dropped from the list.
 */
test('⌘P opens the command palette (alias for ⌘K)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Palette is closed.
  await expect(page.locator('input[placeholder*="actions, docs" i]')).toHaveCount(0);

  await page.keyboard.press('Meta+p');
  // Palette is now open — its search input is unique by placeholder.
  await expect(page.locator('input[placeholder*="actions, docs" i]')).toBeVisible();
});

test('Settings → Keyboard no longer lists the unimplemented Run test suite shortcut', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  await page.getByRole('button', { name: /settings/i }).first().click();
  await page.getByRole('button', { name: /^Keyboard$/ }).first().click();

  await expect(page.getByText(/Run test suite/i)).toHaveCount(0);
});
