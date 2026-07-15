import React, { useState, useEffect, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '../components/ToastContext';
import { useAppData } from '../context/AppDataContext';
import { createPortal } from 'react-dom';
import type { Invoice } from '../data/seed';
import { Card } from '../components/Card';
import { User, Lock, AlertCircle, Eye, EyeOff, Clock } from 'lucide-react';
import './LoginPage.css';

type SpeedPayStep = 'login' | 'dashboard' | 'summary' | 'payment' | 'upload' | 'submitted';
type DashTab = 'to_pay' | 'recent';

const PAYMENT_METHODS = [
  { id: 'gcash', label: 'GCash', color: '#007AFF' },
  { id: 'maya', label: 'Maya', color: '#00AA6C' },
  { id: 'bank', label: 'Bank Transfer (QRPh)', color: '#1E3A5F' },
];

function fmt(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusBadge(status: string): React.CSSProperties {
  const s = status.toLowerCase();
  if (s.includes('valid')) return { background: '#D1FAE5', color: '#065F46' };
  if (s.includes('reject')) return { background: '#FEE2E2', color: '#991B1B' };
  if (s.includes('overdue')) return { background: '#FEE2E2', color: '#991B1B' };
  if (s.includes('pending') || s.includes('sent')) return { background: '#FEF3C7', color: '#B45309' };
  return { background: '#E0E7FF', color: '#3730A3' };
}

export const SpeedPay: React.FC = () => {
  const { toast } = useToast();
  const { invoices, clients, speedPay, addPayment } = useAppData();

  const [step, setStep] = useState<SpeedPayStep>('login');
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggedInClient, setLoggedInClient] = useState<any>(null);
  const [foundInvoice, setFoundInvoice] = useState<Invoice | null>(null);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [clientEmail, setClientEmail] = useState('');
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [dashTab, setDashTab] = useState<DashTab>('to_pay');
  const [currentDateTime, setCurrentDateTime] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live clock matching main system format
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      const timePart = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
      setCurrentDateTime(`${datePart} • ${timePart}`);
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem('speedpay_client');
    if (saved) {
      const client = JSON.parse(saved);
      setLoggedInClient(client);
      setClientEmail(client.email);
      setStep('dashboard');
    }
  }, []);

  const clientInvoices = useMemo(() => {
    if (!loggedInClient) return [];
    return invoices.filter(
      i => i.clientId === loggedInClient.id &&
        ['Sent', 'Overdue', 'Finalized', 'Verified'].includes(i.status)
    );
  }, [loggedInClient, invoices]);

  const toPayGroups = useMemo(() => {
    const grouped = clientInvoices.reduce((acc, inv) => {
      const schedule = inv.billingSchedule || 'Monthly';
      if (!acc[schedule]) acc[schedule] = [];
      acc[schedule].push(inv);
      return acc;
    }, {} as Record<string, Invoice[]>);
    
    const order = ['Weekly', 'Semi-monthly', 'Monthly'];
    return Object.entries(grouped).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  }, [clientInvoices]);

  const recentPayments = useMemo(() => {
    if (!loggedInClient) return [];
    return speedPay
      .filter(s => s.clientEmail === loggedInClient.email || s.clientName === loggedInClient.contactPerson)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [loggedInClient, speedPay]);

  const handleLogin = () => {
    setLoginError('');
    if (!loginId || !loginPass) { setLoginError('Please fill in both fields.'); return; }
    if (loginPass !== 'Password@123') { setLoginError('Invalid credentials. (Demo password: Password@123)'); return; }
    
    // loginId is expected to be Invoice Number
    const invoice = invoices.find(i => i.invoiceNumber.toLowerCase() === loginId.toLowerCase());
    if (!invoice) {
      setLoginError('Invoice not found. Please try a valid Invoice Number like INV-2023-0001');
      return;
    }
    const client = clients.find(c => c.id === invoice.clientId);
    if (!client) {
      setLoginError('Client account associated with this invoice not found.');
      return;
    }

    sessionStorage.setItem('speedpay_client', JSON.stringify(client));
    setLoggedInClient(client);
    setClientEmail(client.email);
    setStep('dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('speedpay_client');
    setLoggedInClient(null);
    setStep('login');
    setLoginId(''); setLoginPass('');
    setFoundInvoice(null); setSelectedMethod(''); setReferenceNumber(''); setProofFile(null);
    setShowProfileMenu(false);
  };

  const handleSelectInvoice = (inv: Invoice) => {
    const existing = speedPay.find(s =>
      s.invoiceId === inv.id && (s.status === 'Pending Validation' || s.status === 'Rejected')
    );
    setFoundInvoice(inv);
    if (existing) { setExistingSubmission(existing); setReferenceNumber(existing.referenceNumber); setStep('submitted'); }
    else { setExistingSubmission(null); setStep('summary'); }
  };

  const handlePayMongoCheckout = async () => {
    if (!selectedMethod || !foundInvoice) return;
    setIsProcessing(true);
    try {
      const secretKey = import.meta.env.VITE_PAYMONGO_SECRET_KEY;
      if (!secretKey) throw new Error('Missing VITE_PAYMONGO_SECRET_KEY in .env');

      const amountInCents = Math.round(foundInvoice.totalAmount * 100);
      if (amountInCents < 10000) throw new Error(`Minimum amount is ₱100. Invoice total is ${fmt(foundInvoice.totalAmount)}.`);

      const response = await fetch('/api/paymongo-link', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: amountInCents,
              currency: 'PHP',
              description: `Payment for ${foundInvoice.invoiceNumber}`,
              remarks: `Client: ${loggedInClient?.name}`,
            },
          },
        }),
      });

      const rawText = await response.text();
      let data: any;
      try { data = JSON.parse(rawText); } catch { throw new Error(`Server returned unexpected response.`); }

      if (!response.ok || data.errors || data.error) {
        throw new Error(data.errors?.[0]?.detail ?? data.error ?? `PayMongo error (HTTP ${response.status})`);
      }

      const checkoutUrl: string = data.data.attributes.checkout_url;
      const refNum: string = data.data.attributes.reference_number;
      setReferenceNumber(refNum);
      window.open(checkoutUrl, '_blank');
      setIsProcessing(false);
      setStep('upload');
      toast.info('Complete payment in the new tab, then upload your proof here.', 'Redirected to PayMongo');
    } catch (err: any) {
      setIsProcessing(false);
      console.error('SpeedPay Checkout Error:', err);
      toast.error(err.message ?? 'Failed to generate payment link.', 'Payment Error');
    }
  };

  const handleSubmit = () => {
    if (!foundInvoice) return;
    if (proofFile) {
      const reader = new FileReader();
      reader.onloadend = () => saveSubmission(reader.result as string);
      reader.readAsDataURL(proofFile);
    } else {
      saveSubmission(undefined);
    }
  };

  const saveSubmission = (fileUrl: string | undefined) => {
    const newPayment = {
      id: `PAY-${Date.now()}`,
      invoiceId: foundInvoice!.id,
      clientId: loggedInClient!.id,
      amount: foundInvoice!.totalAmount,
      referenceNumber,
      paymentMethod: (PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label ?? selectedMethod) as any,
      proofOfPaymentUrl: fileUrl,
      bankConfirmed: false,
      recordedBy: 'SpeedPay System',
      status: 'Pending Validation' as const,
      recordedAt: new Date().toISOString(),
      notes: `SpeedPay transaction by ${loggedInClient?.name}`
    };
    addPayment(newPayment);
    setExistingSubmission(newPayment);
    setStep('submitted');
    setShowEmailModal(true);
    toast.success('Proof submitted. Pending Finance validation.', 'Payment Submitted');
  };

  const qrValue = foundInvoice
    ? `PAYMONGO|QRPh|${loggedInClient?.name ?? ''}|${foundInvoice.invoiceNumber}|PHP|${foundInvoice.totalAmount.toFixed(2)}`
    : 'SPEEDPAY';

  const renderBack = (to: SpeedPayStep, label: string) => (
    <button onClick={() => setStep(to)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '0.85rem', fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
      ← {label}
    </button>
  );

  // ══════════════════════════════════════════════════════════════
  // LOGIN LAYOUT
  if (step === 'login') {
    return (
      <div className="login-shell">
        {/* ── LEFT PANEL ── */}
        <aside className="login-left">
          <div className="login-logo-area">
            <img src="/logo.png" alt="Speedex" className="login-logo-img" onError={(e) => (e.currentTarget as HTMLImageElement).style.display = 'none'} />
          </div>
          <div className="login-features" style={{ gap: 20 }}>
            <div className="login-feature-item">
              <div className="login-feature-step">1</div>
              <div className="login-feature-text">
                <h4 className="login-feature-title">Access Your Account</h4>
                <p className="login-feature-desc">Use your registered Invoice Number and password to securely access your payment dashboard.</p>
              </div>
            </div>
            <div className="login-feature-item">
              <div className="login-feature-step">2</div>
              <div className="login-feature-text">
                <h4 className="login-feature-title">Settle Invoices</h4>
                <p className="login-feature-desc">View your outstanding statements, choose your preferred payment mode, and pay in full.</p>
              </div>
            </div>
            <div className="login-feature-item">
              <div className="login-feature-step">3</div>
              <div className="login-feature-text">
                <h4 className="login-feature-title">Upload Proof</h4>
                <p className="login-feature-desc">Submit your payment reference number and deposit slip for instant transaction verification.</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── RIGHT PANEL ── */}
        <main className="login-right">
          <div className="login-card">
            <p className="login-card-label">SECURE ACCESS</p>
            <h1 className="login-card-title">Login your SpeedPay Account</h1>
            <p className="login-card-subtitle">Enter your credentials below to continue.</p>
            <div className="login-card-divider" />

            <form className="login-form" onSubmit={e => { e.preventDefault(); handleLogin(); }} noValidate>
              <div className="login-field">
                <label className="login-label">INVOICE NUMBER</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon"><User size={16} /></span>
                  <input type="text" className="login-input" placeholder="INV-2023-0001" value={loginId} onChange={e => setLoginId(e.target.value)} />
                </div>
              </div>
              <div className="login-field">
                <label className="login-label">PASSWORD</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon"><Lock size={16} /></span>
                  <input type={showPassword ? 'text' : 'password'} className="login-input" placeholder="••••••••" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
                  <button type="button" className="login-eye-btn" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="login-options-row">
                <label className="login-remember">
                  <input type="checkbox" className="login-remember-checkbox" />
                  <span className="login-remember-label">Remember me</span>
                </label>
                <button type="button" className="login-forgot-link">Forgot password?</button>
              </div>

              {loginError && (
                <div className="login-global-error" role="alert" aria-live="polite">
                  <AlertCircle size={15} />
                  {loginError}
                </div>
              )}

              <button type="submit" className="login-btn">LOG IN</button>
            </form>



          </div>
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // DASHBOARD LAYOUT
  return (
    <div className="app-layout" style={{ alignItems: 'stretch' }}>
      
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-img-wrapper">
             <img src="/logo.png" alt="Speedex" className="sidebar-logo-img" onError={(e) => (e.currentTarget as HTMLImageElement).style.display = 'none'} />
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item-container">
            <a href="#" onClick={(e) => { e.preventDefault(); setDashTab('to_pay'); setStep('dashboard'); }} className={`nav-item ${dashTab === 'to_pay' && step === 'dashboard' ? 'active' : ''}`}>
              <span className="nav-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <i className="ti ti-file-invoice" style={{ fontSize: "18px" }} />
              </span>
              <span className="nav-label">To Pay</span>
            </a>
          </div>
          <div className="nav-item-container">
            <a href="#" onClick={(e) => { e.preventDefault(); setDashTab('recent'); setStep('dashboard'); }} className={`nav-item ${dashTab === 'recent' && step === 'dashboard' ? 'active' : ''}`}>
              <span className="nav-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <i className="ti ti-receipt" style={{ fontSize: "18px" }} />
              </span>
              <span className="nav-label">Recently Paid</span>
            </a>
          </div>
        </nav>

        {loggedInClient && (
          <div className="sidebar-footer" ref={profileRef}>
            <div 
              className={`profile-card ${showProfileMenu ? "active" : ""}`} 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              role="button"
              style={{ cursor: 'pointer' }}
            >
              <div className="profile-av">{loggedInClient.contactPerson?.substring(0, 2).toUpperCase() || 'CL'}</div>
              <div className="profile-info">
                <span className="profile-name">{loggedInClient.contactPerson || 'Client Name'}</span>
                <span className="profile-role">{loggedInClient.name}</span>
              </div>
              <i className="ti ti-selector profile-selector-icon" style={{ marginLeft: "auto", opacity: 0.5, fontSize: "14px" }} />
            </div>

            {showProfileMenu && (
              <div className="sidebar-profile-dropdown">
                <div className="dropdown-identity">
                  <span className="dropdown-name">{loggedInClient.contactPerson}</span>
                  <span className="dropdown-role">{loggedInClient.name}</span>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-option logout" onClick={handleLogout}>
                  <i className="ti ti-logout" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="main-area" style={{ justifyContent: 'flex-start', height: '100vh', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
        
        {/* ── GLOBAL HEADER ── */}
        <header className="global-header" style={{ justifyContent: 'space-between', padding: '10px 28px', background: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center' }}>
          <div className="gh-left">
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>SpeedPay Portal</h1>
          </div>
          <div className="gh-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 9999, color: '#334155', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
              <Clock size={15} style={{ color: '#0EA5E9' }} strokeWidth={2.5} />
              <span>{currentDateTime}</span>
            </div>
          </div>
        </header>

        {/* ── CONTENT AREA ── */}
        <main className="content-area" style={{ flex: 1, padding: '28px', background: '#EEF2FF', display: 'flex', flexDirection: 'column', minWidth: 0, boxSizing: 'border-box', width: '100%', maxWidth: '100%' }}>
          <div style={{ maxWidth: 860, margin: '0 auto', width: '100%' }}>
            
            {step === 'dashboard' && dashTab === 'to_pay' && (
              clientInvoices.length === 0 ? (
                <Card>
                  <div style={emptyState}>
                    <i className="ti ti-checks" style={{ fontSize: 44, color: '#10B981', display: 'block', marginBottom: 10 }} />
                    <p style={{ margin: 0, color: '#64748B', fontWeight: 600 }}>You have no outstanding invoices.</p>
                  </div>
                </Card>
              ) : (
                <div>
                  <h2 style={{ margin: '0 0 20px', fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>Invoices to Pay</h2>
                  {toPayGroups.map(([schedule, groupInvoices]) => (
                    <Card key={schedule} style={{ marginBottom: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{schedule} Billing</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#6366F1' }}>Total: {fmt(groupInvoices.reduce((s, i) => s + i.totalAmount, 0))}</span>
                      </div>
                      <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                        <table style={tableStyle}>
                          <thead>
                            <tr>
                              {['Invoice No.', 'Period', 'Base Amount', 'VAT', 'Surcharge', 'Total Due', 'Due Date', 'Status', ''].map(h => (
                                <th key={h} style={thStyle}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {groupInvoices.map((inv: Invoice) => (
                              <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={tdStyle}><span style={{ fontWeight: 700, color: '#0F172A' }}>{inv.invoiceNumber}</span></td>
                                <td style={tdStyle}>{inv.billingPeriod}</td>
                                <td style={tdStyle}>{fmt(inv.amount)}</td>
                                <td style={tdStyle}>{fmt(inv.vatAmount)}</td>
                                <td style={tdStyle}>{fmt(inv.surchargeAmount)}</td>
                                <td style={{ ...tdStyle, fontWeight: 800, color: '#6366F1' }}>{fmt(inv.totalAmount)}</td>
                                <td style={tdStyle}>{new Date(inv.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                <td style={tdStyle}>
                                  <span style={{ ...badgeBase, ...statusBadge(inv.status) }}>{inv.status}</span>
                                </td>
                                <td style={tdStyle}>
                                  <button onClick={() => handleSelectInvoice(inv)} style={btnPrimarySmall}>Pay Now</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            )}

            {step === 'dashboard' && dashTab === 'recent' && (
              recentPayments.length === 0 ? (
                <Card>
                  <div style={emptyState}>
                    <i className="ti ti-receipt" style={{ fontSize: 44, color: '#94A3B8', display: 'block', marginBottom: 10 }} />
                    <p style={{ margin: 0, color: '#64748B', fontWeight: 600 }}>No payment records yet.</p>
                  </div>
                </Card>
              ) : (
                <Card>
                  <h2 style={{ margin: '0 0 20px', fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>Recently Paid</h2>
                  <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                    <table style={tableStyle}>
                      <thead style={{ background: '#F8FAFC' }}>
                        <tr>
                          {['Invoice No.', 'Amount Paid', 'Date Paid', 'Reference No.', 'Payment Method'].map(h => (
                            <th key={h} style={thStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recentPayments.map(pay => {
                          const inv = invoices.find(i => i.id === pay.invoiceId);
                          return (
                            <tr key={pay.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ ...tdStyle, fontWeight: 700, color: '#0F172A' }}>{inv?.invoiceNumber ?? '—'}</td>
                              <td style={{ ...tdStyle, fontWeight: 700 }}>{fmt(pay.amountPaid)}</td>
                              <td style={tdStyle}>{new Date(pay.submittedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                              <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.8rem' }}>{pay.referenceNumber}</td>
                              <td style={tdStyle}>{pay.paymentMethod}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )
            )}

            {/* ════ PAYMENT SUMMARY ════ */}
            {step === 'summary' && foundInvoice && (
              <Card>
                {renderBack('dashboard', 'Back to Invoices')}
                <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>Payment Summary</h2>

                <div style={{ background: 'linear-gradient(135deg,#0F172A,#1E3A5F)', borderRadius: 14, padding: '24px', marginBottom: 20, textAlign: 'center' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Total Amount Due</p>
                  <p style={{ margin: 0, fontSize: '2.4rem', fontWeight: 900, color: '#fff' }}>{fmt(foundInvoice.totalAmount)}</p>
                </div>

                <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
                  {[
                    { label: 'Invoice No.', value: foundInvoice.invoiceNumber },
                    { label: 'Billing Period', value: foundInvoice.billingPeriod },
                    { label: 'Base Amount', value: fmt(foundInvoice.amount) },
                    { label: 'VAT (12%)', value: fmt(foundInvoice.vatAmount) },
                    { label: 'Surcharge', value: fmt(foundInvoice.surchargeAmount) },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                      <span style={{ fontSize: '0.875rem', color: '#64748B' }}>{row.label}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: '#F1F5F9' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Total Due</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#6366F1' }}>{fmt(foundInvoice.totalAmount)}</span>
                  </div>
                </div>

                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: '0.82rem', color: '#92400E', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <i className="ti ti-info-circle" style={{ fontSize: 18, marginTop: 1 }} />
                  <span><strong>Full payment only.</strong> Partial payments are not accepted.</span>
                </div>

                <button onClick={() => setStep('payment')} style={{ ...btnPrimary, width: '100%' }}>
                  Choose Payment Method →
                </button>
              </Card>
            )}

            {/* ════ PAYMENT METHOD ════ */}
            {step === 'payment' && (
              <Card>
                {renderBack('summary', 'Back to Summary')}
                <h2 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>Select Payment Method</h2>
                <p style={{ margin: '0 0 20px', color: '#64748B', fontSize: '0.875rem' }}>Choose your preferred payment channel.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.id} onClick={() => setSelectedMethod(m.id)} style={{
                      padding: '14px 18px', borderRadius: 12, border: `2px solid ${selectedMethod === m.id ? '#6366F1' : '#E2E8F0'}`,
                      background: selectedMethod === m.id ? '#EEF2FF' : '#fff',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s',
                    }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: selectedMethod === m.id ? '#0F172A' : '#475569' }}>{m.label}</span>
                      {selectedMethod === m.id && <i className="ti ti-circle-check-filled" style={{ fontSize: 22, color: '#6366F1' }} />}
                    </button>
                  ))}
                </div>

                {selectedMethod === 'bank' && foundInvoice && (
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px', marginBottom: 20, textAlign: 'center' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scan QRPh to Pay</p>
                    <p style={{ margin: '0 0 16px', fontSize: '0.78rem', color: '#94A3B8' }}>Open your banking app and scan below</p>
                    <div style={{ display: 'inline-flex', padding: 12, background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                      <QRCodeSVG value={qrValue} size={160} bgColor="#ffffff" fgColor="#0F172A" level="M" />
                    </div>
                    <div style={{ marginTop: 14, background: '#EEF2FF', borderRadius: 8, padding: '10px 14px' }}>
                      <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#3730A3' }}>Amount: {fmt(foundInvoice.totalAmount)}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6366F1' }}>Ref: {foundInvoice.invoiceNumber} · {loggedInClient?.name}</p>
                    </div>
                    <p style={{ margin: '10px 0 0', fontSize: '0.72rem', color: '#94A3B8' }}>Powered by InstaPay / PESONet · Test Mode</p>
                  </div>
                )}

                <button onClick={handlePayMongoCheckout} disabled={!selectedMethod || isProcessing}
                  style={{ ...btnPrimary, width: '100%', background: selectedMethod && !isProcessing ? 'linear-gradient(135deg,#10B981,#059669)' : '#E2E8F0', color: selectedMethod && !isProcessing ? '#fff' : '#94A3B8', cursor: selectedMethod && !isProcessing ? 'pointer' : 'not-allowed' }}>
                  {isProcessing ? '⟳ Generating payment link...' : 'Proceed to Payment →'}
                </button>
              </Card>
            )}

            {/* ════ UPLOAD PROOF ════ */}
            {step === 'upload' && (
              <Card>
                {renderBack('payment', 'Back to Payment Method')}
                <h2 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>Upload Proof of Payment</h2>
                <p style={{ margin: '0 0 24px', color: '#64748B', fontSize: '0.875rem' }}>Return here after completing payment in PayMongo and upload your proof.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Transaction Reference No. *</label>
                    <input value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} placeholder="Auto-filled from PayMongo" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Your Email *</label>
                    <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="email@example.com" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Proof of Payment *</label>
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px', borderRadius: 10, border: `2px dashed ${proofFile ? '#10B981' : '#E2E8F0'}`, background: proofFile ? '#F0FDF4' : '#F8FAFC', cursor: 'pointer' }}>
                      <i className={`ti ${proofFile ? 'ti-circle-check' : 'ti-cloud-upload'}`} style={{ fontSize: 30, color: proofFile ? '#10B981' : '#94A3B8' }} />
                      <span style={{ fontSize: '0.82rem', color: proofFile ? '#065F46' : '#94A3B8', fontWeight: 600 }}>{proofFile ? proofFile.name : 'Click to upload (JPG, PNG, PDF)'}</span>
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: "none" }} onChange={e => setProofFile(e.target.files?.[0] ?? null)} />
                    </label>
                    {proofFile && proofFile.type.startsWith('image/') && <img src={URL.createObjectURL(proofFile)} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, marginTop: 14, alignSelf: 'center' }} />}
                  </div>
                </div>
                <button onClick={handleSubmit} disabled={!referenceNumber || !proofFile || !clientEmail}
                  style={{ ...btnPrimary, marginTop: 24, width: '100%', background: referenceNumber && proofFile && clientEmail ? 'linear-gradient(135deg,#10B981,#059669)' : '#E2E8F0', color: referenceNumber && proofFile && clientEmail ? '#fff' : '#94A3B8', cursor: referenceNumber && proofFile && clientEmail ? 'pointer' : 'not-allowed' }}>
                  Submit for Finance Validation ✓
                </button>
              </Card>
            )}

            {/* ════ SUBMITTED ════ */}
            {step === 'submitted' && (
              <Card>
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ width: 68, height: 68, borderRadius: '50%', background: existingSubmission?.status === 'Rejected' ? '#FEF2F2' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                    <i className={`ti ${existingSubmission?.status === 'Rejected' ? 'ti-circle-x' : 'ti-circle-check'}`} style={{ fontSize: 36, color: existingSubmission?.status === 'Rejected' ? '#EF4444' : '#10B981' }} />
                  </div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                    {existingSubmission?.status === 'Rejected' ? 'Payment Rejected' : 'Payment Submitted!'}
                  </h2>
                  <p style={{ margin: '0 0 24px', color: '#64748B', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {existingSubmission?.status === 'Rejected'
                      ? 'Your proof was rejected. Please check your email and resubmit.'
                      : 'Your submission is pending Finance validation. A confirmation email has been sent.'}
                  </p>
                  <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 18px', marginBottom: 20, textAlign: 'left', border: '1px solid #E2E8F0' }}>
                    {[
                      { label: 'Invoice', value: foundInvoice?.invoiceNumber ?? '—' },
                      { label: 'Amount', value: foundInvoice ? fmt(foundInvoice.totalAmount) : '—' },
                      { label: 'Reference No.', value: existingSubmission?.referenceNumber ?? referenceNumber },
                      { label: 'Status', value: existingSubmission?.status ?? 'Pending Validation' },
                    ].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748B' }}>{r.label}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setStep('dashboard'); setFoundInvoice(null); setReferenceNumber(''); setProofFile(null); setSelectedMethod(''); setExistingSubmission(null); }}
                    style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#F1F5F9', color: '#0F172A', border: '1px solid #E2E8F0', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                    ← Back to Dashboard
                  </button>
                </div>
              </Card>
            )}

          </div>
        </main>
      </div>

      {/* ════ EMAIL MODAL ════ */}
      {showEmailModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ background: '#F8FAFC', padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ti ti-mail-check" style={{ color: '#10B981', fontSize: 20 }} />
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>Simulated Email Confirmation</span>
              </div>
              <button onClick={() => setShowEmailModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 20 }}><i className="ti ti-x" /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ margin: '0 0 3px', fontSize: '0.82rem', color: '#64748B' }}>To: <strong style={{ color: '#0F172A' }}>{clientEmail}</strong></p>
              <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#64748B' }}>Subject: <strong style={{ color: '#0F172A' }}>Payment Received (Pending Validation) – {foundInvoice?.invoiceNumber}</strong></p>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '18px 20px' }}>
                <p style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#0F172A' }}>Hi <strong>{loggedInClient?.contactPerson}</strong>,</p>
                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.7, margin: '0 0 16px' }}>
                  We've received your proof of payment for invoice <strong>{foundInvoice?.invoiceNumber}</strong>. It is currently being reviewed by the Finance Team.
                </p>
                <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', lineHeight: 1.8 }}>
                  <div><span style={{ color: '#64748B' }}>Amount: </span><strong>{foundInvoice ? fmt(foundInvoice.totalAmount) : '—'}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Reference: </span><strong>{referenceNumber}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Status: </span><strong style={{ color: '#F59E0B' }}>Pending Validation</strong></div>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>We'll notify you once the payment is validated. Thank you!</p>
              </div>
            </div>
            <div style={{ padding: '14px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEmailModal(false)} style={{ ...btnPrimary }}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' };
const btnPrimary: React.CSSProperties = { padding: '13px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#0F172A,#1E3A5F)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' };
const btnPrimarySmall: React.CSSProperties = { background: '#0F172A', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' };
const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' };
const tdStyle: React.CSSProperties = { padding: '12px 12px', color: '#475569', verticalAlign: 'middle' };
const badgeBase: React.CSSProperties = { padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' };
const emptyState: React.CSSProperties = { textAlign: 'center', padding: '40px 20px', background: '#F8FAFC', borderRadius: 12 };

export default SpeedPay;
