import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleReturn = () => {
    navigate('/ai/dashboard');
  };

  const handleSwitchAccount = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--s1, #F7F9FF)' }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '480px', padding: '40px', textAlign: 'center', border: '1px solid var(--border, #DDE2EB)', borderRadius: 'var(--r-md, 12px)', boxShadow: 'var(--sh2)' }}>
        <h1 style={{ fontSize: '72px', fontWeight: 800, color: 'var(--teal, #00A99D)', margin: '0 0 8px', letterSpacing: '-0.02em', fontFamily: 'var(--fh)' }}>
          403
        </h1>
        <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tt, #6B7280)', margin: '0 0 16px' }}>
          Access Restricted
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--tp, #0F172A)', margin: '0 0 12px', fontFamily: 'var(--fh)' }}>
          You do not have permission to view this.
        </h2>

        <p style={{ fontSize: '14px', color: 'var(--ts, #374151)', lineHeight: 1.5, margin: '0 0 28px' }}>
          Your current role ({user?.role || 'Guest'}) does not include access to this section. Contact your system administrator if you believe this is an error.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={handleReturn}
            className="btn btn-outline"
            style={{ height: '40px', fontSize: '13px', padding: '0 18px' }}
          >
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </button>

          <button
            onClick={handleSwitchAccount}
            style={{
              height: '40px',
              fontSize: '13px',
              padding: '0 18px',
              background: 'var(--teal, #00A99D)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--r-sm, 8px)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Log In as Different Role
          </button>
        </div>
      </div>
    </div>
  );
};
