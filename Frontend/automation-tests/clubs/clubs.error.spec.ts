import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Clubs — Error States', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.superadminEmail);
  });

  test('protected route redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/clubs');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/clubs');
    await expect(page).toHaveURL(/\/login/);
  });
});
