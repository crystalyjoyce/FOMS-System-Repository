/**
 * ─── FOMS Login Page ──────────────────────────────────────────────
 * FR-001: Authorized users log in with Employee ID and password.
 * FR-002: Credentials verified against seeded user database.
 * Matches the reference design: split-panel layout.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContext';
import { FEATURE_HIGHLIGHTS } from '../data/seed';
import './LoginPage.css';

// ── Validation ────────────────────────────────────────────────────

interface FormErrors {
  employeeId?: string;
  password?: string;
}

const EMP_ID_REGEX = /^EMP-\d{3,}$/i;

function validateForm(employeeId: string, password: string): FormErrors {
  const errors: FormErrors = {};

  if (!employeeId.trim()) {
    errors.employeeId = 'Employee ID is required.';
  } else if (!EMP_ID_REGEX.test(employeeId.trim())) {
    errors.employeeId = 'Invalid format. Use EMP-XXX (e.g. EMP-003).';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  return errors;
}

// ─── Component ───────────────────────────────────────────────────

export function LoginPage() {
  const { login, registerUser, isLoading } = useAuth();
  const { toast } = useToast();

  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Create Account State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmpId, setNewEmpId] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<any>('Accountant');
  const [newPassword, setNewPassword] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newEmpId.trim() || !newFullName.trim() || !newPassword) {
      setCreateError('Please fill in all required fields.');
      return;
    }

    if (!EMP_ID_REGEX.test(newEmpId.trim())) {
      setCreateError('Employee ID must follow format EMP-XXX (e.g. EMP-006).');
      return;
    }

    if (newPassword.length < 8) {
      setCreateError('Password must be at least 8 characters long.');
      return;
    }

    const result = await registerUser({
      employeeId: newEmpId.trim(),
      fullName: newFullName.trim(),
      role: newRole,
      password: newPassword,
    });

    if (!result.success && result.error) {
      setCreateError(result.error);
      return;
    }

    toast.success(
      `Account created for ${newFullName.trim()} (${newEmpId.toUpperCase()}). You can now log in.`,
      'Registration Successful'
    );
    setEmployeeId(newEmpId.trim().toUpperCase());
    setPassword(newPassword);
    setShowCreateModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    // Client-side validation first
    const errors = validateForm(employeeId, password);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    // Credential check via AuthContext (FR-002)
    const result = await login({ employeeId: employeeId.trim(), password, rememberMe });
    if (!result.success && result.error) {
      setGlobalError(result.error);
      toast.error(result.error, "Login Failed", undefined, undefined, 4000);
    } else if (result.success) {
      toast.success(`Welcome back!`, "Authentication Successful");
    }
  };

  const clearFieldError = (field: keyof FormErrors) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmpId, setForgotEmpId] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmpId.trim()) {
      setForgotError('Please enter your Employee ID or Email.');
      return;
    }
    setForgotError(null);
    setForgotSuccess(true);
    toast.success(
      `Password reset instructions have been dispatched for ${forgotEmpId.trim()}.`,
      'Reset Request Dispatched'
    );
  };

  return (
    <div className="login-shell">

      {/* ── LEFT PANEL ── */}
      <aside className="login-left">
        <div className="login-logo-area">
          <img
            src="/logo.png"
            alt="Speedex Courier & Forwarder, Inc."
            className="login-logo-img"
            onError={(e) => {
              // Fallback if logo is missing
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="login-logo-tagline">Finance Operations Management System</span>
        </div>

        {/* Feature Highlights — from seed data */}
        <div className="login-features">
          {FEATURE_HIGHLIGHTS.map((feature) => (
            <div key={feature.step} className="login-feature-item">
              <div className="login-feature-step">{feature.step}</div>
              <div className="login-feature-text">
                <div className="login-feature-title">{feature.title}</div>
                <div className="login-feature-desc">{feature.description}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── RIGHT PANEL ── */}
      <main className="login-right">
        <div className="login-card">

          {/* Card header */}
          <p className="login-card-label">Secure Access</p>
          <h1 className="login-card-title">
            Login to Finance Operations Management System (FOMS)
          </h1>
          <p className="login-card-subtitle">Enter your credentials below to continue.</p>
          <div className="login-card-divider" />

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit} noValidate>

            {/* Employee ID */}
            <div className="login-field">
              <label htmlFor="foms-employee-id" className="login-label">
                Employee ID
              </label>
              <div className={`login-input-wrap ${fieldErrors.employeeId ? 'has-error' : ''}`}>
                <span className="login-input-icon">
                  <User size={16} />
                </span>
                <input
                  id="foms-employee-id"
                  type="text"
                  className="login-input"
                  placeholder="EMP-001"
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    clearFieldError('employeeId');
                    setGlobalError(null);
                  }}
                  autoComplete="username"
                  autoFocus
                  aria-describedby={fieldErrors.employeeId ? 'empid-error' : undefined}
                  aria-invalid={!!fieldErrors.employeeId}
                />
              </div>
              {fieldErrors.employeeId && (
                <span id="empid-error" className="login-field-error" role="alert">
                  <AlertCircle size={13} />
                  {fieldErrors.employeeId}
                </span>
              )}
              {!fieldErrors.employeeId && (
                <div style={{ marginTop: '4px', height: '16px' }} />
              )}

            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="foms-password" className="login-label">
                Password
              </label>
              <div className={`login-input-wrap ${fieldErrors.password ? 'has-error' : ''}`}>
                <span className="login-input-icon">
                  <Lock size={16} />
                </span>
                <input
                  id="foms-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                    setGlobalError(null);
                  }}
                  autoComplete="current-password"
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  aria-invalid={!!fieldErrors.password}
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <span id="password-error" className="login-field-error" role="alert">
                  <AlertCircle size={13} />
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* Remember me + Forgot password */}
            <div className="login-options-row">
              <label className="login-remember">
                <input
                  id="foms-remember-me"
                  type="checkbox"
                  className="login-remember-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="login-remember-label">Remember me</span>
              </label>
              <button
                type="button"
                className="login-forgot-link"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotSuccess(false);
                  setForgotError(null);
                  setForgotEmpId('');
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Global credential error */}
            {globalError && (
              <div className="login-global-error" role="alert" aria-live="polite">
                <AlertCircle size={15} />
                {globalError}
              </div>
            )}

            {/* Submit button */}
            <button
              id="foms-login-btn"
              type="submit"
              className="login-btn"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="login-btn-spinner" aria-hidden="true" />
                  Verifying…
                </>
              ) : (
                'Log In'
              )}
            </button>

            {/* Create Account option */}
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#64748B' }}>
              New staff member?{' '}
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(true);
                  setCreateError(null);
                  setNewEmpId('');
                  setNewFullName('');
                  setNewRole('Accountant');
                  setNewPassword('');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  border: '1.5px solid #1B254B',
                  borderRadius: '8px',
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#1B254B',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Create Account
              </button>
            </div>
          </form>
        </div>

        {/* Page footer */}
        <div className="login-card-footer">
          © {new Date().getFullYear()}{' '}
          <strong>FOMS</strong> — Finance Operations Management System. All rights reserved.
        </div>
      </main>

      {/* ── FORGOT PASSWORD MODAL ── */}
      {showForgotModal && (
        <div className="foms-modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="foms-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="foms-modal-header">
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Reset Password</h3>
              <button className="foms-modal-close" onClick={() => setShowForgotModal(false)}>×</button>
            </div>
            <div className="foms-modal-body" style={{ padding: '20px' }}>
              {forgotSuccess ? (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#10B981' }}>Reset Request Sent</h4>
                  <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: '1.5' }}>
                    If an account matching <strong>{forgotEmpId}</strong> exists, password reset instructions have been sent to your administrator.
                  </p>
                  <button
                    className="login-btn"
                    style={{ marginTop: '16px', width: '100%' }}
                    onClick={() => setShowForgotModal(false)}
                  >
                    Return to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit}>
                  <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                    Enter your Employee ID or registered email address. We will verify your account and send password reset instructions to your system administrator.
                  </p>
                  <div className="login-field">
                    <label className="login-label">Employee ID or Email</label>
                    <div className="login-input-wrap">
                      <span className="login-input-icon"><User size={16} /></span>
                      <input
                        type="text"
                        className="login-input"
                        placeholder="e.g. EMP-001 or user@speedex.ph"
                        value={forgotEmpId}
                        onChange={(e) => {
                          setForgotEmpId(e.target.value);
                          setForgotError(null);
                        }}
                        autoFocus
                      />
                    </div>
                    {forgotError && (
                      <span className="login-field-error" style={{ marginTop: '6px', color: '#EF4444' }}>
                        <AlertCircle size={13} /> {forgotError}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="login-btn"
                      style={{ background: '#F3F4F6', color: '#374151', flex: 1 }}
                      onClick={() => setShowForgotModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="login-btn" style={{ flex: 1 }}>
                      Submit Request
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE ACCOUNT MODAL ── */}
      {showCreateModal && (
        <div className="foms-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="foms-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="foms-modal-header">
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Create Staff Account</h3>
              <button className="foms-modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="foms-modal-body" style={{ padding: '20px' }}>
              <form onSubmit={handleCreateSubmit}>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                  Register a new staff member for authorized system access.
                </p>

                {createError && (
                  <div className="login-global-error" style={{ marginBottom: '16px' }}>
                    <AlertCircle size={15} /> {createError}
                  </div>
                )}

                <div className="login-field" style={{ marginBottom: '12px' }}>
                  <label className="login-label">Employee ID</label>
                  <div className="login-input-wrap">
                    <span className="login-input-icon"><User size={16} /></span>
                    <input
                      type="text"
                      className="login-input"
                      placeholder="e.g. EMP-006"
                      required
                      value={newEmpId}
                      onChange={(e) => setNewEmpId(e.target.value)}
                    />
                  </div>
                </div>

                <div className="login-field" style={{ marginBottom: '12px' }}>
                  <label className="login-label">Full Name</label>
                  <div className="login-input-wrap">
                    <span className="login-input-icon"><User size={16} /></span>
                    <input
                      type="text"
                      className="login-input"
                      placeholder="e.g. Maria Garcia"
                      required
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="login-field" style={{ marginBottom: '12px' }}>
                  <label className="login-label">Authorized Role</label>
                  <select
                    className="login-input"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    style={{ paddingLeft: '12px', background: '#F9FAFB' }}
                  >
                    <option value="Finance Manager">Finance Manager</option>
                    <option value="Head Accountant">Head Accountant</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Coordinator">Coordinator</option>
                    <option value="Assistant of Financial Manager">Assistant of Financial Manager</option>
                  </select>
                </div>

                <div className="login-field" style={{ marginBottom: '16px' }}>
                  <label className="login-label">Password</label>
                  <div className="login-input-wrap">
                    <span className="login-input-icon"><Lock size={16} /></span>
                    <input
                      type="password"
                      className="login-input"
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="login-btn"
                    style={{ background: '#F3F4F6', color: '#374151', flex: 1 }}
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="login-btn" style={{ flex: 1 }}>
                    Register Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
