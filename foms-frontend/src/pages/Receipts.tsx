import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { Card } from '../components/Card';
import { Button } from '../components/Buttons';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';
import { ClientInfoCard } from '../components/ClientInfoCard';
export const Receipts: React.FC = () => {
  const { id: clientIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const receiptIdParam = searchParams.get('receiptId');
  const navigate = useNavigate();
  const { user } = useAuth();

  const { receipts, clients, invoices, payments } = useAppData();

  // --- Detail View (Specific Receipt) ---
  if (receiptIdParam) {
    const viewDetailsModalRaw = receipts.find(r => r.id === receiptIdParam);
    if (!viewDetailsModalRaw) return <div>Receipt not found</div>;

    const client = clients.find(c => c.id === viewDetailsModalRaw.clientId);
    const invoice = invoices.find(i => i.id === viewDetailsModalRaw.invoiceId);
    const payment = payments.find(p => p.id === viewDetailsModalRaw.paymentId);
    
    const viewDetailsModal = { 
      ...viewDetailsModalRaw, 
      clientName: client?.name ?? 'Unknown', 
      invoiceNumber: invoice?.invoiceNumber ?? viewDetailsModalRaw.invoiceId,
      paymentMethod: payment?.paymentMethod ?? 'N/A',
      referenceNumber: payment?.referenceNumber ?? 'N/A'
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div onClick={() => navigate(`/receipts/${clientIdParam}`)} style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, width: 'fit-content' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i> Back to Receipts
        </div>
        
        <Card>
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ margin: '0 0 -8px', fontSize: '1rem', color: '#0F172A', fontWeight: 700 }}>Official Receipt Details</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
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

            <hr style={{ border: 0, borderTop: '1px solid #E2E8F0', margin: 0 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <Button title="Close" variant="secondary" onClick={() => navigate(`/receipts/${clientIdParam}`)} />
              <Button 
                title="Print / PDF" 
                variant="primary" 
                icon="ti-printer" 
                onClick={() => window.print()} 
              />
            </div>

          </div>
        </Card>
      </div>
    );
  }

  // --- Client Detail View ---
  if (clientIdParam) {
    const client = clients.find(c => c.id === clientIdParam);
    if (!client) return <div>Client not found</div>;

    const clientReceipts = receipts.filter(r => r.clientId === clientIdParam).map(r => {
      const invoice = invoices.find(i => i.id === r.invoiceId);
      const payment = payments.find(p => p.id === r.paymentId);
      return { 
        ...r, 
        invoiceNumber: invoice?.invoiceNumber ?? r.invoiceId,
        paymentMethod: payment?.paymentMethod ?? 'N/A',
        referenceNumber: payment?.referenceNumber ?? 'N/A'
      };
    });

    const columns = [
      { key: 'receiptNumber', label: 'OR NUMBER', sortable: true },
      { key: 'invoiceNumber', label: 'LINKED INVOICE' },
      { key: 'referenceNumber', label: 'PAYMENT REFERENCE' },
      { key: 'amount', label: 'AMOUNT', render: (row: any) => `₱${row.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
      { key: 'issuedAt', label: 'DATE ISSUED', render: (row: any) => new Date(row.issuedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) },
    ];

    const actions = [
      { label: 'View Details', icon: 'ti-eye', onClick: (row: any) => navigate(`/receipts/${clientIdParam}?receiptId=${row.id}`) }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div onClick={() => navigate('/receipts')} style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, width: 'fit-content' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i> Back to Receipts
        </div>
        
        <ClientInfoCard client={client} />

        <Card>
          <div style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#0F172A', fontWeight: 700 }}>Official Receipt History</h3>
            <DataTable 
              data={clientReceipts} 
              columns={columns} 
              actions={actions} 
              rowKey="id"
              searchPlaceholder="Search receipts..."
              searchFields={['receiptNumber', 'invoiceNumber', 'referenceNumber'] as any}
              emptyMessage="No official receipts issued for this client yet."
              columnToggle={true} densityToggle={true} exportable={false}
            />
          </div>
        </Card>
      </div>
    );
  }

  // --- List View ---
  // We include clients that either have issued receipts or have validated payments that need a receipt.
  const relevantClientIds = new Set<string>();
  receipts.forEach(r => relevantClientIds.add(r.clientId));
  payments.filter(p => p.status === 'Validated').forEach(p => relevantClientIds.add(p.clientId));

  const listData = Array.from(relevantClientIds).map(clientId => {
    const client = clients.find(c => c.id === clientId);
    
    const clientPayments = payments.filter(p => p.clientId === clientId && p.status === 'Validated');
    const hasPending = clientPayments.some(p => !receipts.some(r => r.paymentId === p.id));
    
    const computedStatus = hasPending ? 'Pending' : 'Issued';

    return { 
      id: clientId, 
      clientName: client?.name ?? 'Unknown',
      status: computedStatus
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <TableContainer>
        <DataTable 
          data={listData} 
          columns={[
            { key: 'id', label: 'CLIENT ID', sortable: true },
            { key: 'clientName', label: 'CLIENT NAME', sortable: true, render: (row: any) => (
              <span onClick={() => navigate(`/receipts/${row.id}`)} style={{ color: '#0F172A', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
                {row.clientName}
              </span>
            )},
            { key: 'status', label: 'STATUS', render: (row: any) => <StatusBadge status={row.status} /> }
          ]} 
          rowKey="id"
          title="Official Receipts"
          searchPlaceholder="Search clients..." 
          searchFields={['clientName'] as any}
          emptyMessage="No official receipts issued yet." 
          exportable={false} 
          columnToggle={true} 
          densityToggle={true} 
          filters={[{
            key: 'status', label: 'All Statuses', options: [
              { label: 'Pending', value: 'Pending' },
              { label: 'Issued', value: 'Issued' }
            ],
            filterFn: (row: any, val: string) => row.status === val
          }]}
        />
      </TableContainer>
    </div>
  );
};

export default Receipts;
