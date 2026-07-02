import React from 'react';
import './StatusBadge.css';

export type BadgeStatus = 
  | 'Active' | 'Deactivated' | 'Pending' | 'Done' | 'Delivered' 
  | 'In Transit' | 'Failed' | 'Success' | 'Submitted' | 'Picked-Up' 
  | 'Completed' | 'Processing' | 'Preparing' | 'Ready for Pickup' 
  | 'Returning' | 'Not Submitted' | 'Assigned' | 'Out of Delivery' 
  | 'Returned' | 'Cancelled' | 'Partially Paid' | 'Paid' 
  | 'Inflow' | 'Outflow' | 'Overdue' | 'New Payment' | string;

export interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toString().toLowerCase().trim();

  let variantClass = 'badge-pending'; // Default fallback

  // Active / Success (Green)
  if (['active', 'done', 'delivered', 'success', 'completed', 'paid', 'inflow'].includes(normalized)) {
    variantClass = 'badge-active';
  }
  // Pending / Warning (Amber)
  else if (['pending', 'processing', 'preparing', 'ready for pickup', 'not submitted', 'partially paid'].includes(normalized) || normalized.includes('days')) {
    variantClass = 'badge-pending';
  }
  // Failed / Error (Red)
  else if (['deactivated', 'failed', 'returning', 'returned', 'cancelled', 'outflow', 'overdue'].includes(normalized)) {
    variantClass = 'badge-failed';
  }
  // Transit / Info (Blue)
  else if (['in transit', 'picked-up', 'out of delivery'].includes(normalized)) {
    variantClass = 'badge-transit';
  }
  // New / Primary (Indigo)
  else if (['submitted', 'assigned', 'new payment'].includes(normalized)) {
    variantClass = 'badge-new';
  }

  return (
    <span className={`badge ${variantClass} ${className}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
