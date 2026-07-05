import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const variantColors = {
    teal: { accent: 'var(--teal)', bg: 'var(--teal-bg)' },
    success: { accent: 'var(--ok)', bg: 'var(--ok-bg)' },
    warning: { accent: 'var(--warn)', bg: 'var(--warn-bg)' },
    danger: { accent: 'var(--err)', bg: 'var(--err-bg)' },
    info: { accent: 'var(--info)', bg: 'var(--info-bg)' },
    new: { accent: 'var(--new)', bg: 'var(--new-bg)' },
    delivery: { accent: 'var(--delivery)', bg: 'var(--delivery-bg)' },
};
export const StatusCard = ({ label, value, icon, variant = 'teal', trend, periodText, sparklineData, polarity = 'higher-is-better', }) => {
    const colors = variantColors[variant] || variantColors.teal;
    const customStyles = {
        '--kpi-ac': colors.accent,
        '--kpi-ibg': colors.bg,
        '--kpi-ic': colors.accent,
    };
    // Polarity aware coloring: for 'lower-is-better', a decrease is positive (green), and an increase is negative (red)
    const getTrendClass = (type) => {
        if (type === 'neutral')
            return 't-nl';
        if (polarity === 'lower-is-better') {
            return type === 'down' ? 't-up' : 't-dn';
        }
        else {
            return type === 'up' ? 't-up' : 't-dn';
        }
    };
    const getTrendIcon = (type) => {
        if (type === 'up')
            return '↑';
        if (type === 'down')
            return '↓';
        return '•';
    };
    const maxSparkVal = sparklineData && sparklineData.length > 0 ? Math.max(...sparklineData) : 1;
    return (_jsxs("div", { className: "kpi", style: customStyles, children: [_jsxs("div", { className: "kpi-top", children: [_jsx("span", { className: "kpi-label", children: label }), icon && (_jsx("div", { className: "kpi-icon-box", children: _jsx("i", { className: icon, style: { fontSize: '18px' } }) }))] }), _jsx("div", { className: "kpi-val", children: value }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginTop: 'auto' }, children: [trend && (_jsx("div", { className: `kpi-trend ${getTrendClass(trend.type)}`, children: _jsxs("span", { children: [getTrendIcon(trend.type), " ", trend.value] }) })), periodText && (_jsx("span", { className: "kpi-period", children: periodText }))] }), sparklineData && sparklineData.length > 0 && (_jsx("div", { className: "kpi-spark", children: sparklineData.map((val, idx) => {
                    const heightPercent = maxSparkVal > 0 ? (val / maxSparkVal) * 100 : 0;
                    const isHigh = val > maxSparkVal * 0.7; // highlight highest bars
                    return (_jsx("div", { className: `spark-b ${isHigh ? 'hi' : ''}`, style: { height: `${heightPercent}%` }, title: `Value: ${val}` }, idx));
                }) }))] }));
};
export default StatusCard;
//# sourceMappingURL=StatusCard.js.map