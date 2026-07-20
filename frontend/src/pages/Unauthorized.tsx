import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface-soft)' }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '440px', padding: '40px', textAlign: 'center', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'var(--danger-bg)', padding: '16px', borderRadius: '50%', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={36} />
          </div>
        </div>
        
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Access Restricted
        </h2>
        
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '28px' }}>
          Your current authenticated workspace role <strong>({user?.role || 'Guest'})</strong> does not have authorization to view this financial intelligence workspace.
        </p>

        <button 
          onClick={handleBackToLogin}
          className="btn btn-secondary"
          style={{ width: '100%', height: '42px', fontSize: '14px' }}
        >
          <ArrowLeft size={16} />
          <span>Return to Authentication Screen</span>
        </button>
      </div>
    </div>
  );
};
