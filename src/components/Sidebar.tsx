import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NAV_CONFIG, ROLE_LABELS } from "../data/seed";
import type { UserRole } from "../types/auth";

export interface SidebarProps {
  logoUrl?: string;
  logoText?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  logoUrl = "/logo.png",
  logoText = "SPEEDEX",
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine which nav groups to show based on role
  const navGroups = user && NAV_CONFIG[user.role] ? NAV_CONFIG[user.role].groups : [];

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
              const isActive = location.pathname.startsWith(item.path);

              return (
                <div key={itemIndex} className="nav-item-container">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.children) {
                        toggleExpand(item.label);
                      } else {
                        navigate(item.path);
                      }
                    }}
                    className={`nav-item ${isActive ? "active" : ""}`}
                  >
                    {item.icon && (
                      <span className="nav-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        <i className={item.icon} style={{ fontSize: "18px" }}></i>
                      </span>
                    )}
                    <span className="nav-label">{item.label}</span>
                    {item.children && !collapsed && (
                      <i className={`ti ti-chevron-${expandedItems[item.label] ? 'down' : 'right'}`} style={{ marginLeft: 'auto', fontSize: '14px', opacity: 0.7 }} />
                    )}
                  </a>
                  
                  {item.children && expandedItems[item.label] && !collapsed && (
                    <div className="nav-children" style={{ display: 'flex', flexDirection: 'column', marginLeft: '42px', marginTop: '4px', gap: '4px' }}>
                      {item.children.map((child, childIndex) => {
                        const isChildActive = location.pathname + location.search === child.path;
                        return (
                          <a
                            key={childIndex}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              const [pathname, search] = child.path.split('?');
                              navigate({ pathname, search: search ? `?${search}` : '' });
                            }}
                            className={`nav-child-item ${isChildActive ? "active" : ""}`}
                            style={{ 
                              padding: '8px 12px', 
                              borderRadius: '8px', 
                              fontSize: '0.85rem', 
                              color: isChildActive ? '#fff' : '#94A3B8',
                              background: isChildActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                              textDecoration: 'none',
                              display: 'block'
                            }}
                          >
                            {child.label}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </nav>

      {/* Clickable Profile Card / Account Menu */}
      {user && (
        <div className="sidebar-footer" ref={profileRef}>
          <div 
            className={`profile-card ${showProfileMenu ? "active" : ""}`} 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            role="button"
            aria-haspopup="true"
            aria-expanded={showProfileMenu}
          >
            <div className="profile-av">{user.avatarInitials}</div>
            <div className="profile-info">
              <span className="profile-name">{user.fullName}</span>
              <span className="profile-role">{ROLE_LABELS[user.role]}</span>
            </div>
            {!collapsed && (
              <i className="ti ti-selector profile-selector-icon" style={{ marginLeft: "auto", opacity: 0.5, fontSize: "14px" }} />
            )}
          </div>

          {/* Footer Account Dropdown Popover */}
          {showProfileMenu && (
            <div className={`sidebar-profile-dropdown ${collapsed ? "collapsed" : ""}`}>
              <div className="dropdown-identity">
                <span className="dropdown-name">{user.fullName}</span>
                <span className="dropdown-role">{ROLE_LABELS[user.role]}</span>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-option" onClick={() => {
                navigate('/profile');
                setShowProfileMenu(false);
              }}>
                <i className="ti ti-user" />
                <span>My Profile</span>
              </button>
              <button className="dropdown-option" onClick={() => alert("Settings Panel opened")}>
                <i className="ti ti-settings" />
                <span>System Settings</span>
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-option logout" onClick={() => { logout(); }}>
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
