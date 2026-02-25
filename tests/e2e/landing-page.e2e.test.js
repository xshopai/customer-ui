import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Web UI Landing Page (HomePage)
 *
 * These tests simulate real user interactions with the landing page
 * to ensure the complete user experience works as expected.
 */

test.describe('Landing Page - Homepage', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage before each test
    await page.goto('/');
  });

  test('should load the homepage successfully', async ({ page }) => {
    // Verify the page loads and has the correct title
    await expect(page).toHaveTitle(/xshopai/i);

    // Verify the page is visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display the Hero section', async ({ page }) => {
    // Look for hero section - typically has a main heading or CTA
    const hero = page.locator('[class*="hero" i], main section:first-child');
    await expect(hero).toBeVisible();

    // Verify there's a prominent heading
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should display Trending Products section', async ({ page }) => {
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Scroll the trending section into view (industry standard approach)
    const trendingHeading = page.getByText(/trending products/i);
    await trendingHeading.scrollIntoViewIfNeeded();

    // Verify the section is visible
    await expect(trendingHeading).toBeVisible();

    // Wait for product articles to load (the actual product cards are <article> elements)
    const productCard = page.locator('article').first();
    await productCard.waitFor({ state: 'visible', timeout: 10000 });

    // Verify products are displayed
    const count = await page.locator('article').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display Shop by Category section', async ({ page }) => {
    // Scroll the category section into view
    const categoryHeading = page.getByText(/categor/i).first();
    await categoryHeading.scrollIntoViewIfNeeded();

    // Verify it's visible
    await expect(categoryHeading).toBeVisible();
  });

  test('should display Why Choose Us section', async ({ page }) => {
    // Scroll the why choose us section into view
    const whyChooseHeading = page
      .getByText(/why choose|features|benefits/i)
      .first();
    await whyChooseHeading.scrollIntoViewIfNeeded();

    // Verify it's visible
    await expect(whyChooseHeading).toBeVisible();
  });

  test('should have a functional navigation header', async ({ page }) => {
    // Check for navigation header
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();

    // Check for logo/brand link
    const logo = page.getByRole('link', { name: /xshop\.ai|home/i }).first();
    await expect(logo).toBeVisible();

    // Check for search functionality (if present)
    const searchInput = page.getByPlaceholder(/search/i);
    if ((await searchInput.count()) > 0) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('should have a footer with links', async ({ page }) => {
    // Scroll to bottom to ensure footer loads
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Verify footer has links
    const footerLinks = footer.locator('a');
    const linkCount = await footerLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('should allow user to click on a product and navigate to detail page', async ({
    page,
  }) => {
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    // Scroll to trending products section
    const trendingHeading = page.getByText(/trending products/i);
    await trendingHeading.scrollIntoViewIfNeeded();

    // Wait for first product article to be visible
    const firstProductButton = page
      .locator('article button:has-text("View Details")')
      .first();
    await firstProductButton.waitFor({ state: 'visible', timeout: 10000 });

    // Click the View Details button
    await firstProductButton.click();

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Verify we're on a product detail page
    expect(page.url()).toContain('/products/');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page with mobile viewport
    await page.reload();

    // Verify page still loads correctly
    await expect(page.locator('body')).toBeVisible();

    // Check for mobile menu button (hamburger menu)
    const mobileMenuButton = page.getByRole('button', { name: /menu/i });
    if ((await mobileMenuButton.count()) > 0) {
      await expect(mobileMenuButton).toBeVisible();
    }
  });

  test('should handle page scroll correctly', async ({ page }) => {
    // Get initial scroll position
    const initialScroll = await page.evaluate(() => window.scrollY);

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));

    // Wait a bit for scroll
    await page.waitForTimeout(500);

    // Verify scroll position changed
    const newScroll = await page.evaluate(() => window.scrollY);
    expect(newScroll).toBeGreaterThan(initialScroll);
  });

  test('should not have console errors on page load', async ({ page }) => {
    const consoleErrors = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Reload page to capture all console messages
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert no console errors (or only expected ones)
    // You might want to filter out known third-party errors
    const criticalErrors = consoleErrors.filter(
      error => !error.includes('favicon') && !error.includes('third-party')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Page should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });
});
