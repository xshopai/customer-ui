/**
 * Application Insights Browser SDK for customer-ui
 *
 * This module initializes Azure Application Insights for browser-side telemetry.
 * It automatically tracks:
 * - Page views and navigation
 * - User sessions
 * - Exceptions and errors
 * - AJAX/fetch dependencies
 * - Performance metrics (Core Web Vitals)
 *
 * Configuration:
 * - Set REACT_APP_APPINSIGHTS_CONNECTION_STRING to enable telemetry
 * - Without connection string, telemetry is silently disabled (no console noise)
 */

import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';

// React plugin for component tracking
const reactPlugin = new ReactPlugin();

// Application Insights instance (initialized lazily)
let appInsights = null;

/**
 * Initialize Application Insights with the connection string from environment
 * @returns {ApplicationInsights|null} The initialized instance or null if disabled
 */
export function initializeAppInsights() {
  const connectionString = process.env.REACT_APP_APPINSIGHTS_CONNECTION_STRING;

  // Silently disable if no connection string (common for local dev)
  if (!connectionString) {
    return null;
  }

  if (appInsights) {
    return appInsights;
  }

  try {
    appInsights = new ApplicationInsights({
      config: {
        connectionString,
        extensions: [reactPlugin],
        extensionConfig: {
          [reactPlugin.identifier]: {},
        },
        // Enable auto-tracking features
        enableAutoRouteTracking: true, // Track page views on route change
        enableCorsCorrelation: true, // Correlate with backend calls
        enableRequestHeaderTracking: true, // Track request headers
        enableResponseHeaderTracking: true, // Track response headers
        enableAjaxPerfTracking: true, // Track AJAX performance
        enableUnhandledPromiseRejectionTracking: true, // Track unhandled promise rejections
        disableFetchTracking: false, // Track fetch API calls
        disableAjaxTracking: false, // Track XMLHttpRequest calls

        // Sampling and batching
        samplingPercentage: 100, // Capture all telemetry (adjust for production)
        maxBatchInterval: 15000, // Send telemetry every 15 seconds

        // Cookie settings (respect privacy)
        disableCookiesUsage: false, // Use cookies for session tracking
        cookieCfg: {
          enabled: true,
          domain: null, // Auto-detect domain
        },

        // Correlation settings for distributed tracing
        distributedTracingMode: 2, // W3C Trace Context
        correlationHeaderExcludedDomains: [], // Include all domains

        // User/session tracking
        autoTrackPageVisitTime: true, // Track time on page
        accountId: 'customer-ui', // Identify this app
      },
    });

    appInsights.loadAppInsights();

    // Add cloud role for Application Map
    appInsights.addTelemetryInitializer(envelope => {
      if (envelope.tags) {
        envelope.tags['ai.cloud.role'] = 'customer-ui';
        envelope.tags['ai.cloud.roleInstance'] = window.location.hostname;
      }
    });

    console.log('[AppInsights] Initialized successfully');

    return appInsights;
  } catch (error) {
    console.error('[AppInsights] Failed to initialize:', error);
    return null;
  }
}

/**
 * Get the Application Insights instance
 * @returns {ApplicationInsights|null}
 */
export function getAppInsights() {
  return appInsights;
}

/**
 * Get the React plugin for component tracking
 * @returns {ReactPlugin}
 */
export function getReactPlugin() {
  return reactPlugin;
}

/**
 * Track a custom event
 * @param {string} name - Event name
 * @param {object} properties - Custom properties
 * @param {object} measurements - Custom measurements
 */
export function trackEvent(name, properties = {}, measurements = {}) {
  if (appInsights) {
    appInsights.trackEvent({ name }, { ...properties }, { ...measurements });
  }
}

/**
 * Track an exception
 * @param {Error} error - The error object
 * @param {object} properties - Additional properties
 */
export function trackException(error, properties = {}) {
  if (appInsights) {
    appInsights.trackException({ exception: error, properties });
  }
}

/**
 * Track a page view (automatic with enableAutoRouteTracking, but can be called manually)
 * @param {string} name - Page name
 * @param {string} uri - Page URI
 */
export function trackPageView(name, uri) {
  if (appInsights) {
    appInsights.trackPageView({ name, uri });
  }
}

/**
 * Track a metric
 * @param {string} name - Metric name
 * @param {number} value - Metric value
 * @param {object} properties - Additional properties
 */
export function trackMetric(name, value, properties = {}) {
  if (appInsights) {
    appInsights.trackMetric({ name, average: value }, properties);
  }
}

/**
 * Set authenticated user context
 * @param {string} userId - User ID
 * @param {string} accountId - Account/tenant ID (optional)
 */
export function setAuthenticatedUser(userId, accountId = null) {
  if (appInsights) {
    appInsights.setAuthenticatedUserContext(userId, accountId, true);
  }
}

/**
 * Clear authenticated user context (on logout)
 */
export function clearAuthenticatedUser() {
  if (appInsights) {
    appInsights.clearAuthenticatedUserContext();
  }
}

/**
 * Flush telemetry immediately (call before page unload)
 */
export function flushTelemetry() {
  if (appInsights) {
    appInsights.flush();
  }
}

// Export default instance getter for convenience
export default {
  initialize: initializeAppInsights,
  getInstance: getAppInsights,
  getReactPlugin,
  trackEvent,
  trackException,
  trackPageView,
  trackMetric,
  setAuthenticatedUser,
  clearAuthenticatedUser,
  flush: flushTelemetry,
};
