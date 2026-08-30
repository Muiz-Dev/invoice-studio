import { test, expect } from '@playwright/test';

test.describe('Invoice Generator E2E Flow', () => {
  test('homepage navigation and studio template selection', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Invoice/i);

    // Verify main landing header
    await expect(page.getByText('Professional Invoice Studio')).toBeVisible();

    // Take screenshot of home landing
    await page.screenshot({ path: 'test-results/screenshots/01-landing-page.png' });

    // Navigate to Create New Invoice / Studio
    await page.getByRole('link', { name: 'Create New Invoice' }).click();

    // Verify Studio loaded
    await expect(page.getByText('Select Invoice Template')).toBeVisible();

    // Select template
    await page.getByText('Editorial Serif').click();

    // Take screenshot of template selection
    await page.screenshot({ path: 'test-results/screenshots/02-template-selected.png' });
  });

  test('invoice wizard step navigation', async ({ page }) => {
    await page.goto('/studio');

    // Step 1: Style template
    await expect(page.getByText('Select Invoice Template')).toBeVisible();

    // Step 2: Parties step
    await page.getByRole('button', { name: 'Parties' }).click();
    await page.screenshot({ path: 'test-results/screenshots/03-parties-step.png' });

    // Step 3: Invoice details step
    await page.getByRole('button', { name: 'Invoice' }).click();
    await page.screenshot({ path: 'test-results/screenshots/04-invoice-details-step.png' });
  });
});
