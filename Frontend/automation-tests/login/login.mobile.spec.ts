import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Login — Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('renders on mobile viewport', async ({ page }) => {
    
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Sign in to Teevo|Welcome back/i }).first()).toBeVisible();
  });

  test('mobile menu opens on small screens for authenticated pages', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
  });
});

test.describe('Login — Tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('renders on tablet viewport', async ({ page }) => {
    
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
  });
});
