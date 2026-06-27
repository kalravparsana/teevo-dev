import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Bookings — Form Tests', () => {
  test('New booking modal requires club and tee time', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.playerEmail);
    await page.goto('/bookings');
    await page.getByRole('button', { name: 'New booking' }).click();
    await page.getByRole('button', { name: 'Confirm booking' }).click();
    await expect(page.getByText('Select a tee time')).toBeVisible();
  });

  test('booking modal can be cancelled', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.playerEmail);
    await page.goto('/bookings');
    await page.getByRole('button', { name: 'New booking' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible();
  });
});
