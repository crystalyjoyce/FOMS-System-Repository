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
import SearchBar from "./SearchBar";
import { useToast } from "./ToastContext";
import "./DataTable.css";

// ─── Row Virtualization Hook ──────────────────────────────────────────────────
// Zero-dependency windowing: only renders rows visible in the scroll viewport.
// Falls back to full render when rowCount ≤ VIRTUAL_THRESHOLD.
const VIRTUAL_THRESHOLD = 100; // rows — below this, skip virtualization overhead
const OVERSCAN = 5;           // extra rows rendered above/below viewport

function useVirtualRows(
  containerRef: React.RefObject<HTMLDivElement | null>,
  rowCount: number,
  rowHeight: number // estimated px per row
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || rowCount <= VIRTUAL_THRESHOLD) return;

    const onScroll = () => setScrollTop(el.scrollTop);
    const ro = new ResizeObserver(() => setViewportHeight(el.clientHeight));
    el.addEventListener("scroll", onScroll, { passive: true });
    ro.observe(el);
    setViewportHeight(el.clientHeight);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [containerRef, rowCount]);

  if (rowCount <= VIRTUAL_THRESHOLD) {
    // No virtualization — render everything
    return { virtualStart: 0, virtualEnd: rowCount, totalHeight: null, offsetY: 0 };
  }

  const totalHeight = rowCount * rowHeight;
  const rawStart = Math.floor(scrollTop / rowHeight) - OVERSCAN;
  const virtualStart = Math.max(0, rawStart);
  const rawEnd = Math.ceil((scrollTop + viewportHeight) / rowHeight) + OVERSCAN;
  const virtualEnd = Math.min(rowCount, rawEnd);
  const offsetY = virtualStart * rowHeight;

  return { virtualStart, virtualEnd, totalHeight, offsetY };
}

// ─── Column Resize Hook ───────────────────────────────────────────────────────
// Drag-to-resize: tracks pointer delta and updates per-column width in local state.
function useColumnResize(
  columns: { key: string; label?: string; width?: string }[],
  storageKey: string
) {
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}:colWidths`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const dragState = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  const onResizeStart = useCallback(
    (e: React.MouseEvent, colKey: string, currentWidth: number) => {
      e.preventDefault();
      e.stopPropagation();
      dragState.current = { key: colKey, startX: e.clientX, startWidth: currentWidth };

      const onMove = (me: MouseEvent) => {
        if (!dragState.current) return;
        const delta = me.clientX - dragState.current.startX;
        const newWidth = Math.max(60, dragState.current.startWidth + delta);
        setColWidths((prev) => {
          const next = { ...prev, [dragState.current!.key]: newWidth };
          try { localStorage.setItem(`${storageKey}:colWidths`, JSON.stringify(next)); } catch {}
          return next;
        });
      };

      const onUp = () => {
        dragState.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [storageKey]
  );

  const getColWidth = useCallback(
    (colKey: string, fallbackWidth?: string): number => {
      const colDef = columns.find((c) => c.key === colKey);
      const labelLen = colDef?.label?.length ?? 10;
      const minRequired = Math.max(140, labelLen * 11 + 50);

      if (colWidths[colKey] !== undefined) {
        return Math.max(minRequired, colWidths[colKey]);
      }
      if (fallbackWidth) {
        const px = parseInt(fallbackWidth, 10);
        if (!isNaN(px)) return Math.max(minRequired, px);
      }
      return Math.max(minRequired, Math.min(360, labelLen * 12 + 65));
    },
    [colWidths, columns]
  );

  return { colWidths, getColWidth, onResizeStart };
}

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

// Saved filter preset — stored in localStorage per table
export interface FilterPreset {
  id: string;
  name: string;
  search: string;
  filters: Record<string, string>;
  sortKey: string | null;
  sortDir: SortDirection;
}

export interface DataTableProps<T> {
  title?: string;
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
  title,
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
  // ── Toolbar State — persisted to localStorage ──────────────────────────────
  // Key is scoped to the table's column set so different tables don't collide.
  const tableStorageKey = useMemo(
    () => `dt:${columns.map((c) => c.key).join("-")}`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // intentionally computed once — column keys are stable
  );

  const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => {
    // 1. Try localStorage first
    try {
      const saved = localStorage.getItem(`${tableStorageKey}:hiddenCols`);
      if (saved) return new Set<string>(JSON.parse(saved));
    } catch {}
    // 2. Fall back to defaultVisible flags
    const h = new Set<string>();
    columns.forEach((c) => {
      if (c.defaultVisible === false) h.add(c.key);
    });
    return h;
  });

  const [showColToggle, setShowColToggle] = useState(false);

  const [density, setDensity] = useState<DensityMode>(() => {
    try {
      const saved = localStorage.getItem(`${tableStorageKey}:density`) as DensityMode | null;
      if (saved && ["compact", "regular", "relaxed"].includes(saved)) return saved;
    } catch {}
    return "regular";
  });
  const [confirm, setConfirm] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const colToggleRef = useRef<HTMLDivElement>(null);

  // ── Filter Presets ─────────────────────────────────────────────────────────
  const [presets, setPresets] = useState<FilterPreset[]>(() => {
    try {
      const saved = localStorage.getItem(`${tableStorageKey}:presets`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName]   = useState("");
  const presetPanelRef = useRef<HTMLDivElement>(null);

  // Close preset panel on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (presetPanelRef.current && !presetPanelRef.current.contains(e.target as Node)) {
        setShowPresets(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const persistPresets = (next: FilterPreset[]) => {
    setPresets(next);
    try { localStorage.setItem(`${tableStorageKey}:presets`, JSON.stringify(next)); } catch {}
  };

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const preset: FilterPreset = {
      id:      Date.now().toString(),
      name,
      search:  search,
      filters: { ...activeFilters },
      sortKey: sortKey,
      sortDir: sortDir,
    };
    persistPresets([...presets, preset]);
    setPresetName("");
    setShowPresets(false);
  };

  const applyPreset = (preset: FilterPreset) => {
    setSearch(preset.search);
    setActiveFilters(preset.filters);
    setSortKey(preset.sortKey);
    setSortDir(preset.sortDir);
    setPage(1);
    onSearchChange?.(preset.search);
    onFilterChange?.(preset.filters);
    onSortChange?.(preset.sortKey, preset.sortDir);
    onPageChange?.(1);
    setShowPresets(false);
  };

  const deletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    persistPresets(presets.filter((p) => p.id !== id));
  };

  // Persist presets on change handled by persistPresets() directly.

  // ── Virtualization ─────────────────────────────────────────────────────────
  const tableWrapRef = useRef<HTMLDivElement>(null);
  // Estimate row height based on density
  const estimatedRowHeight = density === "compact" ? 38 : density === "relaxed" ? 58 : 46;

  // ── Column Resize ──────────────────────────────────────────────────────────
  const { getColWidth, onResizeStart } = useColumnResize(columns, tableStorageKey);

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

  // ── Pagination helpers ─────────────────────────────────────────────────────────
  /**
   * Builds the visible page range with proper ellipsis:
   *   1 … 47 48 49 … 100
   * Rules:
   *   - Always show page 1 and totalPages
   *   - Always show [page-1, page, page+1] (window of 3)
   *   - Insert ‘…’ wherever there is a gap > 1
   */
  const buildPageRange = (): (number | "...")[] => {
    if (totalPages <= 7) {
      // Small page count — just show all
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const visible = new Set<number>();
    // Always include first and last
    visible.add(1);
    visible.add(totalPages);
    // Include window of 3 around current page
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      visible.add(i);
    }
    const sorted = [...visible].sort((a, b) => a - b);
    const result: (number | "...")[] = [];
    for (let i = 0; i < sorted.length; i++) {
      result.push(sorted[i]);
      if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) {
        result.push("...");
      }
    }
    return result;
  };

  // Direct page input
  const [pageInputVal, setPageInputVal] = useState("");
  const [pageInputFocused, setPageInputFocused] = useState(false);

  const commitPageInput = () => {
    const n = parseInt(pageInputVal, 10);
    if (!isNaN(n)) {
      const clamped = Math.min(Math.max(1, n), totalPages);
      handlePageChange(clamped);
    }
    setPageInputVal("");
    setPageInputFocused(false);
  };

  // ── Persist toolbar state to localStorage ────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem(`${tableStorageKey}:density`, density); } catch {}
  }, [density, tableStorageKey]);

  useEffect(() => {
    try { localStorage.setItem(`${tableStorageKey}:hiddenCols`, JSON.stringify([...hiddenCols])); } catch {}
  }, [hiddenCols, tableStorageKey]);

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

  // ── Derived display values ─────────────────────────────────────────────────
  // Count of active filter dropdowns (excludes search, which has its own chip)
  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;
  // Total badges: search counts as 1, each active filter counts as 1
  const totalActiveCount = (search ? 1 : 0) + activeFilterCount;

  // Human-readable sort label for the sort chip
  const sortLabel = useMemo(() => {
    if (!sortKey || !sortDir) return null;
    const col = columns.find((c) => c.key === sortKey);
    const dirLabel = sortDir === "asc" ? "↑ A→Z" : "↓ Z→A";
    return col ? `${col.label} ${dirLabel}` : `${sortKey} ${dirLabel}`;
  }, [sortKey, sortDir, columns]);

  // True when all filters+search are active but produced 0 results
  const hasNoResults = !loading && !serverSide && hasActiveFilters && processed.length === 0;

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

  // ── Virtualization window ─────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { virtualStart, virtualEnd, totalHeight, offsetY } = useVirtualRows(
    tableWrapRef,
    paginated.length,
    estimatedRowHeight
  );
  const virtualRows = paginated.slice(virtualStart, virtualEnd);

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div className={`dt-root ${densityClass} ${className}`}>
      {title && <h2 className="dt-title">{title}</h2>}
      {/* ── Toolbar ── */}
      <div className="dt-toolbar">
        <div className="dt-toolbar-left">
          <div className="dt-search-wrap">
            <SearchBar
              id="dt-search-input"
              variant="sm"
              placeholder={searchPlaceholder}
              value={search}
              onChange={handleSearchChange}
              onClear={() => handleSearchChange("")}
            />
          </div>

          {filters.length > 0 && (
            <div className="dt-filter-group">
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

              {/* ── Active filter count badge ── */}
              {totalActiveCount > 0 && (
                <span className="dt-filter-count-badge" aria-label={`${totalActiveCount} active filter${totalActiveCount !== 1 ? 's' : ''}`}>
                  <i className="ti ti-filter" aria-hidden="true" />
                  {totalActiveCount} filter{totalActiveCount !== 1 ? 's' : ''}
                  <button
                    className="dt-filter-count-clear"
                    onClick={clearAllFilters}
                    aria-label="Clear all filters"
                    title="Clear all filters"
                  >
                    <i className="ti ti-x" aria-hidden="true" />
                  </button>
                </span>
              )}

              {/* ── Filter Presets panel ── */}
              <div className="dt-preset-wrap" ref={presetPanelRef}>
                <Button
                  title="Saved filter presets"
                  iconOnly
                  icon="ti-bookmark"
                  variant="ghost"
                  size="sm"
                  aria-haspopup="true"
                  aria-expanded={showPresets}
                  onClick={() => setShowPresets((p) => !p)}
                />
                {presets.length > 0 && (
                  <span className="dt-preset-count">{presets.length}</span>
                )}

                {showPresets && (
                  <div className="dt-preset-panel" role="dialog" aria-label="Filter presets">
                    <p className="dt-preset-panel-title">
                      <i className="ti ti-bookmark" aria-hidden="true" /> Saved Presets
                    </p>

                    {/* Save current as preset */}
                    <div className="dt-preset-save-row">
                      <input
                        type="text"
                        className="dt-preset-name-input"
                        placeholder="Name this preset…"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && savePreset()}
                        maxLength={40}
                      />
                      <Button
                        title="Save"
                        icon="ti-plus"
                        variant="primary"
                        size="sm"
                        className="dt-preset-save-btn"
                        onClick={savePreset}
                        disabled={!presetName.trim()}
                      />
                    </div>

                    {/* Preset list */}
                    {presets.length === 0 ? (
                      <p className="dt-preset-empty">No saved presets yet.</p>
                    ) : (
                      <ul className="dt-preset-list">
                        {presets.map((preset) => (
                          <li key={preset.id} className="dt-preset-item">
                            <button
                              className="dt-preset-apply"
                              onClick={() => applyPreset(preset)}
                            >
                              <i className="ti ti-filter" aria-hidden="true" />
                              <span className="dt-preset-item-name">{preset.name}</span>
                              {preset.search && (
                                <span className="dt-preset-item-meta">+search</span>
                              )}
                              {Object.keys(preset.filters).length > 0 && (
                                <span className="dt-preset-item-meta">
                                  {Object.keys(preset.filters).length} filter{Object.keys(preset.filters).length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </button>
                            <Button
                              title={`Delete preset ${preset.name}`}
                              iconOnly
                              icon="ti-trash"
                              variant="ghost"
                              size="sm"
                              className="dt-preset-delete"
                              onClick={(e) => deletePreset(preset.id, e)}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
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
              <Button
                id="dt-col-toggle-btn"
                title="Column visibility"
                iconOnly
                icon="ti-columns"
                variant="secondary"
                size="sm"
                aria-haspopup="true"
                aria-expanded={showColToggle}
                onClick={() => setShowColToggle((p) => !p)}
              />
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
            <Button
              id="dt-export-btn"
              title="Export"
              icon="ti-download"
              variant="secondary"
              size="sm"
              onClick={handleExport}
            />
          )}

          {createButtons.map((btn, i) => (
            <Button
              key={i}
              title={btn.label}
              icon={btn.icon}
              variant={btn.variant === "secondary" ? "secondary" : "primary"}
              size="sm"
              onClick={btn.onClick}
            />
          ))}
        </div>
      </div>

      {/* ── Active filter chips + Sort chip ── */}
      {(hasActiveFilters || sortLabel) && (
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

          {/* ── Sort chip ── */}
          {sortLabel && (
            <span className="dt-chip dt-chip--sort">
              <i className="ti ti-arrows-sort" aria-hidden="true" />
              Sorted by: <strong>{sortLabel}</strong>
              <button
                className="dt-chip-remove"
                aria-label="Clear sort"
                onClick={() => {
                  setSortKey(null);
                  setSortDir(null);
                  onSortChange?.(null, null);
                }}
              >
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </span>
          )}

          {(hasActiveFilters) && (
            <Button
              title="Clear all"
              icon="ti-refresh"
              variant="ghost"
              size="sm"
              className="dt-chip-clear-all"
              onClick={clearAllFilters}
            />
          )}
        </div>
      )}

      {/* ── No-results feedback banner ── */}
      {hasNoResults && (
        <div className="dt-no-results-banner" role="status" aria-live="polite">
          <div className="dt-no-results-left">
            <i className="ti ti-search-off dt-no-results-icon" aria-hidden="true" />
            <span className="dt-no-results-text">
              No results for{" "}
              {search && <strong>&ldquo;{search}&rdquo;</strong>}
              {search && activeFilterCount > 0 && " with "}
              {activeFilterCount > 0 && (
                <strong>{activeFilterCount} active filter{activeFilterCount !== 1 ? "s" : ""}</strong>
              )}
            </span>
          </div>
          <Button
            title="Clear filters"
            icon="ti-x"
            variant="ghost"
            size="sm"
            className="dt-no-results-clear"
            onClick={clearAllFilters}
            aria-label="Clear all filters and search"
          />
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
              <Button
                key={i}
                title={action.label}
                icon={action.icon}
                variant={action.variant === "danger" ? "danger" : "secondary"}
                size="sm"
                onClick={() => handleBulkAction(action)}
              />
            ))}
            <Button
              title="Deselect"
              icon="ti-x"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              aria-label="Clear selection"
            />
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="dt-table-wrap" ref={tableWrapRef}>
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
              {visibleColumns.map((col) => {
                const resolvedWidth = getColWidth(col.key, col.width);
                return (
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
                      width: resolvedWidth,
                      minWidth: resolvedWidth,
                      textAlign: col.align ?? "left",
                      ...(col.frozen ? { left: selectable ? "40px" : "0" } : {}),
                    }}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    onKeyDown={
                      col.sortable
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSort(col.key);
                            }
                          }
                        : undefined
                    }
                    tabIndex={col.sortable ? 0 : undefined}
                    aria-sort={
                      col.sortable
                        ? sortKey === col.key
                          ? sortDir === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                        : undefined
                    }
                    scope="col"
                  >
                    <span className="dt-th-inner">
                      {col.label}
                      {col.sortable && sortIcon(col.key)}
                    </span>
                    {/* ── Resize handle ── */}
                    <span
                      className="dt-resize-handle"
                      onMouseDown={(e) => onResizeStart(e, col.key, resolvedWidth)}
                      aria-hidden="true"
                      title="Drag to resize column"
                    />
                  </th>
                );
              })}
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
                      <Button
                        title="Clear Filters"
                        icon="ti-refresh"
                        variant="secondary"
                        size="sm"
                        className="dt-empty-action"
                        onClick={clearAllFilters}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {/* ── Virtualization spacer (top) ── */}
                {totalHeight !== null && offsetY > 0 && (
                  <tr aria-hidden="true" style={{ height: offsetY }}>
                    <td colSpan={totalCols} style={{ padding: 0, border: 0 }} />
                  </tr>
                )}

                {virtualRows.map((row) => {
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
                })}

                {/* ── Virtualization spacer (bottom) ── */}
                {totalHeight !== null && (() => {
                  const bottomSpace = totalHeight - offsetY - (virtualEnd - virtualStart) * estimatedRowHeight;
                  return bottomSpace > 0 ? (
                    <tr aria-hidden="true" style={{ height: bottomSpace }}>
                      <td colSpan={totalCols} style={{ padding: 0, border: 0 }} />
                    </tr>
                  ) : null;
                })()}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <nav
        className="dt-pagination"
        aria-label="Table pagination"
        onKeyDown={(e) => {
          // Keyboard arrow navigation — only when focus is inside pagination nav
          if (e.key === "ArrowLeft" && page > 1) {
            e.preventDefault();
            handlePageChange(page - 1);
          } else if (e.key === "ArrowRight" && page < totalPages) {
            e.preventDefault();
            handlePageChange(page + 1);
          } else if (e.key === "Home") {
            e.preventDefault();
            handlePageChange(1);
          } else if (e.key === "End") {
            e.preventDefault();
            handlePageChange(totalPages);
          }
        }}
      >
        {/* Record count info */}
        <span className="dt-page-info">
          {totalRecords === 0
            ? "No records"
            : `Showing ${fromRow}–${toRow} of ${totalRecords.toLocaleString()} records`}
        </span>

        <div className="dt-pagination-controls">
          {/* Rows-per-page selector */}
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

          {/* ── Desktop page buttons ── */}
          <div className="dt-page-btns" role="group" aria-label="Page navigation">
            {/* First page */}
            <button
              className="dt-page-btn dt-page-btn--icon"
              disabled={page === 1}
              onClick={() => handlePageChange(1)}
              aria-label="First page"
              title="First page"
            >
              <i className="ti ti-chevrons-left" aria-hidden="true" />
            </button>

            {/* Previous page */}
            <button
              className="dt-page-btn dt-page-btn--icon"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
              aria-label="Previous page"
              title="Previous page (Left arrow)"
            >
              <i className="ti ti-chevron-left" aria-hidden="true" />
            </button>

            {/* Page number buttons with smart ellipsis */}
            <span className="dt-page-btns-inner">
              {buildPageRange().map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="dt-page-ellipsis" aria-hidden="true">
                    &hellip;
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
            </span>

            {/* Next page */}
            <button
              className="dt-page-btn dt-page-btn--icon"
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
              aria-label="Next page"
              title="Next page (Right arrow)"
            >
              <i className="ti ti-chevron-right" aria-hidden="true" />
            </button>

            {/* Last page */}
            <button
              className="dt-page-btn dt-page-btn--icon"
              disabled={page === totalPages}
              onClick={() => handlePageChange(totalPages)}
              aria-label="Last page"
              title="Last page"
            >
              <i className="ti ti-chevrons-right" aria-hidden="true" />
            </button>
          </div>

          {/* ── Direct page number input ── */}
          {totalPages > 1 && (
            <div className="dt-page-jump" aria-label="Jump to page">
              <label htmlFor="dt-page-jump-input" className="dt-page-size-label">
                Go to
              </label>
              <input
                id="dt-page-jump-input"
                type="number"
                min={1}
                max={totalPages}
                className="dt-page-jump-input"
                placeholder={String(page)}
                value={pageInputFocused ? pageInputVal : ""}
                aria-label={`Go to page (1–${totalPages})`}
                onFocus={() => { setPageInputFocused(true); setPageInputVal(""); }}
                onChange={(e) => setPageInputVal(e.target.value)}
                onBlur={commitPageInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitPageInput();
                  if (e.key === "Escape") { setPageInputVal(""); setPageInputFocused(false); }
                }}
              />
            </div>
          )}
        </div>

        {/* ── Mobile compact: "Page 3 of 48" with only prev/next ── */}
        <div className="dt-pagination-mobile" aria-hidden="true">
          <button
            className="dt-page-btn dt-page-btn--icon"
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
            aria-label="Previous page"
          >
            <i className="ti ti-chevron-left" aria-hidden="true" />
          </button>
          <span className="dt-page-mobile-label">
            Page <strong>{page}</strong> of {totalPages}
          </span>
          <button
            className="dt-page-btn dt-page-btn--icon"
            disabled={page === totalPages}
            onClick={() => handlePageChange(page + 1)}
            aria-label="Next page"
          >
            <i className="ti ti-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </nav>

      {/* ── Confirm Modal ── */}
      {confirm && (
        <ConfirmModal
          isOpen={!!confirm}
          title="Confirm Action"
          message={confirm.message}
          variant="danger"
          confirmLabel="Confirm Delete"
          loading={confirmLoading}
          onCancel={() => {
            if (!confirmLoading) setConfirm(null);
          }}
          onConfirm={async () => {
            setConfirmLoading(true);
            try {
              // Simulate API request delay for visual spinner feedback
              await new Promise((resolve) => setTimeout(resolve, 1200));
              confirm.onConfirm();
            } finally {
              setConfirmLoading(false);
              setConfirm(null);
            }
          }}
        />
      )}
    </div>
  );
}

export default DataTable;
