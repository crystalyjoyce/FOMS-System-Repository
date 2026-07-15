import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, AuditLog } from '../data/seed';
import type { UserRole } from '../types/auth';
import { Card } from '../components/Card';
import { Button } from '../components/Buttons';
import { StatusCard } from '../components/StatusCard';
import { DeliveryPerformanceChart, OrderStatusChart } from '../components/DashboardCharts';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { DataTable } from '../components/DataTable';
import { useAppData } from '../context/AppDataContext';
import { RecentActivity } from '../components/RecentActivity';
import { TableContainer } from '../components/TableContainer';

// ── Role Dashboard Components ──────────────────────────────────────

const CoordinatorDashboard: React.FC = () => {
  const { waybills, clients, auditLogs } = useAppData();
  const pendingWaybills = waybills.filter(w => w.status === 'Pending Validation' || w.status === 'CTC Submitted').length;
  const todayIntake = waybills.filter(w => new Date(w.encodedAt).toDateString() === new Date().toDateString()).length;
  const activeClients = clients.filter((c: any) => c.status === 'Active').length;
  const recentActivity = auditLogs.filter(log => log.userRole === 'Coordinator').slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatusCard label="Today's Intake" value={todayIntake} icon="ti-file-import" variant="new" periodText="Waybills recorded today" />
        <StatusCard label="Pending Validation" value={pendingWaybills} icon="ti-clock-hour-4" variant="warning" periodText="Awaiting POD check" />
        <StatusCard label="Total Active Clients" value={activeClients} icon="ti-users" variant="success" periodText="Registered clients" />
      </div>

      <RecentActivity logs={recentActivity} />
    </div>
  );
};

const AccountantDashboard: React.FC = () => {
  const { waybills, invoices, auditLogs } = useAppData();
  const pendingWaybillsCount = waybills.filter(w => w.status === 'Validated' || w.status === 'Validated (CTC)' || w.status === 'CTC Submitted').length;
  const outstandingInvoicesCount = invoices.filter(i => i.status === 'Pending Approval' || i.status === 'Finalized').length;
  const draftInvoicesCount = invoices.filter(i => i.status === 'Draft').length;
  
  // Ensure we get at least 5 logs if possible, filtering by role
  const recentActivity = auditLogs.filter(l => l.userRole === 'Accountant').slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatusCard label="Waybills Pending Invoice" value={pendingWaybillsCount} icon="ti-file-description" variant="new" periodText="Validated or CTC Submitted" />
        <StatusCard label="Outstanding Invoices" value={outstandingInvoicesCount} icon="ti-file-invoice" variant="warning" periodText="Pending Approval or Sent" />
        <StatusCard label="Draft Invoices" value={draftInvoicesCount} icon="ti-edit" variant="info" periodText="Not yet submitted" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <RecentActivity logs={recentActivity.length >= 5 ? recentActivity : auditLogs.filter(l => l.userRole === 'Accountant' || l.action.includes('INVOICE') || l.action.includes('PAYMENT')).slice(0, 5)} />
      </div>
    </div>
  );
};

const HeadAccountantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { invoices, auditLogs } = useAppData();
  const pending = invoices.filter(i => i.status === 'Pending Approval').length;
  const verified = invoices.filter(i => i.status === 'Verified').length;
  const flagged = invoices.filter(i => i.status === 'Needs Revision').length;
  const recentActivity = auditLogs.filter(l => l.userRole === 'Head Accountant').slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatusCard label="Pending Review" value={pending} icon="ti-clock-hour-4" variant="warning" periodText="Awaiting your verification" />
        <StatusCard label="Verified Today" value={verified} icon="ti-circle-check" variant="success" periodText="Verified invoices" />
        <StatusCard label="Flagged Discrepancies" value={flagged} icon="ti-alert-circle" variant="danger" periodText="Returned to Accountant" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Invoices Requiring Review</h3>
          {invoices.filter(i => i.status === 'Pending Approval').map(inv => (
            <div key={inv.id} onClick={() => navigate('/invoice-review', { state: { invoiceId: inv.id, clientId: inv.clientId } })} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>{inv.invoiceNumber}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>Due: {new Date(inv.dueDate).toLocaleDateString('en-PH')}</p>
              </div>
              <p style={{ margin: 0, fontWeight: 700, color: '#F59E0B' }}>₱{inv.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            </div>
          ))}
          {pending === 0 && <p style={{ color: '#94A3B8', fontSize: '0.875rem', textAlign: 'center', padding: '24px 0' }}>No invoices pending review.</p>}
        </Card>
        <RecentActivity logs={recentActivity.length > 0 ? recentActivity : auditLogs.slice(0, 5)} />
      </div>
    </div>
  );
};

const AsstFinanceDashboard: React.FC = () => {
  const { arRecords, payments, auditLogs } = useAppData();
  const totalAR = arRecords.reduce((s: any, r: any) => s + r.outstandingBalance, 0);
  const nearDue = arRecords.filter(r => r.status === 'Due Soon').length;
  
  // Recent payments (recorded within last 7 days roughly, or just all recent ones for demo purposes)
  const recentPayments = payments.filter(p => p.status === 'Validated' || p.status === 'Pending Validation').length;
  
  const recentActivity = auditLogs.filter(l => l.userRole === 'Assistant of Finance Manager').slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatusCard label="Total Outstanding AR" value={`₱${totalAR.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} icon="ti-report-money" variant="new" />
        <StatusCard label="Near-Due Accounts" value={nearDue} icon="ti-calendar-time" variant="warning" periodText="Due within 7 days" />
        <StatusCard label="Recent Payments" value={recentPayments} icon="ti-coin" variant="success" periodText="Recorded this week" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <RecentActivity logs={recentActivity.length > 0 ? recentActivity : auditLogs.slice(0, 5)} />
      </div>
    </div>
  );
};

const FinanceManagerDashboard: React.FC = () => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { invoices, arRecords, payments, clients } = useAppData();
  const [collectionTrendView, setCollectionTrendView] = useState<'weekly' | 'monthly'>('monthly');

  const filteredInvoices = selectedClientId ? invoices.filter(i => i.clientId === selectedClientId) : invoices;
  const filteredAR = selectedClientId ? arRecords.filter(r => r.clientId === selectedClientId) : arRecords;
  const filteredPayments = selectedClientId ? payments.filter(p => p.clientId === selectedClientId) : payments;

  const totalBilled = filteredInvoices.reduce((s: any, i: any) => s + i.totalAmount, 0);
  const totalCollected = filteredInvoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.totalAmount, 0);
  const totalAR = arRecords.reduce((s, r) => s + r.outstandingBalance, 0);
  const collectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : '0.0';
  
  // Cash Inflow this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const cashInflow = filteredPayments.filter(p => {
    const d = new Date(p.recordedAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && p.status === 'Validated';
  }).reduce((s, p) => s + p.amount, 0);

  // AR Aging Donut Data
  const agingData = [
    { name: 'Current', value: filteredAR.filter(r => r.agingBracket === 'Current').reduce((s, r) => s + r.outstandingBalance, 0), color: '#3B82F6' },
    { name: '0-30 Days', value: filteredAR.filter(r => r.agingBracket === '0-30 days').reduce((s, r) => s + r.outstandingBalance, 0), color: '#10B981' },
    { name: '31-60 Days', value: filteredAR.filter(r => r.agingBracket === '31-60 days').reduce((s, r) => s + r.outstandingBalance, 0), color: '#F59E0B' },
    { name: '61-90 Days', value: filteredAR.filter(r => r.agingBracket === '61-90 days').reduce((s, r) => s + r.outstandingBalance, 0), color: '#F97316' },
    { name: '90+ Days', value: filteredAR.filter(r => r.agingBracket === '90+ days').reduce((s, r) => s + r.outstandingBalance, 0), color: '#EF4444' },
  ].filter(d => d.value > 0);

  // Collection Trend Data
  const collectionTrendMonthly = [
    { period: 'Jan', collected: 120000 },
    { period: 'Feb', collected: 150000 },
    { period: 'Mar', collected: 180000 },
    { period: 'Apr', collected: 140000 },
    { period: 'May', collected: 190000 },
    { period: 'Jun', collected: 210000 },
    { period: 'Jul', collected: cashInflow > 0 ? cashInflow : 80000 },
  ];
  
  const collectionTrendWeekly = [
    { period: 'W1 Jul', collected: 20000 },
    { period: 'W2 Jul', collected: 35000 },
    { period: 'W3 Jul', collected: 15000 },
    { period: 'W4 Jul', collected: 10000 },
  ];

  const trendData = collectionTrendView === 'monthly' ? collectionTrendMonthly : collectionTrendWeekly;

  // Accounts Near Due Date Table Data
  
  const rawNearDueAccounts = invoices
    .filter(inv => inv.status !== 'Paid' && inv.status !== 'Finalized')
    .map(inv => {
      const client = clients.find(c => c.id === inv.clientId);
      const dueDate = new Date(inv.dueDate);
      const daysRemaining = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        id: inv.id,
        clientId: inv.clientId,
        clientName: client?.name || 'Unknown',
        invoiceNumber: inv.invoiceNumber,
        amountDue: inv.totalAmount,
        dueDate: inv.dueDate,
        daysRemaining
      };
    });

  let nearDueAccounts: any[] = [];
  if (selectedClientId) {
    nearDueAccounts = rawNearDueAccounts
      .filter(r => r.clientId === selectedClientId)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  } else {
    const grouped = new Map<string, any[]>();
    rawNearDueAccounts.forEach(r => {
      if (!grouped.has(r.clientId)) grouped.set(r.clientId, []);
      grouped.get(r.clientId)!.push(r);
    });
    nearDueAccounts = Array.from(grouped.entries()).map(([clientId, recs]) => {
      const minDays = Math.min(...recs.map(r => r.daysRemaining));
      const minRow = recs.find(r => r.daysRemaining === minDays);
      return {
        id: clientId,
        clientId,
        clientName: minRow?.clientName,
        invoiceNumber: '[Multiple]',
        amountDue: recs.reduce((sum, r) => sum + r.amountDue, 0),
        dueDate: minRow?.dueDate,
        daysRemaining: minDays,
        isGrouped: true
      };
    }).sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  const tableColumns = [
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
    { key: 'amountDue', label: 'AMOUNT DUE', render: (row: any) => `₱${row.amountDue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
    { key: 'dueDate', label: 'DUE DATE', render: (row: any) => new Date(row.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) },
    { key: 'daysRemaining', label: 'STATUS', render: (row: any) => {
      if (row.daysRemaining < 0) return <span style={{ color: '#EF4444', fontWeight: 700 }}>{Math.abs(row.daysRemaining)} days overdue</span>;
      if (row.daysRemaining === 0) return <span style={{ color: '#F59E0B', fontWeight: 700 }}>Due Today</span>;
      return <span style={{ color: '#10B981', fontWeight: 700 }}>{row.daysRemaining} days left</span>;
    }},
  ];

  const displayColumns = selectedClientId 
    ? tableColumns 
    : tableColumns.filter(c => !['invoiceNumber'].includes(c.key as string));


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatusCard label="Total AR Outstanding" value={`₱${totalAR.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} icon="ti-report-money" variant="warning" />
        <StatusCard label="Collection Rate" value={`${collectionRate}%`} icon="ti-chart-pie" variant="info" periodText="vs. total invoiced" />
        <StatusCard label="Cash Inflow (This Month)" value={`₱${cashInflow.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} icon="ti-cash" variant="success" />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* AR Aging Distribution */}
        <Card>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>AR Aging Distribution</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>Outstanding Balance by Overdue Period</p>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={agingData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                  {agingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#334155' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Collection Trend */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Collection Trend</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>Cash inflow over time</p>
            </div>
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '4px' }}>
              <button 
                onClick={() => setCollectionTrendView('weekly')}
                style={{ padding: '4px 12px', fontSize: '0.8125rem', fontWeight: 600, border: 'none', borderRadius: '6px', cursor: 'pointer', background: collectionTrendView === 'weekly' ? '#fff' : 'transparent', color: collectionTrendView === 'weekly' ? '#0F172A' : '#64748B', boxShadow: collectionTrendView === 'weekly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
              >
                Weekly
              </button>
              <button 
                onClick={() => setCollectionTrendView('monthly')}
                style={{ padding: '4px 12px', fontSize: '0.8125rem', fontWeight: 600, border: 'none', borderRadius: '6px', cursor: 'pointer', background: collectionTrendView === 'monthly' ? '#fff' : 'transparent', color: collectionTrendView === 'monthly' ? '#0F172A' : '#64748B', boxShadow: collectionTrendView === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
              >
                Monthly
              </button>
            </div>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} tickFormatter={(val) => `₱${val >= 1000 ? (val / 1000).toFixed(1).replace('.0', '') + 'k' : val}`} width={60} />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  formatter={(value: any) => [`₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 'Collected']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}
                />
                <Bar dataKey="collected" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Accounts Near Due Date Table */}
      <TableContainer>
        <DataTable 
          title="Accounts Near Due Date"
          data={nearDueAccounts} 
          columns={displayColumns} 
          rowKey="id" 
          searchPlaceholder="Search accounts..." 
          searchFields={['clientName', 'invoiceNumber'] as any}
          emptyMessage="No accounts are near their due date."
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

// ── Main Dashboard ─────────────────────────────────────────────────
const DASHBOARD_MAP: Record<UserRole, React.FC> = {
  'Coordinator': CoordinatorDashboard,
  'Accountant': AccountantDashboard,
  'Head Accountant': HeadAccountantDashboard,
  'Assistant of Finance Manager': AsstFinanceDashboard,
  'Finance Manager': FinanceManagerDashboard,
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;
  const RoleDashboard = DASHBOARD_MAP[user.role];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <RoleDashboard />
    </div>
  );
};

export default Dashboard;
