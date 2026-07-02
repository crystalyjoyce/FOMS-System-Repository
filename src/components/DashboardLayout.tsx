import React from 'react';
import {
  BarChart, Bar, XAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  ClipboardList, CheckCircle2, Package, TrendingUp,
  Users, Truck, AlertCircle
} from 'lucide-react';
import './DashboardLayout.css';

/**
 * ─── SPEEDEX Graph Color Tokens (Stakeholder-Friendly) ───
 * Using the exact "Status Action Swatches" from the HTML standard.
 * This provides semantic meaning (Red=Bad, Amber=Warning) for stakeholders
 * without inventing random non-corporate colors.
 */
const C = {
  primary:  '#00A99D', // Brand Teal (Deliveries / Main)
  navy:     '#1B254B', // Secondary Navy (Returned pie slice)
  transit:  '#0284C7', // Transit Sky Blue
  pending:  '#D97706', // Pending Warning Amber
  failed:   '#DC2626', // Locked Error Red
};

/* ─── Static demo data ─── */
const weeklyData = [
  { day: 'Mon', deliveries: 42, returned: 3, failed: 2 },
  { day: 'Tue', deliveries: 58, returned: 5, failed: 1 },
  { day: 'Wed', deliveries: 35, returned: 2, failed: 4 },
  { day: 'Thu', deliveries: 71, returned: 7, failed: 3 },
  { day: 'Fri', deliveries: 63, returned: 4, failed: 2 },
  { day: 'Sat', deliveries: 29, returned: 1, failed: 1 },
  { day: 'Sun', deliveries: 14, returned: 0, failed: 0 },
];

const pieData = [
  { name: 'Delivered',  value: 214, color: C.primary },
  { name: 'In Transit', value: 67,  color: C.transit },
  { name: 'Pending',    value: 43,  color: C.pending },
  { name: 'Failed',     value: 18,  color: C.failed  },
  { name: 'Returned',   value: 12,  color: C.navy    },
];

const activityFeed = [
  { id: 1, text: 'Waybill SP-78921 delivered to Maria Santos',  time: '2 mins ago',  color: '#059669' },
  { id: 2, text: 'Waybill SP-78888 picked up by Driver Reyes',  time: '14 mins ago', color: '#0284C7' },
  { id: 3, text: 'Waybill SP-78790 marked as Failed',           time: '32 mins ago', color: '#DC2626' },
  { id: 4, text: 'New order SP-79001 submitted by Client BDO',  time: '1 hr ago',    color: '#D97706' },
  { id: 5, text: 'Waybill SP-78811 returned to warehouse',      time: '2 hrs ago',   color: '#1B254B' },
];

const statCards = [
  {
    label: 'Active Tasks',
    value: '110',
    sub: 'Pending & In-Transit',
    icon: <ClipboardList size={20} />,
    iconBg: 'rgba(217, 119, 6, 0.1)',      // --status-pending tint
    iconColor: '#D97706',                  // --status-pending
    accent: '#D97706',
  },
  {
    label: 'Completed Today',
    value: '214',
    sub: 'Total successful deliveries',
    icon: <CheckCircle2 size={20} />,
    iconBg: 'rgba(5, 150, 105, 0.1)',      // --status-active tint
    iconColor: '#059669',                  // --status-active
    accent: '#059669',
  },
  {
    label: 'In Transit',
    value: '67',
    sub: 'Currently on-road',
    icon: <Truck size={20} />,
    iconBg: 'rgba(2, 132, 199, 0.1)',      // --status-transit tint
    iconColor: '#0284C7',                  // --status-transit
    accent: '#0284C7',
  },
  {
    label: 'Failed / Returned',
    value: '30',
    sub: 'Needs attention',
    icon: <AlertCircle size={20} />,
    iconBg: 'rgba(220, 38, 38, 0.1)',      // --status-failed tint
    iconColor: '#DC2626',                  // --status-failed
    accent: '#DC2626',
  },
];

const systemStatus = [
  {
    name: 'Operation System',
    detail: '24 employees active',
    icon: <Users size={16} />,
    iconBg: 'rgba(0, 169, 157, 0.08)',
    iconColor: '#00A99D', // --primary
  },
  {
    name: 'Delivery Management',
    detail: '354 total orders',
    icon: <ClipboardList size={16} />,
    iconBg: 'rgba(220, 38, 38, 0.1)',
    iconColor: '#DC2626', // --status-failed
  },
  {
    name: 'Delivery Tracker',
    detail: '67 active shipments',
    icon: <Package size={16} />,
    iconBg: 'rgba(5, 150, 105, 0.1)',
    iconColor: '#059669', // --status-active
  },
];

/* ─── Custom Tooltip — styled per SPEEDEX card spec ─── */
const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #DDE2EB',
      borderRadius: '8px',          /* --radius-sm */
      padding: '10px 14px',
      boxShadow: '0px 4px 20px rgba(15, 23, 42, 0.05)', /* --shadow-card */
      fontSize: '0.8rem',
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill, display: 'inline-block' }} />
          <span style={{ color: '#475569' }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: '#0F172A' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

/* ─── Component ─── */
export const DashboardLayout: React.FC = () => (
  <div className="speedex-dashboard">

    {/* ── Header Card — matches .header-card from standard ── */}
    <div className="spx-header-card">
      <div className="spx-header-info">
        <h1>Board Overview</h1>
        <p>Admin Dashboard · Operations</p>
      </div>
      <div className="spx-header-controls">
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', background: '#F4F6F9', border: '1px solid #DDE2EB', borderRadius: '8px', padding: '8px 14px' }}>
          {today}
        </span>
      </div>
    </div>

    {/* ── Stat Cards — four-col grid from standard ── */}
    <div className="spx-stats-grid">
      {statCards.map((card) => (
        <div
          key={card.label}
          className="spx-stat-card"
          style={{ '--accent': card.accent } as React.CSSProperties}
        >
          <div className="spx-stat-icon" style={{ background: card.iconBg, color: card.iconColor }}>
            {card.icon}
          </div>
          <div>
            <div className="spx-stat-label">{card.label}</div>
            <div className="spx-stat-value">{card.value}</div>
            <div className="spx-stat-sub">{card.sub}</div>
          </div>
        </div>
      ))}
    </div>

    {/* ── Bar Chart + Activity Feed ── */}
    <div className="spx-main-grid">

      {/* Delivery Performance Bar Chart */}
      <div className="spx-card">
        <div className="spx-card-title">
          <div className="spx-card-title-left">
            <TrendingUp size={18} color="#00A99D" />
            Delivery Performance
          </div>
          {/* .badge-transit from standard */}
          <span className="spx-badge spx-badge-transit">This Week</span>
        </div>

        {/* Legend — using exact color tokens */}
        <div className="spx-legend">
          <div className="spx-legend-item">
            <div className="spx-legend-dot" style={{ background: C.primary }} />
            Deliveries
          </div>
          <div className="spx-legend-item">
            <div className="spx-legend-dot" style={{ background: C.pending }} />
            Returned
          </div>
          <div className="spx-legend-item">
            <div className="spx-legend-dot" style={{ background: C.failed }} />
            Failed
          </div>
        </div>

        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBF0F5" /* --bg-body */ />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600, fontFamily: 'Outfit' }}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(0, 169, 157, 0.03)' }} />
              <Bar dataKey="deliveries" name="Deliveries" fill={C.primary}  radius={[4,4,0,0]} maxBarSize={32} />
              <Bar dataKey="returned"   name="Returned"   fill={C.pending}  radius={[4,4,0,0]} maxBarSize={32} />
              <Bar dataKey="failed"     name="Failed"     fill={C.failed}   radius={[4,4,0,0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="spx-card">
        <div className="spx-card-title">
          <div className="spx-card-title-left">
            <ClipboardList size={18} color="#00A99D" />
            Recent Activity
          </div>
          {/* .badge-active from standard */}
          <span className="spx-badge spx-badge-active">Live</span>
        </div>
        {activityFeed.map((log) => (
          <div key={log.id} className="spx-feed-item">
            <div className="spx-feed-dot" style={{ background: log.color }} />
            <div>
              <div className="spx-feed-text">{log.text}</div>
              <div className="spx-feed-time">{log.time}</div>
            </div>
          </div>
        ))}
      </div>

    </div>

    {/* ── Pie Chart + System Status ── */}
    <div className="spx-bottom-grid">

      {/* Order Status Pie — donut using status color tokens */}
      <div className="spx-card">
        <div className="spx-card-title">
          <div className="spx-card-title-left">
            <Package size={18} color="#00A99D" />
            Order Status Breakdown
          </div>
          <span className="spx-badge spx-badge-pending">All Time</span>
        </div>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="40%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: any, name: any) => [`${val} orders`, name]}
                contentStyle={{
                  fontSize: '0.8rem',
                  borderRadius: '8px',             /* --radius-sm */
                  border: '1px solid #DDE2EB',     /* --border */
                  boxShadow: '0px 4px 20px rgba(15, 23, 42, 0.05)', /* --shadow-card */
                  fontFamily: 'Outfit, sans-serif',
                }}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500, fontFamily: 'Outfit' }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Status */}
      <div className="spx-card">
        <div className="spx-card-title">
          <div className="spx-card-title-left">
            <TrendingUp size={18} color="#00A99D" />
            System Status
          </div>
          {/* .badge-active from standard */}
          <span className="spx-badge spx-badge-active">All Operational</span>
        </div>
        {systemStatus.map((s) => (
          <div key={s.name} className="spx-system-item">
            <div className="spx-system-icon" style={{ background: s.iconBg, color: s.iconColor }}>
              {s.icon}
            </div>
            <div>
              <div className="spx-system-name">{s.name}</div>
              <div className="spx-system-detail">{s.detail}</div>
            </div>
            <span className="spx-system-uptime">99.9%</span>
          </div>
        ))}
      </div>

    </div>
  </div>
);

export default DashboardLayout;
