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

      {/* Profile Card */}
      {user && (
        <div className="sidebar-footer">
          <div className="profile-card">
            <div className="profile-av">{user.avatarInitials}</div>
            <div className="profile-info">
              <span className="profile-name">{user.fullName}</span>
              <span className="profile-role">{ROLE_LABELS[user.role]}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
