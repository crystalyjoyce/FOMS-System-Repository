import React, { Component, ErrorInfo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SEEDED_INVOICES, SEEDED_CLIENTS, SEEDED_AR_RECORDS, SEEDED_PAYMENTS } from '../data/seed';
import { TableContainer } from '../components/TableContainer';
import { StatusCard } from '../components/StatusCard';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line, ComposedChart } from 'recharts';

class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: '#fee2e2', color: '#991b1b', borderRadius: 8 }}>
          <h2>Something went wrong in Reports.tsx.</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const BRACKET_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  '0-30 days': { bg: '#F0FDF4', color: '#10B981', border: '#BBF7D0' },
  '31-60 days': { bg: '#FFFBEB', color: '#F59E0B', border: '#FDE68A' },
  '61-90 days': { bg: '#FFF7ED', color: '#F97316', border: '#FED7AA' },
  '90+ days': { bg: '#FEF2F2', color: '#EF4444', border: '#FECACA' },
};

type ReportTab = 'aging' | 'invoices' | 'collections';

const ReportsContent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as ReportTab) || 'aging';
  const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null);

  let agingRecords: any[] = [];
  if (selectedClientId) {
    agingRecords = SEEDED_AR_RECORDS.filter(ar => ar.clientId === selectedClientId).map(ar => {
      const client = SEEDED_CLIENTS.find(c => c.id === ar.clientId);
      const invoice = SEEDED_INVOICES.find(i => i.id === ar.invoiceId);
      return {
        ...ar,
        clientName: client?.name ?? 'Unknown',
        invoiceNumber: invoice?.invoiceNumber ?? ar.invoiceId,
        amount: ar.outstandingBalance,
        status: ar.status
      };
    });
  } else {
    const grouped = new Map<string, any[]>();
    SEEDED_AR_RECORDS.forEach(ar => {
      if (!grouped.has(ar.clientId)) grouped.set(ar.clientId, []);
      grouped.get(ar.clientId)!.push(ar);
    });
    agingRecords = Array.from(grouped.entries()).map(([clientId, recs]) => {
      const client = SEEDED_CLIENTS.find(c => c.id === clientId);
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
        amount: recs.reduce((sum, r) => sum + r.outstandingBalance, 0),
        agingDays: Math.max(...recs.map(r => r.agingDays)),
        agingBracket: 'Mixed',
        status: status,
        isGrouped: true
      };
    });
  }

  // For bracket cards always count from ALL AR records (not grouped)
  const getAgingBracketData = (bracket: string) => {
    const base = selectedClientId
      ? SEEDED_AR_RECORDS.filter(r => r.clientId === selectedClientId)
      : SEEDED_AR_RECORDS;
    const recs = base.filter(r => r.agingBracket === bracket);
    return {
      count: recs.length,
      total: recs.reduce((sum, r) => sum + r.outstandingBalance, 0)
    };
  };

  const agingChartData = ['0-30 days', '31-60 days', '61-90 days', '90+ days'].map(bracket => {
    const data = getAgingBracketData(bracket);
    return {
      name: bracket,
      value: data.total,
      color: BRACKET_COLORS[bracket].color
    };
  });

  const agingColumns = [
    { key: 'clientName', label: 'CLIENT', sortable: true, render: (row: any) => (
      !selectedClientId ? (
        <button onClick={() => setSelectedClientId(row.clientId)} style={{ background: 'none', border: 'none', padding: 0, color: '#3B82F6', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
          {row.clientName}
        </button>
      ) : (
        <span style={{ fontWeight: 600 }}>{row.clientName}</span>
      )
    ) },
    { key: 'invoiceNumber', label: 'INVOICE NO.' },
    { key: 'invoiceDate', label: 'INVOICE DATE', render: (row: any) => row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString('en-PH') : 'N/A' },
    { key: 'dueDate', label: 'DUE DATE', render: (row: any) => row.dueDate ? new Date(row.dueDate).toLocaleDateString('en-PH') : 'N/A' },
    { key: 'amount', label: 'AMOUNT', render: (row: any) => `₱${row.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
    { key: 'agingDays', label: 'DAYS OUTSTANDING', sortable: true },
    { key: 'agingBracket', label: 'AGING BRACKET' },
    { key: 'status', label: 'STATUS', render: (row: any) => <StatusBadge status={row.status} /> }
  ];

  // ── 2. Invoice Summary Tab Data ────────────────────────────────
  let allInvoices: any[] = [];
  if (selectedClientId) {
    allInvoices = SEEDED_INVOICES.filter(i => i.clientId === selectedClientId).map(i => {
      const client = SEEDED_CLIENTS.find(c => c.id === i.clientId);
      return {
        ...i,
        clientName: client?.name ?? 'Unknown'
      };
    });
  } else {
    const grouped = new Map<string, any[]>();
    SEEDED_INVOICES.forEach(inv => {
      if (!grouped.has(inv.clientId)) grouped.set(inv.clientId, []);
      grouped.get(inv.clientId)!.push(inv);
    });
    allInvoices = Array.from(grouped.entries()).map(([clientId, recs]) => {
      const client = SEEDED_CLIENTS.find(c => c.id === clientId);
      const statuses = Array.from(new Set(recs.map(r => r.status)));
      const status = statuses.length === 1 ? statuses[0] : 'Mixed';
      const maxDate = new Date(Math.max(...recs.map(r => new Date(r.createdAt).getTime())));
      
      return {
        id: clientId, 
        clientId,
        invoiceNumber: recs.length === 1 ? recs[0].invoiceNumber : '[Multiple]',
        clientName: client?.name ?? 'Unknown',
        createdAt: maxDate.toISOString(),
        dueDate: maxDate.toISOString(),
        totalAmount: recs.reduce((sum, r) => sum + r.totalAmount, 0),
        status: status,
        isGrouped: true
      };
    });
  }

  const totalInvoiced = allInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = allInvoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.totalAmount, 0);
  const totalOutstanding = allInvoices.filter(i => ['Sent', 'Overdue'].includes(i.status)).reduce((sum, i) => sum + i.totalAmount, 0);

  const invoiceMonthlyData = allInvoices.reduce((acc, inv) => {
    const date = new Date(inv.createdAt);
    const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!acc[month]) acc[month] = { name: month, Invoiced: 0, Paid: 0, Outstanding: 0 };
    acc[month].Invoiced += inv.totalAmount;
    if (inv.status === 'Paid') acc[month].Paid += inv.totalAmount;
    else if (['Sent', 'Overdue'].includes(inv.status)) acc[month].Outstanding += inv.totalAmount;
    return acc;
  }, {} as Record<string, any>);
  const invoiceChartData = Object.values(invoiceMonthlyData).sort((a: any, b: any) => new Date(`1 ${a.name}`).getTime() - new Date(`1 ${b.name}`).getTime());

  const invoiceColumns = [
    { key: 'invoiceNumber', label: 'INVOICE NO.', sortable: true },
    { key: 'clientName', label: 'CLIENT', sortable: true, render: (row: any) => (
      !selectedClientId ? (
        <button onClick={() => setSelectedClientId(row.clientId)} style={{ background: 'none', border: 'none', padding: 0, color: '#3B82F6', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
          {row.clientName}
        </button>
      ) : (
        <span style={{ fontWeight: 600 }}>{row.clientName}</span>
      )
    ) },
    { key: 'createdAt', label: 'ISSUE DATE', render: (row: any) => new Date(row.createdAt).toLocaleDateString('en-PH') },
    { key: 'dueDate', label: 'DUE DATE', render: (row: any) => new Date(row.dueDate).toLocaleDateString('en-PH') },
    { key: 'totalAmount', label: 'TOTAL AMOUNT', render: (row: any) => `₱${row.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
    { key: 'status', label: 'STATUS', render: (row: any) => <StatusBadge status={row.status} /> }
  ];

  // ── 3. Collection Report Tab Data ──────────────────────────────
  let collections: any[] = [];
  const baseCollections = SEEDED_PAYMENTS.filter(p => p.status === 'Validated' || p.status === 'Approved');
  if (selectedClientId) {
    collections = baseCollections.filter(p => p.clientId === selectedClientId).map(p => {
      const client = SEEDED_CLIENTS.find(c => c.id === p.clientId);
      const invoice = SEEDED_INVOICES.find(i => i.id === p.invoiceId);
      return {
        ...p,
        clientName: client?.name ?? 'Unknown',
        invoiceNumber: invoice?.invoiceNumber ?? p.invoiceId
      };
    });
  } else {
    const grouped = new Map<string, any[]>();
    baseCollections.forEach(col => {
      if (!grouped.has(col.clientId)) grouped.set(col.clientId, []);
      grouped.get(col.clientId)!.push(col);
    });
    collections = Array.from(grouped.entries()).map(([clientId, recs]) => {
      const client = SEEDED_CLIENTS.find(c => c.id === clientId);
      const maxDate = new Date(Math.max(...recs.map(r => new Date(r.recordedAt).getTime())));
      
      return {
        id: clientId, 
        clientId,
        invoiceNumber: recs.length === 1 ? recs[0].invoiceNumber : '[Multiple]',
        clientName: client?.name ?? 'Unknown',
        paymentMethod: 'Mixed',
        amount: recs.reduce((sum, r) => sum + r.amount, 0),
        recordedAt: maxDate.toISOString(),
        isGrouped: true
      };
    });
  }

  const totalCollected = SEEDED_PAYMENTS.filter(p => p.status === 'Validated' || p.status === 'Approved').reduce((sum, c) => sum + c.amount, 0);
  // Breakdown by method from individual (non-grouped) payments
  const methodBreakdown = SEEDED_PAYMENTS
    .filter(p => p.status === 'Validated' || p.status === 'Approved')
    .reduce((acc, p) => {
      acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

  const collectionMonthlyData = baseCollections.reduce((acc, col) => {
    if (selectedClientId && col.clientId !== selectedClientId) return acc;
    const date = new Date(col.recordedAt);
    const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!acc[month]) acc[month] = { name: month, Collected: 0 };
    acc[month].Collected += col.amount;
    return acc;
  }, {} as Record<string, any>);
  const collectionChartData = Object.values(collectionMonthlyData).sort((a: any, b: any) => new Date(`1 ${a.name}`).getTime() - new Date(`1 ${b.name}`).getTime());
  
  const breakdownString = Object.entries(methodBreakdown)
    .map(([method, amount]: [string, any]) => `${method}: ₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`)
    .join(' | ');

  const collectionColumns = [
    { key: 'id', label: 'PAYMENT ID', sortable: true },
    { key: 'invoiceNumber', label: 'INVOICE NO.' },
    { key: 'clientName', label: 'CLIENT', sortable: true, render: (row: any) => (
      !selectedClientId ? (
        <button onClick={() => setSelectedClientId(row.clientId)} style={{ background: 'none', border: 'none', padding: 0, color: '#3B82F6', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
          {row.clientName}
        </button>
      ) : (
        <span style={{ fontWeight: 600 }}>{row.clientName}</span>
      )
    ) },
    { key: 'amount', label: 'AMOUNT PAID', render: (row: any) => <span style={{ fontWeight: 700, color: '#10B981' }}>₱{row.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span> },
    { key: 'paymentMethod', label: 'PAYMENT METHOD' },
    { key: 'recordedAt', label: 'DATE COLLECTED', render: (row: any) => new Date(row.recordedAt).toLocaleDateString('en-PH') }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {selectedClientId && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -8 }}>
          <button onClick={() => setSelectedClientId(null)} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="ti ti-arrow-left"></i> Back to Summary
          </button>
        </div>
      )}
      {/* ── Tab 1: Aging of Accounts ── */}
      {activeTab === 'aging' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'stretch' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {['0-30 days', '31-60 days', '61-90 days', '90+ days'].map(bracket => {
                const data = getAgingBracketData(bracket);
                const { bg, color, border } = BRACKET_COLORS[bracket];
                return (
                  <div key={bracket} className="kpi-anim-wrapper" style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 12, padding: '18px 20px', cursor: 'default' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '0.78rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{bracket}</p>
                    <p style={{ margin: '0 0 2px', fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>{data.count} unpaid</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>₱{data.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                  </div>
                );
              })}
            </div>
            
            <div className="kpi-anim-wrapper" style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Receivables Aging Breakdown</p>
                <i className="ti ti-chart-pie" style={{ color: '#F97316', fontSize: '1.2rem' }}></i>
              </div>
              <div style={{ flex: 1, width: '100%', minHeight: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={agingChartData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                      {agingChartData.filter(d => d.value > 0).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(val: any) => `₱${Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 600 }} />
                    <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <TableContainer>
            <DataTable 
              title="Detailed Aging Ledger"
              data={agingRecords} 
              columns={selectedClientId ? agingColumns : agingColumns.filter(c => !['invoiceNumber', 'agingBracket', 'status'].includes(c.key))} 
              rowKey="id"
              exportable={true} 
              columnToggle={true} 
              densityToggle={true} 
              searchPlaceholder="Search aging records (Client, Invoice)..."
              searchFields={['clientName', 'invoiceNumber', 'agingBracket']}
            />
          </TableContainer>
        </>
      )}

      {/* ── Tab 2: Invoice Summary ── */}
      {activeTab === 'invoices' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <StatusCard label="Total Invoiced" value={`₱${totalInvoiced.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} icon="ti-file-invoice" variant="teal" />
            <StatusCard label="Total Paid" value={`₱${totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} icon="ti-check" variant="success" />
            <StatusCard label="Total Outstanding" value={`₱${totalOutstanding.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} icon="ti-alert-circle" variant="warning" />
          </div>
          
          <div className="kpi-anim-wrapper" style={{ background: '#fff', borderRadius: 12, padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: 24 }}>
            <p style={{ margin: '0 0 20px', fontSize: '0.85rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoicing Timeline</p>
            <div style={{ height: 280, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={invoiceChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val) => `₱${val >= 1000 ? (val / 1000).toFixed(1).replace('.0', '') + 'k' : val}`} width={60} />
                  <Tooltip formatter={(val: any) => `₱${Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} iconType="circle" />
                  <Bar yAxisId="left" dataKey="Invoiced" fill="#0EA5E9" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar yAxisId="left" dataKey="Paid" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar yAxisId="left" dataKey="Outstanding" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          

          <TableContainer>
            <DataTable 
              title="Invoice Summary Report"
              data={allInvoices} 
              columns={selectedClientId ? invoiceColumns : invoiceColumns.filter(c => !['invoiceNumber', 'status'].includes(c.key))} 
              rowKey="id"
              exportable={true} 
              columnToggle={true} 
              densityToggle={true}
              searchPlaceholder="Search invoices (No, Client, Status)..."
              searchFields={['invoiceNumber', 'clientName', 'status']}
            />
          </TableContainer>
        </>
      )}

      {/* ── Tab 3: Collection Report ── */}
      {activeTab === 'collections' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <StatusCard label="Total Collected (This Period)" value={`₱${totalCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} icon="ti-coin" variant="success" />
            <div className="kpi-anim-wrapper" style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Breakdown by Method</p>
                <i className="ti ti-chart-pie" style={{ color: '#0EA5E9', fontSize: '1.2rem' }}></i>
              </div>
              
              {Object.keys(methodBreakdown).length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '20px' }}>
                  {/* Left Side: Donut Chart */}
                  <div style={{ width: 140, height: 140, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(methodBreakdown).map(([method, amount]) => {
                            let color = '#3B82F6';
                            const lower = method.toLowerCase();
                            if (lower.includes('gcash')) color = '#2563EB';
                            else if (lower.includes('maya')) color = '#10B981';
                            else if (lower.includes('check')) color = '#F59E0B';
                            else if (lower.includes('bank')) color = '#8B5CF6';
                            return { name: method, value: amount, color };
                          })}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {Object.entries(methodBreakdown).map(([method, _], index) => {
                            let color = '#3B82F6';
                            const lower = method.toLowerCase();
                            if (lower.includes('gcash')) color = '#2563EB';
                            else if (lower.includes('maya')) color = '#10B981';
                            else if (lower.includes('check')) color = '#F59E0B';
                            else if (lower.includes('bank')) color = '#8B5CF6';
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Pie>
                        <Tooltip 
                          formatter={(val: any) => `₱${Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 600 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Right Side: Pills Legend */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'center' }}>
                    {Object.entries(methodBreakdown).map(([method, amount]: [string, any]) => {
                      let color = '#3B82F6'; 
                      let bg = '#EFF6FF';
                      const lower = method.toLowerCase();
                      if (lower.includes('gcash')) { color = '#2563EB'; bg = '#DBEAFE'; }
                      else if (lower.includes('maya')) { color = '#10B981'; bg = '#D1FAE5'; }
                      else if (lower.includes('check')) { color = '#F59E0B'; bg = '#FEF3C7'; }
                      else if (lower.includes('bank')) { color = '#8B5CF6'; bg = '#EDE9FE'; }

                      return (
                        <div key={method} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: bg, padding: '6px 10px', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B' }}>{method}</span>
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color }}>₱{amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <span style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 500 }}>No collections recorded.</span>
                </div>
              )}
            </div>
            
            <div className="kpi-anim-wrapper" style={{ background: '#fff', borderRadius: 12, padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', gridColumn: '1 / -1', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Collection Trend (Timeline)</p>
                <i className="ti ti-chart-line" style={{ color: '#10B981', fontSize: '1.2rem' }}></i>
              </div>
              <div style={{ height: 260, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={collectionChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val) => `₱${val >= 1000 ? (val / 1000).toFixed(1).replace('.0', '') + 'k' : val}`} width={60} />
                    <Tooltip formatter={(val: any) => `₱${Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="Collected" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          

          <TableContainer>
            <DataTable 
              title="Collection Report"
              data={collections} 
              columns={selectedClientId ? collectionColumns : collectionColumns.filter(c => !['id', 'invoiceNumber', 'paymentMethod'].includes(c.key))} 
              rowKey="id"
              exportable={true} 
              columnToggle={true} 
              densityToggle={true}
              searchPlaceholder="Search collections (Payment ID, Invoice, Method)..."
              searchFields={['id', 'invoiceNumber', 'clientName', 'paymentMethod']}
            />
          </TableContainer>
        </>
      )}
    </div>
  );
};

export const Reports: React.FC = () => (
  <ErrorBoundary>
    <ReportsContent />
  </ErrorBoundary>
);

export default Reports;
