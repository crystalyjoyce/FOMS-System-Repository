import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AiHeader } from '../components/AiHeader';
import { DecisionSupportNotice } from '../components/DecisionSupportNotice';
import { TableSkeleton } from '../components/Skeletons';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { 
  AlertOctagon, Eye, Check, ShieldAlert, Search, RefreshCw, SlidersHorizontal 
} from 'lucide-react';

export const DuplicateAlerts: React.FC = () => {
  const { token, user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Pagination
  const [statusFilter, setStatusFilter] = useState('Pending Review');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [minSimilarity, setMinSimilarity] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Review Modal State
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [decision, setDecision] = useState('Reviewed');
  const [remarks, setRemarks] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('ProceedWithManualValidation');
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/ai/duplicates?status=${statusFilter}`;
      if (typeFilter) {
        url += `&alert_type=${typeFilter}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
        setCurrentPage(1); // Reset page on filter change
      } else {
        setError("Failed to load duplicate alerts from server.");
      }
    } catch (e) {
      setError("Service connection offline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [token, statusFilter, typeFilter]);

  const handleOpenReview = async (alertId: number) => {
    try {
      const res = await fetch(`/api/ai/duplicates/${alertId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const detail = await res.json();
        setSelectedAlert(detail);
        setDecision('Reviewed');
        setRemarks('');
        setRecommendedAction('ProceedWithManualValidation');
      }
    } catch (e) {
      setToastMessage("Error loading alert comparison details.");
      setToastType("error");
    }
  };

  const handleCloseReview = () => {
    setSelectedAlert(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedAlert) return;
    if (!remarks.trim()) {
      setToastMessage("Remarks and audit notes are required for review.");
      setToastType("error");
      return;
    }
    setModalLoading(true);
    try {
      const res = await fetch(`/api/ai/duplicates/${selectedAlert.id}/review`, {
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
        setToastMessage(`Duplicate Alert #${selectedAlert.id} reviewed successfully!`);
        setToastType("success");
        fetchAlerts();
      } else {
        setToastMessage("Failed to submit review decision.");
        setToastType("error");
      }
    } catch (e) {
      setToastMessage("Connection issue. Review not submitted.");
      setToastType("error");
    } finally {
      setModalLoading(false);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('Pending Review');
    setTypeFilter('');
    setSearchQuery('');
    setMinSimilarity(0);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending Review': return 'badge-pending';
      case 'Reviewed': return 'badge-reviewed';
      case 'Dismissed': return 'badge-dismissed';
      default: return 'badge-dismissed';
    }
  };

  const canSubmitReviews = user?.role && ["Financial Manager", "Head Accountant", "Accountant"].includes(user.role);

  // Filtered & Paginated records
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = searchQuery === '' || 
      alert.id.toString().includes(searchQuery) ||
      (alert.matched_field && alert.matched_field.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (alert.alert_type && alert.alert_type.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSimilarity = alert.similarity_score >= minSimilarity;
    
    return matchesSearch && matchesSimilarity;
  });

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const displayedAlerts = filteredAlerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="main-content fade-in">
      <AiHeader title="Duplicate Check Alerts" />
      
      <div className="page-container">
        
        {/* Page Header Pattern */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid var(--border-soft)', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Duplicate Alerts</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Review possible duplicate finance records detected by the AI Layer.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={fetchAlerts} className="btn btn-secondary">
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Decision Support Advisory Notice */}
        <DecisionSupportNotice />

        {/* Filter Bar Pattern */}
        <div className="filter-bar" style={{ marginBottom: '20px' }}>
          <div className="filter-item" style={{ flex: 2, minWidth: '220px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search alerts by ID or matched key..."
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
              aria-label="Filter by Status"
            >
              <option value="Pending Review">Pending Review</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Dismissed">Dismissed</option>
              <option value="">All Statuses</option>
            </select>
          </div>

          <div className="filter-item">
            <select 
              className="input-select" 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by Type"
            >
              <option value="">All Types</option>
              <option value="WAYBILL">Waybills</option>
              <option value="INVOICE">Invoices</option>
              <option value="OFFICIAL_RECEIPT">Receipts (OR)</option>
              <option value="SPEEDPAY_REFERENCE">SpeedPay Refs</option>
            </select>
          </div>

          <div className="filter-item">
            <select
              className="input-select"
              value={minSimilarity}
              onChange={(e) => setMinSimilarity(Number(e.target.value))}
              aria-label="Filter by Similarity Score"
            >
              <option value="0">Min Confidence</option>
              <option value="50">&gt; 50% Similarity</option>
              <option value="80">&gt; 80% Similarity</option>
              <option value="95">&gt; 95% Similarity</option>
              <option value="98">&gt; 98% Similarity</option>
            </select>
          </div>

          <button onClick={handleResetFilters} className="btn btn-secondary" style={{ height: '40px' }}>
            <SlidersHorizontal size={14} />
            <span>Reset</span>
          </button>
        </div>

        {/* Registry Table */}
        <div className="table-card">
          <div className="table-header">
            <h3 className="table-title">Suspected Duplicates Registry</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Showing {filteredAlerts.length} alert records
            </span>
          </div>

          {loading ? (
            <TableSkeleton columns={7} rows={6} />
          ) : error ? (
            <div className="state-container" style={{ padding: '60px 20px' }}>
              <AlertOctagon size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
              <p className="state-title">Error Loading Alerts</p>
              <p className="state-desc">{error}</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="state-container" style={{ padding: '60px 20px' }}>
              <Check size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
              <p className="state-title">No Duplicate Suspects Found</p>
              <p className="state-desc">No evaluated records trigger duplicate alert conditions with the selected filters.</p>
            </div>
          ) : (
            <>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Alert ID</th>
                      <th>Alert Type</th>
                      <th>Matched Field</th>
                      <th className="num">Similarity</th>
                      <th>Date Flagged</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedAlerts.map((alert) => (
                      <tr key={alert.id}>
                        <td>#{alert.id}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{alert.alert_type}</span>
                        </td>
                        <td><code>{alert.matched_field}</code></td>
                        <td className="num">
                          <span style={{ 
                            color: alert.similarity_score >= 98 ? 'var(--danger)' : 'var(--warning)',
                            fontWeight: 700 
                          }}>
                            {alert.similarity_score}%
                          </span>
                        </td>
                        <td>{new Date(alert.date_generated).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(alert.review_status)}`}>
                            {alert.review_status}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleOpenReview(alert.id)}
                            className="btn btn-secondary"
                            style={{ padding: '0 12px', height: '32px', fontSize: '13px' }}
                          >
                            <Eye size={14} />
                            <span>Compare</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <div>
                    Showing page {currentPage} of {totalPages} ({filteredAlerts.length} items)
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

      {/* Review & Comparison Modal */}
      {selectedAlert && (
        <Modal
          isOpen={!!selectedAlert}
          onClose={handleCloseReview}
          title={`Duplicate Record Comparison (Alert #${selectedAlert.id})`}
          footerButtons={
            <>
              <button onClick={handleCloseReview} className="btn btn-secondary">
                Close
              </button>
              {canSubmitReviews && selectedAlert.review_status === 'Pending Review' && (
                <button 
                  onClick={handleSubmitReview}
                  disabled={modalLoading || !remarks.trim()} 
                  className="btn btn-primary"
                >
                  {modalLoading ? 'Saving...' : 'Submit Review'}
                </button>
              )}
            </>
          }
        >
          <div className="advisory-banner warning" style={{ marginBottom: '16px' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '13px' }}>Matching Factors Confidence: {selectedAlert.similarity_score}%</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedAlert.reason}</p>
            </div>
          </div>

          <div className="comparison-grid" style={{ marginBottom: '20px' }}>
            {/* Source Record Details */}
            <div className="comparison-card">
              <h4>Original Record details</h4>
              {selectedAlert.matches?.[0]?.source_details ? (
                Object.entries(selectedAlert.matches[0].source_details).map(([k, v]: any) => (
                  <div className="comparison-row" key={k}>
                    <span className="comparison-label">{k.replace(/_/g, ' ')}</span>
                    <span className="comparison-value highlight">{String(v)}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No original details found.</p>
              )}
            </div>

            {/* Match Record Details */}
            <div className="comparison-card">
              <h4>Possible Matching record</h4>
              {selectedAlert.matches?.[0]?.match_details ? (
                Object.entries(selectedAlert.matches[0].match_details).map(([k, v]: any) => (
                  <div className="comparison-row" key={k}>
                    <span className="comparison-label">{k.replace(/_/g, ' ')}</span>
                    <span className="comparison-value highlight">{String(v)}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No match details found.</p>
              )}
            </div>
          </div>

          {/* Action Form */}
          {canSubmitReviews && selectedAlert.review_status === 'Pending Review' ? (
            <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
                Log Human Validation Action
              </h4>
              
              <div className="grid-2">
                <div className="form-group">
                  <label htmlFor="review-decision">Review Decision</label>
                  <select 
                    id="review-decision"
                    className="input-select" 
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                  >
                    <option value="Reviewed">Reviewed & Confirmed Duplicate</option>
                    <option value="Dismissed">Dismiss & Mark Safe</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="recommended-action">Recommended Legacy Action</label>
                  <select 
                    id="recommended-action"
                    className="input-select" 
                    value={recommendedAction}
                    onChange={(e) => setRecommendedAction(e.target.value)}
                  >
                    <option value="ProceedWithManualValidation">Require manual verification in FOMS</option>
                    <option value="CancelDuplicateSubmission">Request cancellation of transaction</option>
                    <option value="DismissAlert">Dismiss alert (safe to ignore)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="remarks">Remarks / Audit Notes <span className="required">*</span></label>
                <textarea 
                  id="remarks"
                  className="textarea-field"
                  placeholder="Explain matches or safety checks (required for auditor compliance logs)..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  required
                />
              </div>
              
              <div className="advisory-banner" style={{ marginTop: '16px', backgroundColor: 'var(--surface-soft)', borderColor: 'var(--border)' }}>
                <ShieldAlert size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  Note: Submitting this review records your validation inside the AI audit service database. It does not directly modify transaction data in the legacy FOMS MSSQL tables.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              {selectedAlert.review_status !== 'Pending Review' ? (
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--success)' }}>
                  ✓ This duplicate alert has been finalized by an authorized user with status: <strong>{selectedAlert.review_status}</strong>.
                </p>
              ) : (
                <p style={{ margin: 0, color: 'var(--danger)' }}>
                  ⚠ Your authenticated role ({user?.role}) does not have permissions to submit human reviews for duplicates.
                </p>
              )}
            </div>
          )}
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
