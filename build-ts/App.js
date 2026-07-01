import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GlobalHeader, GlobalFooter, Button, Dropdown, DataTable, Sidebar, StatusCard } from './components';
const tableData = [
    { id: 1, name: 'Avery Lee', role: 'Product Manager', status: 'Active' },
    { id: 2, name: 'Jordan Kim', role: 'Engineer', status: 'Pending' },
    { id: 3, name: 'Taylor Reed', role: 'Designer', status: 'Active' },
];
const tableColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
];
const dropdownItems = [
    { key: 'edit', label: 'Edit', variant: 'default' },
    { key: 'duplicate', label: 'Duplicate', variant: 'default' },
    { key: 'delete', label: 'Delete', variant: 'danger' },
];
const rowActions = [
    {
        label: 'Edit',
        icon: 'ti-pencil',
        onClick: (row) => alert(`Edit ${row.name}`),
        variant: 'default',
    },
    {
        label: 'Duplicate',
        icon: 'ti-copy',
        onClick: (row) => alert(`Duplicate ${row.name}`),
        variant: 'default',
    },
    {
        label: 'Delete',
        icon: 'ti-trash',
        variant: 'danger',
        onClick: (row) => alert(`Delete ${row.name}`),
    },
];
function App() {
    return (_jsxs("div", { className: "app-layout", children: [_jsx(Sidebar, {}), _jsxs("div", { className: "main-area", children: [_jsx(GlobalHeader, {}), _jsxs("main", { children: [_jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Status Cards (KPIs)" }), _jsxs("div", { className: "g ga", style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }, children: [_jsx(StatusCard, { label: "Active Shipments", value: "1,248", icon: "ti ti-truck", variant: "teal", trend: { value: '12%', type: 'up' }, periodText: "since last week", sparklineData: [10, 15, 8, 12, 20, 16, 25] }), _jsx(StatusCard, { label: "Delivered Today", value: "354", icon: "ti ti-circle-check", variant: "success", trend: { value: '8%', type: 'up' }, periodText: "since yesterday", sparklineData: [12, 14, 18, 11, 23, 29, 32] }), _jsx(StatusCard, { label: "At Risk SLA", value: "14", icon: "ti ti-alert-triangle", variant: "warning", trend: { value: '3%', type: 'up' }, periodText: "critical next 2h", sparklineData: [4, 6, 8, 3, 9, 11, 14] }), _jsx(StatusCard, { label: "Failed Deliveries", value: "2", icon: "ti ti-circle-x", variant: "danger", trend: { value: '50%', type: 'down' }, periodText: "resolved within 24h", sparklineData: [5, 4, 3, 2, 2, 1, 2] })] })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Buttons" }), _jsxs("div", { className: "component-row", children: [_jsx(Button, { title: "Save Changes" }), _jsx(Button, { title: "Cancel", variant: "secondary" }), _jsx(Button, { title: "Delete", variant: "danger" })] })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Dropdown" }), _jsx(Dropdown, { items: dropdownItems })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Data Table" }), _jsx(DataTable, { rowKey: "id", data: tableData, columns: tableColumns, actions: rowActions, createButtons: [
                                            { label: 'New User', icon: 'ti-user', onClick: () => undefined },
                                        ] })] })] }), _jsx(GlobalFooter, {})] })] }));
}
export default App;
//# sourceMappingURL=App.js.map