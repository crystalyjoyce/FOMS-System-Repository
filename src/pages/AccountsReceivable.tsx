import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { FOLLOW_UP_CHANNELS, FOLLOW_UP_STATUSES, ExtendedInvoice, FollowUpRecord } from '../data/seed';
import { Card } from '../components/Card';
import { StatusCard } from '../components/StatusCard';
import { Button } from '../components/Buttons';
import { useToast } from '../components/ToastContext';
import { CalendarPicker } from '../components/FormModals';
import '../components/FormModals.css';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';

const AGING_COLORS: Record<string, { bg: string; color: string }> = {
  'Current': { bg: '#F0FDF4', color: '#10B981' },
  'Due Soon': { bg: '#FFFBEB', color: '#F59E0B' },
  'Overdue': { bg: '#FEF2F2', color: '#EF4444' },
};

const BRACKET_COLORS: Record<string, string> = {
  '0-30 days': '#10B981',
  '31-60 days': '#F59E0B',
  '61-90 days': '#F97316',
  '90+ days': '#EF4444',
};

export const AccountsReceivable: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { arRecords, clients, invoices, waybills, followUpRecords, addFollowUpRecord } = useAppData();
  const [viewAR, setViewAR] = useState<any>(null);
  const [followUpAR, setFollowUpAR] = useState<any>(null);
  const [viewFollowUpHistory, setViewFollowUpHistory] = useState<any>(null);
  const [targetCollectionDate, setTargetCollectionDate] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    if (viewAR || followUpAR || viewFollowUpHistory) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [viewAR, followUpAR, viewFollowUpHistory]);

  const filteredAR = selectedClientId ? arRecords.filter(r => r.clientId === selectedClientId) : arRecords;

  const totalOutstanding = filteredAR.reduce((s, r) => s + r.outstandingBalance, 0);
  const overdue = filteredAR.filter(r => r.status === 'Overdue');
  const dueSoon = filteredAR.filter(r => r.status === 'Due Soon');
  const current = filteredAR.filter(r => r.status === 'Current');

  let enriched: any[] = [];
  if (selectedClientId) {
    enriched = arRecords.filter(r => r.clientId === selectedClientId).map(rec => {
      const client = clients.find(c => c.id === rec.clientId);
      const invoice = invoices.find(i => i.id === rec.invoiceId);
      return { ...rec, clientName: client?.name ?? 'Unknown', invoiceNumber: invoice?.invoiceNumber ?? rec.invoiceId };
    });
  } else {
    const grouped = new Map<string, any[]>();
    arRecords.forEach(r => {
      if (!grouped.has(r.clientId)) grouped.set(r.clientId, []);
      grouped.get(r.clientId)!.push(r);
    });
    enriched = Array.from(grouped.entries()).map(([clientId, recs]) => {
      const client = clients.find(c => c.id === clientId);
      const statuses = Array.from(new Set(recs.map(r => r.status)));
      const status = statuses.length === 1 ? statuses[0] : 'Mixed';
      const maxDate = new Date(Math.max(...recs.map(r => new Date(r.invoiceDate).getTime())));
      
      return {
        id: clientId, 
        clientId,
        invoiceNumber: recs.length === 1 ? recs[0].invoiceNumber : '[Multiple]',
        clientName: client?.name ?? 'Unknown',
        invoiceDate: maxDate.toISOString(),
        dueDate: maxDate.toISOString(),
        originalAmount: recs.reduce((sum, r) => sum + r.originalAmount, 0),
        outstandingBalance: recs.reduce((sum, r) => sum + r.outstandingBalance, 0),
        status: status,
        agingBracket: 'N/A',
        isGrouped: true
      };
    });
  }

  const columns = [
    { key: 'invoiceNumber', label: 'INVOICE NO.', sortable: true, sortLabelAsc: '(Ascending)', sortLabelDesc: '(Descending)' },
    { key: 'clientName', label: 'CLIENT NAME', sortable: true, render: (row: any) => (
      !selectedClientId ? (
        <button onClick={() => setSelectedClientId(row.clientId)} style={{ background: 'none', border: 'none', padding: 0, color: '#3B82F6', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
          {row.clientName}
        </button>
      ) : (
        <span style={{ fontWeight: 600 }}>{row.clientName}</span>
      )
    ) },
    {
      key: 'invoiceDate', label: 'INVOICE DATE', sortable: true, sortLabelAsc: '(Oldest-Newest)', sortLabelDesc: '(Newest-Oldest)',
      render: (row: any) => new Date(row.invoiceDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
    {
      key: 'dueDate', label: 'DUE DATE', sortable: true, sortLabelAsc: '(Oldest-Newest)', sortLabelDesc: '(Newest-Oldest)',
      render: (row: any) => {
        const isNear = row.status === 'Due Soon';
        return (
          <span style={{ fontWeight: isNear ? 700 : 400, color: isNear ? '#F59E0B' : '#475569' }}>
            {isNear && <i className="ti ti-alert-triangle" style={{ marginRight: 4, fontSize: 13 }} />}
            {new Date(row.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        );
      },
    },
    {
      key: 'originalAmount', label: 'INVOICE AMOUNT', sortable: true, sortLabelAsc: '(Ascending)', sortLabelDesc: '(Descending)',
      render: (row: any) => `₱${row.originalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'outstandingBalance', label: 'OUTSTANDING', sortable: true, sortLabelAsc: '(Ascending)', sortLabelDesc: '(Descending)',
      render: (row: any) => (
        <span style={{ fontWeight: 700, color: row.outstandingBalance > 0 ? '#EF4444' : '#10B981' }}>
          ₱{row.outstandingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'agingBracket', label: 'AGING', sortable: true, sortLabelAsc: '(Ascending)', sortLabelDesc: '(Descending)',
      render: (row: any) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: row.agingBracket === 'Current' ? 0 : 6, justifyContent: 'flex-start' }}>
          {row.agingBracket !== 'Current' && (
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: BRACKET_COLORS[row.agingBracket], display: 'inline-block' }} />
          )}
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: BRACKET_COLORS[row.agingBracket] || '#475569' }}>
            {row.agingBracket}
          </span>
        </span>
      ),
    },
    {
      key: 'status', label: 'STATUS',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
  ];

  const actions = [
    {
      label: 'View Invoice',
      icon: 'ti-eye',
      onClick: (row: any) => setViewAR(row),
    },
    user?.role === 'Finance Manager' ? {
      label: 'View Follow-up History',
      icon: 'ti-history',
      onClick: (row: any) => setViewFollowUpHistory(row),
    } : {
      label: 'Record Follow-up',
      icon: 'ti-phone',
      onClick: (row: any) => setFollowUpAR(row),
    },
  ];

  // Dynamically map existing seed data to the new strict ExtendedInvoice blueprint
  let extendedInvoice: ExtendedInvoice | null = null;
  if (viewAR) {
    const inv = invoices.find(i => i.id === viewAR.invoiceId);
    const cli = clients.find(c => c.id === viewAR.clientId);
    if (inv && cli) {
      const mappedWaybills = waybills.filter(w => inv.waybillIds.includes(w.id)).map(wb => ({
        waybillNumber: wb.waybillNumber,
        documentType: (wb.hasOriginalPOD ? 'Original' : 'Certified True Copy') as 'Original' | 'Certified True Copy',
        deliveryDate: wb.deliveryDate,
        deliveryArea: wb.destinationArea || 'Unknown Area',
        baseFreightRate: inv.amount / Math.max(inv.waybillIds.length, 1)
      }));
      
      extendedInvoice = {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientId: cli.id,
        clientName: cli.name,
        clientBillingAddress: cli.address,
        clientContactDetails: `${cli.email} | ${cli.phone}`,
        billingSchedule: cli.billingSchedule,
        invoiceDate: inv.createdAt,
        dueDate: inv.dueDate,
        waybills: mappedWaybills,
        financials: {
          totalBaseFreight: inv.amount,
          vatAmount: inv.vatAmount,
          surcharges: inv.surchargeAmount,
          invoiceGrossTotal: inv.totalAmount,
          creditMemos: 0,
          netOutstandingBalance: viewAR.outstandingBalance,
          invoiceStatus: viewAR.status === 'Current' || viewAR.status === 'Due Soon' ? 'Unpaid' : viewAR.status === 'Overdue' ? 'Overdue' : 'Paid'
        }
      };
    }
  }

  // Generate FollowUpRecord structure dynamically
  const initialFollowUp: Partial<FollowUpRecord['formInputs']> = {
    followUpTimestamp: new Date().toISOString().split('T')[0],
    communicationChannel: FOLLOW_UP_CHANNELS[0],
    clientPaymentStatus: FOLLOW_UP_STATUSES[0],
    expectedCollectionDate: '',
    actionRemarks: '',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatusCard label="Total Outstanding" value={`₱${totalOutstanding.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} icon="ti-report-money" variant="new" />
        <StatusCard label="Near-Due Accounts (≤7 days)" value={dueSoon.length} icon="ti-calendar-time" variant="warning" />
        <StatusCard label="Overdue" value={overdue.length} icon="ti-alert-triangle" variant="danger" />
      </div>

      {/* Aging Brackets Visual */}
      <Card>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Aging of Accounts — Weekly Review</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {(['0-30 days', '31-60 days', '61-90 days', '90+ days'] as const).map(bracket => {
            const recs = filteredAR.filter(r => r.agingBracket === bracket);
            const amount = recs.reduce((s, r) => s + r.outstandingBalance, 0);
            return (
              <div 
                key={bracket} 
                className="kpi"
                style={{ 
                  '--kpi-ac': BRACKET_COLORS[bracket],
                  border: `1px solid ${BRACKET_COLORS[bracket]}22`, 
                  background: `${BRACKET_COLORS[bracket]}08`,
                  gap: '4px',
                  padding: '16px 18px'
                } as React.CSSProperties}
              >
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: BRACKET_COLORS[bracket], textTransform: 'uppercase', letterSpacing: '0.05em' }}>{bracket}</p>
                <p style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>{recs.length}</p>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>₱{amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </div>
            );
          })}
        </div>
      </Card>

      

      {/* AR Table */}
      <TableContainer>
        <DataTable data={enriched} columns={selectedClientId ? columns : columns.filter(c => !['invoiceNumber', 'agingBracket', 'status'].includes(c.key as string))} actions={selectedClientId ? actions : undefined} rowKey="id"
          title="Accounts Receivable Ledger"
          searchPlaceholder="Search accounts receivable..."
          searchFields={['invoiceNumber', 'clientName', 'status'] as any}
          emptyMessage="No accounts receivable records found."
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { label: 'Unpaid', value: 'Unpaid' },
                { label: 'Partially Billed', value: 'Partially Billed' },
                { label: 'Overdue', value: 'Overdue' },
                { label: 'Paid', value: 'Paid' },
              ],
              filterFn: (row: any, val: string) => {
                if (val === 'Unpaid') return row.outstandingBalance > 0 && row.outstandingBalance === row.originalAmount;
                if (val === 'Partially Billed') return row.outstandingBalance > 0 && row.outstandingBalance < row.originalAmount;
                if (val === 'Paid') return row.outstandingBalance === 0;
                if (val === 'Overdue') return row.status === 'Overdue';
                return row.status === val;
              }
            }
          ]}
          columnToggle={true}
          densityToggle={true}
          exportable={true}
        />
      </TableContainer>
      {selectedClientId && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button variant="secondary" title="← Back to Summary" onClick={() => setSelectedClientId(null)} />
        </div>
      )}

      {/* View Details Modal */}
      {viewAR && extendedInvoice && createPortal(
        <div 
          className="modal-overlay" 
          onClick={() => setViewAR(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{ 
              width: '100%', 
              maxWidth: '800px', 
              background: '#FFFFFF', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              fontFamily: 'Arial, Helvetica, sans-serif',
              overflowY: 'auto',
              maxHeight: '90vh',
              padding: '40px',
              color: '#000'
            }}
          >
            <div style={{ border: '2px solid #000', padding: '30px' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: '10px' }}>
                  <span style={{ fontSize: '15px', marginRight: '10px' }}>Invoice #</span>
                  <span style={{ borderBottom: '1px solid #000', width: '180px', display: 'inline-block', fontSize: '15px' }}>{extendedInvoice.invoiceNumber}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '13px', lineHeight: '1.4' }}>
                  <div style={{ background: '#0F172A', padding: '10px 20px', borderRadius: '8px', marginBottom: '10px' }}>
                    <img src="/logo.png" alt="Speedex Courier & Forwarder" style={{ height: '35px', display: 'block' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div>company address, street 1, town, city</div>
                    <div>company@email.com</div>
                    <div>000-000-000</div>
                  </div>
                </div>
              </div>

              {/* Info Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #000', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 10px', width: '50%' }}>Name: {extendedInvoice.clientName}</td>
                    <td style={{ border: '1px solid #000', padding: '6px 10px', width: '50%' }}>Invoice date: {new Date(extendedInvoice.invoiceDate).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 10px' }}>Contact: {extendedInvoice.clientContactDetails}</td>
                    <td style={{ border: '1px solid #000', padding: '6px 10px' }}>Due date: {new Date(extendedInvoice.dueDate).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 10px' }}>Address: {extendedInvoice.clientBillingAddress}</td>
                    <td style={{ border: '1px solid #000', padding: '6px 10px' }}>Billing schedule: {extendedInvoice.billingSchedule}</td>
                  </tr>
                </tbody>
              </table>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #000', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#b3b3b3' }}>
                    <th style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'left', fontWeight: 'normal' }}>Item (Waybill/POD)</th>
                    <th style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'left', fontWeight: 'normal' }}>Description</th>
                    <th style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'center', fontWeight: 'normal' }}>Quantity</th>
                    <th style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'right', fontWeight: 'normal' }}>Unit price</th>
                    <th style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'right', fontWeight: 'normal' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {extendedInvoice.waybills.map((wb, i) => (
                    <tr key={i}>
                      <td style={{ border: '1px solid #000', padding: '6px 10px' }}>{wb.waybillNumber}</td>
                      <td style={{ border: '1px solid #000', padding: '6px 10px' }}>{wb.documentType} - {wb.deliveryArea}</td>
                      <td style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'center' }}>1</td>
                      <td style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'right' }}>{wb.baseFreightRate.toFixed(2)}</td>
                      <td style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'right' }}>{wb.baseFreightRate.toFixed(2)}</td>
                    </tr>
                  ))}
                  {/* Fill empty rows to mimic the image aesthetic */}
                  {Array.from({ length: Math.max(0, 6 - extendedInvoice.waybills.length) }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td style={{ border: '1px solid #000', padding: '6px 10px' }}>&nbsp;</td>
                      <td style={{ border: '1px solid #000', padding: '6px 10px' }}>&nbsp;</td>
                      <td style={{ border: '1px solid #000', padding: '6px 10px' }}>&nbsp;</td>
                      <td style={{ border: '1px solid #000', padding: '6px 10px' }}>&nbsp;</td>
                      <td style={{ border: '1px solid #000', padding: '6px 10px' }}>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer Section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                
                {/* Notes */}
                <div style={{ width: '48%' }}>
                  <div style={{ background: '#b3b3b3', border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '12px' }}>Notes (Follow-up History)</div>
                  <div style={{ border: '1px solid #000', borderTop: 'none', padding: '10px', height: '100px', overflowY: 'auto', fontSize: '11px' }}>
                    {followUpRecords.filter(f => f.invoiceId === extendedInvoice.id).map(fu => (
                      <div key={fu.id} style={{ marginBottom: '8px' }}>
                        <strong>{new Date(fu.formInputs.followUpTimestamp).toLocaleDateString()} - {fu.formInputs.clientPaymentStatus}:</strong> {fu.formInputs.actionRemarks}
                      </div>
                    ))}
                    {followUpRecords.filter(f => f.invoiceId === extendedInvoice.id).length === 0 && 'No notes.'}
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '6px', fontStyle: 'italic' }}>Company policy: No refunds after 24 hours.</div>
                </div>

                {/* Totals */}
                <div style={{ width: '45%' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px 0', textAlign: 'right', paddingRight: '10px' }}>Subtotal:</td>
                        <td style={{ padding: '6px 0', borderBottom: '1px solid #000', width: '120px', textAlign: 'right' }}>{extendedInvoice.financials.totalBaseFreight.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', textAlign: 'right', paddingRight: '10px' }}>Discount/Surcharges:</td>
                        <td style={{ padding: '6px 0', borderBottom: '1px solid #000', textAlign: 'right' }}>{extendedInvoice.financials.surcharges.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', textAlign: 'right', paddingRight: '10px' }}>Tax (VAT):</td>
                        <td style={{ padding: '6px 0', borderBottom: '1px solid #000', textAlign: 'right' }}>{extendedInvoice.financials.vatAmount.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', textAlign: 'right', paddingRight: '10px' }}>Gross Total:</td>
                        <td style={{ padding: '6px 0', borderBottom: '1px solid #000', textAlign: 'right' }}>{extendedInvoice.financials.invoiceGrossTotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', textAlign: 'right', paddingRight: '10px' }}>Less Payments:</td>
                        <td style={{ padding: '6px 0', borderBottom: '1px solid #000', textAlign: 'right' }}>{(extendedInvoice.financials.invoiceGrossTotal - extendedInvoice.financials.netOutstandingBalance).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', textAlign: 'right', paddingRight: '10px' }}><strong>Amount Due:</strong></td>
                        <td style={{ padding: '6px 0', borderBottom: '2px solid #000', borderTop: '2px solid #000', textAlign: 'right', fontWeight: 'bold' }}>{extendedInvoice.financials.netOutstandingBalance.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button title="Close Invoice" variant="secondary" onClick={() => setViewAR(null)} />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Record Follow-up Modal */}
      {followUpAR && createPortal(
        <div 
          className="modal-overlay" 
          onClick={() => setFollowUpAR(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div 
            className="modal-card"
            onClick={e => e.stopPropagation()}
            style={{ 
              width: '100%', 
              maxWidth: '520px', 
              background: '#FFFFFF', 
              borderRadius: '12px', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              fontFamily: 'var(--fb, var(--font-sans, "Inter", sans-serif))',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', background: '#E6F6F4', color: '#00A99D', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
                  <i className="ti ti-clipboard-list" style={{ fontSize: '22px' }} />
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Record Follow-up</h2>
              </div>
              <button 
                onClick={() => setFollowUpAR(null)}
                style={{ width: '36px', height: '36px', background: '#F1F5F9', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', transition: 'background 0.2s' }}
                aria-label="Close"
              >
                <i className="ti ti-x" style={{ fontSize: 18 }} />
              </button>
            </div>
            
            <hr style={{ border: 0, borderTop: '1px solid #E2E8F0', margin: 0 }} />

            {/* Body */}
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', maxHeight: '65vh' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Client Name (Read-Only styling) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    CLIENT NAME <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    value={followUpAR.clientName}
                    disabled
                    style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#64748B', background: '#F8FAFC', outline: 'none' }}
                  />
                </div>

                {/* Invoice Ref No (Read-Only styling) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    INVOICE REF NO. <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    value={followUpAR.invoiceNumber}
                    disabled
                    style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#64748B', background: '#F8FAFC', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Added back: Aging and Outstanding Amount */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    CURRENT AGING CATEGORY
                  </label>
                  <input 
                    type="text" 
                    value={followUpAR.agingBracket}
                    disabled
                    style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#64748B', background: '#F8FAFC', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    TOTAL OUTSTANDING AMOUNT
                  </label>
                  <input 
                    type="text" 
                    value={`₱${followUpAR.outstandingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                    disabled
                    style={{ padding: '12px 16px', border: '1px solid #EF4444', borderRadius: '8px', fontSize: '14px', color: '#EF4444', fontWeight: 700, background: '#FEF2F2', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Target Date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    FOLLOW-UP DATE & TIME <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <i className="ti ti-calendar" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#00A99D', fontSize: '18px' }} />
                    <input 
                      type="datetime-local" 
                      defaultValue={`${new Date().toISOString().split('T')[0]}T${new Date().toTimeString().slice(0,5)}`} 
                      style={{ width: '100%', padding: '12px 16px 12px 42px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', outline: 'none', transition: 'border-color 0.2s', background: '#F8FAFC' }}
                    />
                  </div>
                </div>

                {/* Communication Channel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    CHANNEL <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select 
                    defaultValue={initialFollowUp.communicationChannel}
                    style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', outline: 'none', appearance: 'none', background: '#FFFFFF' }}
                  >
                    {FOLLOW_UP_CHANNELS.map(ch => (
                      <option key={ch} value={ch}>{ch}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Contact Person */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    CONTACT PERSON <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Maria Clara (Finance Officer)" 
                    style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', outline: 'none' }}
                  />
                </div>

                {/* Payment Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    PAYMENT STATUS <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select 
                    defaultValue={initialFollowUp.clientPaymentStatus}
                    style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', outline: 'none', appearance: 'none', background: '#FFFFFF' }}
                  >
                    {FOLLOW_UP_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <CalendarPicker
                    label="TARGET COLLECTION DATE"
                    value={targetCollectionDate}
                    onChange={v => setTargetCollectionDate(v)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    AUTHORIZED USER LOGGED
                  </label>
                  <input 
                    type="text" 
                    value={`${user?.fullName || 'User'} (${user?.role || 'Role'})`}
                    disabled
                    style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#64748B', background: '#F8FAFC', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Action Remarks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    NOTES <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>0 / 250 words</span>
                </div>
                <textarea 
                  placeholder="Write notes for this record entry..." 
                  rows={4}
                  style={{ padding: '14px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', outline: 'none', resize: 'vertical' }}
                />
              </div>

            </div>

            {/* Footer Actions */}
            <hr style={{ border: 0, borderTop: '1px solid #E2E8F0', margin: 0 }} />
            <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'flex-end', gap: '16px', background: '#FFFFFF' }}>
              <button 
                onClick={() => setFollowUpAR(null)}
                style={{ padding: '12px 24px', background: '#F1F5F9', border: 'none', borderRadius: '8px', color: '#0F172A', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  toast.success(`Follow-up log saved for ${followUpAR.clientName}!`, 'Record Saved');
                  setFollowUpAR(null);
                }}
                style={{ padding: '12px 24px', background: '#00A99D', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                SAVE RECORD
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* View Follow-up History Modal (for Finance Manager) */}
      {viewFollowUpHistory && createPortal(
        <div className="modal-overlay" onClick={() => setViewFollowUpHistory(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '600px', background: '#FFFFFF', borderRadius: '12px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', fontFamily: 'var(--font-sans)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', background: '#F1F5F9', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
                  <i className="ti ti-history" style={{ fontSize: '22px' }} />
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Follow-up History</h2>
              </div>
              <button onClick={() => setViewFollowUpHistory(null)} style={{ width: '36px', height: '36px', background: '#F1F5F9', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
                <i className="ti ti-x" style={{ fontSize: 18 }} />
              </button>
            </div>
            
            <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: '#64748B' }}>
              Reviewing follow-up logs for Invoice: <strong style={{ color: '#0F172A' }}>{viewFollowUpHistory.invoiceNumber}</strong> ({viewFollowUpHistory.clientName})
            </p>

            <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '8px' }}>
              {followUpRecords.filter(f => f.invoiceId === viewFollowUpHistory.invoiceId).length > 0 ? (
                followUpRecords.filter(f => f.invoiceId === viewFollowUpHistory.invoiceId).map(fu => (
                  <div key={fu.id} style={{ marginBottom: '16px', padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>
                        {new Date(fu.formInputs.followUpTimestamp).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span style={{ color: '#3B82F6', fontWeight: 700, fontSize: '0.8rem', background: '#DBEAFE', padding: '2px 8px', borderRadius: '99px' }}>
                        {fu.formInputs.communicationChannel}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', fontSize: '0.85rem' }}>
                      <div><strong style={{ color: '#475569' }}>Status:</strong> {fu.formInputs.clientPaymentStatus}</div>
                      <div><strong style={{ color: '#475569' }}>Contact:</strong> {fu.formInputs.clientContactPerson}</div>
                      <div style={{ color: '#334155', background: '#FFFFFF', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0', marginTop: '4px' }}>
                        "{fu.formInputs.actionRemarks}"
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic', borderTop: '1px solid #E2E8F0', paddingTop: '8px' }}>
                      Logged by: {fu.formInputs.authorizedUserLogged}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                  <i className="ti ti-file-dashed" style={{ fontSize: '32px', marginBottom: '8px', color: '#CBD5E1' }} />
                  <p style={{ margin: 0 }}>No follow-up records have been logged for this invoice yet.</p>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
              <Button title="Close" variant="secondary" onClick={() => setViewFollowUpHistory(null)} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AccountsReceivable;
