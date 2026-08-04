import React, { useState, useMemo, useCallback } from "react";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  Settings,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import ConfirmModal from "./ConfirmModal";
import Button from "./Buttons";
import type { NotificationItem } from "./notificationTypes";
import "./Notifications.css";

// ─── Types ────────────────────────────────────────────────────────────────────
// NotificationItem is now defined once in ./notificationTypes and shared with
// GlobalHeader's preview dropdown so both surfaces describe the same record.
export type { NotificationItem };

export interface NotificationsProps {
  /** Override initial notifications data */
  initialData?: NotificationItem[];
  /** Called when "View Order Details" is clicked in the detail panel */
  onViewOrder?: (notification: NotificationItem) => void;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "Delivery Failed",
    description: "Delivery attempt failed in Makati for Juan Dela Cruz. Rider could not locate address.",
    timestamp: "10:32 AM",
    date: "Today",
    isToday: true,
    read: false,
    type: "alert",
    category: "logistics",
    waybillNo: "SP-77291",
    statusBadge: "Failed",
    source: "DMS Auto-Alert",
  },
  {
    id: "2",
    title: "SLA Breach Warning",
    description: "Route #8 is running 35 mins behind schedule. SLA impact imminent for 3 orders.",
    timestamp: "9:15 AM",
    date: "Today",
    isToday: true,
    read: false,
    type: "alert",
    category: "logistics",
    waybillNo: "SP-80124",
    statusBadge: "At Risk",
    source: "TARS Monitor",
  },
  {
    id: "3",
    title: "Order Delivered",
    description: "Package successfully delivered to Sofia Martinez in Quezon City.",
    timestamp: "8:45 AM",
    date: "Today",
    isToday: true,
    read: false,
    type: "success",
    category: "logistics",
    waybillNo: "SP-77288",
    statusBadge: "Delivered",
    source: "DMS",
  },
  {
    id: "4",
    title: "New Route Manifest",
    description: "Waybill SP-77291 assigned to driver Juan dela Cruz for afternoon dispatch.",
    timestamp: "7:00 AM",
    date: "Today",
    isToday: true,
    read: true,
    type: "info",
    category: "logistics",
    waybillNo: "SP-77291",
    statusBadge: "Assigned",
    source: "DMS",
  },
  {
    id: "5",
    title: "Invoice Settlement Failed",
    description: "Vendor payout to FastTrack Cargo rejected by bank. Amount: PHP 45,000.",
    timestamp: "Yesterday, 4:30 PM",
    date: "Yesterday",
    isToday: false,
    read: false,
    type: "alert",
    category: "finance",
    waybillNo: "INV-2024-088",
    statusBadge: "Failed",
    source: "FinSys",
  },
  {
    id: "6",
    title: "Fleet Report Available",
    description: "Weekly dispatch efficiency audit is ready for download. Coverage: March 1-7.",
    timestamp: "Yesterday, 2:00 PM",
    date: "Yesterday",
    isToday: false,
    read: true,
    type: "success",
    category: "logistics",
    source: "TARS Analytics",
  },
  {
    id: "7",
    title: "Vehicle Maintenance Complete",
    description: "Truck Plate TX-492 cleared for long-haul duty after scheduled servicing.",
    timestamp: "Yesterday, 11:00 AM",
    date: "Yesterday",
    isToday: false,
    read: true,
    type: "info",
    category: "driver",
    source: "Fleet Ops",
  },
  {
    id: "8",
    title: "System Security Update",
    description: "Workspace session policies updated. All active sessions refreshed automatically.",
    timestamp: "March 3, 2025",
    date: "March 3, 2025",
    isToday: false,
    read: true,
    type: "system",
    category: "system",
    source: "IT Security",
  },
  {
    id: "9",
    title: "Password Policy Updated",
    description: "All users must update passwords within 14 days per new compliance directive.",
    timestamp: "March 2, 2025",
    date: "March 2, 2025",
    isToday: false,
    read: true,
    type: "system",
    category: "system",
    source: "IT Security",
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export const Notifications: React.FC<NotificationsProps> = ({
  initialData,
  onViewOrder,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    initialData ?? SAMPLE_NOTIFICATIONS
  );
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string>("");
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ── Derived data ────────────────────────────────────────────────────────────
  const selected = useMemo(
    () => notifications.find((n) => n.id === selectedId) ?? null,
    [notifications, selectedId]
  );

  const filtered = useMemo(() => {
    if (activeTab === "all") return notifications;
    if (activeTab === "read") return notifications.filter((n) => n.read);
    return notifications.filter((n) => n.type === activeTab && !n.read);
  }, [notifications, activeTab]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const tabs = useMemo(
    () => [
      { key: "all", label: "All" },
      { key: "alert", label: "Alerts", count: notifications.filter((n) => n.type === "alert" && !n.read).length },
      { key: "success", label: "Success", count: notifications.filter((n) => n.type === "success" && !n.read).length },
      { key: "system", label: "System", count: notifications.filter((n) => n.type === "system" && !n.read).length },
      { key: "read", label: "Read" },
    ],
    [notifications]
  );

  // Group by date
  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, NotificationItem[]>>((acc, n) => {
      if (!acc[n.date]) acc[n.date] = [];
      acc[n.date].push(n);
      return acc;
    }, {});
  }, [filtered]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) setSelectedId("");
  }, [selectedId]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setSelectedId("");
    setCheckedIds([]);
    setShowClearConfirm(false);
  }, []);

  const handleToggleCheck = useCallback((e: React.MouseEvent | React.ChangeEvent, id: string) => {
    e.stopPropagation();
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  }, []);

  const handleMarkCheckedAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => (checkedIds.includes(n.id) ? { ...n, read: true } : n))
    );
    setCheckedIds([]);
  }, [checkedIds]);

  const handleDeleteChecked = useCallback(() => {
    setNotifications((prev) => prev.filter((n) => !checkedIds.includes(n.id)));
    if (checkedIds.includes(selectedId)) setSelectedId("");
    setCheckedIds([]);
  }, [checkedIds, selectedId]);

  // ── Type icon helper ────────────────────────────────────────────────────────
  const TypeIcon: React.FC<{ type: string; size?: number }> = ({ type, size = 18 }) => {
    switch (type) {
      case "alert": return <AlertTriangle size={size} />;
      case "success": return <CheckCircle2 size={size} />;
      case "system": return <Settings size={size} />;
      default: return <Info size={size} />;
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Page Header */}
      <div className="notif-actions-row">
        <Button
          title="Mark all as read"
          icon="ti-checks"
          variant="secondary"
          size="sm"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        />
        <Button
          title="Clear all"
          icon="ti-trash"
          variant="secondary"
          size="sm"
          onClick={() => setShowClearConfirm(true)}
          disabled={notifications.length === 0}
        />
        <span className="notif-unread-count">{unreadCount} unread notifications</span>
      </div>

      <div className="notif-layout">
        {/* ── Left: List Panel ─────────────────────────────────────────── */}
        <div className="notif-list-panel">
          {/* Tabs */}
          <div className="notif-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`notif-tab ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="notif-tab-count">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="notif-list">
            {filtered.length === 0 ? (
              <div className="notif-empty-state">
                <div className="notif-empty-icon">
                  <Bell size={28} />
                </div>
                <div className="notif-empty-title">No Notifications</div>
                <div className="notif-empty-desc">
                  {activeTab === "all"
                    ? "You don't have any notifications yet."
                    : `No ${activeTab} notifications to show.`}
                </div>
              </div>
            ) : (
              Object.entries(grouped).map(([date, items]) => (
                <div key={date}>
                  <div className="notif-date-header">{date.toUpperCase()}</div>
                  {items.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${selectedId === n.id ? "selected" : ""} ${!n.read ? "unread" : ""} ${checkedIds.includes(n.id) ? "checked" : ""}`}
                      onClick={() => setSelectedId(n.id)}
                    >
                      <input
                        type="checkbox"
                        className="notif-checkbox"
                        checked={checkedIds.includes(n.id)}
                        onChange={(e) => handleToggleCheck(e, n.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="notif-item-content">
                        <div className="notif-item-header">
                          <strong>{n.title}</strong>
                          {n.waybillNo && <span className="notif-waybill">{n.waybillNo}</span>}
                          {n.statusBadge && <StatusBadge status={n.statusBadge} size="sm" />}
                        </div>
                        <p className="notif-item-desc">{n.description}</p>
                        <span className="notif-item-meta">{n.timestamp} · {n.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right: Detail Panel ──────────────────────────────────────── */}
        {selected && (
          <div className="notif-detail-panel">
            <div className="notif-detail-header">
              <h3>Notification Detail</h3>
              <Button
                title="Close detail"
                icon="ti-x"
                iconOnly
                variant="ghost"
                size="sm"
                onClick={() => setSelectedId("")}
              />
            </div>

            {/* Alert type bar */}
            <div className="notif-detail-alert">
              <div className={`notif-alert-icon ${selected.type === "alert" ? "" : selected.type}`}>
                <TypeIcon type={selected.type} />
              </div>
              <div>
                <span className={`notif-alert-type ${selected.type}`}>
                  <TypeIcon type={selected.type} size={14} />
                  {selected.title.toUpperCase()}
                </span>
                <span className="notif-detail-meta">
                  {selected.timestamp} · {selected.source}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="notif-detail-body">
              <strong>{selected.title}</strong>
              <p>{selected.description}</p>
            </div>

            {/* Summary fields */}
            <div className="notif-summary-fields">
              <div className="notif-summary-field">
                <span className="notif-summary-label">Waybill No.</span>
                <span className="notif-summary-value waybill">{selected.waybillNo || "—"}</span>
              </div>
              <div className="notif-summary-field">
                <span className="notif-summary-label">Alert Type</span>
                <span className="notif-summary-value">{selected.type}</span>
              </div>
              <div className="notif-summary-field">
                <span className="notif-summary-label">Source</span>
                <span className="notif-summary-value">{selected.source}</span>
              </div>
              <div className="notif-summary-field">
                <span className="notif-summary-label">Status</span>
                <span className="notif-summary-value">
                  {selected.statusBadge ? <StatusBadge status={selected.statusBadge} size="sm" /> : "—"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="notif-detail-actions">
              <Button
                title="View Order"
                icon="ti-eye"
                variant="primary"
                size="sm"
                onClick={() => onViewOrder?.(selected)}
              />
              <Button
                title="Mark Read"
                icon="ti-check"
                variant="secondary"
                size="sm"
                onClick={() => markNotificationRead(selected.id)}
              />
              <Button
                title="Delete"
                icon="ti-trash"
                variant="danger"
                size="sm"
                onClick={() => deleteNotification(selected.id)}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Floating Selection Bar ──────────────────────────────────── */}
      <div className={`floating-selection-bar ${checkedIds.length > 0 ? "visible" : ""}`}>
        <span className="floating-selection-count">{checkedIds.length} selected</span>
        <Button title="Mark read" icon="ti-check" variant="primary" size="sm" onClick={handleMarkCheckedAsRead} />
        <Button title="Delete" icon="ti-trash" variant="danger" size="sm" onClick={handleDeleteChecked} />
      </div>

      {/* ── Clear All Confirmation ──────────────────────────────────── */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear all notifications?"
        message="This will permanently delete all notifications. This action is irreversible."
        variant="danger"
        confirmLabel="Clear Notifications"
        cancelLabel="Cancel"
        icon="ti-trash"
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={clearAll}
      />
    </>
  );
};

export default Notifications;
