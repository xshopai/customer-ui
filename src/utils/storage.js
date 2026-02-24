/**
 * LocalStorage Helper
 * Centralized storage management for tokens and user data
 */

const KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
};

/**
 * Get access token from localStorage
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem(KEYS.ACCESS_TOKEN);
};

/**
 * Get refresh token from localStorage
 * @returns {string|null}
 */
export const getRefreshToken = () => {
  return localStorage.getItem(KEYS.REFRESH_TOKEN);
};

/**
 * Store authentication tokens
 * @param {string} accessToken
 * @param {string} refreshToken
 */
export const setToken = (accessToken, refreshToken) => {
  console.log('🔐 setToken called:', {
    hasAccessToken: !!accessToken,
    accessTokenLength: accessToken?.length,
    hasRefreshToken: !!refreshToken,
  });

  if (accessToken) {
    localStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
    console.log('✅ Token stored, verifying...', {
      stored: localStorage.getItem(KEYS.ACCESS_TOKEN)?.substring(0, 20) + '...',
    });
  }
  if (refreshToken) {
    localStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
  }
};

/**
 * Get user data from localStorage
 * @returns {Object|null}
 */
export const getUser = () => {
  const userStr = localStorage.getItem(KEYS.USER);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  }
  return null;
};

/**
 * Store user data
 * @param {Object} user
 */
export const setUser = user => {
  if (user) {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  }
};

/**
 * Clear all authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem(KEYS.ACCESS_TOKEN);
  localStorage.removeItem(KEYS.REFRESH_TOKEN);
  localStorage.removeItem(KEYS.USER);
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = getToken();
  const user = getUser();
  return !!(token && user);
};
