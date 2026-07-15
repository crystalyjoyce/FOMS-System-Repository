import React, { useState, useMemo, useCallback } from "react";
import { Bell, AlertTriangle, CheckCircle2, Info, Settings } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import { Button } from "../components/Buttons";
import "./NotificationsPage.css";

const SAMPLE_NOTIFICATIONS = [
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
    statusBadge: "Active",
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
  }
];

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>(SAMPLE_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const selected = useMemo(() => notifications.find((n) => n.id === selectedId) ?? null, [notifications, selectedId]);
  const filtered = useMemo(() => {
    if (activeTab === "all") return notifications;
    if (activeTab === "read") return notifications.filter((n) => n.read);
    return notifications.filter((n) => n.type === activeTab && !n.read);
  }, [notifications, activeTab]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const tabs = useMemo(() => [
    { key: "all", label: "All" },
    { key: "alert", label: "Alerts", count: notifications.filter((n) => n.type === "alert" && !n.read).length },
    { key: "success", label: "Success", count: notifications.filter((n) => n.type === "success" && !n.read).length },
    { key: "system", label: "System", count: notifications.filter((n) => n.type === "system" && !n.read).length },
    { key: "read", label: "Read" },
  ], [notifications]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc: any, n: any) => {
      const dateKey = n.date.toUpperCase();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(n);
      return acc;
    }, {});
  }, [filtered]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setSelectedId("");
    setCheckedIds([]);
    setShowClearConfirm(false);
  }, []);

  const handleToggleCheck = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCheckedIds((prev) => prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]);
  }, []);

  const TypeIcon = ({ type, size = 18 }: any) => {
    switch (type) {
      case "alert": return <AlertTriangle size={size} />;
      case "success": return <CheckCircle2 size={size} />;
      case "system": return <Settings size={size} />;
      default: return <Info size={size} />;
    }
  };

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>Notifications</h2>
      </div>

      <div className="notif-actions-row">
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button title="Mark all as read" icon="ti-check" variant="secondary" onClick={markAllAsRead} disabled={unreadCount === 0} />
          <Button title="Clear all" icon="ti-trash" variant="secondary" onClick={() => setShowClearConfirm(true)} disabled={notifications.length === 0} />
        </div>
        <span className="notif-unread-count">{unreadCount} unread notifications</span>
      </div>

      <div className="notif-layout">
        <div className="notif-list-panel">
          <div className="notif-tabs">
            {tabs.map((tab) => (
              <button key={tab.key} className={`notif-tab ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`notif-tab-count ${tab.key}`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          <div className="notif-list">
            {filtered.length === 0 ? (
              <div className="notif-empty-state">
                <Bell size={28} color="#94A3B8" />
                <div style={{ marginTop: '12px', fontWeight: 600, color: '#64748B' }}>No Notifications</div>
              </div>
            ) : (
              Object.entries(grouped).map(([date, items]: any) => (
                <div key={date}>
                  <div className="notif-date-header">{date}</div>
                  {items.map((n: any) => (
                    <div key={n.id} className={`notif-item ${selectedId === n.id ? "selected" : ""} ${!n.read ? "unread" : ""}`} onClick={() => setSelectedId(n.id)}>
                      <input type="checkbox" className="notif-checkbox" checked={checkedIds.includes(n.id)} onChange={(e) => handleToggleCheck(e as any, n.id)} onClick={(e) => e.stopPropagation()} />
                      <div className="notif-item-content">
                        <div className="notif-item-header">
                          <strong style={{ color: !n.read ? '#0F172A' : '#64748B' }}>{n.title}</strong>
                          {n.waybillNo && <span className="notif-waybill">{n.waybillNo}</span>}
                          {n.statusBadge && <StatusBadge status={n.statusBadge} />}
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
      </div>
      
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
    </div>
  );
};

export default NotificationsPage;
