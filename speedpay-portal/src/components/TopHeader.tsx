import React, { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, User, Building, Mail, CheckCheck, AlertTriangle, CheckCircle, Truck, Trash2, ChevronRight, Clock } from 'lucide-react';
import { useClientContext } from '../context/ClientContext';
import { useLocation } from 'react-router-dom';

export const TopHeader: React.FC = () => {
  const { user, logout } = useClientContext();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/invoices': return 'My Invoices';
      case '/pay': return 'Pay an Invoice';
      case '/history': return 'Payment History';
      default: return '';
    }
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isViewAllHovered, setIsViewAllHovered] = useState(false);
  const [isTrashHovered, setIsTrashHovered] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formattedDateTime = (() => {
    const dateStr = currentDate.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
    const timeStr = currentDate.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
    });
    return `${dateStr} • ${timeStr}`;
  })();

  const maskEmail = (emailStr?: string) => {
    const raw = emailStr || 'juan@tiktok.com';
    const [name, domain] = raw.split('@');
    if (!name || !domain) return raw;
    return `${name[0]}***@${domain}`;
  };

  return (
    <>
      <div style={{
        height: '70px',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        fontFamily: '"Inter", sans-serif'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
          {getPageTitle()}
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Date and Time Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '9999px',
            color: '#334155',
            fontSize: '13px',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            <Clock size={15} style={{ color: '#0D9488' }} strokeWidth={2.5} />
            <span>{formattedDateTime}</span>
          </div>
          
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNotifications(!showNotifications)}>
            <div style={{ padding: '8px', background: '#F1F5F9', borderRadius: '50%' }}>
              <Bell size={20} color="#475569" />
            </div>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '18px', height: '18px', background: '#EF4444', borderRadius: '50%', color: '#FFF', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #FFF' }}>
              3
            </div>
            
            {showNotifications && (
              <div style={{ 
                position: 'absolute', top: '100%', right: 0, marginTop: '8px', 
                width: '380px', background: '#FFF', borderRadius: '8px', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0', 
                zIndex: 50, cursor: 'default', overflow: 'hidden', display: 'flex', flexDirection: 'column'
              }} onClick={e => e.stopPropagation()}>
                
                {/* Header Row 1 */}
                <div style={{ padding: '16px 16px 12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>Notifications</span>
                    <span style={{ background: '#E0F2FE', color: '#0284C7', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>4 new</span>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: '#0EA5E9', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                    <CheckCheck size={14} /> Mark all as read
                  </button>
                </div>

                {/* Tabs */}
                <div style={{ padding: '0 16px', display: 'flex', gap: '20px', borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ paddingBottom: '8px', borderBottom: '2px solid #0EA5E9', color: '#0EA5E9', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    All
                  </div>
                  <div style={{ paddingBottom: '8px', color: '#64748B', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                    Unread (4)
                  </div>
                </div>

                {/* Scrollable list */}
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <div style={{ padding: '12px 16px 8px 16px', fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em' }}>
                    TODAY
                  </div>

                  {/* Notification 1 */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9', position: 'relative' }}>
                    <div style={{ width: '3px', background: '#EF4444', position: 'absolute', left: 0, top: 0, bottom: 0 }} />
                    <div style={{ padding: '16px', paddingLeft: '20px', display: 'flex', gap: '12px', width: '100%', background: '#FAFAFA' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={16} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>SLA Breach Warning</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F3E8FF', color: '#7E22CE', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, marginBottom: '8px' }}>
                          <Truck size={10} /> LOGISTICS
                        </div>
                        <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.4', marginBottom: '12px' }}>
                          Route #8 is running 35 mins behind schedule. SLA impact imminent.
                        </div>
                        <button style={{ background: '#FFF', border: '1px solid #0EA5E9', color: '#0EA5E9', fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginBottom: '8px', letterSpacing: '0.02em' }}>
                          VIEW ROUTE #8 →
                        </button>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>2m ago</div>
                      </div>
                    </div>
                  </div>

                  {/* Notification 2 */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9', position: 'relative' }}>
                    <div style={{ width: '3px', background: '#10B981', position: 'absolute', left: 0, top: 0, bottom: 0 }} />
                    <div style={{ padding: '16px', paddingLeft: '20px', display: 'flex', gap: '12px', width: '100%' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#D1FAE5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle size={16} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Fleet Report Available</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F3E8FF', color: '#7E22CE', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, marginBottom: '8px' }}>
                          <Truck size={10} /> LOGISTICS
                        </div>
                        <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.4', marginBottom: '12px' }}>
                          Weekly dispatch efficiency audit is ready for download.
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>1h ago</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #E2E8F0', background: '#F7F9FF', gap: '10px' }}>
                  <button 
                    onMouseEnter={() => setIsViewAllHovered(true)}
                    onMouseLeave={() => setIsViewAllHovered(false)}
                    style={{ 
                      flexGrow: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: isViewAllHovered ? '#F0F4FF' : 'transparent',
                      color: isViewAllHovered ? '#00A99D' : '#374151',
                      transition: 'all 150ms'
                    }}
                  >
                    <span>View all notifications</span>
                    <ChevronRight size={14} />
                  </button>
                  <button 
                    onMouseEnter={() => setIsTrashHovered(true)}
                    onMouseLeave={() => setIsTrashHovered(false)}
                    style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: isTrashHovered ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                      color: '#DC2626',
                      transition: 'all 150ms'
                    }}
                    title="Clear all notifications"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu Trigger */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <div 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{ 
                width: '36px', height: '36px', borderRadius: '50%', background: '#0EA5E9', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontWeight: 700, fontSize: '13px', color: '#FFF', cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(14, 165, 233, 0.25)',
                transition: 'all 0.15s ease',
                outline: showProfileMenu ? '3px solid rgba(14, 165, 233, 0.3)' : 'none'
              }}
              title="Account Information & Logout"
            >
              {user?.avatarInitials || 'JD'}
            </div>

            {/* Account Information Popover */}
            {showProfileMenu && (
              <div 
                style={{ 
                  position: 'absolute', top: '100%', right: 0, marginTop: '10px', 
                  width: '280px', background: '#FFFFFF', borderRadius: '14px', 
                  boxShadow: '0 20px 25px -5px rgba(15,23,42,0.12), 0 8px 10px -6px rgba(15,23,42,0.06)', 
                  border: '1px solid #E2E8F0', zIndex: 60, padding: '16px',
                  fontFamily: '"Inter", sans-serif'
                }}
                onClick={e => e.stopPropagation()}
              >
                {/* User Card Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ 
                    width: '42px', height: '42px', borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontWeight: 800, fontSize: '15px', color: '#FFF', flexShrink: 0 
                  }}>
                    {user?.avatarInitials || 'JD'}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.name || 'Juan Dela Cruz'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.companyName || 'Tiktok Company'}
                    </div>
                  </div>
                </div>

                {/* Account Info List */}
                <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} color="#64748B" /> Client ID
                    </span>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{user?.id || 'JD-001'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building size={14} color="#64748B" /> Company
                    </span>
                    <span style={{ fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                      {user?.companyName || 'Tiktok Company'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} color="#64748B" /> Email
                    </span>
                    <span style={{ fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                      {maskEmail(user?.email)}
                    </span>
                  </div>
                </div>

                {/* Log Out Action */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px', marginTop: '4px' }}>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowLogoutModal(true);
                    }}
                    style={{ 
                      width: '100%', padding: '10px 12px', borderRadius: '8px', 
                      background: '#FEF2F2', border: '1px solid #FEE2E2', 
                      color: '#DC2626', fontSize: '13px', fontWeight: 600, 
                      cursor: 'pointer', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', gap: '8px', transition: 'all 0.2s ease'
                    }}
                  >
                    <LogOut size={16} /> Log Out Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 100, fontFamily: '"Inter", sans-serif'
        }}>
          <div style={{ 
            background: '#FFFFFF', borderRadius: '16px', width: '100%', 
            maxWidth: '400px', padding: '28px', textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' 
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
              Log Out Confirmation
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '13.5px', color: '#64748B', lineHeight: '1.5' }}>
              Are you sure you really want to log out of your SpeedPay account?
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{ 
                  flex: 1, padding: '12px', borderRadius: '8px', 
                  background: '#F1F5F9', border: '1px solid #E2E8F0', 
                  color: '#475569', fontSize: '14px', fontWeight: 600, 
                  cursor: 'pointer', transition: 'background 0.2s' 
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
                style={{ 
                  flex: 1, padding: '12px', borderRadius: '8px', 
                  background: '#DC2626', border: 'none', 
                  color: '#FFFFFF', fontSize: '14px', fontWeight: 600, 
                  cursor: 'pointer', boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
                  transition: 'background 0.2s' 
                }}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
