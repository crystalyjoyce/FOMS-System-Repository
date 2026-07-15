import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { DataTable } from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import { StatusCard } from '../components/StatusCard';
import { useToast } from '../components/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Buttons';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';

export const Receipts: React.FC = () => {
  const { toast } = useToast();
  const [viewDetailsModal, setViewDetailsModal] = useState<any>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { user } = useAuth();

  const { receipts, clients, invoices, payments } = useAppData();

  const filteredReceipts = selectedClientId ? receipts.filter(r => r.clientId === selectedClientId) : receipts;

  let enriched: any[] = [];
  if (selectedClientId) {
    enriched = receipts.filter(r => r.clientId === selectedClientId).map(r => {
      const client = clients.find(c => c.id === r.clientId);
      const invoice = invoices.find(i => i.id === r.invoiceId);
      const payment = payments.find(p => p.id === r.paymentId);
      
      return { 
        ...r, 
        clientName: client?.name ?? 'Unknown', 
        invoiceNumber: invoice?.invoiceNumber ?? r.invoiceId,
        paymentMethod: payment?.paymentMethod ?? 'N/A',
        referenceNumber: payment?.referenceNumber ?? 'N/A'
      };
    });
  } else {
    const grouped = new Map<string, any[]>();
    receipts.forEach(r => {
      if (!grouped.has(r.clientId)) grouped.set(r.clientId, []);
      grouped.get(r.clientId)!.push(r);
    });
    enriched = Array.from(grouped.entries()).map(([clientId, recs]) => {
      const client = clients.find(c => c.id === clientId);
      const maxDate = new Date(Math.max(...recs.map(r => new Date(r.issuedAt).getTime())));
      
      return {
        id: clientId, 
        clientId,
        receiptNumber: recs.length === 1 ? recs[0].receiptNumber : '[Multiple]',
        clientName: client?.name ?? 'Unknown',
        invoiceNumber: 'Mixed',
        paymentMethod: 'Mixed',
        referenceNumber: 'Mixed',
        amount: recs.reduce((sum, r) => sum + r.amount, 0),
        issuedAt: maxDate.toISOString(),
        isGrouped: true
      };
    });
  }

  const columns = [
    { key: 'receiptNumber', label: 'OR NUMBER', sortable: true },
    { key: 'invoiceNumber', label: 'LINKED INVOICE' },
    { key: 'clientName', label: 'CLIENT', sortable: true, render: (row: any) => (
      !selectedClientId ? (
        <button onClick={() => setSelectedClientId(row.clientId)} style={{ background: 'none', border: 'none', padding: 0, color: '#3B82F6', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
          {row.clientName}
        </button>
      ) : (
        <span style={{ fontWeight: 600 }}>{row.clientName}</span>
      )
    ) },
    { key: 'referenceNumber', label: 'PAYMENT REFERENCE' },
    { key: 'amount', label: 'AMOUNT', render: (row: any) => `₱${row.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
    { key: 'issuedAt', label: 'DATE ISSUED', render: (row: any) => new Date(row.issuedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) },
  ];

  const actions = [
    { label: 'View Details', icon: 'ti-eye', onClick: (row: any) => setViewDetailsModal(row) }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatusCard label="Total Receipts Issued" value={filteredReceipts.length} icon="ti-receipt" variant="new" />
        <StatusCard label="Total Amount" value={`₱${filteredReceipts.reduce((s, r) => s + r.amount, 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} icon="ti-coin" variant="success" />
        <StatusCard label="This Month" value={filteredReceipts.filter(r => new Date(r.issuedAt).getMonth() === new Date().getMonth()).length} icon="ti-calendar" variant="info" />
      </div>

      {/* Main Content Table */}
      
      <TableContainer>
        <DataTable data={enriched} columns={selectedClientId ? columns : columns.filter(c => !['invoiceNumber', 'paymentMethod', 'referenceNumber'].includes(c.key as string))} actions={selectedClientId ? actions : undefined} rowKey="id"
          title="Official Receipts"
          searchPlaceholder="Search receipts..." searchFields={['receiptNumber', 'clientName', 'invoiceNumber', 'referenceNumber'] as any}
          emptyMessage="No official receipts issued yet." exportable={false} columnToggle={true} densityToggle={true} />
      </TableContainer>
      {selectedClientId && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button variant="secondary" title="← Back to Summary" onClick={() => setSelectedClientId(null)} />
        </div>
      )}

      {/* View Details Modal */}
      {viewDetailsModal && createPortal(
        <div 
          className="modal-overlay" 
          onClick={() => setViewDetailsModal(null)}
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
                <div style={{ width: '40px', height: '40px', background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
                  <i className="ti ti-receipt" style={{ fontSize: '22px' }} />
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Official Receipt Details</h2>
              </div>
              <button 
                onClick={() => setViewDetailsModal(null)}
                style={{ width: '36px', height: '36px', background: '#F1F5F9', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', transition: 'background 0.2s' }}
                aria-label="Close"
              >
                <i className="ti ti-x" style={{ fontSize: 18 }} />
              </button>
            </div>
            
            <hr style={{ border: 0, borderTop: '1px solid #E2E8F0', margin: 0 }} />

            {/* Body */}
            <div style={{ padding: '20px 32px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '60vh' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    OR NUMBER
                  </label>
                  <input 
                    type="text" 
                    value={viewDetailsModal.receiptNumber}
                    disabled
                    style={{ padding: '12px 16px', border: '1px solid #FCD34D', borderRadius: '8px', fontSize: '14px', color: '#92400E', background: '#FFFBEB', outline: 'none', fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    DATE ISSUED
                  </label>
                  <input 
                    type="text" 
                    value={new Date(viewDetailsModal.issuedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    disabled
                    style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    CLIENT NAME
                  </label>
                  <input 
                    type="text" 
                    value={viewDetailsModal.clientName}
                    disabled
                    style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    LINKED INVOICE NO.
                  </label>
                  <input 
                    type="text" 
                    value={viewDetailsModal.invoiceNumber}
                    disabled
                    style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    PAYMENT METHOD
                  </label>
                  <input 
                    type="text" 
                    value={viewDetailsModal.paymentMethod}
                    disabled
                    style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    REFERENCE NUMBER
                  </label>
                  <input 
                    type="text" 
                    value={viewDetailsModal.referenceNumber}
                    disabled
                    style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    AMOUNT RECEIVED
                  </label>
                  <input 
                    type="text" 
                    value={`₱${viewDetailsModal.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                    disabled
                    style={{ padding: '12px 16px', border: '1px solid #10B981', borderRadius: '8px', fontSize: '14px', color: '#10B981', fontWeight: 700, background: '#F0FDF4', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    LINKED PAYMENT ID
                  </label>
                  <input 
                    type="text" 
                    value={viewDetailsModal.paymentId}
                    disabled
                    style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0F172A', background: '#F8FAFC', outline: 'none', fontWeight: 600 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  VALIDATED / ISSUED BY
                </label>
                <input 
                  type="text" 
                  value={user?.fullName || 'Assistant Finance Manager'}
                  disabled
                  style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#64748B', background: '#F8FAFC', outline: 'none', fontStyle: 'italic' }}
                />
              </div>

            </div>

            {/* Footer Actions */}
            <hr style={{ border: 0, borderTop: '1px solid #E2E8F0', margin: 0 }} />
            <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'flex-end', gap: '16px', background: '#F8FAFC' }}>
              <Button title="Close" variant="secondary" onClick={() => setViewDetailsModal(null)} />
              <Button 
                title="Print / PDF" 
                variant="primary" 
                icon="ti-printer" 
                onClick={() => window.print()} 
              />
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Receipts;
