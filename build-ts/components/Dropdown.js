import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback, useId, } from "react";
// ─── Component ─────────────────────────────────────────────────────────────────
export function Dropdown({ trigger, triggerLabel = "Open menu", items, children, align = "left", placement = "bottom", disabled = false, closeOnSelect = true, open: controlledOpen, onOpenChange, className = "", panelClassName = "", }) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;
    const [resolvedPlacement, setResolvedPlacement] = useState(placement);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapRef = useRef(null);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const itemRefs = useRef([]);
    const menuId = useId();
    const setOpen = useCallback((next) => {
        if (!isControlled)
            setUncontrolledOpen(next);
        onOpenChange?.(next);
    }, [isControlled, onOpenChange]);
    // ── Close on outside click ──────────────────────────────────────────────────
    useEffect(() => {
        if (!open)
            return;
        const handler = (e) => {
            if (!wrapRef.current?.contains(e.target))
                setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open, setOpen]);
    // ── Close on escape, return focus to trigger ────────────────────────────────
    useEffect(() => {
        if (!open)
            return;
        const handler = (e) => {
            if (e.key === "Escape") {
                setOpen(false);
                triggerRef.current?.focus();
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, setOpen]);
    // ── Flip placement if there isn't room below ────────────────────────────────
    useEffect(() => {
        if (!open || !triggerRef.current)
            return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const estimatedHeight = panelRef.current?.offsetHeight ?? 200;
        setResolvedPlacement(placement === "bottom" && spaceBelow < estimatedHeight && rect.top > estimatedHeight
            ? "top"
            : placement);
    }, [open, placement]);
    // ── Reset active index when opened/closed ───────────────────────────────────
    useEffect(() => {
        if (open) {
            setActiveIndex(-1);
        }
    }, [open]);
    const enabledIndices = (items ?? [])
        .map((it, i) => (it.disabled ? -1 : i))
        .filter((i) => i !== -1);
    const focusItem = (index) => {
        setActiveIndex(index);
        itemRefs.current[index]?.focus();
    };
    // ── Keyboard navigation for the default `items` list ────────────────────────
    const handlePanelKeyDown = (e) => {
        if (!items || items.length === 0)
            return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            const pos = enabledIndices.indexOf(activeIndex);
            const next = enabledIndices[(pos + 1) % enabledIndices.length];
            focusItem(next);
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            const pos = enabledIndices.indexOf(activeIndex);
            const prevIdx = (pos - 1 + enabledIndices.length) % enabledIndices.length;
            focusItem(enabledIndices[prevIdx]);
        }
        else if (e.key === "Home") {
            e.preventDefault();
            focusItem(enabledIndices[0]);
        }
        else if (e.key === "End") {
            e.preventDefault();
            focusItem(enabledIndices[enabledIndices.length - 1]);
        }
    };
    const handleTriggerKeyDown = (e) => {
        if (disabled)
            return;
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => {
                if (enabledIndices.length > 0)
                    focusItem(enabledIndices[0]);
            });
        }
    };
    const handleItemClick = (item) => {
        if (item.disabled)
            return;
        item.onClick?.();
        if (closeOnSelect) {
            setOpen(false);
            triggerRef.current?.focus();
        }
    };
    return (_jsxs("div", { ref: wrapRef, className: `dd-wrap ${className}`, children: [trigger ? (_jsx("div", { onClick: () => !disabled && setOpen(!open), "aria-haspopup": "true", "aria-expanded": open, children: trigger })) : (_jsx("button", { ref: triggerRef, type: "button", className: "dd-trigger-btn", "aria-label": triggerLabel, "aria-haspopup": "true", "aria-expanded": open, "aria-controls": menuId, disabled: disabled, onClick: () => setOpen(!open), onKeyDown: handleTriggerKeyDown, children: _jsx("span", { className: "dd-trigger-icon", "aria-hidden": "true", children: "\u22EE" }) })), open && (_jsx("div", { ref: panelRef, id: menuId, role: "menu", className: `dd-panel dd-panel--${align} dd-panel--${resolvedPlacement} ${panelClassName}`, onKeyDown: handlePanelKeyDown, children: children
                    ? children
                    : items?.map((item, i) => item.divider ? (_jsx("div", { className: "dd-divider", role: "separator" }, item.key)) : (_jsxs("button", { ref: (el) => {
                            itemRefs.current[i] = el;
                        }, role: "menuitem", type: "button", className: `dd-item${item.variant === "danger" ? " dd-item--danger" : ""}`, disabled: item.disabled, tabIndex: activeIndex === i ? 0 : -1, onClick: () => handleItemClick(item), children: [item.icon && (_jsx("i", { className: `ti ${item.icon}`, "aria-hidden": "true" })), item.label] }, item.key))) }))] }));
}
export default Dropdown;
//# sourceMappingURL=Dropdown.js.map