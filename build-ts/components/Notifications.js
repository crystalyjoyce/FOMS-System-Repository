import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
const DUMMY_NOTIFICATIONS = [
    { id: '1', title: 'System Update', description: 'The server will go down for maintenance at 12:00 AM.', timestamp: '10 mins ago', read: false, type: 'info' },
    { id: '2', title: 'Order Failed', description: 'Delivery failed for Waybill SP-12345.', timestamp: '1 hour ago', read: false, type: 'alert' },
    { id: '3', title: 'Delivery Success', description: 'Package successfully delivered to Sofia.', timestamp: '2 hours ago', read: true, type: 'success' },
];
export const Notifications = () => {
    const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);
    const [filter, setFilter] = useState('all');
    const filtered = filter === 'all' ? notifications : notifications.filter(n => !n.read);
    const markAllAsUnread = () => {
        setNotifications(notifications.map(n => ({ ...n, read: false })));
    };
    const clearAll = () => {
        setNotifications([]);
    };
    const markAsRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };
    return (_jsxs("div", { className: "section-card", style: { maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }, children: [_jsxs("div", { className: "section-title", style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0, paddingBottom: '16px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx(Bell, { size: 24, style: { color: 'var(--teal)' } }), _jsx("span", { children: "Notifications" })] }), _jsxs("div", { style: { display: 'flex', gap: '10px' }, children: [_jsxs("button", { className: "btn btn-outline", onClick: markAllAsUnread, children: [_jsx(CheckCheck, { size: 16 }), " Mark all as Unread"] }), _jsxs("button", { className: "btn btn-outline", onClick: clearAll, children: [_jsx(Trash2, { size: 16 }), " Clear All"] })] })] }), _jsxs("div", { style: { display: 'flex', gap: '10px' }, children: [_jsx("button", { className: `btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`, onClick: () => setFilter('all'), children: "All Notification" }), _jsxs("button", { className: `btn ${filter === 'unread' ? 'btn-primary' : 'btn-outline'}`, onClick: () => setFilter('unread'), children: ["Unread ", notifications.filter(n => !n.read).length > 0 && `(${notifications.filter(n => !n.read).length})`] })] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' }, children: filtered.length === 0 ? (_jsxs("div", { className: "empty-state", style: { padding: '40px 20px', border: '1px dashed var(--border)', borderRadius: 'var(--r-md)' }, children: [_jsx("div", { className: "empty-state-icon", style: { marginBottom: '12px', background: 'var(--teal-bg)', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-md)' }, children: _jsx(Bell, { size: 28, style: { color: 'var(--teal)' } }) }), _jsx("div", { className: "empty-state-title", style: { fontSize: '1rem', fontWeight: 700, color: 'var(--tp)' }, children: "You are all caught up." }), _jsx("div", { className: "empty-state-desc", style: { fontSize: '0.85rem', color: 'var(--tt)', marginTop: '6px' }, children: "New system alerts and order updates will appear here as they come in." })] })) : (filtered.map(n => (_jsxs("div", { style: {
                        background: n.read ? 'transparent' : 'rgba(0, 169, 157, 0.04)',
                        border: '1px solid var(--border)',
                        borderLeft: !n.read ? '4px solid var(--teal)' : '1px solid var(--border)',
                        padding: '16px',
                        borderRadius: 'var(--r-sm)',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        transition: 'all var(--mt-std) var(--ease-std)'
                    }, onClick: () => markAsRead(n.id), children: [_jsxs("div", { style: {
                                color: n.type === 'alert' ? 'var(--err)' : n.type === 'success' ? 'var(--ok)' : 'var(--teal)',
                                background: 'var(--s1)',
                                padding: '10px',
                                borderRadius: 'var(--r-sm)'
                            }, children: [n.type === 'alert' && _jsx(AlertTriangle, { size: 20 }), n.type === 'success' && _jsx(CheckCircle2, { size: 20 }), n.type === 'info' && _jsx(Info, { size: 20 })] }), _jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }, children: [_jsx("strong", { style: { color: 'var(--tp)', fontSize: '0.95rem' }, children: n.title }), _jsx("span", { style: { fontSize: '0.8rem', color: 'var(--tt)' }, children: n.timestamp })] }), _jsx("p", { style: { margin: 0, fontSize: '0.88rem', color: 'var(--ts)' }, children: n.description }), _jsx("div", { style: { marginTop: '10px' }, children: _jsx(StatusBadge, { status: n.type === 'alert' ? 'Failed' : n.type === 'success' ? 'Active' : 'Pending' }) })] })] }, n.id)))) })] }));
};
export default Notifications;
//# sourceMappingURL=Notifications.js.map