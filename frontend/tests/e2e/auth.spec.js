import { test, expect } from '@playwright/test';

test.describe('Auth modal E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => {
      const wrapper = document.querySelector('.ath-wrapper');
      return wrapper && wrapper.classList.contains('ath-animations-ready');
    }, { timeout: 15000 });
  });

  test('opens auth modal from LOG IN button', async ({ page }) => {
    await page.locator('.ath-btn-login').click();
    await expect(page.locator('.auth-modal')).toBeVisible();
    await expect(page.getByText('Welcome Back')).toBeVisible();
  });

  test('auth modal has username and password fields', async ({ page }) => {
    await page.locator('.ath-btn-login').click();
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });

  test('switches to register form and shows email field', async ({ page }) => {
    await page.locator('.ath-btn-login').click();
    await page.getByText("Don't have an account? Register").click();

    await expect(page.getByText('Create Account')).toBeVisible();
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });

  test('switches back to login from register', async ({ page }) => {
    await page.locator('.ath-btn-login').click();
    await page.getByText("Don't have an account? Register").click();
    await page.getByText('Already have an account? Login').click();

    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).not.toBeVisible();
  });

  test('closes modal on X button click', async ({ page }) => {
    await page.locator('.ath-btn-login').click();
    await expect(page.locator('.auth-modal')).toBeVisible();

    await page.locator('.auth-close').click();
    await expect(page.locator('.auth-modal')).not.toBeVisible();
  });

  test('login form submit button text is Login', async ({ page }) => {
    await page.locator('.ath-btn-login').click();
    await expect(page.locator('.auth-form button[type="submit"]')).toContainText('Login');
  });

  test('register form submit button text is Register', async ({ page }) => {
    await page.locator('.ath-btn-login').click();
    await page.getByText("Don't have an account? Register").click();
    await expect(page.locator('.auth-form button[type="submit"]')).toContainText('Register');
  });
});
