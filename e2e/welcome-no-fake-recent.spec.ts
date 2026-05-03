import { test, expect } from '@playwright/test';

/**
 * Regression: the Welcome page's "Recent" tile was hardcoded fake content
 * — `OVI Internal / 460 reqs`, `Stripe Playbook / 127 reqs`,
 * `Acme Webhooks / 14 reqs` — with the title attribute "Recent
 * collections — wiring pending". No store backed it; clicking did
 * nothing. Same decorative pattern previously removed in PR #23 (Account)
 * and PR #34 (AI / Data & sync), so following the precedent: drop the
 * tile until a real recent-collection feature exists. The bottom-row
 * Palette tile is widened to fill the freed grid columns.
 */
test('Welcome page no longer renders the decorative "Recent" tile', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');

  // Welcome page should be the landing surface (no collection loaded yet).
  await expect(page.getByText(/Point Invoker at a folder of/i)).toBeVisible();

  // Decorative content gone:
  await expect(page.getByText(/OVI Internal/)).toHaveCount(0);
  await expect(page.getByText(/Stripe Playbook/)).toHaveCount(0);
  await expect(page.getByText(/Acme Webhooks/)).toHaveCount(0);

  // The "Recent" tile header should be gone too. Use a strict regex —
  // the words "recent" / "recently" can show up in copy elsewhere.
  await expect(page.getByText(/^Recent$/i)).toHaveCount(0);

  // Surviving tiles still present:
  await expect(page.getByText(/^Open folder$/i).first()).toBeVisible();
  await expect(page.getByText(/^New request$/i).first()).toBeVisible();
  await expect(page.getByText(/^Palette$/i).first()).toBeVisible();
});
