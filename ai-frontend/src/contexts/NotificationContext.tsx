/**
 * NotificationContext — TARS AI Frontend
 *
 * Generates real, role-based notifications from live backend data.
 * Shared between GlobalHeader (bell dropdown) and NotificationsPage (full page).
 */
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import type { NotificationItem } from '../components/notificationTypes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relTs(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

function dateLabel(iso: string): string {
  if (isToday(iso)) return 'Today';
  const d = new Date(iso);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── Role-based generator ─────────────────────────────────────────────────────

function generateNotifications(
  role: string,
  data: { invoices: any[]; waybills: any[]; payments: any[] }
): NotificationItem[] {
  const now = new Date().toISOString();
  const notes: NotificationItem[] = [];
  const { invoices, waybills, payments } = data;

  // ── Logistics Coordinator / Coordinator ─────────────────────────────────
  if (role === 'Coordinator' || role === 'Logistics Director') {
    const forChecking = waybills.filter(w => w.status === 'For Checking');
    forChecking.forEach(w => {
      const ts = w.uploadedDate || w.uploaded_date || now;
      notes.push({
        id: `coord-fc-${w.id}`,
        title: 'New Waybill Awaiting Check',
        description: `Waybill ${w.waybillNumber || w.waybill_number || w.id} has arrived and needs your review.`,
        timestamp: relTs(ts),
        date: dateLabel(ts),
        read: false,
        type: 'info',
        category: 'logistics',
        isToday: isToday(ts),
        source: 'TARS Monitor',
        actionLabel: 'Review Waybill',
        link: '/ai/duplicate-alerts?tab=scan'
      });
    });

    const missing = waybills.filter(w => w.status === 'Missing');
    missing.forEach(w => {
      const ts = w.deliveryDate || w.delivery_date || now;
      const daysDiff = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
      if (daysDiff >= 1) {
        notes.push({
          id: `coord-miss-${w.id}`,
          title: 'Missing POD Reminder',
          description: `Waybill ${w.waybillNumber || w.id} has been missing for ${daysDiff} day(s).`,
          timestamp: relTs(ts),
          date: dateLabel(ts),
          read: false,
          type: 'alert',
          category: 'logistics',
          isToday: false,
          source: 'TARS Monitor',
          link: '/ai/duplicate-alerts?tab=scan'
        });
      }
    });
  }

  // ── Accountant ───────────────────────────────────────────────────────────
  if (role === 'Accountant') {
    const validated = waybills.filter(w => w.status === 'Validated' || w.status === 'CTC Submitted');
    if (validated.length > 0) {
      notes.push({
        id: 'acct-validated',
        title: 'Waybills Ready for Invoicing',
        description: `${validated.length} validated waybill(s) are ready for invoice creation.`,
        timestamp: relTs(now),
        date: 'Today',
        read: false,
        type: 'success',
        category: 'finance',
        isToday: true,
        source: 'TARS Analytics',
        actionLabel: 'Create Invoice',
        link: '/ai/dashboard'
      });
    }
    const returned = invoices.filter(i => i.status === 'Draft' || i.status === 'Needs Revision');
    returned.forEach(inv => {
      const ts = inv.createdAt || inv.created_at || now;
      notes.push({
        id: `acct-ret-${inv.id}`,
        title: 'Invoice Needs Revision',
        description: `Invoice ${inv.invoiceNumber || inv.invoice_number || inv.id} was returned for revision.`,
        timestamp: relTs(ts),
        date: dateLabel(ts),
        read: false,
        type: 'alert',
        category: 'finance',
        isToday: isToday(ts),
        source: 'FinSys',
        link: '/ai/dashboard'
      });
    });
    const rejectedPayments = payments.filter(p => p.status === 'Rejected');
    rejectedPayments.forEach(pay => {
      const ts = pay.recordedAt || pay.recorded_at || now;
      notes.push({
        id: `acct-pay-rej-${pay.id}`,
        title: 'Payment Rejected',
        description: `Payment ${pay.id} was rejected by the Assistant Finance Manager.`,
        timestamp: relTs(ts),
        date: dateLabel(ts),
        read: false,
        type: 'alert',
        category: 'finance',
        isToday: isToday(ts),
        source: 'FinSys',
        link: '/ai/dashboard'
      });
    });
  }

  // ── Head Accountant ──────────────────────────────────────────────────────
  if (role === 'Head Accountant') {
    const pending = invoices.filter(i => i.status === 'Pending Approval');
    pending.forEach(inv => {
      const ts = inv.createdAt || inv.created_at || now;
      notes.push({
        id: `ha-pend-${inv.id}`,
        title: 'Invoice Submitted for Review',
        description: `Invoice ${inv.invoiceNumber || inv.id} is pending your approval.`,
        timestamp: relTs(ts),
        date: dateLabel(ts),
        read: false,
        type: 'info',
        category: 'finance',
        isToday: isToday(ts),
        source: 'FinSys',
        actionLabel: 'Review Invoice',
        link: '/ai/dashboard'
      });
    });
  }

  // ── Assistant Finance Manager ─────────────────────────────────────────────
  if (role === 'Assistant of Finance Manager' || role === 'Assistant Finance Manager') {
    const pendingPayments = payments.filter(p => p.status === 'Pending Validation');
    pendingPayments.forEach(pay => {
      const ts = pay.recordedAt || pay.recorded_at || now;
      notes.push({
        id: `afm-pay-${pay.id}`,
        title: 'Payment Pending Validation',
        description: `Payment of ₱${Number(pay.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })} via ${pay.paymentMethod || pay.payment_method} requires validation.`,
        timestamp: relTs(ts),
        date: dateLabel(ts),
        read: false,
        type: 'info',
        category: 'finance',
        isToday: isToday(ts),
        source: 'FinSys',
        actionLabel: 'Validate Payment',
        link: '/ai/dashboard'
      });
    });

    const sevenDays = Date.now() + 7 * 86400000;
    const nearDue = invoices.filter(i => {
      const due = new Date(i.dueDate || i.due_date).getTime();
      return ['Finalized'].includes(i.status) && due < sevenDays && due > Date.now();
    });
    nearDue.forEach(inv => {
      const ts = inv.createdAt || inv.created_at || now;
      const dueStr = new Date(inv.dueDate || inv.due_date).toLocaleDateString('en-PH');
      notes.push({
        id: `afm-due-${inv.id}`,
        title: 'Invoice Approaching Due Date',
        description: `Invoice ${inv.invoiceNumber || inv.id} is due on ${dueStr}. Follow up if payment is pending.`,
        timestamp: relTs(ts),
        date: dateLabel(ts),
        read: false,
        type: 'alert',
        category: 'finance',
        isToday: false,
        source: 'FinSys',
        link: '/ai/dashboard'
      });
    });
  }

  // ── Finance Manager / Financial Manager ──────────────────────────────────
  if (role === 'Finance Manager' || role === 'Financial Manager') {
    const validatedPayments = payments.filter(p => p.status === 'Validated');
    validatedPayments.forEach(pay => {
      const ts = pay.validatedAt || pay.validated_at || pay.recordedAt || pay.recorded_at || now;
      notes.push({
        id: `fm-pay-${pay.id}`,
        title: 'Payment Validated by Asst. FM',
        description: `Payment ${pay.id} (₱${Number(pay.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}) has been validated and is awaiting final approval.`,
        timestamp: relTs(ts),
        date: dateLabel(ts),
        read: false,
        type: 'success',
        category: 'finance',
        isToday: isToday(ts),
        source: 'FinSys',
        actionLabel: 'Approve Payment',
        link: '/ai/dashboard'
      });
    });

    const overdueInvoices = invoices.filter(i =>
      i.status === 'Overdue' || (i.balance > 0 && new Date(i.dueDate || i.due_date).getTime() < Date.now())
    );
    overdueInvoices.slice(0, 5).forEach(inv => {
      const ts = inv.dueDate || inv.due_date || now;
      notes.push({
        id: `fm-ov-${inv.id}`,
        title: 'Overdue Invoice Alert',
        description: `Invoice ${inv.invoiceNumber || inv.id} is overdue. Outstanding: ₱${Number(inv.balance || inv.amount || 0).toFixed(2)}.`,
        timestamp: relTs(ts),
        date: dateLabel(ts),
        read: false,
        type: 'alert',
        category: 'finance',
        isToday: false,
        source: 'TARS Analytics',
        link: '/ai/collection-priorities'
      });
    });
  }

  // ── System-level (all roles) ─────────────────────────────────────────────
  notes.push({
    id: 'sys-session',
    title: 'Session Active',
    description: `You are logged in as ${role}. All AI modules are active.`,
    timestamp: relTs(now),
    date: 'Today',
    read: true,
    type: 'system',
    category: 'system',
    isToday: true,
    source: 'TARS System',
    link: '/ai/dashboard'
  });

  return notes;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllAsRead: () => void;
  toggleReadStatus: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();

  // ── Persist read/cleared IDs ───────────────────────────────────────────
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('tars_read_notifications');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const [clearedIds, setClearedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('tars_cleared_notifications');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    localStorage.setItem('tars_read_notifications', JSON.stringify(Array.from(readIds)));
  }, [readIds]);

  useEffect(() => {
    localStorage.setItem('tars_cleared_notifications', JSON.stringify(Array.from(clearedIds)));
  }, [clearedIds]);

  // ── Live data from backend ─────────────────────────────────────────────
  const [invoices, setInvoices] = useState<any[]>([]);
  const [waybills, setWaybills] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    try {
      const [invRes, wbRes, payRes] = await Promise.allSettled([
        fetch('/api/ai-data/invoices', { headers }),
        fetch('/api/ai-data/waybills', { headers }),
        fetch('/api/ai-data/payments', { headers }),
      ]);
      if (invRes.status === 'fulfilled' && invRes.value.ok) {
        const d = await invRes.value.json();
        setInvoices(Array.isArray(d) ? d : (d.items || d.value || []));
      }
      if (wbRes.status === 'fulfilled' && wbRes.value.ok) {
        const d = await wbRes.value.json();
        setWaybills(Array.isArray(d) ? d : (d.items || d.value || []));
      }
      if (payRes.status === 'fulfilled' && payRes.value.ok) {
        const d = await payRes.value.json();
        setPayments(Array.isArray(d) ? d : (d.items || d.value || []));
      }
    } catch {
      // Keep existing data silently on network error
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    // Refresh every 2 minutes
    const interval = setInterval(fetchData, 120_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Fetch backend Notification records (payment validated/rejected events) ──
  const [backendNotifs, setBackendNotifs] = useState<NotificationItem[]>([]);

  const fetchBackendNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/finance');
      if (!res.ok) return;
      const data: any[] = await res.json();
      if (!Array.isArray(data)) return;
      const mapped: NotificationItem[] = data.map(n => {
        const ts = n.createdAt ?? n.timestamp ?? new Date().toISOString();
        return {
          id: n.id,
          title: n.title ?? 'Notification',
          description: n.description ?? '',
          timestamp: relTs(ts),
          date: dateLabel(ts),
          read: n.read ?? false,
          type: (n.type === 'success' ? 'success' : n.type === 'alert' ? 'alert' : 'info') as NotificationItem['type'],
          category: 'finance' as NotificationItem['category'],
          isToday: isToday(ts),
          source: n.source ?? 'Finance Department',
        };
      });
      setBackendNotifs(mapped);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchBackendNotifs();
    const interval = setInterval(fetchBackendNotifs, 30000);
    return () => clearInterval(interval);
  }, [user, fetchBackendNotifs]);

  // ── Generate notifications ──────────────────────────────────────────────────────
  const allNotifications = useMemo(() => {
    if (!user) return [];
    const generated = generateNotifications(user.role, { invoices, waybills, payments });
    // Merge backend notification records (deduplicate by id)
    const existingIds = new Set(generated.map(n => n.id));
    const merged = backendNotifs.filter(n => !existingIds.has(n.id));
    return [...generated, ...merged];
  }, [user, invoices, waybills, payments, backendNotifs]);

  const notifications = useMemo(() => {
    return allNotifications
      .filter(n => !clearedIds.has(n.id))
      .map(n => ({ ...n, read: readIds.has(n.id) || n.read }));
  }, [allNotifications, readIds, clearedIds]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const markAllAsRead = () => {
    setReadIds(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(n.id));
      return next;
    });
  };

  const toggleReadStatus = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearAll = () => {
    setClearedIds(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(n.id));
      return next;
    });
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, toggleReadStatus, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
