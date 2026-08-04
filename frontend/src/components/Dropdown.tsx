import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  useMemo,
  ReactNode,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DropdownAlign = "left" | "right";
export type DropdownPlacement = "bottom" | "top";

export interface DropdownItem {
  /** Unique key for this item */
  key: string;
  label: string;
  icon?: string; // Tabler icon class, e.g. "ti-edit"
  onClick?: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
  /** Renders a divider above this item */
  divider?: boolean;
}

export interface DropdownProps {
  /** Custom trigger element. If omitted, a default "..." icon button is rendered. */
  trigger?: ReactNode;
  /** Accessible label for the default trigger button (ignored if `trigger` is provided) */
  triggerLabel?: string;
  /** Simple item list — for richer content, use `children` instead */
  items?: DropdownItem[];
  /** Custom dropdown content; takes priority over `items` */
  children?: ReactNode;
  /** Horizontal alignment of the panel relative to the trigger */
  align?: DropdownAlign;
  /** Preferred vertical placement; flips automatically if there's no room */
  placement?: DropdownPlacement;
  /** Disable the trigger entirely */
  disabled?: boolean;
  /** Close the panel after any item click (only applies to `items`) */
  closeOnSelect?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Called whenever open state changes (controlled or uncontrolled) */
  onOpenChange?: (open: boolean) => void;
  /** Optional class on the outer wrapper */
  className?: string;
  /** Optional class on the panel */
  panelClassName?: string;
  /** Enable a search/filter input inside the dropdown (useful for large item lists) */
  searchable?: boolean;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Max height for the items list area (enables scrolling). Default: 240px when item count > 8 */
  maxHeight?: number;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function Dropdown({
  trigger,
  triggerLabel = "Open menu",
  items,
  children,
  align = "right",
  placement = "bottom",
  disabled = false,
  closeOnSelect = true,
  open: controlledOpen,
  onOpenChange,
  className = "",
  panelClassName = "",
  searchable = false,
  searchPlaceholder = "Search…",
  maxHeight,
}: DropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const [coords, setCoords] = useState<{
    top: number;
    left?: number;
    right?: number;
    placement: "top" | "bottom";
  }>({ top: 0, placement: "bottom" });

  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuId = useId();

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  // ── Calculate Portal Fixed Position ─────────────────────────────────────────
  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current || wrapRef.current;
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const panelHeight = panelRef.current?.offsetHeight || 150;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const shouldFlip = spaceBelow < panelHeight + 12 && spaceAbove > panelHeight;
    const resolvedPlacement = shouldFlip ? "top" : "bottom";

    const top = shouldFlip
      ? Math.max(8, rect.top - panelHeight - 6)
      : Math.min(window.innerHeight - panelHeight - 8, rect.bottom + 6);

    if (align === "right") {
      const right = Math.max(8, window.innerWidth - rect.right);
      setCoords({ top, right, placement: resolvedPlacement });
    } else {
      const left = Math.max(8, rect.left);
      setCoords({ top, left, placement: resolvedPlacement });
    }
  }, [align]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const timer = setTimeout(updatePosition, 10);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!wrapRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, setOpen]);

  // ── Close on escape, return focus to trigger ────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  // ── Reset active index when opened/closed ───────────────────────────────────
  useEffect(() => {
    if (open) {
      setActiveIndex(-1);
      setSearchQuery("");
      if (searchable) {
        requestAnimationFrame(() => searchInputRef.current?.focus());
      }
    }
  }, [open, searchable]);

  // ── Filter items based on search query ──────────────────────────────────────
  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) => item.divider || item.label.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const enabledIndices = filteredItems
    .map((it, i) => (it.disabled || it.divider ? -1 : i))
    .filter((i) => i !== -1);

  const resolvedMaxHeight = maxHeight ?? (filteredItems.length > 8 ? 240 : undefined);

  const focusItem = (index: number) => {
    setActiveIndex(index);
    itemRefs.current[index]?.focus();
  };

  // ── Keyboard navigation for items ───────────────────────────────────────────
  const handlePanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!filteredItems || filteredItems.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const pos = enabledIndices.indexOf(activeIndex);
      const next = enabledIndices[(pos + 1) % enabledIndices.length];
      focusItem(next);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const pos = enabledIndices.indexOf(activeIndex);
      const prevIdx =
        (pos - 1 + enabledIndices.length) % enabledIndices.length;
      focusItem(enabledIndices[prevIdx]);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusItem(enabledIndices[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      focusItem(enabledIndices[enabledIndices.length - 1]);
    }
  };

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => {
        if (enabledIndices.length > 0) focusItem(enabledIndices[0]);
      });
    }
  };

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onClick?.();
    if (closeOnSelect) {
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  const panelContent = open ? (
    <div
      ref={panelRef}
      id={menuId}
      role="menu"
      className={`dd-panel dd-panel--${align} dd-panel--${coords.placement} ${panelClassName}`}
      style={{
        position: "fixed",
        top: `${coords.top}px`,
        ...(coords.right !== undefined ? { right: `${coords.right}px` } : { left: `${coords.left}px` }),
        zIndex: 999999,
      }}
      onKeyDown={handlePanelKeyDown}
    >
      {/* Search filter input */}
      {searchable && !children && (
        <div className="dd-search-wrap">
          <input
            ref={searchInputRef}
            type="text"
            className="dd-search-input"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSearchQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                if (enabledIndices.length > 0) focusItem(enabledIndices[0]);
              } else if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
                triggerRef.current?.focus();
              }
            }}
            aria-label="Filter options"
            role="searchbox"
          />
        </div>
      )}

      {children ? (
        children
      ) : (
        <div
          className="dd-items-list"
          style={resolvedMaxHeight ? { maxHeight: resolvedMaxHeight, overflowY: "auto" } : undefined}
        >
          {filteredItems.length === 0 ? (
            <div className="dd-no-results">No results found</div>
          ) : (
            filteredItems.map((item, i) =>
              item.divider ? (
                <div key={item.key} className="dd-divider" role="separator" />
              ) : (
                <button
                  key={item.key}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  role="menuitem"
                  type="button"
                  className={`dd-item${
                    item.variant === "danger" ? " dd-item--danger" : ""
                  }`}
                  disabled={item.disabled}
                  tabIndex={activeIndex === i ? 0 : -1}
                  onClick={() => handleItemClick(item)}
                >
                  {item.icon && (
                    <i className={`ti ${item.icon}`} aria-hidden="true" />
                  )}
                  {item.label}
                </button>
              )
            )
          )}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div ref={wrapRef} className={`dd-wrap ${className}`}>
      {trigger ? (
        <div
          onClick={() => !disabled && setOpen(!open)}
          aria-haspopup="true"
          aria-expanded={open}
        >
          {trigger}
        </div>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          className="dd-trigger-btn"
          aria-label={triggerLabel}
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={menuId}
          disabled={disabled}
          onClick={() => setOpen(!open)}
          onKeyDown={handleTriggerKeyDown}
        >
          <span className="dd-trigger-icon" aria-hidden="true">⋮</span>
        </button>
      )}

      {panelContent && createPortal(panelContent, document.body)}
    </div>
  );
}

export default Dropdown;