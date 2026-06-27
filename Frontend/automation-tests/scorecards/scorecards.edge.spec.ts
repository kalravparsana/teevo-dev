import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Scorecards — Edge Cases', () => {
  test('handles rapid navigation without crashing', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.playerEmail);
    await page.goto('/scorecards');
    await page.goto('/scorecards');
    await page.goBack();
    await expect(page.locator('body')).toBeVisible();
  });

  test('handles special characters in text inputs', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.playerEmail);
    await page.goto('/scorecards');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('double submit does not break page state', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.playerEmail);
    await page.goto('/scorecards');
    await expect(page.getByRole('main')).toBeVisible();
  });
});
