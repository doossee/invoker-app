import { test, expect } from '@playwright/test';

/**
 * Right-click on a request in the sidebar tree opens a small context
 * menu with Rename + Delete actions. Browser-mode in-memory only;
 * Tauri disk integration is a follow-up.
 *
 * Rename is wired through `window.prompt` (same idiom as ⌘W's confirm
 * dialog) and Delete uses `window.confirm`. Both are fast to implement,
 * accessible by default, and a dedicated modal is overkill for a single
 * input each.
 */
test('right-click → Delete removes a request from the tree', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Expand playground to surface 04-post-json.
  await page.getByText(/^playground$/).first().click();
  const target = page.getByText(/^04-post-json$/).first();
  await expect(target).toBeVisible();

  // Auto-accept the confirm dialog.
  page.once('dialog', (d) => d.accept());

  // Right-click and click Delete.
  await target.click({ button: 'right' });
  await page.getByRole('menuitem', { name: /^Delete$/ }).click();

  // The sidebar's request count drops from 12 → 11 in the collection
  // header — that's the cleanest proof the file is actually gone from
  // the store. Text-based "04-post-json" search would also hit the
  // playground/README's prose ("Run **04-post-json**...").
  await expect(page.getByText(/11 requests/)).toBeVisible({ timeout: 8_000 });
});

test('right-click → Rename updates the tree label', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  await page.getByText(/^playground$/).first().click();
  const target = page.getByText(/^03-with-query$/).first();
  await expect(target).toBeVisible();

  // Pre-handle the prompt for rename.
  page.once('dialog', (d) => d.accept('renamed-query'));

  await target.click({ button: 'right' });
  await page.getByRole('menuitem', { name: /^Rename$/ }).click();

  // The new name should appear in the sidebar tree.
  await expect(page.getByText(/^renamed-query$/)).toBeVisible({ timeout: 8_000 });
});
