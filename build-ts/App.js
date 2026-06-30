import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GlobalHeader, GlobalFooter, Button, Dropdown, DataTable } from './components';
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
    return (_jsxs("div", { className: "app-shell", children: [_jsx(GlobalHeader, {}), _jsxs("main", { children: [_jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Buttons" }), _jsxs("div", { className: "component-row", children: [_jsx(Button, { title: "Save Changes" }), _jsx(Button, { title: "Cancel", variant: "secondary" }), _jsx(Button, { title: "Delete", variant: "danger" })] })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Dropdown" }), _jsx(Dropdown, { items: dropdownItems })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Data Table" }), _jsx(DataTable, { rowKey: "id", data: tableData, columns: tableColumns, actions: rowActions, createButtons: [
                                    { label: 'New User', icon: 'ti-user', onClick: () => undefined },
                                ] })] })] }), _jsx(GlobalFooter, {})] }));
}
export default App;
//# sourceMappingURL=App.js.map