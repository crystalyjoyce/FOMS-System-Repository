import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../data/seed';
import { Card } from '../components/Card';
import { relativeTime } from '../components/RecentActivity';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const loginHistoryFeed = useMemo(() => {
    if (!user.loginHistory) return [];
    
    // We will generate pseudo-random devices/IPs based on the timestamp string so it's consistent.
    const devices = [
      'MacBook Pro / 192.168.1.45',
      'iPhone 15 Pro / 112.44.21.9',
      'Windows Desktop / 192.168.1.12',
      'iPad Pro / 10.0.0.15'
    ];
    
    return user.loginHistory.map((isoString, index) => {
      const d = new Date(isoString);
      const hash = Array.from(isoString).reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const deviceName = devices[hash % devices.length];
      const relTime = relativeTime(isoString);
      
      return {
        id: index.toString(),
        rawDate: d,
        message: `${relTime} · ${user.fullName} · ${deviceName}`
      };
    }).sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
  }, [user.loginHistory, user.fullName]);

  const email = `${user.fullName.toLowerCase().replace(/\s+/g, '.')}@foms.global`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Card: User Info */}
      <Card noPadding>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0F172A' }}>{user.fullName}</h2>
        </div>
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>FULL LEGAL NAME</p>
              <p style={{ margin: 0, fontSize: '1rem', color: '#0F172A', fontWeight: 500 }}>{user.fullName}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>EMAIL ADDRESS</p>
              <p style={{ margin: 0, fontSize: '1rem', color: '#0F172A', fontWeight: 500 }}>{email}</p>
            </div>
          </div>
          <div>
            <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>ASSIGNED ROLE</p>
            <p style={{ margin: 0, fontSize: '1rem', color: '#0F172A', fontWeight: 500 }}>{ROLE_LABELS[user.role] || user.role}</p>
          </div>
        </div>
      </Card>

      {/* Bottom Card: Login History */}
      <Card noPadding>
        <style>
          {`
            .ra-item {
              transition: transform 0.2s ease, background-color 0.2s ease;
              padding: 12px 32px;
              cursor: default;
            }
            .ra-item:hover {
              transform: translateX(6px);
              background-color: #F8FAFC;
            }
            .ra-arrow {
              opacity: 0;
              transform: translateX(-10px);
              transition: all 0.2s ease;
              color: #00A99D;
              font-weight: bold;
              margin-left: 8px;
            }
            .ra-item:hover .ra-arrow {
              opacity: 1;
              transform: translateX(0);
            }
          `}
        </style>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>Recent Login History</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Last 30 Days</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {loginHistoryFeed.length === 0 ? (
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', textAlign: 'center', padding: '24px 0' }}>No recent login history.</p>
          ) : (
            loginHistoryFeed.map((log, idx) => (
              <div key={log.id} className="ra-item" style={{ display: 'flex', gap: 12, alignItems: 'center', borderBottom: idx < loginHistoryFeed.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#94A3B8', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', fontWeight: 500 }}>{log.message}</p>
                  <span className="ra-arrow">→</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid #E2E8F0', textAlign: 'center', background: '#F8FAFC', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
          <button style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
            View All Security Logs
          </button>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
