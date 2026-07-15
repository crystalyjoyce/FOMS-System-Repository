import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { SpeedPaySubmission } from '../data/seed';
import { StatusCard } from '../components/StatusCard';
import { Button } from '../components/Buttons';
import { useToast } from '../components/ToastContext';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';

export const SpeedPayValidation: React.FC = () => {
  const { toast } = useToast();
  const { speedPay, invoices, updateSpeedPay, updateInvoice, addReceipt, receipts, clients, addPayment } = useAppData();
  const [viewSubmission, setViewSubmission] = useState<any>(null);
  const [validationStatus, setValidationStatus] = useState<'Approve' | 'Reject'>('Approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  let filteredEnriched: any[] = [];
  if (selectedClientId) {
    filteredEnriched = speedPay.filter(s => {
      const invoice = invoices.find(i => i.id === s.invoiceId);
      const clientId = invoice ? invoice.clientId : undefined;
      return clientId === selectedClientId;
    }).map(sub => {
      const invoice = invoices.find(i => i.id === sub.invoiceId);
      const client = invoice ? clients.find(c => c.id === invoice.clientId) : undefined;
      return { ...sub, invoiceNumber: invoice?.invoiceNumber ?? sub.invoiceId, invoiceAmount: invoice?.totalAmount ?? 0, clientName: client?.name ?? sub.clientName, clientId: client?.id };
    });
  } else {
    const grouped = new Map<string, any[]>();
    speedPay.forEach(sub => {
      const invoice = invoices.find(i => i.id === sub.invoiceId);
      const clientId = invoice ? invoice.clientId : 'UNKNOWN';
      if (!grouped.has(clientId)) grouped.set(clientId, []);
      grouped.get(clientId)!.push({ ...sub, clientId });
    });
    filteredEnriched = Array.from(grouped.entries()).map(([clientId, recs]) => {
      const client = clients.find(c => c.id === clientId);
      const maxDate = new Date(Math.max(...recs.map((r: any) => new Date(r.submittedAt).getTime())));
      const statuses = Array.from(new Set(recs.map((r: any) => r.status)));
      const status = statuses.length === 1 ? statuses[0] : 'Mixed';
      
      return {
        id: clientId, 
        clientId,
        invoiceNumber: recs.length === 1 ? recs[0].invoiceNumber : '[Multiple]',
        clientName: client?.name ?? 'Unknown',
        paymentMethod: 'Mixed',
        proofFileName: 'Multiple files',
        submittedAt: maxDate.toISOString(),
        status: status,
        isGrouped: true
      };
    });
  }

  const todayStr = new Date().toLocaleDateString('en-PH');
  const kpiData = selectedClientId ? speedPay.filter(s => {
    const invoice = invoices.find(i => i.id === s.invoiceId);
    return invoice?.clientId === selectedClientId;
  }) : speedPay;
  const pending = kpiData.filter(s => s.status === 'Pending Validation').length;
  const validatedToday = kpiData.filter(s => s.status === 'Validated' && new Date(s.validatedAt || '').toLocaleDateString('en-PH') === todayStr).length;
  const rejectedToday = kpiData.filter(s => s.status === 'Rejected').length;

  const handleValidate = (row: any) => {
    if (validationStatus === 'Approve') {
      // 1. Update SpeedPay status
      updateSpeedPay(row.id, { status: 'Validated', validatedBy: 'EMP-001', validatedAt: new Date().toISOString() });

      // 2. Update Linked Invoice
      const linkedInvoice = invoices.find(i => i.id === row.invoiceId);
      if (linkedInvoice) {
        updateInvoice(linkedInvoice.id, { status: 'Paid' });
      }

      // 3. Create actual Payment record for the Payments page
      addPayment({
        id: `PAY-${Date.now()}`,
        clientId: row.clientId ?? linkedInvoice?.clientId ?? 'UNKNOWN',
        invoiceId: row.invoiceId,
        amount: row.amountPaid,
        paymentMethod: row.paymentMethod,
        referenceNumber: row.referenceNumber,
        proofOfPaymentUrl: row.proofFileUrl, // Pass the image URL down!
        recordedBy: 'EMP-001',
        recordedAt: new Date().toISOString(),
        status: 'Validated',
        bankConfirmed: true
      });
      
      // 4. Auto-generate Official Receipt
      const orNum = `OR-${new Date().getFullYear()}-${String(receipts.length + 1).padStart(4, '0')}`;
      addReceipt({
        id: `OR-${Date.now()}`,
        receiptNumber: orNum,
        invoiceId: row.invoiceId,
        paymentId: row.id,
        clientId: row.clientId ?? 'UNKNOWN',
        amount: row.amountPaid,
        referenceNumber: row.referenceNumber,
        issuedBy: 'EMP-001',
        issuedAt: new Date().toISOString()
      });
      toast.success(`SpeedPay transaction ${row.id} has been Approved and Official Receipt generated.`, 'Payment Validated');
    } else {
      updateSpeedPay(row.id, { status: 'Rejected', rejectionReason });
      toast.error(`SpeedPay transaction ${row.id} has been Rejected.`, 'Payment Rejected');
    }
    setViewSubmission(null);
  };

  const columns = [
    { key: 'id', label: 'TRANSACTION ID' },
    { key: 'clientName', label: 'CLIENT', sortable: true, render: (row: any) => (
      !selectedClientId ? (
        <button onClick={() => { if (row.clientId && row.clientId !== 'UNKNOWN') setSelectedClientId(row.clientId); }} style={{ background: 'none', border: 'none', padding: 0, color: '#3B82F6', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
          {row.clientName}
        </button>
      ) : (
        <span style={{ fontWeight: 600 }}>{row.clientName}</span>
      )
    ) },
    { key: 'invoiceNumber', label: 'LINKED INVOICE' },
    { key: 'paymentMethod', label: 'METHOD' },
    { key: 'proofFileName', label: 'PROOF', render: (row: any) => row.proofFileName ? <i className="ti ti-photo" style={{ fontSize: 18, color: '#0EA5E9' }} title={row.proofFileName} /> : 'None' },
    { key: 'submittedAt', label: 'SUBMITTED DATE', render: (row: any) => new Date(row.submittedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) },
    { key: 'status', label: 'STATUS', render: (row: any) => <StatusBadge status={row.status} /> },
  ];

  const actions = [
    {
      label: 'Validate Payment',
      icon: 'ti-check',
      onClick: (row: any) => {
        setViewSubmission(row);
        setValidationStatus('Approve');
        setRejectionReason('');
      },
      hidden: (row: any) => row.status !== 'Pending Validation'
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatusCard label="Pending Validation" value={pending} icon="ti-clock-hour-4" variant="warning" />
        <StatusCard label="Validated Today" value={validatedToday} icon="ti-shield-check" variant="success" />
        <StatusCard label="Rejected Today" value={rejectedToday} icon="ti-x" variant="danger" />
      </div>

      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <i className="ti ti-info-circle" style={{ color: '#F59E0B', fontSize: 20, flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400E' }}>
          <strong>Validation Policy:</strong> Confirm that the submitted amount matches the invoice total and that the payment has been received in the company account before approving.
        </p>
      </div>

      
      <TableContainer>
        <DataTable
          title="SpeedPay Validations"
          data={filteredEnriched}
          columns={selectedClientId ? columns : columns.filter(c => !['referenceNumber', 'proofOfPayment', 'status'].includes(c.key as string))} actions={selectedClientId ? actions : undefined} rowKey="id"
          searchPlaceholder="Search submissions..."
          searchFields={['id', 'invoiceNumber', 'clientName', 'status'] as any}
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { label: 'Pending Validation', value: 'Pending Validation' },
                { label: 'Validated', value: 'Validated' },
                { label: 'Rejected', value: 'Rejected' }
              ],
              filterFn: (row: any, val: string) => row.status === val
            }
          ]}
          emptyMessage="No SpeedPay submissions received."
          columnToggle={true} densityToggle={true} exportable={false}
        />
      </TableContainer>
      {selectedClientId && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button variant="secondary" title="← Back to Summary" onClick={() => setSelectedClientId(null)} />
        </div>
      )}

      {viewSubmission && createPortal(
        <div 
          className="modal-overlay" 
          onClick={() => setViewSubmission(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div 
            className="modal-card"
            onClick={e => e.stopPropagation()}
            style={{ 
              width: '100%', maxWidth: '560px', background: '#FFFFFF', borderRadius: '12px', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', fontFamily: 'var(--fb, var(--font-sans, "Inter", sans-serif))', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', background: '#E6F6F4', color: '#00A99D', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                  <i className="ti ti-device-mobile-check" style={{ fontSize: '20px' }} />
                </div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Validate SpeedPay</h2>
              </div>
              <button 
                onClick={() => setViewSubmission(null)}
                style={{ width: '32px', height: '32px', background: '#F1F5F9', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
              >
                <i className="ti ti-x" style={{ fontSize: 16 }} />
              </button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Read-only Data */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '6px' }}>CLIENT</label>
                  <div style={{ padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '14px', color: '#0F172A' }}>{viewSubmission.clientName}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '6px' }}>LINKED INVOICE</label>
                  <div style={{ padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '14px', color: '#0F172A' }}>{viewSubmission.invoiceNumber}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '6px' }}>INVOICE AMOUNT</label>
                  <div style={{ padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '14px', color: '#0F172A', fontWeight: 600 }}>₱{viewSubmission.invoiceAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '6px' }}>PAYMENT METHOD</label>
                  <div style={{ padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '14px', color: '#0F172A' }}>{viewSubmission.paymentMethod}</div>
                </div>
              </div>

              {/* Proof Preview */}
              {viewSubmission.proofFileName && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '6px' }}>PROOF OF PAYMENT</label>
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F8FAFC', padding: 8, textAlign: 'center' }}>
                    <img 
                      src={viewSubmission.proofFileUrl || `https://images.unsplash.com/photo-1620054707198-d1cf57a151b7?auto=format&fit=crop&w=600&q=80`} 
                      alt="Proof Preview" 
                      style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', objectFit: 'contain' }} 
                    />
                    <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{viewSubmission.proofFileName}</p>
                  </div>
                </div>
              )}

              <hr style={{ border: 0, borderTop: '1px solid #E2E8F0', margin: '8px 0' }} />

              {/* Validation Input */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>VALIDATION DECISION</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setValidationStatus('Approve')}
                    style={{ flex: 1, padding: '10px', borderRadius: '6px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', border: validationStatus === 'Approve' ? '2px solid #10B981' : '1px solid #E2E8F0', background: validationStatus === 'Approve' ? '#F0FDF4' : '#FFF', color: validationStatus === 'Approve' ? '#047857' : '#64748B' }}
                  >
                    <i className="ti ti-check" style={{ marginRight: 6 }} /> Verify
                  </button>
                  <button 
                    onClick={() => setValidationStatus('Reject')}
                    style={{ flex: 1, padding: '10px', borderRadius: '6px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', border: validationStatus === 'Reject' ? '2px solid #EF4444' : '1px solid #E2E8F0', background: validationStatus === 'Reject' ? '#FEF2F2' : '#FFF', color: validationStatus === 'Reject' ? '#B91C1C' : '#64748B' }}
                  >
                    <i className="ti ti-x" style={{ marginRight: 6 }} /> Reject
                  </button>
                </div>
              </div>

              {validationStatus === 'Reject' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>REJECTION REASON <span style={{color: '#EF4444'}}>*</span></label>
                  <textarea 
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Provide reason for rejection..."
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
              <Button title="Cancel" variant="secondary" onClick={() => setViewSubmission(null)} />
              <Button 
                title="Submit Validation" 
                onClick={() => handleValidate(viewSubmission)} 
                disabled={validationStatus === 'Reject' && !rejectionReason.trim()}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SpeedPayValidation;
