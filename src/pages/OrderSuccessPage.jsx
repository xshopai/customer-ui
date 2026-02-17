import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearCartAsync } from '../store/slices/cartSlice';
import {
  CheckCircleIcon,
  TruckIcon,
  EnvelopeIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const orderData = location.state;

  // Track if cart clear has been attempted to avoid duplicate calls
  const cartCleared = useRef(false);

  useEffect(() => {
    // Redirect to home if no order data
    if (!orderData) {
      navigate('/');
    } else if (!cartCleared.current) {
      // Clear cart from backend (Redis) as a defensive measure
      // This ensures cart is cleared even if the CheckoutPage clear failed
      cartCleared.current = true;
      dispatch(clearCartAsync()).catch(err => {
        console.warn('Failed to clear cart on success page:', err);
      });
    }
  }, [orderData, navigate, dispatch]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!orderData) {
    return null;
  }

  const { orderNumber, items = [], total, deliveryAddress } = orderData;
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

  return (
    <div className="relative bg-white dark:bg-gray-900 min-h-screen">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-green-50/60 via-emerald-50/30 to-teal-50/50 dark:from-green-900/20 dark:via-emerald-900/15 dark:to-teal-900/20 -z-10" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Thank you for your order
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 mb-6">
          {/* Order Number */}
          <div className="text-center mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Order Number
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {orderNumber}
            </p>
          </div>

          {/* Info Sections */}
          <div className="space-y-6">
            {/* Confirmation Email */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <EnvelopeIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Order Confirmation Sent
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  A confirmation email has been sent to{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {deliveryAddress.email}
                  </span>
                </p>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <TruckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Estimated Delivery
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {estimatedDelivery.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {deliveryAddress.fullName}
                  </p>
                  <p>{deliveryAddress.addressLine1}</p>
                  {deliveryAddress.addressLine2 && (
                    <p>{deliveryAddress.addressLine2}</p>
                  )}
                  <p>
                    {deliveryAddress.city}, {deliveryAddress.postcode}
                  </p>
                  <p>{deliveryAddress.country}</p>
                </div>
              </div>
            </div>

            {/* Order Total */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  £
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Order Total
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  £{total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        {items.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Order Items
            </h3>
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg bg-gray-100 dark:bg-gray-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    £{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What's Next */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            What happens next?
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                1.
              </span>
              <span>
                You'll receive an order confirmation email with all the details
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                2.
              </span>
              <span>
                We'll send you a shipping confirmation with tracking information
                when your order is dispatched
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                3.
              </span>
              <span>Your order will arrive within 3-5 business days</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/"
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <HomeIcon className="h-5 w-5" />
            Continue Shopping
          </Link>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Print Receipt
          </button>
        </div>

        {/* Support Message */}
        <div className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
          <p>
            Need help with your order?{' '}
            <Link
              to="/contact"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
