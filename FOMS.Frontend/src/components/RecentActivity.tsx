import React from 'react';
import { Card } from './Card';
import { AuditLog } from '../data/seed';

// ── Helpers ─────────────────────────────────────────────────────────
export function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

export function logToMessage(log: AuditLog): string {
  const name = log.userFullName;
  switch (log.action) {
    case 'LOGIN': return `${name} logged in to the system.`;
    case 'LOGOUT': return `${name} logged out of the system.`;
    case 'WAYBILL_ENCODED': return log.details;
    case 'WAYBILL_VALIDATED': return log.details;
    case 'POD_VALIDATED': return log.details;
    case 'CTC_SUBMITTED': return log.details;
    case 'CLIENT_UPDATED': return log.details;
    case 'INVOICE_CREATED': return log.details;
    case 'INVOICE_APPROVED': return log.details;
    case 'PAYMENT_RECORDED': return log.details;
    case 'PAYMENT_VALIDATED': return log.details;
    default: return log.details;
  }
}

export function actionDot(action: string): string {
  if (['WAYBILL_VALIDATED', 'POD_VALIDATED', 'INVOICE_APPROVED', 'PAYMENT_VALIDATED'].includes(action)) return '#10B981';
  if (['INVOICE_CREATED', 'WAYBILL_ENCODED'].includes(action)) return '#6366F1';
  if (['PAYMENT_RECORDED', 'CTC_SUBMITTED'].includes(action)) return '#F59E0B';
  return '#94A3B8';
}

// ── Component ───────────────────────────────────────────────────────
export const RecentActivity: React.FC<{ logs: AuditLog[]; title?: string }> = ({ logs, title = 'Recent Activity' }) => (
  <Card>
    <style>
      {`
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
          color: #00A99D;
          font-weight: bold;
          margin-left: 8px;
        }
        .ra-item:hover .ra-arrow {
          opacity: 1;
          transform: translateX(0);
        }
      `}
    </style>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{title}</h3>
      <span style={{ padding: '3px 10px', borderRadius: 9999, background: '#F0FDF4', color: '#10B981', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
        LIVE
      </span>
    </div>
    {logs.length === 0 ? (
      <p style={{ color: '#94A3B8', fontSize: '0.875rem', textAlign: 'center', padding: '24px 0' }}>No recent activity.</p>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {logs.map((log, idx) => (
          <div key={log.id} className="ra-item" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', borderBottom: idx < logs.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: actionDot(log.action), flexShrink: 0 }} />
              {idx < logs.length - 1 && <div style={{ width: 1, flexGrow: 1, background: '#F1F5F9', marginTop: 4, minHeight: '20px' }} />}
            </div>
            <div style={{ flex: 1, paddingBottom: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.855rem', color: '#334155', lineHeight: 1.45 }}>{logToMessage(log)}</p>
                <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                  {relativeTime(log.timestamp)}
                  {log.action !== 'LOGIN' && log.action !== 'LOGOUT' && ` · ${log.userFullName}`}
                </p>
              </div>
              <span className="ra-arrow">→</span>
            </div>
          </div>
        ))}
      </div>
    )}
  </Card>
);
