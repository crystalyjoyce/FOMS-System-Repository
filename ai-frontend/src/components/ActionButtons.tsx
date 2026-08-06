import React, { useState } from "react";
import Button from "./Buttons";
import Dropdown, { DropdownItem } from "./Dropdown";
import ConfirmModal from "./ConfirmModal";
import { StatusBadge } from "./StatusBadge";
import { TextField, SelectField } from "./FormModals";
import { Trash2, ShieldAlert } from "lucide-react";
import { useToast } from "./ToastContext";
import "./ActionButtons.css";

type ModalType = "view" | "edit" | "delete" | "delete-finance" | "create" | null;

const ActionButtons: React.FC = () => {
  const { toast } = useToast();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [confirmInputText, setConfirmInputText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false); // Async confirmation loading state

  const handleOpenModal = (type: ModalType) => {
    setActiveModal(type);
    setConfirmInputText("");
  };

  const handleCloseModal = () => {
    if (isDeleting) return;
    setActiveModal(null);
  };

  // Low-Friction Tier: Archive triggers a soft undo toast instead of an annoying modal
  const handleArchive = () => {
    toast.success(
      "Record TXN-8472910 archived successfully.",
      "Success",
      "Undo",
      () => toast.success("Archive action undone.")
    );
  };

  const menuItems: DropdownItem[] = [
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

  const runDelete = (message: string) => {
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      handleCloseModal();
      toast.error(message, "Deleted");
    }, 1200);
  };

  return (
    <>
      <div className="ab-trigger-row">
        <Dropdown items={menuItems} align="left" placement="bottom" />
        <Button
          title="+ New Transaction"
          variant="primary"
          onClick={() => handleOpenModal("create")}
        />
      </div>

      {/* ── VIEW RECORD (info modal) ── */}
      <ConfirmModal
        isOpen={activeModal === "view"}
        title="TXN-8472910"
        message=""
        variant="primary"
        confirmLabel="Edit Details"
        cancelLabel="Close"
        icon="ti-file-text"
        onCancel={handleCloseModal}
        onConfirm={() => handleOpenModal("edit")}
      >
        <div className="ab-view-field">
          <span className="ab-view-label">Entity Name</span>
          <span className="ab-view-value">Acme Corporation</span>
        </div>
        <div className="ab-form-row">
          <div className="ab-view-field">
            <span className="ab-view-label">Amount</span>
            <span className="ab-view-value">₱14,500.00</span>
          </div>
          <div className="ab-view-field">
            <span className="ab-view-label">Status</span>
            <div style={{ marginTop: "2px" }}>
              <StatusBadge status="Active" />
            </div>
          </div>
        </div>
      </ConfirmModal>

      {/* ── EDIT RECORD ── */}
      <ConfirmModal
        isOpen={activeModal === "edit"}
        title="TXN-8472910"
        message=""
        variant="primary"
        confirmLabel="Save Changes"
        cancelLabel="Back"
        icon="ti-pencil"
        onCancel={() => handleOpenModal("view")}
        onConfirm={handleCloseModal}
      >
        <TextField
          label="Entity Name"
          value="Acme Corporation"
          onChange={() => {}}
        />
        <div className="ab-form-row">
          <TextField label="Amount" value="14500.00" onChange={() => {}} />
          <SelectField
            label="Status"
            value="Active"
            onChange={() => {}}
            options={[
              { value: "Active", label: "Active" },
              { value: "Pending", label: "Pending" },
              { value: "Failed", label: "Failed" },
            ]}
          />
        </div>
      </ConfirmModal>

      {/* ── CREATE RECORD ── */}
      <ConfirmModal
        isOpen={activeModal === "create"}
        title="Create Record"
        message=""
        variant="primary"
        confirmLabel="Create"
        cancelLabel="Cancel"
        icon="ti-plus"
        onCancel={handleCloseModal}
        onConfirm={handleCloseModal}
      >
        <TextField label="Entity Name" value="" onChange={() => {}} placeholder="Enter entity name..." />
        <div className="ab-form-row">
          <TextField label="Amount" value="0.00" onChange={() => {}} />
          <SelectField
            label="Currency"
            value="PHP"
            onChange={() => {}}
            options={[
              { value: "PHP", label: "PHP" },
              { value: "USD", label: "USD" },
              { value: "EUR", label: "EUR" },
            ]}
          />
        </div>
      </ConfirmModal>

      {/* ── STANDARD DELETE (medium friction) ── */}
      <ConfirmModal
        isOpen={activeModal === "delete"}
        title="Delete Record TXN-8472910?"
        message="This will permanently remove the shipment record from the database. This action cannot be undone."
        variant="danger"
        confirmLabel="Delete Record"
        cancelLabel="Cancel"
        icon="ti-trash"
        loading={isDeleting}
        onCancel={handleCloseModal}
        onConfirm={() => runDelete("Record TXN-8472910 deleted successfully.")}
      />

      {/* ── HIGH-FRICTION DELETE (financial record — type-to-confirm) ── */}
      <ConfirmModal
        isOpen={activeModal === "delete-finance"}
        title="Delete Cleared Payment TXN-8472910?"
        message="CRITICAL ALERT: Deleting a cleared financial transaction will affect ledger reconciliation. You must manually reverse the transaction."
        variant="danger"
        confirmLabel="Delete Cleared Record"
        cancelLabel="Cancel"
        icon="ti-shield"
        requiredPasscode="TXN-8472910"
        passcodeValue={confirmInputText}
        onPasscodeChange={setConfirmInputText}
        loading={isDeleting}
        onCancel={handleCloseModal}
        onConfirm={() => runDelete("Cleared payment TXN-8472910 deleted.")}
      />
    </>
  );
};

export default ActionButtons;
