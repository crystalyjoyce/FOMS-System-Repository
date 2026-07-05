import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle2, ArrowRightCircle, AlertCircle, XCircle, Ban, UserCircle } from 'lucide-react';
import './StatusBadge.css';
export const StatusBadge = ({ status, className = '' }) => {
    const normalized = status.toString().toLowerCase().trim();
    let tier = 'neutral';
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
    else if (['pending', 'preparing', 'ready for pickup', 'processing', 'returning', 'not submitted', 'partially paid'].includes(normalized) ||
        normalized.includes('days') || normalized.includes('day')) {
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
                return _jsx(CheckCircle2, { size: 12, strokeWidth: 2.5, className: "badge-icon" });
            case 'info':
                return _jsx(ArrowRightCircle, { size: 12, strokeWidth: 2.5, className: "badge-icon" });
            case 'warning':
                return _jsx(AlertCircle, { size: 12, strokeWidth: 2.5, className: "badge-icon" });
            case 'danger':
                return _jsx(XCircle, { size: 12, strokeWidth: 2.5, className: "badge-icon" });
            case 'assign':
                return _jsx(UserCircle, { size: 12, strokeWidth: 2.5, className: "badge-icon" });
            case 'neutral':
            default:
                return _jsx(Ban, { size: 12, strokeWidth: 2.5, className: "badge-icon" });
        }
    };
    return (_jsxs("span", { className: `badge badge-${tier} ${className}`, children: [renderIcon(), _jsx("span", { className: "badge-label", children: status })] }));
};
export default StatusBadge;
//# sourceMappingURL=StatusBadge.js.map