import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Tournaments — Form Tests', () => {
  test('Add tournament modal validates required name', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.superadminEmail);
    await page.goto('/tournaments');
    await page.getByRole('button', { name: 'Add tournament' }).click();
    await page.getByRole('button', { name: 'Create tournament' }).click();
    await expect(page.getByText('Tournament name is required')).toBeVisible();
  });

  test('Add tournament modal accepts tournament name', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.superadminEmail);
    await page.goto('/tournaments');
    await page.getByRole('button', { name: 'Add tournament' }).click();
    await page.getByLabel('Tournament name').fill(teevoData.valid.newTournamentName);
    await expect(page.getByLabel('Tournament name')).toHaveValue(teevoData.valid.newTournamentName);
  });
});
