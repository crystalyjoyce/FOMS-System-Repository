import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, useRef, useEffect, useCallback, } from "react";
import Button from "./Buttons";
import Dropdown from "./Dropdown";
import ConfirmModal from "./ConfirmModal";
import { useToast } from "./ToastContext";
import "./DataTable.css";
// ─── Helpers ──────────────────────────────────────────────────────────────────
function getValue(row, key) {
    return row[key];
}
function matchesSearch(row, query, fields) {
    if (!query.trim())
        return true;
    const q = query.toLowerCase();
    const keys = fields ? fields : Object.keys(row);
    return keys.some((k) => {
        const v = getValue(row, k);
        return v != null && String(v).toLowerCase().includes(q);
    });
}
function defaultCSVExport(rows, cols) {
    const header = cols.map((c) => `"${c.label}"`).join(",");
    const body = rows.map((row) => cols.map((c) => `"${String(getValue(row, c.key) ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = [header, ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
function ActionMenu({ row, actions }) {
    const visible = actions.filter((a) => !a.hidden?.(row));
    if (visible.length === 0)
        return null;
    const dropdownItems = visible.map((action, index) => ({
        key: `${action.label}-${index}`,
        label: action.label,
        onClick: () => action.onClick(row),
        variant: action.variant,
    }));
    return (_jsx("div", { className: "dt-action-wrap", children: _jsx(Dropdown, { items: dropdownItems, align: "right", placement: "bottom", panelClassName: "dt-dropdown-panel" }) }));
}
// ─── Main Component ───────────────────────────────────────────────────────────
export function DataTable({ rowKey, data, columns, actions = [], searchPlaceholder = "Search\u2026", searchFields, filters = [], createButtons = [], bulkActions = [], pageSizeOptions = [10, 25, 50], defaultPageSize = 10, emptyMessage = "No records found.", selectable = false, onSelectionChange, className = "", loading = false, exportable = false, onExport, columnToggle = false, densityToggle = false, 
// Server-side props
serverSide = false, totalCount, onPageChange, onPageSizeChange, onSortChange, onSearchChange, onFilterChange, }) {
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [activeFilters, setActiveFilters] = useState({});
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [selected, setSelected] = useState(new Set());
    const [selectAllMatching, setSelectAllMatching] = useState(false);
    const [hiddenCols, setHiddenCols] = useState(() => {
        const h = new Set();
        columns.forEach((c) => {
            if (c.defaultVisible === false)
                h.add(c.key);
        });
        return h;
    });
    const [showColToggle, setShowColToggle] = useState(false);
    const [density, setDensity] = useState("regular");
    const [confirm, setConfirm] = useState(null);
    const colToggleRef = useRef(null);
    // ── Outside click closes col-toggle ──────────────────────────────────────────
    useEffect(() => {
        function handler(e) {
            if (colToggleRef.current && !colToggleRef.current.contains(e.target)) {
                setShowColToggle(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);
    // ── Visible columns ───────────────────────────────────────────────────────────
    const visibleColumns = useMemo(() => columns.filter((c) => !hiddenCols.has(c.key)), [columns, hiddenCols]);
    // ── Filter + Search + Sort ────────────────────────────────────────────────────
    const processed = useMemo(() => {
        if (serverSide)
            return data;
        let rows = [...data];
        rows = rows.filter((r) => matchesSearch(r, search, searchFields));
        Object.entries(activeFilters).forEach(([key, val]) => {
            if (!val)
                return;
            rows = rows.filter((r) => String(getValue(r, key)) === val);
        });
        if (sortKey && sortDir) {
            rows.sort((a, b) => {
                const va = String(getValue(a, sortKey) ?? "");
                const vb = String(getValue(b, sortKey) ?? "");
                const cmp = va.localeCompare(vb, undefined, { numeric: true });
                return sortDir === "asc" ? cmp : -cmp;
            });
        }
        return rows;
    }, [data, search, activeFilters, sortKey, sortDir, searchFields, serverSide]);
    // ── Pagination ────────────────────────────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil((serverSide ? (totalCount ?? data.length) : processed.length) / pageSize));
    useEffect(() => {
        if (page > totalPages)
            setPage(totalPages);
    }, [page, totalPages]);
    const paginated = useMemo(() => {
        if (serverSide)
            return data;
        const start = (page - 1) * pageSize;
        return processed.slice(start, start + pageSize);
    }, [processed, page, pageSize, serverSide, data]);
    // ── Selection ─────────────────────────────────────────────────────────────────
    const pageKeys = paginated.map((r) => r[rowKey]);
    const allMatchingKeys = processed.map((r) => r[rowKey]);
    const allPageSelected = pageKeys.length > 0 && pageKeys.every((k) => selected.has(k));
    const somePageSelected = pageKeys.some((k) => selected.has(k));
    const toggleRow = useCallback((key) => {
        setSelectAllMatching(false);
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            onSelectionChange?.([...next]);
            return next;
        });
    }, [onSelectionChange]);
    const toggleAll = useCallback(() => {
        setSelectAllMatching(false);
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
    const selectAll = useCallback(() => {
        setSelectAllMatching(true);
        const next = new Set(allMatchingKeys);
        setSelected(next);
        onSelectionChange?.([...next]);
    }, [allMatchingKeys, onSelectionChange]);
    const clearSelection = useCallback(() => {
        setSelectAllMatching(false);
        setSelected(new Set());
        onSelectionChange?.([]);
    }, [onSelectionChange]);
    const selectedCount = selectAllMatching ? allMatchingKeys.length : selected.size;
    // ── Sort ──────────────────────────────────────────────────────────────────────
    const handleSort = (key) => {
        let nextKey = key;
        let nextDir = "asc";
        if (sortKey !== key) {
            setSortKey(key);
            setSortDir("asc");
        }
        else if (sortDir === "asc") {
            setSortDir("desc");
            nextDir = "desc";
        }
        else {
            setSortKey(null);
            setSortDir(null);
            nextKey = null;
            nextDir = null;
        }
        setPage(1);
        onSortChange?.(nextKey, nextDir);
        onPageChange?.(1);
    };
    const sortIcon = (key) => {
        if (sortKey !== key)
            return _jsx("i", { className: "ti ti-selector dt-sort-icon", "aria-hidden": "true" });
        if (sortDir === "asc")
            return (_jsx("i", { className: "ti ti-sort-ascending dt-sort-icon dt-sort-icon--active", "aria-hidden": "true" }));
        return (_jsx("i", { className: "ti ti-sort-descending dt-sort-icon dt-sort-icon--active", "aria-hidden": "true" }));
    };
    // ── Pagination helpers ─────────────────────────────────────────────────────────
    const pageRange = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || Math.abs(i - page) <= 1)
                pages.push(i);
            else if (pages[pages.length - 1] !== "...")
                pages.push("...");
        }
        return pages;
    };
    const totalRecords = serverSide ? (totalCount ?? data.length) : processed.length;
    const fromRow = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
    const toRow = Math.min(page * pageSize, totalRecords);
    const showActions = actions.length > 0;
    const hasActiveFilters = !!(search || Object.values(activeFilters).some(Boolean));
    const totalCols = visibleColumns.length + (selectable ? 1 : 0) + (showActions ? 1 : 0);
    // ── Operation Handlers ─────────────────────────────────────────────────────────
    const handlePageChange = (p) => {
        setPage(p);
        onPageChange?.(p);
    };
    const handlePageSizeChange = (size) => {
        setPageSize(size);
        setPage(1);
        onPageSizeChange?.(size);
        onPageChange?.(1);
    };
    const handleSearchChange = (val) => {
        setSearch(val);
        setPage(1);
        onSearchChange?.(val);
        onPageChange?.(1);
    };
    const handleFilterChange = (key, val) => {
        const nextFilters = { ...activeFilters, [key]: val };
        if (!val) {
            delete nextFilters[key];
        }
        setActiveFilters(nextFilters);
        setPage(1);
        onFilterChange?.(nextFilters);
        onPageChange?.(1);
    };
    const removeFilter = (key) => {
        const nextFilters = { ...activeFilters };
        delete nextFilters[key];
        setActiveFilters(nextFilters);
        setPage(1);
        onFilterChange?.(nextFilters);
        onPageChange?.(1);
    };
    const clearAllFilters = () => {
        setSearch("");
        setActiveFilters({});
        setPage(1);
        onSearchChange?.("");
        onFilterChange?.({});
        onPageChange?.(1);
    };
    // ── Bulk action ────────────────────────────────────────────────────────────────
    const handleBulkAction = (action) => {
        const keys = selectAllMatching ? allMatchingKeys : [...selected];
        if (action.destructive) {
            setConfirm({
                message: `You are about to delete ${keys.length} record${keys.length !== 1 ? "s" : ""}. This cannot be undone.`,
                onConfirm: () => {
                    action.onClick(keys);
                    clearSelection();
                    setConfirm(null);
                    toast.error(`${keys.length} record${keys.length !== 1 ? "s" : ""} deleted.`);
                },
            });
        }
        else {
            const snapshot = [...keys];
            action.onClick(keys);
            clearSelection();
            if (action.undoable) {
                toast.success(`Action applied to ${keys.length} record${keys.length !== 1 ? "s" : ""}.`, "Success", "Undo", () => {
                    const restored = new Set(snapshot);
                    setSelected(restored);
                    onSelectionChange?.([...restored]);
                });
            }
            else {
                toast.success(`Action applied to ${keys.length} record${keys.length !== 1 ? "s" : ""}.`);
            }
        }
    };
    // ── Export ─────────────────────────────────────────────────────────────────────
    const handleExport = () => {
        const rows = selectAllMatching || selected.size === 0
            ? processed
            : processed.filter((r) => selected.has(r[rowKey]));
        if (onExport) {
            onExport(rows, visibleColumns);
        }
        else {
            defaultCSVExport(rows, visibleColumns);
        }
        toast.success(`Exported ${rows.length} record${rows.length !== 1 ? "s" : ""} to CSV.`);
    };
    const densityClass = {
        compact: "dt-root--compact",
        regular: "",
        relaxed: "dt-root--relaxed",
    }[density];
    // ── Render ─────────────────────────────────────────────────────────────────────
    return (_jsxs("div", { className: `dt-root ${densityClass} ${className}`, children: [_jsxs("div", { className: "dt-toolbar", children: [_jsxs("div", { className: "dt-toolbar-left", children: [_jsxs("div", { className: "dt-search-wrap", children: [_jsx("i", { className: "ti ti-search dt-search-icon", "aria-hidden": "true" }), _jsx("input", { id: "dt-search-input", type: "text", className: "dt-search", placeholder: searchPlaceholder, value: search, onChange: (e) => handleSearchChange(e.target.value), "aria-label": "Search records" }), search && (_jsx("button", { className: "dt-search-clear", "aria-label": "Clear search", onClick: () => handleSearchChange(""), children: _jsx("i", { className: "ti ti-x", "aria-hidden": "true" }) }))] }), filters.map((f) => (_jsxs("select", { className: "dt-filter-select", "aria-label": f.label, value: activeFilters[f.key] ?? "", onChange: (e) => handleFilterChange(f.key, e.target.value), children: [_jsx("option", { value: "", children: f.label }), f.options.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] }, f.key)))] }), _jsxs("div", { className: "dt-toolbar-right", children: [densityToggle && (_jsx("div", { className: "dt-density-group", role: "group", "aria-label": "Row density", children: ["compact", "regular", "relaxed"].map((d) => (_jsxs("button", { className: `dt-density-btn${density === d ? " dt-density-btn--active" : ""}`, onClick: () => setDensity(d), title: d.charAt(0).toUpperCase() + d.slice(1), "aria-pressed": density === d, children: [d === "compact" && (_jsx("i", { className: "ti ti-layout-list", "aria-hidden": "true" })), d === "regular" && (_jsx("i", { className: "ti ti-layout-rows", "aria-hidden": "true" })), d === "relaxed" && (_jsx("i", { className: "ti ti-layout-bottombar", "aria-hidden": "true" }))] }, d))) })), columnToggle && (_jsxs("div", { className: "dt-col-toggle-wrap", ref: colToggleRef, children: [_jsx("button", { id: "dt-col-toggle-btn", className: "dt-btn dt-btn--icon", title: "Column visibility", "aria-haspopup": "true", "aria-expanded": showColToggle, onClick: () => setShowColToggle((p) => !p), children: _jsx("i", { className: "ti ti-columns", "aria-hidden": "true" }) }), showColToggle && (_jsxs("div", { className: "dt-col-panel", role: "menu", "aria-labelledby": "dt-col-toggle-btn", children: [_jsx("p", { className: "dt-col-panel-title", children: "Show / Hide Columns" }), columns.map((col) => (_jsxs("label", { className: "dt-col-item", children: [_jsx("input", { type: "checkbox", className: "dt-checkbox", checked: !hiddenCols.has(col.key), onChange: () => setHiddenCols((prev) => {
                                                            const n = new Set(prev);
                                                            n.has(col.key) ? n.delete(col.key) : n.add(col.key);
                                                            return n;
                                                        }) }), _jsx("span", { children: col.label })] }, col.key)))] }))] })), exportable && (_jsxs("button", { id: "dt-export-btn", className: "dt-btn dt-btn--secondary", onClick: handleExport, title: "Export to CSV", children: [_jsx("i", { className: "ti ti-download", "aria-hidden": "true" }), " Export"] })), createButtons.map((btn, i) => (_jsx(Button, { title: btn.label, variant: btn.variant === "secondary" ? "secondary" : "primary", size: "sm", onClick: btn.onClick }, i)))] })] }), hasActiveFilters && (_jsxs("div", { className: "dt-filter-chips", "aria-label": "Active filters", children: [search && (_jsxs("span", { className: "dt-chip", children: [_jsx("i", { className: "ti ti-search", "aria-hidden": "true" }), "Search: ", _jsx("strong", { children: search }), _jsx("button", { className: "dt-chip-remove", "aria-label": "Clear search", onClick: () => handleSearchChange(""), children: _jsx("i", { className: "ti ti-x", "aria-hidden": "true" }) })] })), Object.entries(activeFilters).map(([key, val]) => {
                        if (!val)
                            return null;
                        const filterDef = filters.find((f) => f.key === key);
                        const optLabel = filterDef?.options.find((o) => o.value === val)?.label ?? val;
                        return (_jsxs("span", { className: "dt-chip", children: [_jsx("i", { className: "ti ti-filter", "aria-hidden": "true" }), filterDef?.label, ": ", _jsx("strong", { children: optLabel }), _jsx("button", { className: "dt-chip-remove", "aria-label": `Remove ${filterDef?.label} filter`, onClick: () => removeFilter(key), children: _jsx("i", { className: "ti ti-x", "aria-hidden": "true" }) })] }, key));
                    }), _jsxs("button", { className: "dt-btn dt-btn--ghost dt-chip-clear-all", onClick: clearAllFilters, children: [_jsx("i", { className: "ti ti-refresh", "aria-hidden": "true" }), " Clear all"] })] })), selectable && selectedCount > 0 && (_jsxs("div", { className: "dt-bulk-bar", role: "toolbar", "aria-label": "Bulk actions", children: [_jsxs("div", { className: "dt-bulk-bar-left", children: [_jsxs("span", { className: "dt-bulk-count", children: [_jsx("i", { className: "ti ti-checkbox", "aria-hidden": "true" }), _jsx("strong", { children: selectedCount }), " row", selectedCount !== 1 ? "s" : "", " ", "selected"] }), !selectAllMatching && allMatchingKeys.length > pageSize && (_jsxs("button", { className: "dt-bulk-select-all", onClick: selectAll, children: ["Select all ", _jsx("strong", { children: allMatchingKeys.length }), " matching results"] })), selectAllMatching && (_jsxs("span", { className: "dt-bulk-all-badge", children: [_jsx("i", { className: "ti ti-check", "aria-hidden": "true" }), "All ", allMatchingKeys.length, " results selected"] }))] }), _jsxs("div", { className: "dt-bulk-actions", children: [bulkActions.map((action, i) => (_jsxs("button", { className: `dt-btn${action.variant === "danger" ? " dt-btn--danger" : " dt-btn--secondary"}`, onClick: () => handleBulkAction(action), children: [action.icon && _jsx("i", { className: `ti ${action.icon}`, "aria-hidden": "true" }), action.label] }, i))), _jsxs("button", { className: "dt-btn dt-btn--ghost", onClick: clearSelection, "aria-label": "Clear selection", children: [_jsx("i", { className: "ti ti-x", "aria-hidden": "true" }), " Deselect"] })] })] })), _jsx("div", { className: "dt-table-wrap", children: _jsxs("table", { className: "dt-table", "aria-label": "Data table", children: [_jsx("thead", { children: _jsxs("tr", { children: [selectable && (_jsx("th", { className: "dt-th dt-th--check dt-th--sticky-left", children: _jsx("input", { type: "checkbox", className: "dt-checkbox", checked: allPageSelected, ref: (el) => {
                                                if (el)
                                                    el.indeterminate = somePageSelected && !allPageSelected;
                                            }, onChange: toggleAll, "aria-label": "Select all on this page" }) })), visibleColumns.map((col) => (_jsx("th", { className: [
                                            "dt-th",
                                            col.sortable ? "dt-th--sortable" : "",
                                            sortKey === col.key ? "dt-th--sorted" : "",
                                            col.frozen ? "dt-th--frozen" : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" "), style: {
                                            width: col.width,
                                            textAlign: col.align ?? "left",
                                            ...(col.frozen ? { left: selectable ? "40px" : "0" } : {}),
                                        }, onClick: col.sortable ? () => handleSort(col.key) : undefined, "aria-sort": sortKey === col.key
                                            ? sortDir === "asc"
                                                ? "ascending"
                                                : "descending"
                                            : undefined, scope: "col", children: _jsxs("span", { className: "dt-th-inner", children: [col.label, col.sortable && sortIcon(col.key)] }) }, col.key))), showActions && (_jsx("th", { className: "dt-th dt-th--actions", style: { textAlign: "right" }, children: "Actions" }))] }) }), _jsx("tbody", { children: loading ? (Array.from({ length: pageSize }).map((_, i) => (_jsxs("tr", { className: "dt-row dt-row--skeleton", children: [selectable && (_jsx("td", { className: "dt-td dt-td--check", children: _jsx("div", { className: "dt-skeleton dt-skeleton--sm" }) })), visibleColumns.map((col) => (_jsx("td", { className: "dt-td", children: _jsx("div", { className: "dt-skeleton", style: {
                                                width: `${55 + ((i * 17 + col.key.length * 7) % 35)}%`,
                                            } }) }, col.key))), showActions && (_jsx("td", { className: "dt-td", children: _jsx("div", { className: "dt-skeleton dt-skeleton--sm", style: { marginLeft: "auto" } }) }))] }, i)))) : paginated.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: totalCols, className: "dt-td dt-empty", children: _jsxs("div", { className: "dt-empty-inner", children: [_jsx("div", { className: "dt-empty-icon-wrap", children: _jsx("i", { className: "ti ti-inbox", "aria-hidden": "true" }) }), _jsx("p", { className: "dt-empty-title", children: hasActiveFilters ? "No results match your filters" : emptyMessage }), _jsx("p", { className: "dt-empty-sub", children: hasActiveFilters
                                                    ? "Try adjusting or removing your active filters."
                                                    : "Create a new record to get started." }), hasActiveFilters && (_jsxs("button", { className: "dt-btn dt-btn--secondary dt-empty-action", onClick: clearAllFilters, children: [_jsx("i", { className: "ti ti-refresh", "aria-hidden": "true" }), " Clear Filters"] }))] }) }) })) : (paginated.map((row) => {
                                const key = row[rowKey];
                                const isSelected = selectAllMatching || selected.has(key);
                                return (_jsxs("tr", { className: `dt-row${isSelected ? " dt-row--selected" : ""}`, "aria-selected": selectable ? isSelected : undefined, children: [selectable && (_jsx("td", { className: "dt-td dt-td--check dt-td--sticky-left", children: _jsx("input", { type: "checkbox", className: "dt-checkbox", checked: isSelected, onChange: () => toggleRow(key), "aria-label": `Select row ${key}` }) })), visibleColumns.map((col) => (_jsx("td", { className: ["dt-td", col.frozen ? "dt-td--frozen" : ""]
                                                .filter(Boolean)
                                                .join(" "), style: {
                                                textAlign: col.align ?? "left",
                                                ...(col.frozen ? { left: selectable ? "40px" : "0" } : {}),
                                            }, children: col.render
                                                ? col.render(row)
                                                : String(getValue(row, col.key) ?? "\u2014") }, col.key))), showActions && (_jsx("td", { className: "dt-td dt-td--actions", children: _jsx(ActionMenu, { row: row, actions: actions }) }))] }, key));
                            })) })] }) }), _jsxs("div", { className: "dt-pagination", children: [_jsx("span", { className: "dt-page-info", children: totalRecords === 0
                            ? "No records"
                            : `Showing ${fromRow}\u2013${toRow} of ${totalRecords.toLocaleString()} records` }), _jsxs("div", { className: "dt-pagination-controls", children: [_jsx("span", { className: "dt-page-size-label", children: "Rows per page" }), _jsx("select", { className: "dt-page-size-select", value: pageSize, "aria-label": "Rows per page", onChange: (e) => handlePageSizeChange(Number(e.target.value)), children: pageSizeOptions.map((n) => (_jsx("option", { value: n, children: n }, n))) }), _jsxs("div", { className: "dt-page-btns", role: "navigation", "aria-label": "Pagination", children: [_jsx("button", { className: "dt-page-btn", disabled: page === 1, onClick: () => handlePageChange(1), "aria-label": "First page", children: _jsx("i", { className: "ti ti-chevrons-left", "aria-hidden": "true" }) }), _jsx("button", { className: "dt-page-btn", disabled: page === 1, onClick: () => handlePageChange(page - 1), "aria-label": "Previous page", children: _jsx("i", { className: "ti ti-chevron-left", "aria-hidden": "true" }) }), pageRange().map((p, i) => p === "..." ? (_jsx("span", { className: "dt-page-ellipsis", children: "..." }, `ellipsis-${i}`)) : (_jsx("button", { className: `dt-page-btn${p === page ? " dt-page-btn--active" : ""}`, onClick: () => handlePageChange(p), "aria-label": `Page ${p}`, "aria-current": p === page ? "page" : undefined, children: p }, p))), _jsx("button", { className: "dt-page-btn", disabled: page === totalPages, onClick: () => handlePageChange(page + 1), "aria-label": "Next page", children: _jsx("i", { className: "ti ti-chevron-right", "aria-hidden": "true" }) }), _jsx("button", { className: "dt-page-btn", disabled: page === totalPages, onClick: () => handlePageChange(totalPages), "aria-label": "Last page", children: _jsx("i", { className: "ti ti-chevrons-right", "aria-hidden": "true" }) })] })] })] }), confirm && (_jsx(ConfirmModal, { isOpen: !!confirm, title: "Confirm Action", message: confirm.message, variant: "danger", confirmLabel: "Confirm Delete", onCancel: () => setConfirm(null), onConfirm: confirm.onConfirm }))] }));
}
export default DataTable;
//# sourceMappingURL=DataTable.js.map