import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { Card } from '../components/Card';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';
import { ClientInfoCard } from '../components/ClientInfoCard';

export const AccountsReceivable: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { arRecords, clients, invoices } = useAppData();

  if (!user) return null;

  const client = clients.find(c => c.id === id);

  if (id && client) {
    const clientInvoices = arRecords.filter(r => r.clientId === id).map(rec => {
      const inv = invoices.find(i => i.id === rec.invoiceId);
      return {
        ...rec,
        invoiceNumber: inv?.invoiceNumber ?? rec.invoiceId,
        invoiceDate: inv?.createdAt ?? new Date().toISOString(),
        dueDate: inv?.dueDate ?? new Date().toISOString(),
        originalAmount: rec.originalAmount,
        outstandingBalance: rec.outstandingBalance,
        agingDays: Math.max(0, Math.floor((Date.now() - new Date(inv?.dueDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24))),
        status: rec.status
      };
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div onClick={() => navigate('/accounts-receivable')} style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, width: 'fit-content' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i> Back to Accounts Receivable
        </div>
        
        <ClientInfoCard client={client} />

        <Card>
          <div style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#0F172A', fontWeight: 700 }}>Invoice / billing history</h3>
            <DataTable
              columns={[
                { key: 'invoiceNumber', label: 'INVOICE NO.', sortable: true },
                { key: 'invoiceDate', label: 'INVOICE DATE', sortable: true, render: (row: any) => new Date(row.invoiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                { key: 'dueDate', label: 'DUE DATE', sortable: true, render: (row: any) => new Date(row.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                { key: 'originalAmount', label: 'AMOUNT', sortable: true, render: (row: any) => `₱${row.originalAmount.toLocaleString('en-PH', {minimumFractionDigits: 2})}` },
                { key: 'outstandingBalance', label: 'OUTSTANDING', sortable: true, render: (row: any) => <span style={{ color: row.outstandingBalance > 0 ? '#EF4444' : '#10B981', fontWeight: 700 }}>₱{row.outstandingBalance.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span> },
                { key: 'agingDays', label: 'AGING', sortable: true, render: (row: any) => `${row.agingDays} days` },
                { key: 'status', label: 'STATUS', render: (row: any) => <StatusBadge status={row.status} /> }
              ]}
              data={clientInvoices}
              rowKey="id"
              searchPlaceholder="Search invoices..."
            />
          </div>
        </Card>
      </div>
    );
  }

  // List View
  const grouped = new Map<string, any[]>();
  arRecords.forEach(r => {
    if (!grouped.has(r.clientId)) grouped.set(r.clientId, []);
    grouped.get(r.clientId)!.push(r);
  });
  const listData = Array.from(grouped.entries()).map(([clientId, recs]) => {
    const cli = clients.find(c => c.id === clientId);
    
    let computedStatus = 'Paid';
    if (recs.some(r => r.status === 'Overdue')) {
      computedStatus = 'Overdue';
    } else if (recs.some(r => ['Unpaid', 'Sent', 'Draft', 'Due Soon', 'For Review', 'Approved'].includes(r.status))) {
      computedStatus = 'Unpaid';
    }

    return { 
      id: clientId, 
      clientName: cli?.name ?? 'Unknown', 
      status: computedStatus 
    };
  });

  return (
    <TableContainer>
      <DataTable
        columns={[
          { key: 'id', label: 'CLIENT ID', sortable: true },
          { key: 'clientName', label: 'CLIENT NAME', sortable: true, render: (row: any) => (
            <span onClick={() => navigate(`/accounts-receivable/${row.id}`)} style={{ color: '#0F172A', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
              {row.clientName}
            </span>
          ) },
          { key: 'status', label: 'STATUS', render: (row: any) => <StatusBadge status={row.status} /> }
        ]}
        data={listData}
        rowKey="id"
        searchPlaceholder="Search accounts receivable..."
        filters={[{
          key: 'status', label: 'All Statuses', options: [
            { label: 'Overdue', value: 'Overdue' },
            { label: 'Unpaid', value: 'Unpaid' },
            { label: 'Paid', value: 'Paid' }
          ],
          filterFn: (row: any, val: string) => row.status === val
        }]}
      />
    </TableContainer>
  );
};

export default AccountsReceivable;
