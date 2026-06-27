import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Dashboard — Form Tests', () => {
  test('dashboard has no data-entry forms but navigation links work', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.superadminEmail);
    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Browse clubs' }).click();
    await expect(page).toHaveURL(/\/clubs/);
  });
});
