import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw, CheckCircle, AlertTriangle, Bell, Clock } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface AiHeaderProps {
  title: string;
}

export const AiHeader: React.FC<AiHeaderProps> = ({ title }) => {
  const { permissions, token, user } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const location = useLocation();

  // Live running clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/ai/duplicates/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Analysis run completed!' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const err = await res.json();
        setStatusMsg({ type: 'error', text: err.message || 'Run failed.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'Service unavailable.' });
    } finally {
      setSyncing(false);
    }
  };

  // Generate breadcrumb path based on URL
  const getBreadcrumb = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length <= 1) return 'AI Intelligence';
    
    // Capitalize and format path segments
    const formatted = paths.slice(1).map(p => {
      const replaced = p.replace('-', ' ');
      return replaced.charAt(0).toUpperCase() + replaced.slice(1);
    });
    
    return `AI Intelligence / ${formatted.join(' / ')}`;
  };

  const formatDateTime = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should display as 12
    const hoursStr = String(hours);
    
    return `${dayName}, ${monthName} ${day}, ${year} • ${hoursStr}:${minutes}:${seconds} ${ampm}`;
  };

  // Name mappings for the avatar initials
  const mockNames: Record<string, { name: string; initials: string }> = {
    financial_manager_user: { name: 'Maria Santos', initials: 'MS' },
    head_accountant_user: { name: 'Juan Dela Cruz', initials: 'JD' },
    accountant_user: { name: 'Pedro Penduko', initials: 'PP' },
    coordinator_user: { name: 'Ana Ramos', initials: 'AR' },
    assistant_fm_user: { name: 'Miguel Gomez', initials: 'MG' }
  };

  const currentInfo = user ? (mockNames[user.username] || { 
    name: user.username, 
    initials: user.username.substring(0, 2).toUpperCase() 
  }) : null;

  return (
    <header className="header" style={{ borderBottom: 'none', marginBottom: '8px' }}>
      {/* Page Title & Breadcrumb */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {getBreadcrumb()}
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h1>
      </div>

      {/* Actions, Notifications & Profile */}
      <div className="header-actions" style={{ gap: '16px' }}>
        {/* Sync Status Notifications */}
        {statusMsg && (
          <div className="badge fade-in" style={{
            backgroundColor: statusMsg.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: statusMsg.type === 'success' ? 'var(--success)' : 'var(--danger)',
            border: `1px solid ${statusMsg.type === 'success' ? 'rgba(46, 139, 87, 0.15)' : 'rgba(201, 75, 75, 0.15)'}`,
            padding: '6px 12px',
            borderRadius: '6px'
          }}>
            {statusMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            <span style={{ fontSize: '12px', fontWeight: 600, marginLeft: '6px' }}>{statusMsg.text}</span>
          </div>
        )}

        {/* Sync Button */}
        {permissions?.run_sync && (
          <button 
            onClick={handleManualSync} 
            disabled={syncing}
            className="btn btn-outline"
            style={{ fontSize: '12px', padding: '0 12px', height: '34px', borderRadius: '6px' }}
          >
            <RefreshCw 
              size={12} 
              className={syncing ? 'loader' : ''} 
              style={{ animation: syncing ? 'skeletonPulse 1.6s ease-in-out infinite' : 'none' }} 
            />
            <span>{syncing ? 'Syncing...' : 'Sync Data'}</span>
          </button>
        )}

        {/* Time capsule block - matches the sample UI header capsule */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--surface-teal)',
          border: '1px solid rgba(0, 140, 149, 0.15)',
          padding: '6px 16px',
          borderRadius: '100px',
          color: 'var(--primary-dark)',
          fontSize: '12px',
          fontWeight: 600
        }}>
          <Clock size={13} style={{ color: 'var(--primary)' }} />
          <span>{formatDateTime(currentTime)}</span>
        </div>

        {/* System Connection Dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block' }}></span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Live API</span>
        </div>

        {/* Notification Bell with red counter badge '15' */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button 
            className="close-btn" 
            style={{ 
              padding: '8px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--surface)', 
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="View notifications"
          >
            <Bell size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: 'var(--danger)',
            color: '#ffffff',
            fontSize: '9px',
            fontWeight: 800,
            padding: '2px 5px',
            borderRadius: '10px',
            lineHeight: 1,
            border: '2px solid var(--surface-soft)'
          }}>
            15
          </span>
        </div>

        {/* JD Profile initials block - matches top-right corner */}
        {currentInfo && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="user-avatar" style={{ 
              width: '36px', 
              height: '36px', 
              fontSize: '12px', 
              borderRadius: '50%', 
              backgroundColor: '#d0e3ec', 
              border: '1px solid rgba(7, 21, 45, 0.1)',
              color: 'var(--text-primary)',
              fontWeight: 700
            }}>
              {currentInfo.initials}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
