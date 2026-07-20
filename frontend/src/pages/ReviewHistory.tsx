import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AiHeader } from '../components/AiHeader';
import { TableSkeleton } from '../components/Skeletons';
import { Toast } from '../components/Toast';
import { History, Shield, Calendar, AlertOctagon, Search, RefreshCw, FileText } from 'lucide-react';

export const ReviewHistory: React.FC = () => {
  const { token, user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/review-history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        setCurrentPage(1);
      } else {
        setError("Failed to retrieve audit trail.");
      }
    } catch (e) {
      setError("Service connection offline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const getTargetBadgeColor = (type: string) => {
    return type === 'DUPLICATE_ALERT' 
      ? 'rgba(201, 75, 75, 0.15)' 
      : 'rgba(53, 120, 168, 0.15)';
  };

  const getDecisionBadgeClass = (dec: string) => {
    switch (dec) {
      case 'Reviewed':
      case 'Accepted as Recommendation':
        return 'badge-reviewed';
      case 'Dismissed':
        return 'badge-dismissed';
      case 'Rejected':
        return 'badge-rejected';
      default:
        return 'badge-dismissed';
    }
  };

  // Search filter
  const filteredHistory = history.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.reviewer_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reviewer_role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.remarks && item.remarks.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.target_id.toString().includes(searchQuery);

    const matchesType = targetTypeFilter === '' || item.target_type === targetTypeFilter;

    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const displayedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="main-content fade-in">
      <AiHeader title="AI Review Audit History" />
      
      <div className="page-container">
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid var(--border-soft)', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Review History</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Read-only ledger containing all human decisions logged on AI recommendations.
            </p>
          </div>
          <button onClick={fetchHistory} className="btn btn-secondary">
            <RefreshCw size={14} />
            <span>Refresh Log</span>
          </button>
        </div>

        {/* Immutable Audit Trail Advisory Notice */}
        <div className="advisory-banner" style={{ backgroundColor: 'var(--success-bg)', borderColor: 'rgba(46, 139, 87, 0.25)', color: 'var(--text-primary)' }}>
          <Shield size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', display: 'block', marginBottom: '4px', color: 'var(--success)', letterSpacing: '0.05em' }}>
              Immutable Compliance Ledger
            </span>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              In compliance with internal and external audit requirements, all logged decisions and human comments stored inside this ledger are write-locked and cannot be edited or deleted by ordinary finance personnel.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="filter-bar">
          <div className="filter-item" style={{ flex: 2, minWidth: '220px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search audit trail by reviewer, comments or target ID..."
                style={{ paddingLeft: '36px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-item">
            <select 
              className="input-select" 
              value={targetTypeFilter} 
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              aria-label="Filter by Target Type"
            >
              <option value="">All Targets</option>
              <option value="DUPLICATE_ALERT">Duplicate Alerts</option>
              <option value="COLLECTION_RECOMMENDATION">Collection Priority</option>
            </select>
          </div>
        </div>

        {/* Table card */}
        <div className="table-card">
          <div className="table-header">
            <h3 className="table-title">Historical Action Logs</h3>
            {["Accountant", "Assistant of Financial Manager"].includes(user?.role || '') ? (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                Showing last 50 audit records (Role limitation)
              </span>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                Showing {filteredHistory.length} audit logs
              </span>
            )}
          </div>

          {loading ? (
            <TableSkeleton columns={7} rows={6} />
          ) : error ? (
            <div className="state-container" style={{ padding: '60px 20px' }}>
              <AlertOctagon size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
              <p className="state-title">Audit Log Unavailable</p>
              <p className="state-desc">{error}</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="state-container" style={{ padding: '60px 20px' }}>
              <History size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <p className="state-title">No Audit Logs Found</p>
              <p className="state-desc">No human review actions match the selected filter conditions.</p>
            </div>
          ) : (
            <>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Review Date</th>
                      <th>Target Type</th>
                      <th>Target ID</th>
                      <th>Reviewer</th>
                      <th>Role</th>
                      <th>Decision</th>
                      <th>Investigation Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedHistory.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                            <span>{new Date(item.review_date).toLocaleString()}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge" style={{
                            backgroundColor: getTargetBadgeColor(item.target_type),
                            color: item.target_type === 'DUPLICATE_ALERT' ? 'var(--danger)' : 'var(--info)',
                            border: `1px solid ${item.target_type === 'DUPLICATE_ALERT' ? 'rgba(201, 75, 75, 0.15)' : 'rgba(53, 120, 168, 0.15)'}`
                          }}>
                            {item.target_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td>#{item.target_id}</td>
                        <td><code>{item.reviewer_username}</code></td>
                        <td>{item.reviewer_role}</td>
                        <td>
                          <span className={`badge ${getDecisionBadgeClass(item.decision)}`}>
                            {item.decision}
                          </span>
                        </td>
                        <td style={{ minWidth: '220px', maxWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '13px' }}>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.remarks}</div>
                          {item.recommended_action && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FileText size={12} />
                              <span>Follow-up action: {item.recommended_action}</span>
                            </div>
                          )}
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
      
      {toastMessage && (
        <div className="toast-container">
          <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        </div>
      )}
    </div>
  );
};
