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
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

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
                <span style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                  Try: EMP1-EMP5 Password: Password@123
                </span>
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
                onClick={() =>
                  toast.info(
                    'Please contact your system administrator or HR to reset your credentials.',
                    'Password Reset Request'
                  )
                }
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
          </form>
        </div>

        {/* Page footer */}
        <div className="login-card-footer">
          © {new Date().getFullYear()}{' '}
          <strong>FOMS</strong> — Finance Operations Management System. All rights reserved.
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
