/**
 * ─── FOMS AppDataContext ───────────────────────────────────────────
 * Single source of truth for all shared mutable data in the system.
 * Components MUST read from and write to this context instead of
 * directly using the static SEEDED_* arrays from seed.ts.
 *
 * This ensures that actions by one role (e.g. Coordinator validating
 * a waybill) are immediately visible to all other roles without a
 * page refresh or manual data sync.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  SEEDED_WAYBILLS,
  SEEDED_INVOICES,
  SEEDED_PAYMENTS,
  SEEDED_RECEIPTS,
  SEEDED_SPEEDPAY,
  SEEDED_CLIENTS,
  SEEDED_AUDIT_LOGS,
  SEEDED_FOLLOW_UP_RECORDS,
  Waybill,
  Invoice,
  Payment,
  Receipt,
  SpeedPaySubmission,
  Client,
  ARRecord,
  AuditLog,
  FollowUpRecord,
} from '../data/seed';

// ─── Helper: compute AR records live from invoices + payments ─────

function computeArRecords(invoices: Invoice[], payments: Payment[]): ARRecord[] {
  return invoices
    .filter(inv => ['Finalized', 'Overdue', 'Verified', 'Sent'].includes(inv.status))
    .map((inv, i) => {
      const now = new Date();
      const due = new Date(inv.dueDate);
      const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilDue = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let bracket: ARRecord['agingBracket'] = 'Current';
      let status: ARRecord['status'] = 'Current';

      if (diffDays > 0) {
        status = 'Overdue';
        if (diffDays <= 30) bracket = '0-30 days';
        else if (diffDays <= 60) bracket = '31-60 days';
        else if (diffDays <= 90) bracket = '61-90 days';
        else bracket = '90+ days';
      } else if (daysUntilDue <= 7) {
        status = 'Due Soon';
        bracket = '0-30 days';
      }

      const paid = payments
        .filter(p => p.invoiceId === inv.id && (p.status === 'Validated' || p.status === 'Approved'))
        .reduce((s, p) => s + p.amount, 0);

      return {
        id: `AR-${String(i + 1).padStart(3, '0')}`,
        invoiceId: inv.id,
        clientId: inv.clientId,
        invoiceDate: inv.createdAt,
        dueDate: inv.dueDate,
        originalAmount: inv.totalAmount,
        paidAmount: paid,
        outstandingBalance: Math.max(0, inv.totalAmount - paid),
        agingBracket: bracket,
        agingDays: Math.abs(diffDays),
        status,
      } as ARRecord;
    });
}

// ─── Context Shape ────────────────────────────────────────────────

export interface AppDataContextValue {
  // State
  waybills: Waybill[];
  invoices: Invoice[];
  payments: Payment[];
  receipts: Receipt[];
  speedPay: SpeedPaySubmission[];
  clients: Client[];
  arRecords: ARRecord[]; // derived, always in sync
  auditLogs: AuditLog[];
  followUpRecords: FollowUpRecord[];

  // Waybill actions
  updateWaybill: (id: string, changes: Partial<Waybill>) => void;
  addWaybill: (waybill: Waybill) => void;

  // Invoice actions
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, changes: Partial<Invoice>) => void;

  // Payment actions
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, changes: Partial<Payment>) => void;

  // Receipt actions
  addReceipt: (receipt: Receipt) => void;

  // SpeedPay actions
  addSpeedPay: (submission: SpeedPaySubmission) => void;
  updateSpeedPay: (id: string, changes: Partial<SpeedPaySubmission>) => void;

  // Client actions
  updateClient: (id: string, changes: Partial<Client>) => void;

  // Follow-up log actions
  addFollowUpRecord: (record: FollowUpRecord) => void;

  // Audit log
  addAuditLog: (log: AuditLog) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [waybills, setWaybills] = useState<Waybill[]>(() => [...SEEDED_WAYBILLS]);
  const [invoices, setInvoices] = useState<Invoice[]>(() => [...SEEDED_INVOICES]);
  const [payments, setPayments] = useState<Payment[]>(() => [...SEEDED_PAYMENTS]);
  const [receipts, setReceipts] = useState<Receipt[]>(() => [...SEEDED_RECEIPTS]);
  const [speedPay, setSpeedPay] = useState<SpeedPaySubmission[]>(() => [...SEEDED_SPEEDPAY]);
  const [clients, setClients] = useState<Client[]>(() => [...SEEDED_CLIENTS]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => [...SEEDED_AUDIT_LOGS]);
  const [followUpRecords, setFollowUpRecords] = useState<FollowUpRecord[]>(() => [...SEEDED_FOLLOW_UP_RECORDS]);

  // AR records are always computed live — never stale
  const arRecords = useMemo(
    () => computeArRecords(invoices, payments),
    [invoices, payments]
  );

  // ── Waybill Actions ──
  const updateWaybill = useCallback((id: string, changes: Partial<Waybill>) => {
    setWaybills(prev => prev.map(w => w.id === id ? { ...w, ...changes } : w));
  }, []);

  const addWaybill = useCallback((waybill: Waybill) => {
    setWaybills(prev => [waybill, ...prev]);
  }, []);

  // ── Invoice Actions ──
  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev]);
    if (invoice.waybillIds && invoice.waybillIds.length > 0) {
      setWaybills(prev => prev.map(w => 
        invoice.waybillIds.includes(w.id) ? { ...w, invoiceId: invoice.id } : w
      ));
    }
  }, []);

  const updateInvoice = useCallback((id: string, changes: Partial<Invoice>) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...changes } : inv));
  }, []);

  // ── Payment Actions ──
  const addPayment = useCallback((payment: Payment) => {
    setPayments(prev => [payment, ...prev]);
  }, []);

  const updatePayment = useCallback((id: string, changes: Partial<Payment>) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
  }, []);

  // ── Receipt Actions ──
  const addReceipt = useCallback((receipt: Receipt) => {
    setReceipts(prev => [receipt, ...prev]);
  }, []);

  // ── SpeedPay Actions ──
  const addSpeedPay = useCallback((submission: SpeedPaySubmission) => {
    setSpeedPay(prev => [submission, ...prev]);
  }, []);

  const updateSpeedPay = useCallback((id: string, changes: Partial<SpeedPaySubmission>) => {
    setSpeedPay(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s));
  }, []);

  // ── Client Actions ──
  const updateClient = useCallback((id: string, changes: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c));
  }, []);

  // ── Follow-up Actions ──
  const addFollowUpRecord = useCallback((record: FollowUpRecord) => {
    setFollowUpRecords(prev => [record, ...prev]);
  }, []);

  // ── Audit Log Actions ──
  const addAuditLog = useCallback((log: AuditLog) => {
    setAuditLogs(prev => [log, ...prev]);
  }, []);

  const value: AppDataContextValue = {
    waybills,
    invoices,
    payments,
    receipts,
    speedPay,
    clients,
    arRecords,
    auditLogs,
    followUpRecords,
    updateWaybill,
    addWaybill,
    addInvoice,
    updateInvoice,
    addPayment,
    updatePayment,
    addReceipt,
    addSpeedPay,
    updateSpeedPay,
    updateClient,
    addFollowUpRecord,
    addAuditLog,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return ctx;
}
