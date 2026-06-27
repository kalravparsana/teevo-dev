import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Tournament Detail — Error States', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.superadminEmail);
  });

  test('shows not found for invalid tournament id', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.superadminEmail);
    await page.goto('/tournaments/invalid-tournament');
    await expect(page.getByText('Tournament not found.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to tournaments' })).toBeVisible();
  });
  test('protected route redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/tournaments/tournament-fall-invitational');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/tournaments/tournament-fall-invitational');
    await expect(page).toHaveURL(/\/login/);
  });
});
