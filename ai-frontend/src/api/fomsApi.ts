// src/api/fomsApi.ts
// Centralized React API Client for Read-Only FOMS MSSQL Integration

const getHeaders = () => {
  const token = localStorage.getItem("foms_ai_token");
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
};

export interface FomsInvoice {
  id: string;
  invoiceNo: string;
  clientId: string;
  clientName: string;
  amount: number;
  balance: number;
  vatAmount: number;
  netAmount: number;
  status: string;
  issueDate: string;
  dueDate: string;
}

export interface FomsClientRecord {
  id: string;
  clientCode: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  tin?: string;
  creditLimit: number;
  currentBalance: number;
}

export interface FomsWaybill {
  id: string;
  waybillNumber: string;
  trackingNumber: string;
  shipperName: string;
  consigneeName: string;
  clientId: string;
  origin: string;
  destination: string;
  cost: number;
  status: string;
  createdAt: string;
}

export interface FomsPayment {
  id: string;
  clientId: string;
  invoiceNo: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  status: string;
  date: string;
}

export async function getClients(): Promise<{ items: FomsClientRecord[] }> {
  const res = await fetch('/api/ai-data/clients', { headers: getHeaders() });
  if (!res.ok) throw new Error("FOMS_DATABASE_UNAVAILABLE");
  const data = await res.json();
  const items = Array.isArray(data) ? data : (data.items || data.value || []);
  return { items };
}

export async function getInvoices(): Promise<{ items: FomsInvoice[] }> {
  const res = await fetch('/api/ai-data/invoices', { headers: getHeaders() });
  if (!res.ok) throw new Error("FOMS_DATABASE_UNAVAILABLE");
  const data = await res.json();
  const items = Array.isArray(data) ? data : (data.items || data.value || []);
  return { items };
}

export async function getWaybills(): Promise<{ items: FomsWaybill[] }> {
  const res = await fetch('/api/ai-data/waybills', { headers: getHeaders() });
  if (!res.ok) throw new Error("FOMS_DATABASE_UNAVAILABLE");
  const data = await res.json();
  const items = Array.isArray(data) ? data : (data.items || data.value || []);
  return { items };
}

export async function getPayments(): Promise<{ items: FomsPayment[] }> {
  const res = await fetch('/api/ai-data/payments', { headers: getHeaders() });
  if (!res.ok) throw new Error("FOMS_DATABASE_UNAVAILABLE");
  const data = await res.json();
  const items = Array.isArray(data) ? data : (data.items || data.value || []);
  return { items };
}

export async function getDashboardSummary() {
  const res = await fetch('/api/ai/dashboard/summary', { headers: getHeaders() });
  if (!res.ok) throw new Error("FOMS_DATABASE_UNAVAILABLE");
  return res.json();
}
