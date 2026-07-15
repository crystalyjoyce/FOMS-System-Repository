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
  MoreVertical,
  Clock
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV_CONFIG, ROLE_LABELS } from '../data/seed';
import './GlobalHeader.css';
import { Button } from './Buttons';

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

import { SEEDED_WAYBILLS, SEEDED_INVOICES, SEEDED_PAYMENTS, SEEDED_SPEEDPAY, SEEDED_AR_RECORDS } from '../data/seed';
import type { UserRole } from '../types/auth';

function relTs(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

function generateNotifications(role: UserRole): NotificationItem[] {
  const now = new Date().toISOString();
  const notes: NotificationItem[] = [];

  if (role === 'Coordinator') {
    const forChecking = SEEDED_WAYBILLS.filter(w => w.status === 'For Checking');
    forChecking.forEach(w => {
      notes.push({ id: `coord-fc-${w.id}`, title: 'New Waybill Awaiting Check', description: `Waybill ${w.waybillNumber} has arrived and needs your review.`, timestamp: relTs(w.uploaded_date || now), read: false, type: 'info', category: 'logistics', isToday: isToday(w.uploaded_date || now) });
    });
    const missing = SEEDED_WAYBILLS.filter(w => w.status === 'Missing');
    missing.forEach(w => {
      const daysDiff = Math.floor((Date.now() - new Date(w.deliveryDate).getTime()) / 86400000);
      if (daysDiff >= 1) {
        notes.push({ id: `coord-miss-${w.id}`, title: 'Missing POD Reminder', description: `Waybill ${w.waybillNumber} has been missing for ${daysDiff} day(s). Please submit CTC if original is unavailable.`, timestamp: relTs(w.deliveryDate), read: false, type: 'alert', category: 'logistics', isToday: false });
      }
    });
  }

  if (role === 'Accountant') {
    const validated = SEEDED_WAYBILLS.filter(w => w.status === 'Validated' || w.status === 'CTC Submitted');
    if (validated.length > 0) {
      notes.push({ id: 'acct-validated', title: 'Waybills Ready for Invoicing', description: `${validated.length} validated waybill(s) are available and ready for invoice creation.`, timestamp: relTs(now), read: false, type: 'success', category: 'finance', isToday: true });
    }
    const returned = SEEDED_INVOICES.filter(i => i.status === 'Draft' || i.status === 'Needs Revision');
    returned.forEach(inv => {
      notes.push({ id: `acct-ret-${inv.id}`, title: 'Invoice Needs Revision', description: `Invoice ${inv.invoiceNumber} was returned for revision.`, timestamp: relTs(inv.createdAt), read: false, type: 'alert', category: 'finance', isToday: isToday(inv.createdAt) });
    });
    const rejectedPayments = SEEDED_PAYMENTS.filter(p => p.status === 'Rejected');
    rejectedPayments.forEach(pay => {
      notes.push({ id: `acct-pay-rej-${pay.id}`, title: 'Payment Rejected', description: `Payment ${pay.id} was rejected by the Assistant Finance Manager.`, timestamp: relTs(pay.recordedAt), read: false, type: 'alert', category: 'finance', isToday: isToday(pay.recordedAt) });
    });
    const approved = SEEDED_INVOICES.filter(i => i.status === 'Finalized');
    approved.forEach(inv => {
      notes.push({ id: `acct-apr-${inv.id}`, title: 'Invoice Finalized', description: `Invoice ${inv.invoiceNumber} has been finalized.`, timestamp: relTs(inv.createdAt), read: true, type: 'success', category: 'finance', isToday: isToday(inv.createdAt) });
    });
  }

  if (role === 'Head Accountant') {
    const pending = SEEDED_INVOICES.filter(i => i.status === 'Pending Approval');
    pending.forEach(inv => {
      notes.push({ id: `ha-pend-${inv.id}`, title: 'Invoice Submitted for Review', description: `Invoice ${inv.invoiceNumber} is pending your approval. Amount: ₱${inv.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}.`, timestamp: relTs(inv.createdAt), read: false, type: 'info', category: 'finance', isToday: isToday(inv.createdAt) });
    });
  }

  if (role === 'Assistant of Finance Manager') {
    const pendingPayments = SEEDED_PAYMENTS.filter(p => p.status === 'Pending Validation');
    pendingPayments.forEach(pay => {
      notes.push({ id: `afm-pay-${pay.id}`, title: 'Payment Pending Validation', description: `Payment ${pay.id} of ₱${pay.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} via ${pay.paymentMethod} requires validation.`, timestamp: relTs(pay.recordedAt), read: false, type: 'info', category: 'finance', isToday: isToday(pay.recordedAt) });
    });
    const pendingSP = SEEDED_SPEEDPAY.filter(s => s.status === 'Pending Validation');
    pendingSP.forEach(sp => {
      notes.push({ id: `afm-sp-${sp.id}`, title: 'SpeedPay Submission Pending', description: `SpeedPay submission ${sp.id} via ${sp.paymentMethod} for ₱${sp.amountPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })} awaits validation.`, timestamp: relTs(sp.submittedAt), read: false, type: 'alert', category: 'finance', isToday: isToday(sp.submittedAt) });
    });
    const sevenDays = Date.now() + 7 * 86400000;
    const nearDue = SEEDED_INVOICES.filter(i => ['Finalized'].includes(i.status) && new Date(i.dueDate).getTime() < sevenDays && new Date(i.dueDate).getTime() > Date.now());
    nearDue.forEach(inv => {
      notes.push({ id: `afm-due-${inv.id}`, title: 'Invoice Approaching Due Date', description: `Invoice ${inv.invoiceNumber} is due on ${new Date(inv.dueDate).toLocaleDateString('en-PH')}. Follow up if payment is pending.`, timestamp: relTs(inv.createdAt), read: false, type: 'alert', category: 'finance', isToday: false });
    });
  }

  if (role === 'Finance Manager') {
    const validatedPayments = SEEDED_PAYMENTS.filter(p => p.status === 'Validated');
    validatedPayments.forEach(pay => {
      notes.push({ id: `fm-pay-${pay.id}`, title: 'Payment Validated by Asst. FM', description: `Payment ${pay.id} (₱${pay.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}) has been validated and is awaiting final approval.`, timestamp: relTs(pay.validatedAt || pay.recordedAt), read: false, type: 'success', category: 'finance', isToday: isToday(pay.validatedAt || pay.recordedAt) });
    });
    const overdue = SEEDED_AR_RECORDS.filter(r => r.status === 'Overdue' && ['31-60 days', '61-90 days', '90+ days'].includes(r.agingBracket));
    overdue.forEach(rec => {
      notes.push({ id: `fm-ar-${rec.id}`, title: 'Overdue Account Alert', description: `Invoice ${rec.invoiceId} has crossed into the ${rec.agingBracket} aging bracket. Outstanding: ₱${rec.outstandingBalance.toFixed(2)}.`, timestamp: relTs(rec.dueDate), read: false, type: 'alert', category: 'finance', isToday: false });
    });
  }

  return notes;
}

export interface GlobalHeaderProps {}

const GlobalHeader: React.FC<GlobalHeaderProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [bellAnimating, setBellAnimating] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const timePart = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setCurrentDateTime(`${datePart} • ${timePart}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Generate role-specific notifications from seed data
  const allNotifications = useMemo(() => {
    if (!user || cleared) return [];
    return generateNotifications(user.role);
  }, [user, cleared]);

  // Merge read state
  const notifications = useMemo(() =>
    allNotifications.map(n => ({ ...n, read: readIds.has(n.id) || n.read })),
    [allNotifications, readIds]
  );

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

  // Filter notifications
  const roleRelevantNotifications = notifications;


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
    setReadIds(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(n.id));
      return next;
    });
  };

  const clearAll = () => {
    setCleared(true);
  };

  const toggleReadStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReadIds(prev => {
      const next = new Set(prev);
      const isCurrentlyRead = notifications.find(n => n.id === id)?.read ?? false;
      if (isCurrentlyRead) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Group sorted notifications into Today vs Earlier
  const todayNotifications = useMemo(() => sortedFiltered.filter(n => n.isToday), [sortedFiltered]);
  const earlierNotifications = useMemo(() => sortedFiltered.filter(n => !n.isToday), [sortedFiltered]);

  // Derive title from active route
  const currentTitle = useMemo(() => {
    if (location.pathname.startsWith('/profile')) return 'My Profile';
    if (!user) return 'Dashboard';
    const userGroups = NAV_CONFIG[user.role]?.groups || [];
    for (const group of userGroups) {
      for (const item of group.items) {
        if (location.pathname.startsWith(item.path)) {
          return item.label;
        }
      }
    }
    return 'Dashboard';
  }, [location.pathname, user]);

  // Derive profile display info
  const profileName = user?.fullName || 'Guest User';
  const profileRole = user ? ROLE_LABELS[user.role] : 'Unauthenticated';
  const profileInitials = profileName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <header className="site-header" style={{ zIndex: 99999, position: 'sticky' }}>
      <nav className="nav-bar">
        {/* Left Side: Page Title */}
        <h1 className="header-title">{currentTitle}</h1>
        
        {/* Right Side: Interactive Controls */}
        <div className="header-controls">
          {/* DateTime Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '9999px',
            color: '#334155',
            fontSize: '0.85rem',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            <Clock size={15} style={{ color: '#0EA5E9' }} strokeWidth={2.5} />
            <span>{currentDateTime}</span>
          </div>

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
                style={{ zIndex: 999999 }}
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
                  <button className="view-all-notifications-btn" onClick={() => {
                    navigate('/notifications');
                    setShowNotifications(false);
                  }}>
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
                  {profileInitials}
                </div>
              </div>
            </button>
            
            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-user-info">
                  <div className="profile-dropdown-avatar-wrapper">
                    <div className="profile-dropdown-avatar">
                      {profileInitials}
                    </div>
                  </div>
                  <div className="profile-dropdown-meta">
                    <span className="profile-dropdown-name">{profileName}</span>
                    <span className="profile-dropdown-role">{profileRole}</span>
                  </div>
                </div>
 
                <div className="profile-dropdown-divider" />
                
                {/* Options List */}
                <div className="profile-dropdown-options">
                  <button 
                    className="profile-dropdown-option"
                    onClick={() => {
                      navigate('/profile');
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
                      logout();
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
              <Button 
                title="Cancel" 
                variant="secondary" 
                onClick={() => setShowClearConfirm(false)} 
              />
              <Button 
                title="Clear Notifications" 
                variant="danger" 
                onClick={() => {
                  clearAll();
                  setShowClearConfirm(false);
                }} 
              />
            </div>
          </div>
        </div>
      )}

    </header>
  );
};
 
export default GlobalHeader;
