import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import Button from "./Buttons";
import Dropdown from "./Dropdown";
import ConfirmModal from "./ConfirmModal";
import { useToast } from "./ToastContext";
import "./DataTable.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc" | null;
export type DensityMode = "compact" | "regular" | "relaxed";

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  frozen?: boolean;
  defaultVisible?: boolean;
}

export interface FilterOption {
  label: string;
  value: string;
}
export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface ActionItem<T> {
  label: string;
  icon?: string;
  onClick: (row: T) => void;
  variant?: "default" | "danger";
  hidden?: (row: T) => boolean;
}

export interface BulkAction {
  label: string;
  icon?: string;
  variant?: "default" | "danger";
  destructive?: boolean;
  undoable?: boolean;
  onClick: (selectedKeys: (string | number)[]) => void;
}

export interface CreateButton {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export interface DataTableProps<T> {
  rowKey: keyof T;
  data: T[];
  columns: ColumnDef<T>[];
  actions?: ActionItem<T>[];
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  filters?: FilterConfig[];
  createButtons?: CreateButton[];
  bulkActions?: BulkAction[];
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  emptyMessage?: string;
  selectable?: boolean;
  onSelectionChange?: (selectedKeys: (string | number)[]) => void;
  className?: string;
  loading?: boolean;
  exportable?: boolean;
  onExport?: (data: T[], columns: ColumnDef<T>[]) => void;
  columnToggle?: boolean;
  densityToggle?: boolean;

  // Server-side Pagination & Operations Props
  serverSide?: boolean;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortChange?: (sortKey: string | null, sortDir: SortDirection) => void;
  onSearchChange?: (query: string) => void;
  onFilterChange?: (filters: Record<string, string>) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

function matchesSearch<T>(row: T, query: string, fields?: (keyof T)[]): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  const keys = fields ? (fields as string[]) : Object.keys(row as object);
  return keys.some((k) => {
    const v = getValue(row, k);
    return v != null && String(v).toLowerCase().includes(q);
  });
}

function defaultCSVExport<T>(rows: T[], cols: ColumnDef<T>[]) {
  const header = cols.map((c) => `"${c.label}"`).join(",");
  const body = rows.map((row) =>
    cols.map((c) => `"${String(getValue(row, c.key) ?? "").replace(/"/g, '""')}"`).join(",")
  );
  const csv = [header, ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `export_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Action Menu ──────────────────────────────────────────────────────────────
interface ActionMenuProps<T> {
  row: T;
  actions: ActionItem<T>[];
}
function ActionMenu<T>({ row, actions }: ActionMenuProps<T>) {
  const visible = actions.filter((a) => !a.hidden?.(row));
  if (visible.length === 0) return null;
  const dropdownItems = visible.map((action, index) => ({
    key: `${action.label}-${index}`,
    label: action.label,
    onClick: () => action.onClick(row),
    variant: action.variant,
  }));
  return (
    <div className="dt-action-wrap">
      <Dropdown
        items={dropdownItems}
        align="right"
        placement="bottom"
        panelClassName="dt-dropdown-panel"
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DataTable<T>({
  rowKey,
  data,
  columns,
  actions = [],
  searchPlaceholder = "Search\u2026",
  searchFields,
  filters = [],
  createButtons = [],
  bulkActions = [],
  pageSizeOptions = [10, 25, 50],
  defaultPageSize = 10,
  emptyMessage = "No records found.",
  selectable = false,
  onSelectionChange,
  className = "",
  loading = false,
  exportable = false,
  onExport,
  columnToggle = false,
  densityToggle = false,

  // Server-side props
  serverSide = false,
  totalCount,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onSearchChange,
  onFilterChange,
}: DataTableProps<T>) {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [selectAllMatching, setSelectAllMatching] = useState(false);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => {
    const h = new Set<string>();
    columns.forEach((c) => {
      if (c.defaultVisible === false) h.add(c.key);
    });
    return h;
  });
  const [showColToggle, setShowColToggle] = useState(false);
  const [density, setDensity] = useState<DensityMode>("regular");
  const [confirm, setConfirm] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const colToggleRef = useRef<HTMLDivElement>(null);

  // ── Outside click closes col-toggle ──────────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (colToggleRef.current && !colToggleRef.current.contains(e.target as Node)) {
        setShowColToggle(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Visible columns ───────────────────────────────────────────────────────────
  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenCols.has(c.key)),
    [columns, hiddenCols]
  );

  // ── Filter + Search + Sort ────────────────────────────────────────────────────
  const processed = useMemo(() => {
    if (serverSide) return data;
    let rows = [...data];
    rows = rows.filter((r) => matchesSearch(r, search, searchFields));
    Object.entries(activeFilters).forEach(([key, val]) => {
      if (!val) return;
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
  const totalPages = Math.max(
    1,
    Math.ceil((serverSide ? (totalCount ?? data.length) : processed.length) / pageSize)
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    if (serverSide) return data;
    const start = (page - 1) * pageSize;
    return processed.slice(start, start + pageSize);
  }, [processed, page, pageSize, serverSide, data]);

  // ── Selection ─────────────────────────────────────────────────────────────────
  const pageKeys = paginated.map((r) => r[rowKey] as string | number);
  const allMatchingKeys = processed.map((r) => r[rowKey] as string | number);
  const allPageSelected = pageKeys.length > 0 && pageKeys.every((k) => selected.has(k));
  const somePageSelected = pageKeys.some((k) => selected.has(k));

  const toggleRow = useCallback(
    (key: string | number) => {
      setSelectAllMatching(false);
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        onSelectionChange?.([...next]);
        return next;
      });
    },
    [onSelectionChange]
  );

  const toggleAll = useCallback(() => {
    setSelectAllMatching(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageKeys.forEach((k) => next.delete(k));
      } else {
        pageKeys.forEach((k) => next.add(k));
      }
      onSelectionChange?.([...next]);
      return next;
    });
  }, [allPageSelected, pageKeys, onSelectionChange]);

  const selectAll = useCallback(() => {
    setSelectAllMatching(true);
    const next = new Set<string | number>(allMatchingKeys);
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
  const handleSort = (key: string) => {
    let nextKey: string | null = key;
    let nextDir: SortDirection = "asc";

    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
      nextDir = "desc";
    } else {
      setSortKey(null);
      setSortDir(null);
      nextKey = null;
      nextDir = null;
    }

    setPage(1);
    onSortChange?.(nextKey, nextDir);
    onPageChange?.(1);
  };

  const sortIcon = (key: string) => {
    if (sortKey !== key)
      return <i className="ti ti-selector dt-sort-icon" aria-hidden="true" />;
    if (sortDir === "asc")
      return (
        <i
          className="ti ti-sort-ascending dt-sort-icon dt-sort-icon--active"
          aria-hidden="true"
        />
      );
    return (
      <i
        className="ti ti-sort-descending dt-sort-icon dt-sort-icon--active"
        aria-hidden="true"
      />
    );
  };

  // ── Pagination helpers ─────────────────────────────────────────────────────────
  const pageRange = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
      else if (pages[pages.length - 1] !== "...") pages.push("...");
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
  const handlePageChange = (p: number) => {
    setPage(p);
    onPageChange?.(p);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
    onPageSizeChange?.(size);
    onPageChange?.(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    onSearchChange?.(val);
    onPageChange?.(1);
  };

  const handleFilterChange = (key: string, val: string) => {
    const nextFilters = { ...activeFilters, [key]: val };
    if (!val) {
      delete nextFilters[key];
    }
    setActiveFilters(nextFilters);
    setPage(1);
    onFilterChange?.(nextFilters);
    onPageChange?.(1);
  };

  const removeFilter = (key: string) => {
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
  const handleBulkAction = (action: BulkAction) => {
    const keys = selectAllMatching ? allMatchingKeys : [...selected];
    if (action.destructive) {
      setConfirm({
        message: `You are about to delete ${keys.length} record${
          keys.length !== 1 ? "s" : ""
        }. This cannot be undone.`,
        onConfirm: () => {
          action.onClick(keys);
          clearSelection();
          setConfirm(null);
          toast.error(`${keys.length} record${keys.length !== 1 ? "s" : ""} deleted.`);
        },
      });
    } else {
      const snapshot = [...keys];
      action.onClick(keys);
      clearSelection();
      if (action.undoable) {
        toast.success(
          `Action applied to ${keys.length} record${keys.length !== 1 ? "s" : ""}.`,
          "Success",
          "Undo",
          () => {
            const restored = new Set<string | number>(snapshot);
            setSelected(restored);
            onSelectionChange?.([...restored]);
          }
        );
      } else {
        toast.success(
          `Action applied to ${keys.length} record${keys.length !== 1 ? "s" : ""}.`
        );
      }
    }
  };

  // ── Export ─────────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const rows =
      selectAllMatching || selected.size === 0
        ? processed
        : processed.filter((r) => selected.has(r[rowKey] as string | number));
    if (onExport) {
      onExport(rows, visibleColumns);
    } else {
      defaultCSVExport(rows, visibleColumns);
    }
    toast.success(
      `Exported ${rows.length} record${rows.length !== 1 ? "s" : ""} to CSV.`
    );
  };

  const densityClass = {
    compact: "dt-root--compact",
    regular: "",
    relaxed: "dt-root--relaxed",
  }[density];

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div className={`dt-root ${densityClass} ${className}`}>
      {/* ── Toolbar ── */}
      <div className="dt-toolbar">
        <div className="dt-toolbar-left">
          <div className="dt-search-wrap">
            <i className="ti ti-search dt-search-icon" aria-hidden="true" />
            <input
              id="dt-search-input"
              type="text"
              className="dt-search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Search records"
            />
            {search && (
              <button
                className="dt-search-clear"
                aria-label="Clear search"
                onClick={() => handleSearchChange("")}
              >
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            )}
          </div>

          {filters.map((f) => (
            <select
              key={f.key}
              className="dt-filter-select"
              aria-label={f.label}
              value={activeFilters[f.key] ?? ""}
              onChange={(e) => handleFilterChange(f.key, e.target.value)}
            >
              <option value="">{f.label}</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>

        <div className="dt-toolbar-right">
          {densityToggle && (
            <div className="dt-density-group" role="group" aria-label="Row density">
              {(["compact", "regular", "relaxed"] as DensityMode[]).map((d) => (
                <button
                  key={d}
                  className={`dt-density-btn${
                    density === d ? " dt-density-btn--active" : ""
                  }`}
                  onClick={() => setDensity(d)}
                  title={d.charAt(0).toUpperCase() + d.slice(1)}
                  aria-pressed={density === d}
                >
                  {d === "compact" && (
                    <i className="ti ti-layout-list" aria-hidden="true" />
                  )}
                  {d === "regular" && (
                    <i className="ti ti-layout-rows" aria-hidden="true" />
                  )}
                  {d === "relaxed" && (
                    <i className="ti ti-layout-bottombar" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          )}

          {columnToggle && (
            <div className="dt-col-toggle-wrap" ref={colToggleRef}>
              <button
                id="dt-col-toggle-btn"
                className="dt-btn dt-btn--icon"
                title="Column visibility"
                aria-haspopup="true"
                aria-expanded={showColToggle}
                onClick={() => setShowColToggle((p) => !p)}
              >
                <i className="ti ti-columns" aria-hidden="true" />
              </button>
              {showColToggle && (
                <div
                  className="dt-col-panel"
                  role="menu"
                  aria-labelledby="dt-col-toggle-btn"
                >
                  <p className="dt-col-panel-title">Show / Hide Columns</p>
                  {columns.map((col) => (
                    <label key={col.key} className="dt-col-item">
                      <input
                        type="checkbox"
                        className="dt-checkbox"
                        checked={!hiddenCols.has(col.key)}
                        onChange={() =>
                          setHiddenCols((prev) => {
                            const n = new Set(prev);
                            n.has(col.key) ? n.delete(col.key) : n.add(col.key);
                            return n;
                          })
                        }
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {exportable && (
            <button
              id="dt-export-btn"
              className="dt-btn dt-btn--secondary"
              onClick={handleExport}
              title="Export to CSV"
            >
              <i className="ti ti-download" aria-hidden="true" /> Export
            </button>
          )}

          {createButtons.map((btn, i) => (
            <Button
              key={i}
              title={btn.label}
              variant={btn.variant === "secondary" ? "secondary" : "primary"}
              size="sm"
              onClick={btn.onClick}
            />
          ))}
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {hasActiveFilters && (
        <div className="dt-filter-chips" aria-label="Active filters">
          {search && (
            <span className="dt-chip">
              <i className="ti ti-search" aria-hidden="true" />
              Search: <strong>{search}</strong>
              <button
                className="dt-chip-remove"
                aria-label="Clear search"
                onClick={() => handleSearchChange("")}
              >
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </span>
          )}
          {Object.entries(activeFilters).map(([key, val]) => {
            if (!val) return null;
            const filterDef = filters.find((f) => f.key === key);
            const optLabel =
              filterDef?.options.find((o) => o.value === val)?.label ?? val;
            return (
              <span key={key} className="dt-chip">
                <i className="ti ti-filter" aria-hidden="true" />
                {filterDef?.label}: <strong>{optLabel}</strong>
                <button
                  className="dt-chip-remove"
                  aria-label={`Remove ${filterDef?.label} filter`}
                  onClick={() => removeFilter(key)}
                >
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
              </span>
            );
          })}
          <button
            className="dt-btn dt-btn--ghost dt-chip-clear-all"
            onClick={clearAllFilters}
          >
            <i className="ti ti-refresh" aria-hidden="true" /> Clear all
          </button>
        </div>
      )}

      {/* ── Bulk action bar ── */}
      {selectable && selectedCount > 0 && (
        <div className="dt-bulk-bar" role="toolbar" aria-label="Bulk actions">
          <div className="dt-bulk-bar-left">
            <span className="dt-bulk-count">
              <i className="ti ti-checkbox" aria-hidden="true" />
              <strong>{selectedCount}</strong> row{selectedCount !== 1 ? "s" : ""}{" "}
              selected
            </span>
            {!selectAllMatching && allMatchingKeys.length > pageSize && (
              <button className="dt-bulk-select-all" onClick={selectAll}>
                Select all <strong>{allMatchingKeys.length}</strong> matching results
              </button>
            )}
            {selectAllMatching && (
              <span className="dt-bulk-all-badge">
                <i className="ti ti-check" aria-hidden="true" />
                All {allMatchingKeys.length} results selected
              </span>
            )}
          </div>
          <div className="dt-bulk-actions">
            {bulkActions.map((action, i) => (
              <button
                key={i}
                className={`dt-btn${
                  action.variant === "danger" ? " dt-btn--danger" : " dt-btn--secondary"
                }`}
                onClick={() => handleBulkAction(action)}
              >
                {action.icon && <i className={`ti ${action.icon}`} aria-hidden="true" />}
                {action.label}
              </button>
            ))}
            <button
              className="dt-btn dt-btn--ghost"
              onClick={clearSelection}
              aria-label="Clear selection"
            >
              <i className="ti ti-x" aria-hidden="true" /> Deselect
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="dt-table-wrap">
        <table className="dt-table" aria-label="Data table">
          <thead>
            <tr>
              {selectable && (
                <th className="dt-th dt-th--check dt-th--sticky-left">
                  <input
                    type="checkbox"
                    className="dt-checkbox"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = somePageSelected && !allPageSelected;
                    }}
                    onChange={toggleAll}
                    aria-label="Select all on this page"
                  />
                </th>
              )}
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={[
                    "dt-th",
                    col.sortable ? "dt-th--sortable" : "",
                    sortKey === col.key ? "dt-th--sorted" : "",
                    col.frozen ? "dt-th--frozen" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    width: col.width,
                    textAlign: col.align ?? "left",
                    ...(col.frozen ? { left: selectable ? "40px" : "0" } : {}),
                  }}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  scope="col"
                >
                  <span className="dt-th-inner">
                    {col.label}
                    {col.sortable && sortIcon(col.key)}
                  </span>
                </th>
              ))}
              {showActions && (
                <th className="dt-th dt-th--actions" style={{ textAlign: "right" }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} className="dt-row dt-row--skeleton">
                  {selectable && (
                    <td className="dt-td dt-td--check">
                      <div className="dt-skeleton dt-skeleton--sm" />
                    </td>
                  )}
                  {visibleColumns.map((col) => (
                    <td key={col.key} className="dt-td">
                      <div
                        className="dt-skeleton"
                        style={{
                          width: `${55 + ((i * 17 + col.key.length * 7) % 35)}%`,
                        }}
                      />
                    </td>
                  ))}
                  {showActions && (
                    <td className="dt-td">
                      <div
                        className="dt-skeleton dt-skeleton--sm"
                        style={{ marginLeft: "auto" }}
                      />
                    </td>
                  )}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="dt-td dt-empty">
                  <div className="dt-empty-inner">
                    <div className="dt-empty-icon-wrap">
                      <i className="ti ti-inbox" aria-hidden="true" />
                    </div>
                    <p className="dt-empty-title">
                      {hasActiveFilters ? "No results match your filters" : emptyMessage}
                    </p>
                    <p className="dt-empty-sub">
                      {hasActiveFilters
                        ? "Try adjusting or removing your active filters."
                        : "Create a new record to get started."}
                    </p>
                    {hasActiveFilters && (
                      <button
                        className="dt-btn dt-btn--secondary dt-empty-action"
                        onClick={clearAllFilters}
                      >
                        <i className="ti ti-refresh" aria-hidden="true" /> Clear Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row) => {
                const key = row[rowKey] as string | number;
                const isSelected = selectAllMatching || selected.has(key);
                return (
                  <tr
                    key={key}
                    className={`dt-row${isSelected ? " dt-row--selected" : ""}`}
                    aria-selected={selectable ? isSelected : undefined}
                  >
                    {selectable && (
                      <td className="dt-td dt-td--check dt-td--sticky-left">
                        <input
                          type="checkbox"
                          className="dt-checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(key)}
                          aria-label={`Select row ${key}`}
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        className={["dt-td", col.frozen ? "dt-td--frozen" : ""]
                          .filter(Boolean)
                          .join(" ")}
                        style={{
                          textAlign: col.align ?? "left",
                          ...(col.frozen ? { left: selectable ? "40px" : "0" } : {}),
                        }}
                      >
                        {col.render
                          ? col.render(row)
                          : String(getValue(row, col.key) ?? "\u2014")}
                      </td>
                    ))}
                    {showActions && (
                      <td className="dt-td dt-td--actions">
                        <ActionMenu row={row} actions={actions} />
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="dt-pagination">
        <span className="dt-page-info">
          {totalRecords === 0
            ? "No records"
            : `Showing ${fromRow}\u2013${toRow} of ${totalRecords.toLocaleString()} records`}
        </span>
        <div className="dt-pagination-controls">
          <span className="dt-page-size-label">Rows per page</span>
          <select
            className="dt-page-size-select"
            value={pageSize}
            aria-label="Rows per page"
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <div className="dt-page-btns" role="navigation" aria-label="Pagination">
            <button
              className="dt-page-btn"
              disabled={page === 1}
              onClick={() => handlePageChange(1)}
              aria-label="First page"
            >
              <i className="ti ti-chevrons-left" aria-hidden="true" />
            </button>
            <button
              className="dt-page-btn"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
              aria-label="Previous page"
            >
              <i className="ti ti-chevron-left" aria-hidden="true" />
            </button>
            {pageRange().map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="dt-page-ellipsis">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  className={`dt-page-btn${p === page ? " dt-page-btn--active" : ""}`}
                  onClick={() => handlePageChange(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </button>
              )
            )}
            <button
              className="dt-page-btn"
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
              aria-label="Next page"
            >
              <i className="ti ti-chevron-right" aria-hidden="true" />
            </button>
            <button
              className="dt-page-btn"
              disabled={page === totalPages}
              onClick={() => handlePageChange(totalPages)}
              aria-label="Last page"
            >
              <i className="ti ti-chevrons-right" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Confirm Modal ── */}
      {confirm && (
        <ConfirmModal
          isOpen={!!confirm}
          title="Confirm Action"
          message={confirm.message}
          variant="danger"
          confirmLabel="Confirm Delete"
          onCancel={() => setConfirm(null)}
          onConfirm={confirm.onConfirm}
        />
      )}
    </div>
  );
}

export default DataTable;
