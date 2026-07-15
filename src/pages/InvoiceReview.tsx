import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { Card } from '../components/Card';
import { StatusCard } from '../components/StatusCard';
import { Button } from '../components/Buttons';
import { useToast } from '../components/ToastContext';
import '../components/FormModals.css';
import { 
  SEEDED_CLIENTS, 
  SEEDED_USERS, 
  Invoice 
} from '../data/seed';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';

export const InvoiceReview: React.FC = () => {
  const { toast } = useToast();
  const { invoices, updateInvoice, waybills, clients } = useAppData();
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isFlagging, setIsFlagging] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.clientId) {
      setSelectedClientId(location.state.clientId);
      if (location.state?.invoiceId) {
        const inv = invoices.find(i => i.id === location.state.invoiceId);
        if (inv) setViewInvoice(inv);
      }
      // clear state so it doesn't reopen if they close it
      window.history.replaceState({}, document.title);
    }
  }, [location.state, invoices]);

  // Enrich data for the table — Draft invoices are hidden from Head Accountant
  const visibleInvoices = invoices.filter(i => i.status !== 'Draft');
  let enriched: any[] = [];
  if (selectedClientId) {
    enriched = visibleInvoices.filter(i => i.clientId === selectedClientId).map(inv => {
      const client = clients.find(c => c.id === inv.clientId);
      const user = SEEDED_USERS.find(u => u.employeeId === inv.createdBy);
      return {
        ...inv,
        clientName: client ? client.name : 'Unknown Client',
        submittedBy: user ? user.fullName : inv.createdBy,
        waybillCount: inv.waybillIds.length,
      };
    });
  } else {
    const grouped = new Map<string, any[]>();
    visibleInvoices.forEach(inv => {
      if (!grouped.has(inv.clientId)) grouped.set(inv.clientId, []);
      grouped.get(inv.clientId)!.push(inv);
    });
    enriched = Array.from(grouped.entries()).map(([clientId, recs]) => {
      const client = clients.find(c => c.id === clientId);
      const statuses = Array.from(new Set(recs.map(r => r.status)));
      const status = statuses.length === 1 ? statuses[0] : 'Mixed';
      const maxDate = new Date(Math.max(...recs.map(r => new Date(r.createdAt).getTime())));
      const submitters = Array.from(new Set(recs.map(r => {
        const u = SEEDED_USERS.find(user => user.employeeId === r.createdBy);
        return u ? u.fullName : r.createdBy;
      })));
      const submittedBy = submitters.length === 1 ? submitters[0] : submitters.join(', ');
      
      return {
        id: clientId, 
        clientId,
        invoiceNumber: recs.length === 1 ? recs[0].invoiceNumber : '[Multiple]',
        clientName: client?.name ?? 'Unknown',
        submittedBy: submittedBy,
        waybillCount: recs.reduce((sum, r) => sum + r.waybillIds.length, 0),
        totalAmount: recs.reduce((sum, r) => sum + r.totalAmount, 0),
        createdAt: maxDate.toISOString(),
        status: status,
        isGrouped: true
      };
    });
  }

  const columns = [
    { key: 'invoiceNumber', label: 'INVOICE NO.', sortable: true },
    { key: 'clientName', label: 'CLIENT NAME', sortable: true, render: (row: any) => (
      !selectedClientId ? (
        <button onClick={() => setSelectedClientId(row.clientId)} style={{ background: 'none', border: 'none', padding: 0, color: '#3B82F6', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
          {row.clientName}
        </button>
      ) : (
        <span style={{ fontWeight: 600 }}>{row.clientName}</span>
      )
    ) },
    { key: 'submittedBy', label: 'SUBMITTED BY', sortable: true },
    {
      key: 'createdAt',
      label: 'DATE CREATED',
      sortable: true,
      render: (row: any) => new Date(row.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
    },
    { 
      key: 'waybillCount', 
      label: 'WAYBILLS',
      render: (row: any) => `${row.waybillCount} waybills`
    },
    {
      key: 'totalAmount',
      label: 'TOTAL AMOUNT',
      sortable: true,
      render: (row: any) => `₱${row.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
  ];

  const actions = [
    {
      label: 'View Details',
      icon: 'ti-eye',
      onClick: (row: any) => setViewInvoice(row),
    },
  ];

  // KPI Calculations
  const kpiInvoices = selectedClientId ? invoices.filter(i => i.clientId === selectedClientId) : invoices;
  const pendingCount = kpiInvoices.filter(i => i.status === 'Pending Approval').length;
  const verifiedCount = kpiInvoices.filter(i => i.status === 'Verified').length;
  // Total value for pending + verified ONLY
  const totalAmount = kpiInvoices
    .filter(i => i.status === 'Pending Approval' || i.status === 'Verified')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  // Toggle body class to blur the entire layout behind the modal
  useEffect(() => {
    if (viewInvoice) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [viewInvoice]);

  // Status Handlers
  const handleVerify = () => {
    if (!viewInvoice) return;
    updateInvoice(viewInvoice.id, { status: 'Verified' });
    toast.success(`Invoice ${viewInvoice.invoiceNumber} has been Verified.`, 'Success');
    setViewInvoice(null);
    setIsFlagging(false);
  };

  const handleFlagDiscrepancy = () => {
    if (!viewInvoice) return;
    if (!remarks.trim()) {
      toast.error('Please provide remarks for the discrepancy.', 'Error');
      return;
    }
    updateInvoice(viewInvoice.id, { status: 'Draft', notes: remarks });
    toast.error(`Invoice ${viewInvoice.invoiceNumber} rejected and returned as Draft.`, 'Rejected');
    setViewInvoice(null);
    setRemarks('');
    setIsFlagging(false);
  };

  const handleFinalize = () => {
    if (!viewInvoice) return;
    updateInvoice(viewInvoice.id, { status: 'Finalized' });
    toast.success(`Invoice ${viewInvoice.invoiceNumber} has been Finalized.`, 'Success');
    setViewInvoice(null);
  };

  // Helper for rendering modal data
  const client = viewInvoice ? clients.find(c => c.id === viewInvoice.clientId) : null;
  const submitter = viewInvoice ? SEEDED_USERS.find(u => u.employeeId === viewInvoice.createdBy) : null;
  const invoiceWaybills = viewInvoice ? waybills.filter(w => viewInvoice.waybillIds.includes(w.id)) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatusCard label="Pending Review" value={pendingCount} icon="ti-clock-hour-4" variant="warning" />
        <StatusCard label="Verified" value={verifiedCount} icon="ti-circle-check" variant="success" />
        <StatusCard label="Total Invoice Value" value={`₱${totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} icon="ti-coin" variant="new" />
      </div>

      {/* Invoice Review Table */}
      
      <TableContainer>
        <DataTable
          title="Invoice Queue"
          data={enriched}
          columns={columns}
          actions={selectedClientId ? actions : undefined}
          rowKey="id"
          searchPlaceholder="Search invoices..."
          searchFields={['invoiceNumber', 'clientName', 'status', 'submittedBy'] as any}
          defaultFilters={{ status: 'Pending Approval' }}
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { label: 'Pending Approval', value: 'Pending Approval' },
                { label: 'Verified', value: 'Verified' },
                { label: 'Finalized', value: 'Finalized' }
              ],
              filterFn: (row: any, val: string) => row.status === val
            }
          ]}
          emptyMessage="No invoices in the review queue."
          columnToggle={true}
          densityToggle={true}
          exportable={false}
          defaultPageSize={10}
        />
      </TableContainer>
      {selectedClientId && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button variant="secondary" title="← Back to Summary" onClick={() => setSelectedClientId(null)} />
        </div>
      )}

      {/* View Details Modal */}
      {viewInvoice && createPortal(
        <div 
          className="modal-overlay" 
          onClick={() => { setViewInvoice(null); setRemarks(''); setIsFlagging(false); }}
        >
          <div 
            className="modal-card"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '560px', fontFamily: 'var(--fb, var(--font-sans, "Inter", sans-serif))' }}
          >
            {/* Header */}
            <div className="modal-hd">
              <div className="modal-hd-left">
                <span className="modal-hd-icon">
                  <i className="ti ti-file-text" style={{ fontSize: 18 }} />
                </span>
                <h2 className="modal-hd-title" style={{ fontFamily: 'var(--fh, "Montserrat", sans-serif)' }}>
                  Invoice Details - {viewInvoice.invoiceNumber}
                </h2>
              </div>
              <button 
                className="modal-x-btn" 
                onClick={() => { setViewInvoice(null); setRemarks(''); setIsFlagging(false); }}
                aria-label="Close"
              >
                <i className="ti ti-x" style={{ fontSize: 15 }} />
              </button>
            </div>
            <div className="modal-hd-divider" />

            {/* Body */}
            <div className="modal-bd" style={{ overflowY: 'auto', maxHeight: '60vh', gap: '16px' }}>
              
              {/* Meta details */}
              <div className="modal-row-2">
                <div>
                  <span className="tf-label" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--tt, #6B7280)', textTransform: 'uppercase', marginBottom: '4px' }}>Client Name</span>
                  <span style={{ fontSize: '13px', color: 'var(--tp, #0F172A)', fontWeight: 600 }}>{client?.name || 'Unknown'}</span>
                </div>
                <div>
                  <span className="tf-label" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--tt, #6B7280)', textTransform: 'uppercase', marginBottom: '4px' }}>Submitted By</span>
                  <span style={{ fontSize: '13px', color: 'var(--tp, #0F172A)', fontWeight: 600 }}>{submitter?.fullName || viewInvoice.createdBy}</span>
                </div>
              </div>

              <div className="modal-row-2">
                <div>
                  <span className="tf-label" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--tt, #6B7280)', textTransform: 'uppercase', marginBottom: '4px' }}>Billing Period</span>
                  <span style={{ fontSize: '13px', color: 'var(--tp, #0F172A)', fontWeight: 600 }}>{viewInvoice.billingPeriod}</span>
                </div>
                <div>
                  <span className="tf-label" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--tt, #6B7280)', textTransform: 'uppercase', marginBottom: '4px' }}>Current Status</span>
                  <div style={{ marginTop: '2px' }}><StatusBadge status={viewInvoice.status} /></div>
                </div>
              </div>

              <div className="modal-row-2">
                <div>
                  <span className="tf-label" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--tt, #6B7280)', textTransform: 'uppercase', marginBottom: '4px' }}>Date Created</span>
                  <span style={{ fontSize: '13px', color: 'var(--tp, #0F172A)', fontWeight: 600 }}>
                    {new Date(viewInvoice.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="tf-label" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--tt, #6B7280)', textTransform: 'uppercase', marginBottom: '4px' }}>Due Date</span>
                  <span style={{ fontSize: '13px', color: 'var(--tp, #0F172A)', fontWeight: 600 }}>
                    {new Date(viewInvoice.dueDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Waybills List */}
              <div style={{ border: '1px solid var(--border, #E2E8F0)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ background: 'var(--s1, #F7F9FF)', padding: '10px 14px', borderBottom: '1px solid var(--border, #E2E8F0)', fontSize: '11px', fontWeight: 700, color: 'var(--tt, #6B7280)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Included Waybills ({invoiceWaybills.length})
                </div>
                <div style={{ padding: '0 14px', maxHeight: '160px', overflowY: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', padding: '10px 0', borderBottom: '1px solid var(--border, #E2E8F0)', fontSize: '11px', fontWeight: 700, color: 'var(--tt, #6B7280)', textTransform: 'uppercase' }}>
                    <span>Waybill No.</span>
                    <span>Delivery Date</span>
                    <span style={{ textAlign: 'right' }}>Amount</span>
                  </div>
                  {invoiceWaybills.map((wb, i) => (
                    <div key={wb.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', padding: '10px 0', borderBottom: i < invoiceWaybills.length - 1 ? '1px solid #F1F5F9' : 'none', fontSize: '13px', color: 'var(--ts, #374151)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--tp, #0F172A)' }}>{wb.waybillNumber}</span>
                      <span>{new Date(wb.deliveryDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span style={{ textAlign: 'right', fontWeight: 600 }}>₱{(wb as any).amount ? (wb as any).amount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Computation Breakdown */}
              <div style={{ background: 'var(--s1, #F7F9FF)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border, #E2E8F0)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--ts, #374151)' }}>Base Amount</span>
                  <span style={{ fontWeight: 600, color: 'var(--tp, #0F172A)' }}>₱{viewInvoice.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--ts, #374151)' }}>VAT (12%)</span>
                  <span style={{ fontWeight: 600, color: 'var(--tp, #0F172A)' }}>₱{viewInvoice.vatAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--ts, #374151)' }}>Surcharge</span>
                  <span style={{ fontWeight: 600, color: 'var(--tp, #0F172A)' }}>₱{viewInvoice.surchargeAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border, #CBD5E1)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--tp, #0F172A)', fontWeight: 700 }}>TOTAL AMOUNT</span>
                  <span style={{ fontWeight: 800, color: 'var(--ok, #059669)', fontSize: '15px' }}>₱{viewInvoice.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              
              {/* Flag Discrepancy Text Area */}
              {viewInvoice.status === 'Pending Approval' && isFlagging && (
                <div className="tf-group state-default">
                  <label className="tf-label" htmlFor="discrepancy-remarks">What's the issue?</label>
                  <div className="tf-wrapper tf-textarea-wrapper">
                    <textarea 
                      id="discrepancy-remarks"
                      className="tf-textarea"
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="E.g. VAT computation incorrect, please recompute"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="modal-ft-divider" />
            <div className="modal-ft">
              
              {viewInvoice.status === 'Pending Approval' && !isFlagging && (
                <>
                  <Button 
                    title="Close" 
                    variant="secondary" 
                    onClick={() => { setViewInvoice(null); setRemarks(''); setIsFlagging(false); }} 
                  />
                  <Button 
                    title="Flag Discrepancy" 
                    variant="danger" 
                    icon="ti-flag"
                    onClick={() => setIsFlagging(true)}
                  />
                  <Button 
                    title="Verify" 
                    variant="primary" 
                    icon="ti-check"
                    onClick={handleVerify}
                  />
                </>
              )}

              {viewInvoice.status === 'Pending Approval' && isFlagging && (
                <>
                  <Button 
                    title="Cancel" 
                    variant="secondary" 
                    onClick={() => setIsFlagging(false)}
                  />
                  <Button 
                    title="Submit" 
                    variant="danger" 
                    onClick={handleFlagDiscrepancy}
                  />
                </>
              )}
              
              {viewInvoice.status === 'Verified' && (
                <>
                  <Button 
                    title="Close" 
                    variant="secondary" 
                    onClick={() => { setViewInvoice(null); setRemarks(''); setIsFlagging(false); }} 
                  />
                  <Button 
                    title="Finalize" 
                    variant="success" 
                    icon="ti-file-check"
                    onClick={handleFinalize}
                  />
                </>
              )}

              {(viewInvoice.status === 'Needs Revision' || viewInvoice.status === 'Finalized') && (
                <Button 
                  title="Close" 
                  variant="secondary" 
                  onClick={() => { setViewInvoice(null); setRemarks(''); setIsFlagging(false); }} 
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default InvoiceReview;
