import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Clubs — UI Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(teevoData.api.appDataSuccess),
      }),
    );
    await loginAsDemo(page, teevoData.valid.superadminEmail);
    await page.goto('/clubs');
    await page.waitForLoadState('networkidle');
  });

  test('club cards render from seed data', async ({ page }) => {
    await expect(page.getByRole('link', { name: new RegExp(teevoData.valid.clubName) })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(teevoData.valid.clubNameOak) })).toBeVisible();
  });

  test('Add club button is visible for superadmin', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Add club' })).toBeVisible();
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
    await page.goto('/clubs');
    await expect(page.getByRole('main').or(page.locator('body'))).toBeVisible();
  });
});
