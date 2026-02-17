import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import returnsAPI from '../api/returnsAPI';

// Status badge colors
const STATUS_COLORS = {
  Requested: 'bg-blue-100 text-blue-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  ItemsReceived: 'bg-yellow-100 text-yellow-800',
  Inspecting: 'bg-purple-100 text-purple-800',
  Completed: 'bg-indigo-100 text-indigo-800',
  RefundProcessed: 'bg-green-100 text-green-800',
};

// Status icons
const STATUS_ICONS = {
  Requested: ClockIcon,
  Approved: CheckCircleIcon,
  Rejected: XCircleIcon,
  ItemsReceived: TruckIcon,
  Inspecting: ClockIcon,
  Completed: CheckCircleIcon,
  RefundProcessed: CheckCircleIcon,
};

const ReturnDetailsPage = () => {
  const { returnId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // successMessage is set from navigation state, not updated
  // eslint-disable-next-line no-unused-vars
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || null
  );

  const fetchReturn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await returnsAPI.getReturnById(returnId);
      const data = response.data || response;
      setReturnData(data);
    } catch (err) {
      console.error('❌ Failed to fetch return:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load return details'
      );
    } finally {
      setLoading(false);
    }
  }, [returnId]);

  useEffect(() => {
    fetchReturn();
  }, [fetchReturn]);

  // Format date
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status icon
  const getStatusIcon = status => {
    const Icon = STATUS_ICONS[status] || ClockIcon;
    return Icon;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => navigate('/returns')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Returns
          </button>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error Loading Return
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchReturn}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(returnData.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => navigate('/returns')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Returns
        </button>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start mb-6">
            <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Return Status Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 bg-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  Return #{returnData.returnNumber}
                </h1>
                <p className="text-purple-100 mt-1">
                  Order #{returnData.orderNumber}
                </p>
              </div>
              <StatusIcon className="h-12 w-12" />
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <span
                className={`px-4 py-2 rounded-full text-lg font-medium ${STATUS_COLORS[returnData.status] || 'bg-gray-100 text-gray-800'}`}
              >
                {returnData.status}
              </span>
              <div className="text-right">
                <p className="text-sm text-gray-500">Requested</p>
                <p className="font-medium text-gray-900">
                  {formatDate(returnData.createdAt)}
                </p>
              </div>
            </div>

            {/* Reason */}
            <div className="border-t border-gray-200 pt-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Return Reason
              </h3>
              <p className="text-gray-700">{returnData.reason}</p>
            </div>

            {/* Description */}
            <div className="border-t border-gray-200 pt-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{returnData.description}</p>
            </div>

            {/* Rejection Reason */}
            {returnData.status === 'Rejected' && returnData.rejectionReason && (
              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">
                    Rejection Reason
                  </h3>
                  <p className="text-red-800">{returnData.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Approved/Processed Info */}
            {returnData.approvedAt && (
              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">
                    Return Approved
                  </h3>
                  <p className="text-green-800">
                    Approved on {formatDate(returnData.approvedAt)}
                    {returnData.approvedBy && ` by ${returnData.approvedBy}`}
                  </p>
                  {returnData.notes && (
                    <p className="text-sm text-green-700 mt-2">
                      Note: {returnData.notes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Return Items */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Return Items
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {returnData.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 pb-4 border-b border-gray-200 last:border-b-0"
                >
                  {item.productImageUrl && (
                    <img
                      src={item.productImageUrl}
                      alt={item.productName}
                      className="w-24 h-24 object-cover rounded-md flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {item.productName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Unit Price: ${item.unitPrice.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantityToReturn}
                    </p>
                    {item.itemCondition && (
                      <p className="text-sm text-gray-600">
                        Condition: {item.itemCondition}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-gray-900 mt-2">
                      Refund: ${item.refundAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Refund Summary */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Refund Summary
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Items Refund</span>
                <span className="font-medium text-gray-900">
                  ${returnData.itemsRefundAmount.toFixed(2)}
                </span>
              </div>
              {returnData.shippingRefundAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Shipping Refund</span>
                  <span className="font-medium text-gray-900">
                    ${returnData.shippingRefundAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">
                  Total Refund
                </span>
                <span className="text-2xl font-bold text-green-600">
                  ${returnData.totalRefundAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {returnData.status === 'RefundProcessed' &&
              returnData.refundProcessedAt && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800">
                    ✓ Refund processed on{' '}
                    {formatDate(returnData.refundProcessedAt)}
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Refund will appear in your original payment method within
                    5-10 business days.
                  </p>
                </div>
              )}
          </div>
        </div>

        {/* Return Timeline */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Return Timeline
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Created */}
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">Return Requested</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(returnData.createdAt)}
                  </p>
                </div>
              </div>

              {/* Approved */}
              {returnData.approvedAt && (
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Return Approved</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(returnData.approvedAt)}
                    </p>
                    {returnData.approvedBy && (
                      <p className="text-sm text-gray-600">
                        by {returnData.approvedBy}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Items Received */}
              {returnData.itemsReceivedAt && (
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Items Received</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(returnData.itemsReceivedAt)}
                    </p>
                  </div>
                </div>
              )}

              {/* Completed */}
              {returnData.completedAt && (
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">
                      Return Completed
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(returnData.completedAt)}
                    </p>
                    {returnData.processedBy && (
                      <p className="text-sm text-gray-600">
                        by {returnData.processedBy}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Refund Processed */}
              {returnData.refundProcessedAt && (
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">
                      Refund Processed
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(returnData.refundProcessedAt)}
                    </p>
                  </div>
                </div>
              )}

              {/* Rejected */}
              {returnData.status === 'Rejected' && returnData.rejectedAt && (
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <XCircleIcon className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Return Rejected</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(returnData.rejectedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => navigate(`/orders/${returnData.orderId}`)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            View Original Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnDetailsPage;
