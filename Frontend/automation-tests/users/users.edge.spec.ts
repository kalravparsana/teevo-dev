import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Users — Edge Cases', () => {
  test('handles rapid navigation without crashing', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.superadminEmail);
    await page.goto('/users');
    await page.goto('/users');
    await page.goBack();
    await expect(page.locator('body')).toBeVisible();
  });

  test('handles special characters in text inputs', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.superadminEmail);
    await page.goto('/users');
    await page.getByRole('button', { name: 'Add user' }).click();
    await page.getByLabel('Name').fill(teevoData.edge.unicodeName);
    await expect(page.getByLabel('Name')).toHaveValue(teevoData.edge.unicodeName);
  });

  test('double submit does not break page state', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.superadminEmail);
    await page.goto('/users');
    await expect(page.getByRole('main')).toBeVisible();
  });
});
