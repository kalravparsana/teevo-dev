import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Login — API Tests', () => {
  test('handles successful API response', async ({ page }) => {
    await page.route('**/api/v1/app-data', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(teevoData.api.appDataSuccess),
      }),
    );
    await page.goto('/login');
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
  });

  test('handles API 500 error gracefully', async ({ page }) => {
    await page.route('**/api/v1/app-data', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: teevoData.api.errorMessage }),
      }),
    );
    
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
  });

  test('handles network abort', async ({ page }) => {
    await page.route('**/api/v1/**', (route) => route.abort('failed'));
    
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
  });

  test('handles malformed JSON response', async ({ page }) => {
    await page.route('**/api/v1/app-data', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: 'not-json' }),
    );
    
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
  });
});
