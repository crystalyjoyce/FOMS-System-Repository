import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ClipboardList, CheckCircle2, Package, TrendingUp, Users, Truck, AlertCircle } from 'lucide-react';
import './DashboardLayout.css';
/**
 * ─── SPEEDEX Graph Color Tokens (Stakeholder-Friendly) ───
 * Unified color dictionary shared across DMS, TARS, and FinSys.
 * No color-to-meaning overlap is allowed.
 */
const C = {
    success: '#00A99D', // Delivered / Completed (Teal)
    info: '#0284C7', // In Transit (Blue)
    warning: '#D97706', // Pending / Preparing (Amber)
    failed: '#DC2626', // Critical / Failed (Red)
    neutral: '#64748B', // Returned / Cancelled (Grey)
};
/* ─── Static demo data ─── */
const weeklyData = [
    { day: 'Mon', deliveries: 42, returned: 3, failed: 2 },
    { day: 'Tue', deliveries: 58, returned: 5, failed: 1 },
    { day: 'Wed', deliveries: 35, returned: 2, failed: 4 },
    { day: 'Thu', deliveries: 71, returned: 7, failed: 3 },
    { day: 'Fri', deliveries: 63, returned: 4, failed: 2 },
    { day: 'Sat', deliveries: 29, returned: 1, failed: 1 },
    { day: 'Sun', deliveries: 14, returned: 0, failed: 0 },
];
const pieData = [
    { name: 'Delivered', value: 214, color: C.success },
    { name: 'In Transit', value: 67, color: C.info },
    { name: 'Pending', value: 43, color: C.warning },
    { name: 'Failed', value: 18, color: C.failed },
    { name: 'Returned', value: 12, color: C.neutral },
];
const activityFeed = [
    { id: 1, text: 'Waybill SP-78921 delivered to Maria Santos', time: '2 mins ago', color: C.success },
    { id: 2, text: 'Waybill SP-78888 picked up by Driver Reyes', time: '14 mins ago', color: C.info },
    { id: 3, text: 'Waybill SP-78790 marked as Failed', time: '32 mins ago', color: C.failed },
    { id: 4, text: 'New order SP-79001 submitted by Client BDO', time: '1 hr ago', color: C.warning },
    { id: 5, text: 'Waybill SP-78811 returned to warehouse', time: '2 hrs ago', color: C.neutral },
];
const statCards = [
    {
        label: 'Active Tasks',
        value: '110',
        sub: 'Pending & In-Transit',
        icon: _jsx(ClipboardList, { size: 20 }),
        iconBg: 'rgba(217, 119, 6, 0.1)',
        iconColor: C.warning,
        accent: C.warning,
    },
    {
        label: 'Completed Today',
        value: '214',
        sub: 'Total successful deliveries',
        icon: _jsx(CheckCircle2, { size: 20 }),
        iconBg: 'rgba(5, 150, 105, 0.1)',
        iconColor: '#059669',
        accent: '#059669',
    },
    {
        label: 'In Transit',
        value: '67',
        sub: 'Currently on-road',
        icon: _jsx(Truck, { size: 20 }),
        iconBg: 'rgba(2, 132, 199, 0.1)',
        iconColor: C.info,
        accent: C.info,
    },
    {
        label: 'Failed / Returned',
        value: '30',
        sub: 'Needs attention',
        icon: _jsx(AlertCircle, { size: 20 }),
        iconBg: 'rgba(220, 38, 38, 0.1)',
        iconColor: C.failed,
        accent: C.failed,
    },
];
const systemStatus = [
    {
        name: 'Operation System',
        detail: '24 employees active',
        icon: _jsx(Users, { size: 16 }),
        iconBg: 'rgba(0, 169, 157, 0.08)',
        iconColor: C.success,
    },
    {
        name: 'Delivery Management',
        detail: '354 total orders',
        icon: _jsx(ClipboardList, { size: 16 }),
        iconBg: 'rgba(220, 38, 38, 0.1)',
        iconColor: C.failed,
    },
    {
        name: 'Delivery Tracker',
        detail: '67 active shipments',
        icon: _jsx(Package, { size: 16 }),
        iconBg: 'rgba(5, 150, 105, 0.1)',
        iconColor: '#059669',
    },
];
/* ─── Custom Tooltip ─── */
const BarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length)
        return null;
    return (_jsxs("div", { style: {
            background: '#FFFFFF',
            border: '1px solid #DDE2EB',
            borderRadius: '8px',
            padding: '10px 14px',
            boxShadow: '0px 4px 20px rgba(15, 23, 42, 0.05)',
            fontSize: '0.8rem',
            fontFamily: "'Outfit', sans-serif",
        }, children: [_jsx("div", { style: { fontWeight: 700, color: '#0F172A', marginBottom: '6px' }, children: label }), payload.map((p) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }, children: [_jsx("span", { style: { width: 8, height: 8, borderRadius: 2, background: p.fill, display: 'inline-block' } }), _jsxs("span", { style: { color: '#475569' }, children: [p.name, ":"] }), _jsx("span", { style: { fontWeight: 700, color: '#0F172A' }, children: p.value })] }, p.name)))] }));
};
const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});
/* ─── Component ─── */
export const DashboardLayout = () => (_jsxs("div", { className: "speedex-dashboard", children: [_jsxs("div", { className: "spx-header-card", children: [_jsxs("div", { className: "spx-header-info", children: [_jsx("h1", { children: "Board Overview" }), _jsx("p", { children: "Admin Dashboard \u00B7 Operations" })] }), _jsxs("div", { className: "spx-header-controls", children: [_jsx("span", { className: "spx-last-updated", children: "Last Sync: Just now" }), _jsx("span", { style: { fontSize: '0.8rem', fontWeight: 600, color: '#475569', background: '#F4F6F9', border: '1px solid #DDE2EB', borderRadius: '8px', padding: '8px 14px' }, children: today })] })] }), _jsx("div", { className: "spx-stats-grid", children: statCards.map((card) => (_jsxs("div", { className: "spx-stat-card", style: { '--accent': card.accent }, children: [_jsx("div", { className: "spx-stat-icon", style: { background: card.iconBg, color: card.iconColor }, children: card.icon }), _jsxs("div", { children: [_jsx("div", { className: "spx-stat-label", children: card.label }), _jsx("div", { className: "spx-stat-value", children: card.value }), _jsx("div", { className: "spx-stat-sub", children: card.sub })] })] }, card.label))) }), _jsxs("div", { className: "spx-main-grid", children: [_jsxs("div", { className: "spx-card", children: [_jsxs("div", { className: "spx-card-title", children: [_jsxs("div", { className: "spx-card-title-left", children: [_jsx(TrendingUp, { size: 18, color: "#00A99D" }), "Delivery Performance"] }), _jsx("span", { className: "spx-badge spx-badge-transit", children: "This Week" })] }), _jsxs("div", { className: "spx-legend", children: [_jsxs("div", { className: "spx-legend-item", children: [_jsx("div", { className: "spx-legend-dot", style: { background: C.success } }), "Deliveries"] }), _jsxs("div", { className: "spx-legend-item", children: [_jsx("div", { className: "spx-legend-dot", style: { background: C.neutral } }), "Returned"] }), _jsxs("div", { className: "spx-legend-item", children: [_jsx("div", { className: "spx-legend-dot", style: { background: C.failed } }), "Failed"] })] }), _jsx("div", { style: { width: '100%', height: 220 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: weeklyData, barGap: 4, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#EBF0F5" }), _jsx(XAxis, { dataKey: "day", axisLine: false, tickLine: false, tick: { fontSize: 11, fill: '#64748B', fontWeight: 600, fontFamily: 'Outfit' } }), _jsx(Tooltip, { content: _jsx(BarTooltip, {}), cursor: { fill: 'rgba(0, 169, 157, 0.03)' } }), _jsx(Bar, { dataKey: "deliveries", name: "Deliveries", fill: C.success, radius: [4, 4, 0, 0], maxBarSize: 32 }), _jsx(Bar, { dataKey: "returned", name: "Returned", fill: C.neutral, radius: [4, 4, 0, 0], maxBarSize: 32 }), _jsx(Bar, { dataKey: "failed", name: "Failed", fill: C.failed, radius: [4, 4, 0, 0], maxBarSize: 32 })] }) }) })] }), _jsxs("div", { className: "spx-card", children: [_jsxs("div", { className: "spx-card-title", children: [_jsxs("div", { className: "spx-card-title-left", children: [_jsx(ClipboardList, { size: 18, color: "#00A99D" }), "Recent Activity"] }), _jsx("span", { className: "spx-badge spx-badge-active", children: "Live" })] }), activityFeed.map((log) => (_jsxs("div", { className: "spx-feed-item", children: [_jsx("div", { className: "spx-feed-dot", style: { background: log.color } }), _jsxs("div", { children: [_jsx("div", { className: "spx-feed-text", children: log.text }), _jsx("div", { className: "spx-feed-time", children: log.time })] })] }, log.id)))] })] }), _jsxs("div", { className: "spx-bottom-grid", children: [_jsxs("div", { className: "spx-card", children: [_jsxs("div", { className: "spx-card-title", children: [_jsxs("div", { className: "spx-card-title-left", children: [_jsx(Package, { size: 18, color: "#00A99D" }), "Order Status Breakdown"] }), _jsx("span", { className: "spx-badge spx-badge-pending", children: "All Time" })] }), _jsx("div", { style: { width: '100%', height: 220 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: pieData, cx: "40%", cy: "50%", innerRadius: 55, outerRadius: 90, paddingAngle: 3, dataKey: "value", children: pieData.map((entry, i) => (_jsx(Cell, { fill: entry.color }, i))) }), _jsx(Tooltip, { formatter: (val, name) => [`${val} orders`, name], contentStyle: {
                                                fontSize: '0.8rem',
                                                borderRadius: '8px',
                                                border: '1px solid #DDE2EB',
                                                boxShadow: '0px 4px 20px rgba(15, 23, 42, 0.05)',
                                                fontFamily: 'Outfit, sans-serif',
                                            } }), _jsx(Legend, { layout: "vertical", align: "right", verticalAlign: "middle", iconType: "circle", iconSize: 8, formatter: (value) => (_jsx("span", { style: { fontSize: '0.78rem', color: '#475569', fontWeight: 500, fontFamily: 'Outfit' }, children: value })) })] }) }) })] }), _jsxs("div", { className: "spx-card", children: [_jsxs("div", { className: "spx-card-title", children: [_jsxs("div", { className: "spx-card-title-left", children: [_jsx(TrendingUp, { size: 18, color: "#00A99D" }), "System Status"] }), _jsx("span", { className: "spx-badge spx-badge-active", children: "All Operational" })] }), systemStatus.map((s) => (_jsxs("div", { className: "spx-system-item", children: [_jsx("div", { className: "spx-system-icon", style: { background: s.iconBg, color: s.iconColor }, children: s.icon }), _jsxs("div", { children: [_jsx("div", { className: "spx-system-name", children: s.name }), _jsx("div", { className: "spx-system-detail", children: s.detail })] }), _jsx("span", { className: "spx-system-uptime", children: "99.9%" })] }, s.name)))] })] })] }));
export default DashboardLayout;
//# sourceMappingURL=DashboardLayout.js.map