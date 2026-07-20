import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string>('Financial Manager');
  const [username, setUsername] = useState<string>('EMP-001');
  const [password, setPassword] = useState<string>('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = [
    "Financial Manager",
    "Head Accountant",
    "Accountant",
    "Coordinator",
    "Assistant of Financial Manager",
    "Client"
  ];

  // Helper to map selected role to its Employee ID for simulation autofill
  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setPassword('Password@123');
    switch (role) {
      case 'Financial Manager':
        setUsername('EMP-001');
        break;
      case 'Head Accountant':
        setUsername('EMP-002');
        break;
      case 'Accountant':
        setUsername('EMP-003');
        break;
      case 'Coordinator':
        setUsername('EMP-004');
        break;
      case 'Assistant of Financial Manager':
        setUsername('EMP-005');
        break;
      case 'Client':
        setUsername('EMP-006');
        break;
      default:
        setUsername('EMP-001');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please fill in both Employee ID and password fields.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(selectedRole);
      if (selectedRole === 'Client') {
        navigate('/unauthorized');
      } else {
        navigate('/ai/dashboard');
      }
    } catch (e) {
      setError("Authentication failed. Please verify connection to database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container" style={{ display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Left Panel - Deep Navy Blue branding backdrop */}
      <div className="login-left-panel" style={{ 
        flex: 1, 
        backgroundColor: '#0b0f19', 
        color: '#ffffff', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '60px 80px', 
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {/* Speedex Logo - Matches white italic text and red subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.06em', fontStyle: 'italic', fontFamily: '"Arial Black", Gadget, sans-serif' }}>
              30 SPEEDEX
            </span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--logo-red)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            COURIER & FORWARDER, INC.
          </span>
        </div>

        {/* Title */}
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: 700, 
          letterSpacing: '0.04em', 
          textTransform: 'uppercase', 
          color: 'rgba(255,255,255,0.9)', 
          marginBottom: '40px', 
          borderBottom: '1px solid rgba(255,255,255,0.1)', 
          paddingBottom: '20px',
          margin: 0
        }}>
          FINANCE OPERATIONS MANAGEMENT SYSTEM
        </h2>

        {/* Steps timeline list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(255,255,255,0.06)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '14px', 
              fontWeight: 700, 
              border: '1px solid rgba(255,255,255,0.2)',
              flexShrink: 0
            }}>1</div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px 0' }}>Enter Credentials</h4>
              <p style={{ fontSize: '13px', color: '#a0aec0', margin: 0 }}>Use your assigned Employee ID and password to access FOMS.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(255,255,255,0.06)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '14px', 
              fontWeight: 700, 
              border: '1px solid rgba(255,255,255,0.2)',
              flexShrink: 0
            }}>2</div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px 0' }}>Manage Receivables</h4>
              <p style={{ fontSize: '13px', color: '#a0aec0', margin: 0 }}>Create invoices, record payments, and monitor outstanding balances in real-time.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(255,255,255,0.06)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '14px', 
              fontWeight: 700, 
              border: '1px solid rgba(255,255,255,0.2)',
              flexShrink: 0
            }}>3</div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px 0' }}>Track Collections</h4>
              <p style={{ fontSize: '13px', color: '#a0aec0', margin: 0 }}>View aging reports and analytics to streamline collection workflows.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Floating white login card */}
      <div className="login-right-panel" style={{ 
        flex: 1.2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#f0f4f8', 
        padding: '40px',
        boxSizing: 'border-box'
      }}>
        <div className="card fade-in" style={{ 
          width: '100%', 
          maxWidth: '460px', 
          padding: '40px', 
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)', 
          border: '1px solid var(--border-soft)',
          boxSizing: 'border-box'
        }}>
          
          {/* Secure Access tag */}
          <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            SECURE ACCESS
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', lineHeight: 1.3 }}>
            Login to Finance Operations Management System (FOMS)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px 0' }}>
            Enter your credentials below to continue.
          </p>

          {error && (
            <div className="badge badge-rejected" style={{ width: '100%', padding: '10px 14px', marginBottom: '20px', borderRadius: '8px', display: 'block', fontSize: '13px', boxSizing: 'border-box' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Employee ID */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                EMPLOYEE ID
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-control"
                  style={{ paddingLeft: '40px', height: '42px', borderRadius: '8px', fontSize: '14px' }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="EMP-001"
                  required
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                Try: EMP-001 to EMP-005, Password: Password@123
              </span>
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="form-control"
                  style={{ paddingLeft: '40px', height: '42px', borderRadius: '8px', fontSize: '14px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', fontSize: '13px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)' }} />
                Remember me
              </label>
              <a href="#forgot" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</a>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="btn"
              style={{ 
                width: '100%', 
                height: '44px', 
                backgroundColor: '#1d2331', 
                color: '#ffffff', 
                fontSize: '13px', 
                fontWeight: 700, 
                borderRadius: '8px', 
                border: 'none', 
                letterSpacing: '0.04em',
                cursor: 'pointer'
              }}
            >
              {loading ? 'AUTHENTICATING...' : 'LOG IN'}
            </button>

            {/* Role select grid for simulation clearances */}
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-soft)', paddingTop: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                Simulation Helper (Autofill role credentials)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {roles.map(role => (
                  <button
                    key={role}
                    type="button"
                    style={{
                      padding: '8px 10px',
                      fontSize: '11px',
                      backgroundColor: selectedRole === role ? 'var(--primary-light)' : 'var(--surface-soft)',
                      border: `1px solid ${selectedRole === role ? 'var(--primary)' : 'var(--border-soft)'}`,
                      color: selectedRole === role ? 'var(--primary-dark)' : 'var(--text-secondary)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onClick={() => handleRoleChange(role)}
                  >
                    <span>{role.replace('Assistant of Financial Manager', 'Asst. FM')}</span>
                    {selectedRole === role && <span style={{ color: 'var(--primary)', fontSize: '8px' }}>●</span>}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
