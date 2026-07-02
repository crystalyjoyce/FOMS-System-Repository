import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
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

const GlobalHeader = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DUMMY_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
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
        <a className="brand" href="#">BrandName</a>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="header-notification-container" ref={notificationRef}>
            <button 
              className="header-notification-btn" 
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="notification-dot" />}
            </button>
            
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header">
                  <span>Notifications Center</span>
                </div>
                
                <div style={{ padding: '0 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '20px', background: '#fff' }}>
                  <span onClick={() => setFilter('all')} style={{ padding: '12px 0', fontSize: '0.85rem', cursor: 'pointer', fontWeight: filter === 'all' ? 700 : 500, color: filter === 'all' ? 'var(--primary)' : 'var(--text-secondary)', position: 'relative' }}>
                    All Notification
                    {filter === 'all' && <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '2px', background: 'var(--primary)' }} />}
                  </span>
                  <span onClick={() => setFilter('unread')} style={{ padding: '12px 0', fontSize: '0.85rem', cursor: 'pointer', fontWeight: filter === 'unread' ? 700 : 500, color: filter === 'unread' ? 'var(--primary)' : 'var(--text-secondary)', position: 'relative' }}>
                    Unread
                    {filter === 'unread' && <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '2px', background: 'var(--primary)' }} />}
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

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                  <span onClick={markAllAsUnread} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600, transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                    <CheckCheck size={16} /> Mark all as Unread
                  </span>
                  <span onClick={clearAll} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--status-failed)', fontWeight: 600, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                    <Trash2 size={16} /> Clear All
                  </span>
                </div>
              </div>
            )}
          </div>

          <button className="cta-button">Get Started</button>
        </div>
      </nav>
    </header>
  );
};

export default GlobalHeader;
