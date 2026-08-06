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
  if (status == null) return null;
  const normalized = status.toString().toLowerCase().trim();

  let tier: 'success' | 'warning' | 'danger' = 'warning'; // default to orange/warning as seen in the image for most things

  // 1. Critical / Negative (Red)
  if (['failed', 'overdue', 'outflow', 'missing', 'deactivated', 'cancelled', 'returned'].includes(normalized) || normalized.includes('60-90') || normalized.includes('90+')) {
    tier = 'danger';
  }
  // 2. Positive / Success (Green)
  else if (['active', 'done', 'delivered', 'success', 'completed', 'paid', 'inflow', 'validated', 'validated (ctc)', 'billed', 'verified', 'verified & deposited', 'finalized'].includes(normalized)) {
    tier = 'success';
  }
  // 3. Attention / Pending / Default (Orange)
  // Everything else defaults to warning (orange), exactly like PENDING, DRAFT, APPROVED, REJECTED, REVIEWING, ON HOLD, PROCESSING in the image.

  return (
    <span className={`badge badge-${tier} ${className}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
