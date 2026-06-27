import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Scorecards — Form Tests', () => {
  test('Enter scorecard requires tournament selection', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.playerEmail);
    await page.goto('/scorecards');
    await page.getByRole('button', { name: 'Enter scorecard' }).click();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Save draft' })).toBeDisabled();
  });

  test('scorecard modal enables submit after tournament selected', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.playerEmail);
    await page.goto('/scorecards');
    await page.getByRole('button', { name: 'Enter scorecard' }).click();
    await page.getByLabel('Tournament').selectOption({ label: teevoData.valid.tournamentSpringName });
    await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });
});
