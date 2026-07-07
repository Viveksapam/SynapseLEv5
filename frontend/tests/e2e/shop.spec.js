import { test, expect } from '@playwright/test';

test.describe('Shop page E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
  });

  test('renders shop page with title', async ({ page }) => {
    await expect(page.getByText('Exclusive Apparel & Merchandise')).toBeVisible();
    await expect(page.getByText(/Premium quality developer gear/)).toBeVisible();
  });

  test('renders category filter buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Apparel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Accessories' })).toBeVisible();
  });

  test('renders product cards after loading', async ({ page }) => {
    await expect(page.locator('.shop-card').first()).toBeVisible({ timeout: 10000 });
    const cards = page.locator('.shop-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('filters products by category', async ({ page }) => {
    await expect(page.locator('.shop-card').first()).toBeVisible({ timeout: 10000 });

    const allCount = await page.locator('.shop-card').count();

    await page.getByRole('button', { name: 'Apparel' }).click();
    const apparelCount = await page.locator('.shop-card').count();

    expect(apparelCount).toBeLessThanOrEqual(allCount);

    await page.getByRole('button', { name: 'All' }).click();
    const resetCount = await page.locator('.shop-card').count();
    expect(resetCount).toBe(allCount);
  });

  test('adds product to cart and opens drawer', async ({ page }) => {
    await expect(page.locator('.shop-card').first()).toBeVisible({ timeout: 10000 });

    await page.locator('.btn-add-cart').first().click();

    await expect(page.locator('.cart-drawer')).toBeVisible();
    await expect(page.getByText(/Shopping Cart/)).toBeVisible();
  });

  test('cart shows empty message initially', async ({ page }) => {
    await page.locator('.btn-cart-toggle').click();
    await expect(page.getByText('Your cart is empty.')).toBeVisible();
  });

  test('cart drawer can be closed', async ({ page }) => {
    await page.locator('.btn-cart-toggle').click();
    await expect(page.locator('.cart-drawer')).toBeVisible();

    await page.locator('.btn-close-cart').click();
    await expect(page.locator('.cart-drawer')).not.toBeVisible();
  });

  test('each product card shows price and Add to Cart', async ({ page }) => {
    await expect(page.locator('.shop-card').first()).toBeVisible({ timeout: 10000 });

    const firstCard = page.locator('.shop-card').first();
    await expect(firstCard.locator('.shop-card-price')).toBeVisible();
    await expect(firstCard.locator('.btn-add-cart')).toBeVisible();
  });
});
