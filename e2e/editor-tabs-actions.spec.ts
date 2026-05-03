import { test, expect } from '@playwright/test';

/**
 * Regression: the editor's right-side actions row had a History clock
 * icon (`<IconBtn tip="History">`) with no onClick. It was decorative —
 * clicks did nothing, no panel opened. Drop it until a real history
 * surface ships (we'd need to design where it appears, what fields it
 * shows, retention policy, …).
 *
 * The other actions in this row keep working: split-toggle, command
 * palette button, +-tab.
 */
test('editor tabs row no longer renders the dead History button', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open a request — the editor-tabs row only renders Actions for `kind: ivk`
  // tabs.
  await page.getByText(/01-hello-world/i).first().click();

  // Active actions still present (multiple command-palette buttons exist —
  // sidebar + editor-tabs row — so just assert at least one is visible).
  await expect(page.getByRole('button', { name: /command palette/i }).first()).toBeVisible();

  // History button gone:
  await expect(page.getByRole('button', { name: /^History$/i })).toHaveCount(0);
});
