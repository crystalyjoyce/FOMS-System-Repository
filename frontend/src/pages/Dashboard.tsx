import React from 'react';
import { useDashboardData } from '../hooks/useDashboard';
import { AiHeader } from '../components/AiHeader';
import { DecisionSupportNotice } from '../components/DecisionSupportNotice';
import { MetricCardSkeleton, ChartSkeleton, PageHeaderSkeleton } from '../components/Skeletons';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { 
  AlertOctagon, ShieldAlert, DollarSign, Activity, FileText, CheckCircle, Clock
} from 'lucide-react';
import { normalizeInvoiceNumber } from '../utils/referenceNormalizer';

// Sparkline Bar Chart Helper Component matching the user UI style
const Sparkline: React.FC<{ type: 'blue' | 'red' | 'orange', heights: number[] }> = ({ type, heights }) => {
  const colors = {
    blue: ['#e2f1f1', '#cbe5e5', '#a4d4d4', '#79bfbf', '#4aa4a4', '#1e8585', '#006f76'],
    red: ['#fdeaea', '#fbcbcb', '#f7a4a4', '#f37979', '#ec4d4d', '#c93434', '#a02323'],
    orange: ['#fff6df', '#fdeac2', '#fbd594', '#f9bd5c', '#f59f27', '#c77812', '#a05c08']
  }[type];

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '24px', width: '100%', marginTop: '12px' }}>
      {heights.map((h, i) => (
        <div 
          key={i} 
          style={{ 
            flex: 1, 
            height: `${h}%`, 
            backgroundColor: colors[i % colors.length], 
            borderRadius: '2px',
            opacity: 0.85
          }} 
        />
      ))}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { 
    summary, 
    attentionAccounts, 
    activities, 
    trends, 
    loading, 
    error 
  } = useDashboardData();

  if (loading) {
    return (
      <div className="main-content animate-fade-in">
        <AiHeader title="Dashboard" />
        <div className="page-container">
          <PageHeaderSkeleton />
          <div className="kpi-grid">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
          <div className="dashboard-grid">
            <ChartSkeleton />
            <MetricCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content">
        <AiHeader title="Dashboard" />
        <div className="page-container">
          <div className="advisory-banner danger fade-in">
            <ShieldAlert size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <div>
              <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>AI Layer Connection Offline</h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{error}</p>
            </div>
          </div>
          <div className="card text-center" style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <AlertOctagon size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>AI Intelligence Service Offline</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto var(--space-4) auto' }}>
              The side-car AI service is currently unreachable. You can continue working in the legacy FOMS normally as it is unaffected by this failure.
            </p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Map chronological date strings for Recharts line chart
  const formattedTrends = trends.map(t => ({
    ...t,
    dateStr: new Date(t.recordedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }));

  return (
    <div className="main-content fade-in">
      <AiHeader title="Dashboard" />
      
      <div className="page-container">
        {/* Human-in-the-Loop decision support notification */}
        <DecisionSupportNotice />

        {/* 5 KPI Metric Cards in a single row */}
        <div className="kpi-grid" style={{ marginBottom: '24px' }}>
          
          {/* Card 1: TOTAL DUPLICATE ALERTS */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                TOTAL DUPLICATE ALERTS
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(0, 140, 149, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={14} />
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                {summary?.totalDuplicateAlerts ?? 0}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', marginTop: '4px' }}>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>↑ 12%</span>
                <span style={{ color: 'var(--text-muted)' }}>vs. last week</span>
              </div>
            </div>
            <Sparkline type="blue" heights={[20, 25, 45, 55, 30, 40, 70, 85]} />
          </div>

          {/* Card 2: PENDING REVIEW */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                PENDING REVIEW
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(0, 140, 149, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={14} />
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                {summary?.pendingDuplicateReviews ?? 0}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', marginTop: '4px' }}>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>↑ 8%</span>
                <span style={{ color: 'var(--text-muted)' }}>vs. last week</span>
              </div>
            </div>
            <Sparkline type="blue" heights={[30, 45, 25, 35, 60, 50, 75, 95]} />
          </div>

          {/* Card 3: EXACT MATCH ALERTS */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                EXACT MATCH ALERTS
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertOctagon size={14} />
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                {summary?.exactMatchAlerts ?? 0}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', marginTop: '4px' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>↓ 4%</span>
                <span style={{ color: 'var(--text-muted)' }}>vs. last week</span>
              </div>
            </div>
            <Sparkline type="red" heights={[80, 65, 75, 40, 55, 30, 20, 10]} />
          </div>

          {/* Card 4: URGENT COLLECTION ACCOUNTS */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                URGENT COLLECTIONS
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={14} />
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                {summary?.urgentCollectionAccounts ?? 0}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', marginTop: '4px' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>↓ 15%</span>
                <span style={{ color: 'var(--text-muted)' }}>vs. last week</span>
              </div>
            </div>
            <Sparkline type="orange" heights={[90, 80, 60, 55, 45, 30, 25, 15]} />
          </div>

          {/* Card 5: AWAITING VALIDATION */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AWAITING VALIDATION
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={14} />
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                {summary?.recommendationsAwaitingValidation ?? 0}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', marginTop: '4px' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>↓ 8%</span>
                <span style={{ color: 'var(--text-muted)' }}>vs. last week</span>
              </div>
            </div>
            <Sparkline type="orange" heights={[70, 80, 50, 45, 60, 35, 20, 10]} />
          </div>

        </div>

        {/* Recharts Trends & Priority Distribution */}
        <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
          
          {/* Trend Chart */}
          <div className="card" style={{ minHeight: '380px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Collection & Outstanding Balance Trend</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
                  Weekly receivables snapshots synchronizing MongoDB time-series data
                </p>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                AI Layer Engine
              </div>
            </div>
            
            {formattedTrends.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '280px', color: 'var(--text-muted)' }}>
                No snapshot trend metrics found. Wait for legacy FOMS synchronization.
              </div>
            ) : (
              <div style={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedTrends} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                    <XAxis dataKey="dateStr" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)' }}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Line name="Outstanding Receivables" type="monotone" dataKey="totalOutstanding" stroke="var(--primary)" strokeWidth={2.5} activeDot={{ r: 8 }} />
                    <Line name="Validated Collections" type="monotone" dataKey="collectedAmount" stroke="var(--success)" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Priority Status list */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div>
              <h3 className="card-title" style={{ marginBottom: '16px' }}>AI Collection Priorities</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border-soft)', backgroundColor: 'var(--surface-soft)', borderRadius: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--danger)' }}></span>
                    Urgent (Aging &gt; 90 days)
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{summary?.urgentCollectionAccounts ?? 0} accounts</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border-soft)', backgroundColor: 'var(--surface-soft)', borderRadius: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--warning)' }}></span>
                    High (Aging 60-90 days)
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>2 accounts</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border-soft)', backgroundColor: 'var(--surface-soft)', borderRadius: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span>
                    Medium (Aging 30-60 days)
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>1 account</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--surface-soft)', borderRadius: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }}></span>
                    Low (Aging &lt; 30 days)
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>1 account</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-soft)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} style={{ color: 'var(--success)' }} /> Service online
              </span>
              <a href="/ai/collection-priorities" className="btn btn-secondary" style={{ height: '32px', fontSize: '12px', padding: '0 12px', borderRadius: '6px' }}>
                View Queue
              </a>
            </div>
          </div>

        </div>

        {/* Lower Grid: Collection Accounts Requiring Attention & Recent AI Activity */}
        <div className="grid-2">
          
          {/* Collection Accounts Requiring Attention Panel */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
            <h3 className="card-title" style={{ marginBottom: '16px' }}>Collection Accounts Requiring Attention</h3>
            
            {attentionAccounts.length === 0 ? (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No accounts currently require urgent collection follow-up.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                {attentionAccounts.map(account => (
                  <div 
                    key={account.priorityId}
                    style={{ 
                      padding: '12px', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border-soft)', 
                      backgroundColor: 'var(--surface-soft)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                        {account.clientName}
                      </span>
                      <span className={`badge ${
                        account.priorityLevel === 'Urgent' ? 'badge-rejected' : 'badge-pending'
                      }`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {account.priorityLevel}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <div>Invoice: <strong>{normalizeInvoiceNumber(account.invoiceNumber)}</strong></div>
                      <div style={{ textAlign: 'right' }}>
                        Balance: <strong>₱{account.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div>Due: {new Date(account.dueDate).toLocaleDateString()}</div>
                      <div style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 600 }}>
                        {account.daysOverdue} Days Overdue
                      </div>
                    </div>

                    <div style={{ borderTop: '1px dashed var(--border-soft)', paddingTop: '8px', marginTop: '4px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        AI Recommendation Basis:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {account.recommendationBasis.map((basis, idx) => (
                          <li key={idx}>{basis}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Status: <strong style={{ color: 'var(--primary)' }}>{account.reviewStatus}</strong></span>
                      <a href={`/ai/collection-recommendations`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                        Review Recommendations &rarr;
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent AI Activity Panel */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="card-title" style={{ margin: 0 }}>Recent AI Activity</h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--success)',
                backgroundColor: 'var(--success-bg)',
                padding: '2px 8px',
                borderRadius: '100px',
                letterSpacing: '0.04em'
              }}>
                • LIVE
              </div>
            </div>

            {activities.length === 0 ? (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No recent AI activity is available.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
                {activities.map(activity => (
                  <div key={activity.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: 
                        activity.statusDot === 'warning' ? 'var(--warning)' :
                        activity.statusDot === 'danger' ? 'var(--danger)' :
                        activity.statusDot === 'success' ? 'var(--success)' :
                        'var(--primary)', 
                      marginTop: '5px', 
                      flexShrink: 0 
                    }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {activity.description} for <strong>{activity.relatedRecord}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {activity.timeAgo} &bull; {activity.userRole}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
