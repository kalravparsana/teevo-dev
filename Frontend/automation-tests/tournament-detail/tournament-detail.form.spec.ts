import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Tournament Detail — Form Tests', () => {
  test('registration approval form validates tee time', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.clubAdminEmail);
    await page.goto('/tournaments/tournament-spring-open');
    await page.getByRole('button', { name: 'Approve & assign' }).click();
    await expect(page.getByText('Assign a tee time')).toBeVisible();
  });
});
