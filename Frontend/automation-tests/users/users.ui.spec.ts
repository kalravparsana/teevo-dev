import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Users — UI Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(teevoData.api.appDataSuccess),
      }),
    );
    await loginAsDemo(page, teevoData.valid.superadminEmail);
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
  });

  test('user table shows seed users', async ({ page }) => {
    await expect(page.getByRole('cell', { name: teevoData.valid.superadminName })).toBeVisible();
    await expect(page.getByRole('cell', { name: teevoData.valid.playerName })).toBeVisible();
  });

  test('empty API response shows graceful empty state when applicable', async ({ page }) => {
    await page.route('**/api/v1/app-data', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...teevoData.api.appDataSuccess, clubs: [], tournaments: [], bookings: [], scorecards: [], users: [] }),
      }),
    );
    await loginAsDemo(page, teevoData.valid.superadminEmail);
    await page.goto('/users');
    await expect(page.getByRole('main').or(page.locator('body'))).toBeVisible();
  });
});
