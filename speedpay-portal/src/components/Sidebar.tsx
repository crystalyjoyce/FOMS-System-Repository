import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, CreditCard, History } from 'lucide-react';
import { useClientContext } from '../context/ClientContext';

export const Sidebar: React.FC = () => {
  const { user } = useClientContext();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'My Invoices', path: '/invoices', icon: <FileText size={20} /> },
    { name: 'Pay an Invoice', path: '/pay', icon: <CreditCard size={20} /> },
    { name: 'Payment History', path: '/history', icon: <History size={20} /> },
  ];

  return (
    <div style={{
      width: '272px',
      background: '#0B1437',
      color: '#F8FAFC',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      fontFamily: '"Inter", sans-serif',
      borderRight: '1px solid rgba(255, 255, 255, 0.04)'
    }}>
      <div style={{ padding: '14px 16px', minHeight: '62px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <img src="/logo.png" alt="Speedex" style={{ maxHeight: '38px', maxWidth: '180px', objectFit: 'contain' }} />
        </h1>
      </div>

      <div style={{ padding: '8px', flex: 1, overflowY: 'auto' }}>
        <div style={{ 
          fontSize: '9px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.35)', 
          letterSpacing: '1.5px', textTransform: 'uppercase', 
          padding: '8px 12px 6px', margin: 0 
        }}>
          SPEEDPAY
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '8px',
                color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.55)',
                background: isActive ? 'rgba(0, 169, 157, 0.12)' : 'transparent',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s',
                borderLeft: isActive ? '3px solid #00A99D' : '3px solid transparent'
              })}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 10px', borderRadius: '8px', background: 'transparent' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '8px', 
              background: 'linear-gradient(135deg, #00A99D, #1B254B)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 800, fontSize: '12px', color: '#fff', flexShrink: 0,
              border: '1.5px solid rgba(255, 255, 255, 0.1)',
              fontFamily: '"Montserrat", sans-serif'
            }}>
              {user?.avatarInitials}
            </div>
            <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</span>
              <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.35)' }}>{user?.companyName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
