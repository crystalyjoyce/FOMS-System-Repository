import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionContext';
import { AiHeader } from '../components/AiHeader';
import { TableSkeleton, MetricCardSkeleton } from '../components/Skeletons';
import { normalizeInvoiceNumber } from '../utils/referenceNormalizer';
import { 
  FileText, LogIn, ShieldAlert, AlertTriangle, RefreshCw, X, ZoomIn
} from 'lucide-react';

interface AuditEvent {
  eventId: string;
  occurredAt: string;
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

  // Filter and search states
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('');
  const [result, setResult] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

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
      // Fail silently for summary, main query error handling is sufficient
    }
  }, [token]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query string
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy: 'occurred_at',
        sortDirection: 'desc'
      });

      if (search) params.append('search', search);
      if (eventType) params.append('eventType', eventType);
      if (result) params.append('result', result);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

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
      setItems(data.items);
      setTotalCount(data.totalCount);
    } catch (e: any) {
      setError(e.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize, search, eventType, result, dateFrom, dateTo]);

  useEffect(() => {
    if (hasPermission("ai.audit.view") || hasPermission("ai.audit.view_limited")) {
      fetchSummary();
      fetchLogs();
    } else {
      setError("UNAUTHORIZED");
      setLoading(false);
    }
  }, [fetchSummary, fetchLogs, hasPermission]);

  const handleResetFilters = () => {
    setSearch('');
    setEventType('');
    setResult('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    fetchSummary();
    fetchLogs();
  };

  if (error === "UNAUTHORIZED") {
    return (
      <div className="main-content">
        <AiHeader title="Audit Trail" />
        <div className="page-container" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div className="card text-center" style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
            <ShieldAlert size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Unauthorized Access</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
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
            <AlertTriangle size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Connection Failure</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              The audit trail could not be loaded. Please retry. The legacy FOMS remains operational.
            </p>
            <button onClick={handleRetry} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
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
        
        {/* Header Title block */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>Audit Trail</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Review system-generated AI events, user actions, and authorization activity.
          </p>
        </div>

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
            {/* Total Audit Events */}
            <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Audit Events
                </span>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(0,140,149,0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={14} />
                </div>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {summary?.totalEvents ?? 0}
              </h2>
            </div>

            {/* Login Events */}
            <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Login Events
                </span>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(0,140,149,0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LogIn size={14} />
                </div>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {summary?.loginEvents ?? 0}
              </h2>
            </div>

            {/* Duplicate Review Events */}
            <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Duplicate Review Events
                </span>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(0,140,149,0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={14} />
                </div>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {summary?.duplicateEvents ?? 0}
              </h2>
            </div>

            {/* Collection Review Events */}
            <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Collection Reviews
                </span>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(0,140,149,0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={14} />
                </div>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {summary?.collectionEvents ?? 0}
              </h2>
            </div>

            {/* Failed attempts */}
            <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Failed Attempts
                </span>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert size={14} />
                </div>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {summary?.failedAttempts ?? 0}
              </h2>
            </div>
          </div>
        )}

        {/* Search and Filters box */}
        <div className="card" style={{ padding: '16px', marginBottom: '20px', border: '1px solid var(--border-soft)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
            
            {/* Search Input */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                SEARCH DETAILS
              </label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search description, reference..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ height: '36px', fontSize: '13px' }}
              />
            </div>

            {/* Event Type Select */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                EVENT TYPE
              </label>
              <select 
                className="form-control"
                value={eventType}
                onChange={(e) => { setEventType(e.target.value); setPage(1); }}
                style={{ height: '36px', fontSize: '13px', padding: '0 8px' }}
              >
                <option value="">All Events</option>
                <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                <option value="LOGIN_FAILED">LOGIN_FAILED</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="UNAUTHORIZED_ACCESS">UNAUTHORIZED_ACCESS</option>
                <option value="DUPLICATE_ALERT_REVIEWED">DUPLICATE_ALERT_REVIEWED</option>
                <option value="COLLECTION_PRIORITY_GENERATED">COLLECTION_PRIORITY_GENERATED</option>
                <option value="COLLECTION_RECOMMENDATION_REVIEWED">COLLECTION_RECOMMENDATION_REVIEWED</option>
                <option value="REPORT_EXPORTED">REPORT_EXPORTED</option>
                <option value="AI_SERVICE_FAILURE">AI_SERVICE_FAILURE</option>
              </select>
            </div>

            {/* Result Select */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                RESULT
              </label>
              <select 
                className="form-control"
                value={result}
                onChange={(e) => { setResult(e.target.value); setPage(1); }}
                style={{ height: '36px', fontSize: '13px', padding: '0 8px' }}
              >
                <option value="">All Results</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            {/* Date From */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                DATE FROM
              </label>
              <input 
                type="date" 
                className="form-control"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                style={{ height: '36px', fontSize: '13px' }}
              />
            </div>

            {/* Date To */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                DATE TO
              </label>
              <input 
                type="date" 
                className="form-control"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                style={{ height: '36px', fontSize: '13px' }}
              />
            </div>

            {/* Reset Button */}
            <button 
              onClick={handleResetFilters}
              className="btn btn-secondary" 
              style={{ height: '36px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <TableSkeleton columns={9} rows={5} />
        ) : items.length === 0 ? (
          <div className="card text-center" style={{ padding: '60px 20px', border: '1px solid var(--border-soft)' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              No audit events match the selected filters.
            </span>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Date & Time</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Event Type</th>
                    <th>Action</th>
                    <th>Related Record</th>
                    <th>Result</th>
                    <th style={{ textAlign: 'center' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(event => (
                    <tr key={event.eventId}>
                      <td style={{ fontWeight: 600, fontSize: '12px' }}>{event.eventId.substring(0, 8)}...</td>
                      <td>{new Date(event.occurredAt).toLocaleString()}</td>
                      <td>{event.fullName || "System"}</td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{event.role || "System Service"}</span>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: '12px', color: 'var(--primary)' }}>{event.eventType}</td>
                      <td>{event.action}</td>
                      <td>
                        {event.normalizedReference ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <strong style={{ fontSize: '13px' }}>{normalizeInvoiceNumber(event.normalizedReference)}</strong>
                            {event.sourceReference && event.sourceReference !== event.normalizedReference && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Src: {event.sourceReference}</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          event.result === 'Success' ? 'badge-approved' : 'badge-rejected'
                        }`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                          {event.result}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => setSelectedEvent(event)}
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <ZoomIn size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--border-soft)', backgroundColor: 'var(--surface-soft)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Showing page <strong>{page}</strong> of <strong>{Math.ceil(totalCount / pageSize) || 1}</strong> ({totalCount} total entries)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="btn btn-secondary" 
                  style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
                >
                  Previous
                </button>
                <button 
                  disabled={page >= Math.ceil(totalCount / pageSize)}
                  onClick={() => setPage(p => p + 1)}
                  className="btn btn-secondary" 
                  style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      {selectedEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card fade-in" style={{
            width: '100%',
            maxWidth: '650px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-hard)',
            overflow: 'hidden',
            margin: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', backgroundColor: 'var(--surface-soft)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Audit Event Detail
              </h3>
              <button 
                onClick={() => setSelectedEvent(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>EVENT ID</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'monospace' }}>{selectedEvent.eventId}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>DATE & TIME</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>{new Date(selectedEvent.occurredAt).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>USER (ID)</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>{selectedEvent.fullName || "System"} ({selectedEvent.userId || "-"})</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ROLE</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>{selectedEvent.role || "System Service"}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>EVENT TYPE</div>
                  <div style={{ fontSize: '13px', marginTop: '4px', fontWeight: 600, color: 'var(--primary)' }}>{selectedEvent.eventType}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>RESULT</div>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`badge ${
                      selectedEvent.result === 'Success' ? 'badge-approved' : 'badge-rejected'
                    }`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                      {selectedEvent.result}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ORIGINAL REFERENCE</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>{selectedEvent.sourceReference || "-"}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>CANONICAL REFERENCE</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px', fontWeight: 600 }}>{selectedEvent.normalizedReference ? normalizeInvoiceNumber(selectedEvent.normalizedReference) : "-"}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>IP ADDRESS</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>{selectedEvent.ipAddress || "-"}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>CORRELATION ID</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'monospace' }}>{selectedEvent.correlationId || "-"}</div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>ACTION DESCRIPTION</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', backgroundColor: 'var(--surface-soft)', padding: '10px 12px', borderRadius: '6px' }}>
                  {selectedEvent.action}
                </div>
              </div>

              {selectedEvent.userAgent && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>USER AGENT</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {selectedEvent.userAgent}
                  </div>
                </div>
              )}

              {selectedEvent.details && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>ADDITIONAL METADATA (JSON)</div>
                  <pre style={{ 
                    margin: 0, 
                    padding: '12px', 
                    backgroundColor: '#1e293b', 
                    color: '#f8fafc', 
                    borderRadius: '6px', 
                    fontSize: '12px', 
                    overflowX: 'auto',
                    fontFamily: 'monospace'
                  }}>
                    {JSON.stringify(selectedEvent.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--border-soft)', backgroundColor: 'var(--surface-soft)' }}>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="btn btn-secondary" 
                style={{ height: '32px', padding: '0 16px', fontSize: '12px' }}
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
