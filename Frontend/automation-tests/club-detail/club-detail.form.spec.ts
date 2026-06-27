import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Club Detail — Form Tests', () => {
  test('Edit settings form opens and validates', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.clubAdminEmail);
    await page.goto('/clubs/club-pine-valley');
    await page.getByRole('button', { name: 'Edit settings' }).click();
    await page.getByLabel('Tee time interval (minutes)').fill('3');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Minimum 5 minutes')).toBeVisible();
  });

  test('Edit settings can be cancelled', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.clubAdminEmail);
    await page.goto('/clubs/club-pine-valley');
    await page.getByRole('button', { name: 'Edit settings' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Club configuration')).toBeVisible();
  });
});
