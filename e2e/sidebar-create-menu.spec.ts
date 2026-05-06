import { test, expect } from '@playwright/test';

/**
 * Right-click on a folder → New request / New doc / New folder.
 * User-reported: previously the only way to create a request was
 * the inline "+ New Request" button (in-memory only). No way to
 * create persistent .ivk files, .md docs, or new folders.
 */
test('Right-click folder → New request creates the file and opens it', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Expand the playground folder.
  await page.getByText(/^playground$/).first().click();

  // Right-click on the playground folder row.
  page.once('dialog', (dialog) => {
    expect(dialog.message()).toMatch(/new request/i);
    void dialog.accept('my-test-request');
  });
  await page
    .getByText(/^playground$/)
    .first()
    .click({ button: 'right' });
  await page.getByRole('menuitem', { name: /^New request$/ }).click();

  // The new file should be in the tree as a clickable button.
  await expect(page.getByText(/^my-test-request$/).first()).toBeVisible();

  // It should also be opened as the active tab — the editor tab row
  // shows it.
  await expect(
    page
      .locator('button:has-text("my-test-request")')
      .first(),
  ).toBeVisible();
});

test('Right-click folder → New folder creates folder + auto-generated README', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Right-click empty area → New folder.
  page.once('dialog', (dialog) => {
    expect(dialog.message()).toMatch(/new folder/i);
    void dialog.accept('my-new-folder');
  });
  // Empty area below the tree rows.
  await page
    .locator('button:has-text("playground")')
    .first()
    .click({ button: 'right' });
  await page.getByRole('menuitem', { name: /^New folder$/ }).click();

  // The new folder should appear in the tree.
  await expect(page.getByText(/^my-new-folder$/).first()).toBeVisible();
});

test('Folder context menu shows all three Create items + no Rename/Delete', async ({ page }) => {
  // Sanity: folders get the Create-only menu (no Rename / Delete) —
  // those still belong to .ivk files only.
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  await page
    .locator('button:has-text("playground")')
    .first()
    .click({ button: 'right' });

  await expect(page.getByRole('menuitem', { name: /^New request$/ })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /^New doc$/ })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /^New folder$/ })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /^Rename$/ })).toHaveCount(0);
  await expect(page.getByRole('menuitem', { name: /^Delete$/ })).toHaveCount(0);
});
