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
  id: '',
  name: '',
  email: '',
  companyName: '',
  contactNumber: '',
  avatarInitials: '',
  password: '',
  isFirstLogin: false
};

export const MOCK_INVOICES: Invoice[] = [];

export const MOCK_PAYMENTS: PaymentRecord[] = [];
