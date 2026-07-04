import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle2, Settings, LogOut } from 'lucide-react';
import './GlobalHeader.css';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'alert' | 'success';
}

const DUMMY_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', title: 'System Update', description: 'The server will go down for maintenance at 12:00 AM.', timestamp: '10 mins ago', read: false, type: 'info' },
  { id: '2', title: 'Order Failed', description: 'Delivery failed for Waybill SP-12345.', timestamp: '1 hour ago', read: false, type: 'alert' },
  { id: '3', title: 'Delivery Success', description: 'Package successfully delivered to Sofia.', timestamp: '2 hours ago', read: true, type: 'success' },
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
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DUMMY_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

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

  const filtered = filter === 'all' ? notifications : notifications.filter(n => !n.read);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsUnread = () => {
    setNotifications(notifications.map(n => ({ ...n, read: false })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

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
              className="header-icon-btn" 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false); // Close profile dropdown when opening notifications
              }}
              aria-label="Notifications"
            >
              <Bell size={20} strokeWidth={1.75} />
              {unreadCount > 0 && <span className="notification-dot" />}
            </button>
            
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header">
                  <span>Notifications Center</span>
                  {unreadCount > 0 && (
                    <span className="notification-unread-pill">{unreadCount} new</span>
                  )}
                </div>
                
                <div className="notification-filter-bar">
                  <span 
                    onClick={() => setFilter('all')} 
                    className={`notification-filter-tab ${filter === 'all' ? 'active' : ''}`}
                  >
                    All Notifications
                  </span>
                  <span 
                    onClick={() => setFilter('unread')} 
                    className={`notification-filter-tab ${filter === 'unread' ? 'active' : ''}`}
                  >
                    Unread
                  </span>
                </div>

                <div className="notification-dropdown-list">
                  {filtered.length === 0 ? (
                    <div className="notification-dropdown-empty">
                      You are all caught up.
                    </div>
                  ) : (
                    filtered.map((n) => (
                      <div 
                        key={n.id} 
                        className={`notification-dropdown-item ${!n.read ? 'unread' : ''}`}
                        onClick={() => markAsRead(n.id)}
                      >
                        <div className="notification-dropdown-item-content">
                          <div className={`notification-dropdown-icon-container ${n.type || 'info'}`}>
                            {n.type === 'alert' && <AlertTriangle size={14} />}
                            {n.type === 'success' && <CheckCircle2 size={14} />}
                            {n.type === 'info' && <Info size={14} />}
                          </div>
                          <div className="notification-dropdown-text-container">
                            <div className="notification-dropdown-item-header">
                              <span className="notification-dropdown-item-title">{n.title}</span>
                              {!n.read && <span className="notification-dropdown-unread-dot" />}
                            </div>
                            <p className="notification-dropdown-item-desc">{n.description}</p>
                            <span className="notification-dropdown-item-time">{n.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="notification-dropdown-footer">
                  <span onClick={markAllAsUnread} className="notification-footer-action font-semibold">
                    <CheckCheck size={16} /> Mark all as Unread
                  </span>
                  <span onClick={clearAll} className="notification-footer-action clear-action font-semibold">
                    <Trash2 size={16} /> Clear All
                  </span>
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
                setShowNotifications(false); // Close notifications when opening profile dropdown
              }}
              aria-label="User Profile Dropdown"
            >
              <div className="avatar-circle">
                {profile.avatarInitials}
              </div>
            </button>

            {showProfileMenu && (
              <div className="profile-dropdown">
                {/* User Details Header */}
                <div className="profile-dropdown-user-info">
                  <div className="profile-dropdown-avatar">
                    {profile.avatarInitials}
                  </div>
                  <div className="profile-dropdown-meta">
                    <span className="profile-dropdown-name">{profile.name}</span>
                    <span className="profile-dropdown-role">{profile.role}</span>
                  </div>
                </div>
                
                {/* Dropdown Options */}
                <div className="profile-dropdown-options">
                  <button 
                    className="profile-dropdown-option"
                    onClick={() => {
                      alert('Settings Page clicked');
                      setShowProfileMenu(false);
                    }}
                  >
                    <Settings size={16} strokeWidth={2} className="option-icon" />
                    <span>Settings</span>
                  </button>
                  <button 
                    className="profile-dropdown-option logout-option"
                    onClick={() => {
                      alert('Log Out clicked');
                      setShowProfileMenu(false);
                    }}
                  >
                    <LogOut size={16} strokeWidth={2} className="option-icon" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default GlobalHeader;
