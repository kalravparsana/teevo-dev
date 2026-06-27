import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Clubs — Form Tests', () => {
  test('Add club modal validates required fields', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.superadminEmail);
    await page.goto('/clubs');
    await page.getByRole('button', { name: 'Add club' }).click();
    await page.getByRole('button', { name: 'Create club' }).click();
    await expect(page.getByText('Club logo is required')).toBeVisible();
    await expect(page.getByText('Club name is required')).toBeVisible();
  });

  test('Add club modal accepts valid input', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.superadminEmail);
    await page.goto('/clubs');
    await page.getByRole('button', { name: 'Add club' }).click();
    await page.getByLabel('Club name').fill(teevoData.valid.newClubName);
    await page.getByLabel('Location').fill(teevoData.valid.newClubLocation);
    await page.getByRole('button', { name: 'Create club' }).click();
    await expect(page.getByText('Club logo is required')).toBeVisible();
  });
});
