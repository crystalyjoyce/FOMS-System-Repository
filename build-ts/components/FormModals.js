import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect, useId } from 'react';
import { AlertTriangle, CheckCircle2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Lock, PlusCircle, ShieldAlert, ClipboardList, } from 'lucide-react';
import './FormModals.css';
export const TextField = ({ label, placeholder, value, onChange, onFocus, onBlur, state = 'default', message, type = 'text', readOnly = false, disabled = false, maxLength, required = false, id: customId, }) => {
    const [isFocused, setIsFocused] = useState(false);
    const reactId = useId();
    const inputId = customId || reactId;
    const hintId = `${inputId}-hint`;
    let computedState = state;
    if (disabled) {
        computedState = 'disabled';
    }
    else if (isFocused) {
        if (state === 'error')
            computedState = 'error-focused';
        else if (state === 'default')
            computedState = 'focused';
    }
    const handleFocus = (e) => {
        setIsFocused(true);
        if (onFocus)
            onFocus(e);
    };
    const handleBlur = (e) => {
        setIsFocused(false);
        if (onBlur)
            onBlur(e);
    };
    const isError = computedState === 'error' || computedState === 'error-focused';
    const hasHint = !!message;
    return (_jsxs("div", { className: `tf-group state-${computedState}`, children: [_jsxs("label", { className: "tf-label", htmlFor: inputId, children: [label, required && _jsx("span", { className: "tf-label-required", children: " *" })] }), _jsxs("div", { className: "tf-wrapper", children: [_jsx("input", { id: inputId, type: type, placeholder: placeholder, value: value, onChange: onChange, onFocus: handleFocus, onBlur: handleBlur, readOnly: readOnly, disabled: disabled, maxLength: maxLength, className: "tf-input", "aria-invalid": isError ? 'true' : 'false', "aria-describedby": hasHint ? hintId : undefined }), computedState === 'success' && (_jsx("span", { className: "tf-status-icon", children: _jsx(CheckCircle2, { size: 15, strokeWidth: 2 }) })), isError && (_jsx("span", { className: "tf-status-icon", children: _jsx(AlertTriangle, { size: 15, strokeWidth: 2 }) }))] }), hasHint && (_jsxs("span", { className: "tf-hint", id: hintId, children: [isError && (_jsx(AlertTriangle, { size: 12, strokeWidth: 2, style: { flexShrink: 0 } })), computedState === 'success' && (_jsx(CheckCircle2, { size: 12, strokeWidth: 2, style: { flexShrink: 0 } })), message] }))] }));
};
export const CalendarPicker = ({ label, value, onChange, state = 'default', message, placeholder = 'Select date...', required = false, id: customId, disablePastDates = false, }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const reactId = useId();
    const pickerId = customId || reactId;
    const hintId = `${pickerId}-hint`;
    useEffect(() => {
        if (value) {
            const p = new Date(value);
            if (!isNaN(p.getTime()))
                setCurrentDate(p);
        }
    }, [value]);
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target))
                setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    const handleDaySelect = (day) => {
        // If it's a disabled date, block selection
        if (disablePastDates) {
            const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            d.setHours(0, 0, 0, 0);
            if (d < todayDate)
                return;
        }
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        onChange(`${yyyy}-${mm}-${dd}`);
        setIsOpen(false);
    };
    const navMonth = (offset) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const daysArray = [];
    for (let i = 0; i < firstDayIndex; i++)
        daysArray.push(null);
    for (let i = 1; i <= totalDays; i++)
        daysArray.push(i);
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const formattedValue = value
        ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';
    const computedState = isOpen ? 'focused' : state;
    const isError = computedState === 'error';
    const hasHint = !!message;
    return (_jsxs("div", { className: `tf-group state-${computedState}`, ref: containerRef, style: { position: 'relative' }, children: [_jsxs("label", { className: "tf-label", htmlFor: pickerId, children: [label, required && _jsx("span", { className: "tf-label-required", children: " *" })] }), _jsxs("div", { className: "tf-wrapper tf-calendar-trigger", onClick: () => state !== 'disabled' && setIsOpen(!isOpen), children: [_jsx("span", { className: "tf-cal-icon", children: _jsx(CalendarIcon, { size: 15, strokeWidth: 2 }) }), _jsx("input", { id: pickerId, type: "text", value: formattedValue, placeholder: placeholder, readOnly: true, className: "tf-input tf-cal-input", "aria-invalid": isError ? 'true' : 'false', "aria-describedby": hasHint ? hintId : undefined })] }), hasHint && (_jsxs("span", { className: "tf-hint", id: hintId, children: [isError && _jsx(AlertTriangle, { size: 12, strokeWidth: 2, style: { flexShrink: 0 } }), state === 'success' && _jsx(CheckCircle2, { size: 12, strokeWidth: 2, style: { flexShrink: 0 } }), message] })), isOpen && (_jsxs("div", { className: "cal-popover", children: [_jsxs("div", { className: "cal-header", children: [_jsx("button", { type: "button", className: "cal-nav-btn", onClick: () => navMonth(-1), children: _jsx(ChevronLeft, { size: 15 }) }), _jsxs("span", { className: "cal-month-label", children: [monthNames[month], " ", year] }), _jsx("button", { type: "button", className: "cal-nav-btn", onClick: () => navMonth(1), children: _jsx(ChevronRight, { size: 15 }) })] }), _jsx("div", { className: "cal-weekdays", children: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (_jsx("span", { className: "cal-wd", children: d }, d))) }), _jsx("div", { className: "cal-days", children: daysArray.map((day, idx) => {
                            if (day === null)
                                return _jsx("div", { className: "cal-day empty" }, `e-${idx}`);
                            const d = new Date(year, month, day);
                            const todayDate = new Date();
                            todayDate.setHours(0, 0, 0, 0);
                            d.setHours(0, 0, 0, 0);
                            const isPast = d < todayDate;
                            const isDisabled = disablePastDates && isPast;
                            const isSel = value && new Date(value).getDate() === day &&
                                new Date(value).getMonth() === month &&
                                new Date(value).getFullYear() === year;
                            const isToday = new Date().getDate() === day &&
                                new Date().getMonth() === month &&
                                new Date().getFullYear() === year;
                            return (_jsx("div", { className: `cal-day${isSel ? ' selected' : ''}${isToday ? ' today' : ''}${isDisabled ? ' disabled' : ''}`, onClick: () => !isDisabled && handleDaySelect(day), children: day }, `d-${day}`));
                        }) })] }))] }));
};
const TOAST_LIFETIME_MS = 3000;
const TOAST_EXIT_MS = 200;
// ─────────────────────────────────────────────────────────────────
// 4.  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
export const FormModals = () => {
    const textareaId = useId();
    const textareaHintId = `${textareaId}-hint`;
    /* ── Modal visibility ── */
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    /* ── Closing animation flags ── */
    const [isCreateModalClosing, setIsCreateModalClosing] = useState(false);
    const [isVerificationModalClosing, setIsVerificationModalClosing] = useState(false);
    const [isSuccessPopupClosing, setIsSuccessPopupClosing] = useState(false);
    /* ── Success popup ── */
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [createdRecord, setCreatedRecord] = useState(null);
    /* ── Verification ── */
    const [confirmPasscode, setConfirmPasscode] = useState('');
    const REQUIRED_PASSCODE = 'LOCK-USER';
    /* ── Form fields ── */
    const [recordName, setRecordName] = useState('');
    const [recordCategory, setRecordCategory] = useState('Primary');
    const [recordEmail, setRecordEmail] = useState('');
    const [recordPhone, setRecordPhone] = useState('');
    const [recordDate, setRecordDate] = useState('');
    const [recordReason, setRecordReason] = useState('');
    const [formSubmitted, setFormSubmitted] = useState(false);
    /* ── Toasts ── */
    const [toasts, setToasts] = useState([]);
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
    const addToast = (title, description, type = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, title, description, type }]);
        setTimeout(() => setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t)), TOAST_LIFETIME_MS - TOAST_EXIT_MS);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), TOAST_LIFETIME_MS);
    };
    /* ── Validation helpers ── */
    const getNameState = (v) => !v ? 'default' : v.trim().length >= 3 ? 'success' : 'error';
    const getEmailState = (v) => !v ? 'default' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'success' : 'error';
    const getPhoneState = (v) => !v ? 'default' : /^\d{11}$/.test(v) ? 'success' : 'error';
    const getDateState = (v) => !v ? 'default' : 'success';
    const getReasonState = (v) => !v ? 'default' : v.trim().length >= 10 ? 'success' : 'error';
    /* ── Form submit ── */
    const handleFormSubmit = (e) => {
        e.preventDefault();
        setFormSubmitted(true);
        const ok = getNameState(recordName) === 'success' &&
            getEmailState(recordEmail) === 'success' &&
            getPhoneState(recordPhone) === 'success' &&
            getDateState(recordDate) === 'success' &&
            getReasonState(recordReason) === 'success';
        if (ok) {
            setCreatedRecord({ name: recordName, category: recordCategory, email: recordEmail, phone: recordPhone, date: recordDate, reason: recordReason });
            setShowSuccessPopup(true);
            addToast('Record Created Successfully', `"${recordName}" has been added to the directory.`);
            setRecordName('');
            setRecordCategory('Primary');
            setRecordEmail('');
            setRecordPhone('');
            setRecordDate('');
            setRecordReason('');
            setFormSubmitted(false);
            closeCreateModal();
        }
        else {
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
    return (_jsxs("div", { className: "fm-section", children: [_jsxs("div", { className: "fm-trigger-grid", children: [_jsx("div", { className: "fm-trigger-card", children: _jsxs("button", { id: "btn-open-create-modal", className: "btn btn--primary fm-trigger-btn", onClick: () => setIsCreateModalOpen(true), children: [_jsx(PlusCircle, { size: 15, strokeWidth: 2 }), "Open Form Modal"] }) }), _jsx("div", { className: "fm-trigger-card", children: _jsxs("button", { id: "btn-open-lock-modal", className: "btn btn--danger fm-trigger-btn", onClick: () => setIsVerificationModalOpen(true), children: [_jsx(Lock, { size: 15, strokeWidth: 2 }), "Lock Profile"] }) })] }), isCreateModalOpen && (_jsx("div", { className: `modal-overlay${isCreateModalClosing ? ' closing' : ''}`, onClick: closeCreateModal, children: _jsxs("div", { className: `modal-card${isCreateModalClosing ? ' closing' : ''}`, onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "modal-hd", children: [_jsxs("div", { className: "modal-hd-left", children: [_jsx("span", { className: "modal-hd-icon", children: _jsx(ClipboardList, { size: 18, strokeWidth: 2 }) }), _jsx("h2", { className: "modal-hd-title", children: "Create New Record" })] }), _jsx("button", { className: "modal-x-btn", onClick: closeCreateModal, "aria-label": "Close", children: _jsx(X, { size: 17, strokeWidth: 2.5 }) })] }), _jsx("div", { className: "modal-hd-divider" }), _jsxs("form", { onSubmit: handleFormSubmit, children: [_jsxs("div", { className: "modal-bd", children: [_jsxs("div", { className: "modal-row-2", children: [_jsx(TextField, { label: "RECORD NAME", placeholder: "Enter full name or title...", value: recordName, onChange: e => setRecordName(e.target.value), state: formSubmitted
                                                        ? (!recordName.trim() ? 'error' : getNameState(recordName))
                                                        : 'default', required: true, message: formSubmitted
                                                        ? (!recordName.trim()
                                                            ? 'Name is required to answer.'
                                                            : getNameState(recordName) === 'error'
                                                                ? 'Name must be at least 3 characters long.'
                                                                : '')
                                                        : '' }), _jsxs("div", { className: "tf-group state-default", children: [_jsx("label", { className: "tf-label", htmlFor: "record-category-select", children: "CATEGORY" }), _jsxs("div", { className: "tf-wrapper tf-select-wrapper", children: [_jsxs("select", { id: "record-category-select", className: "tf-select", value: recordCategory, onChange: e => setRecordCategory(e.target.value), children: [_jsx("option", { value: "Primary", children: "Primary" }), _jsx("option", { value: "Secondary", children: "Secondary" }), _jsx("option", { value: "Utility", children: "Utility" }), _jsx("option", { value: "Administrative", children: "Administrative" })] }), _jsx("span", { className: "tf-select-caret", children: _jsx(ChevronLeft, { size: 13, strokeWidth: 2.5, style: { transform: 'rotate(-90deg)' } }) })] })] })] }), _jsxs("div", { className: "modal-row-2", children: [_jsx(TextField, { label: "EMAIL ADDRESS", placeholder: "name@domain.com", value: recordEmail, onChange: e => setRecordEmail(e.target.value), state: formSubmitted
                                                        ? (!recordEmail.trim() ? 'error' : getEmailState(recordEmail))
                                                        : 'default', required: true, message: formSubmitted
                                                        ? (!recordEmail.trim()
                                                            ? 'Email is required to answer.'
                                                            : getEmailState(recordEmail) === 'error'
                                                                ? 'Enter a valid email address.'
                                                                : '')
                                                        : '' }), _jsx(TextField, { label: "PHONE NUMBER", placeholder: "e.g. 09123456789", value: recordPhone, type: "tel", maxLength: 11, required: true, onChange: e => {
                                                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                        setRecordPhone(digitsOnly);
                                                    }, state: formSubmitted
                                                        ? (!recordPhone.trim() ? 'error' : getPhoneState(recordPhone))
                                                        : 'default', message: formSubmitted
                                                        ? (!recordPhone.trim()
                                                            ? 'Phone number is required to answer.'
                                                            : getPhoneState(recordPhone) === 'error'
                                                                ? `Must be exactly 11 digits (${recordPhone.length}/11).`
                                                                : '')
                                                        : '' })] }), _jsx("div", { className: "modal-row-half", children: _jsx(CalendarPicker, { label: "TARGET DATE", placeholder: "Select date...", value: recordDate, onChange: date => setRecordDate(date), disablePastDates: true, state: formSubmitted
                                                    ? (!recordDate ? 'error' : 'success')
                                                    : 'default', required: true, message: formSubmitted && !recordDate ? 'Target date is required to answer.' : '' }) }), (() => {
                                            const wordCount = recordReason.trim() === '' ? 0 : recordReason.trim().split(/\s+/).length;
                                            const atLimit = wordCount >= 250;
                                            const noteState = formSubmitted
                                                ? (!recordReason.trim() ? 'error' : getReasonState(recordReason))
                                                : 'default';
                                            return (_jsxs("div", { className: `tf-group state-${noteState}`, children: [_jsxs("div", { className: "tf-label-row", children: [_jsxs("label", { className: "tf-label", htmlFor: textareaId, children: ["NOTES", _jsx("span", { className: "tf-label-required", children: " *" })] }), _jsxs("span", { className: `tf-word-count${atLimit ? ' tf-word-count--limit' : ''}`, children: [wordCount, " / 250 words"] })] }), _jsx("div", { className: "tf-wrapper tf-textarea-wrapper", children: _jsx("textarea", { id: textareaId, className: "tf-textarea", placeholder: "Write notes for this record entry...", value: recordReason, "aria-invalid": noteState === 'error' ? 'true' : 'false', "aria-describedby": (formSubmitted && !recordReason.trim()) || (formSubmitted && getReasonState(recordReason) === 'error') || atLimit ? textareaHintId : undefined, onChange: e => {
                                                                const raw = e.target.value;
                                                                const words = raw.trim() === '' ? [] : raw.trim().split(/\s+/);
                                                                if (words.length <= 250) {
                                                                    setRecordReason(raw);
                                                                }
                                                                else {
                                                                    setRecordReason(words.slice(0, 250).join(' '));
                                                                }
                                                            }, rows: 4 }) }), formSubmitted && !recordReason.trim() ? (_jsxs("span", { className: "tf-hint", id: textareaHintId, children: [_jsx(AlertTriangle, { size: 12, strokeWidth: 2, style: { flexShrink: 0 } }), "Notes are required to answer."] })) : formSubmitted && getReasonState(recordReason) === 'error' ? (_jsxs("span", { className: "tf-hint", id: textareaHintId, children: [_jsx(AlertTriangle, { size: 12, strokeWidth: 2, style: { flexShrink: 0 } }), "Notes must be at least 10 characters."] })) : null, atLimit && (_jsxs("span", { className: "tf-hint tf-hint--limit", id: textareaHintId, children: [_jsx(AlertTriangle, { size: 12, strokeWidth: 2, style: { flexShrink: 0 } }), "250-word limit reached."] }))] }));
                                        })()] }), _jsx("div", { className: "modal-ft-divider" }), _jsxs("div", { className: "modal-ft", children: [_jsx("button", { type: "button", className: "btn btn--outline", onClick: closeCreateModal, children: "Cancel" }), _jsx("button", { type: "submit", className: "btn btn--primary modal-ft-action", children: "SAVE RECORD" })] })] })] }) })), isVerificationModalOpen && (_jsx("div", { className: `modal-overlay${isVerificationModalClosing ? ' closing' : ''}`, onClick: closeVerificationModal, children: _jsxs("div", { className: `modal-card verification-modal${isVerificationModalClosing ? ' closing' : ''}`, onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "modal-hd", children: [_jsxs("div", { className: "modal-hd-left", children: [_jsx("span", { className: "modal-hd-icon modal-hd-icon--danger", children: _jsx(ShieldAlert, { size: 18, strokeWidth: 2 }) }), _jsx("h2", { className: "modal-hd-title modal-hd-title--danger", children: "Verification Security Check" })] }), _jsx("button", { className: "modal-x-btn", onClick: closeVerificationModal, "aria-label": "Close", children: _jsx(X, { size: 17, strokeWidth: 2.5 }) })] }), _jsx("div", { className: "modal-hd-divider" }), _jsxs("div", { className: "modal-bd", children: [_jsxs("div", { className: "verification-warning-container", children: [_jsx(AlertTriangle, { size: 19, className: "warning-icon", strokeWidth: 2 }), _jsxs("p", { className: "warning-text", children: ["You are locking profile permissions on", ' ', _jsx("strong", { children: "Hermione Benitez (Logistics Director)" }), ". This restricts system access controls immediately."] })] }), _jsxs("div", { style: { marginTop: '8px' }, children: [_jsxs("p", { className: "passcode-check-label", children: ["To confirm, type the verification code:", _jsx("span", { className: "passcode-text-display", children: REQUIRED_PASSCODE })] }), _jsx(TextField, { label: "PASSCODE CONFIRMATION", placeholder: "Type signature passcode...", value: confirmPasscode, onChange: e => setConfirmPasscode(e.target.value), required: true, state: confirmPasscode === REQUIRED_PASSCODE ? 'success'
                                                : confirmPasscode ? 'error'
                                                    : 'default', message: confirmPasscode && confirmPasscode !== REQUIRED_PASSCODE
                                                ? 'Passcode mismatch. Enter the exact code listed above.'
                                                : '' })] })] }), _jsx("div", { className: "modal-ft-divider" }), _jsxs("div", { className: "modal-ft", children: [_jsx("button", { type: "button", className: "btn btn--outline", onClick: closeVerificationModal, children: "Cancel Action" }), _jsx("button", { type: "button", className: "btn btn--danger modal-ft-action", disabled: confirmPasscode !== REQUIRED_PASSCODE, onClick: handleLockConfirm, children: "LOCK PROFILE" })] })] }) })), showSuccessPopup && createdRecord && (_jsx("div", { className: `modal-overlay${isSuccessPopupClosing ? ' closing' : ''}`, children: _jsxs("div", { className: `modal-card success-popup${isSuccessPopupClosing ? ' closing' : ''}`, onClick: e => e.stopPropagation(), children: [_jsx("div", { className: "success-popup-icon", children: _jsx(CheckCircle2, { size: 38, strokeWidth: 1.5 }) }), _jsx("h2", { className: "modal-hd-title success-popup-title", children: "Record Created Successfully!" }), _jsx("p", { className: "fm-page-desc", style: { marginBottom: 20, textAlign: 'center' }, children: "The record has been validated and committed to the directory." }), _jsx("div", { className: "success-detail-card", children: [
                                { k: 'Name', v: createdRecord.name },
                                { k: 'Category', v: createdRecord.category, badge: true },
                                { k: 'Email', v: createdRecord.email },
                                { k: 'Phone', v: createdRecord.phone },
                                { k: 'Target Date', v: createdRecord.date },
                                { k: 'Reason', v: createdRecord.reason },
                            ].map(row => (_jsxs("div", { className: "success-detail-row", children: [_jsx("span", { className: "success-detail-key", children: row.k }), row.badge
                                        ? _jsx("span", { className: "success-detail-badge", children: row.v })
                                        : _jsx("span", { className: "success-detail-val", children: row.v })] }, row.k))) }), _jsx("button", { className: "btn btn--primary", style: { width: '100%', padding: '11px', letterSpacing: '0.5px' }, onClick: closeSuccessPopup, children: "CONFIRM & CLOSE" })] }) })), _jsx("div", { className: "toast-container", children: toasts.map(toast => (_jsxs("div", { className: `toast${toast.type === 'error' ? ' toast-error' : ''}${toast.leaving ? ' leaving' : ''}`, children: [_jsx("div", { className: `toast-icon ${toast.type}`, children: toast.type === 'success'
                                ? _jsx(CheckCircle2, { size: 19, strokeWidth: 2 })
                                : _jsx(AlertTriangle, { size: 19, strokeWidth: 2 }) }), _jsxs("div", { className: "toast-body", children: [_jsx("p", { className: "toast-title", children: toast.title }), _jsx("p", { className: "toast-desc", children: toast.description })] })] }, toast.id))) })] }));
};
export default FormModals;
//# sourceMappingURL=FormModals.js.map