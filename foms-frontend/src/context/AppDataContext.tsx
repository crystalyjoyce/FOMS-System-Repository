/**
 * ─── FOMS AppDataContext ───────────────────────────────────────────
 * Single source of truth for all shared mutable data in the system.
 * Components MUST read from and write to this context instead of
 * directly using the static SEEDED_* arrays from seed.ts.
 *
 * Data is now fetched from the real .NET backend API (localhost:5007)
 * via the Vite proxy. Static seed data is used as fallback only.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import api from '../services/api';
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
  const [waybills, setWaybills] = useState<Waybill[]>(() => {
    const saved = localStorage.getItem('foms_waybills');
    return saved ? JSON.parse(saved) : [...SEEDED_WAYBILLS];
  });
  useEffect(() => {
    localStorage.setItem('foms_waybills', JSON.stringify(waybills));
  }, [waybills]);
  const [invoices, setInvoices] = useState<Invoice[]>(() => [...SEEDED_INVOICES]);
  const [payments, setPayments] = useState<Payment[]>(() => [...SEEDED_PAYMENTS]);
  const [receipts, setReceipts] = useState<Receipt[]>(() => [...SEEDED_RECEIPTS]);
  const [speedPay, setSpeedPay] = useState<SpeedPaySubmission[]>(() => [...SEEDED_SPEEDPAY]);
  const [clients, setClients] = useState<Client[]>(() => [...SEEDED_CLIENTS]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => [...SEEDED_AUDIT_LOGS]);
  const [followUpRecords, setFollowUpRecords] = useState<FollowUpRecord[]>(() => [...SEEDED_FOLLOW_UP_RECORDS]);

  // ── Fetch Clients from real backend on mount ──
  useEffect(() => {
    api.get('/clients')
      .then((res) => {
        const mapped: Client[] = res.data.map((c: any) => ({
          id: c.id ?? c.clientCode,
          name: c.name ?? c.businessName ?? '',
          contactPerson: c.contactPerson ?? '',
          email: c.email ?? '',
          phone: c.contactNumber ?? '',
          address: c.address ?? '',
          region: c.region ?? 'Metro Manila',
          billingSchedule: c.billingSchedule ?? 'Monthly',
          status: c.status === 'Active' ? 'Active' : 'Inactive',
          vatStatus: c.vatStatus ?? 'VATable',
          vatRate: c.vatRate ?? 12,
          createdAt: c.dateRegistered ?? new Date().toISOString(),
        }));
        if (mapped.length > 0) {
          // Merge: keep seed clients, add backend clients that don't conflict
          setClients(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const newOnes = mapped.filter(c => !existingIds.has(c.id));
            return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
          });
        }
      })
      .catch(() => { /* keep static seed as fallback */ });
  }, []);

  // ── Fetch Invoices from real backend on mount ──
  useEffect(() => {
    api.get('/invoices')
      .then((res) => {
        const mapped: Invoice[] = res.data.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNo ?? inv.id,
          clientId: inv.clientId,
          waybillIds: inv.waybillIds ?? [],
          amount: inv.subtotal ?? inv.freightCharges ?? 0,
          vatAmount: inv.vatAmount ?? 0,
          surchargeAmount: inv.otherCharges ?? 0,
          totalAmount: inv.totalAmount ?? 0,
          billingSchedule: inv.billingSchedule ?? 'Monthly',
          billingPeriod: inv.billingDate ?? '',
          status: inv.paymentStatus === 'Unpaid' ? 'Finalized'
                : inv.paymentStatus === 'Partially Paid' ? 'Verified'
                : inv.paymentStatus === 'Paid' ? 'Paid'
                : 'Finalized',
          createdBy: inv.createdBy ?? 'EMP-003',
          createdAt: inv.billingDate ?? new Date().toISOString(),
          dueDate: inv.dueDate ?? new Date().toISOString(),
          notes: inv.description ?? '',
        }));
        if (mapped.length > 0) {
          // Merge: keep seed invoices, add backend invoices that don't conflict
          setInvoices(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const newOnes = mapped.filter(i => !existingIds.has(i.id));
            return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
          });
        }
      })
      .catch(() => { /* keep static seed as fallback */ });
  }, []);

  // ── Fetch Waybills from real backend on mount ──
  useEffect(() => {
    api.get('/shipment-records')
      .then((res) => {
        const mapped: Waybill[] = res.data.map((w: any) => ({
          id: w.id ?? w.shipmentRecordId,
          waybillNumber: w.waybillNumber ?? w.id,
          clientCode: w.clientId ?? w.clientCode ?? 'CLI-001',
          deliveryDate: w.deliveryDate ?? new Date().toISOString().split('T')[0],
          status: w.status ?? 'For Checking',
          hasOriginalPOD: w.hasOriginalPOD ?? false,
          hasApprovedCTC: w.hasApprovedCTC ?? false,
          encodedBy: w.encodedBy ?? 'EMP-004',
          encodedAt: w.encodedAt ?? new Date().toISOString(),
          destinationArea: w.destinationArea ?? 'Unknown',
          invoiceId: w.invoiceId
        }));
        if (mapped.length > 0) {
          // Merge: keep seed waybills (they have our test statuses), add backend ones
          setWaybills(prev => {
            const existingIds = new Set(prev.map(w => w.id));
            const newOnes = mapped.filter(w => !existingIds.has(w.id));
            return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
          });
        }
      })
      .catch(() => { /* keep static seed as fallback */ });
  }, []);

  // ── Fetch SpeedPay from real backend on mount ──
  useEffect(() => {
    api.get('/speedpay/submissions')
      .then((res) => {
        const mapped: SpeedPaySubmission[] = res.data.map((s: any) => ({
          id: s.id ?? s.transactionId,
          invoiceId: s.invoiceId ?? 'INV-001',
          invoiceNumber: s.invoiceNumber,
          clientId: s.clientId ?? '',
          clientName: s.clientName ?? 'Unknown',
          clientEmail: s.clientEmail ?? '',
          paymentMethod: s.paymentMethod ?? 'GCash',
          referenceNumber: s.referenceNumber ?? s.id,
          amountPaid: s.amountPaid ?? s.amount ?? 0,
          proofFileName: s.proofFileName ?? 'proof.jpg',
          proofFileUrl: s.proofFileUrl,
          submittedAt: s.submittedAt ?? s.createdAt ?? new Date().toISOString(),
          status: s.status ?? 'Pending Validation',
        }));
        console.log('[AppDataContext] mapped speedPay:', mapped);
        if (mapped.length > 0) setSpeedPay(mapped);
      })
      .catch((err) => { 
        console.error('[AppDataContext] Failed to fetch speedPay:', err);
      });
  }, []);

  // ── Fetch Payments from real backend on mount ──
  useEffect(() => {
    api.get('/payments')
      .then((res) => {
        const mapped: Payment[] = res.data.map((p: any) => ({
          id: p.id ?? p.orNumber,
          invoiceId: p.invoiceId ?? '',
          invoiceNumber: p.invoiceNo ?? p.invoiceId ?? '',
          clientId: p.clientId ?? '',
          clientName: p.clientName ?? '',
          amount: p.amount ?? 0,
          paymentMethod: p.paymentMethod ?? 'Bank Transfer',
          referenceNumber: p.referenceNumber ?? '',
          bankConfirmed: true,
          proofOfPaymentUrl: p.proofImageUrl ?? '',
          recordedBy: p.recordedBy ?? '',
          recordedAt: p.dateRecorded ?? p.paymentDate ?? new Date().toISOString(),
          status: 'Validated' as const,
          notes: p.remarks ?? '',
        }));
        if (mapped.length > 0) setPayments(mapped);
      })
      .catch(() => { /* keep static seed as fallback */ });
  }, []);

  // ── Fetch CashFlow from real backend on mount ──
  useEffect(() => {
    api.get('/cash-flow')
      .catch(() => { /* not critical */ });
  }, []);

  // ── Fetch AuditLogs from real backend on mount ──
  useEffect(() => {
    api.get('/audit-logs')
      .then((res) => {
        const mapped: AuditLog[] = res.data.map((a: any) => ({
          id: a.id ?? a.auditLogId,
          timestamp: a.timestamp ?? a.createdAt ?? new Date().toISOString(),
          userId: a.userId ?? 'SYS',
          userFullName: a.userFullName ?? 'System',
          userRole: a.userRole ?? 'System',
          action: a.action ?? 'Unknown',
          module: a.module ?? 'System',
          recordId: a.recordId ?? '',
          recordType: a.recordType ?? '',
          details: a.details ?? '',
          ipAddress: a.ipAddress ?? '127.0.0.1'
        }));
        if (mapped.length > 0) setAuditLogs(mapped);
      })
      .catch(() => { /* keep static seed as fallback */ });
  }, []);

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
