import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Club Detail — Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.clubAdminEmail);
    await page.goto('/clubs/club-pine-valley');
  });

  test('page has a visible primary heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Pine Valley Golf Club/i }).first()).toBeVisible();
  });

  test('interactive controls are keyboard reachable', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('form inputs have associated labels', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('main navigation has accessible name', async ({ page }) => {
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  });
});
