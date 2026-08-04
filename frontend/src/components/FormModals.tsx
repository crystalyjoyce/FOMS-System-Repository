import React, { useState, useRef, useEffect, useId } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  id?: string;
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
  id: customId,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const reactId = useId();
  const inputId = customId || reactId;
  const hintId = `${inputId}-hint`;

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

  const isError = computedState === 'error' || computedState === 'error-focused';
  const hasHint = !!message;

  return (
    <div className={`tf-group state-${computedState}`}>
      <label className="tf-label" htmlFor={inputId}>
        {label}
        {required && <span className="tf-label-required"> *</span>}
      </label>
      <div className="tf-wrapper">
        <input
          id={inputId}
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
          aria-invalid={isError ? 'true' : 'false'}
          aria-describedby={hasHint ? hintId : undefined}
        />

        {computedState === 'success' && (
          <span className="tf-status-icon">
            <CheckCircle2 size={15} strokeWidth={2} />
          </span>
        )}
        {isError && (
          <span className="tf-status-icon">
            <AlertTriangle size={15} strokeWidth={2} />
          </span>
        )}
      </div>

      {hasHint && (
        <span className="tf-hint" id={hintId}>
          {isError && (
            <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
          )}
          {computedState === 'success' && (
            <CheckCircle2 size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
          )}
          {message}
        </span>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 2.  CALENDAR — Shared helpers
// ─────────────────────────────────────────────────────────────────

/** Parse ISO date string locally (avoids UTC midnight shift). */
function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Serialize year/month/day → ISO string. */
function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Full month names via Intl (January … December). */
function getMonthNames(locale: string): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2024, i, 1))
  );
}

/** 3-char abbreviated month names via Intl (Jan … Dec). */
function getMonthShortNames(locale: string): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2024, i, 1))
  );
}

/**
 * Weekday header labels — Sunday-first.
 * Ref date: 2024-01-07 = Sunday, so 7+0…7+6 = Sun…Sat.
 */
function getWeekdayLabels(locale: string): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 7 + i))
  );
}

export interface DayDisabledOpts {
  minDate?: string;       // ISO — days before are blocked
  maxDate?: string;       // ISO — days after are blocked
  disabledDates?: string[];
  disablePastDates?: boolean; // legacy shorthand for minDate = today
}

function isDayDisabled(day: number, year: number, month: number, opts: DayDisabledOpts): boolean {
  const d = new Date(year, month, day);
  d.setHours(0, 0, 0, 0);

  if (opts.disablePastDates) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (d < today) return true;
  }
  if (opts.minDate) {
    const min = isoToDate(opts.minDate); min.setHours(0, 0, 0, 0);
    if (d < min) return true;
  }
  if (opts.maxDate) {
    const max = isoToDate(opts.maxDate); max.setHours(0, 0, 0, 0);
    if (d > max) return true;
  }
  if (opts.disabledDates?.length) {
    if (opts.disabledDates.includes(toIso(year, month, day))) return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────
// 2b.  CALENDAR PICKER (single date)
// ─────────────────────────────────────────────────────────────────
export interface CalendarPickerProps {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  state?: 'default' | 'focused' | 'success' | 'error' | 'disabled';
  message?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
  /** @deprecated Use minDate="YYYY-MM-DD" instead. Kept for backwards compat. */
  disablePastDates?: boolean;
  minDate?: string;
  maxDate?: string;
  disabledDates?: string[];
  /** BCP-47 locale tag — defaults to browser language. */
  locale?: string;
  compact?: boolean;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  label,
  value,
  onChange,
  state = 'default',
  message,
  placeholder = 'Select date...',
  required = false,
  id: customId,
  disablePastDates = false,
  minDate,
  maxDate,
  disabledDates,
  locale,
  compact = false,
}) => {
  const effectiveLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en') || 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [showJumpPanel, setShowJumpPanel] = useState(false);
  const [jumpYear, setJumpYear] = useState(new Date().getFullYear());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [focusedDay, setFocusedDay] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const reactId = useId();
  const pickerId = customId || reactId;
  const hintId = `${pickerId}-hint`;

  const disabledOpts: DayDisabledOpts = { minDate, maxDate, disabledDates, disablePastDates };

  // Sync calendar view when value changes externally
  useEffect(() => {
    if (value) {
      const p = isoToDate(value);
      if (!isNaN(p.getTime())) setCurrentDate(p);
    }
  }, [value]);

  // Sync jump panel year when popover opens
  useEffect(() => {
    if (isOpen) setJumpYear(year);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowJumpPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const navMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
    setFocusedDay(null);
  };

  const handleDaySelect = (day: number) => {
    if (isDayDisabled(day, year, month, disabledOpts)) return;
    onChange(toIso(year, month, day));
    setIsOpen(false);
    setShowJumpPanel(false);
    setFocusedDay(null);
  };

  // ── Keyboard navigation (ARIA grid pattern) ──
  const handleGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cur = focusedDay ?? (value ? isoToDate(value).getDate() : 1);

    if (e.key === 'Escape')   { e.preventDefault(); setIsOpen(false); return; }
    if (e.key === 'PageUp')   { e.preventDefault(); navMonth(-1); return; }
    if (e.key === 'PageDown') { e.preventDefault(); navMonth(1);  return; }

    let next = cur;
    if      (e.key === 'ArrowRight') { e.preventDefault(); next = cur + 1; }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); next = cur - 1; }
    else if (e.key === 'ArrowDown')  { e.preventDefault(); next = cur + 7; }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); next = cur - 7; }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDaySelect(cur);
      return;
    } else return;

    next = Math.max(1, Math.min(totalDays, next));
    setFocusedDay(next);
    setTimeout(() => dayRefs.current.get(next)?.focus(), 0);
  };

  // Build day grid
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const daysArray: Array<number | null> = [];
  for (let i = 0; i < firstDayIndex; i++) daysArray.push(null);
  for (let i = 1; i <= totalDays; i++) daysArray.push(i);

  const monthNames = getMonthNames(effectiveLocale);
  const monthShortNames = getMonthShortNames(effectiveLocale);
  const weekdayLabels = getWeekdayLabels(effectiveLocale);

  const formattedValue = value
    ? new Intl.DateTimeFormat(effectiveLocale, { year: 'numeric', month: 'long', day: 'numeric' }).format(
        isoToDate(value)
      )
    : '';

  const computedState = isOpen ? 'focused' : state;
  const isError = computedState === 'error';
  const hasHint = !!message;

  const selDate = value ? isoToDate(value) : null;

  return (
    <div className={`tf-group state-${computedState}${compact ? ' tf-group--compact' : ''}`} ref={containerRef} style={{ position: 'relative' }}>
      {label && (
        <label className="tf-label" htmlFor={pickerId}>
          {label}
          {required && <span className="tf-label-required"> *</span>}
        </label>
      )}
      <div
        className="tf-wrapper tf-calendar-trigger"
        onClick={() => state !== 'disabled' && setIsOpen(!isOpen)}
      >
        <span className="tf-cal-icon"><CalendarIcon size={15} strokeWidth={2} /></span>
        <input
          id={pickerId}
          type="text"
          value={formattedValue}
          placeholder={placeholder}
          readOnly
          className="tf-input tf-cal-input"
          aria-invalid={isError ? 'true' : 'false'}
          aria-describedby={hasHint ? hintId : undefined}
          aria-haspopup="grid"
          aria-expanded={isOpen}
        />
      </div>

      {hasHint && (
        <span className="tf-hint" id={hintId}>
          {isError && <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
          {state === 'success' && <CheckCircle2 size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
          {message}
        </span>
      )}

      {isOpen && (
        <div className="cal-popover" role="dialog" aria-label={`${label} calendar`}>

          {/* ── Year/Month Jump Panel ── */}
          {showJumpPanel && (
            <div className="cal-jump-panel">
              <div className="cal-jump-year">
                <button type="button" className="cal-nav-btn" onClick={() => setJumpYear(y => y - 1)} aria-label="Previous year">
                  <ChevronLeft size={13} />
                </button>
                <span className="cal-jump-year-label">{jumpYear}</span>
                <button type="button" className="cal-nav-btn" onClick={() => setJumpYear(y => y + 1)} aria-label="Next year">
                  <ChevronRight size={13} />
                </button>
              </div>
              <div className="cal-jump-months">
                {monthShortNames.map((mn, mi) => (
                  <button
                    key={mn}
                    type="button"
                    className={`cal-jump-month${mi === month && jumpYear === year ? ' active' : ''}`}
                    onClick={() => {
                      setCurrentDate(new Date(jumpYear, mi, 1));
                      setShowJumpPanel(false);
                    }}
                  >
                    {mn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Header ── */}
          <div className="cal-header">
            <button type="button" className="cal-nav-btn" onClick={() => navMonth(-1)} aria-label="Previous month">
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              className="cal-month-label cal-month-label--btn"
              onClick={() => setShowJumpPanel(s => !s)}
              aria-label="Select month and year"
              aria-expanded={showJumpPanel}
            >
              {monthNames[month]} {year}
              <ChevronDown size={11} strokeWidth={2.5} style={{ marginLeft: 3, opacity: 0.6 }} />
            </button>
            <button type="button" className="cal-nav-btn" onClick={() => navMonth(1)} aria-label="Next month">
              <ChevronRight size={15} />
            </button>
          </div>

          {/* ── Weekday headers ── */}
          <div className="cal-weekdays" role="row">
            {weekdayLabels.map(wd => (
              <span key={wd} className="cal-wd" role="columnheader" aria-label={wd}>{wd}</span>
            ))}
          </div>

          {/* ── Day grid ── */}
          <div
            className="cal-days"
            role="grid"
            aria-label={`${monthNames[month]} ${year}`}
            onKeyDown={handleGridKeyDown}
          >
            {daysArray.map((day, idx) => {
              if (day === null) return <div key={`e-${idx}`} className="cal-day empty" role="gridcell" />;

              const disabled = isDayDisabled(day, year, month, disabledOpts);
              const isSel = selDate && selDate.getDate() === day && selDate.getMonth() === month && selDate.getFullYear() === year;
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
              const isFocusTarget = focusedDay === day || (!focusedDay && !!isSel);

              return (
                <div
                  key={`d-${day}`}
                  role="gridcell"
                  tabIndex={isFocusTarget ? 0 : -1}
                  className={`cal-day${isSel ? ' selected' : ''}${isToday ? ' today' : ''}${disabled ? ' disabled' : ''}`}
                  onClick={() => !disabled && handleDaySelect(day)}
                  onFocus={() => setFocusedDay(day)}
                  ref={el => { if (el) dayRefs.current.set(day, el); else dayRefs.current.delete(day); }}
                  aria-selected={!!isSel}
                  aria-disabled={disabled}
                  aria-label={`${day} ${monthNames[month]} ${year}${disabled ? ', unavailable' : ''}`}
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
// 2c.  CALENDAR RANGE PICKER (From – To)
// ─────────────────────────────────────────────────────────────────
export interface CalendarRangePickerProps {
  label?: string;
  startValue: string;          // ISO YYYY-MM-DD or ''
  endValue: string;            // ISO YYYY-MM-DD or ''
  onRangeChange: (start: string, end: string) => void;
  state?: 'default' | 'focused' | 'success' | 'error' | 'disabled';
  message?: string;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  disabledDates?: string[];
  locale?: string;
  compact?: boolean;
}

export const CalendarRangePicker: React.FC<CalendarRangePickerProps> = ({
  label,
  startValue,
  endValue,
  onRangeChange,
  state = 'default',
  message,
  required = false,
  minDate,
  maxDate,
  disabledDates,
  locale,
  compact = false,
}) => {
  const effectiveLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en') || 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [showJumpPanel, setShowJumpPanel] = useState(false);
  const [jumpYear, setJumpYear] = useState(new Date().getFullYear());
  const [currentDate, setCurrentDate] = useState(new Date());
  // pendingStart: user clicked once, awaiting second (end) click
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const disabledOpts: DayDisabledOpts = { minDate, maxDate, disabledDates };

  useEffect(() => {
    const ref = pendingStart || startValue;
    if (ref) {
      const p = isoToDate(ref);
      if (!isNaN(p.getTime())) setCurrentDate(p);
    }
  }, [startValue, pendingStart]);

  useEffect(() => { if (isOpen) setJumpYear(year); }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowJumpPanel(false);
        setPendingStart(null);
        setHoverDay(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const navMonth = (offset: number) => setCurrentDate(new Date(year, month + offset, 1));

  const handleDayClick = (day: number) => {
    if (isDayDisabled(day, year, month, disabledOpts)) return;
    const iso = toIso(year, month, day);

    if (!pendingStart) {
      // First click: set start, clear end
      setPendingStart(iso);
      onRangeChange(iso, '');
    } else {
      const start = isoToDate(pendingStart);
      const end   = isoToDate(iso);
      if (end < start) {
        // Clicked before current start — swap to new start
        setPendingStart(iso);
        onRangeChange(iso, '');
      } else {
        // Valid end — commit range and close
        onRangeChange(pendingStart, iso);
        setPendingStart(null);
        setHoverDay(null);
        setIsOpen(false);
        setShowJumpPanel(false);
      }
    }
  };

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const daysArray: Array<number | null> = [];
  for (let i = 0; i < firstDayIndex; i++) daysArray.push(null);
  for (let i = 1; i <= totalDays; i++) daysArray.push(i);

  const monthNames      = getMonthNames(effectiveLocale);
  const monthShortNames = getMonthShortNames(effectiveLocale);
  const weekdayLabels   = getWeekdayLabels(effectiveLocale);

  // Effective range for highlight: while picking, use pendingStart + hover
  const effStart = pendingStart || startValue;
  const effEnd   = pendingStart
    ? (hoverDay ? toIso(year, month, hoverDay) : '')
    : endValue;

  const startDate = effStart ? isoToDate(effStart) : null;
  const endDate   = effEnd   ? isoToDate(effEnd)   : null;
  // Normalize so startDate ≤ endDate for highlight calculation
  const [loDate, hiDate] = startDate && endDate && endDate < startDate
    ? [endDate, startDate] : [startDate, endDate];

  const formatDisplay = (iso: string) =>
    iso
      ? new Intl.DateTimeFormat(effectiveLocale, { month: 'short', day: 'numeric', year: 'numeric' }).format(isoToDate(iso))
      : '';

  const computedState = isOpen ? 'focused' : state;
  const isError = computedState === 'error';
  const hasHint = !!message;
  const selecting = !!pendingStart;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div className={`tf-group state-${computedState}${compact ? ' tf-group--compact' : ''}`}>
        {label && (
          <label className="tf-label">
            {label}
            {required && <span className="tf-label-required"> *</span>}
          </label>
        )}

        {/* Two trigger inputs side-by-side */}
        <div className="cal-range-inputs">
          <div
            className={`tf-wrapper tf-calendar-trigger${selecting ? ' tf-range-selecting' : ''}`}
            onClick={() => state !== 'disabled' && setIsOpen(true)}
          >
            <span className="tf-cal-icon"><CalendarIcon size={15} strokeWidth={2} /></span>
            <input
              type="text"
              value={formatDisplay(startValue)}
              placeholder="From date..."
              readOnly
              className="tf-input tf-cal-input"
              aria-label={`${label} — start date`}
              aria-haspopup="grid"
              aria-expanded={isOpen}
              aria-invalid={isError ? 'true' : 'false'}
            />
          </div>
          <span className="cal-range-sep">→</span>
          <div
            className="tf-wrapper tf-calendar-trigger"
            onClick={() => state !== 'disabled' && setIsOpen(true)}
          >
            <span className="tf-cal-icon"><CalendarIcon size={15} strokeWidth={2} /></span>
            <input
              type="text"
              value={formatDisplay(endValue)}
              placeholder="To date..."
              readOnly
              className="tf-input tf-cal-input"
              aria-label={`${label} — end date`}
              aria-invalid={isError ? 'true' : 'false'}
            />
          </div>
        </div>

        {hasHint && (
          <span className="tf-hint">
            {isError && <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
            {message}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="cal-popover" role="dialog" aria-label={`${label} date range calendar`}>

          {/* Contextual banner while awaiting end date */}
          {selecting && (
            <div className="cal-range-banner">
              <CalendarIcon size={12} strokeWidth={2} />
              Now select an end date
            </div>
          )}

          {/* ── Year/Month Jump Panel ── */}
          {showJumpPanel && (
            <div className="cal-jump-panel">
              <div className="cal-jump-year">
                <button type="button" className="cal-nav-btn" onClick={() => setJumpYear(y => y - 1)} aria-label="Previous year">
                  <ChevronLeft size={13} />
                </button>
                <span className="cal-jump-year-label">{jumpYear}</span>
                <button type="button" className="cal-nav-btn" onClick={() => setJumpYear(y => y + 1)} aria-label="Next year">
                  <ChevronRight size={13} />
                </button>
              </div>
              <div className="cal-jump-months">
                {monthShortNames.map((mn, mi) => (
                  <button
                    key={mn}
                    type="button"
                    className={`cal-jump-month${mi === month && jumpYear === year ? ' active' : ''}`}
                    onClick={() => { setCurrentDate(new Date(jumpYear, mi, 1)); setShowJumpPanel(false); }}
                  >
                    {mn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Header ── */}
          <div className="cal-header">
            <button type="button" className="cal-nav-btn" onClick={() => navMonth(-1)} aria-label="Previous month">
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              className="cal-month-label cal-month-label--btn"
              onClick={() => setShowJumpPanel(s => !s)}
              aria-label="Select month and year"
              aria-expanded={showJumpPanel}
            >
              {monthNames[month]} {year}
              <ChevronDown size={11} strokeWidth={2.5} style={{ marginLeft: 3, opacity: 0.6 }} />
            </button>
            <button type="button" className="cal-nav-btn" onClick={() => navMonth(1)} aria-label="Next month">
              <ChevronRight size={15} />
            </button>
          </div>

          {/* ── Weekday headers ── */}
          <div className="cal-weekdays" role="row">
            {weekdayLabels.map(wd => (
              <span key={wd} className="cal-wd" role="columnheader">{wd}</span>
            ))}
          </div>

          {/* ── Day grid ── */}
          <div className="cal-days" role="grid" aria-label={`${monthNames[month]} ${year}`}>
            {daysArray.map((day, idx) => {
              if (day === null) return <div key={`e-${idx}`} className="cal-day empty" role="gridcell" />;

              const disabled = isDayDisabled(day, year, month, disabledOpts);
              const iso = toIso(year, month, day);
              const d   = isoToDate(iso);
              d.setHours(0, 0, 0, 0);

              const isStart   = effStart === iso;
              const isEnd     = effEnd   === iso;
              const inRange   = !!(loDate && hiDate && d > loDate && d < hiDate);
              const isToday   = new Date().toDateString() === new Date(year, month, day).toDateString();

              const classes = ['cal-day'];
              if (isStart)  classes.push('range-start');
              if (isEnd)    classes.push('range-end');
              if (inRange)  classes.push('range-in');
              if (isToday)  classes.push('today');
              if (disabled) classes.push('disabled');

              return (
                <div
                  key={`d-${day}`}
                  role="gridcell"
                  tabIndex={disabled ? -1 : 0}
                  className={classes.join(' ')}
                  onClick={() => !disabled && handleDayClick(day)}
                  onMouseEnter={() => selecting && !disabled && setHoverDay(day)}
                  onMouseLeave={() => setHoverDay(null)}
                  aria-selected={isStart || isEnd}
                  aria-disabled={disabled}
                  aria-label={`${day} ${monthNames[month]} ${year}${disabled ? ', unavailable' : ''}`}
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
// 3.  SELECT FIELD
// ─────────────────────────────────────────────────────────────────
export interface SelectFieldProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange?: (value: string) => void;
  onFocus?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  state?: 'default' | 'focused' | 'success' | 'error' | 'disabled';
  message?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
  onFocus,
  onBlur,
  state = 'default',
  message,
  required = false,
  disabled = false,
  id: customId,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const reactId = useId();
  const selectId = customId || reactId;
  const hintId = `${selectId}-hint`;

  let computedState = disabled ? 'disabled' : state;
  if (!disabled && isFocused && state !== 'error') computedState = 'focused';
  if (!disabled && isFocused && state === 'error') computedState = 'error';

  const isError   = computedState === 'error';
  const isSuccess = computedState === 'success';
  const hasHint   = !!message;

  const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };
  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <div className={`tf-group state-${computedState}`}>
      <label className="tf-label" htmlFor={selectId}>
        {label}
        {required && <span className="tf-label-required"> *</span>}
      </label>
      <div className="tf-wrapper tf-select-wrapper">
        <select
          id={selectId}
          className="tf-select"
          value={value}
          disabled={disabled}
          onChange={e => onChange && onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={isError ? 'true' : 'false'}
          aria-describedby={hasHint ? hintId : undefined}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {isSuccess && (
          <span className="tf-status-icon tf-status-icon--select">
            <CheckCircle2 size={15} strokeWidth={2} />
          </span>
        )}
        {isError && (
          <span className="tf-status-icon tf-status-icon--select">
            <AlertTriangle size={15} strokeWidth={2} />
          </span>
        )}
        {!isSuccess && !isError && (
          <span className="tf-select-caret">
            <ChevronDown size={14} strokeWidth={2.5} />
          </span>
        )}
      </div>
      {hasHint && (
        <span className="tf-hint" id={hintId}>
          {isError   && <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
          {isSuccess && <CheckCircle2  size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
          {message}
        </span>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 4.  TEXTAREA FIELD
// ─────────────────────────────────────────────────────────────────
export interface TextareaFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  state?: 'default' | 'focused' | 'success' | 'error' | 'disabled';
  message?: string;
  rows?: number;
  maxWords?: number;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  state = 'default',
  message,
  rows = 4,
  maxWords,
  required = false,
  disabled = false,
  id: customId,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const reactId = useId();
  const areaId  = customId || reactId;
  const hintId  = `${areaId}-hint`;

  let computedState = disabled ? 'disabled' : state;
  if (!disabled && isFocused) {
    if (state === 'error') computedState = 'error';
    else if (state === 'default') computedState = 'focused';
  }

  const isError   = computedState === 'error';
  const isSuccess = computedState === 'success';
  const hasHint   = !!message;

  const wordCount = value.trim() === '' ? 0 : value.trim().split(/\s+/).length;
  const atLimit   = !!maxWords && wordCount >= maxWords;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!maxWords) { onChange && onChange(e); return; }
    const raw   = e.target.value;
    const words = raw.trim() === '' ? [] : raw.trim().split(/\s+/);
    if (words.length <= maxWords) {
      onChange && onChange(e);
    } else {
      // clamp — fire synthetic event with clamped value
      const clamped = words.slice(0, maxWords).join(' ');
      const synth   = { ...e, target: { ...e.target, value: clamped } } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange && onChange(synth);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <div className={`tf-group state-${computedState}`}>
      <div className="tf-label-row">
        <label className="tf-label" htmlFor={areaId}>
          {label}
          {required && <span className="tf-label-required"> *</span>}
        </label>
        {maxWords && (
          <span className={`tf-word-count${atLimit ? ' tf-word-count--limit' : ''}`}>
            {wordCount} / {maxWords} words
          </span>
        )}
      </div>
      <div className="tf-wrapper tf-textarea-wrapper">
        <textarea
          id={areaId}
          className="tf-textarea"
          placeholder={placeholder}
          value={value}
          rows={rows}
          disabled={disabled}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={isError ? 'true' : 'false'}
          aria-describedby={hasHint || atLimit ? hintId : undefined}
        />
      </div>
      {atLimit && (
        <span className="tf-hint tf-hint--limit" id={hintId}>
          <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
          {maxWords}-word limit reached.
        </span>
      )}
      {!atLimit && hasHint && (
        <span className="tf-hint" id={hintId}>
          {isError   && <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
          {isSuccess && <CheckCircle2  size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
          {message}
        </span>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 5.  PHONE FIELD  (+63 Philippine mask)
// ─────────────────────────────────────────────────────────────────
export interface PhoneFieldProps {
  label: string;
  value: string;                              // raw: "09XXXXXXXXX"
  onChange?: (raw: string) => void;           // always raw 11-digit
  onFocus?: () => void;
  onBlur?: () => void;
  state?: 'default' | 'focused' | 'success' | 'error' | 'disabled' | 'error-focused';
  message?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

/** Format raw 09XXXXXXXXX  →  +63 9XX XXX XXXX */
function formatPH(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  // Remove leading 0 to get the 10-digit national number
  const nat = digits.startsWith('0') ? digits.slice(1) : digits;
  // nat = 9XXXXXXXXX (up to 10 chars)
  const p1 = nat.slice(0, 3);   // 9XX
  const p2 = nat.slice(3, 6);   // XXX
  const p3 = nat.slice(6, 10);  // XXXX
  let display = '+63';
  if (p1) display += ' ' + p1;
  if (p2) display += ' ' + p2;
  if (p3) display += ' ' + p3;
  return display;
}

export const PhoneField: React.FC<PhoneFieldProps> = ({
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  state = 'default',
  message,
  required = false,
  disabled = false,
  id: customId,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const reactId = useId();
  const inputId = customId || reactId;
  const hintId  = `${inputId}-hint`;

  let computedState = disabled ? 'disabled' : state;
  if (!disabled && isFocused) {
    if (state === 'error') computedState = 'error-focused';
    else if (state === 'default') computedState = 'focused';
  }

  const isError   = computedState === 'error' || computedState === 'error-focused';
  const isSuccess = computedState === 'success';
  const hasHint   = !!message;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Extract only digits from what the user typed
    const typed  = e.target.value;
    // Strip +63, spaces, dashes — keep only digit chars
    const digits = typed.replace(/\D/g, '').slice(0, 11);
    // Ensure starts with 0
    const raw = digits.startsWith('0') ? digits : (digits.length ? '0' + digits : '');
    onChange && onChange(raw.slice(0, 11));
  };

  const handleFocus = () => { setIsFocused(true); onFocus && onFocus(); };
  const handleBlur  = () => { setIsFocused(false); onBlur && onBlur(); };

  return (
    <div className={`tf-group state-${computedState}`}>
      <label className="tf-label" htmlFor={inputId}>
        {label}
        {required && <span className="tf-label-required"> *</span>}
      </label>
      <div className="tf-wrapper">
        <span className="tf-phone-prefix">
          <Phone size={13} strokeWidth={2} />
        </span>
        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          value={formatPH(value)}
          placeholder="+63 9XX XXX XXXX"
          disabled={disabled}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="tf-input tf-phone-input"
          aria-invalid={isError ? 'true' : 'false'}
          aria-describedby={hasHint ? hintId : undefined}
        />
        {isSuccess && (
          <span className="tf-status-icon">
            <CheckCircle2 size={15} strokeWidth={2} />
          </span>
        )}
        {isError && (
          <span className="tf-status-icon">
            <AlertTriangle size={15} strokeWidth={2} />
          </span>
        )}
      </div>
      {hasHint && (
        <span className="tf-hint" id={hintId}>
          {isError   && <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
          {isSuccess && <CheckCircle2  size={12} strokeWidth={2} style={{ flexShrink: 0 }} />}
          {message}
        </span>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 6.  TOAST
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
export const VALIDATION_MESSAGES = {
  required:      "This field is required.",
  nameMin:       "Name must be at least 3 characters long.",
  invalidEmail:  "Please enter a valid email format.",
  phoneDigits:   "Must be exactly 11 digits (09XXXXXXXXX).",
  phoneFormat:   "Enter a valid Philippine mobile number.",
  reasonMin:     "Notes must be at least 10 characters long.",
};

export const FormModals: React.FC = () => {
  const textareaId = useId();
  const textareaHintId = `${textareaId}-hint`;

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
  const [touchedFields,  setTouchedFields]  = useState<Record<string, boolean>>({});

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
    setTimeout(() => { 
      setIsCreateModalOpen(false); 
      setIsCreateModalClosing(false); 
      setTouchedFields({});
    }, TOAST_EXIT_MS);
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

      {/* MODAL 1 — CREATE RECORD FORM */}
      {isCreateModalOpen && (
        <div
          className={`modal-overlay${isCreateModalClosing ? ' closing' : ''}`}
          onClick={closeCreateModal}
        >
          <div
            className={`modal-card${isCreateModalClosing ? ' closing' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
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

            {/* Body */}
            <form onSubmit={handleFormSubmit}>
              <div className="modal-bd">

                {/* Row 1: Name + Category */}
                <div className="modal-row-2">
                  <TextField
                    label="RECORD NAME"
                    placeholder="Enter full name or title..."
                    value={recordName}
                    onChange={e => {
                      setRecordName(e.target.value);
                      setTouchedFields(prev => ({ ...prev, name: true }));
                    }}
                    state={
                      (formSubmitted || touchedFields.name)
                        ? (!recordName.trim() ? 'error' : getNameState(recordName) as any)
                        : 'default'
                    }
                    required={true}
                    message={
                      (formSubmitted || touchedFields.name)
                        ? (!recordName.trim()
                          ? VALIDATION_MESSAGES.required
                          : getNameState(recordName) === 'error'
                          ? VALIDATION_MESSAGES.nameMin
                          : '')
                        : ''
                    }
                  />
                  <SelectField
                    label="CATEGORY"
                    id="record-category-select"
                    value={recordCategory}
                    options={[
                      { value: 'Primary',        label: 'Primary' },
                      { value: 'Secondary',      label: 'Secondary' },
                      { value: 'Utility',        label: 'Utility' },
                      { value: 'Administrative', label: 'Administrative' },
                    ]}
                    onChange={val => setRecordCategory(val)}
                    state="default"
                  />
                </div>

                {/* Row 2: Email + Phone */}
                <div className="modal-row-2">
                  <TextField
                    label="EMAIL ADDRESS"
                    placeholder="name@domain.com"
                    value={recordEmail}
                    onChange={e => {
                      setRecordEmail(e.target.value);
                      setTouchedFields(prev => ({ ...prev, email: true }));
                    }}
                    state={
                      (formSubmitted || touchedFields.email)
                        ? (!recordEmail.trim() ? 'error' : getEmailState(recordEmail) as any)
                        : 'default'
                    }
                    required={true}
                    message={
                      (formSubmitted || touchedFields.email)
                        ? (!recordEmail.trim()
                          ? VALIDATION_MESSAGES.required
                          : getEmailState(recordEmail) === 'error'
                          ? VALIDATION_MESSAGES.invalidEmail
                          : '')
                        : ''
                    }
                  />
                  <PhoneField
                    label="PHONE NUMBER"
                    value={recordPhone}
                    required={true}
                    onChange={raw => {
                      setRecordPhone(raw);
                      setTouchedFields(prev => ({ ...prev, phone: true }));
                    }}
                    state={
                      (formSubmitted || touchedFields.phone)
                        ? (!recordPhone.trim() ? 'error' : getPhoneState(recordPhone) as any)
                        : 'default'
                    }
                    message={
                      (formSubmitted || touchedFields.phone)
                        ? (!recordPhone.trim()
                          ? VALIDATION_MESSAGES.required
                          : getPhoneState(recordPhone) === 'error'
                          ? VALIDATION_MESSAGES.phoneDigits
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
                    onChange={date => {
                      setRecordDate(date);
                      setTouchedFields(prev => ({ ...prev, date: true }));
                    }}
                    disablePastDates={true}
                    state={
                      (formSubmitted || touchedFields.date)
                        ? (!recordDate ? 'error' : 'success')
                        : 'default'
                    }
                    required={true}
                    message={(formSubmitted || touchedFields.date) && !recordDate ? VALIDATION_MESSAGES.required : ''}
                  />
                </div>

                {/* Row 4: Notes */}
                <TextareaField
                  label="NOTES"
                  id={textareaId}
                  placeholder="Write notes for this record entry..."
                  value={recordReason}
                  rows={4}
                  maxWords={250}
                  required={true}
                  onChange={e => {
                    setRecordReason(e.target.value);
                    setTouchedFields(prev => ({ ...prev, reason: true }));
                  }}
                  state={
                    (formSubmitted || touchedFields.reason)
                      ? (!recordReason.trim() ? 'error' : getReasonState(recordReason) as any)
                      : 'default'
                  }
                  message={
                    (formSubmitted || touchedFields.reason)
                      ? (!recordReason.trim()
                        ? VALIDATION_MESSAGES.required
                        : getReasonState(recordReason) === 'error'
                        ? VALIDATION_MESSAGES.reasonMin
                        : '')
                      : ''
                  }
                />

              </div>

              {/* Footer */}
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

      {/* MODAL 2 — DOUBLE-FACTOR VERIFICATION */}
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
                  <strong>FirstName LastName (Logistics Director)</strong>. This restricts system
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

      {/* MODAL 3 — SUCCESS POPUP */}
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

      {/* Toasts */}
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
