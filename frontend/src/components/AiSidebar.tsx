import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionContext';
import { 
  LayoutDashboard, AlertOctagon, TrendingUp, Sparkles, 
  FileText, History, User, LogOut, ClipboardList, ShieldAlert
} from 'lucide-react';

export const AiSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const currentInfo = {
    name: user.username.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    initials: user.username.split('_').map(w => w[0]?.toUpperCase() || '').join('').slice(0, 2) || 'US'
  };

  return (
    <aside className="sidebar">
      {/* Speedex Logo Section */}
      <div className="sidebar-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', padding: '24px 20px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.06em', fontStyle: 'italic', fontFamily: '"Arial Black", Gadget, sans-serif' }}>
            SPEEDEX
          </span>
        </div>
        <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--logo-red)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          COURIER & FORWARDER, INC.
        </span>
      </div>
      
      <div className="sidebar-nav">
        {/* MAIN GROUP */}
        <span className="sidebar-label">MAIN</span>
        {hasPermission("ai.dashboard.view") && (
          <NavLink to="/ai/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
        )}
        
        {/* DUPLICATE DETECTION GROUP */}
        {(hasPermission("ai.duplicate.view") || hasPermission("ai.duplicate.review")) && (
          <>
            <span className="sidebar-label" style={{ marginTop: '16px' }}>DUPLICATE DETECTION</span>
            {hasPermission("ai.duplicate.view") && (
              <NavLink to="/ai/duplicate-alerts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <AlertOctagon size={18} />
                <span>Duplicate Alerts</span>
              </NavLink>
            )}
            {hasPermission("ai.duplicate.review") && (
              <NavLink to="/ai/duplicate-alerts?action=review" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <ClipboardList size={18} />
                <span>Alert Review</span>
              </NavLink>
            )}
          </>
        )}

        {/* COLLECTION INTELLIGENCE GROUP */}
        {hasPermission("ai.collection.view") && (
          <>
            <span className="sidebar-label" style={{ marginTop: '16px' }}>COLLECTION INTELLIGENCE</span>
            <NavLink to="/ai/collection-priorities" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <TrendingUp size={18} />
              <span>Collection Priorities</span>
            </NavLink>
            <NavLink to="/ai/collection-recommendations" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Sparkles size={18} />
              <span>Recommendations</span>
            </NavLink>
          </>
        )}

        {/* ANALYTICS & CONTROL GROUP */}
        {(hasPermission("ai.reports.view") || hasPermission("ai.audit.view") || hasPermission("ai.audit.view_limited")) && (
          <>
            <span className="sidebar-label" style={{ marginTop: '16px' }}>ANALYTICS & CONTROL</span>
            {hasPermission("ai.reports.view") && (
              <NavLink to="/ai/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FileText size={18} />
                <span>Reports</span>
              </NavLink>
            )}
            {(hasPermission("ai.audit.view") || hasPermission("ai.audit.view_limited")) && (
              <>
                <NavLink to="/ai/review-history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <History size={18} />
                  <span>Review History</span>
                </NavLink>
                <NavLink to="/ai/audit-trail" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <ShieldAlert size={18} />
                  <span>Audit Trail</span>
                </NavLink>
              </>
            )}
          </>
        )}

        {/* ACCOUNT GROUP */}
        <span className="sidebar-label" style={{ marginTop: '16px' }}>ACCOUNT</span>
        <NavLink to="/ai/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={18} />
          <span>Profile</span>
        </NavLink>
      </div>

      {/* Footer / User Profile section */}
      <div className="sidebar-footer" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="user-profile">
          <div className="user-avatar" style={{ backgroundColor: 'var(--primary)', color: '#ffffff', fontWeight: 700, borderRadius: '8px' }}>
            {currentInfo.initials}
          </div>
          <div className="user-info">
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
              {currentInfo.name}
            </h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--sidebar-text)' }}>
              {user.role}
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="btn" 
          style={{ 
            width: '100%', 
            height: '34px', 
            backgroundColor: 'rgba(255, 255, 255, 0.06)', 
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#b8c7dc',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
