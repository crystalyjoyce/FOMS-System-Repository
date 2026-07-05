import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Button from "./Buttons";
import "./ConfirmModal.css";
export const ConfirmModal = ({ isOpen, title, message, variant = "primary", cancelLabel = "Cancel", confirmLabel = "Confirm", onCancel, onConfirm, icon, requiredPasscode, passcodeValue = "", onPasscodeChange, }) => {
    const containerRef = useRef(null);
    const cancelBtnRef = useRef(null);
    // Auto-focus on Cancel button for safety when opening
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                if (cancelBtnRef.current) {
                    cancelBtnRef.current.focus();
                }
            }, 50);
        }
    }, [isOpen]);
    // Trap Escape key
    useEffect(() => {
        if (!isOpen)
            return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onCancel();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onCancel]);
    // Trap Tab key inside the modal
    const handleKeyDown = (e) => {
        if (e.key !== "Tab" || !containerRef.current)
            return;
        const focusable = containerRef.current.querySelectorAll('button, input, textarea, select, [tabindex="0"]');
        if (focusable.length === 0)
            return;
        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === firstEl) {
                lastEl.focus();
                e.preventDefault();
            }
        }
        else {
            if (document.activeElement === lastEl) {
                firstEl.focus();
                e.preventDefault();
            }
        }
    };
    if (!isOpen)
        return null;
    const isDestructive = variant === "danger";
    const defaultIcon = isDestructive ? "ti-alert-triangle" : "ti-info-circle";
    const resolvedIcon = icon || defaultIcon;
    const isConfirmDisabled = requiredPasscode
        ? passcodeValue.trim() !== requiredPasscode
        : false;
    return createPortal(_jsx("div", { className: "dt-overlay", role: "dialog", "aria-modal": "true", onClick: onCancel, onKeyDown: handleKeyDown, children: _jsxs("div", { className: "dt-dialog", ref: containerRef, onClick: (e) => e.stopPropagation(), style: {
                borderColor: isDestructive ? "var(--err-r)" : "var(--teal-ring)",
                animation: "abModalEnter 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }, children: [_jsx("div", { className: "dt-dialog-icon", style: {
                        background: isDestructive ? "var(--err-bg)" : "var(--teal-bg)",
                        color: isDestructive ? "var(--err)" : "var(--teal)",
                    }, children: _jsx("i", { className: `ti ${resolvedIcon}`, "aria-hidden": "true" }) }), _jsx("h3", { className: "dt-dialog-title", style: { fontFamily: "var(--fh)" }, children: title }), _jsx("p", { className: "dt-dialog-msg", children: message }), requiredPasscode && (_jsxs("div", { className: "ab-form-group", style: { marginTop: "16px", textAlign: "left" }, children: [_jsxs("label", { className: "tf-label", style: {
                                fontSize: "11px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                color: "var(--ts)",
                                marginBottom: "6px",
                                display: "block",
                            }, children: ["Type ", _jsx("strong", { style: { color: "var(--tp)" }, children: requiredPasscode }), " to confirm"] }), _jsx("input", { type: "text", className: "tf-input", style: {
                                width: "100%",
                                height: "36px",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--r-xs)",
                                padding: "0 10px",
                                fontSize: "13px",
                            }, value: passcodeValue, onChange: (e) => onPasscodeChange?.(e.target.value), placeholder: `Type "${requiredPasscode}"`, autoFocus: true })] })), _jsxs("div", { className: "dt-dialog-actions", style: { marginTop: "24px" }, children: [_jsx("button", { ref: cancelBtnRef, className: "btn btn--secondary btn--sm", onClick: onCancel, children: cancelLabel }), _jsx(Button, { title: confirmLabel, variant: variant, size: "sm", disabled: isConfirmDisabled, onClick: onConfirm })] })] }) }), document.body);
};
export default ConfirmModal;
//# sourceMappingURL=ConfirmModal.js.map