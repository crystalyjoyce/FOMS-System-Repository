import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { GlobalHeader, GlobalFooter, Button, Dropdown, DataTable, Sidebar, StatusCard, StatusBadge, DashboardLayout, FormModals, SearchBar, ConfirmModal, ToastProvider, useToast, } from "./components";
import ToastBar from "./components/ToastBar";
import ActionButtons from "./components/ActionButtons";
const tableData = [
    { id: 1, name: "Avery Lee", role: "Product Manager", status: "Active" },
    { id: 2, name: "Jordan Kim", role: "Engineer", status: "Pending" },
    { id: 3, name: "Taylor Reed", role: "Designer", status: "Active" },
];
const tableColumns = [
    { key: "name", label: "Name", sortable: true },
    { key: "role", label: "Role", sortable: true },
    { key: "status", label: "Status", sortable: true },
];
const dropdownItems = [
    { key: "edit", label: "Edit", variant: "default" },
    { key: "duplicate", label: "Duplicate", variant: "default" },
    { key: "delete", label: "Delete", variant: "danger" },
];
const rowActions = [
    {
        label: "Edit",
        icon: "ti-pencil",
        onClick: (row) => alert(`Edit ${row.name}`),
        variant: "default",
    },
    {
        label: "Duplicate",
        icon: "ti-copy",
        onClick: (row) => alert(`Duplicate ${row.name}`),
        variant: "default",
    },
    {
        label: "Delete",
        icon: "ti-trash",
        variant: "danger",
        onClick: (row) => alert(`Delete ${row.name}`),
    },
];
function AppContent() {
    const { toast } = useToast();
    const [showConfirm, setShowConfirm] = React.useState(false);
    const [passcode, setPasscode] = React.useState("");
    return (_jsxs("div", { className: "app-layout", children: [_jsx(Sidebar, {}), _jsxs("div", { className: "main-area", children: [_jsx(GlobalHeader, {}), _jsxs("main", { children: [_jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Dashboard Layout" }), _jsx(DashboardLayout, {})] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Status Cards (KPIs)" }), _jsxs("div", { className: "g ga", style: {
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                                            gap: "16px",
                                        }, children: [_jsx(StatusCard, { label: "ACTIVE TASKS", value: "110", icon: "ti ti-clipboard-list", variant: "warning", periodText: "Pending & In-Transit" }), _jsx(StatusCard, { label: "COMPLETED TODAY", value: "214", icon: "ti ti-circle-check", variant: "success", periodText: "Total successful deliveries" }), _jsx(StatusCard, { label: "IN TRANSIT", value: "67", icon: "ti ti-truck", variant: "info", periodText: "Currently on-road" }), _jsx(StatusCard, { label: "FAILED / RETURNED", value: "30", icon: "ti ti-alert-circle", variant: "danger", periodText: "Needs attention" })] })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Status Badges" }), _jsxs("div", { className: "component-row", style: { display: "flex", gap: "10px", flexWrap: "wrap" }, children: [_jsx(StatusBadge, { status: "Active" }), _jsx(StatusBadge, { status: "Deactivated" }), _jsx(StatusBadge, { status: "Pending" }), _jsx(StatusBadge, { status: "Done" }), _jsx(StatusBadge, { status: "Delivered" }), _jsx(StatusBadge, { status: "In Transit" }), _jsx(StatusBadge, { status: "Failed" }), _jsx(StatusBadge, { status: "Success" }), _jsx(StatusBadge, { status: "Submitted" }), _jsx(StatusBadge, { status: "Picked-Up" }), _jsx(StatusBadge, { status: "Completed" }), _jsx(StatusBadge, { status: "Processing" }), _jsx(StatusBadge, { status: "Preparing" }), _jsx(StatusBadge, { status: "Ready for Pickup" }), _jsx(StatusBadge, { status: "Returning" }), _jsx(StatusBadge, { status: "Not Submitted" }), _jsx(StatusBadge, { status: "Assigned" }), _jsx(StatusBadge, { status: "Out of Delivery" }), _jsx(StatusBadge, { status: "Returned" }), _jsx(StatusBadge, { status: "Cancelled" }), _jsx(StatusBadge, { status: "Partially Paid" }), _jsx(StatusBadge, { status: "Paid" }), _jsx(StatusBadge, { status: "Inflow" }), _jsx(StatusBadge, { status: "Outflow" }), _jsx(StatusBadge, { status: "Overdue" }), _jsx(StatusBadge, { status: "New Payment" }), _jsx(StatusBadge, { status: "30 - 60 Days" })] })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Buttons" }), _jsxs("div", { className: "component-row", style: { display: "flex", gap: "12px", flexWrap: "wrap" }, children: [_jsx(Button, { title: "Save Changes", variant: "primary" }), _jsx(Button, { title: "Add / Create", variant: "primary" }), _jsx(Button, { title: "Edit Record", variant: "secondary" }), _jsx(Button, { title: "Approve Request", variant: "success" }), _jsx(Button, { title: "Activate Account", variant: "success" }), _jsx(Button, { title: "Reject Transaction", variant: "danger" }), _jsx(Button, { title: "Deactivate License", variant: "warning" }), _jsx(Button, { title: "Delete Record", variant: "danger" }), _jsx(Button, { title: "Cancel Action", variant: "secondary" })] })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Dropdown" }), _jsx(Dropdown, { items: dropdownItems })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Search Bar" }), _jsx(SearchBar, { placeholder: "Search waybills, dispatch routes...", onSearch: (val) => console.log("Searching:", val), suggestions: [
                                            { id: "1", label: "SP-77291", category: "Waybill", type: "result" },
                                            { id: "2", label: "Route #8 schedule", category: "Route", type: "trending" },
                                            { id: "3", label: "Hermione Benitez profile", category: "User", type: "recent" },
                                        ] })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Data Table" }), _jsx(DataTable, { rowKey: "id", data: tableData, columns: tableColumns, actions: rowActions, selectable: true, exportable: true, columnToggle: true, densityToggle: true, bulkActions: [
                                            {
                                                label: "Change Status",
                                                icon: "ti-refresh",
                                                undoable: true,
                                                onClick: (keys) => console.log("Change Status", keys),
                                            },
                                            {
                                                label: "Assign Driver",
                                                icon: "ti-user-check",
                                                undoable: true,
                                                onClick: (keys) => console.log("Assign Driver", keys),
                                            },
                                            {
                                                label: "Export",
                                                icon: "ti-download",
                                                onClick: (keys) => console.log("Export", keys),
                                            },
                                            {
                                                label: "Delete",
                                                icon: "ti-trash",
                                                variant: "danger",
                                                destructive: true,
                                                onClick: (keys) => console.log("Delete", keys),
                                            },
                                        ], filters: [
                                            {
                                                key: "status",
                                                label: "All Statuses",
                                                options: [
                                                    { label: "Active", value: "Active" },
                                                    { label: "Pending", value: "Pending" },
                                                ],
                                            },
                                            {
                                                key: "role",
                                                label: "All Roles",
                                                options: [
                                                    { label: "Product Manager", value: "Product Manager" },
                                                    { label: "Engineer", value: "Engineer" },
                                                    { label: "Designer", value: "Designer" },
                                                ],
                                            },
                                        ], createButtons: [
                                            { label: "New User", icon: "ti-user", onClick: () => undefined },
                                        ], searchPlaceholder: "Search users..." })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Toastbar" }), _jsxs("div", { className: "tb-btn-row", children: [_jsx("button", { className: "tb-demo-btn success-trigger", onClick: () => toast.success("PHP 5,000 transferred to Juan Dela Cruz.", "Payment Sent Successfully"), children: "Trigger Success Toast" }), _jsx("button", { className: "tb-demo-btn error-trigger", onClick: () => toast.error("Connection timeout. Please review invoice details.", "Transaction Failed", "Retry", () => alert("Retrying invoice settlement...")), children: "Trigger Error Toast (Persistent)" }), _jsx("button", { className: "tb-demo-btn info-trigger", onClick: () => toast.info("Order #DEL-7890 is being prepared for delivery.", "Order Dispatching", "Track Dispatch", () => alert("Redirecting to Shipment Tracking map...")), children: "Trigger Info Toast" }), _jsx("button", { className: "tb-demo-btn warning-trigger", onClick: () => toast.warning("Vehicle Truck TX-492 is currently operating below 15% capacity.", "Low Fuel Level Alert", "Assign Station", () => alert("Assigning nearest refueling point...")), children: "Trigger Warning Toast" })] })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Form Modals & Inputs" }), _jsx(FormModals, {})] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Action Menu & Modals" }), _jsx(ActionButtons, {})] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Confirm Modal" }), _jsx("div", { className: "component-row", children: _jsx(Button, { title: "Open Destructive Confirm Modal", variant: "danger", onClick: () => setShowConfirm(true) }) }), _jsx(ConfirmModal, { isOpen: showConfirm, title: "Delete Waybill Record", message: "Are you sure you want to permanently delete waybill SP-77291? This will revoke dispatch codes immediately.", variant: "danger", confirmLabel: "Delete Record", requiredPasscode: "DELETE", passcodeValue: passcode, onPasscodeChange: setPasscode, onCancel: () => {
                                            setShowConfirm(false);
                                            setPasscode("");
                                        }, onConfirm: () => {
                                            alert("Record Deleted!");
                                            setShowConfirm(false);
                                            setPasscode("");
                                        } })] })] }), _jsx(GlobalFooter, {})] })] }));
}
function App() {
    return (_jsxs(ToastProvider, { children: [_jsx(AppContent, {}), _jsx(ToastBar, {})] }));
}
export default App;
//# sourceMappingURL=App.js.map