import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';
import { Card } from '../components/Card';
import { StatusCard } from '../components/StatusCard';
import { TableContainer } from '../components/TableContainer';

const ACTION_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
  LOGIN: { bg: '#EEF2FF', color: '#6366F1', icon: 'ti-login' },
  INVOICE_CREATED: { bg: '#EFF6FF', color: '#3B82F6', icon: 'ti-file-plus' },
  INVOICE_APPROVED: { bg: '#F0FDF4', color: '#10B981', icon: 'ti-circle-check' },
  PAYMENT_RECORDED: { bg: '#FFFBEB', color: '#F59E0B', icon: 'ti-cash' },
  PAYMENT_VALIDATED: { bg: '#F0FDF4', color: '#10B981', icon: 'ti-shield-check' },
  WAYBILL_ENCODED: { bg: '#F5F3FF', color: '#8B5CF6', icon: 'ti-file-import' },
  POD_VALIDATED: { bg: '#EFF6FF', color: '#3B82F6', icon: 'ti-file-check' },
};

export const AuditTrail: React.FC = () => {
  const { logs } = useAudit();
  const [filterModule, setFilterModule] = useState('All');
  const [filterUser, setFilterUser] = useState('All');

  const modules = ['All', ...Array.from(new Set(logs.map(l => l.module))).filter(m => m !== 'All')];
  const users = ['All', ...Array.from(new Set(logs.map(l => l.userFullName))).filter(u => u !== 'All')];

  const filtered = logs.filter(log => {
    const moduleMatch = filterModule === 'All' || log.module === filterModule;
    const userMatch = filterUser === 'All' || log.userFullName === filterUser;
    return moduleMatch && userMatch;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Filters + Log */}
      <TableContainer>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid #E2E8F0', paddingLeft: 24, paddingRight: 24, paddingTop: 28 }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>Activity Log</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
              {users.map(u => <option key={u}>{u}</option>)}
            </select>
            <select value={filterModule} onChange={e => setFilterModule(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
              {modules.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingBottom: 24, paddingTop: 16 }}>
          {filtered.map((log, idx) => {
            const cfg = ACTION_COLORS[log.action] ?? { bg: '#F8FAFC', color: '#64748B', icon: 'ti-dots' };
            return (
              <div key={log.id} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: idx < filtered.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                {/* Icon */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`ti ${cfg.icon}`} style={{ fontSize: 16, color: cfg.color }} />
                  </div>
                  {idx < filtered.length - 1 && <div style={{ width: 1, flexGrow: 1, background: '#F1F5F9', marginTop: 6 }} />}
                </div>

                {/* Content */}
                <div style={{ flex: 1, paddingBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>{log.details}</span>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ padding: '2px 10px', borderRadius: 9999, background: cfg.bg, color: cfg.color, fontSize: '0.72rem', fontWeight: 700 }}>{log.action}</span>
                        <span style={{ padding: '2px 10px', borderRadius: 9999, background: '#F8FAFC', color: '#64748B', fontSize: '0.72rem', fontWeight: 600 }}>{log.module}</span>
                        <span style={{ padding: '2px 10px', borderRadius: 9999, background: '#F8FAFC', color: '#94A3B8', fontSize: '0.72rem', fontWeight: 600 }}>{log.recordType}: {log.recordId}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#94A3B8', whiteSpace: 'nowrap', marginLeft: 12 }}>
                      {new Date(log.timestamp).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                    <i className="ti ti-user" style={{ marginRight: 4 }} />{log.userFullName} ({log.userRole})
                    <span style={{ margin: '0 8px', color: '#E2E8F0' }}>·</span>
                    <i className="ti ti-network" style={{ marginRight: 4 }} />{log.ipAddress}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </TableContainer>
    </div>
  );
};

export default AuditTrail;
