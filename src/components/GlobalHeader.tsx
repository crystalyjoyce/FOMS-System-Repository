import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Settings, 
  LogOut, 
  User, 
  ChevronRight,
  Sparkles,
  MoreVertical
} from 'lucide-react';
import './GlobalHeader.css';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'alert' | 'success';
  category: 'logistics' | 'finance' | 'driver' | 'system';
  isToday: boolean;
  actionLabel?: string;
}

const DUMMY_NOTIFICATIONS: NotificationItem[] = [
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

export interface GlobalHeaderProps {
  title?: string;
  profile?: {
    name: string;
    role: string;
    avatarInitials: string;
  };
}

const defaultProfile = {
  name: 'Hermione Benitez',
  role: 'Logistics Director',
  avatarInitials: 'HB',
};

const GlobalHeader: React.FC<GlobalHeaderProps> = ({ 
  title = 'Dashboard', 
  profile = defaultProfile 
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DUMMY_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const [bellAnimating, setBellAnimating] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Auto-close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
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

  const toggleReadStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  // Group sorted notifications into Today vs Earlier
  const todayNotifications = useMemo(() => sortedFiltered.filter(n => n.isToday), [sortedFiltered]);
  const earlierNotifications = useMemo(() => sortedFiltered.filter(n => !n.isToday), [sortedFiltered]);

  return (
    <header className="site-header">
      <nav className="nav-bar">
        {/* Left Side: Page Title */}
        <h1 className="header-title">{title}</h1>
        
        {/* Right Side: Interactive Controls */}
        <div className="header-controls">
          {/* Notification Button & Dropdown */}
          <div className="header-notification-container" ref={notificationRef}>
            <button 
              className={`header-icon-btn ${bellAnimating ? 'bell-pulse' : ''}`}
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <Bell size={20} strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="notification-badge-count">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div 
                className="notification-dropdown"
                role="region"
                aria-live="polite"
                aria-label="Notification center"
              >
                {/* Header */}
                <div className="notification-dropdown-header">
                  <div className="notification-dropdown-title-group">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="notification-unread-pill">{unreadCount} new</span>
                    )}
                  </div>
                  <button className="notification-mark-all-btn" onClick={markAllAsRead}>
                    <CheckCheck size={14} /> Mark all as read
                  </button>
                </div>
                
                {/* Filter tab bar */}
                <div className="notification-filter-bar">
                  <span 
                    onClick={() => setFilter('all')} 
                    className={`notification-filter-tab ${filter === 'all' ? 'active' : ''}`}
                  >
                    All
                  </span>
                  <span 
                    onClick={() => setFilter('unread')} 
                    className={`notification-filter-tab ${filter === 'unread' ? 'active' : ''}`}
                  >
                    Unread ({unreadCount})
                  </span>
                </div>

 
                {/* Notification Items List */}
                <div className="notification-dropdown-list">
                  {sortedFiltered.length === 0 ? (
                    <div className="notification-dropdown-empty">
                      <div className="empty-bell-icon">
                        <Bell size={32} />
                      </div>
                      <p className="empty-title">You're all caught up!</p>
                      <p className="empty-subtitle">No new alerts for this category.</p>
                    </div>
                  ) : (
                    <>
                      {/* TODAY SECTION */}
                      {todayNotifications.length > 0 && (
                        <div className="notification-group-section">
                          <div className="notification-group-title">Today</div>
                          {todayNotifications.map((n) => {
                            const isCritical = n.type === 'alert';
                            return (
                              <div 
                                key={n.id} 
                                className={`notification-dropdown-item ${!n.read ? 'unread' : ''} ${isCritical ? 'critical' : ''}`}
                                onClick={(e) => toggleReadStatus(n.id, e)}
                              >
                                <div className="notification-dropdown-item-content">
                                  <div className={`notification-dropdown-icon-container ${n.type}`}>
                                    {n.type === 'alert' && <AlertTriangle size={14} />}
                                    {n.type === 'success' && <CheckCircle2 size={14} />}
                                    {n.type === 'info' && <Info size={14} />}
                                  </div>
                                  <div className="notification-dropdown-text-container">
                                    <div className="notification-dropdown-item-header">
                                      <span className="notification-dropdown-item-title">{n.title}</span>
                                      <span className="notification-status-indicator-dot" />
                                    </div>
                                    <p className="notification-dropdown-item-desc">{n.description}</p>
                                    
                                    {/* Inline action support for critical items */}
                                    {n.actionLabel && (
                                      <div style={{ marginTop: '6px' }} onClick={e => e.stopPropagation()}>
                                        <button 
                                          className="notification-action-btn"
                                          onClick={() => alert(`Redirecting to: ${n.actionLabel}`)}
                                        >
                                          {n.actionLabel} →
                                        </button>
                                      </div>
                                    )}

                                    <span className="notification-dropdown-item-time">{n.timestamp}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
 
                      {/* EARLIER SECTION */}
                      {earlierNotifications.length > 0 && (
                        <div className="notification-group-section">
                          <div className="notification-group-title">Earlier</div>
                          {earlierNotifications.map((n) => {
                            const isCritical = n.type === 'alert';
                            return (
                              <div 
                                key={n.id} 
                                className={`notification-dropdown-item ${!n.read ? 'unread' : ''} ${isCritical ? 'critical' : ''}`}
                                onClick={(e) => toggleReadStatus(n.id, e)}
                              >
                                <div className="notification-dropdown-item-content">
                                  <div className={`notification-dropdown-icon-container ${n.type}`}>
                                    {n.type === 'alert' && <AlertTriangle size={14} />}
                                    {n.type === 'success' && <CheckCircle2 size={14} />}
                                    {n.type === 'info' && <Info size={14} />}
                                  </div>
                                  <div className="notification-dropdown-text-container">
                                    <div className="notification-dropdown-item-header">
                                      <span className="notification-dropdown-item-title">{n.title}</span>
                                      <span className="notification-status-indicator-dot" />
                                    </div>
                                    <p className="notification-dropdown-item-desc">{n.description}</p>

                                    {/* Inline action support for critical items */}
                                    {n.actionLabel && (
                                      <div style={{ marginTop: '6px' }} onClick={e => e.stopPropagation()}>
                                        <button 
                                          className="notification-action-btn"
                                          onClick={() => alert(`Redirecting to: ${n.actionLabel}`)}
                                        >
                                          {n.actionLabel} →
                                        </button>
                                      </div>
                                    )}

                                    <span className="notification-dropdown-item-time">{n.timestamp}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
 
                {/* Footer Link */}
                <div className="notification-dropdown-footer">
                  <button className="view-all-notifications-btn" onClick={() => alert('Opening Notifications Page...')}>
                    <span>View all notifications</span>
                    <ChevronRight size={14} />
                  </button>
                  {/* Destructive Clear All icon is now linked to confirmation workflow */}
                  <button 
                    className="clear-all-notifications-btn" 
                    onClick={() => setShowClearConfirm(true)} 
                    title="Clear all notifications"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
 
          {/* Profile Avatar & Dropdown */}
          <div className="header-profile-container" ref={profileRef}>
            <button 
              className="header-avatar-btn" 
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              aria-label="User Profile Dropdown"
              aria-expanded={showProfileMenu}
            >
              <div className="avatar-circle-wrapper">
                <div className="avatar-circle">
                  {profile.avatarInitials}
                </div>
              </div>
            </button>
            
            {showProfileMenu && (
              <div className="profile-dropdown">
                {/* Identity Header */}
                <div className="profile-dropdown-user-info">
                  <div className="profile-dropdown-avatar-wrapper">
                    <div className="profile-dropdown-avatar">
                      {profile.avatarInitials}
                    </div>
                  </div>
                  <div className="profile-dropdown-meta">
                    <span className="profile-dropdown-name">{profile.name}</span>
                    <span className="profile-dropdown-role">{profile.role}</span>
                  </div>
                </div>
 
                <div className="profile-dropdown-divider" />
                
                {/* Options List */}
                <div className="profile-dropdown-options">
                  <button 
                    className="profile-dropdown-option"
                    onClick={() => {
                      alert('Redirecting to My Account profile details...');
                      setShowProfileMenu(false);
                    }}
                  >
                    <User size={15} strokeWidth={2} className="option-icon" />
                    <span>My Profile</span>
                  </button>
                  
                  <button 
                    className="profile-dropdown-option"
                    onClick={() => {
                      alert('Settings Panel opened');
                      setShowProfileMenu(false);
                    }}
                  >
                    <Settings size={15} strokeWidth={2} className="option-icon" />
                    <span>System Settings</span>
                  </button>
                </div>
 
                <div className="profile-dropdown-divider" />
                
                {/* Logout Option */}
                <div className="profile-dropdown-logout-section">
                  <button 
                    className="profile-dropdown-option logout-option"
                    onClick={() => {
                      alert('Logging out of Speedex SSO System...');
                      setShowProfileMenu(false);
                    }}
                  >
                    <LogOut size={15} strokeWidth={2} className="option-icon" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Structured Confirmation Dialog for Clear All Actions */}
      {showClearConfirm && (
        <div className="header-confirm-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="header-confirm-card" onClick={e => e.stopPropagation()} role="alertdialog" aria-modal="true">
            <div className="header-confirm-icon-box">
              <Trash2 size={24} />
            </div>
            <h2 className="header-confirm-title">Clear all notifications?</h2>
            <p className="header-confirm-desc">
              This will permanently delete all notifications for your current role. This action is irreversible.
            </p>
            <div className="header-confirm-actions">
              <button className="header-btn-cancel" onClick={() => setShowClearConfirm(false)}>Cancel</button>
              <button className="header-btn-confirm" onClick={() => {
                clearAll();
                setShowClearConfirm(false);
              }}>Clear Notifications</button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
};
 
export default GlobalHeader;
