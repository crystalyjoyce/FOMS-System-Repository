import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DecisionSupportNotice } from '../components/DecisionSupportNotice';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import StatusCard from '../components/StatusCard';
import { useToast } from '../components/ToastContext';
import { AiHeader } from '../components/AiHeader';
import { Sparkles, ShieldAlert, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { normalizeInvoiceNumber } from '../utils/referenceNormalizer';

export const CollectionPriorities: React.FC = () => {
  const { token, user } = useAuth();
  const { toast } = useToast();

  // Tab State
  const [activeTab, setActiveTab] = useState<'priorities' | 'recommendations'>('priorities');

  // Priorities State
  const [priorities, setPriorities] = useState<any[]>([]);
  const [loadingPriorities, setLoadingPriorities] = useState(true);
  const [errorPriorities, setErrorPriorities] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<any | null>(null);

  // Recommendations State
  const [recs, setRecs] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [errorRecs, setErrorRecs] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('Pending Review');
  const [selectedRec, setSelectedRec] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [decision, setDecision] = useState('Accepted as Recommendation');
  const [remarks, setRemarks] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');

  // Fetch Priorities
  const fetchPriorities = async () => {
    setLoadingPriorities(true);
    setErrorPriorities(null);
    try {
      const res = await fetch('/api/ai/collection-priorities', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPriorities(await res.json());
      } else {
        setErrorPriorities('Failed to fetch collection priorities.');
      }
    } catch {
      setErrorPriorities('Service connection offline.');
    } finally {
      setLoadingPriorities(false);
    }
  };

  // Fetch Recommendations
  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    setErrorRecs(null);
    try {
      const res = await fetch(`/api/ai/collection-recommendations?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setRecs(await res.json());
      } else {
        setErrorRecs('Failed to fetch collection recommendations.');
      }
    } catch {
      setErrorRecs('Service connection offline.');
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    fetchPriorities();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'recommendations') {
      fetchRecommendations();
    }
  }, [token, activeTab, statusFilter]);

  const handleOpenPriorityDetail = async (row: any) => {
    try {
      const res = await fetch(`/api/ai/collection-priorities/${row.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSelectedPriority(await res.json());
      } else {
        toast.error('Failed to load priority detail.', 'Error');
      }
    } catch {
      toast.error('Connection error.', 'Error');
    }
  };

  const handleOpenRecReview = (row: any) => {
    setSelectedRec(row);
    setDecision('Accepted as Recommendation');
    setRemarks('');
    setRecommendedAction(row.recommended_action || '');
  };

  const handleSubmitRecReview = async () => {
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

  // Priorities Table Columns
  const priorityColumns: import('../components/DataTable').ColumnDef<any>[] = [
    {
      key: 'invoice_number',
      label: 'Invoice Number',
      sortable: true,
      width: '160px',
      render: (row: any) => (
        <span style={{ fontWeight: 600, fontFamily: 'var(--fm)', color: 'var(--tp)' }}>
          {row.normalized_invoice_number || normalizeInvoiceNumber(row.invoice_number)}
        </span>
      ),
    },
    {
      key: 'client_name',
      label: 'Client Name',
      sortable: true,
      width: '220px',
      render: (row: any) => `${row.client_name} (ID: ${row.client_id})`,
    },
    {
      key: 'outstanding_balance',
      label: 'Outstanding Balance',
      sortable: true,
      width: '180px',
      render: (row: any) => (
        <span style={{ fontWeight: 700, color: 'var(--tp)' }}>
          ₱{row.outstanding_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      sortable: true,
      width: '130px',
      render: (row: any) => new Date(row.due_date).toLocaleDateString(),
    },
    {
      key: 'priority_level',
      label: 'Suggested Priority',
      sortable: true,
      width: '160px',
      render: (row: any) => <StatusBadge status={priorityToStatus(row.priority_level)} />,
    },
    {
      key: 'risk_score',
      label: 'Predictive Risk Score',
      sortable: true,
      width: '210px',
      render: (row: any) => {
        const p = String(row.priority_level || '').toUpperCase();
        const score = row.risk_score || (
          p.includes('CRITICAL') || p.includes('URGENT') ? 95 :
          p.includes('HIGH') ? 82 :
          p.includes('MEDIUM') ? 55 : 15
        );
        const level = score >= 90 ? 'Critical Risk' : score >= 75 ? 'High Risk' : score >= 40 ? 'Medium Risk' : 'Low Risk';
        const color = score >= 90 ? 'var(--err)' : score >= 75 ? 'var(--warn)' : score >= 40 ? '#D97706' : 'var(--ok)';
        const bg = score >= 90 ? 'var(--err-bg)' : score >= 75 ? 'var(--warn-bg)' : score >= 40 ? '#FEF3C7' : 'var(--ok-bg)';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ fontWeight: 700, color, background: bg, padding: '2px 8px', borderRadius: '4px' }}>
                {level}
              </span>
              <span style={{ fontWeight: 700, color }}>{score}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--s2)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: '3px' }} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'supporting_basis',
      label: 'Action Basis',
      width: '300px',
      render: (row: any) => (
        <span style={{ fontSize: '13px', color: 'var(--ts)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.supporting_basis || 'Overdue balances'}
        </span>
      ),
    },
  ];

  // Recommendations Table Columns
  const recColumns: import('../components/DataTable').ColumnDef<any>[] = [
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
      render: (row: any) => <StatusBadge status={priorityToStatus(row.priority?.priority_level)} />,
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

  return (
    <div className="main-content fade-in">
      <AiHeader title="Collection Priorities &amp; Receivable Risk Monitoring" />

      <div className="page-container">
        <DecisionSupportNotice />

        {/* Speedex OneUI Sub-tab Switcher */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('priorities')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 22px', borderRadius: '10px',
              border: activeTab === 'priorities' ? 'none' : '1px solid var(--border)',
              fontFamily: 'var(--fb)', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
              background: activeTab === 'priorities' ? 'var(--teal)' : '#ffffff',
              color: activeTab === 'priorities' ? '#ffffff' : 'var(--tp)',
              boxShadow: activeTab === 'priorities' ? '0 4px 12px rgba(0, 169, 157, 0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <TrendingUp size={16} style={{ color: activeTab === 'priorities' ? '#ffffff' : 'var(--teal)' }} />
            Collection Priorities
          </button>

          <button
            onClick={() => setActiveTab('recommendations')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 22px', borderRadius: '10px',
              border: activeTab === 'recommendations' ? 'none' : '1px solid var(--border)',
              fontFamily: 'var(--fb)', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
              background: activeTab === 'recommendations' ? 'var(--teal)' : '#ffffff',
              color: activeTab === 'recommendations' ? '#ffffff' : 'var(--tp)',
              boxShadow: activeTab === 'recommendations' ? '0 4px 12px rgba(0, 169, 157, 0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Sparkles size={16} style={{ color: activeTab === 'recommendations' ? '#ffffff' : 'var(--teal)' }} />
            Recommendations &amp; Review
          </button>
        </div>

        {/* Tab 1: Collection Priorities */}
        {activeTab === 'priorities' && (
          <>
            {errorPriorities && (
              <div className="advisory-banner danger" style={{ marginBottom: '20px' }}>
                <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                <div><strong>AI Service Offline</strong> — {errorPriorities}</div>
              </div>
            )}

            <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--sh1)' }}>
              <DataTable
                title="Collection Priorities"
                rowKey="id"
                data={priorities}
                columns={priorityColumns}
                actions={[
                  {
                    label: 'View Details',
                    icon: 'ti-eye',
                    onClick: handleOpenPriorityDetail,
                  },
                ]}
                loading={loadingPriorities}
                searchPlaceholder="Search priorities..."
                selectable
                exportable
                columnToggle
                densityToggle
                filters={[
                  {
                    key: 'priority_level',
                    label: 'All Priorities',
                    options: [
                      { label: 'Urgent', value: 'Urgent' },
                      { label: 'High', value: 'High' },
                      { label: 'Medium', value: 'Medium' },
                      { label: 'Low', value: 'Low' },
                    ],
                  },
                ]}
                createButtons={[
                  { label: 'Refresh Data', icon: 'ti-refresh', variant: 'primary', onClick: () => fetchPriorities() },
                ]}
              />
            </div>
          </>
        )}

        {/* Tab 2: Recommendations & Review */}
        {activeTab === 'recommendations' && (
          <>
            {errorRecs && (
              <div className="advisory-banner danger" style={{ marginBottom: '20px' }}>
                <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                <div><strong>AI Service Offline</strong> — {errorRecs}</div>
              </div>
            )}

            <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--sh1)' }}>
              <DataTable
                title="Collection Recommendations"
                rowKey="id"
                data={recs}
                columns={recColumns}
                actions={[
                  {
                    label: 'Evaluate',
                    icon: 'ti-file-text',
                    onClick: handleOpenRecReview,
                  },
                ]}
                loading={loadingRecs}
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
          </>
        )}
      </div>

      {/* Priority Detail Panel */}
      {selectedPriority && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.45)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedPriority(null); }}
        >
          <div style={{
            background: 'var(--s0)', borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--sh4)', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflow: 'auto', padding: '32px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, fontFamily: 'var(--fh)' }}>
                Priority Details
              </h2>
              <button onClick={() => setSelectedPriority(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tt)', fontSize: '20px' }}>
                <i className="ti ti-x" />
              </button>
            </div>

            <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--tt)', margin: '0 0 4px' }}>Official FOMS Data</p>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px' }}>
              {selectedPriority.client_name} (Client ID: {selectedPriority.client_id})
            </h3>

            <div className="grid-2" style={{ marginBottom: '20px' }}>
              <div className="card" style={{ padding: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--tt)', margin: '0 0 4px' }}>Outstanding Balance</p>
                <p style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--tp)' }}>
                  ₱{selectedPriority.outstanding_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="card" style={{ padding: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--tt)', margin: '0 0 8px' }}>Suggested Priority</p>
                <StatusBadge status={priorityToStatus(selectedPriority.priority_level)} />
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setSelectedPriority(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Evaluation Modal */}
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
                        <option value="Rejected">Reject Priority Assignment</option>
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
                      onClick={handleSubmitRecReview}
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
