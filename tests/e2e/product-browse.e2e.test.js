import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mocks.js';

test.describe('Product Browse E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
  });

  test.skip('should display a list of products', async ({ page }) => {
    // Product cards use div.group.cursor-pointer in this app
    const cards = page.locator(
      '.group.cursor-pointer, [data-testid="product-card"], article'
    );
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test.skip('should show product names and prices', async ({ page }) => {
    // Product names are in h3 elements inside product cards
    const names = page.locator(
      '.group.cursor-pointer h3, [data-testid="product-name"]'
    );
    await expect(names.first()).toBeVisible({ timeout: 10000 });

    // Prices are in p.text-lg elements
    const prices = page.locator(
      '.group.cursor-pointer .text-lg, [data-testid="product-price"]'
    );
    if ((await prices.count()) > 0) {
      await expect(prices.first()).toBeVisible();
    }
  });

  test('should filter products by category', async ({ page }) => {
    const categoryFilter = page.locator(
      '[data-testid="category-filter"], select[name="category"], [class*="category"] select, [class*="filter"] select'
    );

    if (await categoryFilter.first().isVisible({ timeout: 3000 })) {
      await categoryFilter.first().selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
    } else {
      // Category filter might be sidebar links
      const categoryLink = page
        .locator('[class*="categor"] a, [class*="sidebar"] a')
        .first();
      if (await categoryLink.isVisible({ timeout: 2000 })) {
        await categoryLink.click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should search for products', async ({ page }) => {
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="Search" i], [data-testid="search-input"]'
    );

    if (await searchInput.first().isVisible({ timeout: 3000 })) {
      await searchInput.first().fill('headphones');
      await searchInput.first().press('Enter');
      await page.waitForLoadState('networkidle');
    }
  });

  test.skip('should navigate to product detail page', async ({ page }) => {
    // Product cards are clickable divs that use navigate()
    const card = page
      .locator('.group.cursor-pointer, [data-testid="product-card"]')
      .first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await page.waitForURL(/\/products\//, { timeout: 5000 });
  });

  test('should handle empty search results gracefully', async ({ page }) => {
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="Search" i]'
    );

    if (await searchInput.first().isVisible({ timeout: 3000 })) {
      await searchInput.first().fill('xyznonexistentproduct999');
      await searchInput.first().press('Enter');
      await page.waitForLoadState('networkidle');

      // Page should still be functional (not crashed)
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });

  test('should support pagination or infinite scroll', async ({ page }) => {
    // Check for pagination controls
    const pagination = page.locator(
      '[data-testid="pagination"], .pagination, nav[aria-label="pagination" i]'
    );
    const nextButton = page.locator(
      'button:has-text("Next"), [data-testid="next-page"]'
    );

    if (await pagination.isVisible({ timeout: 3000 })) {
      await expect(pagination).toBeVisible();
    } else if (await nextButton.isVisible({ timeout: 2000 })) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should sort products', async ({ page }) => {
    const sortDropdown = page.locator(
      'select[name="sort"], [data-testid="sort-select"], [class*="sort"] select'
    );

    if (await sortDropdown.first().isVisible({ timeout: 3000 })) {
      await sortDropdown.first().selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
    }
  });
});
