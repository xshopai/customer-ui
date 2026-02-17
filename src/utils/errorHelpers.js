/**
 * Error Handling Utilities
 * Provides consistent error parsing and user-friendly messages across the application
 */

/**
 * Error code to user-friendly message mapping
 */
const ERROR_MESSAGE_MAP = {
  // Authentication errors
  EMAIL_EXISTS:
    'An account with this email address already exists. Please sign in or use a different email.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before logging in.',
  ACCOUNT_LOCKED: 'Your account has been locked. Please contact support.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  UNAUTHORIZED: 'Please log in to continue.',

  // Validation errors
  VALIDATION_ERROR: 'Please check your information and try again.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PASSWORD: 'Password does not meet requirements.',
  PASSWORDS_NOT_MATCH: 'Passwords do not match.',

  // Resource errors
  NOT_FOUND: 'The requested resource was not found.',
  USER_NOT_FOUND: 'User not found.',
  PRODUCT_NOT_FOUND: 'Product not found.',

  // Server errors
  INTERNAL_ERROR: 'Something went wrong. Please try again later.',
  SERVICE_UNAVAILABLE:
    'Service is temporarily unavailable. Please try again later.',
  NETWORK_ERROR:
    'Unable to connect to the server. Please check your internet connection.',

  // Rate limiting
  TOO_MANY_REQUESTS: 'Too many attempts. Please wait a moment and try again.',
};

/**
 * Parse error response and extract user-friendly message
 * @param {Error} error - The error object (from axios/bffClient)
 * @param {string} defaultMessage - Default message if parsing fails
 * @returns {{ message: string, code: string|null, details: object|null }}
 */
export function parseApiError(
  error,
  defaultMessage = 'Something went wrong. Please try again.'
) {
  const errorData = error.response?.data || {};

  // Extract error code
  const errorCode = errorData.error?.code || errorData.code || null;

  // Extract error message from various formats
  let message = defaultMessage;

  if (errorData.error?.message) {
    // Backend returns { error: { code, message, ... } }
    message = errorData.error.message;
  } else if (errorData.message) {
    // Backend returns { message: "..." }
    message = errorData.message;
  } else if (typeof errorData.error === 'string') {
    // Backend returns { error: "..." }
    message = errorData.error;
  } else if (error.message && !error.message.includes('HTTP')) {
    // Use enhanced message only if it's not a raw HTTP error
    message = error.message;
  }

  // Map error code to user-friendly message if available
  if (errorCode && ERROR_MESSAGE_MAP[errorCode]) {
    message = ERROR_MESSAGE_MAP[errorCode];
  }

  // Special case: email exists detection from message content
  if (
    message.toLowerCase().includes('email already exists') ||
    message.toLowerCase().includes('email is already registered')
  ) {
    message = ERROR_MESSAGE_MAP.EMAIL_EXISTS;
  }

  // Extract validation details
  const details =
    errorData.validationErrors || errorData.error?.details || null;

  return {
    message,
    code: errorCode,
    details,
  };
}

/**
 * Get user-friendly message for a specific error code
 * @param {string} code - Error code
 * @returns {string|null} User-friendly message or null
 */
export function getErrorMessage(code) {
  return ERROR_MESSAGE_MAP[code] || null;
}

/**
 * Check if error is a network error
 * @param {Error} error - The error object
 * @returns {boolean}
 */
export function isNetworkError(error) {
  return (
    error.isNetworkError || error.code === 'ERR_NETWORK' || !error.response
  );
}

/**
 * Check if error is an authentication error
 * @param {Error} error - The error object
 * @returns {boolean}
 */
export function isAuthError(error) {
  const status = error.response?.status || error.statusCode;
  return status === 401 || status === 403;
}

const errorHelpers = {
  parseApiError,
  getErrorMessage,
  isNetworkError,
  isAuthError,
  ERROR_MESSAGE_MAP,
};

export default errorHelpers;
