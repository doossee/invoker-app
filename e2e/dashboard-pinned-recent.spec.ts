import { test, expect } from '@playwright/test';

/**
 * End-to-end coverage of the redesigned CollectionDashboard.
 *
 * - Recent column tracks tabs opened via the sidebar (and persists across reload).
 * - Pinned column reacts to right-click → Pin from the sidebar.
 *
 * Sample collection ships with a `playground` folder; the first .ivk
 * inside it is the fixture used here. Adjust the filename below if the
 * sample collection is restructured.
 */

const SAMPLE_FILE = '01-hello-world';

test('Recent column tracks opened tabs and persists across reload', async ({ page }) => {
  // Clear localStorage on the initial page, then reload to start fresh.
  // We deliberately don't use `addInitScript` here because this test
  // exercises localStorage persistence across `page.reload()` later on,
  // and an init script would re-clear after every navigation.
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Expand the playground folder so the file is clickable. Folders
  // with a README also open as a tab when clicked, so we'll need to
  // close that tab too before the dashboard renders.
  await page.getByText(/^playground$/).first().click();

  // Open the first .ivk request as a second tab.
  await page.locator(`button:has-text("${SAMPLE_FILE}")`).first().click();

  // Close every open tab so the dashboard shows. ⌘W (Meta on macOS,
  // Ctrl elsewhere) closes the active tab; we may have 1 or 2 open.
  const closeKey = process.platform === 'darwin' ? 'Meta+w' : 'Control+w';
  for (let i = 0; i < 4; i += 1) {
    await page.keyboard.press(closeKey);
  }

  // Dashboard should now show the request in the Recent column.
  await expect(page.getByText('Recent')).toBeVisible();
  await expect(
    page.locator(`button:has-text("${SAMPLE_FILE}")`).first(),
  ).toBeVisible();

  // Reload — recent should persist (sample collection key in localStorage).
  await page.reload();
  await expect(page.getByText('Recent')).toBeVisible();
  await expect(
    page.locator(`button:has-text("${SAMPLE_FILE}")`).first(),
  ).toBeVisible();
});

test('Right-click → Pin adds an entry to the Pinned column', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open the playground folder and right-click on the first file.
  await page.getByText(/^playground$/).first().click();
  await page
    .locator(`button:has-text("${SAMPLE_FILE}")`)
    .first()
    .click({ button: 'right' });

  // Click the new "Pin" menu item.
  await page.getByRole('menuitem', { name: /^Pin$/ }).click();

  // Open the dashboard by closing every open tab. The playground
  // folder's README tab opened earlier needs to close too.
  const closeKey = process.platform === 'darwin' ? 'Meta+w' : 'Control+w';
  for (let i = 0; i < 4; i += 1) {
    await page.keyboard.press(closeKey);
  }

  await expect(page.getByText('Pinned')).toBeVisible();
  await expect(
    page.locator(`button:has-text("${SAMPLE_FILE}")`).first(),
  ).toBeVisible();
});
