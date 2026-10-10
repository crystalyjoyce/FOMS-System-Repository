import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AiHeader } from '../components/AiHeader';
import { RefreshCw, Download, Search, ClipboardCheck, CheckCircle, XCircle, RotateCcw, MoreVertical, X } from 'lucide-react';
import { normalizeInvoiceNumber } from '../utils/referenceNormalizer';
import { useToast } from '../components/ToastContext';
import StatusCard from '../components/StatusCard';

// ─── Status Badge ──────────────────────────────────────────────────────────────
function DecisionBadge({ status }: { status: string }) {
  const s = String(status || '').toLowerCase();
  const cfg =
    s.includes('accept') || s.includes('processing')
      ? { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA', text: 'Processing' }
      : s.includes('reviewed') || s.includes('completed') || s.includes('closed')
      ? { bg: '#ECFDF5', color: '#059669', border: '#6EE7B7', text: 'Completed' }
      : s.includes('reject')
      ? { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', text: 'Rejected' }
      : { bg: '#F9FAFB', color: '#6B7280', border: '#D1D5DB', text: status || 'Pending' };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
    }}>
      ⊙ {cfg.text}
    </span>
  );
}

export const ForReview: React.FC = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [decision, setDecision] = useState('Accept Recommendation');
  const [recommendedAction, setRecommendedAction] = useState('');
  const [remarks, setRemarks] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
    
  useEffect(() => {
    if (selectedRecord) {
      setDecision('Accept Recommendation');
      setRecommendedAction('');
      setRemarks('');
    }
  }, [selectedRecord]);
  
  const handleSubmitManagerReview = async () => {
    if (!selectedRecord) return;
    setModalLoading(true);
    try {
      const payload = {
        decision,
        recommendedAction,
        remarks
      };
      const res = await fetch(`/api/ai/collection/recommendations/${selectedRecord.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success('Review logged successfully');
        setSelectedRecord(null);
        fetchReviews();
      } else {
        toast.error('Failed to log review');
      }
    } catch (e) {
      toast.error('Connection error');
    } finally {
      setModalLoading(false);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/collection/recommendations?status=all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Only show reviewed/logged entries (not pending)
        const logged = Array.isArray(data)
          ? data.filter((r: any) => r.review_status && r.review_status !== 'Pending Review')
          : [];
        setReviews(logged);
      } else {
        setReviews([]);
      }
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, [token]);

  // ── KPIs ──────────────────────────────────────────────────────────────────────
  const kpiTotal = reviews.length;
  const kpiAccepted = reviews.filter(r => {
    const s = String(r.review_status || '').toLowerCase();
    return s.includes('accept') || s.includes('processing');
  }).length;
  const kpiClosed = reviews.filter(r => {
    const s = String(r.review_status || '').toLowerCase();
    return s.includes('reviewed') || s.includes('completed') || s.includes('closed');
  }).length;
  const kpiRejected = reviews.filter(r =>
    String(r.review_status || '').toLowerCase().includes('reject')
  ).length;

  // ── Filtered ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    if (!s) return reviews;
    return reviews.filter(r => {
      const inv = r.priority?.invoice_number || '';
      const client = r.priority?.client_name || '';
      const by = r.reviewed_by || r.reviewer_username || '';
      return inv.toLowerCase().includes(s) || client.toLowerCase().includes(s) || by.toLowerCase().includes(s);
    });
  }, [reviews, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleExport = () => {
    if (!filtered.length) return;
    const headers = ['Log Date & Time', 'Invoice Number', 'Client Name (FOMS)', 'Outstanding Balance', 'Logged Decision', 'Logged By', 'Action Taken & Remarks'];
    const csv = [
      headers.join(','),
      ...filtered.map(r => [
        `"${r.reviewed_at ? new Date(r.reviewed_at).toLocaleString() : '—'}"`,
        `"${r.priority?.invoice_number || '—'}"`,
        `"${r.priority?.client_name || '—'}"`,
        r.priority?.outstanding_balance || 0,
        `"${r.review_status || '—'}"`,
        `"${r.reviewed_by || r.reviewer_username || '—'}"`,
        `"Action Taken: ${r.remarks || '—'}. Notes: ${r.recommended_action || 'none'}"`,
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `for-review-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '11px 14px',
    fontSize: 12, fontWeight: 700, color: '#6B7280',
    borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap',
    background: '#F9FAFB',
  };

  return (
    <div className="main-content fade-in">
      <AiHeader title="For Review" />

      <div className="page-container">
        {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
        <div className="kpi-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <StatusCard
            label="Total Logged Decisions"
            value={kpiTotal}
            icon="ti ti-clipboard-check"
            variant="teal"
          />
          <StatusCard
            label="Accepted Recommendations"
            value={kpiAccepted}
            icon="ti ti-circle-check"
            variant="success"
          />
          <StatusCard
            label="Reviewed & Closed"
            value={kpiClosed}
            icon="ti ti-rotate-clockwise"
            variant="info"
          />
          <StatusCard
            label="Rejected Assignment"
            value={kpiRejected}
            icon="ti ti-circle-x"
            variant="danger"
          />
        </div>

        {/* ── Logged Decisions Audit Log Table ───────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#111827' }}>Logged Decisions Audit Log</h3>

            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search logged decisions..."
                  style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 36, borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <button
                onClick={handleExport}
                style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={14} /> Export
              </button>
              <button
                onClick={fetchReviews}
                style={{ height: 36, padding: '0 16px', borderRadius: 8, border: 'none', background: '#059669', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={14} /> Refresh Log
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: '#9CA3AF', gap: 10 }}>
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 14 }}>Loading audit log...</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 40 }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }} readOnly />
                    </th>
                    <th style={thStyle}>Log Date & Time ↕</th>
                    <th style={thStyle}>Invoice Number ↕</th>
                    <th style={thStyle}>Client Name (FOMS) ↕</th>
                    <th style={thStyle}>Outstanding Balance ↕</th>
                    <th style={thStyle}>Logged Decision ↕</th>
                    <th style={thStyle}>Logged By ↕</th>
                    <th style={thStyle}>Action Taken & Remarks</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#9CA3AF', fontSize: 14 }}>
                        No logged decisions found.
                      </td>
                    </tr>
                  )}
                  {paginated.map((row, i) => {
                    const p = row.priority || {};
                    const logDate = row.reviewed_at
                      ? new Date(row.reviewed_at).toLocaleString('en-PH', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
                      : '—';
                    const invoiceNo = p.normalized_invoice_number || normalizeInvoiceNumber(p.invoice_number) || p.invoice_number || '—';
                    const loggedBy = row.reviewed_by || row.reviewer_username || '—';
                    const loggedByRole = row.reviewer_role || 'Financial Manager';
                    const actionTaken = row.remarks || '—';
                    const notes = row.recommended_action || 'none';

                    return (
                      <tr
                        key={row.id || i}
                        style={{ borderBottom: '1px solid #F3F4F6' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <input type="checkbox" style={{ cursor: 'pointer' }} readOnly />
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>
                          {logDate}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#111827' }}>
                          {invoiceNo}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>
                          {p.client_name || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#111827' }}>
                          ₱{(p.outstanding_balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <DecisionBadge status={row.review_status || '—'} />
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{loggedBy}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{loggedByRole}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center' }}>
                            <span style={{ display: 'inline-block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Action Taken: {actionTaken}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, display: 'flex', alignItems: 'center' }}>
                            <span style={{ display: 'inline-block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Notes: {notes}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <button
                            onClick={() => setSelectedRecord(row)}
                            style={{
                              background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6,
                              width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', color: '#6B7280'
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination footer */}
          {!loading && filtered.length > 0 && (
            <div style={{ padding: '14px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#6B7280' }}>
                Showing {Math.min((page - 1) * rowsPerPage + 1, filtered.length)}–{Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} records
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>Rows per page</span>
                  <select
                    value={rowsPerPage}
                    onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                    style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, color: '#374151', background: '#fff' }}
                  >
                    {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, fontSize: 13, color: '#374151' }}
                  >‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      style={{
                        width: 30, height: 30, borderRadius: 6, fontSize: 13, fontWeight: page === n ? 700 : 400,
                        border: page === n ? 'none' : '1px solid #D1D5DB',
                        background: page === n ? '#059669' : '#fff',
                        color: page === n ? '#fff' : '#374151',
                        cursor: 'pointer',
                      }}
                    >{n}</button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1, fontSize: 13, color: '#374151' }}
                  >›</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decision Log Record Modal */}
      {selectedRecord && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedRecord(null); }}
        >
          <div className="fade-in" style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 650, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827' }}>Decision Log Record #{selectedRecord.id}</h2>
              <button onClick={() => setSelectedRecord(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px 28px', maxHeight: '75vh', overflowY: 'auto' }}>
              {/* OFFICIAL FOMS ACCOUNT */}
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Official FOMS Account</p>
                <p style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800, color: '#111827' }}>
                  {selectedRecord.priority?.client_name || '—'} (Client ID: {selectedRecord.priority?.client_name || '—'})
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 11, color: '#6B7280' }}>Invoice Number</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>
                      {selectedRecord.priority?.normalized_invoice_number || normalizeInvoiceNumber(selectedRecord.priority?.invoice_number) || selectedRecord.priority?.invoice_number || '—'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 11, color: '#6B7280' }}>Outstanding Balance</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#111827' }}>
                      ₱{(selectedRecord.priority?.outstanding_balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* HUMAN AUDIT TRAIL */}
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 20px' }}>
                <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Human Audit Trail</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  <div style={{ fontSize: 13 }}>
                    <strong style={{ color: '#111827', fontWeight: 700 }}>Review Decision:</strong>{' '}
                    <span style={{ color: '#374151' }}>
                      {selectedRecord.review_status === 'Processing' ? 'Accepted as Recommendation' : selectedRecord.review_status || '—'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <strong style={{ color: '#111827', fontWeight: 700 }}>Logged By:</strong>{' '}
                    <span style={{ color: '#374151' }}>
                      {selectedRecord.reviewed_by || selectedRecord.reviewer_username || '—'} ({selectedRecord.reviewer_role || 'Financial Manager'})
                    </span>
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <strong style={{ color: '#111827', fontWeight: 700 }}>Timestamp:</strong>{' '}
                    <span style={{ color: '#374151' }}>
                      {selectedRecord.reviewed_at ? new Date(selectedRecord.reviewed_at).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }) : '—'}
                    </span>
                  </div>
                </div>
                
                <div style={{ padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#111827' }}>
                    <strong style={{ fontWeight: 700 }}>Action Taken:</strong> <span style={{ color: '#374151' }}>{selectedRecord.remarks || '—'}</span>
                    <span style={{ color: '#D1D5DB', margin: '0 8px' }}>|</span>
                    <strong style={{ fontWeight: 700 }}>Notes:</strong> <span style={{ color: '#374151' }}>{selectedRecord.recommended_action || 'none'}</span>
                  </p>
                </div>
              </div>

              {/* ── FINANCE REVIEW FORM ── */}
              <div style={{ marginTop: 24 }}>
                <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={14} /> Finance Review
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Decision dropdown */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Review Decision</label>
                    <select
                      value={decision}
                      onChange={e => setDecision(e.target.value)}
                      style={{
                        width: '100%', height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid #D1D5DB',
                        background: '#fff', fontSize: 13, color: '#111827', outline: 'none'
                      }}
                    >
                      <option value="Accepted as Recommendation">Accept Recommendation</option>
                      <option value="Reviewed & Closed">Reviewed & Closed</option>
                      <option value="Reject Priority Assignment">Reject Priority Assignment</option>
                    </select>
                  </div>

                  {/* Action input */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Action Taken *</label>
                    <input
                      type="text"
                      value={recommendedAction}
                      onChange={e => setRecommendedAction(e.target.value)}
                      placeholder="e.g. Sent payment reminder"
                      style={{
                        width: '100%', height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid #D1D5DB',
                        background: '#fff', fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Remarks input */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Remarks / Validation Notes (Optional)</label>
                    <textarea
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Optional validation steps or extra context..."
                      style={{
                        width: '100%', height: 80, padding: '10px 12px', borderRadius: 6, border: '1px solid #D1D5DB',
                        background: '#fff', fontSize: 13, color: '#111827', outline: 'none', resize: 'vertical', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 32px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10, background: '#F9FAFB' }}>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{
                  flex: 1, height: 38, borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff',
                  cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#374151',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#EF4444'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#D1D5DB'}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitManagerReview}
                disabled={modalLoading || !recommendedAction.trim()}
                style={{
                  flex: 1, height: 38, borderRadius: 8, border: 'none', 
                  background: (!recommendedAction.trim() ? '#64CCC5' : '#0284C7'),
                  cursor: (modalLoading || !recommendedAction.trim()) ? 'not-allowed' : 'pointer', 
                  fontWeight: 700, fontSize: 13, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'background-color 0.3s'
                }}
              >
                {modalLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Log Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
