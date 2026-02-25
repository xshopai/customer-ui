import React from 'react';
import PropTypes from 'prop-types';

/**
 * Logo Icon Component - Layered design matching brand identity
 */
const LogoIcon = ({ className = 'w-8 h-8' }) => (
  <svg
    className={className}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Background layer */}
    <rect
      x="2"
      y="8"
      width="24"
      height="16"
      rx="3"
      fill="url(#gradient1)"
      opacity="0.6"
    />
    {/* Middle layer */}
    <rect
      x="4"
      y="6"
      width="24"
      height="16"
      rx="3"
      fill="url(#gradient2)"
      opacity="0.8"
    />
    {/* Front layer */}
    <rect x="6" y="4" width="24" height="16" rx="3" fill="url(#gradient3)" />

    <defs>
      <linearGradient
        id="gradient1"
        x1="14"
        y1="8"
        x2="14"
        y2="24"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#6366F1" />
      </linearGradient>
      <linearGradient
        id="gradient2"
        x1="16"
        y1="6"
        x2="16"
        y2="22"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#7C3AED" />
      </linearGradient>
      <linearGradient
        id="gradient3"
        x1="18"
        y1="4"
        x2="18"
        y2="20"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#A855F7" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
  </svg>
);

LogoIcon.propTypes = {
  className: PropTypes.string,
};

/**
 * Full Logo Component with Icon and Text
 */
const Logo = ({ showText = true, size = 'default', className = '' }) => {
  const sizeClasses = {
    small: 'w-5 h-5',
    default: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  const textSizeClasses = {
    small: 'text-base',
    default: 'text-lg',
    large: 'text-xl',
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LogoIcon className={sizeClasses[size]} />
      {showText && (
        <span
          className={`${textSizeClasses[size]} font-bold tracking-tight transition-colors duration-200`}
        >
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
            xshop
          </span>
          <span className="text-indigo-600 dark:text-indigo-400">.ai</span>
        </span>
      )}
    </div>
  );
};

Logo.propTypes = {
  showText: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'default', 'large']),
  className: PropTypes.string,
};

export { LogoIcon };
export default Logo;
