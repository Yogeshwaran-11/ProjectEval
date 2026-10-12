import React from 'react';

export const QueueStatusBadge = ({ status, className = '' }) => {
  const normalized = (status || 'WAITING').toUpperCase();

  switch (normalized) {
    case 'COMPLETED':
      return (
        <span className={`status-badge completed ${className}`}>
          <span style={{ fontSize: '10px' }}>●</span> Completed
        </span>
      );
    case 'STANDBY':
      return (
        <span className={`status-badge standby ${className}`}>
          <span style={{ fontSize: '10px' }}>●</span> Standby Alert
        </span>
      );
    case 'IN_VIVA':
      return (
        <span className={`status-badge inviva ${className}`}>
          <span style={{ fontSize: '10px' }}>●</span> In Viva
        </span>
      );
    case 'WAITING':
    default:
      return (
        <span className={`status-badge waiting ${className}`}>
          <span style={{ fontSize: '10px' }}>●</span> Waiting
        </span>
      );
  }
};
