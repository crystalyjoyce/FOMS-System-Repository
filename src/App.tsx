import React from 'react';
import { GlobalHeader, GlobalFooter, Button, Dropdown, DataTable } from './components';

interface Person {
  id: number;
  name: string;
  role: string;
  status: string;
}

const tableData: Person[] = [
  { id: 1, name: 'Avery Lee', role: 'Product Manager', status: 'Active' },
  { id: 2, name: 'Jordan Kim', role: 'Engineer', status: 'Pending' },
  { id: 3, name: 'Taylor Reed', role: 'Designer', status: 'Active' },
];

const tableColumns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

const dropdownItems: Array<{
  key: string;
  label: string;
  variant?: "default" | "danger";
}> = [
  { key: 'edit', label: 'Edit', variant: 'default' },
  { key: 'duplicate', label: 'Duplicate', variant: 'default' },
  { key: 'delete', label: 'Delete', variant: 'danger' },
];

const rowActions: Array<{
  label: string;
  icon: string;
  onClick: (row: Person) => void;
  variant?: "default" | "danger";
}> = [
  {
    label: 'Edit',
    icon: 'ti-pencil',
    onClick: (row: Person) => alert(`Edit ${row.name}`),
    variant: 'default',
  },
  {
    label: 'Duplicate',
    icon: 'ti-copy',
    onClick: (row: Person) => alert(`Duplicate ${row.name}`),
    variant: 'default',
  },
  {
    label: 'Delete',
    icon: 'ti-trash',
    variant: 'danger',
    onClick: (row: Person) => alert(`Delete ${row.name}`),
  },
];

function App() {
  return (
    <div className="app-shell">
      <GlobalHeader />

      <main>
        <section className="component-section">
          <h2 className="section-title">Buttons</h2>
          <div className="component-row">
            <Button title="Save Changes" />
            <Button title="Cancel" variant="secondary" />
            <Button title="Delete" variant="danger" />
          </div>
        </section>

        <section className="component-section">
          <h2 className="section-title">Dropdown</h2>
          <Dropdown items={dropdownItems} />
        </section>

        <section className="component-section">
          <h2 className="section-title">Data Table</h2>
          <DataTable
            rowKey="id"
            data={tableData}
            columns={tableColumns}
            actions={rowActions}
            createButtons={[
              { label: 'New User', icon: 'ti-user', onClick: () => undefined },
            ]}
          />
        </section>
      </main>

      <GlobalFooter />
    </div>
  );
}

export default App;
