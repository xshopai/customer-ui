import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cartAPI from '../../api/cartAPI';
import { v4 as uuidv4 } from 'uuid';
import bffClient from '../../api/bffClient';

// ============================================================================
// Helper Functions
// ============================================================================

const getGuestId = () => {
  let guestId = localStorage.getItem('guestId');
  if (!guestId) {
    guestId = uuidv4();
    localStorage.setItem('guestId', guestId);
  }
  return guestId;
};

const calculateTotals = items => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  return { totalItems, totalPrice };
};

const fetchInventoryForItems = async items => {
  if (!items || items.length === 0) return {};

  try {
    const skus = items.map(item => item.sku).filter(Boolean);
    if (skus.length === 0) return {};

    const response = await bffClient.post('/api/inventory/batch', { skus });
    const inventoryData = response.data?.data || [];

    // Create a map of sku -> inventory
    const inventoryMap = {};
    inventoryData.forEach(inv => {
      inventoryMap[inv.sku] = inv.quantityAvailable;
    });

    return inventoryMap;
  } catch (error) {
    console.error('Failed to fetch inventory for cart items:', error);
    return {};
  }
};

const mapBackendCartToState = (backendCart, inventoryMap = {}) => {
  if (!backendCart || !backendCart.items) {
    return { items: [], totalItems: 0, totalPrice: 0 };
  }

  const items = backendCart.items.map(item => {
    const quantityAvailable = inventoryMap[item.sku] ?? null;
    console.log(
      `Mapping item ${item.sku}: quantity=${item.quantity}, quantityAvailable=${quantityAvailable}`
    );
    return {
      id: item.productId,
      sku: item.sku,
      name: item.productName,
      price: item.price,
      quantity: item.quantity,
      quantityAvailable: quantityAvailable, // Add inventory data
      image:
        item.imageUrl && item.imageUrl !== '/placeholder.png'
          ? item.imageUrl
          : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect width="80" height="80" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E',
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
    };
  });

  return {
    items,
    ...calculateTotals(items),
  };
}; // ============================================================================
// Async Thunks
// ============================================================================

/**
 * Fetch cart from backend (authenticated or guest)
 */
export const fetchCartAsync = createAsyncThunk(
  'cart/fetch',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      let response;

      if (auth.user) {
        // Authenticated user
        response = await cartAPI.getCart();
      } else {
        // Guest user
        const guestId = getGuestId();
        response = await cartAPI.getGuestCart(guestId);
      }

      // Fetch inventory data for all cart items
      const inventoryMap = await fetchInventoryForItems(response.data.items);

      return {
        data: response.data,
        inventoryMap,
        isGuest: !auth.user,
      };
    } catch (error) {
      // If cart doesn't exist, return empty cart
      if (error.response?.status === 404) {
        return {
          data: { items: [] },
          inventoryMap: {},
          isGuest: !getState().auth.user,
        };
      }
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch cart'
      );
    }
  }
);

/**
 * Add item to cart (with optimistic update)
 */
export const addToCartAsync = createAsyncThunk(
  'cart/addItem',
  async ({ product, quantity = 1 }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();

      // Use variant SKU from product data - should already be looked up by caller
      // The SKU should be the variant SKU (e.g., WOM-CLO-TOP-001-BLACK-M)
      // from the product.variants array, not generated at runtime
      const sku = product.sku || null;

      const itemData = {
        productId: product.id,
        productName: product.name,
        sku: sku, // Use SKU as passed (should be variant SKU from API)
        price: product.price,
        quantity,
        imageUrl: product.images?.[0] || product.image || '/placeholder.png',
        selectedColor: product.selectedColor,
        selectedSize: product.selectedSize,
      };

      console.log('addToCartAsync: Preparing to add item', {
        isAuthenticated: !!auth.user,
        itemData,
        product: {
          id: product.id,
          name: product.name,
          inStock: product.inStock,
          availableQuantity: product.availableQuantity,
        },
      });

      let response;
      if (auth.user) {
        // Authenticated user
        console.log('addToCartAsync: Adding item for authenticated user');
        response = await cartAPI.addItem(itemData);
        console.log('addToCartAsync: API response', response);
      } else {
        // Guest user
        const guestId = getGuestId();
        console.log('addToCartAsync: Adding item for guest user', { guestId });
        response = await cartAPI.addGuestItem(guestId, itemData);
        console.log('addToCartAsync: API response', response);
      }

      // Fetch inventory data for all cart items
      const inventoryMap = await fetchInventoryForItems(response.data.items);

      return {
        data: response.data,
        inventoryMap,
        isGuest: !auth.user,
        guestId: !auth.user ? getGuestId() : null,
      };
    } catch (error) {
      console.error('addToCartAsync: Error caught', {
        error,
        errorMessage: error?.message,
        responseData: error?.response?.data,
        responseStatus: error?.response?.status,
        responseStatusText: error?.response?.statusText,
      });
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error?.message ||
          'Failed to add item to cart'
      );
    }
  }
);

/**
 * Update item quantity
 */
export const updateQuantityAsync = createAsyncThunk(
  'cart/updateQuantity',
  async ({ sku, quantity }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      let response;

      if (auth.user) {
        // Authenticated user
        response = await cartAPI.updateItem(sku, quantity);
      } else {
        // Guest user
        const guestId = getGuestId();
        response = await cartAPI.updateGuestItem(guestId, sku, quantity);
      }

      // Fetch inventory data for all cart items
      const inventoryMap = await fetchInventoryForItems(response.data.items);

      return {
        data: response.data,
        inventoryMap,
        isGuest: !auth.user,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to update item quantity'
      );
    }
  }
);

/**
 * Remove item from cart
 */
export const removeFromCartAsync = createAsyncThunk(
  'cart/removeItem',
  async (productId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      let response;

      if (auth.user) {
        // Authenticated user
        response = await cartAPI.removeItem(productId);
      } else {
        // Guest user
        const guestId = getGuestId();
        response = await cartAPI.removeGuestItem(guestId, productId);
      }

      // Fetch inventory data for remaining cart items
      const inventoryMap = await fetchInventoryForItems(response.data.items);

      return {
        data: response.data,
        inventoryMap,
        isGuest: !auth.user,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message ||
          'Failed to remove item from cart'
      );
    }
  }
);

/**
 * Clear entire cart
 */
export const clearCartAsync = createAsyncThunk(
  'cart/clear',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();

      if (auth.user) {
        // Authenticated user
        await cartAPI.clearCart();
      } else {
        // Guest user
        const guestId = getGuestId();
        await cartAPI.clearGuestCart(guestId);
      }

      return { success: true };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to clear cart'
      );
    }
  }
);

/**
 * Transfer guest cart to authenticated user (called after login)
 */
export const transferCartAsync = createAsyncThunk(
  'cart/transfer',
  async (_, { rejectWithValue }) => {
    try {
      const guestId = localStorage.getItem('guestId');

      if (!guestId) {
        // No guest cart to transfer
        return { data: { items: [] }, transferred: false };
      }

      const response = await cartAPI.transferCart(guestId);

      // Clear guest ID from localStorage after successful transfer
      localStorage.removeItem('guestId');

      return { data: response.data, transferred: true };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to transfer cart'
      );
    }
  }
);

// ============================================================================
// Slice
// ============================================================================

const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isOpen: false,
  loading: false,
  error: null,
  guestId: null,
  inventoryMap: {}, // Map of sku -> quantityAvailable
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Synchronous actions for optimistic updates
    addToCart: (state, action) => {
      const existingItem = state.items.find(
        item => item.id === action.payload.id
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity || 1;
      } else {
        state.items.push({
          ...action.payload,
          quantity: action.payload.quantity || 1,
        });
      }

      const totals = calculateTotals(state.items);
      state.totalItems = totals.totalItems;
      state.totalPrice = totals.totalPrice;
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.sku !== action.payload);
      const totals = calculateTotals(state.items);
      state.totalItems = totals.totalItems;
      state.totalPrice = totals.totalPrice;
    },
    updateQuantity: (state, action) => {
      const { sku, quantity } = action.payload;
      const item = state.items.find(item => item.sku === sku);

      if (item) {
        item.quantity = quantity;
        if (quantity <= 0) {
          state.items = state.items.filter(item => item.sku !== sku);
        }
      }

      const totals = calculateTotals(state.items);
      state.totalItems = totals.totalItems;
      state.totalPrice = totals.totalPrice;
    },
    clearCart: state => {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
    },
    toggleCart: state => {
      state.isOpen = !state.isOpen;
    },
    openCart: state => {
      state.isOpen = true;
    },
    closeCart: state => {
      state.isOpen = false;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    // Fetch Cart
    builder
      .addCase(fetchCartAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCartAsync.fulfilled, (state, action) => {
        state.loading = false;
        const cartData = mapBackendCartToState(
          action.payload.data,
          action.payload.inventoryMap
        );
        state.items = cartData.items;
        state.totalItems = cartData.totalItems;
        state.totalPrice = cartData.totalPrice;
        state.inventoryMap = action.payload.inventoryMap || {};
        state.guestId = action.payload.guestId || null;
      })
      .addCase(fetchCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Add Item
    builder
      .addCase(addToCartAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        state.loading = false;
        const cartData = mapBackendCartToState(
          action.payload.data,
          action.payload.inventoryMap
        );
        state.items = cartData.items;
        state.totalItems = cartData.totalItems;
        state.totalPrice = cartData.totalPrice;
        state.inventoryMap = action.payload.inventoryMap || {};
        state.guestId = action.payload.guestId || null;
      })
      .addCase(addToCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Quantity
    builder
      .addCase(updateQuantityAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuantityAsync.fulfilled, (state, action) => {
        state.loading = false;
        const cartData = mapBackendCartToState(
          action.payload.data,
          action.payload.inventoryMap
        );
        state.items = cartData.items;
        state.totalItems = cartData.totalItems;
        state.totalPrice = cartData.totalPrice;
        state.inventoryMap = action.payload.inventoryMap || {};
      })
      .addCase(updateQuantityAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Remove Item
    builder
      .addCase(removeFromCartAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        state.loading = false;
        const cartData = mapBackendCartToState(
          action.payload.data,
          action.payload.inventoryMap
        );
        state.items = cartData.items;
        state.totalItems = cartData.totalItems;
        state.totalPrice = cartData.totalPrice;
        state.inventoryMap = action.payload.inventoryMap || {};
      })
      .addCase(removeFromCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Clear Cart
    builder
      .addCase(clearCartAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCartAsync.fulfilled, state => {
        state.loading = false;
        state.items = [];
        state.totalItems = 0;
        state.totalPrice = 0;
      })
      .addCase(clearCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Transfer Cart
    builder
      .addCase(transferCartAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(transferCartAsync.fulfilled, (state, action) => {
        state.loading = false;
        const cartData = mapBackendCartToState(
          action.payload.data,
          state.inventoryMap
        );
        state.items = cartData.items;
        state.totalItems = cartData.totalItems;
        state.totalPrice = cartData.totalPrice;
        state.guestId = null; // Clear guest ID after transfer
      })
      .addCase(transferCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCart,
  openCart,
  closeCart,
  clearError,
} = cartSlice.actions;

export default cartSlice.reducer;
