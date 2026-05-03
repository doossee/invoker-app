import { test, expect } from '@playwright/test';

/**
 * Sidebar collapse: store + ⌘\ shortcut existed already, but no UI button
 * for users who don't know the shortcut. This pins both surfaces:
 *
 *  - Collapse via the new "Hide sidebar" button in the collection-header.
 *  - Restore via the existing PanelLeft icon button that appears top-left
 *    of the editor area when collapsed.
 *  - The store's `sidebarCollapsed` flag drives whether the sidebar
 *    contents render at all (sidebar tree + search disappear when
 *    collapsed, restore button appears).
 */
test('sidebar collapse and restore via UI buttons', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Sidebar's search input is the proxy for "sidebar is rendered".
  const search = page.locator('input[placeholder*="Search requests" i]').first();
  await expect(search).toBeVisible();

  // Collapse via the new button.
  await page.getByRole('button', { name: /hide sidebar/i }).first().click();
  await expect(search).toHaveCount(0);

  // The restore button (PanelLeft icon, title "Show sidebar (⌘\)") appears.
  const restore = page.getByRole('button', { name: /show sidebar/i }).first();
  await expect(restore).toBeVisible();

  // Click it — sidebar comes back.
  await restore.click();
  await expect(page.locator('input[placeholder*="Search requests" i]').first()).toBeVisible();
});
