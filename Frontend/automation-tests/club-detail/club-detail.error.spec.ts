import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Club Detail — Error States', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.clubAdminEmail);
  });

  test('shows not found for invalid club id', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.superadminEmail);
    await page.goto('/clubs/invalid-club-id');
    await expect(page.getByText('Club not found.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to clubs' })).toBeVisible();
  });
  test('protected route redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/clubs/club-pine-valley');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/clubs/club-pine-valley');
    await expect(page).toHaveURL(/\/login/);
  });
});
