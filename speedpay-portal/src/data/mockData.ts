export interface ClientUser {
  id: string;
  name: string;
  email: string;
  companyName: string;
  contactNumber: string;
  avatarInitials: string;
  password?: string;
  isFirstLogin?: boolean;
}

export const VALID_CLIENT_IDS = ['C-1001', 'C-1002', 'C-1003', 'CLIENT-5829', 'JD-001'];

export interface Invoice {
  id: string;
  invoiceNumber: string;
  routeArea: string;
  amount: number;
  dueDate: string; // ISO Date String
  status: 'Unpaid' | 'Due Soon' | 'Overdue' | 'Paid' | 'Pending Validation';
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  referenceNo: string;
  paymentMethod: 'GCash' | 'Maya' | 'Bank Transfer';
  dateSubmitted: string; // ISO Date String
  amount: number;
  status: 'Pending Validation' | 'Validated' | 'Rejected';
  officialReceipt?: string;
  rejectionReason?: string;
}

export const MOCK_CLIENT_USER: ClientUser = {
  id: 'JD-001',
  name: 'Juan Dela Cruz',
  email: 'juan@tiktok.com',
  companyName: 'Tiktok Company',
  contactNumber: '0917-123-4567',
  avatarInitials: 'JD',
  password: 'Password@123',
  isFirstLogin: true
};

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'INV-10260',
    invoiceNumber: 'INV-10260',
    routeArea: 'Metro Manila - Pasig Hub',
    amount: 205000.00,
    dueDate: '2026-08-05T00:00:00Z',
    status: 'Unpaid'
  },
  {
    id: 'INV-10231',
    invoiceNumber: 'INV-10231',
    routeArea: 'Metro Manila - QC Hub',
    amount: 184500.00,
    dueDate: '2026-07-20T00:00:00Z',
    status: 'Due Soon'
  },
  {
    id: 'INV-10198',
    invoiceNumber: 'INV-10198',
    routeArea: 'Cebu - Mandaue Hub',
    amount: 172300.00,
    dueDate: '2026-06-20T00:00:00Z',
    status: 'Overdue'
  },
  {
    id: 'INV-10150',
    invoiceNumber: 'INV-10150',
    routeArea: 'Davao - Buhangin Hub',
    amount: 165900.00,
    dueDate: '2026-05-20T00:00:00Z',
    status: 'Paid'
  },
  {
    id: 'INV-10099',
    invoiceNumber: 'INV-10099',
    routeArea: 'Metro Manila - Makati Hub',
    amount: 152000.00,
    dueDate: '2026-04-20T00:00:00Z',
    status: 'Paid'
  }
];

export const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: 'PAY-10099',
    invoiceId: 'INV-10099',
    referenceNo: 'PAY-9018237',
    paymentMethod: 'Bank Transfer',
    dateSubmitted: '2026-04-18T14:22:00Z',
    amount: 152000.00,
    status: 'Validated',
    officialReceipt: 'OR-2026-0099'
  },
  {
    id: 'PAY-10150',
    invoiceId: 'INV-10150',
    referenceNo: 'PAY-3312984',
    paymentMethod: 'GCash',
    dateSubmitted: '2026-05-19T09:15:00Z',
    amount: 165900.00,
    status: 'Validated',
    officialReceipt: 'OR-2026-0150'
  }
];
