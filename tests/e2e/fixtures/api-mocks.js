/**
 * API route mocking for Tier 1 Playwright E2E tests.
 *
 * Intercepts all BFF HTTP calls via page.route() so that tests
 * run entirely against mock data — no backend required.
 */

import {
  mockStorefrontHome,
  mockProductList,
  mockSingleProduct,
  mockCategories,
  mockLoginResponse,
  mockRegisterResponse,
  mockEmptyCart,
  mockCartWithItems,
  mockOrderResponse,
  mockUser,
} from './mock-data.js';

/**
 * Set up API route mocking.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object}  [options]
 * @param {boolean} [options.authenticated=false]  Simulate a logged-in user
 * @param {object}  [options.cart]                 Override default cart response
 */
export async function setupApiMocks(page, options = {}) {
  const { authenticated = false, cart } = options;

  // Pre-populate localStorage so the React app sees a token on init
  if (authenticated) {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-jwt-token-for-testing');
      localStorage.setItem('refreshToken', 'mock-refresh-token-for-testing');
    });
  }

  // Single handler for every /api/ request
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    const json = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });

    // ── Storefront ──────────────────────────────────────────────────────
    if (path === '/api/storefront/home' && method === 'GET')
      return json(mockStorefrontHome);
    if (path === '/api/storefront/categories' && method === 'GET')
      return json(mockCategories);

    // ── Products ────────────────────────────────────────────────────────
    if (path === '/api/products/categories' && method === 'GET')
      return json(mockCategories);
    if (path === '/api/products/search' && method === 'GET')
      return json(mockProductList);
    if (path === '/api/products' && method === 'GET')
      return json(mockProductList);
    if (/^\/api\/products\/[\w-]+\/reviews$/.test(path) && method === 'GET')
      return json({ success: true, data: [] });
    if (/^\/api\/products\/[\w-]+$/.test(path) && method === 'GET')
      return json(mockSingleProduct);

    // ── Auth ────────────────────────────────────────────────────────────
    if (path === '/api/auth/login' && method === 'POST')
      return json(mockLoginResponse);

    if (path === '/api/auth/register' && method === 'POST') {
      // Allow tests to override via page.route before this handler
      return json(mockRegisterResponse);
    }

    if (path === '/api/auth/me' && method === 'GET') {
      return authenticated
        ? json({ user: mockUser })
        : json(
            { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
            401
          );
    }

    if (path === '/api/auth/verify' && method === 'GET') {
      return authenticated
        ? json({ valid: true, user: mockUser })
        : json(
            { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
            401
          );
    }

    if (path === '/api/auth/logout' && method === 'POST')
      return json({ success: true, message: 'Logged out' });

    if (path === '/api/auth/refresh' && method === 'POST')
      return json({
        token: 'mock-refreshed-jwt',
        refreshToken: 'mock-refreshed-refresh',
      });

    if (path === '/api/auth/email/verify' && method === 'GET') {
      const token = url.searchParams.get('token');
      if (
        token &&
        !['expired.or.invalid.token', 'malformed-token'].includes(token)
      )
        return json({ success: true, message: 'Email verified successfully' });
      return json(
        {
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired verification token',
          },
        },
        400
      );
    }

    if (path === '/api/auth/email/resend' && method === 'POST')
      return json({ success: true, message: 'Verification email sent' });

    if (path === '/api/auth/password/forgot' && method === 'POST')
      return json({ success: true, message: 'Reset email sent' });

    // ── Cart ────────────────────────────────────────────────────────────
    if (path === '/api/cart' && method === 'GET')
      return json(cart || (authenticated ? mockCartWithItems : mockEmptyCart));

    if (path === '/api/cart/items' && method === 'POST')
      return json({ success: true, data: mockCartWithItems });

    if (
      /^\/api\/cart\/items\//.test(path) &&
      (method === 'PUT' || method === 'DELETE')
    )
      return json({ success: true });

    if (path === '/api/cart' && method === 'DELETE')
      return json({ success: true });
    if (path === '/api/cart/transfer' && method === 'POST')
      return json({ success: true, data: mockCartWithItems });

    // Guest cart
    if (/^\/api\/cart\/guest\/[\w-]+$/.test(path) && method === 'GET')
      return json(cart || mockEmptyCart);
    if (/^\/api\/cart\/guest\/[\w-]+\/items/.test(path) && method === 'POST')
      return json({ success: true, data: mockCartWithItems });
    if (
      /^\/api\/cart\/guest\//.test(path) &&
      (method === 'PUT' || method === 'DELETE')
    )
      return json({ success: true });

    // ── Orders ──────────────────────────────────────────────────────────
    if (path === '/api/orders' && method === 'POST')
      return json(mockOrderResponse, 201);
    if (/^\/api\/orders\/my/.test(path) && method === 'GET')
      return json({ success: true, data: [] });

    // ── Inventory ───────────────────────────────────────────────────────
    if (path === '/api/inventory/batch' && method === 'POST')
      return json({ data: [{ sku: 'WBH-BLK-OS', quantityAvailable: 50 }] });

    // ── Reviews ─────────────────────────────────────────────────────────
    if (/^\/api\/reviews/.test(path) && method === 'GET')
      return json({ success: true, data: [] });

    // ── Fallback ────────────────────────────────────────────────────────
    return json({ success: true, data: {} });
  });
}
