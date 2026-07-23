import React, { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, User, Building, Mail } from 'lucide-react';
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

  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });

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
          <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {formattedDate}
          </div>
          
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNotifications(!showNotifications)}>
            <div style={{ padding: '8px', background: '#F1F5F9', borderRadius: '50%' }}>
              <Bell size={20} color="#475569" />
            </div>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '18px', height: '18px', background: '#EF4444', borderRadius: '50%', color: '#FFF', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #FFF' }}>
              3
            </div>
            
            {showNotifications && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '320px', background: '#FFF', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0', zIndex: 50, cursor: 'default' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0', fontWeight: 700, color: '#0F172A' }}>Notifications</div>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', background: '#F0F9FF' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }} />
                    New Invoice Added
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', marginLeft: '16px' }}>INV-10260 is now available for viewing.</div>
                </div>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Payment Validated</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Official Receipt OR-2026-0099 is now available.</div>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Due Soon</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>INV-10231 is due on Jul 20, 2026.</div>
                </div>
                <div style={{ padding: '12px', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <button style={{ background: 'none', border: 'none', color: '#0EA5E9', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Mark all as read</button>
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
