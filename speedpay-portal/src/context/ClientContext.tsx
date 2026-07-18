import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Invoice, PaymentRecord, ClientUser } from '../data/mockData';
import { MOCK_INVOICES, MOCK_PAYMENTS, MOCK_CLIENT_USER, VALID_CLIENT_IDS } from '../data/mockData';

interface ClientContextType {
  user: ClientUser | null;
  invoices: Invoice[];
  payments: PaymentRecord[];
  login: (clientId: string, password: string) => { success: boolean; error?: string; requirePasswordChange?: boolean };
  logout: () => void;
  createAccount: (account: Omit<ClientUser, 'avatarInitials' | 'password'>) => { success: boolean; error?: string };
  changePassword: (clientId: string, newPassword: string) => void;
  submitPayment: (invoiceId: string, paymentMethod: 'GCash' | 'Maya' | 'Bank Transfer', referenceNo: string, amount: number) => void;
  getDashboardSummary: () => { totalOutstanding: number; nextDueDate: string | null; totalPaidPeriod: number };
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ClientUser | null>(null);
  
  // Use localStorage to persist state across reloads for the demo
  const [clients, setClients] = useState<ClientUser[]>(() => {
    const saved = localStorage.getItem('speedpay_clients');
    if (saved) return JSON.parse(saved);
    return [
      MOCK_CLIENT_USER // JD-001 with Password@123 and isFirstLogin: true
    ];
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('speedpay_invoices');
    return saved ? JSON.parse(saved) : MOCK_INVOICES;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('speedpay_payments');
    return saved ? JSON.parse(saved) : MOCK_PAYMENTS;
  });

  useEffect(() => {
    localStorage.setItem('speedpay_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('speedpay_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('speedpay_payments', JSON.stringify(payments));
  }, [payments]);

  // Auth functions
  const login = (clientId: string, password: string) => {
    const client = clients.find(c => c.id.toLowerCase() === clientId.toLowerCase());
    if (!client) {
      return { success: false, error: 'Client ID not found.' };
    }
    
    if (client.password !== password) {
      return { success: false, error: 'Invalid password.' };
    }

    // Force password change on first login
    if (client.isFirstLogin) {
      return { success: true, requirePasswordChange: true };
    }

    setUser(client);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  const createAccount = (accountData: Omit<ClientUser, 'avatarInitials' | 'password'>) => {
    // 1. Validate Client ID
    if (!VALID_CLIENT_IDS.includes(accountData.id)) {
      return { success: false, error: 'Client ID not found. Please contact your account coordinator.' };
    }
    
    // 2. Validate if Email is already used
    if (clients.some(c => c.email.toLowerCase() === accountData.email.toLowerCase())) {
      return { success: false, error: 'Email is already in use.' };
    }

    const avatarInitials = accountData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    const newClient: ClientUser = {
      ...accountData,
      avatarInitials,
      password: 'Password@123',
      isFirstLogin: true 
    };

    setClients(prev => [...prev, newClient]);
    return { success: true };
  };

  const changePassword = (clientId: string, newPassword: string) => {
    setClients(prev => prev.map(c => {
      if (c.id.toLowerCase() === clientId.toLowerCase()) {
        return { ...c, password: newPassword, isFirstLogin: false };
      }
      return c;
    }));
    
    // Automatically log them in after changing password
    const client = clients.find(c => c.id.toLowerCase() === clientId.toLowerCase());
    if (client) {
      setUser({ ...client, password: newPassword, isFirstLogin: false });
    }
  };

  // Payment function
  const submitPayment = (invoiceId: string, paymentMethod: 'GCash' | 'Maya' | 'Bank Transfer', referenceNo: string, amount: number) => {
    const newPayment: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      invoiceId,
      referenceNo,
      paymentMethod,
      dateSubmitted: new Date().toISOString(),
      amount,
      status: 'Pending Validation'
    };
    
    setPayments(prev => [newPayment, ...prev]);

    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return { ...inv, status: 'Pending Validation' };
      }
      return inv;
    }));
  };

  // Selectors
  const getDashboardSummary = () => {
    const totalOutstanding = invoices
      .filter(i => i.status === 'Unpaid' || i.status === 'Due Soon' || i.status === 'Overdue')
      .reduce((sum, i) => sum + i.amount, 0);

    const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Due Soon' || i.status === 'Overdue');
    let nextDueDate: string | null = null;
    if (unpaidInvoices.length > 0) {
      unpaidInvoices.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      nextDueDate = unpaidInvoices[0].dueDate;
    }

    const totalPaidPeriod = payments
      .filter(p => p.status === 'Validated')
      .reduce((sum, p) => sum + p.amount, 0);

    return { totalOutstanding, nextDueDate, totalPaidPeriod };
  };

  return (
    <ClientContext.Provider value={{
      user,
      invoices,
      payments,
      login,
      logout,
      createAccount,
      changePassword,
      submitPayment,
      getDashboardSummary
    }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClientContext = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClientContext must be used within a ClientProvider');
  }
  return context;
};
