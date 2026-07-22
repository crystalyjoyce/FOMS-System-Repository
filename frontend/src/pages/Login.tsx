import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, KeyRound, Sparkles, ShieldCheck, HelpCircle, RefreshCw } from 'lucide-react';

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
      setError("Authentication failed. Please verify database connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container" style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      width: '100vw', 
      backgroundColor: '#f8fafc', 
      fontFamily: '"Outfit", "Segoe UI", "Roboto", sans-serif' 
    }}>
      
      {/* Left Panel - Deep Navy Blue branding backdrop */}
      <div className="login-left-panel" style={{ 
        flex: 1.1, 
        background: 'linear-gradient(145deg, #0b0f19 0%, #1e293b 100%)', 
        color: '#ffffff', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '60px 80px', 
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {/* Decorative glass container overlay */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          left: '-15%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 169, 157, 0.08) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />

        {/* Speedex Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '60px' }}>
          <img 
            src="/logo.png" 
            alt="30 Speedex Courier & Forwarder, Inc." 
            style={{ 
              height: '46px', 
              width: 'auto',
              objectFit: 'contain',
              alignSelf: 'flex-start'
            }} 
          />
        </div>

        {/* Title */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 800, 
            letterSpacing: '0.04em', 
            textTransform: 'uppercase', 
            color: 'rgba(255,255,255,0.95)', 
            marginBottom: '12px', 
            fontFamily: '"Outfit", sans-serif'
          }}>
            FINANCE OPERATIONS MANAGEMENT SYSTEM
          </h2>
          <div style={{ width: '48px', height: '4px', background: 'var(--teal)', borderRadius: '2px' }} />
        </div>

        {/* Steps timeline list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '12px', 
              backgroundColor: 'rgba(0, 169, 157, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '15px', 
              fontWeight: 700, 
              border: '1px solid rgba(0, 169, 157, 0.3)',
              color: 'var(--teal)',
              flexShrink: 0
            }}>1</div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>Enter Credentials</h4>
              <p style={{ fontSize: '13.5px', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                Use your assigned Employee ID and password to access the secure portal.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '12px', 
              backgroundColor: 'rgba(0, 169, 157, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '15px', 
              fontWeight: 700, 
              border: '1px solid rgba(0, 169, 157, 0.3)',
              color: 'var(--teal)',
              flexShrink: 0
            }}>2</div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>Manage Receivables</h4>
              <p style={{ fontSize: '13.5px', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                Create invoices, track customer accounts, and monitor outstanding balances.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '12px', 
              backgroundColor: 'rgba(0, 169, 157, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '15px', 
              fontWeight: 700, 
              border: '1px solid rgba(0, 169, 157, 0.3)',
              color: 'var(--teal)',
              flexShrink: 0
            }}>3</div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>Track Collections</h4>
              <p style={{ fontSize: '13.5px', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                Review real-time collection aging analytics, duplicates, and AI predictions.
              </p>
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
        backgroundColor: '#f1f5f9', 
        padding: '40px',
        boxSizing: 'border-box'
      }}>
        <div className="card fade-in" style={{ 
          width: '100%', 
          maxWidth: '480px', 
          padding: '44px 40px', 
          backgroundColor: '#ffffff', 
          borderRadius: '20px', 
          boxShadow: '0 15px 35px rgba(15, 23, 42, 0.06)', 
          border: '1px solid var(--border)',
          boxSizing: 'border-box'
        }}>
          
          {/* Secure Access tag */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--teal-bg)', padding: '4px 10px', borderRadius: '20px', marginBottom: '14px' }}>
            <ShieldCheck size={13} style={{ color: 'var(--teal)' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--teal-dark)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Secure Access Portal
            </span>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--tp)', margin: '0 0 8px 0', lineHeight: 1.25, fontFamily: '"Outfit", sans-serif' }}>
            Login to FOMS
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--ts)', margin: '0 0 28px 0' }}>
            Enter your employee credentials below to connect to Speedex operations.
          </p>

          {error && (
            <div className="advisory-banner danger" style={{ padding: '12px 16px', marginBottom: '24px', borderRadius: '10px', fontSize: '13.5px', boxSizing: 'border-box' }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Employee ID */}
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--tt)', display: 'block', marginBottom: '8px' }}>
                EMPLOYEE ID
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--ts)' }} />
                <input 
                  type="text" 
                  className="form-control"
                  style={{ 
                    paddingLeft: '42px', 
                    height: '42px', 
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    fontFamily: 'var(--fb)', 
                    border: '1px solid var(--border)' 
                  }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="EMP-001"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--tt)', display: 'block', marginBottom: '8px' }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--ts)' }} />
                <input 
                  type="password" 
                  className="form-control"
                  style={{ 
                    paddingLeft: '42px', 
                    height: '42px', 
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    fontFamily: 'var(--fb)', 
                    border: '1px solid var(--border)' 
                  }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '26px', fontSize: '13.5px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ts)', cursor: 'pointer', fontWeight: 500 }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--teal)' }} />
                Remember me
              </label>
              <a href="#forgot" style={{ color: 'var(--teal)', textDecoration: 'none', fontWeight: 700 }}>Forgot password?</a>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ 
                width: '100%', 
                height: '46px', 
                fontSize: '14px', 
                fontWeight: 700, 
                borderRadius: '8px', 
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <KeyRound size={16} />}
              <span>{loading ? 'AUTHENTICATING...' : 'LOG IN TO SYSTEM'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
