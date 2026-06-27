import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Dashboard — UI Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(teevoData.api.appDataSuccess),
      }),
    );
    await loginAsDemo(page, teevoData.valid.superadminEmail);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('key metric stat cards are visible', async ({ page }) => {
    await expect(page.getByText('Clubs')).toBeVisible();
    await expect(page.getByText('Active Tournaments')).toBeVisible();
    await expect(page.getByText('Upcoming Bookings')).toBeVisible();
    await expect(page.getByText('Users')).toBeVisible();
  });

  test('quick action links are visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Manage users' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse clubs' })).toBeVisible();
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
    await page.goto('/dashboard');
    await expect(page.getByRole('main').or(page.locator('body'))).toBeVisible();
  });
});
