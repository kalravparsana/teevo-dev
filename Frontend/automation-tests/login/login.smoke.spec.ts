import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Login — Smoke Tests', () => {

  test('page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    expect(errors.filter((e) => !e.includes('favicon'))).toHaveLength(0);
  });

  test('page has correct document title', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Teevo/i);
  });

  test('primary heading is visible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Sign in to Teevo|Welcome back/i }).first()).toBeVisible();
  });

  test('page renders within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    expect(Date.now() - start).toBeLessThan(5000);
  });
});
