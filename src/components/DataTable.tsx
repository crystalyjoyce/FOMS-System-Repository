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

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc" | null;

export interface ColumnDef<T> {
  /** Unique key; matches a field in T or a custom identifier */
  key: string;
  /** Column header label */
  label: string;
  /** Renders a custom cell; falls back to String(row[key]) */
  render?: (row: T) => ReactNode;
  /** Allow sorting on this column */
  sortable?: boolean;
  /** CSS width, e.g. "200px" or "20%" */
  width?: string;
  /** Align cell content */
  align?: "left" | "center" | "right";
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
  icon?: string; // Tabler icon class e.g. "ti-edit"
  onClick: (row: T) => void;
  variant?: "default" | "danger";
  /** Return true to hide this action for a specific row */
  hidden?: (row: T) => boolean;
}

export interface CreateButton {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export interface DataTableProps<T> {
  /** Unique row identifier field */
  rowKey: keyof T;
  /** All data rows — the component handles pagination/filtering internally */
  data: T[];
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Three-dot dropdown actions */
  actions?: ActionItem<T>[];
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Fields to include in search (defaults to all string/number fields) */
  searchFields?: (keyof T)[];
  /** Dropdown filter configs */
  filters?: FilterConfig[];
  /** Buttons rendered on the right side of the toolbar */
  createButtons?: CreateButton[];
  /** Rows per page options */
  pageSizeOptions?: number[];
  /** Initial rows per page */
  defaultPageSize?: number;
  /** Empty state message */
  emptyMessage?: string;
  /** Show row checkboxes for bulk selection */
  selectable?: boolean;
  /** Called when selection changes */
  onSelectionChange?: (selectedKeys: (string | number)[]) => void;
  /** Optional CSS class on the wrapper */
  className?: string;
  /** Loading skeleton */
  loading?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

function matchesSearch<T>(
  row: T,
  query: string,
  fields?: (keyof T)[]
): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  const keys = fields
    ? (fields as string[])
    : Object.keys(row as object);
  return keys.some((k) => {
    const v = getValue(row, k);
    return v != null && String(v).toLowerCase().includes(q);
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
  searchPlaceholder = "Search…",
  searchFields,
  filters = [],
  createButtons = [],
  pageSizeOptions = [10, 25, 50],
  defaultPageSize = 10,
  emptyMessage = "No records found.",
  selectable = false,
  onSelectionChange,
  className = "",
  loading = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());

  // ── Filter + Search + Sort ──────────────────────────────────────────────────

  const processed = useMemo(() => {
    let rows = [...data];

    // Search
    rows = rows.filter((r) => matchesSearch(r, search, searchFields));

    // Active filters
    Object.entries(activeFilters).forEach(([key, val]) => {
      if (!val) return;
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
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processed.slice(start, start + pageSize);
  }, [processed, page, pageSize]);

  // ── Selection ───────────────────────────────────────────────────────────────

  const pageKeys = paginated.map((r) => r[rowKey] as string | number);
  const allPageSelected =
    pageKeys.length > 0 && pageKeys.every((k) => selected.has(k));
  const somePageSelected = pageKeys.some((k) => selected.has(k));

  const toggleRow = useCallback(
    (key: string | number) => {
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

  // ── Sort handler ────────────────────────────────────────────────────────────

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
    setPage(1);
  };

  const sortIcon = (key: string) => {
    if (sortKey !== key) return <i className="ti ti-selector dt-sort-icon" aria-hidden="true" />;
    if (sortDir === "asc") return <i className="ti ti-sort-ascending dt-sort-icon dt-sort-icon--active" aria-hidden="true" />;
    return <i className="ti ti-sort-descending dt-sort-icon dt-sort-icon--active" aria-hidden="true" />;
  };

  // ── Pagination helpers ──────────────────────────────────────────────────────

  const pageRange = (): (number | "…")[] => {
    const pages: (number | "…")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "…") {
        pages.push("…");
      }
    }
    return pages;
  };

  const fromRow = processed.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, processed.length);

  const showActions = actions.length > 0;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={`dt-root ${className}`}>

      {/* ── Toolbar ── */}
      <div className="dt-toolbar">
        <div className="dt-toolbar-left">
          {/* Search */}
          <div className="dt-search-wrap">
            <i className="ti ti-search dt-search-icon" aria-hidden="true" />
            <input
              type="text"
              className="dt-search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              aria-label="Search records"
            />
            {search && (
              <button
                className="dt-search-clear"
                aria-label="Clear search"
                onClick={() => { setSearch(""); setPage(1); }}
              >
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Filter dropdowns */}
          {filters.map((f) => (
            <select
              key={f.key}
              className="dt-filter-select"
              aria-label={f.label}
              value={activeFilters[f.key] ?? ""}
              onChange={(e) => {
                setActiveFilters((prev) => ({
                  ...prev,
                  [f.key]: e.target.value,
                }));
                setPage(1);
              }}
            >
              <option value="">{f.label}</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}

          {/* Reset filters */}
          {(search || Object.values(activeFilters).some(Boolean)) && (
            <button
              className="dt-btn dt-btn--ghost"
              onClick={() => {
                setSearch("");
                setActiveFilters({});
                setPage(1);
              }}
            >
              <i className="ti ti-refresh" aria-hidden="true" />
              Reset
            </button>
          )}
        </div>

        {/* Right side: create buttons */}
        <div className="dt-toolbar-right">
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

      {/* ── Table ── */}
      <div className="dt-table-wrap">
        <table className="dt-table" aria-label="Data table">
          <thead>
            <tr>
              {selectable && (
                <th className="dt-th dt-th--check">
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
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`dt-th${col.sortable ? " dt-th--sortable" : ""}${sortKey === col.key ? " dt-th--sorted" : ""}`}
                  style={{ width: col.width, textAlign: col.align ?? "left" }}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
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
                  {selectable && <td className="dt-td"><div className="dt-skeleton dt-skeleton--sm" /></td>}
                  {columns.map((col) => (
                    <td key={col.key} className="dt-td">
                      <div className="dt-skeleton" style={{ width: col.width ? "80%" : `${60 + ((i * col.key.length) % 30)}%` }} />
                    </td>
                  ))}
                  {showActions && <td className="dt-td"><div className="dt-skeleton dt-skeleton--sm" style={{ marginLeft: "auto" }} /></td>}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (selectable ? 1 : 0) +
                    (showActions ? 1 : 0)
                  }
                  className="dt-td dt-empty"
                >
                  <i className="ti ti-inbox" aria-hidden="true" />
                  <p>{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginated.map((row) => {
                const key = row[rowKey] as string | number;
                return (
                  <tr
                    key={key}
                    className={`dt-row${selected.has(key) ? " dt-row--selected" : ""}`}
                  >
                    {selectable && (
                      <td className="dt-td dt-td--check">
                        <input
                          type="checkbox"
                          className="dt-checkbox"
                          checked={selected.has(key)}
                          onChange={() => toggleRow(key)}
                          aria-label={`Select row ${key}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="dt-td"
                        style={{ textAlign: col.align ?? "left" }}
                      >
                        {col.render
                          ? col.render(row)
                          : String(getValue(row, col.key) ?? "—")}
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
          {processed.length === 0
            ? "No records"
            : `Showing ${fromRow}–${toRow} of ${processed.length}`}
        </span>

        <div className="dt-pagination-controls">
          <span className="dt-page-size-label">Rows per page</span>
          <select
            className="dt-page-size-select"
            value={pageSize}
            aria-label="Rows per page"
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <div className="dt-page-btns" role="navigation" aria-label="Pagination">
            <button
              className="dt-page-btn"
              disabled={page === 1}
              onClick={() => setPage(1)}
              aria-label="First page"
            >
              <i className="ti ti-chevrons-left" aria-hidden="true" />
            </button>
            <button
              className="dt-page-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <i className="ti ti-chevron-left" aria-hidden="true" />
            </button>

            {pageRange().map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="dt-page-ellipsis">…</span>
              ) : (
                <button
                  key={p}
                  className={`dt-page-btn${p === page ? " dt-page-btn--active" : ""}`}
                  onClick={() => setPage(p)}
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
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              <i className="ti ti-chevron-right" aria-hidden="true" />
            </button>
            <button
              className="dt-page-btn"
              disabled={page === totalPages}
              onClick={() => setPage(totalPages)}
              aria-label="Last page"
            >
              <i className="ti ti-chevrons-right" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataTable;