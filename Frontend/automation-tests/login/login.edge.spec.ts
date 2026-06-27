import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Login — Edge Cases', () => {
  test('handles rapid navigation without crashing', async ({ page }) => {
    await page.goto('/login');
    await page.goto('/login');
    await page.goto('/login');
    await page.goBack();
    await expect(page.locator('body')).toBeVisible();
  });

  test('handles special characters in text inputs', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(teevoData.edge.xssLikeText);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('double submit does not break page state', async ({ page }) => {
    await page.goto('/login');
    const btn = page.getByRole('button', { name: 'Sign in' });
    await page.getByLabel('Email').fill(teevoData.valid.superadminEmail);
    await btn.click();
    await btn.click();
    await page.waitForURL('**/dashboard');
  });
});
