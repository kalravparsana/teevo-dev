import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Club Detail — Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('renders on mobile viewport', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.clubAdminEmail);
    await page.goto('/clubs/club-pine-valley');
    await expect(page.getByRole('heading', { name: /Pine Valley Golf Club/i }).first()).toBeVisible();
  });

  test('mobile menu opens on small screens for authenticated pages', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.clubAdminEmail);
    await page.goto('/clubs/club-pine-valley');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  });
});

test.describe('Club Detail — Tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('renders on tablet viewport', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.clubAdminEmail);
    await page.goto('/clubs/club-pine-valley');
    await expect(page.locator('body')).toBeVisible();
  });
});
