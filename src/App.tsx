import React from "react";
import {
  GlobalHeader,
  GlobalFooter,
  Button,
  Dropdown,
  DataTable,
  Sidebar,
  StatusCard,
  StatusBadge,
  DashboardLayout,
  FormModals,
  SearchBar,
  ConfirmModal,
  ToastProvider,
  useToast,
} from "./components";
import ToastBar from "./components/ToastBar";
import ActionButtons from "./components/ActionButtons";

interface Person {
  id: number;
  name: string;
  role: string;
  status: string;
}

const tableData: Person[] = [
  { id: 1, name: "Avery Lee", role: "Product Manager", status: "Active" },
  { id: 2, name: "Jordan Kim", role: "Engineer", status: "Pending" },
  { id: 3, name: "Taylor Reed", role: "Designer", status: "Active" },
];

const tableColumns = [
  { key: "name", label: "Name", sortable: true },
  { key: "role", label: "Role", sortable: true },
  { key: "status", label: "Status", sortable: true },
];

const dropdownItems: Array<{
  key: string;
  label: string;
  variant?: "default" | "danger";
}> = [
  { key: "edit", label: "Edit", variant: "default" },
  { key: "duplicate", label: "Duplicate", variant: "default" },
  { key: "delete", label: "Delete", variant: "danger" },
];

const rowActions: Array<{
  label: string;
  icon: string;
  onClick: (row: Person) => void;
  variant?: "default" | "danger";
}> = [
  {
    label: "Edit",
    icon: "ti-pencil",
    onClick: (row: Person) => alert(`Edit ${row.name}`),
    variant: "default",
  },
  {
    label: "Duplicate",
    icon: "ti-copy",
    onClick: (row: Person) => alert(`Duplicate ${row.name}`),
    variant: "default",
  },
  {
    label: "Delete",
    icon: "ti-trash",
    variant: "danger",
    onClick: (row: Person) => alert(`Delete ${row.name}`),
  },
];

function AppContent() {
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [passcode, setPasscode] = React.useState("");

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
            <div
              className="g ga"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
              }}
            >
              <StatusCard
                label="Active Shipments"
                value="1,248"
                icon="ti ti-truck"
                variant="teal"
                trend={{ value: "12%", type: "up" }}
                periodText="vs. last week"
                sparklineData={[10, 15, 8, 12, 20, 16, 25]}
              />
              <StatusCard
                label="Delivered Today"
                value="354"
                icon="ti ti-circle-check"
                variant="success"
                trend={{ value: "8%", type: "up" }}
                periodText="vs. yesterday"
                sparklineData={[12, 14, 18, 11, 23, 29, 32]}
              />
              <StatusCard
                label="At Risk SLA"
                value="14 / 10 limit"
                icon="ti ti-alert-triangle"
                variant="warning"
                trend={{ value: "3%", type: "up" }}
                periodText="critical next 2h"
                polarity="lower-is-better"
                sparklineData={[4, 6, 8, 3, 9, 11, 14]}
              />
              <StatusCard
                label="Failed Deliveries"
                value="2"
                icon="ti ti-circle-x"
                variant="danger"
                trend={{ value: "50%", type: "down" }}
                periodText="vs. yesterday"
                polarity="lower-is-better"
                sparklineData={[5, 4, 3, 2, 2, 1, 2]}
              />
            </div>
          </section>

          <section className="component-section">
            <h2 className="section-title">Status Badges</h2>
            <div
              className="component-row"
              style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
            >
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
            <div
              className="component-row"
              style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
            >
              <Button title="Save Changes" variant="primary" />
              <Button title="Add / Create" variant="primary" />
              <Button title="Edit Record" variant="secondary" />
              <Button title="Approve Request" variant="success" />
              <Button title="Activate Account" variant="success" />
              <Button title="Reject Transaction" variant="danger" />
              <Button title="Deactivate License" variant="warning" />
              <Button title="Delete Record" variant="danger" />
              <Button title="Cancel Action" variant="secondary" />
            </div>
          </section>

          <section className="component-section">
            <h2 className="section-title">Dropdown</h2>
            <Dropdown items={dropdownItems} />
          </section>

          <section className="component-section">
            <h2 className="section-title">Search Bar</h2>
            <SearchBar
              placeholder="Search waybills, dispatch routes..."
              onSearch={(val) => console.log("Searching:", val)}
              suggestions={[
                { id: "1", label: "SP-77291", category: "Waybill", type: "result" },
                { id: "2", label: "Route #8 schedule", category: "Route", type: "trending" },
                { id: "3", label: "Hermione Benitez profile", category: "User", type: "recent" },
              ]}
            />
          </section>

          <section className="component-section">
            <h2 className="section-title">Data Table</h2>
            <DataTable
              rowKey="id"
              data={tableData}
              columns={tableColumns}
              actions={rowActions}
              selectable
              exportable
              columnToggle
              densityToggle
              bulkActions={[
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
              ]}
              filters={[
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
              ]}
              createButtons={[
                { label: "New User", icon: "ti-user", onClick: () => undefined },
              ]}
              searchPlaceholder="Search users..."
            />
          </section>

          <section className="component-section">
            <h2 className="section-title">Toastbar</h2>
            <div className="tb-btn-row">
              <button
                className="tb-demo-btn success-trigger"
                onClick={() =>
                  toast.success(
                    "PHP 5,000 transferred to Juan Dela Cruz.",
                    "Payment Sent Successfully"
                  )
                }
              >
                Trigger Success Toast
              </button>
              <button
                className="tb-demo-btn error-trigger"
                onClick={() =>
                  toast.error(
                    "Connection timeout. Please review invoice details.",
                    "Transaction Failed",
                    "Retry",
                    () => alert("Retrying invoice settlement...")
                  )
                }
              >
                Trigger Error Toast (Persistent)
              </button>
              <button
                className="tb-demo-btn info-trigger"
                onClick={() =>
                  toast.info(
                    "Order #DEL-7890 is being prepared for delivery.",
                    "Order Dispatching",
                    "Track Dispatch",
                    () => alert("Redirecting to Shipment Tracking map...")
                  )
                }
              >
                Trigger Info Toast
              </button>
              <button
                className="tb-demo-btn warning-trigger"
                onClick={() =>
                  toast.warning(
                    "Vehicle Truck TX-492 is currently operating below 15% capacity.",
                    "Low Fuel Level Alert",
                    "Assign Station",
                    () => alert("Assigning nearest refueling point...")
                  )
                }
              >
                Trigger Warning Toast
              </button>
            </div>
          </section>

          <section className="component-section">
            <h2 className="section-title">Form Modals & Inputs</h2>
            <FormModals />
          </section>

          <section className="component-section">
            <h2 className="section-title">Action Menu & Modals</h2>
            <ActionButtons />
          </section>

          <section className="component-section">
            <h2 className="section-title">Confirm Modal</h2>
            <div className="component-row">
              <Button
                title="Open Destructive Confirm Modal"
                variant="danger"
                onClick={() => setShowConfirm(true)}
              />
            </div>
            <ConfirmModal
              isOpen={showConfirm}
              title="Delete Waybill Record"
              message="Are you sure you want to permanently delete waybill SP-77291? This will revoke dispatch codes immediately."
              variant="danger"
              confirmLabel="Delete Record"
              requiredPasscode="DELETE"
              passcodeValue={passcode}
              onPasscodeChange={setPasscode}
              onCancel={() => {
                setShowConfirm(false);
                setPasscode("");
              }}
              onConfirm={() => {
                alert("Record Deleted!");
                setShowConfirm(false);
                setPasscode("");
              }}
            />
          </section>
        </main>

        <GlobalFooter />
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
      <ToastBar />
    </ToastProvider>
  );
}

export default App;
