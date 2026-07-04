import React, { useState, useRef, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  PlusCircle,
  User,
  Mail,
  Phone,
  ShieldAlert,
  ClipboardList,
} from 'lucide-react';
import './FormModals.css';

// ─────────────────────────────────────────────────────────────────
// 1.  TEXTFIELD COMPONENT
// ─────────────────────────────────────────────────────────────────
export interface TextFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  state?: 'default' | 'focused' | 'success' | 'error' | 'disabled' | 'hover' | 'error-focused';
  message?: string;
  type?: string;
  readOnly?: boolean;
  disabled?: boolean;
  maxLength?: number;
  required?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  state = 'default',
  message,
  type = 'text',
  readOnly = false,
  disabled = false,
  maxLength,
  required = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  let computedState = state;
  if (disabled) {
    computedState = 'disabled';
  } else if (isFocused) {
    if (state === 'error') computedState = 'error-focused';
    else if (state === 'default') computedState = 'focused';
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  let displayMessage = message || '';

  return (
    <div className={`tf-group state-${computedState}`}>
      <label className="tf-label">
        {label}
        {required && <span className="tf-label-required"> *</span>}
      </label>
      <div className="tf-wrapper">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          readOnly={readOnly}
          disabled={disabled}
          maxLength={maxLength}
          className="tf-input"
        />

        {computedState === 'success' && (
          <span className="tf-status-icon">
            <CheckCircle2 size={15} strokeWidth={2} />
          </span>
        )}
        {(computedState === 'error' || computedState === 'error-focused') && (
          <span className="tf-status-icon">
            <AlertTriangle size={15} strokeWidth={2} />
          </span>
        )}
      </div>

      {displayMessage && (
        <span className="tf-hint">
          {(computedState === 'error' || computedState === 'error-focused') && (
            <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
          )}
          {computedState === 'success' && (
            <CheckCircle2 size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
          )}
          {displayMessage}
        </span>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 2.  CALENDAR PICKER
// ─────────────────────────────────────────────────────────────────
export interface CalendarPickerProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  state?: 'default' | 'focused' | 'success' | 'error' | 'disabled';
  message?: string;
  placeholder?: string;
  required?: boolean;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  label,
  value,
  onChange,
  state = 'default',
  message,
  placeholder = 'Select date...',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (value) {
      const p = new Date(value);
      if (!isNaN(p.getTime())) setCurrentDate(p);
    }
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDaySelect = (day: number) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const navMonth = (offset: number) =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const daysArray: Array<number | null> = [];
  for (let i = 0; i < firstDayIndex; i++) daysArray.push(null);
  for (let i = 1; i <= totalDays; i++) daysArray.push(i);

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const formattedValue = value
    ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const computedState = isOpen ? 'focused' : state;

  return (
    <div className={`tf-group state-${computedState}`} ref={containerRef} style={{ position: 'relative' }}>
      <label className="tf-label">
        {label}
        {required && <span className="tf-label-required"> *</span>}
      </label>
      <div
        className="tf-wrapper tf-calendar-trigger"
        onClick={() => state !== 'disabled' && setIsOpen(!isOpen)}
      >
        <span className="tf-cal-icon"><CalendarIcon size={15} strokeWidth={2} /></span>
        <input
          type="text"
          value={formattedValue}
          placeholder={placeholder}
          readOnly
          className="tf-input tf-cal-input"
        />
      </div>

      {message && (
        <span className="tf-hint">
          {state === 'error' && <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
          {state === 'success' && <CheckCircle2 size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
          {message}
        </span>
      )}

      {isOpen && (
        <div className="cal-popover">
          <div className="cal-header">
            <button className="cal-nav-btn" onClick={() => navMonth(-1)}><ChevronLeft size={15} /></button>
            <span className="cal-month-label">{monthNames[month]} {year}</span>
            <button className="cal-nav-btn" onClick={() => navMonth(1)}><ChevronRight size={15} /></button>
          </div>
          <div className="cal-weekdays">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <span key={d} className="cal-wd">{d}</span>
            ))}
          </div>
          <div className="cal-days">
            {daysArray.map((day, idx) => {
              if (day === null) return <div key={`e-${idx}`} className="cal-day empty" />;
              const isSel = value && new Date(value).getDate() === day &&
                            new Date(value).getMonth() === month &&
                            new Date(value).getFullYear() === year;
              const isToday = new Date().getDate() === day &&
                              new Date().getMonth() === month &&
                              new Date().getFullYear() === year;
              return (
                <div
                  key={`d-${day}`}
                  className={`cal-day${isSel ? ' selected' : ''}${isToday ? ' today' : ''}`}
                  onClick={() => handleDaySelect(day)}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 3.  TOAST
// ─────────────────────────────────────────────────────────────────
export interface ToastInfo {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'error';
  leaving?: boolean;
}

const TOAST_LIFETIME_MS = 3000;
const TOAST_EXIT_MS     = 200;

// ─────────────────────────────────────────────────────────────────
// 4.  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
export const FormModals: React.FC = () => {

  /* ── Modal visibility ── */
  const [isCreateModalOpen,       setIsCreateModalOpen]       = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  /* ── Closing animation flags ── */
  const [isCreateModalClosing,       setIsCreateModalClosing]       = useState(false);
  const [isVerificationModalClosing, setIsVerificationModalClosing] = useState(false);
  const [isSuccessPopupClosing,      setIsSuccessPopupClosing]      = useState(false);

  /* ── Success popup ── */
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [createdRecord, setCreatedRecord] = useState<{
    name: string; category: string; email: string; phone: string; date: string; reason: string;
  } | null>(null);

  /* ── Verification ── */
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const REQUIRED_PASSCODE = 'LOCK-USER';

  /* ── Form fields ── */
  const [recordName,     setRecordName]     = useState('');
  const [recordCategory, setRecordCategory] = useState('Primary');
  const [recordEmail,    setRecordEmail]    = useState('');
  const [recordPhone,    setRecordPhone]    = useState('');
  const [recordDate,     setRecordDate]     = useState('');
  const [recordReason,   setRecordReason]   = useState('');
  const [formSubmitted,  setFormSubmitted]  = useState(false);

  /* ── Toasts ── */
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  /* ── External open event ── */
  useEffect(() => {
    const handler = () => setIsCreateModalOpen(true);
    window.addEventListener('open-create-record-modal', handler);
    return () => window.removeEventListener('open-create-record-modal', handler);
  }, []);

  /* ── Close helpers ── */
  const closeCreateModal = () => {
    setIsCreateModalClosing(true);
    setTimeout(() => { setIsCreateModalOpen(false); setIsCreateModalClosing(false); }, TOAST_EXIT_MS);
  };
  const closeVerificationModal = () => {
    setIsVerificationModalClosing(true);
    setTimeout(() => { setIsVerificationModalOpen(false); setIsVerificationModalClosing(false); }, TOAST_EXIT_MS);
  };
  const closeSuccessPopup = () => {
    setIsSuccessPopupClosing(true);
    setTimeout(() => { setShowSuccessPopup(false); setCreatedRecord(null); setIsSuccessPopupClosing(false); }, TOAST_EXIT_MS);
  };

  const addToast = (title: string, description: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, description, type }]);
    setTimeout(() => setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t)), TOAST_LIFETIME_MS - TOAST_EXIT_MS);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), TOAST_LIFETIME_MS);
  };

  /* ── Validation helpers ── */
  const getNameState  = (v: string) => !v ? 'default' : v.trim().length >= 3 ? 'success' : 'error';
  const getEmailState = (v: string) => !v ? 'default' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'success' : 'error';
  const getPhoneState = (v: string) => !v ? 'default' : /^\d{11}$/.test(v) ? 'success' : 'error';
  const getDateState  = (v: string) => !v ? 'default' : 'success';
  const getReasonState= (v: string) => !v ? 'default' : v.trim().length >= 10 ? 'success' : 'error';

  /* ── Form submit ── */
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    const ok =
      getNameState(recordName) === 'success' &&
      getEmailState(recordEmail) === 'success' &&
      getPhoneState(recordPhone) === 'success' &&
      getDateState(recordDate) === 'success' &&
      getReasonState(recordReason) === 'success';

    if (ok) {
      setCreatedRecord({ name: recordName, category: recordCategory, email: recordEmail, phone: recordPhone, date: recordDate, reason: recordReason });
      setShowSuccessPopup(true);
      addToast('Record Created Successfully', `"${recordName}" has been added to the directory.`);
      setRecordName(''); setRecordCategory('Primary'); setRecordEmail('');
      setRecordPhone(''); setRecordDate(''); setRecordReason('');
      setFormSubmitted(false);
      closeCreateModal();
    } else {
      addToast('Validation Failed', 'Please correct all highlighted error fields.', 'error');
    }
  };

  /* ── Lock confirm ── */
  const handleLockConfirm = () => {
    if (confirmPasscode === REQUIRED_PASSCODE) {
      addToast('Profile Security Status: Locked', 'Profile has been restricted successfully.');
      setConfirmPasscode('');
      closeVerificationModal();
    }
  };

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <div className="fm-section">

      {/* ── Trigger cards ── */}
      <div className="fm-trigger-grid">

        <div className="fm-trigger-card">
          <button
            id="btn-open-create-modal"
            className="btn btn--primary fm-trigger-btn"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusCircle size={15} strokeWidth={2} />
            Open Form Modal
          </button>
        </div>

        <div className="fm-trigger-card">
          <button
            id="btn-open-lock-modal"
            className="btn btn--danger fm-trigger-btn"
            onClick={() => setIsVerificationModalOpen(true)}
          >
            <Lock size={15} strokeWidth={2} />
            Lock Profile
          </button>
        </div>

      </div>




      {/* ════════════════════════════════════════════════════
          MODAL 1 — CREATE RECORD FORM
      ════════════════════════════════════════════════════ */}
      {isCreateModalOpen && (
        <div
          className={`modal-overlay${isCreateModalClosing ? ' closing' : ''}`}
          onClick={closeCreateModal}
        >
          <div
            className={`modal-card${isCreateModalClosing ? ' closing' : ''}`}
            onClick={e => e.stopPropagation()}
          >

            {/* ── Header ── */}
            <div className="modal-hd">
              <div className="modal-hd-left">
                <span className="modal-hd-icon">
                  <ClipboardList size={18} strokeWidth={2} />
                </span>
                <h2 className="modal-hd-title">Create New Record</h2>
              </div>
              <button className="modal-x-btn" onClick={closeCreateModal} aria-label="Close">
                <X size={17} strokeWidth={2.5} />
              </button>
            </div>
            <div className="modal-hd-divider" />

            {/* ── Body ── */}
            <form onSubmit={handleFormSubmit}>
              <div className="modal-bd">

                {/* Row 1: Name + Category */}
                <div className="modal-row-2">
                  <TextField
                    label="RECORD NAME"
                    placeholder="Enter full name or title..."
                    value={recordName}
                    onChange={e => setRecordName(e.target.value)}
                    state={
                      formSubmitted
                        ? (!recordName.trim() ? 'error' : getNameState(recordName) as any)
                        : 'default'
                    }
                    required={true}
                    message={
                      formSubmitted
                        ? (!recordName.trim()
                          ? 'Name is required to answer.'
                          : getNameState(recordName) === 'error'
                          ? 'Name must be at least 3 characters long.'
                          : '')
                        : ''
                    }
                  />
                  <div className="tf-group state-default">
                    <label className="tf-label">CATEGORY</label>
                    <div className="tf-wrapper tf-select-wrapper">
                      <select
                        className="tf-select"
                        value={recordCategory}
                        onChange={e => setRecordCategory(e.target.value)}
                      >
                        <option value="Primary">Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="Utility">Utility</option>
                        <option value="Administrative">Administrative</option>
                      </select>
                      <span className="tf-select-caret">
                        <ChevronLeft size={13} strokeWidth={2.5} style={{ transform: 'rotate(-90deg)' }} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Email + Phone */}
                <div className="modal-row-2">
                  <TextField
                    label="EMAIL ADDRESS"
                    placeholder="name@domain.com"
                    value={recordEmail}
                    onChange={e => setRecordEmail(e.target.value)}
                    state={
                      formSubmitted
                        ? (!recordEmail.trim() ? 'error' : getEmailState(recordEmail) as any)
                        : 'default'
                    }
                    required={true}
                    message={
                      formSubmitted
                        ? (!recordEmail.trim()
                          ? 'Email is required to answer.'
                          : getEmailState(recordEmail) === 'error'
                          ? 'Enter a valid email address.'
                          : '')
                        : ''
                    }
                  />
                  <TextField
                    label="PHONE NUMBER"
                    placeholder="e.g. 09123456789"
                    value={recordPhone}
                    type="tel"
                    maxLength={11}
                    required={true}
                    onChange={e => {
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setRecordPhone(digitsOnly);
                    }}
                    state={
                      formSubmitted
                        ? (!recordPhone.trim() ? 'error' : getPhoneState(recordPhone) as any)
                        : 'default'
                    }
                    message={
                      formSubmitted
                        ? (!recordPhone.trim()
                          ? 'Phone number is required to answer.'
                          : getPhoneState(recordPhone) === 'error'
                          ? `Must be exactly 11 digits (${recordPhone.length}/11).`
                          : '')
                        : ''
                    }
                  />
                </div>

                {/* Row 3: Date (half-width) */}
                <div className="modal-row-half">
                  <CalendarPicker
                    label="TARGET DATE"
                    placeholder="Select date..."
                    value={recordDate}
                    onChange={date => setRecordDate(date)}
                    state={
                      formSubmitted
                        ? (!recordDate ? 'error' : 'success')
                        : 'default'
                    }
                    required={true}
                    message={formSubmitted && !recordDate ? 'Target date is required to answer.' : ''}
                  />
                </div>

                {/* Row 4: Notes (full-width textarea, 250-word limit) */}
                {(() => {
                  const wordCount = recordReason.trim() === '' ? 0 : recordReason.trim().split(/\s+/).length;
                  const atLimit = wordCount >= 250;
                  const noteState = 
                    formSubmitted
                      ? (!recordReason.trim() ? 'error' : getReasonState(recordReason))
                      : 'default';
                  return (
                    <div className={`tf-group state-${noteState}`}>
                      <div className="tf-label-row">
                        <label className="tf-label">
                          NOTES
                          <span className="tf-label-required"> *</span>
                        </label>
                        <span className={`tf-word-count${atLimit ? ' tf-word-count--limit' : ''}`}>
                          {wordCount} / 250 words
                        </span>
                      </div>
                      <div className="tf-wrapper tf-textarea-wrapper">
                        <textarea
                          className="tf-textarea"
                          placeholder="Write notes for this record entry..."
                          value={recordReason}
                          onChange={e => {
                            const raw = e.target.value;
                            const words = raw.trim() === '' ? [] : raw.trim().split(/\s+/);
                            if (words.length <= 250) {
                              setRecordReason(raw);
                            } else {
                              // Hard-cap: allow editing but block adding new words beyond 250
                              setRecordReason(words.slice(0, 250).join(' '));
                            }
                          }}
                          rows={4}
                        />
                      </div>
                      {formSubmitted && !recordReason.trim() ? (
                        <span className="tf-hint">
                          <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
                          Notes are required to answer.
                        </span>
                      ) : formSubmitted && getReasonState(recordReason) === 'error' ? (
                        <span className="tf-hint">
                          <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
                          Notes must be at least 10 characters.
                        </span>
                      ) : null}
                      {atLimit && (
                        <span className="tf-hint tf-hint--limit">
                          <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
                          250-word limit reached.
                        </span>
                      )}
                    </div>
                  );
                })()}

              </div>

              {/* ── Footer ── */}
              <div className="modal-ft-divider" />
              <div className="modal-ft">
                <button type="button" className="btn btn--outline" onClick={closeCreateModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary modal-ft-action">
                  SAVE RECORD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ════════════════════════════════════════════════════
          MODAL 2 — DOUBLE-FACTOR VERIFICATION
      ════════════════════════════════════════════════════ */}
      {isVerificationModalOpen && (
        <div
          className={`modal-overlay${isVerificationModalClosing ? ' closing' : ''}`}
          onClick={closeVerificationModal}
        >
          <div
            className={`modal-card verification-modal${isVerificationModalClosing ? ' closing' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-hd">
              <div className="modal-hd-left">
                <span className="modal-hd-icon modal-hd-icon--danger">
                  <ShieldAlert size={18} strokeWidth={2} />
                </span>
                <h2 className="modal-hd-title modal-hd-title--danger">Verification Security Check</h2>
              </div>
              <button className="modal-x-btn" onClick={closeVerificationModal} aria-label="Close">
                <X size={17} strokeWidth={2.5} />
              </button>
            </div>
            <div className="modal-hd-divider" />

            <div className="modal-bd">
              <div className="verification-warning-container">
                <AlertTriangle size={19} className="warning-icon" strokeWidth={2} />
                <p className="warning-text">
                  You are locking profile permissions on{' '}
                  <strong>Hermione Benitez (Logistics Director)</strong>. This restricts system
                  access controls immediately.
                </p>
              </div>

              <div style={{ marginTop: '8px' }}>
                <p className="passcode-check-label">
                  To confirm, type the verification code:
                  <span className="passcode-text-display">{REQUIRED_PASSCODE}</span>
                </p>
                <TextField
                  label="PASSCODE CONFIRMATION"
                  placeholder="Type signature passcode..."
                  value={confirmPasscode}
                  onChange={e => setConfirmPasscode(e.target.value)}
                  required={true}
                  state={
                    confirmPasscode === REQUIRED_PASSCODE ? 'success'
                    : confirmPasscode ? 'error'
                    : 'default'
                  }
                  message={
                    confirmPasscode && confirmPasscode !== REQUIRED_PASSCODE
                      ? 'Passcode mismatch. Enter the exact code listed above.'
                      : ''
                  }
                />
              </div>
            </div>

            <div className="modal-ft-divider" />
            <div className="modal-ft">
              <button type="button" className="btn btn--outline" onClick={closeVerificationModal}>
                Cancel Action
              </button>
              <button
                type="button"
                className="btn btn--danger modal-ft-action"
                disabled={confirmPasscode !== REQUIRED_PASSCODE}
                onClick={handleLockConfirm}
              >
                LOCK PROFILE
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ════════════════════════════════════════════════════
          MODAL 3 — SUCCESS POPUP
      ════════════════════════════════════════════════════ */}
      {showSuccessPopup && createdRecord && (
        <div className={`modal-overlay${isSuccessPopupClosing ? ' closing' : ''}`}>
          <div
            className={`modal-card success-popup${isSuccessPopupClosing ? ' closing' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="success-popup-icon">
              <CheckCircle2 size={38} strokeWidth={1.5} />
            </div>
            <h2 className="modal-hd-title success-popup-title">Record Created Successfully!</h2>
            <p className="fm-page-desc" style={{ marginBottom: 20, textAlign: 'center' }}>
              The record has been validated and committed to the directory.
            </p>

            <div className="success-detail-card">
              {[
                { k: 'Name',        v: createdRecord.name },
                { k: 'Category',    v: createdRecord.category, badge: true },
                { k: 'Email',       v: createdRecord.email },
                { k: 'Phone',       v: createdRecord.phone },
                { k: 'Target Date', v: createdRecord.date },
                { k: 'Reason',      v: createdRecord.reason },
              ].map(row => (
                <div key={row.k} className="success-detail-row">
                  <span className="success-detail-key">{row.k}</span>
                  {row.badge
                    ? <span className="success-detail-badge">{row.v}</span>
                    : <span className="success-detail-val">{row.v}</span>
                  }
                </div>
              ))}
            </div>

            <button
              className="btn btn--primary"
              style={{ width: '100%', padding: '11px', letterSpacing: '0.5px' }}
              onClick={closeSuccessPopup}
            >
              CONFIRM &amp; CLOSE
            </button>
          </div>
        </div>
      )}


      {/* ── Toasts ── */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast${toast.type === 'error' ? ' toast-error' : ''}${toast.leaving ? ' leaving' : ''}`}>
            <div className={`toast-icon ${toast.type}`}>
              {toast.type === 'success'
                ? <CheckCircle2 size={19} strokeWidth={2} />
                : <AlertTriangle size={19} strokeWidth={2} />}
            </div>
            <div className="toast-body">
              <p className="toast-title">{toast.title}</p>
              <p className="toast-desc">{toast.description}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default FormModals;