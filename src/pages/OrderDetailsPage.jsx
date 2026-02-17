import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import OrderProgressBar from '../components/ui/OrderProgressBar';
import OrderTrackingTimeline from '../components/ui/OrderTrackingTimeline';
import ordersAPI from '../api/ordersAPI';
import returnsAPI from '../api/returnsAPI';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState(null);
  const [returnEligibility, setReturnEligibility] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);

        // Debug: Check authentication
        const token = localStorage.getItem('accessToken');
        console.log('🔑 Has token:', !!token);

        const response = await ordersAPI.getOrderById(orderId);
        console.log('📦 Order details fetched:', response);

        // Extract order data - handle both wrapped and unwrapped responses
        const orderData = response.data || response;
        setOrder(orderData);
        setError(null);

        // Fetch tracking information if order has been shipped
        if (
          orderData.shippingStatus === 'Shipped' ||
          orderData.status === 'Shipped' ||
          orderData.trackingNumber
        ) {
          try {
            const trackingResponse = await ordersAPI.getOrderTracking(orderId);
            const trackingData = trackingResponse.data || trackingResponse;
            setTracking(trackingData);
            console.log('📦 Order tracking fetched:', trackingData);
          } catch (trackingErr) {
            console.warn(
              '⚠️ Failed to fetch tracking (non-critical):',
              trackingErr
            );
            // Don't set error - tracking is optional
          }
        }

        // Check return eligibility if order is delivered
        if (orderData.status === 'Delivered') {
          try {
            setCheckingEligibility(true);
            const eligibilityResponse =
              await returnsAPI.checkReturnEligibility(orderId);
            const eligibilityData =
              eligibilityResponse.data || eligibilityResponse;
            setReturnEligibility(eligibilityData);
            console.log('📦 Return eligibility:', eligibilityData);
          } catch (eligibilityErr) {
            console.warn(
              '⚠️ Failed to check return eligibility:',
              eligibilityErr
            );
            // Don't set error - eligibility check is optional
          } finally {
            setCheckingEligibility(false);
          }
        }
      } catch (err) {
        console.error('❌ Failed to fetch order:', err);
        console.error('❌ Error response:', err.response?.data);
        setError(err.message || 'Failed to load order');
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Check if order can be cancelled
  const canCancelOrder = () => {
    if (!order) return false;
    const status = order.status?.toLowerCase();
    // Can cancel if not already cancelled, delivered, or refunded
    return !['cancelled', 'delivered', 'refunded'].includes(status);
  };

  // Handle cancel order
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Please provide a cancellation reason');
      return;
    }

    if (cancelReason.trim().length < 5) {
      setCancelError('Cancellation reason must be at least 5 characters');
      return;
    }

    try {
      setCancelling(true);
      setCancelError(null);

      // Call API to cancel order
      await ordersAPI.cancelOrder(orderId, {
        cancellationReason: cancelReason.trim(),
      });

      // Refetch order to get updated status
      const response = await ordersAPI.getOrderById(orderId);
      const orderData = response.data || response;
      setOrder(orderData);

      // Close dialog
      setShowCancelDialog(false);
      setCancelReason('');

      // Show success message (you could add a toast notification here)
      console.log('Order cancelled successfully');
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setCancelError(
        err.response?.data?.message ||
          err.message ||
          'Failed to cancel order. Please try again.'
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {error ? 'Error Loading Order' : 'Order not found'}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error || "The order you're looking for doesn't exist."}
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => navigate('/account/orders')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              View All Orders
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-purple-50/50 dark:from-blue-900/20 dark:via-indigo-900/15 dark:to-purple-900/20" />
      {/* Connecting gradient for flow */}
      <div className="absolute -inset-y-8 inset-x-0 bg-gradient-to-b from-indigo-50/20 via-transparent to-indigo-50/20 dark:from-indigo-900/5 dark:to-indigo-900/5" />

      <div className="relative max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/account/orders')}
          className="mb-6 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-200"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="font-medium">Back to Orders</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Order {order.orderNumber || order.id}
            </h1>
            <div className="flex gap-3">
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                View invoice →
              </button>
              {returnEligibility?.isEligible && (
                <button
                  onClick={() => navigate(`/returns/request/${orderId}`)}
                  className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 border border-purple-600 dark:border-purple-400 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors inline-flex items-center gap-2"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Request Return
                </button>
              )}
              {canCancelOrder() && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-600 dark:border-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Order placed{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </span>
          </p>
        </div>

        {/* Main Container */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {/* Order Items Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-6">
              {order.items?.map((item, index) => (
                <div key={item.id}>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {item.productImageUrl ? (
                        <img
                          src={item.productImageUrl}
                          alt={item.productName}
                          className="w-24 h-24 rounded-lg object-cover bg-gray-100 dark:bg-gray-700"
                          onError={e => {
                            e.target.onerror = null;
                            e.target.src =
                              'https://via.placeholder.com/96?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        ${item.unitPrice?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                  {index < order.items.length - 1 && (
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700"></div>
                  )}
                </div>
              )) || <p className="text-gray-500">No items found</p>}
            </div>
          </div>

          {/* Order Progress Section */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Order Status: {order.status}
            </p>

            {/* Progress Bar */}
            <OrderProgressBar status={order.status} />

            {/* Tracking Information */}
            {tracking && tracking.trackingNumber && (
              <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <TruckIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Shipment Tracking
                  </h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Carrier:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {tracking.carrierName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Tracking Number:
                    </span>
                    {tracking.trackingUrl ? (
                      <a
                        href={tracking.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {tracking.trackingNumber} →
                      </a>
                    ) : (
                      <span className="font-medium text-gray-900 dark:text-white">
                        {tracking.trackingNumber}
                      </span>
                    )}
                  </div>
                  {tracking.estimatedDeliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Estimated Delivery:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(
                          tracking.estimatedDeliveryDate
                        ).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tracking Timeline */}
                {tracking.timeline && tracking.timeline.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Shipment History
                    </h4>
                    <OrderTrackingTimeline timeline={tracking.timeline} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Three Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
            {/* Delivery Address */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Shipping address
              </h3>
              {order.shippingAddress ? (
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && (
                    <p>{order.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.zipCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No address provided</p>
              )}

              {(order.customerName ||
                order.customerEmail ||
                order.customerPhone) && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Contact information
                  </h4>
                  {order.customerName && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.customerName}
                    </p>
                  )}
                  {order.customerEmail && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.customerEmail}
                    </p>
                  )}
                  {order.customerPhone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.customerPhone}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Payment Information */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Payment information
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Payment Status: {order.paymentStatus || 'Pending'}</p>
                <p className="mt-2">
                  Shipping Status: {order.shippingStatus || 'Pending'}
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Billing address
              </h3>
              {order.billingAddress ? (
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5 mb-6">
                  <p>{order.billingAddress.addressLine1}</p>
                  {order.billingAddress.addressLine2 && (
                    <p>{order.billingAddress.addressLine2}</p>
                  )}
                  <p>
                    {order.billingAddress.city}, {order.billingAddress.state}{' '}
                    {order.billingAddress.zipCode}
                  </p>
                  <p>{order.billingAddress.country}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-6">
                  Same as shipping address
                </p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Subtotal
                  </span>
                  <span className="text-gray-900 dark:text-white text-right">
                    ${order.subtotal?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Shipping
                  </span>
                  <span className="text-gray-900 dark:text-white text-right">
                    ${order.shippingCost?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="text-gray-900 dark:text-white text-right">
                    ${order.taxAmount?.toFixed(2) || '0.00'}
                  </span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Discount
                    </span>
                    <span className="text-green-600 dark:text-green-400 text-right">
                      -${order.discountAmount?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Order total
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-right">
                      ${order.totalAmount?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cancel Order
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Order #{order.orderNumber}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Are you sure you want to cancel this order? This action cannot
                be undone. If payment was processed, you'll receive a refund
                within 5-7 business days.
              </p>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for cancellation *
              </label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                rows="3"
                placeholder="Please provide a reason for cancelling this order (minimum 5 characters)"
                maxLength="500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {cancelReason.length}/500 characters
              </p>

              {cancelError && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {cancelError}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelReason('');
                  setCancelError(null);
                }}
                disabled={cancelling}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling || !cancelReason.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;
