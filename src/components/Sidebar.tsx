import React, { useState, useEffect, useRef } from "react";

export interface NavSubItem {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export interface NavItem {
  label: string;
  icon?: string; // Tabler icon class, e.g., 'ti ti-smart-home'
  badge?: {
    text: string;
    variant?: "teal" | "warn" | "error" | "default";
  };
  active?: boolean;
  onClick?: () => void;
  subItems?: NavSubItem[];
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export interface SidebarProps {
  logoUrl?: string;
  logoText?: string;
  navGroups?: NavGroup[];
  profile?: {
    name: string;
    role: string;
    avatarInitials: string;
  };
}

const defaultNavGroups: NavGroup[] = [
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

export const Sidebar: React.FC<SidebarProps> = ({
  logoUrl = "/logo.png",
  logoText = "SPEEDEX",
  navGroups = defaultNavGroups,
  profile = defaultProfile,
}) => {
  // Persist collapse preference
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    Shipments: true,
  });

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo Header */}
      <div className="sidebar-logo">
        <div className="logo-img-wrapper">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="sidebar-logo-img" />
          ) : (
            <span style={{ fontSize: "18px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", fontFamily: "var(--fh)" }}>
              {logoText}
            </span>
          )}
        </div>
        <button
          className="sb-toggle-btn"
          onClick={toggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i className={collapsed ? "ti ti-chevron-right" : "ti ti-chevron-left"} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {navGroups.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            {group.label && <span className="nav-module-label">{group.label}</span>}
            {group.items.map((item, itemIndex) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = !!expandedItems[item.label];

              return (
                <div key={itemIndex} className="nav-item-container">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (hasSubItems) {
                        toggleExpand(item.label);
                        if (collapsed) {
                          // Expand sidebar when clicking collapsed menu with sub-items
                          setCollapsed(false);
                          localStorage.setItem("sidebar-collapsed", "false");
                        }
                      } else if (item.onClick) {
                        item.onClick();
                      }
                    }}
                    className={`nav-item ${item.active ? "active" : ""} ${hasSubItems ? "has-subs" : ""}`}
                  >
                    {item.icon && (
                      <span className="nav-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        <i className={item.icon} style={{ fontSize: "18px" }}></i>
                        {/* Collapsed dot fallback indicator */}
                        {item.badge && collapsed && (
                          <span className={`nav-icon-badge-dot ${item.badge.variant || "default"}`} />
                        )}
                      </span>
                    )}
                    <span className="nav-label">{item.label}</span>
                    
                    {/* Badge on expanded mode */}
                    {item.badge && !collapsed && (
                      <span className={`nav-badge ${item.badge.variant || ""}`}>
                        {item.badge.text}
                      </span>
                    )}

                    {/* Chevron for sub-menus */}
                    {hasSubItems && !collapsed && (
                      <i className={`ti ti-chevron-${isExpanded ? "down" : "right"} nav-chevron`} />
                    )}
                  </a>

                  {/* Sub-items list */}
                  {hasSubItems && isExpanded && !collapsed && (
                    <div className="nav-sub-list">
                      {item.subItems!.map((sub, subIdx) => (
                        <a
                          key={subIdx}
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (sub.onClick) sub.onClick();
                          }}
                          className={`nav-sub-item ${sub.active ? "active" : ""}`}
                        >
                          {sub.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </nav>

      {/* Clickable Profile Card / Account Menu */}
      {profile && (
        <div className="sidebar-footer" ref={profileRef}>
          <div 
            className={`profile-card ${showProfileMenu ? "active" : ""}`} 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            role="button"
            aria-haspopup="true"
            aria-expanded={showProfileMenu}
          >
            <div className="profile-av">{profile.avatarInitials}</div>
            <div className="profile-info">
              <span className="profile-name">{profile.name}</span>
              <span className="profile-role">{profile.role}</span>
            </div>
            {!collapsed && (
              <i className="ti ti-selector profile-selector-icon" style={{ marginLeft: "auto", opacity: 0.5, fontSize: "14px" }} />
            )}
          </div>

          {/* Footer Account Dropdown Popover */}
          {showProfileMenu && (
            <div className={`sidebar-profile-dropdown ${collapsed ? "collapsed" : ""}`}>
              <div className="dropdown-identity">
                <span className="dropdown-name">{profile.name}</span>
                <span className="dropdown-role">{profile.role}</span>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-option" onClick={() => alert("Redirecting to profile details...")}>
                <i className="ti ti-user" />
                <span>My Profile</span>
              </button>
              <button className="dropdown-option" onClick={() => alert("Settings Panel opened")}>
                <i className="ti ti-settings" />
                <span>System Settings</span>
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-option logout" onClick={() => alert("Logging out of Speedex SSO System...")}>
                <i className="ti ti-logout" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
