import { test, expect } from '@playwright/test';

test.describe('Home page E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for welcome overlay to complete and animations to be ready
    await page.waitForFunction(() => {
      const wrapper = document.querySelector('.ath-wrapper');
      return wrapper && wrapper.classList.contains('ath-animations-ready');
    }, { timeout: 15000 });
  });

  test('renders hero with heading and volume badge', async ({ page }) => {
    await expect(page.locator('.ath-hero-title')).toBeVisible();
    await expect(page.locator('.ath-hero-title')).toContainText('Designing virtual spaces');
    await expect(page.locator('.ath-hero-volume')).toContainText('V4.02');
  });

  test('renders navigation bar with brand and links', async ({ page }) => {
    await expect(page.locator('.ath-brand')).toContainText('Synapse LE');
    await expect(page.locator('a.ath-nav-link', { hasText: 'Verisphere' })).toBeVisible();
    await expect(page.locator('a.ath-nav-link', { hasText: 'Spotlight' })).toBeVisible();
    await expect(page.locator('a.ath-nav-link', { hasText: 'Merchandise' })).toBeVisible();
  });

  test('renders capabilities carousel', async ({ page }) => {
    await expect(page.locator('.ath-carousel-section')).toBeVisible();
    const items = page.locator('.ath-carousel-item');
    await expect(items.first()).toBeVisible();
  });

  test('renders contributions section with blog cards', async ({ page }) => {
    const section = page.locator('#blog');
    await section.scrollIntoViewIfNeeded();
    await expect(page.getByText('Recent Contributions')).toBeVisible();
  });

  test('renders merchandise section', async ({ page }) => {
    const section = page.locator('#merchandise');
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
  });

  test('renders footer with links', async ({ page }) => {
    const footer = page.locator('.ath-footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
  });

  test('page title contains Synapse', async ({ page }) => {
    await expect(page).toHaveTitle(/Synapse/);
  });

  test('hero meta items are visible', async ({ page }) => {
    await expect(page.locator('.ath-hero-meta')).toBeVisible();
    await expect(page.getByText('What It\'s For')).toBeVisible();
    await expect(page.getByText('At A Glance')).toBeVisible();
  });
});
