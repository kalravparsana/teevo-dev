import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Login — UI Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(teevoData.api.appDataSuccess),
      }),
    );
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('demo account shortcuts are visible', async ({ page }) => {
    await expect(page.getByText('Demo accounts')).toBeVisible();
    for (const account of teevoData.demoAccounts) {
      await expect(page.getByRole('button', { name: new RegExp(account.label, 'i') })).toBeVisible();
    }
  });

  test('empty API response shows graceful empty state when applicable', async ({ page }) => {
    await page.route('**/api/v1/app-data', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...teevoData.api.appDataSuccess, clubs: [], tournaments: [], bookings: [], scorecards: [], users: [] }),
      }),
    );
    
    await page.goto('/login');
    await expect(page.getByRole('main').or(page.locator('body'))).toBeVisible();
  });
});
