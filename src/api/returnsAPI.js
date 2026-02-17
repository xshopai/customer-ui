/**
 * Returns API Client
 * Handles all return-related API calls to the BFF
 */
import bffClient from './bffClient';
import { API_ENDPOINTS } from './endpoints';

/**
 * Create a new return request
 * @param {Object} returnData - Return request data
 * @param {string} returnData.orderId - Order ID to return
 * @param {string} returnData.reason - Reason for return (enum value)
 * @param {string} returnData.description - Detailed description (10-1000 chars)
 * @param {Array} returnData.items - Items to return
 * @param {string} returnData.items[].orderItemId - Order item ID
 * @param {number} returnData.items[].quantityToReturn - Quantity to return
 * @param {string} returnData.items[].itemCondition - Condition of item (optional)
 * @returns {Promise<Object>} Created return
 */
export const createReturn = async returnData => {
  const response = await bffClient.post(
    API_ENDPOINTS.RETURNS.CREATE,
    returnData
  );
  return response.data;
};

/**
 * Get current user's returns
 * @returns {Promise<Array>} List of user's returns
 */
export const getMyReturns = async () => {
  const response = await bffClient.get(API_ENDPOINTS.RETURNS.MY);
  console.log('📦 getMyReturns API response:', response);

  // The BFF returns { success: true, data: returns }
  if (response.data && response.data.data) {
    return response.data.data;
  }

  return response.data;
};

/**
 * Get return by ID
 * @param {string} returnId - Return ID
 * @returns {Promise<Object>} Return details
 */
export const getReturnById = async returnId => {
  const response = await bffClient.get(API_ENDPOINTS.RETURNS.DETAIL(returnId));
  return response.data;
};

/**
 * Get all returns for a specific order
 * @param {string} orderId - Order ID
 * @returns {Promise<Array>} List of returns for the order
 */
export const getReturnsByOrder = async orderId => {
  const response = await bffClient.get(API_ENDPOINTS.RETURNS.BY_ORDER(orderId));

  // The BFF returns { success: true, data: returns }
  if (response.data && response.data.data) {
    return response.data.data;
  }

  return response.data;
};

/**
 * Check if an order is eligible for return
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Eligibility response { orderId, isEligible, reason }
 */
export const checkReturnEligibility = async orderId => {
  const response = await bffClient.get(
    API_ENDPOINTS.RETURNS.ELIGIBILITY(orderId)
  );

  // The BFF returns { success: true, data: { orderId, isEligible, reason } }
  if (response.data && response.data.data) {
    return response.data.data;
  }

  return response.data;
};

// Export all functions as named object
const returnsAPI = {
  createReturn,
  getMyReturns,
  getReturnById,
  getReturnsByOrder,
  checkReturnEligibility,
};

export default returnsAPI;
