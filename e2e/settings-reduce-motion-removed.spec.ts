import { test, expect } from '@playwright/test';

/**
 * Regression: Settings → Appearance → "Reduce motion" was a decorative
 * `<Toggle />` (no `on`, no `onChange`, no state). Clicking it did
 * nothing — no `prefers-reduced-motion` was checked, no transitions
 * disabled. Same pattern as the previously-removed Account / AI /
 * Data & sync panes (PR #23, #34) and the Recent tile (PR #53).
 *
 * Following the precedent: drop until a real reduce-motion feature
 * exists (would need to swap CSS transitions/animations on every
 * surface — a non-trivial follow-up). Keep "Follow system theme"
 * which IS wired (PR #44).
 */
test('Settings → Appearance no longer renders the decorative "Reduce motion" row', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  await page.getByRole('button', { name: /^settings$/i }).first().click();
  await page.getByRole('button', { name: /^Appearance$/ }).click();

  // The functional row is still present:
  await expect(page.getByText(/^Follow system theme$/)).toBeVisible();

  // The decorative row is gone:
  await expect(page.getByText(/^Reduce motion$/)).toHaveCount(0);
});
