import React, { useState } from 'react';

export interface NavItem {
  label: string;
  icon?: string; // Tabler icon class, e.g., 'ti ti-smart-home'
  badge?: {
    text: string;
    variant?: 'teal' | 'warn' | 'error' | 'default';
  };
  active?: boolean;
  onClick?: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({
  logoUrl = '/logo.png',
  logoText = 'SPEEDEX',
  navGroups = defaultNavGroups,
  profile = defaultProfile,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-img-wrapper">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="sidebar-logo-img" />
          ) : (
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', fontFamily: 'var(--fh)' }}>
              {logoText}
            </span>
          )}
        </div>
        <button
          className="sb-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={collapsed ? 'ti ti-chevron-right' : 'ti ti-chevron-left'} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navGroups.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            {group.label && <span className="nav-module-label">{group.label}</span>}
            {group.items.map((item, itemIndex) => (
              <a
                key={itemIndex}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (item.onClick) item.onClick();
                }}
                className={`nav-item ${item.active ? 'active' : ''}`}
              >
                {item.icon && (
                  <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={item.icon} style={{ fontSize: '18px' }}></i>
                  </span>
                )}
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span className={`nav-badge ${item.badge.variant || ''}`}>
                    {item.badge.text}
                  </span>
                )}
              </a>
            ))}
          </React.Fragment>
        ))}
      </nav>

      {profile && (
        <div className="sidebar-footer">
          <div className="profile-card">
            <div className="profile-av">{profile.avatarInitials}</div>
            <div className="profile-info">
              <span className="profile-name">{profile.name}</span>
              <span className="profile-role">{profile.role}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
