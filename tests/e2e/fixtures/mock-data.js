/**
 * Mock data for Tier 1 (mocked-API) Playwright E2E tests.
 * Provides realistic BFF API responses so tests run without a backend.
 */

// ---------------------------------------------------------------------------
// Storefront / Home
// ---------------------------------------------------------------------------

export const mockTrendingProducts = [
  {
    id: 'prod-001',
    name: 'Wireless Bluetooth Headphones',
    price: 79.99,
    category: 'Electronics',
    images: ['https://placehold.co/400x400?text=Headphones'],
    reviews: { averageRating: 4.5, reviewCount: 128 },
    inventory: { inStock: true },
    badge: 'trending',
    colors: ['Black', 'White', 'Blue'],
  },
  {
    id: 'prod-002',
    name: 'Premium Cotton T-Shirt',
    price: 29.99,
    category: 'Clothing',
    images: ['https://placehold.co/400x400?text=T-Shirt'],
    reviews: { averageRating: 4.2, reviewCount: 86 },
    inventory: { inStock: true },
    badge: 'bestseller',
    colors: ['Navy', 'Gray', 'White'],
  },
  {
    id: 'prod-003',
    name: 'Smart Fitness Watch',
    price: 199.99,
    category: 'Electronics',
    images: ['https://placehold.co/400x400?text=Watch'],
    reviews: { averageRating: 4.7, reviewCount: 256 },
    inventory: { inStock: true },
    badge: 'new',
    colors: ['Black', 'Silver'],
  },
  {
    id: 'prod-004',
    name: 'Organic Face Moisturizer',
    price: 34.99,
    category: 'Beauty',
    images: ['https://placehold.co/400x400?text=Moisturizer'],
    reviews: { averageRating: 4.4, reviewCount: 62 },
    inventory: { inStock: true },
    colors: [],
  },
];

export const mockTrendingCategories = [
  { name: 'Electronics', count: 42 },
  { name: 'Clothing', count: 35 },
  { name: 'Beauty', count: 28 },
  { name: 'Home & Kitchen', count: 21 },
  { name: 'Sports', count: 15 },
];

export const mockStorefrontHome = {
  success: true,
  data: {
    trendingProducts: mockTrendingProducts,
    trendingCategories: mockTrendingCategories,
  },
};

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const mockProductListItems = [
  {
    id: 'prod-001',
    name: 'Wireless Bluetooth Headphones',
    description: 'Premium noise-canceling headphones with 30-hour battery life',
    price: 79.99,
    images: ['https://placehold.co/400x400?text=Headphones'],
    average_rating: 4.5,
    num_reviews: 128,
    inventory: { inStock: true, availableQuantity: 50 },
    department: 'Electronics',
    category: 'Audio',
    subcategory: 'Headphones',
    brand: 'TechBrand',
    colors: ['Black', 'White'],
    sizes: [],
  },
  {
    id: 'prod-002',
    name: 'Premium Cotton T-Shirt',
    description: 'Comfortable, durable cotton t-shirt',
    price: 29.99,
    images: ['https://placehold.co/400x400?text=T-Shirt'],
    average_rating: 4.2,
    num_reviews: 86,
    inventory: { inStock: true, availableQuantity: 200 },
    department: 'Clothing',
    category: 'Tops',
    subcategory: 'T-Shirts',
    brand: 'FashionBrand',
    colors: ['Navy', 'Gray'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'prod-003',
    name: 'Smart Fitness Watch',
    description: 'Track your fitness goals with this advanced smartwatch',
    price: 199.99,
    images: ['https://placehold.co/400x400?text=Watch'],
    average_rating: 4.7,
    num_reviews: 256,
    inventory: { inStock: true, availableQuantity: 30 },
    department: 'Electronics',
    category: 'Wearables',
    subcategory: 'Smartwatches',
    brand: 'TechPro',
    colors: ['Black', 'Silver'],
    sizes: [],
  },
  {
    id: 'prod-004',
    name: 'Organic Face Moisturizer',
    description: 'Natural skincare with organic ingredients',
    price: 34.99,
    images: ['https://placehold.co/400x400?text=Moisturizer'],
    average_rating: 4.4,
    num_reviews: 62,
    inventory: { inStock: true, availableQuantity: 100 },
    department: 'Beauty',
    category: 'Skincare',
    subcategory: 'Moisturizers',
    brand: 'NaturalGlow',
    colors: [],
    sizes: [],
  },
  {
    id: 'prod-005',
    name: 'Running Shoes Pro',
    description: 'Lightweight running shoes with superior cushioning',
    price: 129.99,
    images: ['https://placehold.co/400x400?text=Shoes'],
    average_rating: 4.6,
    num_reviews: 192,
    inventory: { inStock: true, availableQuantity: 75 },
    department: 'Sports',
    category: 'Footwear',
    subcategory: 'Running',
    brand: 'SportMax',
    colors: ['Red', 'Blue', 'Black'],
    sizes: ['7', '8', '9', '10', '11'],
  },
  {
    id: 'prod-006',
    name: 'Stainless Steel Water Bottle',
    description: 'Double-wall insulated, keeps drinks cold 24 hours',
    price: 24.99,
    images: ['https://placehold.co/400x400?text=Bottle'],
    average_rating: 4.3,
    num_reviews: 45,
    inventory: { inStock: true, availableQuantity: 150 },
    department: 'Home & Kitchen',
    category: 'Kitchen',
    subcategory: 'Drinkware',
    brand: 'HydroKeep',
    colors: ['Silver', 'Black', 'Blue'],
    sizes: [],
  },
];

export const mockProductList = {
  success: true,
  data: {
    products: mockProductListItems,
    total_count: mockProductListItems.length,
  },
};

export const mockSingleProduct = {
  success: true,
  data: {
    ...mockProductListItems[0],
    features: ['Active Noise Cancellation', '30-hour battery', 'Bluetooth 5.0'],
  },
};

export const mockCategories = {
  success: true,
  data: [
    {
      _id: 'cat-001',
      name: 'Electronics',
      slug: 'electronics',
      productCount: 42,
    },
    { _id: 'cat-002', name: 'Clothing', slug: 'clothing', productCount: 35 },
    { _id: 'cat-003', name: 'Beauty', slug: 'beauty', productCount: 28 },
    {
      _id: 'cat-004',
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      productCount: 21,
    },
    { _id: 'cat-005', name: 'Sports', slug: 'sports', productCount: 15 },
  ],
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const mockUser = {
  id: 'user-001',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  roles: ['customer'],
  isEmailVerified: true,
  isActive: true,
};

export const mockLoginResponse = {
  token: 'mock-jwt-token-for-testing',
  refreshToken: 'mock-refresh-token-for-testing',
  user: { _id: 'user-001', ...mockUser },
};

export const mockRegisterResponse = {
  success: true,
  requiresVerification: true,
  message:
    'Registration successful. Please check your email to verify your account.',
};

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export const mockEmptyCart = { data: { items: [] } };

export const mockCartWithItems = {
  data: {
    items: [
      {
        productId: 'prod-001',
        productName: 'Wireless Bluetooth Headphones',
        sku: 'WBH-BLK-OS',
        price: 79.99,
        quantity: 1,
        imageUrl: 'https://placehold.co/400x400?text=Headphones',
        selectedColor: 'Black',
        selectedSize: null,
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const mockOrderResponse = {
  success: true,
  data: {
    orderId: 'order-001',
    status: 'Pending',
    items: mockCartWithItems.data.items,
    total: 79.99,
    createdAt: new Date().toISOString(),
  },
};
