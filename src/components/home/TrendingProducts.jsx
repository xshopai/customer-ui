import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBadgeStyles } from '../../utils/productHelpers';
import { useHomeData } from '../../hooks/useHomeData';
import StarRating from '../ui/StarRating';

const TrendingProducts = () => {
  const navigate = useNavigate();
  const { data, isLoading: loading, error } = useHomeData(4, 5);

  const products = data?.trendingProducts || [];

  const handleViewDetails = productLink => {
    navigate(productLink);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="relative bg-gray-100 dark:bg-gray-800 py-16 sm:py-20">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/50 dark:from-indigo-900/20 dark:via-purple-900/15 dark:to-pink-900/20" />
      {/* Connecting gradient for flow */}
      <div className="absolute -inset-y-8 inset-x-0 bg-gradient-to-b from-purple-50/20 via-transparent to-purple-50/20 dark:from-purple-900/5 dark:to-purple-900/5" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-12"></div>
            <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full px-4 py-2">
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                Featured
              </span>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-12"></div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
              Trending
            </span>{' '}
            <span className="text-gray-900 dark:text-white">Products</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Discover what's popular right now. Hand-picked products that our
            customers love most.
          </p>
          <Link
            to="/products?page=1&limit=12"
            className="inline-flex items-center gap-x-2 text-sm font-semibold leading-6 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
          >
            See all products
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
              />
            </svg>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">
              Unable to load trending products. Please try again later.
            </p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-4">
            {products.map(product => (
              <article
                key={product.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => handleViewDetails(product.link)}
              >
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={e => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src =
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop';
                    }}
                  />
                  {/* Badge */}
                  <div className="absolute left-4 top-4">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10 ${getBadgeStyles(product.badge)}`}
                    >
                      {product.badge}
                    </span>
                  </div>
                  {/* Price Badge */}
                  <div className="absolute right-4 top-4">
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-2 py-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        ${product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400 line-through">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-x-4 text-xs">
                    {product.category && (
                      <div className="text-gray-500 dark:text-gray-400">
                        {product.category}
                      </div>
                    )}
                    {product.rating > 0 && (
                      <div className="flex items-center gap-x-1">
                        <StarRating
                          rating={product.rating}
                          size="w-4 h-4"
                          spacing="space-x-0"
                        />
                        <span className="ml-1 text-gray-600 dark:text-gray-300">
                          ({product.rating})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Title with fixed height */}
                  <div className="flex-1">
                    <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </div>

                  {/* Color Swatches - only show if colors available */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="mt-4 flex gap-2">
                      {product.colors.map(color => (
                        <button
                          key={color.name}
                          className="h-6 w-6 rounded-full border-2 transition-all hover:scale-110 border-gray-300 dark:border-gray-600 hover:border-gray-400"
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* No Products State */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No trending products available at the moment.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TrendingProducts;
