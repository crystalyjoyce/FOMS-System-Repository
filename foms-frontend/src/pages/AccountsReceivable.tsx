import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { Card } from '../components/Card';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';
import { ClientInfoCard } from '../components/ClientInfoCard';

const safeDate = (val: any) => {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatPeso = (n: number) =>
  `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const agingBracketColor: Record<string, string> = {
  'Current':     '#10B981',
  '0-30 days':   '#F59E0B',
  '31-60 days':  '#F97316',
  '61-90 days':  '#EF4444',
  '90+ days':    '#7C3AED',
};

export const AccountsReceivable: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { arRecords, clients, invoices } = useAppData();
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'paid'>('all');

  if (!user) return null;

  // ── Per-client detail view ──────────────────────────────────────────
  const client = clients.find(c => c.id === id);
  if (id && client) {
    const clientInvoices = arRecords
      .filter(r => r.clientId === id)
      .map(rec => {
        const inv = invoices.find(i => i.id === rec.invoiceId);
        const dueDate = inv?.dueDate || rec.dueDate || null;
        const agingDays = dueDate
          ? Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)))
          : 0;
        return {
          ...rec,
          invoiceNumber: inv?.invoiceNumber ?? rec.invoiceId,
          invoiceDate: inv?.createdAt ?? rec.invoiceDate,
          dueDate,
          originalAmount: rec.originalAmount,
          paidAmount: rec.paidAmount,
          outstandingBalance: rec.outstandingBalance,
          agingDays,
          agingBracket: rec.agingBracket,
          status: rec.status,
          isPaid: rec.outstandingBalance === 0,
        };
      });

    const allTab   = clientInvoices;
    const unpaidTab = clientInvoices.filter(r => r.outstandingBalance > 0);
    const paidTab   = clientInvoices.filter(r => r.outstandingBalance === 0);

    const visibleData = activeTab === 'unpaid' ? unpaidTab : activeTab === 'paid' ? paidTab : allTab;

    const totalOutstanding = unpaidTab.reduce((s, r) => s + r.outstandingBalance, 0);
    const totalPaid = paidTab.reduce((s, r) => s + r.paidAmount, 0);
    const totalOriginal = allTab.reduce((s, r) => s + r.originalAmount, 0);

    const tabStyle = (tab: typeof activeTab) => ({
      padding: '8px 20px',
      borderRadius: 8,
      border: 'none',
      cursor: 'pointer',
      fontWeight: 700,
      fontSize: '0.85rem',
      background: activeTab === tab ? '#0F172A' : '#F1F5F9',
      color: activeTab === tab ? '#fff' : '#64748B',
      transition: 'all 0.15s',
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div onClick={() => navigate('/accounts-receivable')} style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, width: 'fit-content' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: '16px' }} /> Back to Accounts Receivable
        </div>

        <ClientInfoCard client={client} />

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'Total Billed', value: formatPeso(totalOriginal), icon: 'ti-file-invoice', color: '#6366F1', bg: '#EEF2FF' },
            { label: 'Total Outstanding', value: formatPeso(totalOutstanding), icon: 'ti-clock-exclamation', color: '#EF4444', bg: '#FEF2F2' },
            { label: 'Total Collected', value: formatPeso(totalPaid), icon: 'ti-circle-check', color: '#10B981', bg: '#F0FDF4' },
          ].map(card => (
            <div key={card.label} style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`ti ${card.icon}`} style={{ fontSize: 22, color: card.color }} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>{card.label}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        <Card>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#0F172A', fontWeight: 700 }}>Invoice / Billing History</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={tabStyle('all')} onClick={() => setActiveTab('all')}>All ({allTab.length})</button>
                <button style={tabStyle('unpaid')} onClick={() => setActiveTab('unpaid')}>Unpaid ({unpaidTab.length})</button>
                <button style={tabStyle('paid')} onClick={() => setActiveTab('paid')}>Paid ({paidTab.length})</button>
              </div>
            </div>
            <DataTable
              columns={[
                { key: 'invoiceNumber', label: 'INVOICE NO.', sortable: true },
                { key: 'invoiceDate', label: 'INVOICE DATE', sortable: true, render: (row: any) => safeDate(row.invoiceDate) },
                { key: 'dueDate', label: 'DUE DATE', sortable: true, render: (row: any) => safeDate(row.dueDate) },
                { key: 'originalAmount', label: 'AMOUNT', sortable: true, render: (row: any) => formatPeso(row.originalAmount) },
                { key: 'paidAmount', label: 'PAID', sortable: true, render: (row: any) => <span style={{ color: '#10B981', fontWeight: 700 }}>{formatPeso(row.paidAmount)}</span> },
                { key: 'outstandingBalance', label: 'OUTSTANDING', sortable: true, render: (row: any) => (
                  <span style={{ color: row.outstandingBalance > 0 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                    {formatPeso(row.outstandingBalance)}
                  </span>
                )},
                { key: 'agingBracket', label: 'AGING BRACKET', render: (row: any) => (
                  <span style={{
                    padding: '3px 12px', borderRadius: 9999, fontWeight: 700, fontSize: '0.75rem',
                    color: agingBracketColor[row.agingBracket] || '#64748B',
                    background: (agingBracketColor[row.agingBracket] || '#64748B') + '18',
                  }}>
                    {row.agingBracket}
                  </span>
                )},
                { key: 'agingDays', label: 'DAYS OVERDUE', sortable: true, render: (row: any) => (
                  <span style={{ color: row.agingDays > 0 ? '#EF4444' : '#64748B', fontWeight: 600 }}>
                    {row.outstandingBalance > 0 ? `${row.agingDays} days` : '—'}
                  </span>
                )},
                { key: 'status', label: 'STATUS', render: (row: any) => <StatusBadge status={row.status} /> },
              ]}
              data={visibleData}
              rowKey="id"
              searchPlaceholder="Search invoices..."
            />
          </div>
        </Card>
      </div>
    );
  }

  // ── List View ───────────────────────────────────────────────────────
  const grouped = new Map<string, any[]>();
  arRecords.forEach(r => {
    if (!grouped.has(r.clientId)) grouped.set(r.clientId, []);
    grouped.get(r.clientId)!.push(r);
  });

  const listData = Array.from(grouped.entries()).map(([clientId, recs]) => {
    const cli = clients.find(c => c.id === clientId);
    const totalOriginal = recs.reduce((s, r) => s + r.originalAmount, 0);
    const totalOutstanding = recs.reduce((s, r) => s + r.outstandingBalance, 0);
    const unpaidCount = recs.filter(r => r.outstandingBalance > 0).length;

    // Determine worst aging bracket
    const bracketOrder = ['Current', '0-30 days', '31-60 days', '61-90 days', '90+ days'];
    const worstBracket = recs
      .filter(r => r.outstandingBalance > 0)
      .map(r => r.agingBracket)
      .sort((a, b) => bracketOrder.indexOf(b) - bracketOrder.indexOf(a))[0] ?? 'Current';

    let computedStatus = 'Paid';
    if (recs.some(r => r.status === 'Overdue')) computedStatus = 'Overdue';
    else if (recs.some(r => ['Unpaid', 'Sent', 'Draft', 'Due Soon', 'Current', 'Pending Approval'].includes(r.status))) computedStatus = 'Unpaid';

    return {
      id: clientId,
      clientName: cli?.name ?? 'Unknown',
      totalOriginal,
      totalOutstanding,
      unpaidCount,
      worstBracket,
      status: computedStatus,
    };
  });

  return (
    <TableContainer>
      <DataTable
        columns={[
          { key: 'id', label: 'CLIENT ID', sortable: true },
          { key: 'clientName', label: 'CLIENT NAME', sortable: true, render: (row: any) => (
            <span onClick={() => navigate(`/accounts-receivable/${row.id}`)} style={{ color: '#0F172A', fontWeight: 700, cursor: 'pointer' }}>
              {row.clientName}
            </span>
          )},
          { key: 'unpaidCount', label: 'UNPAID INVOICES', sortable: true, render: (row: any) => (
            <span style={{ fontWeight: 700, color: row.unpaidCount > 0 ? '#EF4444' : '#10B981' }}>
              {row.unpaidCount}
            </span>
          )},
          { key: 'totalOriginal', label: 'TOTAL BILLED', sortable: true, render: (row: any) => formatPeso(row.totalOriginal) },
          { key: 'totalOutstanding', label: 'OUTSTANDING BALANCE', sortable: true, render: (row: any) => (
            <span style={{ fontWeight: 700, color: row.totalOutstanding > 0 ? '#EF4444' : '#10B981' }}>
              {formatPeso(row.totalOutstanding)}
            </span>
          )},
          { key: 'worstBracket', label: 'AGING CATEGORY', render: (row: any) => (
            row.totalOutstanding > 0 ? (
              <span style={{
                padding: '3px 12px', borderRadius: 9999, fontWeight: 700, fontSize: '0.75rem',
                color: agingBracketColor[row.worstBracket] || '#64748B',
                background: (agingBracketColor[row.worstBracket] || '#64748B') + '18',
              }}>
                {row.worstBracket}
              </span>
            ) : <span style={{ color: '#10B981', fontWeight: 700 }}>Fully Paid</span>
          )},
          { key: 'status', label: 'STATUS', render: (row: any) => <StatusBadge status={row.status} /> },
        ]}
        data={listData}
        rowKey="id"
        searchPlaceholder="Search accounts receivable..."
        filters={[{
          key: 'status', label: 'All Statuses', options: [
            { label: 'Overdue', value: 'Overdue' },
            { label: 'Unpaid', value: 'Unpaid' },
            { label: 'Paid', value: 'Paid' },
          ],
          filterFn: (row: any, val: string) => row.status === val,
        }]}
      />
    </TableContainer>
  );
};

export default AccountsReceivable;
