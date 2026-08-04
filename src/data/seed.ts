/**
 * ─── FOMS Seed Data ───────────────────────────────────────────────
 * Single source of truth for all static/mock data in the application.
 * NO data should be hardcoded directly in components or contexts.
 * Import the constants you need from this file instead.
 * ─────────────────────────────────────────────────────────────────
 */

import type { User, UserRole } from '../types/auth';

// ─── Seeded User Accounts ─────────────────────────────────────────

export interface SeededUser extends User {
  password: string;
}

export const SEEDED_USERS: SeededUser[] = [
  {
    employeeId: 'EMP-001',
    fullName: 'Crystalyn Joyce C. Fajardo',
    role: 'Finance Manager',
    avatarInitials: 'CF',
    password: 'Password@123',
  },
  {
    employeeId: 'EMP-002',
    fullName: 'Misty',
    role: 'Head Accountant',
    avatarInitials: 'M',
    password: 'Password@123',
  },
  {
    employeeId: 'EMP-003',
    fullName: 'Maria Mariel Jane Anonuevo',
    role: 'Accountant',
    avatarInitials: 'MA',
    password: 'Password@123',
  },
  {
    employeeId: 'EMP-004',
    fullName: 'Hannah Estrera',
    role: 'Coordinator',
    avatarInitials: 'HE',
    password: 'Password@123',
  },
  {
    employeeId: 'EMP-005',
    fullName: 'Joana Marie Ogaya',
    role: 'Financial Manager',
    avatarInitials: 'JO',
    password: 'Password@123',
  },
];

// ─── Login Feature Highlights ────────────────────────────────────

export interface FeatureHighlight {
  step: number;
  title: string;
  description: string;
}

export const FEATURE_HIGHLIGHTS: FeatureHighlight[] = [];

// ─── Session Config ───────────────────────────────────────────────

export const SESSION_CONFIG = {
  INACTIVITY_TIMEOUT_MS: 30 * 60 * 1000,
  STORAGE_KEY: 'foms_session',
};

// ─── Role Display Labels ──────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  'Finance Manager': 'Finance Manager',
  'Financial Manager': 'Financial Manager',
  'Head Accountant': 'Head Accountant',
  'Accountant': 'Accountant',
  'Assistant of Finance Manager': 'Asst. Finance Manager',
  'Assistant of Financial Manager': 'Asst. Financial Manager',
  'Coordinator': 'Coordinator',
};

// ─── Clients ──────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  region: 'Luzon' | 'Visayas' | 'Mindanao' | 'Metro Manila';
  billingSchedule: 'Monthly' | 'Semi-monthly' | 'Weekly';
  status: 'Active' | 'Inactive';
  vatStatus: 'VATable' | 'Non-VATable';
  vatRate: number | null;
  createdAt: string;
}

export const SEEDED_CLIENTS: Client[] = [];

// ─── Billing Rates ────────────────────────────────────────────────

export interface BillingRate {
  id: string;
  clientId: string;
  region: string;
  baseRate: number;
  vatRate: number;
  surchargeRate: number;
  effectiveDate: string;
}

export const SEEDED_RATES: BillingRate[] = [];

// ─── Waybills ─────────────────────────────────────────────────────

export type WaybillStatus = 'For Checking' | 'Validated' | 'Validated (CTC)' | 'Missing' | 'CTC Submitted' | 'Billed' | 'Failed' | 'Pending Validation';

export interface Waybill {
  id: string;
  waybillNumber: string;
  clientCode: string;
  deliveryDate: string;
  status: WaybillStatus;
  hasOriginalPOD: boolean;
  hasApprovedCTC: boolean;
  encodedBy: string;
  encodedAt: string;
  destinationArea?: string;
  
  // Verification features
  pod_image_url?: string;
  uploaded_by?: string;
  uploaded_date?: string;
  is_ctc?: boolean;
  certified_by?: string;
  certification_date?: string;
  reason_for_missing?: string;
  invoiceId?: string | null;
}

export const SEEDED_WAYBILLS: Waybill[] = [];

// ─── Invoices ─────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  waybillIds: string[];
  amount: number;
  vatAmount: number;
  surchargeAmount: number;
  totalAmount: number;
  billingSchedule: 'Monthly' | 'Semi-monthly' | 'Weekly';
  billingPeriod: string;
  status: 'Draft' | 'Pending Approval' | 'Verified' | 'Needs Revision' | 'Finalized' | 'Paid' | 'Overdue';
  createdBy: string;
  createdAt: string;
  dueDate: string;
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
  notes?: string;
  proofFileUrl?: string;
}

export const SEEDED_INVOICES: Invoice[] = [];

// ─── Payments ────────────────────────────────────────────────────

export interface Payment {
  id: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  paymentMethod: 'Check' | 'Cash' | 'Bank Transfer' | 'Online Bank Transfer' | 'GCash' | 'Maya';
  referenceNumber: string;
  bankConfirmed: boolean;
  proofOfPaymentUrl?: string;
  recordedBy: string;
  recordedAt: string;
  validatedBy?: string;
  validatedAt?: string;
  status: 'Pending Validation' | 'Validated' | 'Approved' | 'Rejected';
  notes?: string;
}

export const SEEDED_PAYMENTS: Payment[] = [];

// ─── Accounts Receivable ──────────────────────────────────────────

export interface ARRecord {
  id: string;
  invoiceId: string;
  clientId: string;
  invoiceDate: string;
  dueDate: string;
  originalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  agingBracket: 'Current' | '0-30 days' | '31-60 days' | '61-90 days' | '90+ days';
  agingDays: number;
  status: 'Current' | 'Due Soon' | 'Overdue';
}

// Helper to compute aging bracket
function computeAging(dueDateStr: string): { bracket: ARRecord['agingBracket']; days: number; status: ARRecord['status'] } {
  const now = new Date();
  const due = new Date(dueDateStr);
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
  } else if (daysUntilDue <= 15) {
    status = 'Due Soon';
    bracket = '0-30 days';
  }

  return { bracket, days: Math.abs(diffDays), status };
}

export const SEEDED_AR_RECORDS: ARRecord[] = SEEDED_INVOICES
  .filter(inv => ['Finalized', 'Overdue', 'Verified'].includes(inv.status))
  .map((inv, i) => {
    const { bracket, days, status } = computeAging(inv.dueDate);
    const paid = SEEDED_PAYMENTS.filter(p => p.invoiceId === inv.id && p.status === 'Validated').reduce((s, p) => s + p.amount, 0);
    return {
      id: `AR-${String(i + 1).padStart(3, '0')}`,
      invoiceId: inv.id,
      clientId: inv.clientId,
      invoiceDate: inv.createdAt,
      dueDate: inv.dueDate,
      originalAmount: inv.totalAmount,
      paidAmount: paid,
      outstandingBalance: inv.totalAmount - paid,
      agingBracket: bracket,
      agingDays: days,
      status,
    };
  });

// ─── Official Receipts ────────────────────────────────────────────

export interface Receipt {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  paymentId: string;
  clientId: string;
  amount: number;
  referenceNumber: string;
  issuedBy: string;
  issuedAt: string;
}

export const SEEDED_RECEIPTS: Receipt[] = [];

// ─── SpeedPay Submissions ─────────────────────────────────────────

export interface SpeedPaySubmission {
  id: string;
  invoiceId: string;
  clientName: string;
  clientEmail: string;
  paymentMethod: 'GCash' | 'Maya' | 'BDO Online' | 'BPI Online';
  referenceNumber: string;
  amountPaid: number;
  proofFileName: string;
  proofFileUrl?: string;
  submittedAt: string;
  status: 'Pending Validation' | 'Validated' | 'Rejected';
  validatedBy?: string;
  validatedAt?: string;
  rejectionReason?: string;
}

export const SEEDED_SPEEDPAY: SpeedPaySubmission[] = [];

// ─── Audit Trail ─────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userFullName: string;
  userRole: UserRole;
  action: string;
  module: string;
  recordId: string;
  recordType: string;
  details: string;
  ipAddress: string;
}

export const SEEDED_AUDIT_LOGS: AuditLog[] = [];

// ─── Role-Based Navigation Configuration ──────────────────────────

export interface NavLinkConfig {
  label: string;
  path: string;
  icon: string;
  children?: { label: string; path: string }[];
}

export const NAV_CONFIG: Record<UserRole, { groups: { label?: string; items: NavLinkConfig[] }[] }> = {
  'Coordinator': {
    groups: [
      {
        label: 'Overview',
        items: [
          { label: 'Dashboard', path: '/dashboard', icon: 'ti ti-layout-dashboard' },
        ],
      },
      {
        label: 'Operations',
        items: [
          { label: 'Client Search', path: '/clients', icon: 'ti ti-search' },
          { label: 'Waybill / POD Records', path: '/waybills', icon: 'ti ti-file-import' },
        ],
      },
    ],
  },
  'Accountant': {
    groups: [
      {
        label: 'Overview',
        items: [
          { label: 'Dashboard', path: '/dashboard', icon: 'ti ti-layout-dashboard' },
        ],
      },
      {
        label: 'Operations & Validation',
        items: [
          { label: 'Client Accounts', path: '/clients', icon: 'ti ti-users' },
          { label: 'Billing Rates', path: '/rate-configuration', icon: 'ti ti-calculator' },
          { label: 'Waybill / POD Validation', path: '/waybills', icon: 'ti ti-file-check' },
        ],
      },
      {
        label: 'Invoicing',
        items: [
          { label: 'Create Invoice', path: '/invoice-create', icon: 'ti ti-file-plus' },
          { label: 'Invoice List', path: '/invoicing-desk', icon: 'ti ti-file-invoice' },
        ],
      },
      {
        label: 'Receivables & Payments',
        items: [
          { label: 'Accounts Receivable', path: '/accounts-receivable', icon: 'ti ti-report-money' },
          { label: 'Payments', path: '/payments', icon: 'ti ti-cash' },
          { label: 'SpeedPay Validation', path: '/speedpay-validation', icon: 'ti ti-device-mobile-message' },
          { label: 'Official Receipts', path: '/receipts', icon: 'ti ti-receipt' },
        ],
      },
      {
        label: 'Analytics',
        items: [
          { label: 'Reports', path: '/reports', icon: 'ti ti-chart-bar' },
        ],
      },
    ],
  },
  'Head Accountant': {
    groups: [
      {
        label: 'Overview',
        items: [
          { label: 'Dashboard', path: '/dashboard', icon: 'ti ti-layout-dashboard' },
        ],
      },
      {
        label: 'Auditing & Verification',
        items: [
          { label: 'Invoice Review', path: '/invoice-review', icon: 'ti ti-file-check' },
          { label: 'Accounts Receivable', path: '/accounts-receivable', icon: 'ti ti-report-money' },
          { label: 'Payment Validation', path: '/payments', icon: 'ti ti-cash' },
          { label: 'SpeedPay Validation', path: '/speedpay-validation', icon: 'ti ti-device-mobile-message' },
        ],
      },
      {
        label: 'Analytics & Control',
        items: [
          { label: 'Reports', path: '/reports', icon: 'ti ti-chart-bar' },
          { label: 'Audit Trail', path: '/audit-trail', icon: 'ti ti-shield-check' },
        ],
      },
    ],
  },
  'Assistant of Finance Manager': {
    groups: [
      {
        label: 'Overview',
        items: [
          { label: 'Dashboard', path: '/dashboard', icon: 'ti ti-layout-dashboard' },
        ],
      },
      {
        label: 'Liquidation & Validation',
        items: [
          { label: 'Liquidation Reports', path: '/payments', icon: 'ti ti-cash' },
          { label: 'SpeedPay Validation', path: '/speedpay-validation', icon: 'ti ti-device-mobile-message' },
        ],
      },
    ],
  },
  'Assistant of Financial Manager': {
    groups: [
      {
        label: 'Overview',
        items: [
          { label: 'Dashboard', path: '/dashboard', icon: 'ti ti-layout-dashboard' },
        ],
      },
      {
        label: 'Liquidation & Validation',
        items: [
          { label: 'Liquidation Reports', path: '/payments', icon: 'ti ti-cash' },
          { label: 'SpeedPay Validation', path: '/speedpay-validation', icon: 'ti ti-device-mobile-message' },
        ],
      },
    ],
  },
  'Finance Manager': {
    groups: [
      {
        label: 'Executive',
        items: [
          { label: 'Executive Dashboard', path: '/dashboard', icon: 'ti ti-layout-dashboard' },
        ],
      },
      {
        label: 'Review & Receivables',
        items: [
          { label: 'Invoice Review', path: '/invoice-review', icon: 'ti ti-file-check' },
          { label: 'Accounts Receivable', path: '/accounts-receivable', icon: 'ti ti-report-money' },
          { label: 'Payments & Cash Flow', path: '/payments', icon: 'ti ti-cash' },
          { label: 'SpeedPay Validation', path: '/speedpay-validation', icon: 'ti ti-device-mobile-message' },
        ],
      },
      {
        label: 'Analytics & Control',
        items: [
          { label: 'Reports', path: '/reports', icon: 'ti ti-chart-bar' },
          { label: 'Audit Trail', path: '/audit-trail', icon: 'ti ti-shield-check' },
        ],
      },
    ],
  },
  'Financial Manager': {
    groups: [
      {
        label: 'Executive',
        items: [
          { label: 'Executive Dashboard', path: '/dashboard', icon: 'ti ti-layout-dashboard' },
        ],
      },
      {
        label: 'Review & Receivables',
        items: [
          { label: 'Invoice Review', path: '/invoice-review', icon: 'ti ti-file-check' },
          { label: 'Accounts Receivable', path: '/accounts-receivable', icon: 'ti ti-report-money' },
          { label: 'Payments & Cash Flow', path: '/payments', icon: 'ti ti-cash' },
          { label: 'SpeedPay Validation', path: '/speedpay-validation', icon: 'ti ti-device-mobile-message' },
        ],
      },
      {
        label: 'Analytics & Control',
        items: [
          { label: 'Reports', path: '/reports', icon: 'ti ti-chart-bar' },
          { label: 'Audit Trail', path: '/audit-trail', icon: 'ti ti-shield-check' },
        ],
      },
    ],
  },
};

// ─── Extended Invoice Data for Modals ─────────────────────────────

export interface ExtendedInvoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientBillingAddress: string;
  clientContactDetails: string;
  billingSchedule: 'Weekly' | 'Semi-monthly' | 'Monthly';
  invoiceDate: string;
  dueDate: string;
  waybills: {
    waybillNumber: string;
    documentType: 'Original' | 'Certified True Copy';
    deliveryDate: string;
    deliveryArea: string;
    baseFreightRate: number;
  }[];
  financials: {
    totalBaseFreight: number;
    vatAmount: number;
    surcharges: number;
    invoiceGrossTotal: number;
    creditMemos: number;
    netOutstandingBalance: number;
    invoiceStatus: 'Unpaid' | 'Overdue' | 'Paid';
  };
}

export const SEEDED_EXTENDED_INVOICES: ExtendedInvoice[] = [];

// ─── Follow Up Logs ───────────────────────────────────────────────

export interface FollowUpRecord {
  id: string;
  invoiceId: string;
  referenceFields: {
    clientName: string;
    invoiceRefNumber: string;
    agingCategory: '0-30 days' | '31-60 days' | '61-90 days' | '90+ days';
    totalOutstandingAmount: number;
  };
  formInputs: {
    followUpTimestamp: string;
    communicationChannel: 'Phone Call' | 'Email' | 'SMS';
    clientContactPerson: string;
    clientPaymentStatus: 'Billing Approved/Processing Check' | 'Billing Under Review' | 'Check Ready for Pick-up' | 'Discrepancy Flagged by Client';
    expectedCollectionDate: string;
    actionRemarks: string;
    authorizedUserLogged: string;
  };
}

export const FOLLOW_UP_CHANNELS = ['Phone Call', 'Email', 'SMS'] as const;
export const FOLLOW_UP_STATUSES = ['Billing Approved/Processing Check', 'Billing Under Review', 'Check Ready for Pick-up', 'Discrepancy Flagged by Client'] as const;

export const SEEDED_FOLLOW_UP_RECORDS: FollowUpRecord[] = [];
