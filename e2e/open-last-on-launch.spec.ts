import { test, expect } from '@playwright/test';

/**
 * Settings → General → "Open last collection on launch" now actually
 * works. Browser-demo path: clicking "Try sample" persists the literal
 * string `"(sample)"` to `localStorage.invoker:last-collection-path`.
 * On next page load the App auto-loads the sample collection without
 * needing the user to click "Try sample" again.
 *
 * Tauri path: when openCollection() resolves with a folder path, we
 * persist it; on next launch we re-`loadCollection()` it. That path
 * is exercised by manual `tauri:dev` testing — there's no headless
 * Tauri runner. This e2e covers the browser branch.
 */
test('Try sample is remembered → next launch auto-loads it', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // First load: empty state. Anchor on the sidebar collection-header
  // copy that fires when files+docs are both empty (Sidebar.tsx
  // CollectionHeader summary path: "Open a folder to start").
  await expect(page.getByText(/Open a folder to start/i).first()).toBeVisible();

  // Click Try sample.
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // localStorage key is set.
  const stored = await page.evaluate(() =>
    localStorage.getItem('invoker:last-collection-path'),
  );
  expect(stored).toBe('(sample)');

  // Reload — collection should auto-load (no "Try sample" click).
  await page.reload();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible({
    timeout: 5_000,
  });
  // The empty-state sidebar copy should be gone (sample is loaded now).
  await expect(page.getByText(/Open a folder to start/i)).toHaveCount(0);
});

test('Toggling "Open last collection on launch" off prevents auto-load', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('invoker:last-collection-path', '(sample)');
    localStorage.setItem('invoker:open-last-on-launch', '0');
  });
  await page.reload();

  // Should NOT auto-load — we opted out via the toggle.
  await expect(page.getByText(/Open a folder to start/i).first()).toBeVisible({
    timeout: 5_000,
  });
});
