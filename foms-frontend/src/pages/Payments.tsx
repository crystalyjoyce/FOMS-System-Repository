import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { SEEDED_CLIENTS, Payment } from '../data/seed';
import { useAuth } from '../context/AuthContext';
import { useAudit } from '../context/AuditContext';
import { useToast } from '../components/ToastContext';
import { StatusCard } from '../components/StatusCard';
import { Button } from '../components/Buttons';
import { Card } from '../components/Card';
import { CalendarPicker } from '../components/FormModals';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';
import { ClientInfoCard } from '../components/ClientInfoCard';

const safeFormatDate = (dateVal: string | Date | undefined | null, options?: Intl.DateTimeFormatOptions) => {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-PH', options || { month: 'short', day: 'numeric', year: 'numeric' });
};
export const Payments: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logAction } = useAudit();
  const { id: clientIdParam } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const actionParam = searchParams.get('action') || 'view';
  const paymentIdParam = searchParams.get('paymentId');

  const isFinanceManager = user?.role === 'Finance Manager';
  const isAssistant = user?.role === 'Assistant of Finance Manager';
  const isHeadAccountant = user?.role === 'Head Accountant';
  const isAccountant = user?.role === 'Accountant';

  const [showForm, setShowForm] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('Approve & Mark as Deposited');
  const [approvalStatus, setApprovalStatus] = useState<'Approve' | 'Return for Review'>('Approve');
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [form, setForm] = useState({
    invoiceId: '', amount: '', paymentMethod: 'Bank Transfer', referenceNumber: '', bankConfirmed: false, notes: '', datePaid: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const { payments, invoices, speedPay, clients, updatePayment, addPayment, updateInvoice, addReceipt, receipts } = useAppData();

  let allowedPayments = payments;
  if (isAssistant || isHeadAccountant) allowedPayments = payments.filter(p => p.status === 'Pending Validation');
  else if (isFinanceManager) allowedPayments = payments.filter(p => p.status === 'Validated');

  const filteredPayments = clientIdParam ? allowedPayments.filter(p => p.clientId === clientIdParam) : allowedPayments;

  const totalVerified = useMemo(() => filteredPayments.filter(p => p.status === 'Validated' || p.status === 'Approved').reduce((s, p) => s + p.amount, 0), [filteredPayments]);
  const filteredSpeedPay = clientIdParam ? speedPay.filter(s => {
      const invoice = invoices.find(i => i.id === s.invoiceId);
      return invoice?.clientId === clientIdParam;
    }) : speedPay;
  const pendingSpeedPay = filteredSpeedPay.filter(s => s.status === 'Pending Validation').length;
  const pendingFinal = useMemo(() => filteredPayments.filter(p => p.status === 'Validated').length, [filteredPayments]);
  const checkCount = useMemo(() => filteredPayments.filter(p => p.paymentMethod === 'Check').length, [filteredPayments]);
  const obtCount = useMemo(() => filteredPayments.filter(p => p.paymentMethod === 'Online Bank Transfer').length, [filteredPayments]);

  const unpaidInvoices = invoices.filter(i => ['Sent', 'Overdue', 'Approved', 'Finalized', 'Verified'].includes(i.status));

  let enriched: any[] = [];
  if (clientIdParam) {
    enriched = allowedPayments.filter(p => p.clientId === clientIdParam).map(p => {
      const client = clients.find(c => c.id === p.clientId);
      const invoice = invoices.find(i => i.id === p.invoiceId);
      return { ...p, clientName: client?.name ?? 'Unknown', invoiceNumber: invoice?.invoiceNumber ?? p.invoiceId };
    });
  } else {
    const grouped = new Map<string, any[]>();
    allowedPayments.forEach(p => {
      if (!grouped.has(p.clientId)) grouped.set(p.clientId, []);
      grouped.get(p.clientId)!.push(p);
    });
    enriched = Array.from(grouped.entries()).map(([clientId, recs]) => {
      const client = clients.find(c => c.id === clientId);
      const statuses = Array.from(new Set(recs.map(r => r.status)));
      const status = statuses.length === 1 ? statuses[0] : 'Mixed';
      const maxDate = new Date(Math.max(...recs.map(r => new Date(r.recordedAt).getTime())));
      
      return {
        id: clientId, 
        clientId,
        paymentId: recs.length === 1 ? recs[0].id : undefined,
        invoiceNumber: recs.length === 1 ? recs[0].invoiceNumber : '[Multiple]',
        clientName: client?.name ?? 'Unknown',
        paymentMethod: 'Mixed',
        referenceNumber: 'Mixed',
        amount: recs.reduce((sum, r) => sum + r.amount, 0),
        recordedAt: isNaN(maxDate.getTime()) ? new Date().toISOString() : maxDate.toISOString(),
        status: status,
        isGrouped: true
      };
    });
  }

  const columns = [
    { key: 'id', label: 'PAYMENT ID' },
    { key: 'clientName', label: 'CLIENT NAME', sortable: true, render: (row: any) => (
      !clientIdParam ? (
        <span onClick={() => navigate(`/payments/${row.id}`)} style={{ color: '#0F172A', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
          {row.clientName}
        </span>
      ) : (
        <span style={{ fontWeight: 600 }}>{row.clientName}</span>
      )
    ) },
    { key: 'invoiceNumber', label: 'LINKED INVOICE NO.' },
    { key: 'paymentMethod', label: 'PAYMENT MODE' },
    { key: 'referenceNumber', label: 'REFERENCE / CHECK NO.' },
    { key: 'amount', label: 'AMOUNT PAID', render: (row: any) => `₱${row.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
    { key: 'recordedAt', label: 'PAYMENT DATE', render: (row: any) => safeFormatDate(row.recordedAt) },
    { key: 'status', label: 'VERIFICATION STATUS', render: (row: any) => {
        let displayStatus = row.status;
        if (displayStatus === 'Pending Validation') displayStatus = 'Pending Verification';
        if (displayStatus === 'Validated') displayStatus = 'Verified & Deposited';
        return <StatusBadge status={displayStatus} />;
      } 
    },
  ];

  const fmActions = [
    {
      label: 'Final Approve',
      icon: 'ti-shield-check',
      onClick: (row: any) => {
        navigate(`/payments/${clientIdParam || row.clientId}?paymentId=${row.paymentId || row.id}&action=view`);
      },
      hidden: (row: any) => row.status !== 'Validated',
    },
    {
      label: 'View Receipt',
      icon: 'ti-receipt',
      onClick: (row: any) => navigate(`/payments/${clientIdParam || row.clientId}?paymentId=${row.paymentId || row.id}&action=receipt`),
      hidden: (row: any) => row.status !== 'Approved',
    },
    {
      label: 'View Details',
      icon: 'ti-eye',
      onClick: (row: any) => navigate(`/payments/${clientIdParam || row.clientId}?paymentId=${row.paymentId || row.id}&action=view`),
      hidden: (row: any) => row.status !== 'Rejected',
    }
  ];

  const assistantActions = [
    {
      label: 'View Details',
      icon: 'ti-eye',
      onClick: (row: any) => {
        navigate(`/payments/${clientIdParam || row.clientId}?paymentId=${row.paymentId || row.id}&action=view`);
      },
      hidden: (row: any) => row.status !== 'Pending Validation',
    },
    {
      label: 'View Receipt',
      icon: 'ti-receipt',
      onClick: (row: any) => navigate(`/payments/${clientIdParam || row.clientId}?paymentId=${row.paymentId || row.id}&action=receipt`),
      hidden: (row: any) => row.status !== 'Validated' && row.status !== 'Approved',
    },
    {
      label: 'View Details',
      icon: 'ti-eye',
      onClick: (row: any) => navigate(`/payments/${clientIdParam || row.clientId}?paymentId=${row.paymentId || row.id}&action=view`),
      hidden: (row: any) => row.status !== 'Rejected',
    }
  ];

  const accountantActions = [
    {
      label: 'View Details',
      icon: 'ti-eye',
      onClick: (row: any) => navigate(`/payments/${clientIdParam || row.clientId}?paymentId=${row.paymentId || row.id}&action=view`),
      hidden: (row: any) => row.status !== 'Rejected',
    }
  ];

  let actions: any[] = [];
  if (isFinanceManager) actions = fmActions;
  else if (isAssistant || isHeadAccountant) actions = assistantActions;
  else if (isAccountant) actions = accountantActions;

  // Form submission handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.invoiceId || !form.referenceNumber) return;
    setSubmitted(true);
    setShowForm(false);
    const invoice = invoices.find(i => i.id === form.invoiceId);
    if (invoice) {
      addPayment({
        id: `PAY-${Date.now()}`,
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        amount: parseFloat(form.amount) || invoice.totalAmount,
        paymentMethod: form.paymentMethod as any,
        referenceNumber: form.referenceNumber,
        bankConfirmed: false,
        recordedBy: user?.employeeId || 'EMP-000',
        status: 'Pending Validation',
        recordedAt: new Date().toISOString(),
        notes: form.notes
      });
    }
    logAction('PAYMENT_RECORDED', 'Payments', 'Payment', `PAY-${Date.now()}`, `Recorded payment for Invoice ${form.invoiceId}`, user?.fullName || 'User', user?.role || 'Role', user?.employeeId || 'EMP-000');
    setForm({ invoiceId: '', amount: '', paymentMethod: 'Online Bank Transfer', referenceNumber: '', bankConfirmed: false, notes: '', datePaid: '' });
  };

  const handleAFMSubmit = (viewPayment: any) => {
    if (verificationStatus === 'Reject' && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.", "Required Field Missing");
      return;
    }
    if (verificationStatus === 'Reject') {
      updatePayment(viewPayment.id, { status: 'Rejected', notes: rejectionReason });
      logAction('PAYMENT_REJECTED', 'Payments', 'Payment', viewPayment.id, `Rejected payment ${viewPayment.id}`, user?.fullName || 'User', user?.role || 'Role', user?.employeeId || 'EMP-000');
      toast.error(`Payment ${viewPayment.id} rejected.`, 'Payment Rejected');
    } else {
      updatePayment(viewPayment.id, { status: 'Validated', validatedBy: user?.fullName || 'AFM', validatedAt: new Date().toISOString() });
      logAction('PAYMENT_VALIDATED', 'Payments', 'Payment', viewPayment.id, `Validated payment ${viewPayment.id}`, user?.fullName || 'User', user?.role || 'Role', user?.employeeId || 'EMP-000');
      toast.success(`Payment ${viewPayment.id} validated.`, 'Payment Validated');
    }
    navigate('/payments');
  };

  const handleFMSubmit = (viewPayment: any) => {
    if (approvalStatus === 'Return for Review' && !rejectionReason.trim()) {
      toast.error("Please provide remarks for returning.", "Required Field Missing");
      return;
    }
    if (approvalStatus === 'Return for Review') {
      updatePayment(viewPayment.id, { status: 'Pending Validation', notes: rejectionReason });
      logAction('PAYMENT_RETURNED', 'Payments', 'Payment', viewPayment.id, `Returned payment ${viewPayment.id} for review`, user?.fullName || 'User', user?.role || 'Role', user?.employeeId || 'EMP-000');
      toast.info(`Payment ${viewPayment.id} returned for review.`, 'Payment Returned');
    } else {
      // Approve: mark payment, mark invoice as Paid, generate receipt
      updatePayment(viewPayment.id, { status: 'Approved' });
      updateInvoice(viewPayment.invoiceId, { status: 'Paid' });
      const orNum = `OR-${new Date().getFullYear()}-${String(receipts.length + 1).padStart(4, '0')}`;
      addReceipt({
        id: `OR-${Date.now()}`,
        receiptNumber: orNum,
        invoiceId: viewPayment.invoiceId,
        paymentId: viewPayment.id,
        clientId: viewPayment.clientId,
        amount: viewPayment.amount,
        referenceNumber: viewPayment.referenceNumber,
        issuedBy: user?.employeeId || 'EMP-001',
        issuedAt: new Date().toISOString(),
      });
      logAction('PAYMENT_APPROVED', 'Payments', 'Payment', viewPayment.id, `Final approval for payment ${viewPayment.id}`, user?.fullName || 'User', user?.role || 'Role', user?.employeeId || 'EMP-000');
      toast.success(`Payment ${viewPayment.id} approved. Invoice marked as Paid and receipt generated.`, 'Payment Approved');
    }
    navigate('/payments');
  };

  // --- Detail Views ---
  if (paymentIdParam) {
    const viewPaymentRaw = allowedPayments.find(p => p.id === paymentIdParam);
    if (!viewPaymentRaw) return <div>Payment not found</div>;

    const client = clients.find(c => c.id === viewPaymentRaw.clientId);
    const invoice = invoices.find(i => i.id === viewPaymentRaw.invoiceId);
    const viewPayment = {
      ...viewPaymentRaw,
      clientName: client?.name ?? 'Unknown',
      invoiceNumber: invoice?.invoiceNumber ?? viewPaymentRaw.invoiceId
    };

    if (actionParam === 'view') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div onClick={() => navigate(clientIdParam ? `/payments/${clientIdParam}` : '/payments')} style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, width: 'fit-content' }}>
            <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i> Back to Payments
          </div>

          <Card>
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ margin: '0 0 -8px', fontSize: '1rem', color: '#0F172A', fontWeight: 700 }}>{isFinanceManager ? 'Final Approval' : 'Payment Details'}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CLIENT NAME</label>
                  <input type="text" value={viewPayment.clientName} disabled style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>INVOICE REF NO.</label>
                  <input type="text" value={viewPayment.invoiceNumber} disabled style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PAYMENT METHOD</label>
                  <input type="text" value={viewPayment.paymentMethod} disabled style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REFERENCE NUMBER</label>
                  <input type="text" value={viewPayment.referenceNumber} disabled style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none', fontFamily: 'monospace', fontWeight: 600 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AMOUNT</label>
                  <input type="text" value={`₱${viewPayment.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} disabled style={{ padding: '12px 16px', border: '1px solid #10B981', borderRadius: '8px', fontSize: '14px', color: '#10B981', fontWeight: 700, background: '#F0FDF4', outline: 'none' }} />
                </div>

                {isFinanceManager ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>VERIFIED BY</label>
                    <input type="text" value={`${viewPayment.validatedBy || 'AFM'} on ${safeFormatDate(viewPayment.validatedAt || new Date(), { month: 'numeric', day: 'numeric', year: 'numeric' })}`} disabled style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none' }} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DATE RECORDED</label>
                    <input type="text" value={safeFormatDate(viewPayment.recordedAt, { month: 'long', day: 'numeric', year: 'numeric' })} disabled style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none' }} />
                  </div>
                )}
              </div>

              {viewPayment.proofOfPaymentUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PROOF OF PAYMENT</label>
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F8FAFC', padding: 8, textAlign: 'center' }}>
                    <img 
                      src={viewPayment.proofOfPaymentUrl} 
                      alt="Proof Preview" 
                      style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px', objectFit: 'contain' }} 
                    />
                  </div>
                </div>
              )}

              {viewPayment.status === 'Rejected' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REJECTION REASON</label>
                  <textarea value={(viewPayment as any).rejectionReason || viewPayment.notes} disabled rows={2} style={{ padding: '12px 16px', border: '1px solid #FCA5A5', borderRadius: '8px', fontSize: '14px', color: '#991B1B', background: '#FEF2F2', outline: 'none', resize: 'none' }} />
                </div>
              )}

              {(!isFinanceManager && (isAssistant || isHeadAccountant)) && viewPayment.status === 'Pending Validation' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>VERIFICATION ACTION</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setVerificationStatus('Validate')} style={{ flex: 1, padding: '10px', borderRadius: '6px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', border: verificationStatus === 'Validate' ? '2px solid #10B981' : '1px solid #E2E8F0', background: verificationStatus === 'Validate' ? '#F0FDF4' : '#FFF', color: verificationStatus === 'Validate' ? '#047857' : '#64748B' }}>
                        <i className="ti ti-check" style={{ marginRight: 6 }} /> Validate
                      </button>
                      <button onClick={() => setVerificationStatus('Reject')} style={{ flex: 1, padding: '10px', borderRadius: '6px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', border: verificationStatus === 'Reject' ? '2px solid #EF4444' : '1px solid #E2E8F0', background: verificationStatus === 'Reject' ? '#FEF2F2' : '#FFF', color: verificationStatus === 'Reject' ? '#B91C1C' : '#64748B' }}>
                        <i className="ti ti-x" style={{ marginRight: 6 }} /> Reject
                      </button>
                    </div>
                  </div>

                  {verificationStatus === 'Reject' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REJECTION REASON</label>
                      <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="e.g. Maling reference number..." rows={2} style={{ padding: '12px 16px', border: '1px solid #FCA5A5', borderRadius: '8px', fontSize: '14px', color: '#991B1B', background: '#FEF2F2', outline: 'none', resize: 'none' }} />
                    </div>
                  )}
                </>
              )}

              {isFinanceManager && viewPayment.status === 'Validated' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>FINAL DECISION</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <select
                        value={approvalStatus}
                        onChange={(e) => setApprovalStatus(e.target.value as 'Approve' | 'Return for Review')}
                        style={{ flex: 1, padding: '10px', border: approvalStatus === 'Approve' ? '2px solid #10B981' : '2px solid #F59E0B', borderRadius: '6px', fontSize: '14px', outline: 'none', background: approvalStatus === 'Approve' ? '#F0FDF4' : '#FFFBEB', color: approvalStatus === 'Approve' ? '#047857' : '#B45309', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                      >
                        <option value="Approve">Approve</option>
                        <option value="Return for Review">Return for Review</option>
                      </select>
                    </div>
                  </div>

                  {approvalStatus === 'Return for Review' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REMARKS FOR ASSISTANT</label>
                      <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Provide instructions for correction..." rows={2} style={{ padding: '12px 16px', border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '14px', color: '#92400E', background: '#FFFBEB', outline: 'none', resize: 'none' }} />
                    </div>
                  )}
                </>
              )}

              <hr style={{ border: 0, borderTop: '1px solid #E2E8F0', margin: 0 }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <Button title="Cancel" variant="secondary" onClick={() => navigate('/payments')} />
                {isFinanceManager && viewPayment.status === 'Validated' ? (
                  <Button 
                    title={approvalStatus === 'Return for Review' ? "Return" : "Confirm Final Approval"} 
                    variant={approvalStatus === 'Return for Review' ? "secondary" : "primary"}
                    onClick={() => handleFMSubmit(viewPayment)} 
                  />
                ) : ((isAssistant || isHeadAccountant) && viewPayment.status === 'Pending Validation') ? (
                  <Button 
                    title={verificationStatus === 'Reject' ? "Reject Payment" : "Submit Validation"} 
                    variant={verificationStatus === 'Reject' ? "secondary" : "primary"}
                    onClick={() => handleAFMSubmit(viewPayment)} 
                  />
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      );
    } else if (actionParam === 'receipt') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div onClick={() => navigate(clientIdParam ? `/payments/${clientIdParam}` : '/payments')} style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, width: 'fit-content' }}>
            <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i> Back to Payments
          </div>

          <Card>
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ margin: '0 0 -8px', fontSize: '1rem', color: '#0F172A', fontWeight: 700 }}>Official Receipt Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR NUMBER</label>
                  <input type="text" value={`OR-2026-${viewPayment.invoiceNumber?.slice(-4) || '0000'}`} disabled style={{ padding: '12px 16px', border: '1px solid #FCD34D', borderRadius: '8px', fontSize: '14px', color: '#92400E', background: '#FFFBEB', outline: 'none', fontWeight: 700 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DATE ISSUED</label>
                  <input type="text" value={safeFormatDate(viewPayment.recordedAt || new Date())} disabled style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CLIENT NAME</label>
                  <input type="text" value={viewPayment.clientName} disabled style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LINKED INVOICE NO.</label>
                  <input type="text" value={viewPayment.invoiceNumber} disabled style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PAYMENT METHOD</label>
                  <input type="text" value={viewPayment.paymentMethod} disabled style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REFERENCE NUMBER</label>
                  <input type="text" value={viewPayment.referenceNumber} disabled style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none', fontFamily: 'monospace' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AMOUNT RECEIVED</label>
                  <input type="text" value={`₱${viewPayment.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} disabled style={{ padding: '12px 16px', border: '1px solid #10B981', borderRadius: '8px', fontSize: '14px', color: '#10B981', fontWeight: 700, background: '#F0FDF4', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LINKED PAYMENT ID</label>
                  <input type="text" value={viewPayment.id} disabled style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none', fontWeight: 600 }} />
                </div>
              </div>

              <hr style={{ border: 0, borderTop: '1px solid #E2E8F0', margin: 0 }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <Button title="Close" variant="secondary" onClick={() => navigate('/payments')} />
                <Button 
                  title="Print / Download PDF" 
                  variant="primary" 
                  icon="ti-file-download"
                  onClick={() => toast.info(`Downloading PDF Official Receipt for ${viewPayment.invoiceNumber}...`, 'Download Started')}
                />
              </div>
            </div>
          </Card>
        </div>
      );
    }
  }

  // --- Client Detail View ---
  if (clientIdParam) {
    const client = clients.find(c => c.id === clientIdParam);
    if (!client) return <div>Client not found</div>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div onClick={() => navigate('/payments')} style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, width: 'fit-content' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i> Back to Payments
        </div>
        
        <ClientInfoCard client={client} />

        <Card>
          <div style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#0F172A', fontWeight: 700 }}>Payment Transaction History</h3>
            <DataTable 
              data={enriched} 
              columns={columns.filter(c => c.key !== 'clientName')} 
              actions={actions} 
              rowKey="id"
              searchPlaceholder="Search payments..."
              searchFields={['invoiceNumber', 'referenceNumber', 'status'] as any}
              filters={[{
                key: 'status', label: 'All Statuses', options: [
                  { label: 'Pending Validation', value: 'Pending Validation' },
                  { label: 'Validated', value: 'Validated' },
                  { label: 'Approved', value: 'Approved' },
                  { label: 'Rejected', value: 'Rejected' }
                ],
                filterFn: (row: any, val: string) => row.status === val
              }]}
              emptyMessage="No payment records found for this client."
              columnToggle={true} densityToggle={true} exportable={false}
              createButtons={isAccountant ? [{
                label: '+ Record Payment',
                variant: 'primary',
                onClick: () => setShowForm(true)
              }] : []}
            />
          </div>
        </Card>

        {showForm && createPortal(
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 99999, padding: '20px'
          }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Record Payment</h3>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 20 }}>×</button>
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Invoice No. *</label>
                  <select required value={form.invoiceId} onChange={e => {
                      const inv = unpaidInvoices.find(i => i.id === e.target.value);
                      setForm(f => ({ ...f, invoiceId: e.target.value, amount: inv ? inv.totalAmount.toString() : '' }));
                    }}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.9rem', boxSizing: 'border-box' }}>
                    <option value="">Select an unpaid invoice...</option>
                    {unpaidInvoices.map(inv => {
                      const clientInfo = SEEDED_CLIENTS.find(c => c.id === inv.clientId);
                      return <option key={inv.id} value={inv.id}>{inv.invoiceNumber} — {clientInfo?.name} — ₱{inv.totalAmount.toFixed(2)}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Amount Paid *</label>
                  <input required type="number" step="0.01" placeholder="0.00" value={form.amount} disabled
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#E2E8F0', color: '#475569', fontSize: '0.9rem', boxSizing: 'border-box', fontWeight: 600 }} />
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#DC2626', fontWeight: 600 }}>Partial payments are not permitted.</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Payment Method *</label>
                  <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.9rem', boxSizing: 'border-box' }}>
                    <option value="Check">Check</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Reference No. *</label>
                  <input required type="text" placeholder="e.g. BPI-887211" value={form.referenceNumber}
                    onChange={e => setForm(f => ({ ...f, referenceNumber: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <CalendarPicker
                    label="DATE PAID"
                    value={form.datePaid}
                    onChange={v => setForm(f => ({ ...f, datePaid: v }))}
                    required={true}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Upload Proof of Payment</label>
                  <input type="file"
                    style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px dashed #CBD5E1', background: '#F8FAFC', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                </div>
                {!isFinanceManager && (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <input type="checkbox" id="bankConfirmed" checked={form.bankConfirmed} onChange={e => setForm(f => ({ ...f, bankConfirmed: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    <label htmlFor="bankConfirmed" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}>
                      I confirm that this payment has been received and entered into the company account.
                    </label>
                  </div>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Notes (Optional)</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional payment notes..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.9rem', resize: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 24px', borderRadius: 8, background: '#F1F5F9', color: '#475569', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button
                    type="submit"
                    disabled={!form.invoiceId || !form.referenceNumber || !form.datePaid}
                    style={{ padding: '10px 24px', borderRadius: 8, background: (!form.invoiceId || !form.referenceNumber || !form.datePaid) ? '#94A3B8' : '#0F172A', color: '#fff', border: 'none', fontWeight: 700, cursor: (!form.invoiceId || !form.referenceNumber || !form.datePaid) ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>Record Payment</button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // --- List View — Cash Flow Table ---
  // Build a flat per-transaction cash flow list from real payments
  const cashFlowRows = payments.map(p => {
    const cli = clients.find(c => c.id === p.clientId) ?? SEEDED_CLIENTS.find(c => c.id === p.clientId);
    const invoice = invoices.find(i => i.id === p.invoiceId);
    return {
      ...p,
      clientName: (p as any).clientName ?? cli?.name ?? p.clientId ?? '—',
      invoiceNumber: (p as any).invoiceNumber ?? invoice?.invoiceNumber ?? p.invoiceId ?? '—',
      inflowType: 'Client Collection',
    };
  });

  // Also include validated SpeedPay as inflow rows
  const speedPayRows = speedPay
    .filter(s => s.status === 'Validated')
    .map(s => {
      const invoice = invoices.find(i => i.id === s.invoiceId);
      const cli = clients.find(c => c.id === (s as any).clientId);
      return {
        id: `SP-${s.id}`,
        clientId: (s as any).clientId ?? '',
        clientName: cli?.name ?? s.clientName ?? '—',
        invoiceId: s.invoiceId,
        invoiceNumber: s.invoiceNumber ?? invoice?.invoiceNumber ?? s.invoiceId ?? '—',
        amount: s.amountPaid ?? 0,
        paymentMethod: s.paymentMethod,
        referenceNumber: s.referenceNumber,
        recordedAt: s.submittedAt,
        status: 'Validated' as const,
        inflowType: 'SpeedPay Collection',
        proofOfPaymentUrl: s.proofFileUrl,
      };
    });

  const allCashFlowRows = [...cashFlowRows, ...speedPayRows]
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  const totalInflow = allCashFlowRows
    .filter(r => r.status === 'Validated' || r.status === 'Approved')
    .reduce((sum, r) => sum + r.amount, 0);
  const pendingInflow = allCashFlowRows
    .filter(r => r.status === 'Pending Validation')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Cash Inflow', value: `₱${totalInflow.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`, color: '#10B981', icon: 'ti-trending-up', sub: 'Validated & Approved' },
          { label: 'Pending Validation', value: `₱${pendingInflow.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`, color: '#F59E0B', icon: 'ti-clock', sub: 'Awaiting verification' },
          { label: 'Total Transactions', value: allCashFlowRows.length, color: '#6366F1', icon: 'ti-list', sub: `${cashFlowRows.length} manual + ${speedPayRows.length} SpeedPay` },
          { label: 'SpeedPay Collections', value: speedPayRows.length, color: '#0EA5E9', icon: 'ti-device-mobile-message', sub: 'Via SpeedPay portal' },
        ].map(kpi => (
          <div 
            key={kpi.label} 
            style={{ 
              background: '#fff', 
              border: '1px solid #E2E8F0', 
              borderTop: '4px solid transparent',
              borderRadius: 12, 
              padding: '16px 24px', 
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderTop = `4px solid ${kpi.color}`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderTop = '4px solid transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: kpi.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`ti ${kpi.icon}`} style={{ fontSize: 20, color: kpi.color }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>{kpi.value}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>{kpi.label}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Cash Flow Table */}
      <TableContainer>
        <DataTable
          data={allCashFlowRows}
          columns={[
            {
              key: 'clientName', label: 'CLIENT', sortable: true,
              render: (row: any) => (
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{row.clientName}</div>
                  {row.clientId && <div style={{ fontSize: 11, color: '#94A3B8' }}>{row.clientId}</div>}
                </div>
              )
            },
            {
              key: 'invoiceNumber', label: 'TRANSACTION / INVOICE',
              render: (row: any) => (
                <div>
                  <div style={{ fontWeight: 600, color: '#0F172A', fontFamily: 'monospace', fontSize: 12 }}>{row.invoiceNumber}</div>
                  <div style={{
                    display: 'inline-block', marginTop: 2, padding: '1px 8px', borderRadius: 20,
                    fontSize: 10, fontWeight: 700,
                    background: row.inflowType === 'SpeedPay Collection' ? '#EEF2FF' : '#F0FDF4',
                    color: row.inflowType === 'SpeedPay Collection' ? '#4338CA' : '#047857'
                  }}>
                    {row.inflowType}
                  </div>
                </div>
              )
            },
            {
              key: 'amount', label: 'AMOUNT', sortable: true,
              render: (row: any) => (
                <span style={{ fontWeight: 800, color: '#10B981', fontSize: 14 }}>
                  +₱{Number(row.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              )
            },
            {
              key: 'paymentMethod', label: 'METHOD',
              render: (row: any) => {
                const colors: Record<string, string> = { GCash: '#007AFF', Maya: '#00AA6C', 'Bank Transfer': '#1E3A5F', Cash: '#047857', Check: '#7C3AED' };
                const c = colors[row.paymentMethod] ?? '#64748B';
                return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + '18', color: c }}>{row.paymentMethod}</span>;
              }
            },
            {
              key: 'referenceNumber', label: 'REFERENCE NO.',
              render: (row: any) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>{row.referenceNumber || '—'}</span>
            },
            {
              key: 'recordedAt', label: 'DATE', sortable: true,
              render: (row: any) => safeFormatDate(row.recordedAt)
            },
            {
              key: 'status', label: 'STATUS',
              render: (row: any) => <StatusBadge status={row.status} />
            },
          ]}
          rowKey="id"
          title="Cash Flow — Payment Transactions"
          searchPlaceholder="Search by client, invoice, or reference..."
          searchFields={['clientName', 'invoiceNumber', 'referenceNumber'] as any}
          emptyMessage="No payment transactions found. Payments will appear here once clients submit via SpeedPay or records are manually entered."
          columnToggle={true} densityToggle={true} exportable={false}
          filters={[{
            key: 'status', label: 'All Statuses', options: [
              { label: 'Pending Validation', value: 'Pending Validation' },
              { label: 'Validated', value: 'Validated' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Rejected', value: 'Rejected' }
            ],
            filterFn: (row: any, val: string) => row.status === val
          }]}
          actions={[]}
        />
      </TableContainer>
    </div>
  );

};

export default Payments;
