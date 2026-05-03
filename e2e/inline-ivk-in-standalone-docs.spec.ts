import { test, expect } from '@playwright/test';

/**
 * Regression: ` ```ivk ` fenced codeblocks rendered as runnable cards
 * inside folder READMEs (handled by FolderTabBody) but as plain monospace
 * `pre` text inside standalone .md tabs (DocTabBody → MarkdownPreview /
 * MarkdownLivePreview). Now both surfaces share the same renderer
 * (`ivkCodeBlockRenderer` from `InlineIvkBlock`) by default, so the same
 * runnable card shows up in both places.
 *
 * The Welcome doc (`Welcome.md` in the sample collection) contains an
 * ivk codeblock — open it in Live mode and assert the runnable card
 * (with a Run button) is mounted.
 */
test('standalone .md docs render ivk codeblocks as runnable cards in Live mode', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open the standalone Tutorial doc from the sidebar (the root README is
  // a folder doc, which already had ivk rendering before this fix —
  // tutorial.md is the loose-doc path that was broken).
  await page.getByText(/^tutorial$/).first().click();

  // The runnable card has a Run button. Before this fix, the ivk fence in
  // tutorial.md rendered as plain text and no Run button existed inside
  // the doc body. Default mode (Preview) is enough to demonstrate.
  await expect(page.getByRole('button', { name: /^Run$/ }).first()).toBeVisible();
});
