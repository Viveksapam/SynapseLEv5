import { test, expect } from '@playwright/test';

test.describe('Navigation E2E', () => {
  test('navigates to shop page', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.getByText('Exclusive Apparel & Merchandise')).toBeVisible();
    await expect(page.getByText('All')).toBeVisible();
  });

  test('navigates to checkout page', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.getByText('Secure Checkout')).toBeVisible();
    await expect(page.getByText('Powered by Razorpay')).toBeVisible();
  });

  test('navigates to credentials page', async ({ page }) => {
    await page.goto('/credentials');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.app-shell')).toBeVisible();
  });

  test('navigates to assessment page', async ({ page }) => {
    await page.goto('/assessment');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.app-shell')).toBeVisible();
  });

  test('navigates to verisphere', async ({ page }) => {
    await page.goto('/verisphere');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.v2-wrapper')).toBeVisible();
  });

  test('unknown route redirects to home', async ({ page }) => {
    await page.goto('/nonexistent-route');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ath-hero-title')).toBeVisible({ timeout: 15000 });
  });

  test('back to home from shop', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
    await page.getByText('Back to Home').click();
    await expect(page.locator('.ath-hero-title')).toBeVisible({ timeout: 15000 });
  });
});
