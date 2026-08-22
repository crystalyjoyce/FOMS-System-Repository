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

export const VALID_CLIENT_IDS: string[] = [];

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
  id: 'CA-003',
  name: 'Lazada Admin',
  email: 'billing@lazada.ph',
  companyName: 'Lazada Philippines',
  contactNumber: '+63 917 123 4567',
  avatarInitials: 'LA',
  password: 'Lazada@123',
  isFirstLogin: false
};

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'INV-SP-001',
    invoiceNumber: 'LZD-2026-0001',
    routeArea: 'NCR - Makati to QC',
    amount: 15500.00,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Due Soon',
  },
  {
    id: 'INV-SP-002',
    invoiceNumber: 'LZD-2026-0002',
    routeArea: 'NCR - Pasig to Taguig',
    amount: 28000.00,
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Unpaid',
  },
  {
    id: 'INV-SP-003',
    invoiceNumber: 'LZD-2026-0003',
    routeArea: 'North Luzon - Bulacan',
    amount: 45200.00,
    dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Unpaid',
  },
  {
    id: 'INV-SP-004',
    invoiceNumber: 'LZD-2026-0004',
    routeArea: 'South Luzon - Cavite',
    amount: 12400.00,
    dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Unpaid',
  },
  {
    id: 'INV-SP-005',
    invoiceNumber: 'LZD-2026-0005',
    routeArea: 'Visayas - Cebu City',
    amount: 31000.00,
    dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Unpaid',
  },
  {
    id: 'INV-SP-006',
    invoiceNumber: 'LZD-2026-0006',
    routeArea: 'Mindanao - Davao City',
    amount: 18900.00,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Unpaid',
  },
  {
    id: 'INV-SP-007',
    invoiceNumber: 'LZD-2026-0007',
    routeArea: 'NCR - Manila to Pasay',
    amount: 9500.00,
    dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Unpaid',
  },
  {
    id: 'INV-SP-008',
    invoiceNumber: 'LZD-2026-0008',
    routeArea: 'North Luzon - Pampanga',
    amount: 22100.00,
    dueDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Unpaid',
  },
  {
    id: 'INV-SP-009',
    invoiceNumber: 'LZD-2026-0009',
    routeArea: 'Visayas - Iloilo City',
    amount: 17300.00,
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Overdue',
  },
  {
    id: 'INV-SP-010',
    invoiceNumber: 'LZD-2026-0010',
    routeArea: 'South Luzon - Laguna',
    amount: 8800.00,
    dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Paid',
  },
];

export const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: 'PAY-2024-001',
    invoiceId: 'INV-2024-004',
    referenceNo: 'GCR-20240715-88812',
    paymentMethod: 'GCash',
    dateSubmitted: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 5500.00,
    status: 'Validated',
    officialReceipt: 'OR-2024-00441',
  },
];
