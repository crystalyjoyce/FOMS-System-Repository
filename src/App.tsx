import React from 'react';
import { GlobalHeader, GlobalFooter, Button, Dropdown, DataTable, Sidebar, StatusCard, StatusBadge, DashboardLayout } from './components';

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
    <div className="app-layout">
      <Sidebar />

      <div className="main-area">
        <GlobalHeader />

        <main>
          <section className="component-section">
            <h2 className="section-title">Dashboard Layout</h2>
            <DashboardLayout />
          </section>

          <section className="component-section">
            <h2 className="section-title">Status Cards (KPIs)</h2>
            <div className="g ga" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <StatusCard
                label="Active Shipments"
                value="1,248"
                icon="ti ti-truck"
                variant="teal"
                trend={{ value: '12%', type: 'up' }}
                periodText="since last week"
                sparklineData={[10, 15, 8, 12, 20, 16, 25]}
              />
              <StatusCard
                label="Delivered Today"
                value="354"
                icon="ti ti-circle-check"
                variant="success"
                trend={{ value: '8%', type: 'up' }}
                periodText="since yesterday"
                sparklineData={[12, 14, 18, 11, 23, 29, 32]}
              />
              <StatusCard
                label="At Risk SLA"
                value="14"
                icon="ti ti-alert-triangle"
                variant="warning"
                trend={{ value: '3%', type: 'up' }}
                periodText="critical next 2h"
                sparklineData={[4, 6, 8, 3, 9, 11, 14]}
              />
              <StatusCard
                label="Failed Deliveries"
                value="2"
                icon="ti ti-circle-x"
                variant="danger"
                trend={{ value: '50%', type: 'down' }}
                periodText="resolved within 24h"
                sparklineData={[5, 4, 3, 2, 2, 1, 2]}
              />
            </div>
          </section>

          <section className="component-section">
            <h2 className="section-title">Status Badges</h2>
            <div className="component-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <StatusBadge status="Active" />
              <StatusBadge status="Deactivated" />
              <StatusBadge status="Pending" />
              <StatusBadge status="Done" />
              <StatusBadge status="Delivered" />
              <StatusBadge status="In Transit" />
              <StatusBadge status="Failed" />
              <StatusBadge status="Success" />
              <StatusBadge status="Submitted" />
              <StatusBadge status="Picked-Up" />
              <StatusBadge status="Completed" />
              <StatusBadge status="Processing" />
              <StatusBadge status="Preparing" />
              <StatusBadge status="Ready for Pickup" />
              <StatusBadge status="Returning" />
              <StatusBadge status="Not Submitted" />
              <StatusBadge status="Assigned" />
              <StatusBadge status="Out of Delivery" />
              <StatusBadge status="Returned" />
              <StatusBadge status="Cancelled" />
              <StatusBadge status="Partially Paid" />
              <StatusBadge status="Paid" />
              <StatusBadge status="Inflow" />
              <StatusBadge status="Outflow" />
              <StatusBadge status="Overdue" />
              <StatusBadge status="New Payment" />
              <StatusBadge status="30 - 60 Days" />
            </div>
          </section>

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
    </div>
  );
}

export default App;
