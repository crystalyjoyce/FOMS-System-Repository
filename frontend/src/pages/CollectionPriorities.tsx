import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AiHeader } from '../components/AiHeader';
import { DecisionSupportNotice } from '../components/DecisionSupportNotice';
import { TableSkeleton } from '../components/Skeletons';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { 
  Eye, CheckCircle2, AlertOctagon, Search, RefreshCw, Sparkles 
} from 'lucide-react';
import { normalizeInvoiceNumber } from '../utils/referenceNormalizer';

export const CollectionPriorities: React.FC = () => {
  const { token } = useAuth();
  const [priorities, setPriorities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchPriorities = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/ai/collection-priorities`;
      if (priorityFilter) {
        url += `?priority=${priorityFilter}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPriorities(data);
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
    fetchPriorities();
  }, [token, priorityFilter]);

  const handleOpenDetail = async (id: number) => {
    try {
      const res = await fetch(`/api/ai/collection-priorities/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedItem(data);
      } else {
        setToastMessage("Failed to load priority detail.");
      }
    } catch (e) {
      setToastMessage("Connection error.");
    }
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
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

  // Filtered & Paginated records
  const filteredItems = priorities.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.client_id.toString().includes(searchQuery);
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const displayedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="main-content fade-in">
      <AiHeader title="Collection Aging Priorities" />
      
      <div className="page-container">
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid var(--border-soft)', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Collection Priorities</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Review prioritized client accounts flagged by aging parameters for potential collections follow-up.
            </p>
          </div>
          <button onClick={fetchPriorities} className="btn btn-secondary">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Decision Support Advisory */}
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
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filter by suggested priority"
            >
              <option value="">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Priorities Table */}
        <div className="table-card">
          <div className="table-header">
            <h3 className="table-title">Aging Priority Queue</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {filteredItems.length} accounts listed
            </span>
          </div>

          {loading ? (
            <TableSkeleton columns={7} rows={6} />
          ) : error ? (
            <div className="state-container">
              <AlertOctagon size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
              <p className="state-title">Calculation Error</p>
              <p className="state-desc">{error}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="state-container">
              <CheckCircle2 size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
              <p className="state-title">Queue Clear</p>
              <p className="state-desc">No accounts require prioritized follow-up under current criteria.</p>
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
                      <th>Suggested Priority</th>
                      <th>Action Basis</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.normalized_invoice_number || normalizeInvoiceNumber(item.invoice_number)}
                          </span>
                        </td>
                        <td>{item.client_name} (ID: {item.client_id})</td>
                        <td>
                          <span style={{ fontWeight: 600 }}>
                            PHP {item.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td>{new Date(item.due_date).toLocaleDateString()}</td>
                        <td>
                          <span className={`priority-badge ${getPriorityBadgeClass(item.priority_level)}`}>
                            {item.priority_level}
                          </span>
                        </td>
                        <td>
                          <div style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {item.supporting_basis || 'Overdue balances'}
                          </div>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleOpenDetail(item.id)}
                            className="btn btn-secondary"
                            style={{ padding: '0 12px', height: '32px', fontSize: '13px' }}
                          >
                            <Eye size={14} />
                            <span>Details</span>
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

      {/* Priority Details Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={handleCloseDetail}
          title={`Priority Details: ${selectedItem.normalized_invoice_number || normalizeInvoiceNumber(selectedItem.invoice_number)}`}
          footerButtons={
            <button onClick={handleCloseDetail} className="btn btn-secondary">
              Close
            </button>
          }
        >
          <div style={{ marginBottom: '20px' }}>
            <span className="comparison-label" style={{ fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Official FOMS Data
            </span>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              {selectedItem.client_name} (Client ID: {selectedItem.client_id})
            </h3>
          </div>

          <div className="comparison-grid" style={{ marginBottom: '20px' }}>
            <div style={{ backgroundColor: 'var(--surface-soft)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-soft)' }}>
              <span className="comparison-label" style={{ fontSize: '12px' }}>Outstanding Balance</span>
              <p style={{ fontSize: '16px', fontWeight: 700, margin: '4px 0 0 0', color: 'var(--text-primary)' }}>
                PHP {selectedItem.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div style={{ backgroundColor: 'var(--surface-soft)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-soft)' }}>
              <span className="comparison-label" style={{ fontSize: '12px' }}>Suggested priority</span>
              <p style={{ margin: '4px 0 0 0' }}>
                <span className={`priority-badge ${getPriorityBadgeClass(selectedItem.priority_level)}`}>
                  {selectedItem.priority_level}
                </span>
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '20px', borderTop: '1px solid var(--border-soft)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} style={{ color: 'var(--primary)' }} />
              AI Priority Explanation
            </h4>
            <div style={{ backgroundColor: 'var(--primary-light)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(0, 140, 149, 0.12)' }}>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                {selectedItem.supporting_basis || 'Account exhibits signs of aging. Follow-up recommended based on outstanding invoices.'}
              </p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0 }}>
              Official record details are synced directly from legacy SQL servers. All changes to credit balances must be performed within standard FOMS interfaces.
            </p>
          </div>
        </Modal>
      )}

      {toastMessage && (
        <div className="toast-container">
          <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        </div>
      )}
    </div>
  );
};
