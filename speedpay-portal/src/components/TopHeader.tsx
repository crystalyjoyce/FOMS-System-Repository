import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useClientContext } from '../context/ClientContext';
import { useLocation } from 'react-router-dom';

export const TopHeader: React.FC = () => {
  const { user } = useClientContext();
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric'
  });

  return (
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
          <i className="ti ti-clock" /> {formattedDate}
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

        <div style={{ 
          width: '32px', height: '32px', borderRadius: '50%', background: '#0EA5E9', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontWeight: 600, fontSize: '13px', color: '#FFF' 
        }}>
          {user?.avatarInitials}
        </div>
      </div>
    </div>
  );
};
