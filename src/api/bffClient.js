/**
 * BFF (Backend for Frontend) API Client
 * Single HTTP client for all backend communication through BFF
 */
import axios from 'axios';
import { getToken, setToken, clearAuth } from '../utils/storage';
import { parseApiError } from '../utils/errorMessages';

// BFF Configuration
// - For Azure Container Apps: Use relative URL (nginx proxies /api to web-bff)
// - For Azure Static Web Apps: Use REACT_APP_BFF_URL (direct API calls with CORS)
// - For local development: Use REACT_APP_BFF_URL or localhost:8014
export const REACT_APP_BFF_URL =
  process.env.REACT_APP_BFF_URL || // SWA or explicit config takes priority
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8014');
const BFF_TIMEOUT = 10000; // 10 seconds

const bffClient = axios.create({
  baseURL: REACT_APP_BFF_URL,
  timeout: BFF_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token and correlation ID
bffClient.interceptors.request.use(
  config => {
    // Add auth token
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add correlation ID for request tracing
    const correlationId = `customer-ui-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    config.headers['x-correlation-id'] = correlationId;

    return config;
  },
  error => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
bffClient.interceptors.response.use(
  response => {
    // Log successful response in development
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('✅ BFF Response:', {
    //     status: response.status,
    //     url: response.config.url,
    //     correlationId: response.headers['x-correlation-id'],
    //   });
    // }
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // Network error - BFF is down or unreachable
    if (!error.response) {
      console.error('❌ Network Error:', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
      });

      const enhancedError = new Error(
        'Unable to connect to the server. Please check your internet connection or try again later.'
      );
      enhancedError.isNetworkError = true;
      enhancedError.code = error.code;
      enhancedError.originalError = error;
      throw enhancedError;
    }

    // Handle 401 Unauthorized - Token refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      console.warn('⚠️ 401 Unauthorized:', {
        url: originalRequest.url,
        hasRefreshToken: !!localStorage.getItem('refreshToken'),
      });

      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          console.error('❌ No refresh token available, clearing auth');
          clearAuth();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        console.log('🔄 Attempting token refresh...');

        // Refresh token through BFF
        const response = await axios.post(
          `${REACT_APP_BFF_URL}/api/auth/refresh`,
          {
            refreshToken,
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        console.log('✅ Token refreshed successfully');

        // Store new tokens
        setToken(accessToken, newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return bffClient(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Enhance error with backend message and user-friendly message
    const errorInfo = parseApiError(error);

    const backendError = new Error(errorInfo.message);
    backendError.statusCode = errorInfo.statusCode;
    backendError.code = errorInfo.code;
    backendError.response = error.response;
    backendError.correlationId = error.response.headers['x-correlation-id'];
    backendError.details = errorInfo.details;

    console.error('❌ BFF Error:', {
      message: backendError.message,
      code: backendError.code,
      statusCode: backendError.statusCode,
      correlationId: backendError.correlationId,
    });

    return Promise.reject(backendError);
  }
);

export default bffClient;
