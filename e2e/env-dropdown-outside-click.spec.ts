import { test, expect } from '@playwright/test';

/**
 * Regression: the env-switcher dropdown in the sidebar footer had a
 * `menuOpen` toggle but no click-outside / Escape listener. Clicking
 * elsewhere on the page left it open. Same pattern the
 * CollectionHeader dropdown at the top of the sidebar already
 * implemented; this brings EnvFooter to parity.
 */
test('Env dropdown closes on outside click', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open env switcher.
  await page.locator('button:has-text("dev")').first().click();
  await expect(
    page.getByRole('button', { name: /Manage environments/ }),
  ).toBeVisible();

  // Click somewhere outside the dropdown — the editor area.
  await page.locator('body').click({ position: { x: 600, y: 400 } });

  // Dropdown should be gone.
  await expect(
    page.getByRole('button', { name: /Manage environments/ }),
  ).not.toBeVisible();
});

test('Env dropdown closes on Escape', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  await page.locator('button:has-text("dev")').first().click();
  await expect(
    page.getByRole('button', { name: /Manage environments/ }),
  ).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: /Manage environments/ }),
  ).not.toBeVisible();
});
