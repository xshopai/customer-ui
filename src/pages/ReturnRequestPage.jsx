import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import ordersAPI from '../api/ordersAPI';
import returnsAPI from '../api/returnsAPI';

// Return reasons enum (must match backend)
const RETURN_REASONS = [
  { value: 'DefectiveItem', label: 'Defective or Damaged Item' },
  { value: 'WrongItem', label: 'Wrong Item Received' },
  { value: 'NotAsDescribed', label: 'Not as Described' },
  { value: 'NoLongerNeeded', label: 'No Longer Needed' },
  { value: 'BetterPriceFound', label: 'Better Price Found' },
  { value: 'QualityIssue', label: 'Quality Issue' },
  { value: 'SizeIssue', label: 'Size Issue' },
  { value: 'Other', label: 'Other' },
];

const ReturnRequestPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [selectedItems, setSelectedItems] = useState([]); // Array of { orderItemId, quantityToReturn, itemCondition }
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch order details
        const orderResponse = await ordersAPI.getOrderById(orderId);
        const orderData = orderResponse.data || orderResponse;
        setOrder(orderData);

        // Check eligibility
        const eligibilityResponse =
          await returnsAPI.checkReturnEligibility(orderId);
        const eligibilityData = eligibilityResponse.data || eligibilityResponse;
        setEligibility(eligibilityData);

        // Initialize selected items with zero quantities
        if (orderData.orderItems) {
          setSelectedItems(
            orderData.orderItems.map(item => ({
              orderItemId: item.id,
              quantityToReturn: 0,
              itemCondition: '',
            }))
          );
        }
      } catch (err) {
        console.error('❌ Failed to fetch order or eligibility:', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to load order information'
        );
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchData();
    }
  }, [orderId]);

  // Handle item selection toggle
  const handleItemQuantityChange = (orderItemId, quantity) => {
    setSelectedItems(prev =>
      prev.map(item =>
        item.orderItemId === orderItemId
          ? { ...item, quantityToReturn: parseInt(quantity) || 0 }
          : item
      )
    );
    // Clear validation error for this field
    if (formErrors.items) {
      setFormErrors(prev => ({ ...prev, items: null }));
    }
  };

  // Handle item condition change
  const handleItemConditionChange = (orderItemId, condition) => {
    setSelectedItems(prev =>
      prev.map(item =>
        item.orderItemId === orderItemId
          ? { ...item, itemCondition: condition }
          : item
      )
    );
  };

  // Calculate total refund estimate
  const calculateRefundEstimate = () => {
    if (!order || !selectedItems) return 0;

    const itemsRefund = selectedItems.reduce((total, selectedItem) => {
      const orderItem = order.orderItems.find(
        item => item.id === selectedItem.orderItemId
      );
      if (orderItem && selectedItem.quantityToReturn > 0) {
        return total + orderItem.unitPrice * selectedItem.quantityToReturn;
      }
      return total;
    }, 0);

    // Check if returning all items (full return) - include shipping
    const allItemsReturned = order.orderItems.every(orderItem => {
      const selectedItem = selectedItems.find(
        item => item.orderItemId === orderItem.id
      );
      return (
        selectedItem && selectedItem.quantityToReturn === orderItem.quantity
      );
    });

    const shippingRefund = allItemsReturned ? order.shippingCost || 0 : 0;

    return itemsRefund + shippingRefund;
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    // Check if at least one item is selected
    const hasSelectedItems = selectedItems.some(
      item => item.quantityToReturn > 0
    );
    if (!hasSelectedItems) {
      errors.items = 'Please select at least one item to return';
    }

    // Check quantities don't exceed available
    selectedItems.forEach(selectedItem => {
      if (selectedItem.quantityToReturn > 0) {
        const orderItem = order.orderItems.find(
          item => item.id === selectedItem.orderItemId
        );
        if (orderItem && selectedItem.quantityToReturn > orderItem.quantity) {
          errors.items = 'Return quantity cannot exceed order quantity';
        }
      }
    });

    // Reason required
    if (!reason) {
      errors.reason = 'Please select a return reason';
    }

    // Description required and length validation
    if (!description.trim()) {
      errors.description = 'Please provide a description';
    } else if (description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    } else if (description.trim().length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Filter out items with zero quantity
      const itemsToReturn = selectedItems
        .filter(item => item.quantityToReturn > 0)
        .map(item => ({
          orderItemId: item.orderItemId,
          quantityToReturn: item.quantityToReturn,
          itemCondition: item.itemCondition || undefined,
        }));

      const returnData = {
        orderId,
        reason,
        description: description.trim(),
        items: itemsToReturn,
      };

      const response = await returnsAPI.createReturn(returnData);
      const createdReturn = response.data || response;

      // Navigate to return details page
      navigate(`/returns/${createdReturn.id}`, {
        state: { message: 'Return request submitted successfully!' },
      });
    } catch (err) {
      console.error('❌ Failed to create return:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to submit return request'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Not eligible
  if (eligibility && !eligibility.isEligible) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Order
          </button>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mr-4 flex-shrink-0" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Return Not Available
                  </h1>
                  <p className="text-gray-600 mb-4">{eligibility.reason}</p>
                  <button
                    onClick={() => navigate(`/orders/${orderId}`)}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    View Order Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => navigate(`/orders/${orderId}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Order
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-purple-600 text-white">
            <h1 className="text-2xl font-bold">Request Return</h1>
            <p className="text-purple-100 mt-1">Order #{order?.orderNumber}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Select Items */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Select Items to Return
              </h2>
              {formErrors.items && (
                <p className="text-sm text-red-600 mb-2">{formErrors.items}</p>
              )}

              <div className="space-y-4">
                {order?.orderItems?.map(item => {
                  const selectedItem = selectedItems.find(
                    si => si.orderItemId === item.id
                  );
                  return (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start space-x-4">
                        {item.productImageUrl && (
                          <img
                            src={item.productImageUrl}
                            alt={item.productName}
                            className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900">
                            {item.productName}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Price: ${item.unitPrice.toFixed(2)} ×{' '}
                            {item.quantity} = $
                            {(item.unitPrice * item.quantity).toFixed(2)}
                          </p>

                          <div className="mt-3 grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity to Return
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={item.quantity}
                                value={selectedItem?.quantityToReturn || 0}
                                onChange={e =>
                                  handleItemQuantityChange(
                                    item.id,
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Max: {item.quantity}
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Item Condition (Optional)
                              </label>
                              <input
                                type="text"
                                value={selectedItem?.itemCondition || ''}
                                onChange={e =>
                                  handleItemConditionChange(
                                    item.id,
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., Unopened, Used"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Return Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Return <span className="text-red-500">*</span>
              </label>
              <select
                value={reason}
                onChange={e => {
                  setReason(e.target.value);
                  setFormErrors(prev => ({ ...prev, reason: null }));
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  formErrors.reason ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- Select a reason --</option>
                {RETURN_REASONS.map(r => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {formErrors.reason && (
                <p className="text-sm text-red-600 mt-1">{formErrors.reason}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  setFormErrors(prev => ({ ...prev, description: null }));
                }}
                placeholder="Please provide details about why you're returning this item (10-1000 characters)"
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  formErrors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {formErrors.description && (
                  <p className="text-sm text-red-600">
                    {formErrors.description}
                  </p>
                )}
                <p
                  className={`text-sm ml-auto ${description.length < 10 || description.length > 1000 ? 'text-red-600' : 'text-gray-500'}`}
                >
                  {description.length} / 1000 characters
                </p>
              </div>
            </div>

            {/* Refund Estimate */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Estimated Refund
              </h3>
              <p className="text-2xl font-bold text-purple-600">
                ${calculateRefundEstimate().toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Refund will be processed to your original payment method after
                return is approved and items are received.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(`/orders/${orderId}`)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Return Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReturnRequestPage;
