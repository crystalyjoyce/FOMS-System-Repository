import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionContext';
import { AiHeader } from '../components/AiHeader';
import { MetricCardSkeleton } from '../components/Skeletons';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import StatusCard from '../components/StatusCard';
import { normalizeInvoiceNumber } from '../utils/referenceNormalizer';
import { ShieldAlert, AlertTriangle, RefreshCw, X, ZoomIn } from 'lucide-react';

interface AuditEvent {
  eventId: string;
  occurredAt?: string;
  occurred_at?: string;
  userId: string;
  fullName: string;
  role: string;
  eventType: string;
  action: string;
  relatedRecordType: string;
  sourceReference: string;
  normalizedReference: string;
  result: string;
  ipAddress: string;
  userAgent: string;
  correlationId: string;
  details: Record<string, any> | null;
}

interface AuditSummary {
  totalEvents: number;
  loginEvents: number;
  duplicateEvents: number;
  collectionEvents: number;
  failedAttempts: number;
}

export const AuditTrail: React.FC = () => {
  const { token } = useAuth();
  const { hasPermission } = usePermissions();

  const [items, setItems] = useState<AuditEvent[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected event for Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/audit-trail/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {
      // Fail silently for summary
    }
  }, [token]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '100',
        sortBy: 'occurred_at',
        sortDirection: 'desc'
      });

      const res = await fetch(`/api/ai/audit-trail?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 403) {
        setError("UNAUTHORIZED");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error("Server error occurred while fetching audit trail logs.");
      }

      const data = await res.json();
      let localLogs: any[] = [];
      try {
        const localStr = localStorage.getItem('foms_audit_trail');
        if (localStr) localLogs = JSON.parse(localStr);
      } catch (err) {
        console.error(err);
      }
      const combined = [...localLogs, ...(data.items || [])];
      setItems(combined);
    } catch (e: any) {
      let localLogs: any[] = [];
      try {
        const localStr = localStorage.getItem('foms_audit_trail');
        if (localStr) localLogs = JSON.parse(localStr);
      } catch (err) {
        console.error(err);
      }
      if (localLogs.length > 0) {
        setItems(localLogs);
      } else {
        setError(e.message || "Failed to load audit logs.");
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (hasPermission("ai.audit.view") || hasPermission("ai.audit.view_limited")) {
      fetchSummary();
      fetchLogs();
    } else {
      setError("UNAUTHORIZED");
      setLoading(false);
    }
  }, [fetchSummary, fetchLogs, hasPermission]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    fetchSummary();
    fetchLogs();
  };

  const formatDate = (row: any) => {
    const raw = row.occurredAt || row.occurred_at || row.created_at || row.timestamp;
    if (!raw) return 'N/A';
    const d = new Date(raw);
    return !isNaN(d.getTime()) ? d.toLocaleString() : 'N/A';
  };

  const tableColumns: import('../components/DataTable').ColumnDef<AuditEvent>[] = [
    {
      key: 'occurredAt',
      label: 'Date & Time',
      sortable: true,
      width: '180px',
      render: (row: AuditEvent) => (
        <span style={{ fontSize: '13px', color: 'var(--tp)' }}>
          {formatDate(row)}
        </span>
      ),
    },
    {
      key: 'fullName',
      label: 'User',
      sortable: true,
      width: '160px',
      render: (row: AuditEvent) => row.fullName || row.userId || 'System',
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      width: '160px',
      render: (row: AuditEvent) => (
        <span style={{ fontSize: '12px', color: 'var(--ts)' }}>
          {row.role || 'System Service'}
        </span>
      ),
    },
    {
      key: 'eventType',
      label: 'Event Type',
      sortable: true,
      width: '260px',
      render: (row: AuditEvent) => (
        <span style={{ fontWeight: 600, color: 'var(--teal-dark)' }}>
          {row.eventType}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      width: '260px',
      render: (row: AuditEvent) => (
        <span style={{ fontSize: '13px', color: 'var(--ts)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.action}
        </span>
      ),
    },
    {
      key: 'normalizedReference',
      label: 'Related Record',
      width: '180px',
      render: (row: AuditEvent) => (
        row.normalizedReference ? (
          <span style={{ fontWeight: 600, fontFamily: 'var(--fm)' }}>
            {normalizeInvoiceNumber(row.normalizedReference)}
          </span>
        ) : <span style={{ color: 'var(--tm)' }}>-</span>
      ),
    },
    {
      key: 'result',
      label: 'Result',
      sortable: true,
      width: '130px',
      render: (row: AuditEvent) => (
        <StatusBadge status={row.result === 'Success' ? 'Completed' : 'Failed'} />
      ),
    },
  ];

  if (error === "UNAUTHORIZED") {
    return (
      <div className="main-content">
        <AiHeader title="Audit Trail" />
        <div className="page-container" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div className="card text-center" style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
            <ShieldAlert size={48} color="var(--err)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Unauthorized Access</h3>
            <p style={{ color: 'var(--ts)', marginBottom: '20px' }}>
              You do not have permission to view the AI Audit Trail. Please contact your administrator if you require authorization.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content">
        <AiHeader title="Audit Trail" />
        <div className="page-container" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div className="card text-center" style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
            <AlertTriangle size={48} color="var(--err)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Connection Failure</h3>
            <p style={{ color: 'var(--ts)', marginBottom: '20px' }}>
              The audit trail could not be loaded. Please retry. Legacy FOMS remains operational.
            </p>
            <button onClick={handleRetry} className="btn" style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 20px', height: '40px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={14} /> Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content fade-in">
      <AiHeader title="Audit Trail" />

      <div className="page-container">
        {/* 5 Summary KPI Cards */}
        {loading && !summary ? (
          <div className="kpi-grid" style={{ marginBottom: '24px' }}>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        ) : (
          <div className="kpi-grid" style={{ marginBottom: '24px' }}>
            <StatusCard
              label="Total Audit Events"
              value={String(summary?.totalEvents ?? items.length)}
              icon="ti ti-file-text"
              variant="teal"
            />
            <StatusCard
              label="User Login Activity"
              value={String(summary?.loginEvents ?? 0)}
              icon="ti ti-login"
              variant="info"
            />
            <StatusCard
              label="Duplicate Checks"
              value={String(summary?.duplicateEvents ?? 0)}
              icon="ti ti-alert-octagon"
              variant="warning"
            />
            <StatusCard
              label="Collection Events"
              value={String(summary?.collectionEvents ?? 0)}
              icon="ti ti-trending-up"
              variant="teal"
            />
            <StatusCard
              label="Failed Auth Attempts"
              value={String(summary?.failedAttempts ?? 0)}
              icon="ti ti-shield-alert"
              variant="danger"
            />
          </div>
        )}

        {/* Speedex OneUI Data Table inside Card */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--sh1)' }}>
          <DataTable
            title="Audit Trail"
            rowKey="eventId"
            data={items}
            columns={tableColumns}
            actions={[
              {
                label: 'View Details',
                icon: 'ti-zoom-in',
                onClick: (row) => setSelectedEvent(row),
              },
            ]}
            loading={loading}
            searchPlaceholder="Search audit events..."
            selectable
            exportable
            columnToggle
            densityToggle
            filters={[
              {
                key: 'eventType',
                label: 'All Event Types',
                options: [
                  { label: 'Login', value: 'LOGIN' },
                  { label: 'Login Failed', value: 'LOGIN_FAILED' },
                  { label: 'Duplicate Check', value: 'DUPLICATE_CHECK' },
                  { label: 'Collection Forecast', value: 'COLLECTION_FORECAST' },
                ],
              },
              {
                key: 'result',
                label: 'All Results',
                options: [
                  { label: 'Success', value: 'Success' },
                  { label: 'Failed', value: 'Failed' },
                ],
              },
            ]}
            createButtons={[
              { label: 'Refresh Data', icon: 'ti-refresh', variant: 'primary', onClick: () => fetchLogs() },
            ]}
          />
        </div>
      </div>

      {/* Audit Event Detail Modal */}
      {selectedEvent && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.45)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedEvent(null); }}
        >
          <div style={{
            background: 'var(--s0)', borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--sh4)', width: '100%', maxWidth: '650px',
            maxHeight: '85vh', overflow: 'auto', padding: '32px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, fontFamily: 'var(--fh)', color: 'var(--tp)' }}>
                Audit Event Detail
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--tt)', fontSize: '20px' }}
              >
                <i className="ti ti-x" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tt)', textTransform: 'uppercase' }}>EVENT ID</div>
                <div style={{ fontSize: '13px', color: 'var(--tp)', marginTop: '4px', fontFamily: 'monospace' }}>{selectedEvent.eventId}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tt)', textTransform: 'uppercase' }}>DATE &amp; TIME</div>
                <div style={{ fontSize: '13px', color: 'var(--tp)', marginTop: '4px' }}>{formatDate(selectedEvent)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tt)', textTransform: 'uppercase' }}>USER (ID)</div>
                <div style={{ fontSize: '13px', color: 'var(--tp)', marginTop: '4px' }}>{selectedEvent.fullName || "System"} ({selectedEvent.userId || "-"})</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tt)', textTransform: 'uppercase' }}>ROLE</div>
                <div style={{ fontSize: '13px', color: 'var(--tp)', marginTop: '4px' }}>{selectedEvent.role || "System Service"}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tt)', textTransform: 'uppercase' }}>EVENT TYPE</div>
                <div style={{ fontSize: '13px', marginTop: '4px', fontWeight: 600, color: 'var(--teal-dark)' }}>{selectedEvent.eventType}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tt)', textTransform: 'uppercase' }}>RESULT</div>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={selectedEvent.result === 'Success' ? 'Completed' : 'Failed'} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tt)', textTransform: 'uppercase' }}>ORIGINAL REFERENCE</div>
                <div style={{ fontSize: '13px', color: 'var(--tp)', marginTop: '4px' }}>{selectedEvent.sourceReference || "-"}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tt)', textTransform: 'uppercase' }}>CANONICAL REFERENCE</div>
                <div style={{ fontSize: '13px', color: 'var(--tp)', marginTop: '4px', fontWeight: 600 }}>{selectedEvent.normalizedReference ? normalizeInvoiceNumber(selectedEvent.normalizedReference) : "-"}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tt)', textTransform: 'uppercase' }}>IP ADDRESS</div>
                <div style={{ fontSize: '13px', color: 'var(--tp)', marginTop: '4px' }}>{selectedEvent.ipAddress || "-"}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tt)', textTransform: 'uppercase' }}>CORRELATION ID</div>
                <div style={{ fontSize: '13px', color: 'var(--tp)', marginTop: '4px', fontFamily: 'monospace' }}>{selectedEvent.correlationId || "-"}</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tt)', textTransform: 'uppercase', marginBottom: '4px' }}>ACTION DESCRIPTION</div>
              <div style={{ fontSize: '13px', color: 'var(--tp)', backgroundColor: 'var(--s1)', padding: '10px 12px', borderRadius: '6px' }}>
                {selectedEvent.action}
              </div>
            </div>

            {selectedEvent.userAgent && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tt)', textTransform: 'uppercase', marginBottom: '4px' }}>USER AGENT</div>
                <div style={{ fontSize: '12px', color: 'var(--ts)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {selectedEvent.userAgent}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setSelectedEvent(null)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
