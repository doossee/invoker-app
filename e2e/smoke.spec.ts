import { test, expect } from '@playwright/test';

/**
 * Smoke E2E — proves the dev server boots, the React app mounts, and the
 * empty-state Welcome page renders. If this breaks, every other E2E
 * is dead in the water.
 *
 * Add behavior-driven tests as separate spec files (e.g. `open-collection.spec.ts`,
 * `send-request.spec.ts`). Group by user flow, not by component.
 */
test.describe('smoke', () => {
  test('app boots and renders the Welcome page in browser-demo mode', async ({ page }) => {
    await page.goto('/');

    // The Welcome page's hero block contains the project tagline and the
    // two primary actions ("Open folder" and "Try sample" / "New request").
    // We use accessible-name selectors so the test doesn't fight CSS changes.
    await expect(page).toHaveTitle(/invoker/i);

    // Sidebar empty state is one of the most reliable anchors in the welcome view.
    // Either "No collection" header (collection-store empty) or a sample loaded.
    const sidebarOrWelcome = page.getByText(/No collection|Sample collection/i).first();
    await expect(sidebarOrWelcome).toBeVisible({ timeout: 15_000 });
  });

  test('clicking "Try sample" loads the bundled sample collection', async ({ page }) => {
    await page.goto('/');

    // Find the Try sample button — there are two locations historically
    // (sidebar empty-state + welcome page card). Click the first visible.
    const trySample = page.getByRole('button', { name: /try sample/i }).first();
    await trySample.click();

    // After loading, the sidebar header changes to "Sample collection"
    // with a request count (sample has ~12 requests).
    await expect(page.getByText(/Sample collection/i).first()).toBeVisible();
    // Expand the playground folder so its files are in the DOM.
    await page.getByText(/^playground$/).first().click();
    // At least one .ivk file from the sample appears in the tree.
    // The sample includes "playground/01-hello-world.ivk".
    await expect(page.getByText(/hello.world|hello world/i).first()).toBeVisible();
  });
});
