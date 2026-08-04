import React from 'react';
import Button from '../components/Buttons';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/ToastContext';
import { Card } from '../components/Card';
import { StatusCard } from '../components/StatusCard';
import { SEEDED_INVOICES, SEEDED_CLIENTS } from '../data/seed';
import { TableContainer } from '../components/TableContainer';

export const InvoiceArchives: React.FC = () => {
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null);

  let enriched: any[] = [];
  if (selectedClientId) {
    enriched = SEEDED_INVOICES.filter(i => i.clientId === selectedClientId).map(inv => {
      const client = SEEDED_CLIENTS.find(c => c.id === inv.clientId);
      return {
        ...inv,
        clientName: client?.name ?? 'Unknown Client',
        waybillCount: inv.waybillIds.length,
      };
    });
  } else {
    const grouped = new Map<string, any[]>();
    SEEDED_INVOICES.forEach(inv => {
      if (!grouped.has(inv.clientId)) grouped.set(inv.clientId, []);
      grouped.get(inv.clientId)!.push(inv);
    });
    enriched = Array.from(grouped.entries()).map(([clientId, recs]) => {
      const client = SEEDED_CLIENTS.find(c => c.id === clientId);
      const statuses = Array.from(new Set(recs.map(r => r.status)));
      const status = statuses.length === 1 ? statuses[0] : 'Mixed';
      const maxDate = new Date(Math.max(...recs.map(r => new Date(r.createdAt).getTime())));
      
      return {
        id: clientId, 
        clientId,
        invoiceNumber: recs.length === 1 ? recs[0].invoiceNumber : '[Multiple]',
        clientName: client?.name ?? 'Unknown',
        waybillCount: recs.reduce((sum, r) => sum + r.waybillIds.length, 0),
        amount: recs.reduce((sum, r) => sum + r.amount, 0),
        vatAmount: recs.reduce((sum, r) => sum + r.vatAmount, 0),
        totalAmount: recs.reduce((sum, r) => sum + r.totalAmount, 0),
        createdAt: maxDate.toISOString(),
        status: status,
        isGrouped: true
      };
    });
  }

  const kpiInvoices = selectedClientId ? SEEDED_INVOICES.filter(i => i.clientId === selectedClientId) : SEEDED_INVOICES;
  const totalBilled = kpiInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = kpiInvoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPending = kpiInvoices.filter(i => ['Pending Approval', 'Approved', 'Sent'].includes(i.status)).reduce((sum, i) => sum + i.totalAmount, 0);



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
    {
      key: 'createdAt',
      label: 'DATE CREATED',
      sortable: true,
      render: (row: any) => new Date(row.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
    },
    { key: 'waybillCount', label: 'WAYBILLS COVERED' },
    {
      key: 'amount',
      label: 'BASE AMOUNT',
      render: (row: any) => `₱${row.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'vatAmount',
      label: 'VAT',
      render: (row: any) => `₱${row.vatAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'totalAmount',
      label: 'TOTAL',
      render: (row: any) => `₱${row.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
  ];

  const actions = [
    { label: 'View Invoice', icon: 'ti-eye', onClick: (row: any) => toast.info(`Viewing invoice details for ${row.invoiceNumber}`, 'Invoice View') },
    { label: 'Download PDF', icon: 'ti-file-download', onClick: (row: any) => toast.info(`Downloading PDF for invoice ${row.invoiceNumber}`, 'Download Started') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatusCard label="Total Invoiced" value={`₱${totalBilled.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} icon="ti-coin" variant="new" />
        <StatusCard label="Collected" value={`₱${totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} icon="ti-circle-check" variant="success" />
        <StatusCard label="Total Records" value={kpiInvoices.length} icon="ti-file-invoice" variant="info" />
      </div>

      {/* Table */}
      
      <TableContainer>
        <DataTable
          title="Invoice Archive"
          data={enriched}
          columns={selectedClientId ? columns : columns.filter(c => !['invoiceNumber', 'status'].includes(c.key as string))}
          actions={selectedClientId ? actions : undefined}
          rowKey="id"
          searchPlaceholder="Search invoices..."
          searchFields={['invoiceNumber', 'clientName', 'status'] as any}
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { label: 'Draft', value: 'Draft' },
                { label: 'Pending Approval', value: 'Pending Approval' },
                { label: 'Approved', value: 'Approved' },
                { label: 'Sent', value: 'Sent' },
                { label: 'Paid', value: 'Paid' },
                { label: 'Overdue', value: 'Overdue' }
              ],
              filterFn: (row: any, val: string) => row.status === val
            }
          ]}
          exportable={false}
          columnToggle={true}
          densityToggle={true}
        />
      </TableContainer>
      {selectedClientId && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button variant="secondary" title="← Back to Summary" onClick={() => setSelectedClientId(null)} />
        </div>
      )}
    </div>
  );
};

export default InvoiceArchives;
