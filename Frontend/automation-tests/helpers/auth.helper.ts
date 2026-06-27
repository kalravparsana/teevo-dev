import type { Page } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

/**
 * Sign in via the demo login form using a seed account email.
 * Defaults to the superadmin demo account.
 */
export async function loginAsDemo(
  page: Page,
  email: string = teevoData.valid.superadminEmail,
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
}

/**
 * Sign in by clicking a demo account shortcut button on the login page.
 */
export async function loginAsDemoShortcut(
  page: Page,
  label: string = 'Superadmin',
): Promise<void> {
  await page.goto('/login');
  await page.getByRole('button', { name: new RegExp(label, 'i') }).click();
  await page.waitForURL('**/dashboard');
}
