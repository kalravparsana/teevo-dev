import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Login — Error States', () => {
  test.beforeEach(async ({ page }) => {
    
  });

  test('shows error for unknown email', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(teevoData.invalid.unknownEmail);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('No account found with this email')).toBeVisible();
  });
  test('protected route redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
