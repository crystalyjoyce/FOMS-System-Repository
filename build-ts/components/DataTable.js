import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, useRef, useEffect, useCallback, } from "react";
// ─── Helpers ──────────────────────────────────────────────────────────────────
function getValue(row, key) {
    return row[key];
}
function matchesSearch(row, query, fields) {
    if (!query.trim())
        return true;
    const q = query.toLowerCase();
    const keys = fields
        ? fields
        : Object.keys(row);
    return keys.some((k) => {
        const v = getValue(row, k);
        return v != null && String(v).toLowerCase().includes(q);
    });
}
function ActionMenu({ row, actions }) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);
    const btnRef = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const handler = (e) => {
            if (menuRef.current &&
                !menuRef.current.contains(e.target) &&
                !btnRef.current?.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);
    const visible = actions.filter((a) => !a.hidden?.(row));
    if (visible.length === 0)
        return null;
    return (_jsxs("div", { className: "dt-action-wrap", children: [_jsx("button", { ref: btnRef, className: "dt-dots-btn", "aria-label": "Row actions", "aria-haspopup": "true", "aria-expanded": open, onClick: (e) => {
                    e.stopPropagation();
                    setOpen((p) => !p);
                }, children: _jsx("i", { className: "ti ti-dots-vertical", "aria-hidden": "true" }) }), open && (_jsx("div", { ref: menuRef, className: "dt-dropdown", role: "menu", children: visible.map((action, i) => (_jsxs("button", { role: "menuitem", className: `dt-dropdown-item${action.variant === "danger" ? " dt-dropdown-item--danger" : ""}`, onClick: (e) => {
                        e.stopPropagation();
                        setOpen(false);
                        action.onClick(row);
                    }, children: [action.icon && (_jsx("i", { className: `ti ${action.icon}`, "aria-hidden": "true" })), action.label] }, i))) }))] }));
}
// ─── Main Component ───────────────────────────────────────────────────────────
export function DataTable({ rowKey, data, columns, actions = [], searchPlaceholder = "Search…", searchFields, filters = [], createButtons = [], pageSizeOptions = [10, 25, 50], defaultPageSize = 10, emptyMessage = "No records found.", selectable = false, onSelectionChange, className = "", loading = false, }) {
    const [search, setSearch] = useState("");
    const [activeFilters, setActiveFilters] = useState({});
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [selected, setSelected] = useState(new Set());
    // ── Filter + Search + Sort ──────────────────────────────────────────────────
    const processed = useMemo(() => {
        let rows = [...data];
        // Search
        rows = rows.filter((r) => matchesSearch(r, search, searchFields));
        // Active filters
        Object.entries(activeFilters).forEach(([key, val]) => {
            if (!val)
                return;
            rows = rows.filter((r) => String(getValue(r, key)) === val);
        });
        // Sort
        if (sortKey && sortDir) {
            rows.sort((a, b) => {
                const va = String(getValue(a, sortKey) ?? "");
                const vb = String(getValue(b, sortKey) ?? "");
                const cmp = va.localeCompare(vb, undefined, { numeric: true });
                return sortDir === "asc" ? cmp : -cmp;
            });
        }
        return rows;
    }, [data, search, activeFilters, sortKey, sortDir, searchFields]);
    // ── Pagination ──────────────────────────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
    // Clamp page when data shrinks
    useEffect(() => {
        if (page > totalPages)
            setPage(totalPages);
    }, [page, totalPages]);
    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return processed.slice(start, start + pageSize);
    }, [processed, page, pageSize]);
    // ── Selection ───────────────────────────────────────────────────────────────
    const pageKeys = paginated.map((r) => r[rowKey]);
    const allPageSelected = pageKeys.length > 0 && pageKeys.every((k) => selected.has(k));
    const somePageSelected = pageKeys.some((k) => selected.has(k));
    const toggleRow = useCallback((key) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            onSelectionChange?.([...next]);
            return next;
        });
    }, [onSelectionChange]);
    const toggleAll = useCallback(() => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (allPageSelected) {
                pageKeys.forEach((k) => next.delete(k));
            }
            else {
                pageKeys.forEach((k) => next.add(k));
            }
            onSelectionChange?.([...next]);
            return next;
        });
    }, [allPageSelected, pageKeys, onSelectionChange]);
    // ── Sort handler ────────────────────────────────────────────────────────────
    const handleSort = (key) => {
        if (sortKey !== key) {
            setSortKey(key);
            setSortDir("asc");
        }
        else if (sortDir === "asc") {
            setSortDir("desc");
        }
        else {
            setSortKey(null);
            setSortDir(null);
        }
        setPage(1);
    };
    const sortIcon = (key) => {
        if (sortKey !== key)
            return _jsx("i", { className: "ti ti-selector dt-sort-icon", "aria-hidden": "true" });
        if (sortDir === "asc")
            return _jsx("i", { className: "ti ti-sort-ascending dt-sort-icon dt-sort-icon--active", "aria-hidden": "true" });
        return _jsx("i", { className: "ti ti-sort-descending dt-sort-icon dt-sort-icon--active", "aria-hidden": "true" });
    };
    // ── Pagination helpers ──────────────────────────────────────────────────────
    const pageRange = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
                pages.push(i);
            }
            else if (pages[pages.length - 1] !== "…") {
                pages.push("…");
            }
        }
        return pages;
    };
    const fromRow = processed.length === 0 ? 0 : (page - 1) * pageSize + 1;
    const toRow = Math.min(page * pageSize, processed.length);
    const showActions = actions.length > 0;
    // ── Render ──────────────────────────────────────────────────────────────────
    return (_jsxs("div", { className: `dt-root ${className}`, children: [_jsxs("div", { className: "dt-toolbar", children: [_jsxs("div", { className: "dt-toolbar-left", children: [_jsxs("div", { className: "dt-search-wrap", children: [_jsx("i", { className: "ti ti-search dt-search-icon", "aria-hidden": "true" }), _jsx("input", { type: "text", className: "dt-search", placeholder: searchPlaceholder, value: search, onChange: (e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }, "aria-label": "Search records" }), search && (_jsx("button", { className: "dt-search-clear", "aria-label": "Clear search", onClick: () => { setSearch(""); setPage(1); }, children: _jsx("i", { className: "ti ti-x", "aria-hidden": "true" }) }))] }), filters.map((f) => (_jsxs("select", { className: "dt-filter-select", "aria-label": f.label, value: activeFilters[f.key] ?? "", onChange: (e) => {
                                    setActiveFilters((prev) => ({
                                        ...prev,
                                        [f.key]: e.target.value,
                                    }));
                                    setPage(1);
                                }, children: [_jsx("option", { value: "", children: f.label }), f.options.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] }, f.key))), (search || Object.values(activeFilters).some(Boolean)) && (_jsxs("button", { className: "dt-btn dt-btn--ghost", onClick: () => {
                                    setSearch("");
                                    setActiveFilters({});
                                    setPage(1);
                                }, children: [_jsx("i", { className: "ti ti-refresh", "aria-hidden": "true" }), "Reset"] }))] }), _jsx("div", { className: "dt-toolbar-right", children: createButtons.map((btn, i) => (_jsxs("button", { className: `dt-btn ${btn.variant === "secondary" ? "dt-btn--secondary" : "dt-btn--primary"}`, onClick: btn.onClick, children: [btn.icon && _jsx("i", { className: `ti ${btn.icon}`, "aria-hidden": "true" }), btn.label] }, i))) })] }), _jsx("div", { className: "dt-table-wrap", children: _jsxs("table", { className: "dt-table", "aria-label": "Data table", children: [_jsx("thead", { children: _jsxs("tr", { children: [selectable && (_jsx("th", { className: "dt-th dt-th--check", children: _jsx("input", { type: "checkbox", className: "dt-checkbox", checked: allPageSelected, ref: (el) => {
                                                if (el)
                                                    el.indeterminate = somePageSelected && !allPageSelected;
                                            }, onChange: toggleAll, "aria-label": "Select all on this page" }) })), columns.map((col) => (_jsx("th", { className: `dt-th${col.sortable ? " dt-th--sortable" : ""}${sortKey === col.key ? " dt-th--sorted" : ""}`, style: { width: col.width, textAlign: col.align ?? "left" }, onClick: col.sortable ? () => handleSort(col.key) : undefined, "aria-sort": sortKey === col.key
                                            ? sortDir === "asc"
                                                ? "ascending"
                                                : "descending"
                                            : undefined, children: _jsxs("span", { className: "dt-th-inner", children: [col.label, col.sortable && sortIcon(col.key)] }) }, col.key))), showActions && (_jsx("th", { className: "dt-th dt-th--actions", style: { textAlign: "right" }, children: "Actions" }))] }) }), _jsx("tbody", { children: loading ? (Array.from({ length: pageSize }).map((_, i) => (_jsxs("tr", { className: "dt-row dt-row--skeleton", children: [selectable && _jsx("td", { className: "dt-td", children: _jsx("div", { className: "dt-skeleton dt-skeleton--sm" }) }), columns.map((col) => (_jsx("td", { className: "dt-td", children: _jsx("div", { className: "dt-skeleton", style: { width: col.width ? "80%" : `${60 + ((i * col.key.length) % 30)}%` } }) }, col.key))), showActions && _jsx("td", { className: "dt-td", children: _jsx("div", { className: "dt-skeleton dt-skeleton--sm", style: { marginLeft: "auto" } }) })] }, i)))) : paginated.length === 0 ? (_jsx("tr", { children: _jsxs("td", { colSpan: columns.length +
                                        (selectable ? 1 : 0) +
                                        (showActions ? 1 : 0), className: "dt-td dt-empty", children: [_jsx("i", { className: "ti ti-inbox", "aria-hidden": "true" }), _jsx("p", { children: emptyMessage })] }) })) : (paginated.map((row) => {
                                const key = row[rowKey];
                                return (_jsxs("tr", { className: `dt-row${selected.has(key) ? " dt-row--selected" : ""}`, children: [selectable && (_jsx("td", { className: "dt-td dt-td--check", children: _jsx("input", { type: "checkbox", className: "dt-checkbox", checked: selected.has(key), onChange: () => toggleRow(key), "aria-label": `Select row ${key}` }) })), columns.map((col) => (_jsx("td", { className: "dt-td", style: { textAlign: col.align ?? "left" }, children: col.render
                                                ? col.render(row)
                                                : String(getValue(row, col.key) ?? "—") }, col.key))), showActions && (_jsx("td", { className: "dt-td dt-td--actions", children: _jsx(ActionMenu, { row: row, actions: actions }) }))] }, key));
                            })) })] }) }), _jsxs("div", { className: "dt-pagination", children: [_jsx("span", { className: "dt-page-info", children: processed.length === 0
                            ? "No records"
                            : `Showing ${fromRow}–${toRow} of ${processed.length}` }), _jsxs("div", { className: "dt-pagination-controls", children: [_jsx("span", { className: "dt-page-size-label", children: "Rows per page" }), _jsx("select", { className: "dt-page-size-select", value: pageSize, "aria-label": "Rows per page", onChange: (e) => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1);
                                }, children: pageSizeOptions.map((n) => (_jsx("option", { value: n, children: n }, n))) }), _jsxs("div", { className: "dt-page-btns", role: "navigation", "aria-label": "Pagination", children: [_jsx("button", { className: "dt-page-btn", disabled: page === 1, onClick: () => setPage(1), "aria-label": "First page", children: _jsx("i", { className: "ti ti-chevrons-left", "aria-hidden": "true" }) }), _jsx("button", { className: "dt-page-btn", disabled: page === 1, onClick: () => setPage((p) => p - 1), "aria-label": "Previous page", children: _jsx("i", { className: "ti ti-chevron-left", "aria-hidden": "true" }) }), pageRange().map((p, i) => p === "…" ? (_jsx("span", { className: "dt-page-ellipsis", children: "\u2026" }, `ellipsis-${i}`)) : (_jsx("button", { className: `dt-page-btn${p === page ? " dt-page-btn--active" : ""}`, onClick: () => setPage(p), "aria-label": `Page ${p}`, "aria-current": p === page ? "page" : undefined, children: p }, p))), _jsx("button", { className: "dt-page-btn", disabled: page === totalPages, onClick: () => setPage((p) => p + 1), "aria-label": "Next page", children: _jsx("i", { className: "ti ti-chevron-right", "aria-hidden": "true" }) }), _jsx("button", { className: "dt-page-btn", disabled: page === totalPages, onClick: () => setPage(totalPages), "aria-label": "Last page", children: _jsx("i", { className: "ti ti-chevrons-right", "aria-hidden": "true" }) })] })] })] })] }));
}
export default DataTable;
//# sourceMappingURL=DataTable.js.map