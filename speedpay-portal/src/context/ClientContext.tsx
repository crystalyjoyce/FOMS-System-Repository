import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Invoice, PaymentRecord, ClientUser } from '../data/mockData';

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
  const [user, setUser] = useState<ClientUser | null>(() => {
    const saved = localStorage.getItem('speedpay_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  // Use localStorage to persist registered client accounts across reloads
  const [clients, setClients] = useState<ClientUser[]>(() => {
    const saved = localStorage.getItem('speedpay_clients');
    const existing: ClientUser[] = saved ? JSON.parse(saved) : [];

    // Seed the default test account if it doesn't already exist
    const defaultClient: ClientUser = {
      id: 'TEST-001',
      name: 'Test Client',
      companyName: 'Test Company',
      email: 'test001@speedpay.test',
      contactNumber: '09000000001',
      avatarInitials: 'TC',
      password: 'passwor123',
      isFirstLogin: false,
    };

    const alreadyExists = existing.some(
      (c) => c.id.toLowerCase() === defaultClient.id.toLowerCase()
    );

    return alreadyExists ? existing : [defaultClient, ...existing];
  });


  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    localStorage.setItem('speedpay_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('speedpay_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('speedpay_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    if (!user) {
      // Clear data when logged out to ensure isolation
      setInvoices([]);
      setPayments([]);
      return;
    }

    const clientIdParam = encodeURIComponent(user.id);

    fetch(`/api/speedpay/invoices?clientId=${clientIdParam}`)
      .then(res => res.json())
      .then((data: any[]) => {
        if (data && Array.isArray(data)) {
          const mapped = data.map(inv => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNo ?? inv.id,
            description: inv.description ?? 'Logistics Services',
            amount: inv.totalAmount ?? inv.amount ?? 0,
            dueDate: inv.dueDate ?? new Date().toISOString(),
            routeArea: inv.routeArea ?? 'National Capital Region',
            status: (inv.paymentStatus === 'Unpaid' ? 'Unpaid'
                  : inv.paymentStatus === 'Partially Paid' ? 'Due Soon'
                  : inv.paymentStatus === 'Pending Payment Validation' ? 'Pending Validation'
                  : 'Paid') as Invoice['status']
          }));
          setInvoices(mapped);
        } else {
          setInvoices([]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch invoices:', err);
        setInvoices([]);
      });

    fetch(`/api/speedpay/transactions?clientId=${clientIdParam}`)
      .then(res => res.json())
      .then((data: any[]) => {
        if (data && Array.isArray(data)) {
          const mapped = data.map(p => ({
            id: p.transactionId ?? p.id,
            invoiceId: p.invoiceId,
            referenceNo: p.referenceNumber,
            paymentMethod: p.paymentMethod ?? 'Bank Transfer',
            dateSubmitted: p.submittedAt ?? p.createdAt ?? new Date().toISOString(),
            amount: p.amountPaid ?? p.amount ?? 0,
            status: (p.status === 'Completed' || p.status === 'Validated'
              ? 'Validated'
              : p.status === 'Rejected'
              ? 'Rejected'
              : 'Pending Validation') as PaymentRecord['status'],
            officialReceipt: p.receiptUrl,
            rejectionReason: p.remarks
          }));
          setPayments(mapped);
        } else {
          setPayments([]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch payment transactions:', err);
        setPayments([]);
      });
  }, [user]);

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
    localStorage.setItem('speedpay_user', JSON.stringify(client));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('speedpay_user');
  };

  const createAccount = (accountData: Omit<ClientUser, 'avatarInitials' | 'password'>) => {
    const formattedId = accountData.id.trim().toUpperCase();

    // 1. Validate if Email is already used
    if (clients.some(c => c.email.toLowerCase() === accountData.email.toLowerCase())) {
      return { success: false, error: 'Email is already in use.' };
    }

    // 2. Validate if Client ID is already registered
    if (clients.some(c => c.id.toLowerCase() === formattedId.toLowerCase())) {
      return { success: false, error: 'Client ID is already registered.' };
    }

    const avatarInitials = accountData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    const newClient: ClientUser = {
      ...accountData,
      id: formattedId,
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
  const submitPayment = async (invoiceId: string, paymentMethod: 'GCash' | 'Maya' | 'Bank Transfer', referenceNo: string, amount: number, proofFileName?: string, proofFileUrl?: string) => {
    
    // Call the backend endpoint to persist payment manually
    try {
      const response = await fetch('/api/speedpay/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          InvoiceId: invoiceId,
          ClientId: user?.id,
          ClientName: user?.companyName ?? user?.name,
          PaymentMethod: paymentMethod,
          ReferenceNumber: referenceNo,
          AmountPaid: amount,
          ProofFileName: proofFileName || 'uploaded-proof.png',
          ProofFileUrl: proofFileUrl || `https://placehold.co/600x400?text=Proof+${referenceNo}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit payment to backend');
      }
    } catch (err) {
      console.error(err);
      // Fallback or handle error if needed
    }

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
