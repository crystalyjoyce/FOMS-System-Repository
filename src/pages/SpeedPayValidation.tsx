import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { SpeedPaySubmission } from '../data/seed';
import { StatusCard } from '../components/StatusCard';
import { Card } from '../components/Card';
import { Button } from '../components/Buttons';
import { useToast } from '../components/ToastContext';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';
import { ClientInfoCard } from '../components/ClientInfoCard';

export const SpeedPayValidation: React.FC = () => {
  const { toast } = useToast();
  const { id: clientIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get('submissionId');
  const navigate = useNavigate();
  const { speedPay, invoices, updateSpeedPay, updateInvoice, addReceipt, receipts, clients, addPayment } = useAppData();
  
  const [validationStatus, setValidationStatus] = useState<'Approve' | 'Reject'>('Approve');
  const [rejectionReason, setRejectionReason] = useState('');

  let filteredEnriched: any[] = [];
  if (clientIdParam) {
    filteredEnriched = speedPay.filter(s => {
      const invoice = invoices.find(i => i.id === s.invoiceId);
      const clientId = invoice ? invoice.clientId : undefined;
      return clientId === clientIdParam;
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
        submissionId: recs.length === 1 ? recs[0].id : undefined,
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
  const kpiData = clientIdParam ? speedPay.filter(s => {
    const invoice = invoices.find(i => i.id === s.invoiceId);
    return invoice?.clientId === clientIdParam;
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
    navigate(`/speedpay-validation/${clientIdParam}`);
  };

  const columns = [
    { key: 'id', label: 'TRANSACTION ID' },
    { key: 'clientName', label: 'CLIENT NAME', sortable: true, render: (row: any) => (
      !clientIdParam ? (
        <span onClick={() => { if (row.clientId && row.clientId !== 'UNKNOWN') navigate(`/speedpay-validation/${row.clientId}`); }} style={{ color: '#0F172A', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
          {row.clientName}
        </span>
      ) : (
        <span style={{ fontWeight: 600 }}>{row.clientName}</span>
      )
    ) },
    { key: 'invoiceNumber', label: 'LINKED INVOICE NO.' },
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
        setValidationStatus('Approve');
        setRejectionReason('');
        navigate(`/speedpay-validation/${clientIdParam}?submissionId=${row.submissionId || row.id}`);
      },
      hidden: (row: any) => row.status !== 'Pending Validation'
    },
  ];

  // --- Detail View ---
  if (submissionId) {
    const rawSubmission = speedPay.find(s => s.id === submissionId);
    if (!rawSubmission) return <div>Submission not found</div>;

    const invoice = invoices.find(i => i.id === rawSubmission.invoiceId);
    const client = invoice ? clients.find(c => c.id === invoice.clientId) : undefined;
    const viewSubmission = { 
      ...rawSubmission, 
      invoiceNumber: invoice?.invoiceNumber ?? rawSubmission.invoiceId, 
      invoiceAmount: invoice?.totalAmount ?? 0, 
      clientName: client?.name ?? rawSubmission.clientName, 
      clientId: client?.id 
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div onClick={() => navigate(`/speedpay-validation/${clientIdParam}`)} style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, width: 'fit-content' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i> Back to Queue
        </div>

        <Card>
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ margin: '0 0 -8px', fontSize: '1rem', color: '#0F172A', fontWeight: 700 }}>Validate SpeedPay</h3>
            
            {/* Read-only Data */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '6px' }}>CLIENT</label>
                <div style={{ padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A' }}>{viewSubmission.clientName}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '6px' }}>LINKED INVOICE</label>
                <div style={{ padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A' }}>{viewSubmission.invoiceNumber}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '6px' }}>INVOICE AMOUNT</label>
                <div style={{ padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', fontWeight: 600 }}>₱{viewSubmission.invoiceAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '6px' }}>PAYMENT METHOD</label>
                <div style={{ padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A' }}>{viewSubmission.paymentMethod}</div>
              </div>
            </div>

            {/* Proof Preview */}
            {viewSubmission.proofFileName && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '6px' }}>PROOF OF PAYMENT</label>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F8FAFC', padding: '16px', textAlign: 'center' }}>
                  <img 
                    src={viewSubmission.proofFileUrl || `https://images.unsplash.com/photo-1620054707198-d1cf57a151b7?auto=format&fit=crop&w=600&q=80`} 
                    alt="Proof Preview" 
                    style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px', objectFit: 'contain' }} 
                  />
                  <p style={{ margin: '12px 0 0', fontSize: '14px', color: '#64748B', fontWeight: 600 }}>{viewSubmission.proofFileName}</p>
                </div>
              </div>
            )}

            <hr style={{ border: 0, borderTop: '1px solid #E2E8F0' }} />

            {/* Validation Input */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>VALIDATION DECISION</label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  onClick={() => setValidationStatus('Approve')}
                  style={{ flex: 1, padding: '16px', borderRadius: '8px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', border: validationStatus === 'Approve' ? '2px solid #10B981' : '1px solid #E2E8F0', background: validationStatus === 'Approve' ? '#F0FDF4' : '#FFF', color: validationStatus === 'Approve' ? '#047857' : '#64748B' }}
                >
                  <i className="ti ti-check" style={{ marginRight: 8 }} /> Verify
                </button>
                <button 
                  onClick={() => setValidationStatus('Reject')}
                  style={{ flex: 1, padding: '16px', borderRadius: '8px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', border: validationStatus === 'Reject' ? '2px solid #EF4444' : '1px solid #E2E8F0', background: validationStatus === 'Reject' ? '#FEF2F2' : '#FFF', color: validationStatus === 'Reject' ? '#B91C1C' : '#64748B' }}
                >
                  <i className="ti ti-x" style={{ marginRight: 8 }} /> Reject
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
                  rows={4}
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                />
              </div>
            )}

            <hr style={{ border: 0, borderTop: '1px solid #E2E8F0', margin: 0 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <Button title="Cancel" variant="secondary" onClick={() => navigate(`/speedpay-validation/${clientIdParam}`)} />
              <Button 
                title="Submit Validation" 
                onClick={() => handleValidate(viewSubmission)} 
                disabled={validationStatus === 'Reject' && !rejectionReason.trim()}
              />
            </div>
            
          </div>
        </Card>
      </div>
    );
  }

  // --- Client Summary Drill-down View ---
  if (clientIdParam) {
    const client = clients.find(c => c.id === clientIdParam);
    if (!client) return <div>Client not found</div>;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div onClick={() => navigate('/speedpay-validation')} style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, width: 'fit-content' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i> Back to SpeedPay Validations
        </div>
        
        <ClientInfoCard client={client} />

        <Card>
          <div style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#0F172A', fontWeight: 700 }}>SpeedPay Submissions</h3>
            <DataTable
              data={filteredEnriched}
              columns={columns} 
              actions={actions} 
              rowKey="id"
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
          </div>
        </Card>
      </div>
    );
  }

  // --- List View ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      

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
          columns={columns.filter(c => !['referenceNumber', 'proofOfPayment', 'status'].includes(c.key as string))} 
          rowKey="id"
          searchPlaceholder="Search clients..."
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

    </div>
  );
};

export default SpeedPayValidation;
