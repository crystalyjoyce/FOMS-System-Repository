import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle2, Settings, LogOut, User, ChevronRight } from 'lucide-react';
import './GlobalHeader.css';
const DUMMY_NOTIFICATIONS = [
    // Logistics Director / Coordinator Alerts
    { id: '1', title: 'SLA Breach Warning', description: 'Route #8 is running 35 mins behind schedule. SLA impact imminent.', timestamp: '2m ago', read: false, type: 'alert', category: 'logistics', isToday: true, actionLabel: 'View Route #8' },
    { id: '2', title: 'Fleet Report Available', description: 'Weekly dispatch efficiency audit is ready for download.', timestamp: '1h ago', read: false, type: 'success', category: 'logistics', isToday: true },
    { id: '3', title: 'New Route Manifest', description: 'Waybill SP-77291 assigned to driver Juan dela Cruz.', timestamp: '3h ago', read: true, type: 'info', category: 'logistics', isToday: true },
    // Finance approvals
    { id: '4', title: 'Capital Expenditure Request', description: 'Approval required for fuel replenishment fund PHP 120,000.', timestamp: '5h ago', read: false, type: 'info', category: 'finance', isToday: true, actionLabel: 'Review Fund' },
    { id: '5', title: 'Invoice Settlement Failed', description: 'Vendor payout to FastTrack Cargo rejected by bank.', timestamp: 'Yesterday', read: false, type: 'alert', category: 'finance', isToday: false, actionLabel: 'Re-submit Pay' },
    // Driver notifications
    { id: '6', title: 'Route Update: Delivery Order', description: 'New dispatch assignment: Pickup at warehouse Cluster B.', timestamp: 'Yesterday', read: false, type: 'info', category: 'driver', isToday: false },
    { id: '7', title: 'Vehicle Maintenance Complete', description: 'Truck Plate TX-492 cleared for long-haul duty.', timestamp: '3 days ago', read: true, type: 'success', category: 'driver', isToday: false },
    // General System
    { id: '8', title: 'System Security Update', description: 'Workspace session policies updated for standard users.', timestamp: '4 days ago', read: true, type: 'info', category: 'system', isToday: false }
];
const defaultProfile = {
    name: 'Hermione Benitez',
    role: 'Logistics Director',
    avatarInitials: 'HB',
};
const GlobalHeader = ({ title = 'Dashboard', profile = defaultProfile }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);
    const [filter, setFilter] = useState('all');
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [bellAnimating, setBellAnimating] = useState(false);
    const notificationRef = useRef(null);
    const profileRef = useRef(null);
    // Auto-close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    // Filter notifications by active user role to show relevance
    const roleRelevantNotifications = useMemo(() => {
        const role = profile.role.toLowerCase();
        return notifications.filter(item => {
            if (role.includes('director') || role.includes('admin') || role.includes('manager')) {
                return item.category === 'logistics' || item.category === 'finance' || item.category === 'system';
            }
            if (role.includes('finance') || role.includes('auditor')) {
                return item.category === 'finance' || item.category === 'system';
            }
            if (role.includes('driver')) {
                return item.category === 'driver' || item.category === 'system';
            }
            return true; // fallback
        });
    }, [notifications, profile.role]);
    // Apply read/unread tabs
    const filtered = useMemo(() => {
        let result = roleRelevantNotifications;
        // Read/Unread tab filter
        if (filter === 'unread') {
            result = result.filter(n => !n.read);
        }
        return result;
    }, [roleRelevantNotifications, filter]);
    // Priority severity sorting: unread critical alerts first
    const sortedFiltered = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const aCriticalUnread = a.type === 'alert' && !a.read ? 1 : 0;
            const bCriticalUnread = b.type === 'alert' && !b.read ? 1 : 0;
            return bCriticalUnread - aCriticalUnread; // sorts unread criticals first
        });
    }, [filtered]);
    // Unread count
    const unreadCount = useMemo(() => {
        return roleRelevantNotifications.filter(n => !n.read).length;
    }, [roleRelevantNotifications]);
    // Trigger bell animation on unread count change
    useEffect(() => {
        if (unreadCount > 0) {
            setBellAnimating(true);
            const t = setTimeout(() => setBellAnimating(false), 800);
            return () => clearTimeout(t);
        }
    }, [unreadCount]);
    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => {
            const isRelevant = roleRelevantNotifications.some(r => r.id === n.id);
            return isRelevant ? { ...n, read: true } : n;
        }));
    };
    const clearAll = () => {
        setNotifications(prev => prev.filter(n => {
            const isRelevant = roleRelevantNotifications.some(r => r.id === n.id);
            return !isRelevant;
        }));
    };
    const toggleReadStatus = (id, e) => {
        e.stopPropagation();
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
    };
    // Group sorted notifications into Today vs Earlier
    const todayNotifications = useMemo(() => sortedFiltered.filter(n => n.isToday), [sortedFiltered]);
    const earlierNotifications = useMemo(() => sortedFiltered.filter(n => !n.isToday), [sortedFiltered]);
    return (_jsxs("header", { className: "site-header", children: [_jsxs("nav", { className: "nav-bar", children: [_jsx("h1", { className: "header-title", children: title }), _jsxs("div", { className: "header-controls", children: [_jsxs("div", { className: "header-notification-container", ref: notificationRef, children: [_jsxs("button", { className: `header-icon-btn ${bellAnimating ? 'bell-pulse' : ''}`, onClick: () => {
                                            setShowNotifications(!showNotifications);
                                            setShowProfileMenu(false);
                                        }, "aria-label": "Notifications", "aria-expanded": showNotifications, children: [_jsx(Bell, { size: 20, strokeWidth: 1.75 }), unreadCount > 0 && (_jsx("span", { className: "notification-badge-count", children: unreadCount > 99 ? '99+' : unreadCount }))] }), showNotifications && (_jsxs("div", { className: "notification-dropdown", role: "region", "aria-live": "polite", "aria-label": "Notification center", children: [_jsxs("div", { className: "notification-dropdown-header", children: [_jsxs("div", { className: "notification-dropdown-title-group", children: [_jsx("span", { children: "Notifications" }), unreadCount > 0 && (_jsxs("span", { className: "notification-unread-pill", children: [unreadCount, " new"] }))] }), _jsxs("button", { className: "notification-mark-all-btn", onClick: markAllAsRead, children: [_jsx(CheckCheck, { size: 14 }), " Mark all as read"] })] }), _jsxs("div", { className: "notification-filter-bar", children: [_jsx("span", { onClick: () => setFilter('all'), className: `notification-filter-tab ${filter === 'all' ? 'active' : ''}`, children: "All" }), _jsxs("span", { onClick: () => setFilter('unread'), className: `notification-filter-tab ${filter === 'unread' ? 'active' : ''}`, children: ["Unread (", unreadCount, ")"] })] }), _jsx("div", { className: "notification-dropdown-list", children: sortedFiltered.length === 0 ? (_jsxs("div", { className: "notification-dropdown-empty", children: [_jsx("div", { className: "empty-bell-icon", children: _jsx(Bell, { size: 32 }) }), _jsx("p", { className: "empty-title", children: "You're all caught up!" }), _jsx("p", { className: "empty-subtitle", children: "No new alerts for this category." })] })) : (_jsxs(_Fragment, { children: [todayNotifications.length > 0 && (_jsxs("div", { className: "notification-group-section", children: [_jsx("div", { className: "notification-group-title", children: "Today" }), todayNotifications.map((n) => {
                                                                    const isCritical = n.type === 'alert';
                                                                    return (_jsx("div", { className: `notification-dropdown-item ${!n.read ? 'unread' : ''} ${isCritical ? 'critical' : ''}`, onClick: (e) => toggleReadStatus(n.id, e), children: _jsxs("div", { className: "notification-dropdown-item-content", children: [_jsxs("div", { className: `notification-dropdown-icon-container ${n.type}`, children: [n.type === 'alert' && _jsx(AlertTriangle, { size: 14 }), n.type === 'success' && _jsx(CheckCircle2, { size: 14 }), n.type === 'info' && _jsx(Info, { size: 14 })] }), _jsxs("div", { className: "notification-dropdown-text-container", children: [_jsxs("div", { className: "notification-dropdown-item-header", children: [_jsx("span", { className: "notification-dropdown-item-title", children: n.title }), _jsx("span", { className: "notification-status-indicator-dot" })] }), _jsx("p", { className: "notification-dropdown-item-desc", children: n.description }), n.actionLabel && (_jsx("div", { style: { marginTop: '6px' }, onClick: e => e.stopPropagation(), children: _jsxs("button", { className: "notification-action-btn", onClick: () => alert(`Redirecting to: ${n.actionLabel}`), children: [n.actionLabel, " \u2192"] }) })), _jsx("span", { className: "notification-dropdown-item-time", children: n.timestamp })] })] }) }, n.id));
                                                                })] })), earlierNotifications.length > 0 && (_jsxs("div", { className: "notification-group-section", children: [_jsx("div", { className: "notification-group-title", children: "Earlier" }), earlierNotifications.map((n) => {
                                                                    const isCritical = n.type === 'alert';
                                                                    return (_jsx("div", { className: `notification-dropdown-item ${!n.read ? 'unread' : ''} ${isCritical ? 'critical' : ''}`, onClick: (e) => toggleReadStatus(n.id, e), children: _jsxs("div", { className: "notification-dropdown-item-content", children: [_jsxs("div", { className: `notification-dropdown-icon-container ${n.type}`, children: [n.type === 'alert' && _jsx(AlertTriangle, { size: 14 }), n.type === 'success' && _jsx(CheckCircle2, { size: 14 }), n.type === 'info' && _jsx(Info, { size: 14 })] }), _jsxs("div", { className: "notification-dropdown-text-container", children: [_jsxs("div", { className: "notification-dropdown-item-header", children: [_jsx("span", { className: "notification-dropdown-item-title", children: n.title }), _jsx("span", { className: "notification-status-indicator-dot" })] }), _jsx("p", { className: "notification-dropdown-item-desc", children: n.description }), n.actionLabel && (_jsx("div", { style: { marginTop: '6px' }, onClick: e => e.stopPropagation(), children: _jsxs("button", { className: "notification-action-btn", onClick: () => alert(`Redirecting to: ${n.actionLabel}`), children: [n.actionLabel, " \u2192"] }) })), _jsx("span", { className: "notification-dropdown-item-time", children: n.timestamp })] })] }) }, n.id));
                                                                })] }))] })) }), _jsxs("div", { className: "notification-dropdown-footer", children: [_jsxs("button", { className: "view-all-notifications-btn", onClick: () => alert('Opening Notifications Page...'), children: [_jsx("span", { children: "View all notifications" }), _jsx(ChevronRight, { size: 14 })] }), _jsx("button", { className: "clear-all-notifications-btn", onClick: () => setShowClearConfirm(true), title: "Clear all notifications", children: _jsx(Trash2, { size: 14 }) })] })] }))] }), _jsxs("div", { className: "header-profile-container", ref: profileRef, children: [_jsx("button", { className: "header-avatar-btn", onClick: () => {
                                            setShowProfileMenu(!showProfileMenu);
                                            setShowNotifications(false);
                                        }, "aria-label": "User Profile Dropdown", "aria-expanded": showProfileMenu, children: _jsx("div", { className: "avatar-circle-wrapper", children: _jsx("div", { className: "avatar-circle", children: profile.avatarInitials }) }) }), showProfileMenu && (_jsxs("div", { className: "profile-dropdown", children: [_jsxs("div", { className: "profile-dropdown-user-info", children: [_jsx("div", { className: "profile-dropdown-avatar-wrapper", children: _jsx("div", { className: "profile-dropdown-avatar", children: profile.avatarInitials }) }), _jsxs("div", { className: "profile-dropdown-meta", children: [_jsx("span", { className: "profile-dropdown-name", children: profile.name }), _jsx("span", { className: "profile-dropdown-role", children: profile.role })] })] }), _jsx("div", { className: "profile-dropdown-divider" }), _jsxs("div", { className: "profile-dropdown-options", children: [_jsxs("button", { className: "profile-dropdown-option", onClick: () => {
                                                            alert('Redirecting to My Account profile details...');
                                                            setShowProfileMenu(false);
                                                        }, children: [_jsx(User, { size: 15, strokeWidth: 2, className: "option-icon" }), _jsx("span", { children: "My Profile" })] }), _jsxs("button", { className: "profile-dropdown-option", onClick: () => {
                                                            alert('Settings Panel opened');
                                                            setShowProfileMenu(false);
                                                        }, children: [_jsx(Settings, { size: 15, strokeWidth: 2, className: "option-icon" }), _jsx("span", { children: "System Settings" })] })] }), _jsx("div", { className: "profile-dropdown-divider" }), _jsx("div", { className: "profile-dropdown-logout-section", children: _jsxs("button", { className: "profile-dropdown-option logout-option", onClick: () => {
                                                        alert('Logging out of Speedex SSO System...');
                                                        setShowProfileMenu(false);
                                                    }, children: [_jsx(LogOut, { size: 15, strokeWidth: 2, className: "option-icon" }), _jsx("span", { children: "Log Out" })] }) })] }))] })] })] }), showClearConfirm && (_jsx("div", { className: "header-confirm-overlay", onClick: () => setShowClearConfirm(false), children: _jsxs("div", { className: "header-confirm-card", onClick: e => e.stopPropagation(), role: "alertdialog", "aria-modal": "true", children: [_jsx("div", { className: "header-confirm-icon-box", children: _jsx(Trash2, { size: 24 }) }), _jsx("h2", { className: "header-confirm-title", children: "Clear all notifications?" }), _jsx("p", { className: "header-confirm-desc", children: "This will permanently delete all notifications for your current role. This action is irreversible." }), _jsxs("div", { className: "header-confirm-actions", children: [_jsx("button", { className: "header-btn-cancel", onClick: () => setShowClearConfirm(false), children: "Cancel" }), _jsx("button", { className: "header-btn-confirm", onClick: () => {
                                        clearAll();
                                        setShowClearConfirm(false);
                                    }, children: "Clear Notifications" })] })] }) }))] }));
};
export default GlobalHeader;
//# sourceMappingURL=GlobalHeader.js.map