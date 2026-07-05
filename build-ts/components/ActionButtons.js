import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import Dropdown from "./Dropdown";
import { StatusBadge } from "./StatusBadge";
import { AlertTriangle, Trash2, ShieldAlert } from "lucide-react";
import { useToast } from "./ToastContext";
const ActionButtons = () => {
    const { toast } = useToast();
    const [activeModal, setActiveModal] = useState(null);
    const [confirmInputText, setConfirmInputText] = useState("");
    const cancelBtnRef = useRef(null);
    const modalContainerRef = useRef(null);
    const handleOpenModal = (type) => {
        setActiveModal(type);
        setConfirmInputText("");
    };
    const handleCloseModal = () => {
        setActiveModal(null);
    };
    // Low-Friction Tier: Archive triggers a soft undo toast instead of an annoying modal
    const handleArchive = () => {
        toast.success("Record TXN-8472910 archived successfully.", "Success", "Undo", () => toast.success("Archive action undone."));
    };
    // Auto-focus on Cancel button for safety whenever confirmation modal opens
    useEffect(() => {
        if (activeModal === "delete" || activeModal === "delete-finance") {
            // Wait for render, then focus
            setTimeout(() => {
                cancelBtnRef.current?.focus();
            }, 50);
        }
    }, [activeModal]);
    // Trap Escape key to close modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && activeModal) {
                handleCloseModal();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [activeModal]);
    const menuItems = [
        {
            key: "view",
            label: "View Details",
            icon: "ti-eye",
            onClick: () => handleOpenModal("view"),
        },
        {
            key: "edit",
            label: "Edit Record",
            icon: "ti-pencil",
            onClick: () => handleOpenModal("edit"),
        },
        {
            key: "archive",
            label: "Archive (Soft-Toast)",
            icon: "ti-archive",
            divider: true,
            onClick: handleArchive,
        },
        {
            key: "delete",
            label: "Delete Record (Standard)",
            icon: "ti-trash",
            divider: true,
            onClick: () => handleOpenModal("delete"),
            variant: "danger",
        },
        {
            key: "delete-finance",
            label: "Delete Payment (High-Friction)",
            icon: "ti-shield",
            onClick: () => handleOpenModal("delete-finance"),
            variant: "danger",
        },
    ];
    const renderReadOnlyField = (label, value) => (_jsxs("div", { className: "ab-view-field", children: [_jsx("span", { className: "ab-view-label", children: label }), _jsx("span", { className: "ab-view-value", children: value })] }));
    const renderInput = (label, defaultValue, type = "text") => (_jsxs("div", { className: "ab-form-group", children: [_jsx("label", { className: "ab-label", children: label }), _jsx("input", { type: type, className: "ab-input", defaultValue: defaultValue })] }));
    // Focus Trap helper for tab navigation inside confirmation modal
    const handleModalKeyDown = (e) => {
        if (e.key !== "Tab" || !modalContainerRef.current)
            return;
        const focusableElements = modalContainerRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex="0"]');
        if (focusableElements.length === 0)
            return;
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];
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
    return (_jsxs(_Fragment, { children: [_jsx("style", { children: `
                    /* Custom Dropdown Icon Colors */
                    .dd-item i {
                        color: #64748b !important;
                        opacity: 0.8;
                    }
                    .dd-item:hover i {
                        color: inherit !important;
                    }
                    .dd-item.dd-item--danger i {
                        color: #dc2626 !important;
                    }

                    /* Modal Overlay */
                    .ab-modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(15, 23, 42, 0.4);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 100;
                        backdrop-filter: blur(2px);
                    }

                    /* Modal Card */
                    .ab-modal {
                        background: #ffffff;
                        border-radius: 12px;
                        padding: 28px;
                        width: 380px;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                        font-family: var(--fb, 'Inter', sans-serif);
                        position: relative;
                        animation: abModalEnter 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    }

                    @keyframes abModalEnter {
                        from { opacity: 0; transform: scale(0.96) translateY(8px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }

                    /* Modal Header */
                    .ab-modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 20px;
                        text-align: left;
                    }
                    .ab-modal-eyebrow {
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: var(--tt, #6B7280);
                        margin: 0 0 4px 0;
                        display: block;
                    }
                    .ab-modal-title {
                        font-size: 18px;
                        font-weight: 700;
                        color: var(--navy, #1B254B);
                        margin: 0;
                    }
                    .ab-modal-close {
                        background: none;
                        border: none;
                        cursor: pointer;
                        color: #64748b;
                        font-size: 18px;
                        padding: 0;
                        line-height: 1;
                    }
                    .ab-modal-close:hover {
                        color: #0f172a;
                    }

                    /* Read only and inputs */
                    .ab-view-field {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                        text-align: left;
                        margin-bottom: 16px;
                    }
                    .ab-view-label {
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: #64748b;
                    }
                    .ab-view-value {
                        font-size: 14.5px;
                        font-weight: 600;
                        color: #1e293b;
                    }
                    .ab-form-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px;
                    }
                    .ab-form-group {
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                        text-align: left;
                        margin-bottom: 16px;
                    }
                    .ab-label {
                        font-size: 12px;
                        font-weight: 600;
                        color: #475569;
                    }
                    .ab-input {
                        height: 38px;
                        border: 1px solid #cbd5e1;
                        border-radius: 6px;
                        padding: 0 12px;
                        font-size: 13.5px;
                        outline: none;
                        transition: border-color 0.2s, box-shadow 0.2s;
                        color: #1e293b;
                        background: #ffffff;
                    }
                    .ab-input:focus {
                        border-color: #00a99d;
                        box-shadow: 0 0 0 3px rgba(0, 169, 157, 0.12);
                    }
                    .ab-select {
                        appearance: none;
                        background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
                        background-position: right 8px center;
                        background-repeat: no-repeat;
                        background-size: 18px;
                        padding-right: 32px;
                    }

                    /* Footer & Buttons */
                    .ab-modal-footer {
                        margin-top: 12px;
                        padding-top: 18px;
                        border-top: 1px solid #f1f5f9;
                        display: flex;
                        justify-content: flex-end;
                        gap: 10px;
                    }
                    .ab-btn {
                        height: 36px;
                        padding: 0 16px;
                        border-radius: 6px;
                        font-weight: 600;
                        font-size: 13px;
                        cursor: pointer;
                        transition: background 0.15s, border-color 0.15s, color 0.15s;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .ab-btn-primary {
                        background: #00a99d;
                        color: #ffffff;
                        border: 1px solid #00a99d;
                    }
                    .ab-btn-primary:hover {
                        background: #009189;
                        border-color: #009189;
                    }
                    .ab-btn-outline {
                        background: #ffffff;
                        color: #475569;
                        border: 1px solid #cbd5e1;
                    }
                    .ab-btn-outline:hover {
                        background: #f8fafc;
                        border-color: #94a3b8;
                        color: #1e293b;
                    }
                    .ab-btn-danger {
                        background: #dc2626;
                        color: #ffffff;
                        border: 1px solid #dc2626;
                    }
                    .ab-btn-danger:hover {
                        background: #b91c1c;
                        border-color: #b91c1c;
                    }

                    /* Warning/danger style layout */
                    .ab-modal-centered {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                    }
                    .ab-icon-container {
                        width: 48px;
                        height: 48px;
                        border-radius: 50px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 16px;
                    }
                    .ab-icon-danger {
                        background: rgba(220, 38, 38, 0.08);
                        color: #dc2626;
                    }
                    .ab-icon-danger svg {
                        width: 24px;
                        height: 24px;
                    }
                    .ab-modal-centered .ab-modal-title {
                        margin-bottom: 8px;
                    }
                    .ab-modal-centered .ab-modal-subtitle {
                        line-height: 1.5;
                        font-size: 13.5px;
                        color: #64748b;
                        margin-bottom: 18px;
                    }
                    .ab-modal-centered .ab-modal-footer {
                        justify-content: center;
                        border-top: none;
                        padding-top: 0;
                        margin-top: 0;
                    }

                    /* High friction elements */
                    .ab-critical-alert {
                        display: flex;
                        gap: 10px;
                        background: rgba(220,38,38,0.04);
                        border: 1px solid rgba(220,38,38,0.15);
                        border-radius: 8px;
                        padding: 12px;
                        text-align: left;
                        margin-bottom: 16px;
                    }
                    .ab-critical-alert svg {
                        color: #e11d48;
                        flex-shrink: 0;
                        margin-top: 2px;
                    }
                    .ab-critical-text {
                        font-size: 12.5px;
                        line-height: 1.5;
                        color: #475569;
                        margin: 0;
                    }
                    .ab-critical-text strong {
                        color: #0f172a;
                    }
                    .ab-confirm-code {
                        display: inline-block;
                        background: #f1f5f9;
                        color: #0f172a;
                        font-family: monospace;
                        font-weight: 700;
                        padding: 2px 6px;
                        border-radius: 4px;
                        margin-left: 6px;
                    }
                ` }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [_jsx("div", { style: { width: "fit-content" }, children: _jsx(Dropdown, { items: menuItems, align: "left", placement: "bottom" }) }), _jsx("button", { className: "btn btn--primary", onClick: () => handleOpenModal("create"), children: "+ New Transaction" })] }), activeModal && (_jsx("div", { className: "ab-modal-overlay", onClick: handleCloseModal, children: _jsxs("div", { ref: modalContainerRef, className: "ab-modal", onClick: (e) => e.stopPropagation(), onKeyDown: handleModalKeyDown, role: "alertdialog", "aria-modal": "true", "aria-labelledby": "confirm-modal-title", "aria-describedby": "confirm-modal-desc", children: [activeModal === "view" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "ab-modal-header", children: [_jsxs("div", { children: [_jsx("span", { className: "ab-modal-eyebrow", children: "Transaction Record" }), _jsx("h2", { className: "ab-modal-title", id: "confirm-modal-title", children: "TXN-8472910" })] }), _jsx("button", { className: "ab-modal-close", onClick: handleCloseModal, "aria-label": "Close dialog", children: "\u2715" })] }), _jsxs("div", { id: "confirm-modal-desc", children: [renderReadOnlyField("Entity Name", "Acme Corporation"), _jsxs("div", { className: "ab-form-row", children: [renderReadOnlyField("Amount", "₱14,500.00"), _jsxs("div", { className: "ab-view-field", children: [_jsx("span", { className: "ab-view-label", children: "Status" }), _jsx("div", { style: { marginTop: "2px" }, children: _jsx(StatusBadge, { status: "Active" }) })] })] })] }), _jsxs("div", { className: "ab-modal-footer", children: [_jsx("button", { className: "ab-btn ab-btn-outline", onClick: handleCloseModal, children: "Close" }), _jsx("button", { className: "ab-btn ab-btn-primary", onClick: () => handleOpenModal("edit"), children: "Edit Details" })] })] })), activeModal === "edit" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "ab-modal-header", children: [_jsxs("div", { children: [_jsx("span", { className: "ab-modal-eyebrow", children: "Update Details" }), _jsx("h2", { className: "ab-modal-title", id: "confirm-modal-title", children: "TXN-8472910" })] }), _jsx("button", { className: "ab-modal-close", onClick: handleCloseModal, "aria-label": "Close dialog", children: "\u2715" })] }), _jsxs("div", { id: "confirm-modal-desc", children: [renderInput("Entity Name", "Acme Corporation"), _jsxs("div", { className: "ab-form-row", children: [renderInput("Amount", "14500.00"), _jsxs("div", { className: "ab-form-group", children: [_jsx("label", { className: "ab-label", children: "Status" }), _jsxs("select", { className: "ab-input ab-select", "aria-label": "Status selection", children: [_jsx("option", { children: "Active" }), _jsx("option", { children: "Pending" }), _jsx("option", { children: "Failed" })] })] })] })] }), _jsxs("div", { className: "ab-modal-footer", children: [_jsx("button", { className: "ab-btn ab-btn-outline", onClick: () => handleOpenModal("view"), children: "Back" }), _jsx("button", { className: "ab-btn ab-btn-primary", onClick: handleCloseModal, children: "Save Changes" })] })] })), activeModal === "create" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "ab-modal-header", children: [_jsxs("div", { children: [_jsx("span", { className: "ab-modal-eyebrow", children: "New Transaction" }), _jsx("h2", { className: "ab-modal-title", id: "confirm-modal-title", children: "Create Record" })] }), _jsx("button", { className: "ab-modal-close", onClick: handleCloseModal, "aria-label": "Close dialog", children: "\u2715" })] }), _jsxs("div", { id: "confirm-modal-desc", children: [renderInput("Entity Name", ""), _jsxs("div", { className: "ab-form-row", children: [renderInput("Amount", "0.00"), _jsxs("div", { className: "ab-form-group", children: [_jsx("label", { className: "ab-label", children: "Currency" }), _jsxs("select", { className: "ab-input ab-select", "aria-label": "Currency selection", children: [_jsx("option", { children: "PHP" }), _jsx("option", { children: "USD" }), _jsx("option", { children: "EUR" })] })] })] })] }), _jsxs("div", { className: "ab-modal-footer", children: [_jsx("button", { className: "ab-btn ab-btn-outline", onClick: handleCloseModal, children: "Cancel" }), _jsx("button", { className: "ab-btn ab-btn-primary", onClick: handleCloseModal, children: "Create" })] })] })), activeModal === "delete" && (_jsxs("div", { className: "ab-modal-centered", children: [_jsx("div", { className: "ab-icon-container ab-icon-danger", children: _jsx(Trash2, {}) }), _jsx("h2", { className: "ab-modal-title", id: "confirm-modal-title", children: "Delete Record TXN-8472910?" }), _jsx("p", { className: "ab-modal-subtitle", id: "confirm-modal-desc", children: "This will permanently remove the shipment record from the database. This action cannot be undone." }), _jsxs("div", { className: "ab-modal-footer", children: [_jsx("button", { ref: cancelBtnRef, className: "ab-btn ab-btn-outline", onClick: handleCloseModal, children: "Cancel" }), _jsx("button", { className: "ab-btn ab-btn-danger", onClick: () => {
                                                handleCloseModal();
                                                toast.error("Record TXN-8472910 deleted successfully.", "Deleted");
                                            }, children: "Delete Record" })] })] })), activeModal === "delete-finance" && (_jsxs("div", { className: "ab-modal-centered", children: [_jsx("div", { className: "ab-icon-container ab-icon-danger", children: _jsx(ShieldAlert, {}) }), _jsx("h2", { className: "ab-modal-title", id: "confirm-modal-title", children: "Delete Cleared Payment TXN-8472910?" }), _jsxs("div", { className: "ab-critical-alert", id: "confirm-modal-desc", children: [_jsx(AlertTriangle, { size: 18 }), _jsxs("p", { className: "ab-critical-text", children: [_jsx("strong", { children: "CRITICAL ALERT:" }), " Deleting a cleared financial transaction will affect ledger reconciliation. You must manually reverse the transaction."] })] }), _jsxs("p", { className: "ab-label", style: { textAlign: "left", marginBottom: "8px" }, children: ["To confirm, type the transaction ID:", _jsx("span", { className: "ab-confirm-code", children: "TXN-8472910" })] }), _jsx("input", { type: "text", className: "ab-input", style: { width: "100%", marginBottom: "16px" }, placeholder: "Type signature code...", value: confirmInputText, onChange: (e) => setConfirmInputText(e.target.value), "aria-label": "Transaction ID Confirmation" }), _jsxs("div", { className: "ab-modal-footer", children: [_jsx("button", { ref: cancelBtnRef, className: "ab-btn ab-btn-outline", onClick: handleCloseModal, children: "Cancel" }), _jsx("button", { className: "ab-btn ab-btn-danger", disabled: confirmInputText !== "TXN-8472910", style: {
                                                opacity: confirmInputText === "TXN-8472910" ? 1 : 0.45,
                                                cursor: confirmInputText === "TXN-8472910"
                                                    ? "pointer"
                                                    : "not-allowed",
                                            }, onClick: () => {
                                                handleCloseModal();
                                                toast.error("Cleared payment TXN-8472910 deleted.", "Deleted");
                                            }, children: "Delete Cleared Record" })] })] }))] }) }))] }));
};
export default ActionButtons;
//# sourceMappingURL=ActionButtons.js.map