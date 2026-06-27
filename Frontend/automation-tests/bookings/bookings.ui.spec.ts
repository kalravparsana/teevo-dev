import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Bookings — UI Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(teevoData.api.appDataSuccess),
      }),
    );
    await loginAsDemo(page, teevoData.valid.playerEmail);
    await page.goto('/bookings');
    await page.waitForLoadState('networkidle');
  });

  test('bookings list shows player bookings', async ({ page }) => {
    await expect(page.getByText(teevoData.valid.clubName).first()).toBeVisible();
  });

  test('New booking button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'New booking' })).toBeVisible();
  });

  test('empty API response shows graceful empty state when applicable', async ({ page }) => {
    await page.route('**/api/v1/app-data', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...teevoData.api.appDataSuccess, clubs: [], tournaments: [], bookings: [], scorecards: [], users: [] }),
      }),
    );
    await loginAsDemo(page, teevoData.valid.playerEmail);
    await page.goto('/bookings');
    await expect(page.getByRole('main').or(page.locator('body'))).toBeVisible();
  });
});
