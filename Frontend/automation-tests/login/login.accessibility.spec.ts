import { test, expect } from '@playwright/test';
import { teevoData } from '../fixtures/mock-data/teevo.data';

test.describe('Login — Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    
    await page.goto('/login');
  });

  test('page has a visible primary heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Sign in to Teevo|Welcome back/i }).first()).toBeVisible();
  });

  test('interactive controls are keyboard reachable', async ({ page }) => {
    await page.getByLabel('Email').focus();
    await expect(page.getByLabel('Email')).toBeFocused();
  });

  test('form inputs have associated labels', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  
});
