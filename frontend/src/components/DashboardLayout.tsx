import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  ClipboardList, CheckCircle2, Package, TrendingUp,
  Users, Truck, AlertCircle, RefreshCw, Calendar,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import './DashboardLayout.css';
import './FormModals.css';
import StatusCard from './StatusCard';
import { CalendarRangePicker } from './FormModals';

/**
 * ─── SPEEDEX Graph Color Tokens (Stakeholder-Friendly) ───
 */
const C = {
  success:  'var(--chart-success, #00A99D)', // Delivered / Completed (Teal)
  info:     'var(--chart-info, #0284C7)',    // In Transit (Blue)
  warning:  'var(--chart-warning, #D97706)', // Pending / Preparing (Amber)
  failed:   'var(--chart-failed, #DC2626)',  // Critical / Failed (Red)
  neutral:  'var(--chart-neutral, #64748B)', // Returned / Cancelled (Grey)

  // 10-Color Sequential Teal Scale for multi-series line charts
  teal50:   'var(--chart-teal-50, #E6FAF8)',
  teal100:  'var(--chart-teal-100, #CCF5F0)',
  teal200:  'var(--chart-teal-200, #99EAE0)',
  teal300:  'var(--chart-teal-300, #66E0D1)',
  teal400:  'var(--chart-teal-400, #33D5C2)',
  teal500:  'var(--chart-teal-500, #00A99D)',
  teal600:  'var(--chart-teal-600, #009189)',
  teal700:  'var(--chart-teal-700, #007A72)',
  teal800:  'var(--chart-teal-800, #00625B)',
  teal900:  'var(--chart-teal-900, #004B46)',
};

/* ─── Static demo data fallbacks ─── */
const weeklyDataDefault = [
  { day: 'Mon', deliveries: 42, returned: 3, failed: 2 },
  { day: 'Tue', deliveries: 58, returned: 5, failed: 1 },
  { day: 'Wed', deliveries: 35, returned: 2, failed: 4 },
  { day: 'Thu', deliveries: 71, returned: 7, failed: 3 },
  { day: 'Fri', deliveries: 63, returned: 4, failed: 2 },
  { day: 'Sat', deliveries: 29, returned: 1, failed: 1 },
  { day: 'Sun', deliveries: 14, returned: 0, failed: 0 },
];

const todayDataDefault = [
  { day: '8:00 AM', deliveries: 12, returned: 1, failed: 0 },
  { day: '11:00 AM', deliveries: 25, returned: 2, failed: 1 },
  { day: '2:00 PM', deliveries: 32, returned: 3, failed: 2 },
  { day: '5:00 PM', deliveries: 18, returned: 1, failed: 0 },
  { day: '8:00 PM', deliveries: 8,  returned: 0, failed: 1 },
];

const thirtyDayDataDefault = [
  { day: 'Wk 1', deliveries: 180, returned: 12, failed: 8 },
  { day: 'Wk 2', deliveries: 220, returned: 15, failed: 5 },
  { day: 'Wk 3', deliveries: 195, returned: 10, failed: 12 },
  { day: 'Wk 4', deliveries: 245, returned: 18, failed: 6 },
];

const customDataDefault = [
  { day: 'Range A', deliveries: 90, returned: 5, failed: 3 },
  { day: 'Range B', deliveries: 140, returned: 8, failed: 7 },
];

const pieDataDefault = [
  { name: 'Delivered',  value: 214, color: C.success },
  { name: 'In Transit', value: 67,  color: C.info },
  { name: 'Pending',    value: 43,  color: C.warning },
  { name: 'Failed',     value: 18,  color: C.failed  },
  { name: 'Returned',   value: 12,  color: C.neutral },
];

const activityFeedDefault = [
  { id: 1, text: 'Waybill SP-78921 delivered to Maria Santos',  time: '2 mins ago',  color: C.success },
  { id: 2, text: 'Waybill SP-78888 picked up by Driver Reyes',  time: '14 mins ago', color: C.info },
  { id: 3, text: 'Waybill SP-78790 marked as Failed',           time: '32 mins ago', color: C.failed },
  { id: 4, text: 'New order SP-79001 submitted by Client BDO',  time: '1 hr ago',    color: C.warning },
  { id: 5, text: 'Waybill SP-78811 returned to warehouse',      time: '2 hrs ago',   color: C.neutral },
];

const statCardsDefault = [
  {
    label: 'Active Tasks',
    value: '110',
    sub: 'Pending & In-Transit',
    iconBg: 'rgba(217, 119, 6, 0.1)',
    iconColor: C.warning,
    accent: C.warning,
  },
  {
    label: 'Completed Today',
    value: '214',
    sub: 'Total successful deliveries',
    iconBg: 'rgba(5, 150, 105, 0.1)',
    iconColor: '#059669',
    accent: '#059669',
  },
  {
    label: 'In Transit',
    value: '67',
    sub: 'Currently on-road',
    iconBg: 'rgba(2, 132, 199, 0.1)',
    iconColor: C.info,
    accent: C.info,
  },
  {
    label: 'Failed / Returned',
    value: '30',
    sub: 'Needs attention',
    iconBg: 'rgba(220, 38, 38, 0.1)',
    iconColor: C.failed,
    accent: C.failed,
  },
];

const systemStatusDefault = [
  {
    name: 'Operation System',
    detail: '24 employees active',
    iconBg: 'rgba(0, 169, 157, 0.08)',
    iconColor: C.success,
  },
  {
    name: 'Delivery Management',
    detail: '354 total orders',
    iconBg: 'rgba(220, 38, 38, 0.1)',
    iconColor: C.failed,
  },
  {
    name: 'Delivery Tracker',
    detail: '67 active shipments',
    iconBg: 'rgba(5, 150, 105, 0.1)',
    iconColor: '#059669',
  },
];

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #DDE2EB',
      borderRadius: '8px',
      padding: '10px 14px',
      boxShadow: '0px 4px 20px rgba(15, 23, 42, 0.05)',
      fontSize: '0.8rem',
      fontFamily: "var(--fb, sans-serif)",
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

// Calendar Range Picker is imported from `./FormModals` to share the unified OneUI standard.

export interface DashboardLayoutProps {
  weeklyData?: Array<{ day: string; deliveries: number; returned: number; failed: number }>;
  pieData?: Array<{ name: string; value: number; color: string }>;
  activityFeed?: Array<{ id: number; text: string; time: string; color: string }>;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  weeklyData,
  pieData,
  activityFeed,
  loading: loadingProp,
  error: errorProp,
  onRetry,
}) => {
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | 'custom'>('7d');
  const [customStart, setCustomStart] = useState('2026-07-01');
  const [customEnd, setCustomEnd] = useState('2026-07-07');
  
  // Simulated Local Demo States (for interactive showcase)
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Combine parent controls or local demo controls
  const isLoading = loadingProp || localLoading;
  const isError = errorProp || localError;

  // Track window resizing for legend responsiveness
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRetrySimulation = () => {
    if (onRetry) {
      onRetry();
    } else {
      setLocalError(null);
      setLocalLoading(true);
      setTimeout(() => {
        setLocalLoading(false);
      }, 1000);
    }
  };

  const handleRangeChange = (range: 'today' | '7d' | '30d' | 'custom') => {
    setDateRange(range);
    setLocalLoading(true);
    setTimeout(() => {
      setLocalLoading(false);
    }, 600);
  };

  // Compute active bar chart dataset based on selected date filter
  const activeBarData = useMemo(() => {
    if (weeklyData && dateRange === '7d') return weeklyData;

    switch (dateRange) {
      case 'today':
        return todayDataDefault;
      case '30d':
        return thirtyDayDataDefault;
      case 'custom': {
        try {
          const start = new Date(customStart);
          const end = new Date(customEnd);
          if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
            return customDataDefault;
          }
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.min(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1, 14); // limit to 14 days
          const generated = [];
          const current = new Date(start);
          for (let i = 0; i < diffDays; i++) {
            const label = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            // Deterministic chart values based on charcodes
            const hash = label.charCodeAt(0) + label.charCodeAt(label.length - 1) + i;
            const deliveries = 25 + (hash % 50);
            const returned = Math.floor((hash % 8) / 2);
            const failed = Math.floor((hash % 6) / 2);
            generated.push({
              day: label,
              deliveries,
              returned,
              failed
            });
            current.setDate(current.getDate() + 1);
          }
          return generated;
        } catch (e) {
          return customDataDefault;
        }
      }
      case '7d':
      default:
        return weeklyDataDefault;
    }
  }, [dateRange, weeklyData, customStart, customEnd]);

  const activePieData = pieData || pieDataDefault;
  const activeFeed = activityFeed || activityFeedDefault;

  // ─── Rendering Skeletons ───
  const renderStatCardSkeleton = (key: number) => (
    <StatusCard key={key} label="" value="" loading={true} />
  );

  const renderChartSkeleton = (title: string) => (
    <div className="spx-card spx-skeleton-card">
      <div className="spx-card-title">
        <div className="spx-card-title-left">
          <div className="spx-skeleton" style={{ width: 120, height: 16 }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
        <div className="spx-skeleton" style={{ width: '100%', height: 180 }} />
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <div className="spx-skeleton" style={{ width: 60, height: 12 }} />
          <div className="spx-skeleton" style={{ width: 60, height: 12 }} />
          <div className="spx-skeleton" style={{ width: 60, height: 12 }} />
        </div>
      </div>
    </div>
  );

  const renderErrorState = (title: string) => (
    <div className="spx-card spx-error-card">
      <div className="spx-card-title">
        <div className="spx-card-title-left">
          <AlertCircle size={18} color={C.failed} />
          {title}
        </div>
      </div>
      <div className="spx-error-content">
        <AlertCircle size={38} className="spx-error-icon" />
        <h3>Failed to fetch dashboard metrics</h3>
        <p>There was a connection timeout while fetching metrics. Please check your network and try again.</p>
        <button className="spx-retry-btn" onClick={handleRetrySimulation}>
          <RefreshCw size={12} style={{ marginRight: 6 }} />
          Retry Sync
        </button>
      </div>
    </div>
  );

  return (
    <div className="speedex-dashboard">

      {/* Dynamic Grid Layout (Skeletons vs Content) */}
      {isError ? (
        // Error State UI Showcase
        <>
          <div className="spx-stats-grid">
            {statCardsDefault.map((_, idx) => renderStatCardSkeleton(idx))}
          </div>
          <div className="spx-main-grid">
            {renderErrorState("Delivery Performance")}
            <div className="spx-card spx-skeleton-card">
              <div className="spx-skeleton" style={{ width: '100%', height: '100%', minHeight: 200 }} />
            </div>
          </div>
        </>
      ) : isLoading ? (
        // Shimmering Skeletons UI Showcase
        <>
          <div className="spx-stats-grid">
            {[0, 1, 2, 3].map((idx) => renderStatCardSkeleton(idx))}
          </div>
          <div className="spx-main-grid">
            {renderChartSkeleton("Delivery Performance")}
            <div className="spx-card spx-skeleton-card">
              <div className="spx-skeleton" style={{ width: '100%', height: '100%', minHeight: 200 }} />
            </div>
          </div>
        </>
      ) : (
        // Normal Loaded UI Showcase
        <>
          {/* Stat Cards */}
          <div className="spx-stats-grid">
            {statCardsDefault.map((card, idx) => {
              let variantName: 'warning' | 'success' | 'info' | 'danger' = 'warning';
              let iconClass = 'ti ti-list-details';
              let trendObj: { value: string; type: 'up' | 'down' | 'neutral' } = { value: '8.2%', type: 'up' };
              let sparkData = [15, 22, 34, 18, 42, 30, 25];

              if (idx === 1) {
                variantName = 'success';
                iconClass = 'ti ti-circle-check';
                trendObj = { value: '14.5%', type: 'up' as const };
                sparkData = [40, 50, 48, 62, 70, 85, 90];
              } else if (idx === 2) {
                variantName = 'info';
                iconClass = 'ti ti-truck';
                trendObj = { value: '2.1%', type: 'down' as const };
                sparkData = [10, 18, 25, 20, 30, 22, 18];
              } else if (idx === 3) {
                variantName = 'danger';
                iconClass = 'ti ti-alert-triangle';
                trendObj = { value: '1.5%', type: 'neutral' as const };
                sparkData = [5, 4, 8, 3, 6, 2, 4];
              }

              return (
                <StatusCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  icon={iconClass}
                  variant={variantName}
                  trend={trendObj}
                  periodText="vs yesterday"
                  sparklineData={sparkData}
                />
              );
            })}
          </div>

          {/* Bar Chart + Activity Feed */}
          <div className="spx-main-grid">
            {/* Delivery Performance Bar Chart */}
            <div className="spx-card">
              <div className="spx-card-title">
                <div className="spx-card-title-left">
                  <TrendingUp size={18} color="#00A99D" />
                  Delivery Performance
                </div>
                {/* Date Filter & Control Row Embedded in Chart Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div className="spx-date-filter-group" style={{ margin: 0 }}>
                    {(['today', '7d', '30d', 'custom'] as const).map((range) => (
                      <button
                        key={range}
                        className={`spx-date-filter-btn ${dateRange === range ? 'active' : ''}`}
                        onClick={() => handleRangeChange(range)}
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                      >
                        {range === 'today' ? 'Today' : range === '7d' ? '7D' : range === '30d' ? '30D' : 'Custom'}
                      </button>
                    ))}
                  </div>

                  {dateRange === 'custom' && (
                    <div style={{ width: '260px' }}>
                      <CalendarRangePicker
                        startValue={customStart}
                        endValue={customEnd}
                        compact={true}
                        onRangeChange={(start, end) => {
                          setCustomStart(start);
                          if (end) {
                            setCustomEnd(end);
                            setLocalLoading(true);
                            setTimeout(() => setLocalLoading(false), 250);
                          }
                        }}
                      />
                    </div>
                  )}

                  <span className="spx-badge spx-badge-transit" style={{ padding: '3px 8px' }}>
                    {dateRange === 'today' ? 'Today' : dateRange === '7d' ? '7 Days' : dateRange === '30d' ? '30 Days' : 'Custom Range'}
                  </span>
                </div>
              </div>

              {/* Legend using unified tokens */}
              <div className="spx-legend">
                <div className="spx-legend-item">
                  <div className="spx-legend-dot" style={{ background: C.success }} />
                  Deliveries
                </div>
                <div className="spx-legend-item">
                  <div className="spx-legend-dot" style={{ background: C.neutral }} />
                  Returned
                </div>
                <div className="spx-legend-item">
                  <div className="spx-legend-dot" style={{ background: C.failed }} />
                  Failed
                </div>
              </div>

              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeBarData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBF0F5" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600, fontFamily: 'var(--fb, sans-serif)' }}
                    />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(0, 169, 157, 0.03)' }} />
                    <Bar dataKey="deliveries" name="Deliveries" fill={C.success} radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="returned" name="Returned" fill={C.neutral} radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="failed" name="Failed" fill={C.failed} radius={[4, 4, 0, 0]} maxBarSize={32} />
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
                <span className="spx-badge spx-badge-transit">Live</span>
              </div>
              {activeFeed.map((log) => (
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
        </>
      )}

      {/* Bottom Grid (Pie Chart + System Status) */}
      <div className="spx-bottom-grid">
        {/* Order Status Pie */}
        <div className="spx-card">
          <div className="spx-card-title">
            <div className="spx-card-title-left">
              <Package size={18} color="#00A99D" />
              Order Status Breakdown
            </div>
            <span className="spx-badge spx-badge-pending">All Time</span>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            {isLoading ? (
              <div className="spx-skeleton" style={{ width: '100%', height: '100%' }} />
            ) : isError ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Metrics unavailable
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activePieData}
                    cx={isMobile ? "50%" : "40%"}
                    cy="50%"
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {activePieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} orders`, name]}
                    contentStyle={{
                      fontSize: '0.8rem',
                      borderRadius: '8px',
                      border: '1px solid #DDE2EB',
                      boxShadow: '0px 4px 20px rgba(15, 23, 42, 0.05)',
                      fontFamily: 'var(--fb, sans-serif)',
                    }}
                  />
                  <Legend
                    layout={isMobile ? "horizontal" : "vertical"}
                    align={isMobile ? "center" : "right"}
                    verticalAlign={isMobile ? "bottom" : "middle"}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={isMobile ? { paddingTop: 10 } : undefined}
                    formatter={(value) => (
                      <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500, fontFamily: 'var(--fb, sans-serif)' }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="spx-card">
          <div className="spx-card-title">
            <div className="spx-card-title-left">
              <TrendingUp size={18} color="#00A99D" />
              System Status
            </div>
            <span className="spx-badge spx-badge-active">All Operational</span>
          </div>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[0, 1, 2].map((idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="spx-skeleton" style={{ width: 36, height: 36 }} />
                  <div style={{ flex: 1 }}>
                    <div className="spx-skeleton" style={{ width: '40%', height: 12, marginBottom: 6 }} />
                    <div className="spx-skeleton" style={{ width: '60%', height: 10 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            systemStatusDefault.map((s, idx) => {
              // Extract icon based on index
              let iconEl = <Users size={16} />;
              if (idx === 1) iconEl = <ClipboardList size={16} />;
              if (idx === 2) iconEl = <Package size={16} />;

              return (
                <div key={s.name} className="spx-system-item">
                  <div className="spx-system-icon" style={{ background: s.iconBg, color: s.iconColor }}>
                    {iconEl}
                  </div>
                  <div>
                    <div className="spx-system-name">{s.name}</div>
                    <div className="spx-system-detail">{s.detail}</div>
                  </div>
                  <span className="spx-system-uptime">99.9%</span>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default DashboardLayout;
