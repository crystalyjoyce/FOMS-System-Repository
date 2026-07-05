import React from 'react';
import { 
  CheckCircle2, 
  ArrowRightCircle, 
  AlertCircle, 
  XCircle, 
  Ban, 
  UserCircle 
} from 'lucide-react';
import './StatusBadge.css';

export type BadgeStatus = string;

export interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toString().toLowerCase().trim();

  let tier: 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'assign' = 'neutral';

  // 1. Critical / Negative
  if (['failed', 'overdue', 'outflow'].includes(normalized) || normalized.includes('60-90') || normalized.includes('90+')) {
    tier = 'danger';
  }
  // 2. Positive / Success
  else if (['active', 'done', 'delivered', 'success', 'completed', 'paid', 'inflow'].includes(normalized)) {
    tier = 'success';
  }
  // 3. Informative / In-Progress
  else if (['in transit', 'submitted', 'picked-up', 'out of delivery', 'out for delivery'].includes(normalized)) {
    tier = 'info';
  }
  // 4. Attention / Pending
  else if (
    ['pending', 'preparing', 'ready for pickup', 'processing', 'returning', 'not submitted', 'partially paid'].includes(normalized) ||
    normalized.includes('days') || normalized.includes('day')
  ) {
    tier = 'warning';
  }
  // 5. Assignment / Ownership
  else if (['assigned', 'new payment'].includes(normalized)) {
    tier = 'assign';
  }
  // 6. Neutral / Terminated (Fallback)
  else if (['deactivated', 'cancelled', 'returned'].includes(normalized)) {
    tier = 'neutral';
  }

  // Get matching icon and configurations
  const renderIcon = () => {
    switch (tier) {
      case 'success':
        return <CheckCircle2 size={12} strokeWidth={2.5} className="badge-icon" />;
      case 'info':
        return <ArrowRightCircle size={12} strokeWidth={2.5} className="badge-icon" />;
      case 'warning':
        return <AlertCircle size={12} strokeWidth={2.5} className="badge-icon" />;
      case 'danger':
        return <XCircle size={12} strokeWidth={2.5} className="badge-icon" />;
      case 'assign':
        return <UserCircle size={12} strokeWidth={2.5} className="badge-icon" />;
      case 'neutral':
      default:
        return <Ban size={12} strokeWidth={2.5} className="badge-icon" />;
    }
  };

  return (
    <span className={`badge badge-${tier} ${className}`}>
      {renderIcon()}
      <span className="badge-label">{status}</span>
    </span>
  );
};

export default StatusBadge;
