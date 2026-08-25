import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AiHeader } from '../components/AiHeader';
import { DecisionSupportNotice } from '../components/DecisionSupportNotice';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/ToastContext';
import { Sparkles, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';
import { normalizeInvoiceNumber } from '../utils/referenceNormalizer';

function PriorityBadge({ level }: { level: string }) {
  const l = String(level || '').toLowerCase();
  const isHigh = l.includes('high') || l.includes('urgent') || l.includes('critical');
  const isMed = l.includes('medium') || l.includes('med');

  const cfg = isHigh
    ? { bg: '#FEE2E2', color: '#B91C1C', text: 'High Priority' }
    : isMed
    ? { bg: '#FEF3C7', color: '#D97706', text: 'Medium Priority' }
    : { bg: '#D1FAE5', color: '#059669', text: 'Low Priority' };

  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
      {cfg.text}
    </span>
  );
}

export const CollectionRecommendations: React.FC = () => {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('Pending Review');

  // Review Modal State
  const [selectedRec, setSelectedRec] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [decision, setDecision] = useState('Accepted as Recommendation');
  const [remarks, setRemarks] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/collection-recommendations?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setRecs(await res.json());
      } else {
        setError('Failed to fetch collection recommendations.');
      }
    } catch {
      setError('Service connection offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecommendations(); }, [token, statusFilter]);

  const handleOpenReview = (row: any) => {
    setSelectedRec(row);
    setDecision('Accepted as Recommendation');
    setRemarks('');
    setRecommendedAction(row.recommended_action || '');
  };

  const handleSubmitReview = async () => {
    if (!selectedRec) return;
    if (!remarks.trim()) {
      toast.warning('Investigation notes/remarks are required for review.', 'Validation');
      return;
    }
    setModalLoading(true);
    try {
      const res = await fetch(`/api/ai/collection-recommendations/${selectedRec.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision, remarks, recommendedAction }),
      });
      if (res.ok) {
        setSelectedRec(null);
        toast.success(`Logged review action on Recommendation #${selectedRec.id}`, 'Review Submitted');
        fetchRecommendations();
      } else {
        toast.error('Failed to submit review.', 'Error');
      }
    } catch {
      toast.error('Connection issue. Action failed.', 'Error');
    } finally {
      setModalLoading(false);
    }
  };

  const canSubmitReviews =
    user?.role && ['Financial Manager', 'Head Accountant', 'Accountant'].includes(user.role);

  const priorityToStatus = (lvl: string) => {
    switch (lvl?.toLowerCase()) {
      case 'urgent': return '90+ Days';
      case 'high': return '60 - 90 Days';
      case 'medium': return '30 - 60 Days';
      default: return 'Active';
    }
  };

  const reviewToStatus = (status: string) => {
    switch (status) {
      case 'Accepted as Recommendation':
      case 'Reviewed': return 'Completed';
      case 'Rejected': return 'Failed';
      default: return 'Processing';
    }
  };

  const columns: import('../components/DataTable').ColumnDef<any>[] = [
    {
      key: 'invoice_number',
      label: 'Invoice Number',
      sortable: true,
      width: '160px',
      render: (row: any) => (
        <span style={{ fontWeight: 600, fontFamily: 'var(--fm)', color: 'var(--tp)' }}>
          {row.priority?.normalized_invoice_number || normalizeInvoiceNumber(row.priority?.invoice_number)}
        </span>
      ),
    },
    {
      key: 'client_name',
      label: 'Client Name',
      sortable: true,
      width: '200px',
      render: (row: any) => row.priority?.client_name,
    },
    {
      key: 'outstanding_balance',
      label: 'Outstanding Balance',
      sortable: true,
      width: '180px',
      render: (row: any) => (
        <span style={{ fontWeight: 700, color: 'var(--tp)' }}>
          ₱{row.priority?.outstanding_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      sortable: true,
      width: '130px',
      render: (row: any) => new Date(row.priority?.due_date).toLocaleDateString(),
    },
    {
      key: 'priority_level',
      label: 'Urgency',
      sortable: true,
      width: '140px',
      render: (row: any) => <PriorityBadge level={row.priority?.priority_level || 'Low'} />,
    },
    {
      key: 'recommended_action',
      label: 'Suggested Action',
      width: '300px',
      render: (row: any) => (
        <span style={{ fontSize: '13px', color: 'var(--ts)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.recommended_action}
        </span>
      ),
    },
    {
      key: 'review_status',
      label: 'Status',
      sortable: true,
      width: '140px',
      render: (row: any) => <StatusBadge status={reviewToStatus(row.review_status)} />,
    },
  ];

  const rowActions = [
    {
      label: 'Evaluate',
      icon: 'ti-file-text',
      onClick: handleOpenReview,
    },
  ];

  return (
    <div className="main-content fade-in">
      <AiHeader title="Collection Recommendations" />

      <div className="page-container">
        <DecisionSupportNotice />

        {error && (
          <div className="advisory-banner danger" style={{ marginBottom: '20px' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <div><strong>AI Service Offline</strong> — {error}</div>
          </div>
        )}

        <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--sh1)' }}>
          <DataTable
            title="Collection Recommendations"
            rowKey="id"
            data={recs}
            columns={columns}
            actions={rowActions}
            loading={loading}
            searchPlaceholder="Search recommendations..."
            selectable
            exportable
            columnToggle
            densityToggle
            filters={[
              {
                key: 'review_status',
                label: 'All Statuses',
                options: [
                  { label: 'Pending Review', value: 'Pending Review' },
                  { label: 'Accepted', value: 'Accepted as Recommendation' },
                  { label: 'Reviewed & Closed', value: 'Reviewed' },
                  { label: 'Rejected', value: 'Rejected' },
                ],
              },
            ]}
            createButtons={[
              { label: 'Refresh Data', icon: 'ti-refresh', variant: 'primary', onClick: () => fetchRecommendations() },
            ]}
          />
        </div>
      </div>

      {/* Evaluation Modal */}
      {selectedRec && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.45)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedRec(null); }}
        >
          <div style={{
            background: 'var(--s0)', borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--sh4)', width: '100%', maxWidth: '700px',
            maxHeight: '90vh', overflow: 'auto', padding: '32px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, fontFamily: 'var(--fh)' }}>
                Evaluate Collection Recommendation #{selectedRec.id}
              </h2>
              <button onClick={() => setSelectedRec(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tt)', fontSize: '20px' }}>
                <i className="ti ti-x" />
              </button>
            </div>

            {/* Official FOMS Data */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--tt)', fontWeight: 700, margin: '0 0 8px' }}>Official FOMS Data</p>
              <div className="card" style={{ padding: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--tt)', margin: '0 0 4px' }}>Client Account</p>
                <p style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px', color: 'var(--tp)' }}>
                  {selectedRec.priority?.client_name} (Client ID: {selectedRec.priority?.client_id})
                </p>
                <div className="grid-2">
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--tt)', margin: '0 0 4px' }}>Invoice Number</p>
                    <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>
                      {selectedRec.priority?.normalized_invoice_number || normalizeInvoiceNumber(selectedRec.priority?.invoice_number)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--tt)', margin: '0 0 4px' }}>Outstanding Balance</p>
                    <p style={{ fontWeight: 700, fontSize: '14px', margin: 0, color: 'var(--tp)' }}>
                      ₱{selectedRec.priority?.outstanding_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Recommendation */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--teal)', fontWeight: 700, margin: '0 0 8px' }}>AI Recommendation</p>
              <div style={{ background: 'var(--teal-bg)', padding: '16px', borderRadius: '10px', border: '1px solid var(--teal-ring)' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                  <Sparkles size={16} style={{ color: 'var(--teal)' }} />
                  <span style={{ fontWeight: 700, color: 'var(--teal-dark)', fontSize: '14px' }}>Suggested Action Plan</span>
                </div>
                <p style={{ fontWeight: 600, color: 'var(--tp)', fontSize: '14px', margin: '0 0 12px' }}>
                  {selectedRec.recommended_action}
                </p>
                {selectedRec.explanation_basis?.length > 0 && (
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--ts)', margin: '0 0 6px', fontWeight: 600 }}>Supporting Factors:</p>
                    <ul style={{ paddingLeft: '16px', margin: 0 }}>
                      {selectedRec.explanation_basis.map((reason: string, idx: number) => (
                        <li key={idx} style={{ fontSize: '13px', color: 'var(--ts)', marginBottom: '4px' }}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Finance Review */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--tt)', fontWeight: 700, margin: '0 0 12px' }}>Finance Review</p>

              {canSubmitReviews && selectedRec.review_status === 'Pending Review' ? (
                <div>
                  <div className="grid-2" style={{ marginBottom: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--ts)' }}>Review Decision</label>
                      <select className="input-select" value={decision} onChange={(e) => setDecision(e.target.value)}>
                        <option value="Accepted as Recommendation">Accept Recommendation</option>
                        <option value="Reviewed">Reviewed &amp; Closed</option>
                        <option value="Rejected">Reject Recommendation</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--ts)' }}>Action Taken</label>
                      <input type="text" className="form-control" value={recommendedAction} onChange={(e) => setRecommendedAction(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--ts)' }}>
                      Remarks / Validation Notes <span style={{ color: 'var(--err)' }}>*</span>
                    </label>
                    <textarea
                      style={{ width: '100%', minHeight: '90px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'var(--fb)', fontSize: '13px', resize: 'vertical' }}
                      placeholder="Log validation steps (e.g. contact logs, account changes)..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline" onClick={() => setSelectedRec(null)}>Cancel</button>
                    <button
                      disabled={modalLoading || !remarks.trim()}
                      onClick={handleSubmitReview}
                      style={{
                        background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: '8px',
                        padding: '0 20px', height: '40px', fontWeight: 600, cursor: 'pointer',
                        opacity: (modalLoading || !remarks.trim()) ? 0.6 : 1,
                      }}
                    >
                      {modalLoading ? 'Saving...' : 'Log Decision'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {selectedRec.review_status !== 'Pending Review' ? (
                    <div style={{ background: 'var(--ok-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--ok-r)' }}>
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={16} /> Human review validation logged successfully.
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '13px' }}>
                        <strong>Status:</strong> {selectedRec.review_status}
                      </p>
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: 'var(--err)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={16} /> Your role is not authorized to submit validation reviews.
                    </p>
                  )}
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline" onClick={() => setSelectedRec(null)}>Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
