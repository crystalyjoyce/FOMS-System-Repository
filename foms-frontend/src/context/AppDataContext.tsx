/**
 * ─── FOMS AppDataContext ───────────────────────────────────────────
 * Single source of truth for all shared mutable data in the system.
 * Data is fetched EXCLUSIVELY from the real .NET backend API.
 *
 * CRITICAL: Every fetch REPLACES state (setX(mapped)), never merges.
 * This ensures the DB is always the single source of truth.
 * Refresh functions are exposed so pages can re-sync after mutations.
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

// ─── Backend → Frontend map helpers ──────────────────────────────

function mapClient(c: any): Client {
  return {
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
  };
}

function mapInvoice(inv: any): Invoice {
  // Derive frontend status from backend paymentStatus (DB truth)
  let status: Invoice['status'] = 'Finalized';
  const ps = (inv.paymentStatus ?? '').toLowerCase();
  const pvs = (inv.paymentValidationStatus ?? '').toLowerCase();
  if (ps === 'paid') {
    status = 'Paid';
  } else if (ps === 'overdue') {
    status = 'Overdue';
  } else if (pvs.includes('pending')) {
    status = 'Pending Approval';
  } else if (pvs === 'returned for correction') {
    status = 'Draft';
  }
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNo ?? inv.id,
    clientId: inv.clientId,
    waybillIds: inv.waybillIds ?? [],
    amount: inv.subtotal ?? inv.freightCharges ?? 0,
    vatAmount: inv.vatAmount ?? 0,
    surchargeAmount: inv.surcharge ?? inv.otherCharges ?? 0,
    totalAmount: inv.totalAmount ?? 0,
    billingSchedule: inv.billingSchedule ?? 'Monthly',
    billingPeriod: inv.billingDate ?? '',
    status,
    createdBy: inv.createdBy ?? inv.encodedBy ?? 'System',
    createdAt: inv.billingDate ?? inv.dateEncoded ?? new Date().toISOString(),
    dueDate: inv.dueDate ?? new Date().toISOString(),
    notes: inv.description ?? '',
  };
}

function mapPayment(p: any): Payment {
  const rawStatus = p.paymentStatus ?? p.status ?? 'Pending Validation';
  const sl = rawStatus.toLowerCase();
  let status: Payment['status'] = 'Pending Validation';
  if (sl === 'validated' || sl === 'approved') status = 'Validated';
  else if (sl === 'rejected') status = 'Rejected';
  return {
    id: p.id,
    invoiceId: p.invoiceId ?? '',
    invoiceNumber: p.invoiceNo ?? p.invoiceId ?? '',
    clientId: p.clientId ?? '',
    clientName: p.clientName ?? '',
    amount: p.amount ?? 0,
    paymentMethod: p.paymentMethod ?? 'Bank Transfer',
    referenceNumber: p.referenceNumber ?? '',
    bankConfirmed: status === 'Validated',
    proofOfPaymentUrl: p.proofImageUrl ?? p.proofFileUrl ?? '',
    recordedBy: p.recordedBy ?? '',
    recordedAt: p.dateRecorded ?? p.paymentDate ?? p.submittedAt ?? new Date().toISOString(),
    validatedBy: p.validatedBy,
    validatedAt: p.validatedAt,
    status,
    notes: p.remarks ?? '',
    orNumber: p.orNumber,
  };
}

function mapSpeedPay(s: any): SpeedPaySubmission {
  const sl = (s.status ?? '').toLowerCase();
  let status: SpeedPaySubmission['status'] = 'Pending Validation';
  if (sl === 'validated' || sl === 'approved') status = 'Validated';
  else if (sl === 'rejected') status = 'Rejected';
  return {
    id: s.id ?? s.transactionId,
    invoiceId: s.invoiceId ?? '',
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
    status,
    validatedBy: s.validatedBy,
    validatedAt: s.validatedAt,
    rejectionReason: s.rejectionReason,
  };
}

// ─── Helper: compute AR records live from invoices + payments ─────

function computeArRecords(invoices: Invoice[], payments: Payment[]): ARRecord[] {
  return invoices
    .filter(inv => ['Finalized', 'Overdue', 'Verified', 'Sent', 'Pending Approval', 'Paid', 'Draft', 'Unpaid'].includes(inv.status))
    .map((inv, i) => {
      const now = new Date();
      const due = new Date(inv.dueDate);
      const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilDue = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const paid = payments
        .filter(p => p.invoiceId === inv.id && (p.status === 'Validated' || p.status === 'Approved'))
        .reduce((s, p) => s + p.amount, 0);

      let outstandingBalance = Math.max(0, inv.totalAmount - paid);

      let bracket: ARRecord['agingBracket'] = 'Current';
      let status: ARRecord['status'] = 'Current';

      if (inv.status === 'Paid') {
        status = 'Paid' as any;
        outstandingBalance = 0;
      } else if (outstandingBalance <= 0) {
        status = 'Paid' as any;
      } else if (diffDays > 0) {
        status = 'Overdue';
        if (diffDays <= 30) bracket = '0-30 days';
        else if (diffDays <= 60) bracket = '31-60 days';
        else if (diffDays <= 90) bracket = '61-90 days';
        else bracket = '90+ days';
      } else if (daysUntilDue <= 7) {
        status = 'Due Soon';
        bracket = '0-30 days';
      }

      return {
        id: `AR-${String(i + 1).padStart(3, '0')}`,
        invoiceId: inv.id,
        clientId: inv.clientId,
        invoiceDate: inv.createdAt,
        dueDate: inv.dueDate,
        originalAmount: inv.totalAmount,
        paidAmount: paid,
        outstandingBalance,
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

  // DB Refresh actions — call after any mutation to re-sync from DB
  refreshPayments: () => Promise<void>;
  refreshInvoices: () => Promise<void>;
  refreshSpeedPay: () => Promise<void>;
  refreshClients: () => Promise<void>;
  refreshReceipts: () => Promise<void>;

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
  addClient: (client: Client) => void;

  // Follow-up log actions
  addFollowUpRecord: (record: FollowUpRecord) => void;

  // Audit log
  addAuditLog: (log: AuditLog) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [waybills, setWaybills] = useState<Waybill[]>(SEEDED_WAYBILLS);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [speedPay, setSpeedPay] = useState<SpeedPaySubmission[]>([]);
  const [clients, setClients] = useState<Client[]>(SEEDED_CLIENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [followUpRecords, setFollowUpRecords] = useState<FollowUpRecord[]>([]);

  // ── Refresh functions — REPLACE state from DB (never merge) ──────
  const refreshClients = useCallback(async () => {
    try {
      const res = await api.get('/clients');
      const mapped: Client[] = res.data.map(mapClient);
      setClients(mapped);
    } catch { /* keep current state */ }
  }, []);

  const refreshInvoices = useCallback(async () => {
    try {
      const res = await api.get('/invoices');
      const mapped: Invoice[] = res.data.map(mapInvoice);
      setInvoices(mapped);
    } catch { /* keep current state */ }
  }, []);

  const refreshPayments = useCallback(async () => {
    try {
      const res = await api.get('/payments');
      const mapped: Payment[] = res.data.map(mapPayment);
      setPayments(mapped);
    } catch { /* keep current state */ }
  }, []);

  const refreshSpeedPay = useCallback(async () => {
    try {
      const res = await api.get('/speedpay/submissions');
      const mapped: SpeedPaySubmission[] = res.data.map(mapSpeedPay);
      setSpeedPay(mapped);
    } catch { /* keep current state */ }
  }, []);

  const refreshReceipts = useCallback(async () => {
    try {
      const res = await api.get('/official-receipts');
      const mapped: Receipt[] = res.data.map((r: any) => ({
        id: r.id,
        receiptNumber: r.receiptNumber ?? r.orNumber ?? r.id,
        invoiceId: r.invoiceId ?? r.paymentCollection?.invoiceId ?? '',
        paymentId: r.paymentCollectionId ?? r.paymentId ?? '',
        clientId: r.clientId ?? r.paymentCollection?.clientId ?? '',
        amount: r.amount ?? r.paymentCollection?.amountCollected ?? 0,
        referenceNumber: r.referenceNumber ?? '',
        issuedBy: r.issuedBy ?? 'System',
        issuedAt: r.issuedDate ?? r.issuedAt ?? new Date().toISOString(),
      }));
      setReceipts(mapped);
    } catch { /* keep current state */ }
  }, []);

  // ── Initial fetches on mount ──
  useEffect(() => { refreshClients(); }, [refreshClients]);
  useEffect(() => { refreshInvoices(); }, [refreshInvoices]);
  useEffect(() => { refreshPayments(); }, [refreshPayments]);
  useEffect(() => { refreshReceipts(); }, [refreshReceipts]);

  // ── Fetch Waybills from real backend on mount ──
  useEffect(() => {
    api.get('/shipment-records')
      .then((res) => {
        const mapped: Waybill[] = res.data.map((w: any) => ({
          id: w.id ?? w.shipmentRecordId,
          waybillNumber: w.waybillNumber ?? w.id,
          clientCode: w.clientId ?? w.clientCode ?? 'CLI-001',
          deliveryDate: w.deliveryDate ?? new Date().toISOString().split('T')[0],
          status: (w.status === 'Validated' || w.status === 'Validated (CTC)' || w.status === 'CTC Submitted') ? w.status : 'Validated',
          hasOriginalPOD: w.hasOriginalPOD ?? false,
          hasApprovedCTC: w.hasApprovedCTC ?? false,
          encodedBy: w.encodedBy ?? 'EMP-004',
          encodedAt: w.encodedAt ?? new Date().toISOString(),
          destinationArea: w.destinationArea ?? 'Unknown',
          invoiceId: w.invoiceId
        }));
        if (mapped.length > 0) {
          setWaybills(prev => {
            const map = new Map(prev.map(w => [w.id, w]));
            mapped.forEach(m => map.set(m.id, { ...map.get(m.id), ...m }));
            return Array.from(map.values());
          });
        }
      })
      .catch(() => { /* keep static seed as fallback */ });
  }, []);

  // ── SpeedPay — polls every 15s so new submissions appear automatically ──
  useEffect(() => {
    refreshSpeedPay(); // initial fetch
    const interval = setInterval(refreshSpeedPay, 15000);
    return () => clearInterval(interval);
  }, [refreshSpeedPay]);

  // ── Fetch CashFlow from real backend on mount ──
  useEffect(() => {
    api.get('/cash-flow').catch(() => { /* not critical */ });
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
    setReceipts(prev => {
      const exists = prev.some(r => r.id === receipt.id || r.paymentId === receipt.paymentId);
      return exists ? prev : [receipt, ...prev];
    });
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

  const addClient = useCallback((client: Client) => {
    setClients(prev => [client, ...prev]);
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
    refreshPayments,
    refreshInvoices,
    refreshSpeedPay,
    refreshClients,
    refreshReceipts,
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
    addClient,
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
