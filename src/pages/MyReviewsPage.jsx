import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import Paginator from '../components/ui/Paginator';
import StarRating from '../components/ui/StarRating';
import bffClient from '../api/bffClient';
import { API_ENDPOINTS } from '../api/endpoints';
import { toast } from 'react-toastify';

function MyReviewsPage() {
  const navigate = useNavigate();

  // State management
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const reviewsPerPage = 10;

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'rating', label: 'Highest Rating' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Reviews' },
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
    { value: 'rejected', label: 'Rejected' },
  ];

  // Fetch reviews from API
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: reviewsPerPage.toString(),
        sort: sortBy,
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await bffClient.get(
        `${API_ENDPOINTS.REVIEWS.MY}?${params.toString()}`
      );

      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        setReviews(data.reviews || []);
        setTotalReviews(data.pagination?.total || 0);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        setReviews([]);
        setTotalReviews(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError(err.message || 'Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, statusFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle delete review
  const handleDeleteReview = async reviewId => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    setDeletingReviewId(reviewId);

    try {
      await bffClient.delete(API_ENDPOINTS.REVIEWS.DELETE(reviewId));
      toast.success('Review deleted successfully');
      fetchReviews();
    } catch (err) {
      console.error('Failed to delete review:', err);
      toast.error(err.message || 'Failed to delete review');
    } finally {
      setDeletingReviewId(null);
    }
  };

  // Filter reviews by search term (client-side)
  const filteredReviews = reviews.filter(review => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      review.title?.toLowerCase().includes(searchLower) ||
      review.comment?.toLowerCase().includes(searchLower) ||
      review.productName?.toLowerCase().includes(searchLower)
    );
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (sortDropdownOpen && !event.target.closest('.sort-dropdown')) {
        setSortDropdownOpen(false);
      }
      if (statusDropdownOpen && !event.target.closest('.status-dropdown')) {
        setStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortDropdownOpen, statusDropdownOpen]);

  const handlePageChange = page => {
    setCurrentPage(page);
  };

  // Get status badge color
  const getStatusBadge = status => {
    const statusConfig = {
      approved: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-300',
        label: 'Approved',
      },
      pending: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-300',
        label: 'Pending',
      },
      rejected: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-300',
        label: 'Rejected',
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  // Format date
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-white dark:bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-purple-50/50 dark:from-blue-900/20 dark:via-indigo-900/15 dark:to-purple-900/20" />
        <div className="relative flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Loading your reviews...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen bg-white dark:bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-purple-50/50 dark:from-blue-900/20 dark:via-indigo-900/15 dark:to-purple-900/20" />
        <div className="relative flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <svg
                className="h-12 w-12 text-red-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                Failed to Load Reviews
              </h3>
              <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
              <button
                onClick={fetchReviews}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-purple-50/50 dark:from-blue-900/20 dark:via-indigo-900/15 dark:to-purple-900/20" />
      <div className="absolute -inset-y-8 inset-x-0 bg-gradient-to-b from-indigo-50/20 via-transparent to-indigo-50/20 dark:from-indigo-900/5 dark:to-indigo-900/5" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/account')}
          className="mb-6 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-200"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="font-medium">Back to Account</span>
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-12"></div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 uppercase tracking-wide">
              Your Reviews
            </span>
            <div className="h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-12"></div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-4">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
              My
            </span>{' '}
            <span className="text-gray-900 dark:text-white">Reviews</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all the reviews you've written for products
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search reviews by title, content, or product name..."
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
            />
          </div>
        </div>

        {/* Filters and Sort Bar */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            {/* Status Filter */}
            <div className="relative status-dropdown w-full sm:w-auto">
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="flex items-center justify-between sm:justify-start space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors w-full sm:w-auto"
              >
                <span className="text-left">
                  Status:{' '}
                  {statusOptions.find(opt => opt.value === statusFilter)
                    ?.label || 'All Reviews'}
                </span>
                <ChevronDownIcon
                  className={`h-4 w-4 flex-shrink-0 transition-transform ${
                    statusDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {statusDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="py-2">
                    {statusOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setStatusFilter(option.value);
                          setStatusDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          statusFilter === option.value
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative sort-dropdown w-full sm:w-auto">
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="flex items-center justify-between sm:justify-start space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors w-full sm:w-auto"
              >
                <span className="text-left">
                  Sort:{' '}
                  {sortOptions.find(opt => opt.value === sortBy)?.label ||
                    'Newest First'}
                </span>
                <ChevronDownIcon
                  className={`h-4 w-4 flex-shrink-0 transition-transform ${
                    sortDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {sortDropdownOpen && (
                <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="py-2">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setSortDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          sortBy === option.value
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'} found
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {filteredReviews.map(review => (
            <div
              key={review._id || review.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-6">
                {/* Review Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  {/* Product Info */}
                  <div className="flex items-start gap-4">
                    {review.productImage ? (
                      <img
                        src={review.productImage}
                        alt={review.productName}
                        className="w-16 h-16 object-cover rounded-md bg-gray-100 dark:bg-gray-700 flex-shrink-0"
                        onError={e => {
                          e.target.onerror = null;
                          e.target.src =
                            'https://via.placeholder.com/64?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700 text-gray-400 text-xs flex-shrink-0">
                        No Image
                      </div>
                    )}
                    <div>
                      <Link
                        to={`/products/${review.productId}`}
                        className="text-base font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {review.productName || 'Product'}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating
                          rating={review.rating}
                          size="w-4 h-4"
                          spacing="space-x-0.5"
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {review.rating}/5
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Reviewed on {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {getStatusBadge(review.status)}
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/products/${review.productId}/write-review?edit=${review._id || review.id}`}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="Edit review"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() =>
                          handleDeleteReview(review._id || review.id)
                        }
                        disabled={
                          deletingReviewId === (review._id || review.id)
                        }
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                        title="Delete review"
                      >
                        {deletingReviewId === (review._id || review.id) ? (
                          <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  {review.title && (
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {review.title}
                    </h3>
                  )}
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {review.comment || review.content || 'No comment provided.'}
                  </p>

                  {/* Review Stats */}
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                    {review.isVerifiedPurchase && (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verified Purchase
                      </span>
                    )}
                    {review.helpfulVotes && (
                      <span>
                        {review.helpfulVotes.helpful || 0} found helpful
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Paginator
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Empty State */}
        {reviews.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <StarIcon className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No reviews yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You haven't written any reviews yet. Start sharing your
              experience!
            </p>
            <div className="mt-6">
              <Link
                to="/account/orders"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Your Orders
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyReviewsPage;
