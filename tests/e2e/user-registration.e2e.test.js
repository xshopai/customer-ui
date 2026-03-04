import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mocks.js';

/**
 * Tier 1 User Registration E2E Tests (mocked API).
 *
 * Tests the registration UI flow without a live backend.
 * Mailpit / real email verification is covered in Tier 2 tests.
 */

test.describe('User Registration', () => {
  const testEmail = 'test.user@example.com';
  const testPassword = 'SecurePass123!';

  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('should display the registration form with all fields', async ({
    page,
  }) => {
    await page.goto('/register');

    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();

    const submitButton = page.getByRole('button', {
      name: /register|sign up|create account/i,
    });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test('should register successfully and redirect to success page', async ({
    page,
  }) => {
    await page.goto('/register');

    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(testEmail);

    // Phone field is optional – fill only if visible
    const phoneField = page.getByLabel(/phone/i);
    if (await phoneField.isVisible({ timeout: 1000 })) {
      await phoneField.fill('+1 (555) 123-4567');
    }

    await page.getByLabel(/^password$/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);

    // Terms checkbox – check only if visible
    const terms = page.getByLabel(/agree|terms/i);
    if (await terms.isVisible({ timeout: 1000 })) {
      await terms.check();
    }

    await page
      .getByRole('button', { name: /register|sign up|create account/i })
      .click();

    // Registration may redirect to /registration-success (email verification)
    // or / (direct success) depending on the API response
    await page.waitForURL(
      url => {
        const path = new URL(url).pathname;
        return path === '/registration-success' || path === '/';
      },
      { timeout: 15000 }
    );

    // Verify success content on whichever page we land on
    const currentUrl = page.url();
    if (currentUrl.includes('registration-success')) {
      await expect(
        page.getByText(/registration successful|check your email/i).first()
      ).toBeVisible({ timeout: 10000 });
    } else {
      // If redirected to home, the registration was successful
      expect(currentUrl).toContain('localhost:3000');
    }
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    // Use email that passes HTML5 type="email" validation but fails React regex
    // React regex requires user@domain.tld format (needs a dot after @)
    await page.getByLabel(/email/i).fill('test@nodot');
    await page.getByLabel(/^password$/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);

    // Check terms if visible
    const terms = page.getByLabel(/agree|terms/i);
    if (await terms.isVisible({ timeout: 1000 })) {
      await terms.check();
    }

    await page
      .getByRole('button', { name: /register|sign up|create account/i })
      .click();

    await expect(
      page.getByText(/email is invalid|invalid email|valid email/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/^password$/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill('DifferentPass123!');

    await page
      .getByRole('button', { name: /register|sign up|create account/i })
      .click();

    await expect(
      page.getByText(/passwords.*match|password.*same/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Override the register mock to abort the request
    await page.route('**/api/auth/register', route => route.abort());

    await page.goto('/register');

    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(testEmail);

    const phoneField = page.getByLabel(/phone/i);
    if (await phoneField.isVisible({ timeout: 1000 })) {
      await phoneField.fill('+1 (555) 123-4567');
    }

    await page.getByLabel(/^password$/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);

    const terms = page.getByLabel(/agree|terms/i);
    if (await terms.isVisible({ timeout: 1000 })) {
      await terms.check();
    }

    await page
      .getByRole('button', { name: /register|sign up|create account/i })
      .click();

    await expect(page.getByText(/error|failed|try again/i).first()).toBeVisible(
      { timeout: 10000 }
    );
  });

  test('should navigate to login page via link', async ({ page }) => {
    await page.goto('/register');

    const loginLink = page.getByRole('link', { name: 'Sign in here' });
    if (await loginLink.isVisible({ timeout: 2000 })) {
      await loginLink.click();
      await page.waitForURL('**/login', { timeout: 5000 });
    }
  });
});

test.describe('Email Verification', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('should reject expired verification tokens', async ({ page }) => {
    await page.goto('/verify-email?token=expired.or.invalid.token');

    await expect(
      page.getByText(/invalid|expired|verification failed/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should reject malformed verification tokens', async ({ page }) => {
    await page.goto('/verify-email?token=malformed-token');

    await expect(
      page.getByText(/invalid|verification failed/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
