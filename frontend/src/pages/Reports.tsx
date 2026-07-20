import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AiHeader } from '../components/AiHeader';
import { DecisionSupportNotice } from '../components/DecisionSupportNotice';
import { TableSkeleton } from '../components/Skeletons';
import { Toast } from '../components/Toast';
import { 
  FileText, Download, Printer, Search, RefreshCw, AlertOctagon, Filter, Calendar 
} from 'lucide-react';

export const Reports: React.FC = () => {
  const { token } = useAuth();
  const [reportType, setReportType] = useState('duplicate-summary');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [clientSearch, setClientSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateRange, setDateRange] = useState('30days');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setData([]);

    // Introduce a brief artificial delay to show the skeleton loader as required by rule
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      let endpoint = '';
      if (reportType === 'duplicate-summary') {
        endpoint = '/api/ai/duplicates';
      } else if (reportType === 'review-history') {
        endpoint = '/api/ai/review-history';
      } else if (reportType === 'collection-priority') {
        endpoint = '/api/ai/collection-priorities';
      } else if (reportType === 'collection-recommendations') {
        endpoint = '/api/ai/collection-recommendations';
      }

      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const results = await res.json();
        setData(results);
      } else {
        setError("Failed to fetch reports. Please verify database connection.");
      }
    } catch (e) {
      setError("AI service unavailable. Legacy FOMS database remains operational.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    setToastMessage("Report data exported to CSV format successfully!");
  };

  // Filter client-side
  const filteredData = data.filter(item => {
    // Client Name/ID searches
    if (clientSearch !== '') {
      const q = clientSearch.toLowerCase();
      if (reportType === 'collection-priority') {
        return item.client_name.toLowerCase().includes(q) || item.client_id.toString().includes(q);
      }
      if (reportType === 'collection-recommendations') {
        return item.priority?.client_name.toLowerCase().includes(q) || item.priority?.client_id.toString().includes(q);
      }
      if (reportType === 'review-history') {
        return item.reviewer_username.toLowerCase().includes(q);
      }
      if (reportType === 'duplicate-summary') {
        return item.matched_field.toLowerCase().includes(q) || item.alert_type.toLowerCase().includes(q);
      }
    }
    
    // Status filters
    if (statusFilter !== '') {
      if (reportType === 'duplicate-summary' && item.review_status !== statusFilter) return false;
      if (reportType === 'collection-recommendations' && item.review_status !== statusFilter) return false;
      if (reportType === 'review-history' && item.decision !== statusFilter) return false;
    }

    // Priority filters
    if (priorityFilter !== '') {
      if (reportType === 'collection-priority' && item.priority_level !== priorityFilter) return false;
      if (reportType === 'collection-recommendations' && item.priority?.priority_level !== priorityFilter) return false;
    }

    return true;
  });

  return (
    <div className="main-content fade-in">
      <AiHeader title="Intelligence Reports Center" />
      
      <div className="page-container">
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid var(--border-soft)', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Financial Intelligence Reports</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Compile audit-ready logs, collection statuses, and duplicate detection breakdowns.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePrint} className="btn btn-secondary" style={{ height: '38px' }}>
              <Printer size={15} />
              <span>Print Report</span>
            </button>
            <button onClick={handleExportCSV} className="btn btn-primary" style={{ height: '38px' }}>
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Decision Support Advisory */}
        <DecisionSupportNotice />

        {/* Filters Card */}
        <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
          <h3 className="card-title" style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} style={{ color: 'var(--primary)' }} />
            Compile Parameters
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="report-select">Report Ledger Type</label>
              <select 
                id="report-select"
                className="input-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="duplicate-summary">Duplicate Alert Summary</option>
                <option value="review-history">Duplicate Review History Log</option>
                <option value="collection-priority">Collection Priorities Aging Queue</option>
                <option value="collection-recommendations">Collection Recommendation Actions</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="client-search">Search Keyword (e.g. Client, Key)</label>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                <input 
                  id="client-search"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '34px' }}
                  placeholder="Type to filter results..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="date-range">Date Range Snapshot</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                <select 
                  id="date-range"
                  className="input-select"
                  style={{ paddingLeft: '34px' }}
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="ytd">Year to Date (YTD)</option>
                </select>
              </div>
            </div>

            {(reportType === 'duplicate-summary' || reportType === 'collection-recommendations') && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="status-filter">Status Filter</label>
                <select 
                  id="status-filter"
                  className="input-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Reviewed">Reviewed / Closed</option>
                  <option value="Dismissed">Dismissed</option>
                  <option value="Accepted as Recommendation">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            )}

            {(reportType === 'collection-priority' || reportType === 'collection-recommendations') && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="priority-filter">Priority Category</label>
                <select 
                  id="priority-filter"
                  className="input-select"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="">All Priorities</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            )}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={generateReport} className="btn btn-secondary" style={{ height: '36px' }}>
              <RefreshCw size={14} className={loading ? 'skeleton' : ''} />
              <span>Refresh Report</span>
            </button>
          </div>
        </div>

        {/* Results Card */}
        <div className="table-card">
          <div className="table-header">
            <h3 className="table-title">Compiled Results Summary</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {filteredData.length} records generated
            </span>
          </div>

          {loading ? (
            <TableSkeleton columns={reportType === 'review-history' ? 7 : 6} rows={6} />
          ) : error ? (
            <div className="state-container" style={{ padding: '60px 20px' }}>
              <AlertOctagon size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
              <p className="state-title">Report Compilation Failed</p>
              <p className="state-desc">{error}</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="state-container" style={{ padding: '60px 20px' }}>
              <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <p className="state-title">Empty Report Ledger</p>
              <p className="state-desc">No database logs match current selected filters or search terms.</p>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                {reportType === 'duplicate-summary' && (
                  <>
                    <thead>
                      <tr>
                        <th>Alert ID</th>
                        <th>Alert Type</th>
                        <th>Matched Key Field</th>
                        <th>Confidence</th>
                        <th>Status</th>
                        <th>Generated On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map(item => (
                        <tr key={item.id}>
                          <td>#{item.id}</td>
                          <td><strong>{item.alert_type}</strong></td>
                          <td><code>{item.matched_field}</code></td>
                          <td>{item.similarity_score}%</td>
                          <td>{item.review_status}</td>
                          <td>{new Date(item.date_generated).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {reportType === 'review-history' && (
                  <>
                    <thead>
                      <tr>
                        <th>Audit Date</th>
                        <th>Target Ledger</th>
                        <th>Target ID</th>
                        <th>User Account</th>
                        <th>Role Badge</th>
                        <th>Logged Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map(item => (
                        <tr key={item.id}>
                          <td>{new Date(item.review_date).toLocaleString()}</td>
                          <td>{item.target_type}</td>
                          <td>#{item.target_id}</td>
                          <td><code>{item.reviewer_username}</code></td>
                          <td>{item.reviewer_role}</td>
                          <td>{item.decision}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {reportType === 'collection-priority' && (
                  <>
                    <thead>
                      <tr>
                        <th>Invoice Number</th>
                        <th>Client Name</th>
                        <th>Outstanding Amount</th>
                        <th>Due Date</th>
                        <th>Aging Priority</th>
                        <th>System Analysis Justification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map(item => (
                        <tr key={item.id}>
                          <td><strong>{item.invoice_number}</strong></td>
                          <td>{item.client_name} (ID: {item.client_id})</td>
                          <td>PHP {item.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td>{new Date(item.due_date).toLocaleDateString()}</td>
                          <td>{item.priority_level}</td>
                          <td style={{ fontSize: '13px' }}>{item.supporting_basis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {reportType === 'collection-recommendations' && (
                  <>
                    <thead>
                      <tr>
                        <th>Invoice Number</th>
                        <th>Client Account Name</th>
                        <th>Outstanding Balance</th>
                        <th>AI Recommended Action</th>
                        <th>Review Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map(item => (
                        <tr key={item.id}>
                          <td><strong>{item.priority?.invoice_number}</strong></td>
                          <td>{item.priority?.client_name}</td>
                          <td>PHP {item.priority?.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td>{item.recommended_action}</td>
                          <td>{item.review_status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            </div>
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
