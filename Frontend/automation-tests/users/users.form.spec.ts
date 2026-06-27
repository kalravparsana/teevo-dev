import { loginAsDemo } from '../helpers/auth.helper';
import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Users — Form Tests', () => {
  test('Add user modal validates required fields', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.superadminEmail);
    await page.goto('/users');
    await page.getByRole('button', { name: 'Add user' }).click();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Invalid email address')).toBeVisible();
  });

  test('Add user modal accepts valid user data', async ({ page }) => {
    await loginAsDemo(page, teevoData.valid.superadminEmail);
    await page.goto('/users');
    await page.getByRole('button', { name: 'Add user' }).click();
    await page.getByLabel('Name').fill(teevoData.valid.newUserName);
    await page.getByLabel('Email').fill(teevoData.valid.newUserEmail);
    await page.getByLabel('Club').selectOption({ label: teevoData.valid.clubName });
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('cell', { name: teevoData.valid.newUserName })).toBeVisible();
  });
});
