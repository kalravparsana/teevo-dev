import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Login — Form Tests', () => {
  test('empty email submit is blocked by required validation', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('invalid email shows browser validation', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(teevoData.invalid.email);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('unknown email shows error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(teevoData.invalid.unknownEmail);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('No account found with this email')).toBeVisible();
  });

  test('valid demo email signs in successfully', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(teevoData.valid.superadminEmail);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/dashboard');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  });
});
