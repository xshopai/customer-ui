import React from 'react';
import PropTypes from 'prop-types';
import {
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

/**
 * AddressCard Component
 *
 * Displays a single address with actions to edit, delete, and set as default
 */
const AddressCard = ({ address, onEdit, onDelete, onSetDefault }) => {
  const handleEdit = () => {
    onEdit(address._id);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      onDelete(address._id);
    }
  };

  const handleSetDefault = () => {
    if (!address.isDefault) {
      onSetDefault(address._id);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md">
      {/* Header with Type and Default Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 capitalize">
            {address.type || 'Home'}
          </span>
          {address.isDefault && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <CheckCircleIcon className="h-3 w-3" />
              Default
            </span>
          )}
        </div>
      </div>

      {/* Address Details */}
      <div className="space-y-2 mb-4">
        {address.fullName && (
          <p className="text-gray-900 dark:text-white font-semibold">
            {address.fullName}
          </p>
        )}
        <p className="text-gray-900 dark:text-white font-medium">
          {address.addressLine1}
        </p>
        {address.addressLine2 && (
          <p className="text-gray-600 dark:text-gray-400">
            {address.addressLine2}
          </p>
        )}
        <p className="text-gray-600 dark:text-gray-400">
          {address.city}, {address.state} {address.zipCode}
        </p>
        <p className="text-gray-600 dark:text-gray-400">{address.country}</p>
        {address.phone && (
          <p className="text-gray-600 dark:text-gray-400">
            Phone: {address.phone}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleEdit}
          className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors duration-200"
        >
          <PencilIcon className="h-4 w-4" />
          <span>Edit</span>
        </button>

        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
        >
          <TrashIcon className="h-4 w-4" />
          <span>Delete</span>
        </button>

        {!address.isDefault && (
          <button
            onClick={handleSetDefault}
            className="ml-auto flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <CheckCircleIcon className="h-4 w-4" />
            <span>Set as Default</span>
          </button>
        )}
      </div>
    </div>
  );
};

AddressCard.propTypes = {
  address: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    fullName: PropTypes.string,
    type: PropTypes.string,
    addressLine1: PropTypes.string.isRequired,
    addressLine2: PropTypes.string,
    city: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    zipCode: PropTypes.string.isRequired,
    country: PropTypes.string.isRequired,
    phone: PropTypes.string,
    isDefault: PropTypes.bool,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSetDefault: PropTypes.func.isRequired,
};

export default AddressCard;
