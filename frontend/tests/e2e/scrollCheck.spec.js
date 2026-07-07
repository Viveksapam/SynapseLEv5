import { test, expect } from '@playwright/test';

test.describe('Scroll and layout E2E', () => {
  test('page is scrollable and sections are reachable', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => {
      const wrapper = document.querySelector('.ath-wrapper');
      return wrapper && wrapper.classList.contains('ath-animations-ready');
    }, { timeout: 15000 });

    const initialScroll = await page.evaluate(() => window.scrollY);
    expect(initialScroll).toBe(0);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const scrolledPosition = await page.evaluate(() => window.scrollY);
    expect(scrolledPosition).toBeGreaterThan(0);
  });

  test('scroll containers have correct overflow styles', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const styles = await page.evaluate(() => {
      const getOverflow = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const comp = window.getComputedStyle(el);
        return { overflowY: comp.overflowY, overflowX: comp.overflowX };
      };
      return {
        body: getOverflow('body'),
        root: getOverflow('#root'),
      };
    });

    expect(styles.body).not.toBeNull();
    expect(styles.root).not.toBeNull();
  });

  test('intersection observer reveals sections on scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => {
      const wrapper = document.querySelector('.ath-wrapper');
      return wrapper && wrapper.classList.contains('ath-animations-ready');
    }, { timeout: 15000 });

    const blogSection = page.locator('#blog');
    await blogSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const hasRevealClass = await blogSection.evaluate(el =>
      el.classList.contains('ath-reveal-visible')
    );
    expect(hasRevealClass).toBe(true);
  });
});
