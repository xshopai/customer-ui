import React from 'react';
import PropTypes from 'prop-types';
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  HomeIcon,
} from '@heroicons/react/24/solid';

const OrderTrackingTimeline = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return null;
  }

  const getStatusIcon = (status, isCompleted) => {
    const iconClass = `h-8 w-8 ${
      isCompleted
        ? 'text-indigo-600 dark:text-indigo-400'
        : 'text-gray-400 dark:text-gray-500'
    }`;

    switch (status.toLowerCase()) {
      case 'created':
      case 'confirmed':
        return <CheckCircleIcon className={iconClass} />;
      case 'shipped':
      case 'in transit':
        return <TruckIcon className={iconClass} />;
      case 'out for delivery':
        return <TruckIcon className={iconClass} />;
      case 'delivered':
        return <HomeIcon className={iconClass} />;
      default:
        return <ClockIcon className={iconClass} />;
    }
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="py-6">
      <div className="flow-root">
        <ul className="-mb-8">
          {timeline.map((event, eventIdx) => (
            <li key={eventIdx}>
              <div className="relative pb-8">
                {eventIdx !== timeline.length - 1 ? (
                  <span
                    className={`absolute left-4 top-10 -ml-px h-full w-0.5 ${
                      event.isCompleted
                        ? 'bg-indigo-600 dark:bg-indigo-400'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>{getStatusIcon(event.status, event.isCompleted)}</div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          event.isCompleted
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {event.status}
                      </p>
                      <p
                        className={`mt-0.5 text-sm ${
                          event.isCompleted
                            ? 'text-gray-600 dark:text-gray-300'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {event.description}
                      </p>
                      {event.location && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {event.location}
                        </p>
                      )}
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                      <time dateTime={event.timestamp}>
                        {formatDate(event.timestamp)}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

OrderTrackingTimeline.propTypes = {
  timeline: PropTypes.arrayOf(
    PropTypes.shape({
      status: PropTypes.string.isRequired,
      description: PropTypes.string,
      timestamp: PropTypes.string,
      location: PropTypes.string,
      isCompleted: PropTypes.bool,
    })
  ),
};

export default OrderTrackingTimeline;
