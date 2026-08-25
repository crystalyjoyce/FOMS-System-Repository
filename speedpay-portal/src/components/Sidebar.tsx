import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, CreditCard, History, ChevronUp, User, Settings, LogOut } from 'lucide-react';
import { useClientContext } from '../context/ClientContext';

export const Sidebar: React.FC = () => {
  const { user } = useClientContext();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'My Invoices', path: '/invoices', icon: <FileText size={20} /> },
    { name: 'Pay an Invoice', path: '/pay', icon: <CreditCard size={20} /> },
    { name: 'Payment History', path: '/history', icon: <History size={20} /> },
  ];

  const navigate = useNavigate();
  const { logout } = useClientContext();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      <div className="sidebar-footer" ref={profileMenuRef} style={{ position: 'relative', padding: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {isProfileMenuOpen && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '8px',
              right: '8px',
              background: '#fff',
              borderRadius: '12px',
              padding: '16px 0',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              zIndex: 100,
              color: '#0F172A'
            }}>
              <div style={{ padding: '0 16px 12px 16px', borderBottom: '1px solid #E2E8F0', marginBottom: '8px' }}>
                <div style={{ fontWeight: 700, color: '#1B254B', fontSize: '14px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                <div style={{ color: '#64748B', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.companyName}</div>
              </div>
              
              <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#1B254B', fontSize: '14px', fontWeight: 600, textAlign: 'left' }} onClick={() => { setIsProfileMenuOpen(false); }}>
                <User size={18} color="#64748B" /> My Profile
              </button>
              
              <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#1B254B', fontSize: '14px', fontWeight: 600, textAlign: 'left' }}>
                <Settings size={18} color="#64748B" /> System Settings
              </button>
              
              <div style={{ height: '1px', background: '#E2E8F0', margin: '8px 0' }}></div>
              
              <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '14px', fontWeight: 600, textAlign: 'left' }} onClick={() => { logout(); setIsProfileMenuOpen(false); navigate('/login'); }}>
                <LogOut size={18} /> Log Out
              </button>
            </div>
          )}

        <div onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 10px', borderRadius: '8px', background: 'transparent' }}>
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
          <ChevronUp size={14} color="#94A3B8" />
        </div>
      </div>
    </div>
  );
};
