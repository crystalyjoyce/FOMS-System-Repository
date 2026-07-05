import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from "react";
const defaultNavGroups = [
    {
        label: "Overview",
        items: [
            { label: "Dashboard", icon: "ti ti-dashboard", active: true },
            { label: "Analytics", icon: "ti ti-chart-bar", badge: { text: "New", variant: "teal" } },
        ],
    },
    {
        label: "Management",
        items: [
            {
                label: "Shipments",
                icon: "ti ti-truck",
                badge: { text: "8", variant: "warn" },
                subItems: [
                    { label: "Active Routes", active: false },
                    { label: "Completed Log", active: false },
                    { label: "Returns Audit", active: false },
                ],
            },
            { label: "Inventory", icon: "ti ti-box" },
            { label: "Drivers", icon: "ti ti-users" },
        ],
    },
];
const defaultProfile = {
    name: "Hermione Benitez",
    role: "Logistics Director",
    avatarInitials: "HB",
};
export const Sidebar = ({ logoUrl = "/logo.png", logoText = "SPEEDEX", navGroups = defaultNavGroups, profile = defaultProfile, }) => {
    // Persist collapse preference
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("sidebar-collapsed") === "true";
        }
        return false;
    });
    const [expandedItems, setExpandedItems] = useState({
        Shipments: true,
    });
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileRef = useRef(null);
    const toggleCollapse = () => {
        setCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem("sidebar-collapsed", String(next));
            return next;
        });
    };
    const toggleExpand = (label) => {
        setExpandedItems((prev) => ({
            ...prev,
            [label]: !prev[label],
        }));
    };
    // Close profile dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    return (_jsxs("aside", { className: `sidebar ${collapsed ? "collapsed" : ""}`, children: [_jsxs("div", { className: "sidebar-logo", children: [_jsx("div", { className: "logo-img-wrapper", children: logoUrl ? (_jsx("img", { src: logoUrl, alt: "Logo", className: "sidebar-logo-img" })) : (_jsx("span", { style: { fontSize: "18px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", fontFamily: "var(--fh)" }, children: logoText })) }), _jsx("button", { className: "sb-toggle-btn", onClick: toggleCollapse, "aria-label": collapsed ? "Expand sidebar" : "Collapse sidebar", children: _jsx("i", { className: collapsed ? "ti ti-chevron-right" : "ti ti-chevron-left" }) })] }), _jsx("nav", { className: "sidebar-nav", children: navGroups.map((group, groupIndex) => (_jsxs(React.Fragment, { children: [group.label && _jsx("span", { className: "nav-module-label", children: group.label }), group.items.map((item, itemIndex) => {
                            const hasSubItems = item.subItems && item.subItems.length > 0;
                            const isExpanded = !!expandedItems[item.label];
                            return (_jsxs("div", { className: "nav-item-container", children: [_jsxs("a", { href: "#", onClick: (e) => {
                                            e.preventDefault();
                                            if (hasSubItems) {
                                                toggleExpand(item.label);
                                                if (collapsed) {
                                                    // Expand sidebar when clicking collapsed menu with sub-items
                                                    setCollapsed(false);
                                                    localStorage.setItem("sidebar-collapsed", "false");
                                                }
                                            }
                                            else if (item.onClick) {
                                                item.onClick();
                                            }
                                        }, className: `nav-item ${item.active ? "active" : ""} ${hasSubItems ? "has-subs" : ""}`, children: [item.icon && (_jsxs("span", { className: "nav-icon", style: { display: "inline-flex", alignItems: "center", justifyContent: "center", position: "relative" }, children: [_jsx("i", { className: item.icon, style: { fontSize: "18px" } }), item.badge && collapsed && (_jsx("span", { className: `nav-icon-badge-dot ${item.badge.variant || "default"}` }))] })), _jsx("span", { className: "nav-label", children: item.label }), item.badge && !collapsed && (_jsx("span", { className: `nav-badge ${item.badge.variant || ""}`, children: item.badge.text })), hasSubItems && !collapsed && (_jsx("i", { className: `ti ti-chevron-${isExpanded ? "down" : "right"} nav-chevron` }))] }), hasSubItems && isExpanded && !collapsed && (_jsx("div", { className: "nav-sub-list", children: item.subItems.map((sub, subIdx) => (_jsx("a", { href: "#", onClick: (e) => {
                                                e.preventDefault();
                                                if (sub.onClick)
                                                    sub.onClick();
                                            }, className: `nav-sub-item ${sub.active ? "active" : ""}`, children: sub.label }, subIdx))) }))] }, itemIndex));
                        })] }, groupIndex))) }), profile && (_jsxs("div", { className: "sidebar-footer", ref: profileRef, children: [_jsxs("div", { className: `profile-card ${showProfileMenu ? "active" : ""}`, onClick: () => setShowProfileMenu(!showProfileMenu), role: "button", "aria-haspopup": "true", "aria-expanded": showProfileMenu, children: [_jsx("div", { className: "profile-av", children: profile.avatarInitials }), _jsxs("div", { className: "profile-info", children: [_jsx("span", { className: "profile-name", children: profile.name }), _jsx("span", { className: "profile-role", children: profile.role })] }), !collapsed && (_jsx("i", { className: "ti ti-selector profile-selector-icon", style: { marginLeft: "auto", opacity: 0.5, fontSize: "14px" } }))] }), showProfileMenu && (_jsxs("div", { className: `sidebar-profile-dropdown ${collapsed ? "collapsed" : ""}`, children: [_jsxs("div", { className: "dropdown-identity", children: [_jsx("span", { className: "dropdown-name", children: profile.name }), _jsx("span", { className: "dropdown-role", children: profile.role })] }), _jsx("div", { className: "dropdown-divider" }), _jsxs("button", { className: "dropdown-option", onClick: () => alert("Redirecting to profile details..."), children: [_jsx("i", { className: "ti ti-user" }), _jsx("span", { children: "My Profile" })] }), _jsxs("button", { className: "dropdown-option", onClick: () => alert("Settings Panel opened"), children: [_jsx("i", { className: "ti ti-settings" }), _jsx("span", { children: "System Settings" })] }), _jsx("div", { className: "dropdown-divider" }), _jsxs("button", { className: "dropdown-option logout", onClick: () => alert("Logging out of Speedex SSO System..."), children: [_jsx("i", { className: "ti ti-logout" }), _jsx("span", { children: "Log Out" })] })] }))] }))] }));
};
export default Sidebar;
//# sourceMappingURL=Sidebar.js.map