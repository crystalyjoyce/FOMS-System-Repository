import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AiHeader } from '../components/AiHeader';
import { DecisionSupportNotice } from '../components/DecisionSupportNotice';
import { TableSkeleton } from '../components/Skeletons';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { 
  CheckCircle, FileText, AlertOctagon, Search, RefreshCw, Sparkles, AlertCircle 
} from 'lucide-react';
import { normalizeInvoiceNumber } from '../utils/referenceNormalizer';

export const CollectionRecommendations: React.FC = () => {
  const { token, user } = useAuth();
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('Pending Review');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Human Review Modal State
  const [selectedRec, setSelectedRec] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [decision, setDecision] = useState('Accepted as Recommendation');
  const [remarks, setRemarks] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/ai/collection-recommendations?status=${statusFilter}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        let data = await res.json();
        if (priorityFilter) {
          data = data.filter((r: any) => r.priority?.priority_level === priorityFilter);
        }
        setRecs(data);
        setCurrentPage(1);
      } else {
        setError("Failed to fetch collection priorities.");
      }
    } catch (e) {
      setError("Service connection offline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [token, statusFilter, priorityFilter]);

  const handleOpenReview = (rec: any) => {
    setSelectedRec(rec);
    setDecision('Accepted as Recommendation');
    setRemarks('');
    setRecommendedAction(rec.recommended_action || '');
  };

  const handleCloseReview = () => {
    setSelectedRec(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedRec) return;
    if (!remarks.trim()) {
      setToastMessage("Investigation notes/remarks are required for review.");
      setToastType("error");
      return;
    }
    setModalLoading(true);
    try {
      const res = await fetch(`/api/ai/collection-recommendations/${selectedRec.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          decision,
          remarks,
          recommendedAction
        })
      });
      if (res.ok) {
        handleCloseReview();
        setToastMessage(`Logged review action on Recommendation #${selectedRec.id}`);
        setToastType("success");
        fetchRecommendations();
      } else {
        setToastMessage("Failed to submit review.");
        setToastType("error");
      }
    } catch (e) {
      setToastMessage("Connection issue. Action failed.");
      setToastType("error");
    } finally {
      setModalLoading(false);
    }
  };

  const getPriorityBadgeClass = (lvl: string) => {
    switch (lvl?.toLowerCase()) {
      case 'urgent': return 'urgent';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'low';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending Review': return 'badge-pending';
      case 'Reviewed':
      case 'Accepted as Recommendation':
        return 'badge-accepted';
      case 'Rejected':
        return 'badge-rejected';
      default:
        return 'badge-dismissed';
    }
  };

  const canSubmitReviews = user?.role && ["Financial Manager", "Head Accountant", "Accountant"].includes(user.role);

  // Search filter
  const filteredRecs = recs.filter(rec => {
    const p = rec.priority;
    if (!p) return true;
    return searchQuery === '' || 
      p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client_id.toString().includes(searchQuery);
  });

  const totalPages = Math.ceil(filteredRecs.length / itemsPerPage);
  const displayedRecs = filteredRecs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="main-content fade-in">
      <AiHeader title="AI Collection Recommendations" />
      
      <div className="page-container">
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid var(--border-soft)', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Collection Recommendations</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Review AI-generated collection action plans, priority justifications, and log validation decisions.
            </p>
          </div>
          <button onClick={fetchRecommendations} className="btn btn-secondary">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Decision Support Banner */}
        <DecisionSupportNotice />

        {/* Filters */}
        <div className="filter-bar">
          <div className="filter-item" style={{ flex: 2, minWidth: '220px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search by client name, client ID or invoice..."
                style={{ paddingLeft: '36px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-item">
            <select 
              className="input-select" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by review status"
            >
              <option value="Pending Review">Pending Review</option>
              <option value="Reviewed">Reviewed & Closed</option>
              <option value="Accepted as Recommendation">Accepted Recommendations</option>
              <option value="Rejected">Rejected Recommendations</option>
              <option value="">All Statuses</option>
            </select>
          </div>

          <div className="filter-item">
            <select 
              className="input-select" 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filter by priority level"
            >
              <option value="">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Recommendations Table */}
        <div className="table-card">
          <div className="table-header">
            <h3 className="table-title">Action Queue</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {filteredRecs.length} actionable suggestions
            </span>
          </div>

          {loading ? (
            <TableSkeleton columns={8} rows={6} />
          ) : error ? (
            <div className="state-container">
              <AlertOctagon size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
              <p className="state-title">Calculation Error</p>
              <p className="state-desc">{error}</p>
            </div>
          ) : filteredRecs.length === 0 ? (
            <div className="state-container">
              <CheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
              <p className="state-title">No Recommendations Available</p>
              <p className="state-desc">No entries match the current status or filters.</p>
            </div>
          ) : (
            <>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice Number</th>
                      <th>Client Name</th>
                      <th>Outstanding Balance</th>
                      <th>Due Date</th>
                      <th>Urgency</th>
                      <th>Suggested Action</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRecs.map((rec) => (
                      <tr key={rec.id}>
                        <td>
                          <span style={{ fontWeight: 600 }}>
                            {rec.priority?.normalized_invoice_number || normalizeInvoiceNumber(rec.priority?.invoice_number)}
                          </span>
                        </td>
                        <td>{rec.priority?.client_name}</td>
                        <td>
                          <span style={{ fontWeight: 600 }}>
                            PHP {rec.priority?.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td>{new Date(rec.priority?.due_date).toLocaleDateString()}</td>
                        <td>
                          <span className={`priority-badge ${getPriorityBadgeClass(rec.priority?.priority_level)}`}>
                            {rec.priority?.priority_level}
                          </span>
                        </td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rec.recommended_action}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(rec.review_status)}`}>
                            {rec.review_status}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleOpenReview(rec)}
                            className="btn btn-secondary"
                            style={{ padding: '0 12px', height: '32px', fontSize: '13px' }}
                          >
                            <FileText size={14} />
                            <span>Evaluate</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <div>
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="pagination-buttons">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`pagination-btn ${currentPage === idx + 1 ? 'active' : ''}`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail & Review Modal */}
      {selectedRec && (
        <Modal
          isOpen={!!selectedRec}
          onClose={handleCloseReview}
          title={`Evaluate Collection Recommendation (Rec #${selectedRec.id})`}
          footerButtons={
            <>
              <button onClick={handleCloseReview} className="btn btn-secondary">
                Close
              </button>
              {canSubmitReviews && selectedRec.review_status === 'Pending Review' && (
                <button 
                  onClick={handleSubmitReview}
                  disabled={modalLoading || !remarks.trim()} 
                  className="btn btn-primary"
                >
                  {modalLoading ? 'Saving...' : 'Log Decision'}
                </button>
              )}
            </>
          }
        >
          {/* Section 1: Official FOMS Data */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
              Official FOMS Data
            </span>
            <div style={{ backgroundColor: 'var(--surface-soft)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Client Account</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedRec.priority?.client_name} (Client ID: {selectedRec.priority?.client_id})
              </div>
              <div className="comparison-grid" style={{ marginTop: '12px' }}>
                <div>
                  <span className="comparison-label">Invoice Number</span>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>
                    {selectedRec.priority?.normalized_invoice_number || normalizeInvoiceNumber(selectedRec.priority?.invoice_number)}
                  </div>
                </div>
                <div>
                  <span className="comparison-label">Outstanding Balance</span>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                    PHP {selectedRec.priority?.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: AI Recommendation */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
              AI Recommendation
            </span>
            <div style={{ backgroundColor: 'var(--surface-teal)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(0,140,149,0.15)' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '14px' }}>Suggested Action Plan</span>
              </div>
              
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', marginBottom: '12px' }}>
                {selectedRec.recommended_action}
              </div>

              {selectedRec.explanation_basis && selectedRec.explanation_basis.length > 0 && (
                <div>
                  <span className="comparison-label" style={{ fontSize: '12px', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                    Supporting Factors:
                  </span>
                  <ul className="basis-list" style={{ paddingLeft: '8px' }}>
                    {selectedRec.explanation_basis.map((reason: string, idx: number) => (
                      <li key={idx} className="basis-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        <span className="basis-icon" style={{ backgroundColor: 'var(--primary)', width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 }}></span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Finance Review */}
          <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '16px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
              Finance Review
            </span>

            {canSubmitReviews && selectedRec.review_status === 'Pending Review' ? (
              <div>
                <div className="grid-2">
                  <div className="form-group">
                    <label htmlFor="review-decision">Review Decision</label>
                    <select 
                      id="review-decision"
                      className="input-select" 
                      value={decision}
                      onChange={(e) => setDecision(e.target.value)}
                    >
                      <option value="Accepted as Recommendation">Accept Recommendation Basis</option>
                      <option value="Reviewed">Reviewed & Closed</option>
                      <option value="Rejected">Reject Priority Assignment</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="action-taken">Action Taken / Executed Action</label>
                    <input 
                      id="action-taken"
                      type="text"
                      className="form-control" 
                      value={recommendedAction}
                      onChange={(e) => setRecommendedAction(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="remarks">Remarks / Validation Notes <span className="required">*</span></label>
                  <textarea 
                    id="remarks"
                    className="textarea-field"
                    placeholder="Log details of the validation step (e.g. contact logs, account changes)..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    required
                  />
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                {selectedRec.review_status !== 'Pending Review' ? (
                  <div style={{ backgroundColor: 'var(--success-bg)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(46, 139, 87, 0.15)' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={16} /> Human review validation logged successfully.
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                      <strong>Validation Action:</strong> {selectedRec.review_status}
                    </p>
                  </div>
                ) : (
                  <p style={{ margin: 0, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={16} />
                    Your role is not authorized to submit validation reviews for collection priorities.
                  </p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <Toast 
            message={toastMessage} 
            type={toastType} 
            onClose={() => setToastMessage(null)} 
          />
        </div>
      )}
    </div>
  );
};
