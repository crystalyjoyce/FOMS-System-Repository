import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import './SearchBar.css';

/* ─── Public types ─────────────────────────────────────────────────────── */

export interface SearchSuggestion {
  id: string;
  label: string;
  /** Right-side category label, e.g. "Waybill" */
  category?: string;
  /** Controls the icon chip colour */
  type?: 'recent' | 'trending' | 'result';
}

export interface SearchBarProps {
  placeholder?: string;
  /** Controlled value — omit for uncontrolled */
  value?: string;
  onChange?: (value: string) => void;
  /** Fires on Enter or leading-icon click */
  onSearch?: (value: string) => void;
  onClear?: () => void;
  suggestions?: SearchSuggestion[];
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  /** Show spinner instead of search icon */
  loading?: boolean;
  disabled?: boolean;
  /** 'default' (54 px) | 'compact' (42 px) */
  variant?: 'default' | 'compact';
  className?: string;
  /** HTML id for the <input> */
  id?: string;
}

/* ─── Helper: highlight matching substring ─────────────────────────────── */
function highlight(label: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return label;
  const i = label.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return label;
  return (
    <>
      {label.slice(0, i)}
      <mark>{label.slice(i, i + q.length)}</mark>
      {label.slice(i + q.length)}
    </>
  );
}

/* ─── Component ────────────────────────────────────────────────────────── */

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search',
  value: controlledValue,
  onChange,
  onSearch,
  onClear,
  suggestions = [],
  onSuggestionSelect,
  loading = false,
  disabled = false,
  variant = 'default',
  className = '',
  id = 'searchbar-input',
}) => {
  /* Controlled / uncontrolled value */
  const isControlled = controlledValue !== undefined;
  const [internal, setInternal] = useState('');
  const query = isControlled ? controlledValue : internal;

  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef  = useRef<HTMLDivElement>(null);

  /* ── Close dropdown on outside click ──────────────────────────────── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setFocused(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Handlers ──────────────────────────────────────────────────────── */
  const setQuery = useCallback((val: string) => {
    if (!isControlled) setInternal(val);
    onChange?.(val);
  }, [isControlled, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setActiveIdx(-1);
  };

  const handleClear = () => {
    setQuery('');
    onClear?.();
    setActiveIdx(-1);
    inputRef.current?.focus();
  };

  const handleSubmit = useCallback(() => {
    onSearch?.(query);
    setFocused(false);
    inputRef.current?.blur();
  }, [onSearch, query]);

  const selectSuggestion = (s: SearchSuggestion) => {
    setQuery(s.label);
    onSuggestionSelect?.(s);
    setFocused(false);
    setActiveIdx(-1);
  };

  /* ── Keyboard nav ──────────────────────────────────────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const open = focused && suggestions.length > 0;
    if (!open) {
      if (e.key === 'Enter') handleSubmit();
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIdx >= 0) selectSuggestion(suggestions[activeIdx]);
        else handleSubmit();
        break;
      case 'Escape':
        setFocused(false);
        setActiveIdx(-1);
        inputRef.current?.blur();
        break;
    }
  };

  /* ── Derived ───────────────────────────────────────────────────────── */
  const showDropdown = focused && suggestions.length > 0;
  const hasText      = query.length > 0;

  /* Split suggestions into sections */
  const recentList  = suggestions.filter(s => s.type === 'recent');
  const otherList   = suggestions.filter(s => s.type !== 'recent');

  const chipClass = (type?: string) => {
    if (type === 'recent')   return 'sb-chip chip-recent';
    if (type === 'trending') return 'sb-chip chip-trending';
    return 'sb-chip chip-result';
  };

  const chipIcon = (type?: string) => {
    if (type === 'recent')   return <Clock     size={16} strokeWidth={1.75} />;
    if (type === 'trending') return <TrendingUp size={16} strokeWidth={1.75} />;
    return <Search size={16} strokeWidth={1.75} />;
  };

  /* Flat ordered list for keyboard index mapping */
  const flatList: SearchSuggestion[] = [
    ...recentList,
    ...otherList,
  ];

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div
      ref={rootRef}
      className={[
        'sb-root',
        focused   ? 'is-focused'  : '',
        disabled  ? 'is-disabled' : '',
        variant === 'compact' ? 'is-compact' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* ── Input pill ──────────────────────────────────────────────── */}
      <div
        className="sb-field"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Leading icon — click = submit */}
        <span
          className="sb-icon-search"
          onClick={e => { e.stopPropagation(); handleSubmit(); }}
          role="button"
          aria-label="Submit search"
        >
          {loading
            ? <span className="sb-spinner" />
            : <Search size={variant === 'compact' ? 18 : 20} strokeWidth={2} />
          }
        </span>

        {/* Text input */}
        <input
          ref={inputRef}
          id={id}
          type="search"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? 'sb-listbox' : undefined}
          aria-activedescendant={activeIdx >= 0 ? `sb-opt-${activeIdx}` : undefined}
          className="sb-input"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />

        {/* Clear — gray circle × */}
        <button
          type="button"
          className={`sb-btn-clear ${hasText ? 'is-visible' : ''}`}
          onClick={e => { e.stopPropagation(); handleClear(); }}
          aria-label="Clear search"
          tabIndex={hasText ? 0 : -1}
          disabled={disabled}
        >
          <X size={11} strokeWidth={3} />
        </button>
      </div>

      {/* ── Suggestions dropdown ─────────────────────────────────────── */}
      {showDropdown && (
        <ul
          id="sb-listbox"
          role="listbox"
          aria-label="Search suggestions"
          className="sb-dropdown"
        >
          {/* Recent section */}
          {recentList.length > 0 && (
            <>
              <li className="sb-section-label" role="presentation">
                Recent
              </li>
              {recentList.map(s => {
                const idx = flatList.indexOf(s);
                return (
                  <li
                    key={s.id}
                    id={`sb-opt-${idx}`}
                    role="option"
                    aria-selected={idx === activeIdx}
                    className={`sb-suggestion ${idx === activeIdx ? 'is-active' : ''}`}
                    onMouseDown={e => { e.preventDefault(); selectSuggestion(s); }}
                    onMouseEnter={() => setActiveIdx(idx)}
                  >
                    <span className={chipClass(s.type)}>{chipIcon(s.type)}</span>
                    <span className="sb-row-body">
                      <span className="sb-row-label">{highlight(s.label, query)}</span>
                      {s.category && <span className="sb-row-category">{s.category}</span>}
                    </span>
                  </li>
                );
              })}
            </>
          )}

          {/* Divider between sections */}
          {recentList.length > 0 && otherList.length > 0 && (
            <li className="sb-divider" role="presentation" />
          )}

          {/* Suggestions / results section */}
          {otherList.length > 0 && (
            <>
              {hasText && (
                <li className="sb-section-label" role="presentation">
                  Suggestions
                </li>
              )}
              {otherList.map(s => {
                const idx = flatList.indexOf(s);
                return (
                  <li
                    key={s.id}
                    id={`sb-opt-${idx}`}
                    role="option"
                    aria-selected={idx === activeIdx}
                    className={`sb-suggestion ${idx === activeIdx ? 'is-active' : ''}`}
                    onMouseDown={e => { e.preventDefault(); selectSuggestion(s); }}
                    onMouseEnter={() => setActiveIdx(idx)}
                  >
                    <span className={chipClass(s.type)}>{chipIcon(s.type)}</span>
                    <span className="sb-row-body">
                      <span className="sb-row-label">{highlight(s.label, query)}</span>
                      {s.category && <span className="sb-row-category">{s.category}</span>}
                    </span>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
