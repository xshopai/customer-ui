import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
  addToCartAsync,
  removeFromCartAsync,
  openCart,
} from '../store/slices/cartSlice';
import StarRating from '../components/ui/StarRating';
import bffClient from '../api/bffClient';
import { convertColorsToObjects } from '../utils/productHelpers';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart.items);

  // Sample product data (in real app, this would come from API)
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [variantInventory, setVariantInventory] = useState(null);
  // Removed activeTab state - using separate sections instead
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());

  // Helper function to look up variant SKU from product variants array
  const getVariantSku = (colorName, sizeName) => {
    if (!product?.variants || product.variants.length === 0) {
      return null;
    }
    // Handle products with both colors and sizes
    if (colorName && sizeName) {
      const variant = product.variants.find(
        v =>
          v.color?.toLowerCase() === colorName.toLowerCase() &&
          v.size?.toLowerCase() === sizeName.toLowerCase()
      );
      return variant?.sku || null;
    }
    // Handle products with sizes only (e.g., books: Paperback/Hardcover)
    if (sizeName && !colorName) {
      const variant = product.variants.find(
        v => !v.color && v.size?.toLowerCase() === sizeName.toLowerCase()
      );
      return variant?.sku || null;
    }
    // Handle products with colors only
    if (colorName && !sizeName) {
      const variant = product.variants.find(
        v => v.color?.toLowerCase() === colorName.toLowerCase() && !v.size
      );
      return variant?.sku || null;
    }
    return null;
  };

  // Helper function to check if specific variant is in cart
  const isInCart = () => {
    if (!product?.sku) return false;

    const hasColors = product.colors?.length > 0;
    const hasSizes = product.sizes?.length > 0;

    if (hasColors && selectedColor === null) return false;
    if (hasSizes && !selectedSize) return false;

    const color = hasColors ? product.colors[selectedColor]?.name : null;

    // Use variant SKU from product data
    const variantSku = getVariantSku(color, selectedSize);
    if (!variantSku) return false;
    return cartItems.some(item => item.sku === variantSku);
  };

  // Helper function to check if product is in favorites
  const isFavorite = productId => {
    return favorites.has(productId);
  };

  // Helper function to calculate star percentage for review summary
  const getStarPercentage = starRating => {
    // First check if we have any reviews at all
    const totalReviews =
      product?.ratingDetails?.totalReviews ||
      product?.ratingDetails?.total_review_count ||
      product?.reviewCount ||
      0;

    if (totalReviews === 0) {
      return 0;
    }

    // Get rating distribution from product data
    const distribution =
      product?.ratingDetails?.ratingDistribution ||
      product?.ratingDetails?.rating_distribution;

    if (!distribution) {
      return 0;
    }

    // Handle both camelCase and snake_case keys
    const countForRating =
      distribution[starRating] ||
      distribution[`${starRating}_star`] ||
      distribution[`${starRating}star`] ||
      0;

    return Math.round((countForRating / totalReviews) * 100);
  };

  // Handler for toggling favorite status
  const handleToggleFavorite = () => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(product.id)) {
      newFavorites.delete(product.id);
    } else {
      newFavorites.add(product.id);
    }
    setFavorites(newFavorites);

    // Here you could also dispatch to Redux store or make API call
    // Example: dispatch(toggleFavorite(product.id));
  };

  // Fetch product data from API
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await bffClient.get(`/api/products/${productId}`);

        if (response.data.success) {
          const p = response.data.data;
          console.log('Product details response:', p);

          // Extract rating information from the aggregated response
          // Handle both camelCase (API) and snake_case (database) formats
          const ratingDetails = p.ratingDetails || p.review_aggregates;
          const rating =
            ratingDetails?.averageRating ||
            ratingDetails?.average_rating ||
            p.average_rating ||
            0;
          const reviewCount =
            ratingDetails?.totalReviews ||
            ratingDetails?.total_review_count ||
            p.num_reviews ||
            0;

          // Fetch reviews separately from the reviews endpoint
          let reviews = [];
          let reviewsRatingDetails = null;
          try {
            const reviewsResponse = await bffClient.get(
              `/api/products/${productId}/reviews`,
              {
                params: {
                  limit: 10, // Get top 10 reviews for product detail page
                  sort: 'recent',
                },
              }
            );
            reviews = reviewsResponse.data?.data?.reviews || [];
            // Get rating details from reviews endpoint (always fresh)
            reviewsRatingDetails = reviewsResponse.data?.data?.ratingDetails;
            console.log('Fetched reviews:', reviews);
            console.log('Reviews rating details:', reviewsRatingDetails);
          } catch (reviewError) {
            console.error('Error fetching reviews:', reviewError);
            // Continue without reviews - don't fail the product page load
          }

          // Use ratingDetails from reviews endpoint (most accurate), fallback to product data
          const finalRatingDetails = reviewsRatingDetails || ratingDetails;
          const finalRating = finalRatingDetails?.averageRating || rating;
          const finalReviewCount =
            finalRatingDetails?.totalReviews || reviewCount;

          console.log('Extracted rating data:', {
            rating: finalRating,
            reviewCount: finalReviewCount,
            reviews: reviews.length,
            ratingDetails: finalRatingDetails,
          });

          // Transform API product to match frontend format
          const productData = {
            id: p.id,
            sku: p.sku,
            name: p.name,
            description: p.description,
            price: p.price,
            brand: p.brand,
            images:
              p.images && p.images.length > 0
                ? p.images
                : ['https://via.placeholder.com/800'],
            rating: finalRating,
            reviewCount: finalReviewCount,
            reviewsData: reviews,
            ratingDetails: finalRatingDetails, // Use fresh rating details from reviews endpoint
            department: p.department,
            category: p.category,
            subcategory: p.subcategory,
            colors: convertColorsToObjects(p.colors || []),
            sizes: p.sizes || [],
            variants: p.variants || [], // Include variant SKUs from API
            specifications: p.specifications || {},
            inStock: true,
          };
          setProduct(productData);

          // Auto-select first color and size if available
          if (productData.colors?.length > 0) {
            setSelectedColor(0);
          }
          if (productData.sizes?.length > 0) {
            setSelectedSize(productData.sizes[0]);
          }
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Fetch inventory for selected variant
  useEffect(() => {
    const fetchVariantInventory = async () => {
      if (!product?.sku) {
        setVariantInventory(null);
        return;
      }

      const hasColors = product.colors?.length > 0;
      const hasSizes = product.sizes?.length > 0;

      // Need at least one selection to look up variant
      if (hasColors && selectedColor === null) {
        setVariantInventory(null);
        return;
      }
      if (hasSizes && !selectedSize) {
        setVariantInventory(null);
        return;
      }

      const color = hasColors ? product.colors[selectedColor]?.name : null;

      // Look up variant SKU from product data (not generated)
      const variantSku = getVariantSku(color, selectedSize);
      if (!variantSku) {
        console.warn('No variant found for:', { color, size: selectedSize });
        setVariantInventory({ quantityAvailable: 0 });
        return;
      }

      console.log('Fetching inventory for variant SKU:', variantSku);

      try {
        const response = await bffClient.post('/api/inventory/batch', {
          skus: [variantSku],
        });

        if (response.data.success && response.data.data.length > 0) {
          const inventory = response.data.data[0];
          console.log('Variant inventory:', inventory);
          setVariantInventory(inventory);

          // Reset quantity if it exceeds available stock
          setQuantity(prevQuantity =>
            Math.min(prevQuantity, inventory.quantityAvailable)
          );
        } else {
          setVariantInventory({ quantityAvailable: 0 });
        }
      } catch (error) {
        console.error('Error fetching variant inventory:', error);
        setVariantInventory({ quantityAvailable: 0 });
      }
    };

    fetchVariantInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    product?.sku,
    product?.colors,
    product?.variants,
    selectedColor,
    selectedSize,
  ]);

  // Handle cart actions
  const handleAddToCart = async () => {
    if (product) {
      try {
        // Get selected color and size
        const colorName =
          product.colors?.length > 0 && selectedColor !== null
            ? product.colors[selectedColor].name
            : null;
        const sizeName =
          product.sizes?.length > 0 && selectedSize ? selectedSize : null;

        // Look up variant SKU from product data
        const variantSku = getVariantSku(colorName, sizeName);

        const cartItem = {
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            sku: variantSku || product.sku, // Use variant SKU if available, else base SKU
            image: product.images[selectedImage],
            selectedColor: colorName,
            selectedSize: sizeName,
          },
          quantity: quantity,
        };

        await dispatch(addToCartAsync(cartItem)).unwrap();

        // Open cart sidebar only on desktop (lg and above)
        if (window.innerWidth >= 1024) {
          dispatch(openCart());
        }
      } catch (error) {
        console.error('Failed to add to cart:', error);
        toast.error(error.message || 'Failed to add item to cart', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    }
  };

  const handleRemoveFromCart = () => {
    if (product && selectedColor !== null && selectedSize) {
      const color = product.colors[selectedColor]?.name;
      if (!color) return;

      // Use variant SKU from product data (not generated)
      const variantSku = getVariantSku(color, selectedSize);
      if (variantSku) {
        dispatch(removeFromCartAsync(variantSku));
      }
    }
  };

  // Get reviews from product data (reviews are now embedded in the product)
  const reviews = product?.reviewsData || [];

  // Debug logging
  // console.log('Product data:', product);
  // console.log('Reviews data:', reviews);
  // console.log('Rating details:', product?.ratingDetails);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Product Not Found
          </h2>
          <button
            onClick={() => navigate('/products')}
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-indigo-50/30 to-purple-50/40 dark:from-blue-900/15 dark:via-indigo-900/10 dark:to-purple-900/15" />
      {/* Main Product Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* Image gallery */}
          <div className="flex flex-col-reverse">
            {/* Image selector */}
            <div className="hidden mt-6 w-full max-w-2xl mx-auto sm:block lg:max-w-none">
              <div className="grid grid-cols-4 gap-6">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    className={`relative h-24 bg-white dark:bg-gray-800 rounded-md flex items-center justify-center text-sm font-medium uppercase text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring focus:ring-offset-4 focus:ring-indigo-500 ${
                      index === selectedImage
                        ? 'ring-2 ring-indigo-500'
                        : 'ring-1 ring-gray-300 dark:ring-gray-600'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <span className="sr-only">Image {index + 1}</span>
                    <img
                      src={image}
                      alt=""
                      className="absolute inset-0 w-full h-full object-center object-cover rounded-md"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Main image */}
            <div className="w-full aspect-square">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-center object-cover sm:rounded-lg"
              />
            </div>
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {product.name}
            </h1>

            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
              <div className="flex items-center space-x-4">
                <p className="text-3xl tracking-tight text-gray-900 dark:text-white">
                  ${product.price}
                </p>
                {product.originalPrice && (
                  <p className="text-xl text-gray-500 dark:text-gray-400 line-through">
                    ${product.originalPrice}
                  </p>
                )}
              </div>
            </div>

            {/* Reviews */}
            <div className="mt-6">
              <h3 className="sr-only">Reviews</h3>
              <div className="flex items-center">
                <StarRating rating={product.rating} />
                <p className="sr-only">{product.rating} out of 5 stars</p>
                <a
                  href="#reviews"
                  className="ml-3 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  {product.reviewCount} reviews
                </a>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="text-base text-gray-700 dark:text-gray-300 space-y-6">
                <p>{product.description}</p>
              </div>
            </div>

            {/* Color picker */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center space-x-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white w-16">
                    Color
                  </h3>
                  <div className="flex items-center space-x-3">
                    {product.colors.map((color, colorIdx) => (
                      <label
                        key={color.name}
                        className={`relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 focus:outline-none ${
                          colorIdx === selectedColor
                            ? 'ring-2 ring-indigo-500'
                            : 'ring-1 ring-gray-300 dark:ring-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="color-choice"
                          value={color.name}
                          className="sr-only"
                          aria-labelledby={`color-choice-${colorIdx}-label`}
                          checked={colorIdx === selectedColor}
                          onChange={() => setSelectedColor(colorIdx)}
                        />
                        <span
                          id={`color-choice-${colorIdx}-label`}
                          className="sr-only"
                        >
                          {color.name}
                        </span>
                        <span
                          style={{ backgroundColor: color.value }}
                          aria-hidden="true"
                          className="h-8 w-8 rounded-full border border-black border-opacity-10"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <fieldset className="sr-only">
                  <legend>Choose a color</legend>
                </fieldset>
              </div>
            )}

            {/* Size picker */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center space-x-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white w-16">
                    Size
                  </h3>
                  <div className="grid grid-cols-5 gap-2 flex-1">
                    {product.sizes.map(size => (
                      <label
                        key={size}
                        className={`group relative flex items-center justify-center rounded-md border py-2 px-2 text-sm font-medium uppercase hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none cursor-pointer transition-all duration-200 ${
                          selectedSize === size
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="radio"
                          name="size-choice"
                          value={size}
                          className="sr-only"
                          checked={selectedSize === size}
                          onChange={() => setSelectedSize(size)}
                        />
                        <span>{size}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="mt-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center space-x-3">
                  <label
                    htmlFor="quantity"
                    className="text-sm font-medium text-gray-900 dark:text-white w-16"
                  >
                    Quantity
                  </label>
                  <select
                    id="quantity"
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value))}
                    disabled={variantInventory?.quantityAvailable === 0}
                    size="1"
                    className="min-w-[80px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base font-medium px-3 py-2 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none disabled:opacity-50 disabled:cursor-not-allowed [&>option]:py-1"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem',
                      maxHeight: '200px',
                    }}
                  >
                    {Array.from(
                      {
                        length: Math.min(
                          variantInventory?.quantityAvailable ?? 10,
                          20
                        ),
                      },
                      (_, i) => i + 1
                    ).map(num => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
                {variantInventory && (
                  <div className="text-sm">
                    {variantInventory.quantityAvailable > 0 ? (
                      <span className="text-green-600 dark:text-green-400">
                        {variantInventory.quantityAvailable} available
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">
                        Out of stock
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                {isInCart() ? (
                  <button
                    onClick={handleRemoveFromCart}
                    className="flex-1 bg-red-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    Remove from Cart
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={variantInventory?.quantityAvailable === 0}
                    className="flex-1 bg-blue-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                  >
                    Add to Cart
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`border rounded-md py-3 px-3 flex items-center justify-center transition-colors duration-200 ${
                    isFavorite(product?.id)
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-500 dark:hover:text-gray-200'
                  }`}
                >
                  <svg
                    className="h-6 w-6"
                    fill={isFavorite(product?.id) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span className="sr-only">
                    {isFavorite(product?.id)
                      ? 'Remove from favorites'
                      : 'Add to favorites'}
                  </span>
                </button>
              </div>
            </div>

            {/* Highlights */}
            {product.highlights && product.highlights.length > 0 && (
              <section aria-labelledby="details-heading" className="mt-12">
                <h2
                  id="details-heading"
                  className="text-lg font-medium text-gray-900 dark:text-white"
                >
                  Highlights
                </h2>

                <div className="mt-4 space-y-6">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <ul className="space-y-2">
                      {product.highlights.map((highlight, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Description Section */}
      <section className="relative bg-gray-50 dark:bg-gray-900 py-16 sm:py-20">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px bg-blue-300 dark:bg-blue-600 w-12"></div>
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full px-4 py-2 border border-blue-200 dark:border-blue-700">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                  Overview
                </span>
              </div>
              <div className="h-px bg-blue-300 dark:bg-blue-600 w-12"></div>
            </div>
          </div>

          {/* Description Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="prose prose-lg max-w-none text-gray-700 dark:text-gray-300 space-y-4">
              <p className="text-base leading-relaxed">
                {product.details ||
                  product.description ||
                  'No detailed description available for this product.'}
              </p>
              <p className="text-base leading-relaxed">
                This carefully curated collection represents the perfect balance
                of style, comfort, and versatility. Each piece has been
                thoughtfully designed to complement your lifestyle while
                maintaining the highest standards of quality and craftsmanship.
              </p>
              <p className="text-base leading-relaxed">
                Whether you're building a capsule wardrobe or adding essential
                pieces to your collection, this selection offers timeless appeal
                that transcends seasonal trends. The attention to detail and
                premium materials ensure long-lasting durability and comfort.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Specifications Section */}
      <section className="relative bg-white dark:bg-gray-800 py-16 sm:py-20">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px bg-blue-300 dark:bg-blue-600 w-12"></div>
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full px-4 py-2 border border-blue-200 dark:border-blue-700">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                  Tech Specs
                </span>
              </div>
              <div className="h-px bg-blue-300 dark:bg-blue-600 w-12"></div>
            </div>
          </div>

          {/* Specifications Content */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            {product.specifications &&
            Object.keys(product.specifications).length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {Object.entries(product.specifications).map(
                  ([key, value], index, array) => (
                    <div
                      key={key}
                      className={`pb-4 ${
                        index < array.length - 2
                          ? 'border-b border-gray-200 dark:border-gray-700'
                          : ''
                      }`}
                    >
                      <dt className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        {key}
                      </dt>
                      <dd className="text-sm text-gray-700 dark:text-gray-300">
                        {value}
                      </dd>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">
                No specifications available for this product.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="relative bg-gray-50 dark:bg-gray-900 py-16 sm:py-20">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px bg-blue-300 dark:bg-blue-600 w-12"></div>
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full px-4 py-2 border border-blue-200 dark:border-blue-700">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                  Reviews
                </span>
              </div>
              <div className="h-px bg-blue-300 dark:bg-blue-600 w-12"></div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Review Summary - Left Side */}
            <div className="lg:w-1/3">
              <div className="h-full bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <StarRating rating={product.rating} size="w-6 h-6" />
                    <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">
                      {product.rating} out of 5
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    {product.reviewCount?.toLocaleString() || 0} global ratings
                  </p>

                  {/* Rating Distribution */}
                  <div className="space-y-3 mb-8 flex-1">
                    {[5, 4, 3, 2, 1].map(star => {
                      const percentage = getStarPercentage(star);
                      return (
                        <div key={star} className="flex items-center">
                          <span className="text-sm text-blue-600 dark:text-blue-400 w-12 font-medium">
                            {star} star
                          </span>
                          <div className="flex-1 mx-3">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                              <div
                                className="bg-gradient-to-r from-orange-400 to-orange-500 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-8 font-medium">
                            {percentage}%
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Review this product section */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-auto">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Review this product
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Share your thoughts with other customers
                    </p>
                    <button
                      onClick={() =>
                        navigate(`/products/${product.id}/write-review`)
                      }
                      className="w-full inline-flex items-center justify-center gap-x-2 px-4 py-3 text-sm font-semibold leading-6 text-white bg-blue-600 hover:bg-blue-700 transition-colors border border-blue-600 rounded-lg hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 duration-200"
                    >
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
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                        />
                      </svg>
                      Write a customer review
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews List - Right Side */}
            <div className="lg:w-2/3">
              <div className="h-full bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Recent Reviews
                    </h3>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {Math.min(3, reviews.length)} of {reviews.length}{' '}
                      reviews
                    </span>
                  </div>

                  <div className="space-y-6 flex-1">
                    {reviews.length > 0 ? (
                      reviews.slice(0, 3).map(review => (
                        <div
                          key={review.id}
                          className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0"
                        >
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                                  {review.author?.[0] ||
                                    review.username?.[0] ||
                                    'U'}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {review.author ||
                                      review.username ||
                                      'Anonymous'}
                                    {review.isVerifiedPurchase && (
                                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                                        ✓ Verified Purchase
                                      </span>
                                    )}
                                  </h4>
                                  <div className="flex items-center mt-1">
                                    <StarRating
                                      rating={review.rating}
                                      size="w-4 h-4"
                                    />
                                    <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                      {review.date ||
                                        new Date(
                                          review.createdAt
                                        ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3">
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {review.comment}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 dark:text-gray-500 mb-4">
                          <svg
                            className="w-12 h-12 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z"
                            />
                          </svg>
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No reviews yet
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Be the first to share your thoughts about this
                          product.
                        </p>
                        <button
                          onClick={() =>
                            navigate(`/products/${product.id}/write-review`)
                          }
                          className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                        >
                          Write the first review
                        </button>
                      </div>
                    )}
                  </div>

                  {/* See more reviews link */}
                  {reviews.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                      <button
                        onClick={() =>
                          navigate(`/products/${productId}/reviews`)
                        }
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors duration-200 bg-transparent border-none cursor-pointer"
                      >
                        See all {reviews.length} reviews
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetailPage;
