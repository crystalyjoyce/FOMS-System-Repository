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
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const normalized = status.toString().toLowerCase().trim();

  let tier: 'success' | 'info' | 'warning' | 'warn-danger' | 'danger' | 'neutral' | 'assign' = 'neutral';

  // 1. Specific aging ranges (Days check)
  if (normalized.includes('90+') || normalized.includes('90') || normalized === 'overdue') {
    tier = 'danger';
  }
  else if (normalized.includes('60-90') || normalized.includes('60 - 90')) {
    tier = 'warn-danger';
  }
  else if (normalized.includes('30-60') || normalized.includes('30 - 60')) {
    tier = 'warning';
  }
  // 2. Critical / Negative / Fallbacks
  else if (['failed', 'outflow'].includes(normalized)) {
    tier = 'danger';
  }
  // 3. Positive / Success
  else if (['active', 'done', 'delivered', 'success', 'completed', 'paid', 'inflow'].includes(normalized)) {
    tier = 'success';
  }
  // 4. Informative / In-Progress
  else if (['in transit', 'submitted', 'picked-up', 'out of delivery', 'out for delivery'].includes(normalized)) {
    tier = 'info';
  }
  // 5. Attention / Pending / Fallback day checks
  else if (
    ['pending', 'preparing', 'ready for pickup', 'processing', 'returning', 'not submitted', 'partially paid'].includes(normalized) ||
    normalized.includes('days') || normalized.includes('day')
  ) {
    tier = 'warning';
  }
  // 6. Assignment / Ownership
  else if (['assigned', 'new payment'].includes(normalized)) {
    tier = 'assign';
  }
  // 7. Neutral / Terminated
  else if (['deactivated', 'cancelled', 'returned'].includes(normalized)) {
    tier = 'neutral';
  }

  // Get matching icon and configurations
  const renderIcon = () => {
    const iconSize = size === 'sm' ? 10 : 12;
    switch (tier) {
      case 'success':
        return <CheckCircle2 size={iconSize} strokeWidth={2.5} className="badge-icon" />;
      case 'info':
        return <ArrowRightCircle size={iconSize} strokeWidth={2.5} className="badge-icon" />;
      case 'warning':
        return <AlertCircle size={iconSize} strokeWidth={2.5} className="badge-icon" />;
      case 'warn-danger':
        return <AlertCircle size={iconSize} strokeWidth={2.5} className="badge-icon" />;
      case 'danger':
        return <XCircle size={iconSize} strokeWidth={2.5} className="badge-icon" />;
      case 'assign':
        return <UserCircle size={iconSize} strokeWidth={2.5} className="badge-icon" />;
      case 'neutral':
      default:
        return <Ban size={iconSize} strokeWidth={2.5} className="badge-icon" />;
    }
  };

  const sizeClass = size === 'sm' ? 'badge-sm' : '';

  return (
    <span className={`badge badge-${tier} ${sizeClass} ${className}`}>
      {renderIcon()}
      <span className="badge-label">{status}</span>
    </span>
  );
};

export default StatusBadge;
