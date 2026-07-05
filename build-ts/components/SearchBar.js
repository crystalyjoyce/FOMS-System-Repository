import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import './SearchBar.css';
/* ─── Helper: highlight matching substring ─────────────────────────────── */
function highlight(label, query) {
    const q = query.trim();
    if (!q)
        return label;
    const i = label.toLowerCase().indexOf(q.toLowerCase());
    if (i === -1)
        return label;
    return (_jsxs(_Fragment, { children: [label.slice(0, i), _jsx("mark", { children: label.slice(i, i + q.length) }), label.slice(i + q.length)] }));
}
/* ─── Component ────────────────────────────────────────────────────────── */
const SearchBar = ({ placeholder = 'Search', value: controlledValue, onChange, onSearch, onClear, suggestions = [], onSuggestionSelect, loading = false, disabled = false, variant = 'default', className = '', id = 'searchbar-input', }) => {
    /* Controlled / uncontrolled value */
    const isControlled = controlledValue !== undefined;
    const [internal, setInternal] = useState('');
    const query = isControlled ? controlledValue : internal;
    const [focused, setFocused] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const inputRef = useRef(null);
    const rootRef = useRef(null);
    /* ── Close dropdown on outside click ──────────────────────────────── */
    useEffect(() => {
        const handler = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setFocused(false);
                setActiveIdx(-1);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    /* ── Handlers ──────────────────────────────────────────────────────── */
    const setQuery = useCallback((val) => {
        if (!isControlled)
            setInternal(val);
        onChange?.(val);
    }, [isControlled, onChange]);
    const handleChange = (e) => {
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
    const selectSuggestion = (s) => {
        setQuery(s.label);
        onSuggestionSelect?.(s);
        setFocused(false);
        setActiveIdx(-1);
    };
    /* ── Keyboard nav ──────────────────────────────────────────────────── */
    const handleKeyDown = (e) => {
        const open = focused && suggestions.length > 0;
        if (!open) {
            if (e.key === 'Enter')
                handleSubmit();
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
                if (activeIdx >= 0)
                    selectSuggestion(suggestions[activeIdx]);
                else
                    handleSubmit();
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
    const hasText = query.length > 0;
    /* Split suggestions into sections */
    const recentList = suggestions.filter(s => s.type === 'recent');
    const otherList = suggestions.filter(s => s.type !== 'recent');
    const chipClass = (type) => {
        if (type === 'recent')
            return 'sb-chip chip-recent';
        if (type === 'trending')
            return 'sb-chip chip-trending';
        return 'sb-chip chip-result';
    };
    const chipIcon = (type) => {
        if (type === 'recent')
            return _jsx(Clock, { size: 16, strokeWidth: 1.75 });
        if (type === 'trending')
            return _jsx(TrendingUp, { size: 16, strokeWidth: 1.75 });
        return _jsx(Search, { size: 16, strokeWidth: 1.75 });
    };
    /* Flat ordered list for keyboard index mapping */
    const flatList = [
        ...recentList,
        ...otherList,
    ];
    /* ── Render ────────────────────────────────────────────────────────── */
    return (_jsxs("div", { ref: rootRef, className: [
            'sb-root',
            focused ? 'is-focused' : '',
            disabled ? 'is-disabled' : '',
            variant === 'compact' ? 'is-compact' : '',
            className,
        ].filter(Boolean).join(' '), children: [_jsxs("div", { className: "sb-field", onClick: () => inputRef.current?.focus(), children: [_jsx("span", { className: "sb-icon-search", onClick: e => { e.stopPropagation(); handleSubmit(); }, role: "button", "aria-label": "Submit search", children: loading
                            ? _jsx("span", { className: "sb-spinner" })
                            : _jsx(Search, { size: variant === 'compact' ? 18 : 20, strokeWidth: 2 }) }), _jsx("input", { ref: inputRef, id: id, type: "search", autoComplete: "off", spellCheck: false, role: "combobox", "aria-autocomplete": "list", "aria-expanded": showDropdown, "aria-controls": showDropdown ? 'sb-listbox' : undefined, "aria-activedescendant": activeIdx >= 0 ? `sb-opt-${activeIdx}` : undefined, className: "sb-input", placeholder: placeholder, value: query, onChange: handleChange, onFocus: () => setFocused(true), onKeyDown: handleKeyDown, disabled: disabled }), _jsx("button", { type: "button", className: `sb-btn-clear ${hasText ? 'is-visible' : ''}`, onClick: e => { e.stopPropagation(); handleClear(); }, "aria-label": "Clear search", tabIndex: hasText ? 0 : -1, disabled: disabled, children: _jsx(X, { size: 11, strokeWidth: 3 }) })] }), showDropdown && (_jsxs("ul", { id: "sb-listbox", role: "listbox", "aria-label": "Search suggestions", className: "sb-dropdown", children: [recentList.length > 0 && (_jsxs(_Fragment, { children: [_jsx("li", { className: "sb-section-label", role: "presentation", children: "Recent" }), recentList.map(s => {
                                const idx = flatList.indexOf(s);
                                return (_jsxs("li", { id: `sb-opt-${idx}`, role: "option", "aria-selected": idx === activeIdx, className: `sb-suggestion ${idx === activeIdx ? 'is-active' : ''}`, onMouseDown: e => { e.preventDefault(); selectSuggestion(s); }, onMouseEnter: () => setActiveIdx(idx), children: [_jsx("span", { className: chipClass(s.type), children: chipIcon(s.type) }), _jsxs("span", { className: "sb-row-body", children: [_jsx("span", { className: "sb-row-label", children: highlight(s.label, query) }), s.category && _jsx("span", { className: "sb-row-category", children: s.category })] })] }, s.id));
                            })] })), recentList.length > 0 && otherList.length > 0 && (_jsx("li", { className: "sb-divider", role: "presentation" })), otherList.length > 0 && (_jsxs(_Fragment, { children: [hasText && (_jsx("li", { className: "sb-section-label", role: "presentation", children: "Suggestions" })), otherList.map(s => {
                                const idx = flatList.indexOf(s);
                                return (_jsxs("li", { id: `sb-opt-${idx}`, role: "option", "aria-selected": idx === activeIdx, className: `sb-suggestion ${idx === activeIdx ? 'is-active' : ''}`, onMouseDown: e => { e.preventDefault(); selectSuggestion(s); }, onMouseEnter: () => setActiveIdx(idx), children: [_jsx("span", { className: chipClass(s.type), children: chipIcon(s.type) }), _jsxs("span", { className: "sb-row-body", children: [_jsx("span", { className: "sb-row-label", children: highlight(s.label, query) }), s.category && _jsx("span", { className: "sb-row-category", children: s.category })] })] }, s.id));
                            })] }))] }))] }));
};
export default SearchBar;
//# sourceMappingURL=SearchBar.js.map