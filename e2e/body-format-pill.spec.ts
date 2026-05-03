import { test, expect } from '@playwright/test';

/**
 * Regression: the Body tab used to render a "format pill" with five buttons
 * (json / raw / form-data / binary / graphql). Clicking any of them only
 * highlighted the chosen button — the editor surface never changed because
 * the local `bodyType` state wasn't read by anything downstream.
 *
 * The pill was removed in fix/body-format-pill-decorative. This test pins
 * that removal: clicking through to a request body, none of those tokens
 * should appear inside the editor area.
 *
 * If we ever ship real body-format switching (form-data → key/value table,
 * binary → file picker, etc.), update this test to assert the SURFACE
 * actually changes — not just the button highlight — when each type is
 * picked.
 */
test('body editor does not render the dead format pill (json/raw/form-data/binary/graphql)', async ({
  page,
}) => {
  await page.goto('/');

  // Load the sample collection
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open a POST request that has a JSON body (so the Body tab is meaningful)
  await page.getByText(/04-post-json/i).first().click();

  // Make sure we're on the Body tab — it's the default but be explicit
  // in case the editor remembers the previous tab.
  await page.getByRole('button', { name: /^Body$/ }).first().click();

  // The historical pill rendered a tight row of five tiny monospace
  // buttons with these exact labels. Each one was a real <button> with
  // text content === the type name. None should exist now.
  for (const label of ['json', 'raw', 'form-data', 'binary', 'graphql'] as const) {
    const ghost = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') });
    await expect(ghost, `format pill button "${label}" should be removed`).toHaveCount(0);
  }
});
