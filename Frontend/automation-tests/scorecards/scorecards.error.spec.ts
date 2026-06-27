import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Scorecards — Error States', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.playerEmail);
  });

  test('protected route redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/scorecards');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/scorecards');
    await expect(page).toHaveURL(/\/login/);
  });
});
