import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
const defaultNavGroups = [
    {
        label: 'Overview',
        items: [
            { label: 'Dashboard', icon: 'ti ti-dashboard', active: true },
            { label: 'Analytics', icon: 'ti ti-chart-bar', badge: { text: 'New', variant: 'teal' } },
        ],
    },
    {
        label: 'Management',
        items: [
            { label: 'Shipments', icon: 'ti ti-truck', badge: { text: '8', variant: 'warn' } },
            { label: 'Inventory', icon: 'ti ti-box' },
            { label: 'Drivers', icon: 'ti ti-users' },
        ],
    },
];
const defaultProfile = {
    name: 'Hermione Benitez',
    role: 'Logistics Director',
    avatarInitials: 'HB',
};
export const Sidebar = ({ logoUrl = '/logo.png', logoText = 'SPEEDEX', navGroups = defaultNavGroups, profile = defaultProfile, }) => {
    const [collapsed, setCollapsed] = useState(false);
    return (_jsxs("aside", { className: `sidebar ${collapsed ? 'collapsed' : ''}`, children: [_jsxs("div", { className: "sidebar-logo", children: [_jsx("div", { className: "logo-img-wrapper", children: logoUrl ? (_jsx("img", { src: logoUrl, alt: "Logo", className: "sidebar-logo-img" })) : (_jsx("span", { style: { fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', fontFamily: 'var(--fh)' }, children: logoText })) }), _jsx("button", { className: "sb-toggle-btn", onClick: () => setCollapsed(!collapsed), "aria-label": collapsed ? 'Expand sidebar' : 'Collapse sidebar', children: _jsx("i", { className: collapsed ? 'ti ti-chevron-right' : 'ti ti-chevron-left' }) })] }), _jsx("nav", { className: "sidebar-nav", children: navGroups.map((group, groupIndex) => (_jsxs(React.Fragment, { children: [group.label && _jsx("span", { className: "nav-module-label", children: group.label }), group.items.map((item, itemIndex) => (_jsxs("a", { href: "#", onClick: (e) => {
                                e.preventDefault();
                                if (item.onClick)
                                    item.onClick();
                            }, className: `nav-item ${item.active ? 'active' : ''}`, children: [item.icon && (_jsx("span", { className: "nav-icon", style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx("i", { className: item.icon, style: { fontSize: '18px' } }) })), _jsx("span", { className: "nav-label", children: item.label }), item.badge && (_jsx("span", { className: `nav-badge ${item.badge.variant || ''}`, children: item.badge.text }))] }, itemIndex)))] }, groupIndex))) }), profile && (_jsx("div", { className: "sidebar-footer", children: _jsxs("div", { className: "profile-card", children: [_jsx("div", { className: "profile-av", children: profile.avatarInitials }), _jsxs("div", { className: "profile-info", children: [_jsx("span", { className: "profile-name", children: profile.name }), _jsx("span", { className: "profile-role", children: profile.role })] })] }) }))] }));
};
export default Sidebar;
//# sourceMappingURL=Sidebar.js.map