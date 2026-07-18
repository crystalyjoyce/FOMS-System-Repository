import React from 'react';
import { useClientContext } from '../context/ClientContext';
import { Link, useNavigate } from 'react-router-dom';
import { AlarmClock, AlertCircle, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export const Dashboard: React.FC = () => {
  const { invoices, getDashboardSummary } = useClientContext();
  const summary = getDashboardSummary();
  const navigate = useNavigate();

  const notifications = [
    { type: 'due_soon', label: 'Due soon: INV-10231', sub: 'Due on Jul 20, 2026 — ₱184,500.00', icon: <AlarmClock size={20} color="#F59E0B" />, bg: '#FEF3C7' },
    { type: 'overdue', label: 'Overdue: INV-10198', sub: 'Was due last Jun 20, 2026 — ₱172,300.00', icon: <AlertCircle size={20} color="#EF4444" />, bg: '#FEE2E2' },
    { type: 'validated', label: 'Payment validated: INV-10099', sub: 'Official Receipt OR-2026-0099 is now available', icon: <CheckCircle2 size={20} color="#10B981" />, bg: '#D1FAE5' },
    { type: 'validated', label: 'Payment validated: INV-10150', sub: 'Official Receipt OR-2026-0150 is now available', icon: <CheckCircle2 size={20} color="#10B981" />, bg: '#D1FAE5' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: '"Inter", sans-serif' }}>
      
      <style>
        {`
          .kpi {
            background: #ffffff;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 18px 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            position: relative;
            overflow: hidden;
            transition: all 0.2s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }
          .kpi:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transform: translateY(-2px);
          }
          .kpi-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .kpi-label {
            font-size: 11px;
            font-weight: 700;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }
          .kpi-icon-box {
            width: 34px;
            height: 34px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .kpi-val {
            font-family: "Inter", sans-serif;
            font-size: 28px;
            font-weight: 800;
            color: #0F172A;
            letter-spacing: -1px;
            line-height: 1;
          }
          .kpi-trend {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
            font-weight: 600;
          }
          .t-up { color: #059669; }
          .t-dn { color: #DC2626; }
          .t-nl { color: #64748B; }
          .kpi-period {
            color: #64748B;
            font-weight: 500;
            font-size: 11px;
          }

          .ra-item {
            transition: transform 0.2s ease, background-color 0.2s ease;
            padding: 10px 12px;
            margin: 0 -12px;
            border-radius: 8px;
            cursor: default;
          }
          .ra-item:hover {
            transform: translateX(6px);
            background-color: #F8FAFC;
          }
          .ra-arrow {
            opacity: 0;
            transform: translateX(-10px);
            transition: all 0.2s ease;
            color: #0EA5E9;
            font-weight: bold;
            margin-left: 8px;
          }
          .ra-item:hover .ra-arrow {
            opacity: 1;
            transform: translateX(0);
          }
        `}
      </style>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
        <div className="kpi">
          <div className="kpi-top">
            <span className="kpi-label">TOTAL OUTSTANDING</span>
            <div className="kpi-icon-box" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="kpi-val">₱{summary.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div className="kpi-trend t-dn"><span>↓ 14%</span></div>
            <span className="kpi-period">vs. last month</span>
          </div>
        </div>

        <div className="kpi">
          <div className="kpi-top">
            <span className="kpi-label">NEXT DUE DATE</span>
            <div className="kpi-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
              <AlarmClock size={18} />
            </div>
          </div>
          <div className="kpi-val">{summary.nextDueDate ? new Date(summary.nextDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'None'}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div className="kpi-trend t-dn"><span>↓ 10%</span></div>
            <span className="kpi-period">Due within 7 days</span>
          </div>
        </div>

        <div className="kpi">
          <div className="kpi-top">
            <span className="kpi-label">TOTAL PAID (THIS PERIOD)</span>
            <div className="kpi-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-val">₱{summary.totalPaidPeriod.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div className="kpi-trend t-up"><span>↑ 19%</span></div>
            <span className="kpi-period">vs. last month</span>
          </div>
        </div>
      </div>

      {/* Reminders - Styled like FOMS RecentActivity */}
      <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Reminders</h3>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {notifications.map((n, idx) => {
            const actionColor = n.type === 'due_soon' ? '#F59E0B' : n.type === 'overdue' ? '#EF4444' : '#10B981';
            return (
              <div key={idx} className="ra-item" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', borderBottom: idx < notifications.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: actionColor, flexShrink: 0 }} />
                  {idx < notifications.length - 1 && <div style={{ width: 1, flexGrow: 1, background: '#F1F5F9', marginTop: 4, minHeight: '20px' }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#334155', fontWeight: 600 }}>{n.label}</p>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748B' }}>{n.sub}</p>
                  </div>
                  <span className="ra-arrow">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Invoices preview */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Action Needed</h3>
        <Link to="/invoices" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 600, color: '#0EA5E9', textDecoration: 'none' }}>
          View all <ChevronRight size={16} />
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {invoices.filter(i => i.status === 'Overdue' || i.status === 'Due Soon').slice(0, 2).map((inv) => (
          <div key={inv.id} style={{ background: '#FFF', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={24} color="#64748B" />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{inv.invoiceNumber}</div>
                <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>₱{inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} • {inv.status}</div>
              </div>
            </div>
            <button onClick={() => navigate('/pay', { state: { invoiceId: inv.id } })} style={{ background: '#0EA5E9', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Pay now
            </button>
          </div>
        ))}
      </div>
      
    </motion.div>
  );
};
