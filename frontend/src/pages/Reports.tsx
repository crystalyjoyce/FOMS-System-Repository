import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AiHeader } from '../components/AiHeader';
import { DecisionSupportNotice } from '../components/DecisionSupportNotice';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/ToastContext';
import { normalizeInvoiceNumber } from '../utils/referenceNormalizer';
import { Printer, Download, Filter, Search, Calendar, RefreshCw, ShieldAlert, FileText } from 'lucide-react';
import { exportToFormalPDF } from '../utils/pdfExporter';

export const Reports: React.FC = () => {
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [reportType, setReportType] = useState('duplicate-summary');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [clientSearch, setClientSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateRange, setDateRange] = useState('30days');

  const generateReport = async () => {
    setLoading(true);
    setError(null);

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
        setData(results || []);
      } else {
        setError("Failed to fetch reports. Please verify database connection.");
      }
    } catch {
      setError("AI service unavailable. Legacy FOMS database remains operational.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType]);

  const handlePrint = () => {
    if (!filteredData || filteredData.length === 0) {
      toast.warning("No data available to print.", "Print Warning");
      return;
    }

    let title = "Duplicate Alert Summary Report";
    let columns: string[] = [];
    let rows: string[][] = [];

    if (reportType === 'duplicate-summary') {
      title = "Duplicate Alert Summary Report";
      columns = ['Alert ID', 'Alert Type', 'Matched Field', 'Confidence', 'Status', 'Date Generated'];
      rows = filteredData.map(r => [
        `#${r.id}`,
        r.alert_type || 'DUPLICATE',
        r.matched_field || 'N/A',
        `${r.similarity_score}%`,
        r.review_status || 'Pending',
        r.date_generated ? new Date(r.date_generated).toLocaleDateString() : 'N/A'
      ]);
    } else if (reportType === 'review-history') {
      title = "Duplicate Review History Log";
      columns = ['Audit Date', 'Target Ledger', 'Target ID', 'Reviewer', 'Role', 'Decision'];
      rows = filteredData.map(r => [
        r.review_date ? new Date(r.review_date).toLocaleString() : 'N/A',
        r.target_type || 'N/A',
        `#${r.target_id}`,
        r.reviewer_username || 'N/A',
        r.reviewer_role || 'N/A',
        r.decision || 'N/A'
      ]);
    } else if (reportType === 'collection-priority') {
      title = "Collection Priorities Aging Queue";
      columns = ['Invoice Number', 'Client Name', 'Balance', 'Due Date', 'Priority', 'Justification'];
      rows = filteredData.map(r => [
        normalizeInvoiceNumber(r.invoice_number),
        `${r.client_name || ''} (ID: ${r.client_id || ''})`,
        r.outstanding_balance ? `P${r.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'P0.00',
        r.due_date ? new Date(r.due_date).toLocaleDateString() : 'N/A',
        r.priority_level || 'Normal',
        r.supporting_basis || 'Overdue'
      ]);
    } else {
      title = "Collection Recommendation Actions";
      columns = ['Invoice Number', 'Client Name', 'Balance', 'Recommended Action', 'Status'];
      rows = filteredData.map(r => [
        normalizeInvoiceNumber(r.priority?.invoice_number || r.invoice_number),
        r.priority?.client_name || r.client_name || 'N/A',
        r.priority?.outstanding_balance ? `P${r.priority.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'P0.00',
        r.recommended_action || 'N/A',
        r.review_status || 'Pending'
      ]);
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Pop-up blocked. Please allow pop-ups to print the formal report.", "Print Error");
      return;
    }

    const now = new Date().toLocaleString();
    const currentUser = user?.username || 'Authorized User';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - Speedex FOMS</title>
          <style>
            @page { size: A4 landscape; margin: 15mm; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0F172A; margin: 0; padding: 20px; font-size: 12px; }
            .header-bar { border-bottom: 3px solid #00A99D; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .company-name { font-size: 16px; font-weight: 800; color: #0F172A; letter-spacing: 0.04em; margin: 0 0 4px; }
            .doc-subtitle { font-size: 10px; font-weight: 700; color: #00A99D; text-transform: uppercase; letter-spacing: 0.08em; margin: 0; }
            .meta-info { font-size: 10px; color: #64748B; text-align: right; line-height: 1.4; }
            .report-title { font-size: 18px; font-weight: 700; color: #0F172A; margin: 0 0 14px; text-transform: uppercase; }
            .params-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 14px; margin-bottom: 18px; font-size: 11px; color: #334155; }
            .formal-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .formal-table th { background: #00A99D; color: #FFFFFF; font-size: 10.5px; font-weight: 700; text-transform: uppercase; padding: 10px 12px; text-align: left; border: 1px solid #009389; }
            .formal-table td { padding: 9px 12px; font-size: 11px; border: 1px solid #E2E8F0; color: #334155; }
            .formal-table tr:nth-child(even) { background: #F8FAFC; }
            .sign-off { margin-top: 40px; display: flex; justify-content: space-between; padding-top: 20px; }
            .sign-line { width: 220px; border-top: 1px solid #94A3B8; text-align: center; padding-top: 6px; font-size: 10px; color: #475569; font-weight: 600; }
            .footer-disclaimer { margin-top: 50px; border-top: 1px solid #E2E8F0; padding-top: 10px; font-size: 9px; color: #94A3B8; text-align: center; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div>
              <h1 class="company-name">SPEEDEX LOGISTICS &bull; FOMS AI LAYER</h1>
              <p class="doc-subtitle">Official Audit & Financial Intelligence Report</p>
            </div>
            <div class="meta-info">
              <div>Date Generated: <strong>${now}</strong></div>
              <div>Compiled By: <strong>${currentUser}</strong></div>
              <div>Environment: <strong>FOMS Production AI Engine</strong></div>
            </div>
          </div>

          <h2 class="report-title">${title}</h2>

          <table class="formal-table">
            <thead>
              <tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map(r => `<tr>${r.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </tbody>
          </table>

          <div class="sign-off">
            <div class="sign-line">Prepared By (Financial Analyst / User)</div>
            <div class="sign-line">Approved By (Head Accountant / Finance Manager)</div>
          </div>

          <div class="footer-disclaimer">
            STRICTLY CONFIDENTIAL &mdash; OFFICIAL SPEEDEX LOGISTICS FINANCIAL AUDIT RECORD &mdash; FOR INTERNAL EXECUTIVE REVIEW ONLY
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExportCSV = () => {
    if (!filteredData || filteredData.length === 0) {
      toast.warning("No data available to export.", "Export Warning");
      return;
    }

    const keys = Object.keys(filteredData[0] || {}).filter(k => typeof filteredData[0][k] !== 'object');
    const csvRows = [
      keys.join(','),
      ...filteredData.map(row => keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}_report_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Report data exported to CSV format successfully!", "Export Success");
  };

  const handleExportPDF = () => {
    if (!filteredData || filteredData.length === 0) {
      toast.warning("No data available to export to PDF.", "Export Warning");
      return;
    }

    let title = "Duplicate Alert Summary";
    let subtitle = "Comprehensive summary of AI duplicate document detection alerts.";
    let pdfColumns: { header: string; dataKey: string }[] = [];
    let formattedRows: any[] = [];

    if (reportType === 'duplicate-summary') {
      title = "Duplicate Alert Summary Report";
      subtitle = "Audit log of potential duplicate document alerts flagged by AI.";
      pdfColumns = [
        { header: 'Alert ID', dataKey: 'alert_id' },
        { header: 'Alert Type', dataKey: 'alert_type' },
        { header: 'Matched Key Field', dataKey: 'matched_field' },
        { header: 'Confidence', dataKey: 'similarity_score' },
        { header: 'Review Status', dataKey: 'review_status' },
        { header: 'Generated On', dataKey: 'date_generated' }
      ];
      formattedRows = filteredData.map(r => ({
        alert_id: `#${r.id}`,
        alert_type: r.alert_type || 'DUPLICATE',
        matched_field: r.matched_field || 'N/A',
        similarity_score: `${r.similarity_score}%`,
        review_status: r.review_status || 'Pending',
        date_generated: r.date_generated ? new Date(r.date_generated).toLocaleDateString() : 'N/A'
      }));
    } else if (reportType === 'review-history') {
      title = "Duplicate Review History Log";
      subtitle = "Immutable audit ledger of human verification decisions on duplicate alerts.";
      pdfColumns = [
        { header: 'Audit Date', dataKey: 'review_date' },
        { header: 'Target Ledger', dataKey: 'target_type' },
        { header: 'Target ID', dataKey: 'target_id' },
        { header: 'User Account', dataKey: 'reviewer_username' },
        { header: 'Role', dataKey: 'reviewer_role' },
        { header: 'Logged Action', dataKey: 'decision' }
      ];
      formattedRows = filteredData.map(r => ({
        review_date: r.review_date ? new Date(r.review_date).toLocaleString() : 'N/A',
        target_type: r.target_type || 'N/A',
        target_id: `#${r.target_id}`,
        reviewer_username: r.reviewer_username || 'N/A',
        reviewer_role: r.reviewer_role || 'N/A',
        decision: r.decision || 'N/A'
      }));
    } else if (reportType === 'collection-priority') {
      title = "Collection Priorities Aging Queue";
      subtitle = "AI risk-scored priority queue for overdue accounts receivables.";
      pdfColumns = [
        { header: 'Invoice Number', dataKey: 'invoice_number' },
        { header: 'Client Name', dataKey: 'client_name' },
        { header: 'Outstanding Amount', dataKey: 'outstanding_balance' },
        { header: 'Due Date', dataKey: 'due_date' },
        { header: 'Aging Priority', dataKey: 'priority_level' },
        { header: 'Justification', dataKey: 'supporting_basis' }
      ];
      formattedRows = filteredData.map(r => ({
        invoice_number: normalizeInvoiceNumber(r.invoice_number),
        client_name: `${r.client_name || ''} (ID: ${r.client_id || ''})`,
        outstanding_balance: r.outstanding_balance ? `P${r.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'P0.00',
        due_date: r.due_date ? new Date(r.due_date).toLocaleDateString() : 'N/A',
        priority_level: r.priority_level || 'Normal',
        supporting_basis: r.supporting_basis || 'Overdue payment'
      }));
    } else {
      title = "Collection Recommendation Actions";
      subtitle = "Automated AI recovery recommendations and decision log.";
      pdfColumns = [
        { header: 'Invoice Number', dataKey: 'invoice_number' },
        { header: 'Client Account Name', dataKey: 'client_name' },
        { header: 'Outstanding Balance', dataKey: 'outstanding_balance' },
        { header: 'AI Recommended Action', dataKey: 'recommended_action' },
        { header: 'Review Status', dataKey: 'review_status' }
      ];
      formattedRows = filteredData.map(r => ({
        invoice_number: normalizeInvoiceNumber(r.priority?.invoice_number || r.invoice_number),
        client_name: r.priority?.client_name || r.client_name || 'N/A',
        outstanding_balance: r.priority?.outstanding_balance ? `P${r.priority.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'P0.00',
        recommended_action: r.recommended_action || 'N/A',
        review_status: r.review_status || 'Pending'
      }));
    }

    exportToFormalPDF({
      title,
      subtitle,
      columns: pdfColumns,
      data: formattedRows,
      metadata: {
        dateRange: dateRange.toUpperCase(),
        statusFilter: statusFilter || 'All',
        priorityFilter: priorityFilter || 'All',
        user: user?.username || 'Authorized User'
      }
    });

    toast.success("Formal PDF Report generated and downloaded successfully!", "PDF Exported");
  };

  // Filter client-side
  const filteredData = data.filter(item => {
    if (clientSearch !== '') {
      const q = clientSearch.toLowerCase();
      if (reportType === 'collection-priority') {
        if (!item.client_name?.toLowerCase().includes(q) && !item.client_id?.toString().includes(q)) return false;
      } else if (reportType === 'collection-recommendations') {
        if (!item.priority?.client_name?.toLowerCase().includes(q) && !item.priority?.client_id?.toString().includes(q)) return false;
      } else if (reportType === 'review-history') {
        if (!item.reviewer_username?.toLowerCase().includes(q)) return false;
      } else if (reportType === 'duplicate-summary') {
        if (!item.matched_field?.toLowerCase().includes(q) && !item.alert_type?.toLowerCase().includes(q)) return false;
      }
    }
    
    if (statusFilter !== '') {
      if (reportType === 'duplicate-summary' && item.review_status !== statusFilter) return false;
      if (reportType === 'collection-recommendations' && item.review_status !== statusFilter) return false;
      if (reportType === 'review-history' && item.decision !== statusFilter) return false;
    }

    if (priorityFilter !== '') {
      if (reportType === 'collection-priority' && item.priority_level !== priorityFilter) return false;
      if (reportType === 'collection-recommendations' && item.priority?.priority_level !== priorityFilter) return false;
    }

    return true;
  });

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

  // Dynamic Column Definitions based on reportType
  const getColumns = () => {
    if (reportType === 'duplicate-summary') {
      return [
        {
          key: 'id',
          label: 'Alert ID',
          sortable: true,
          width: '120px',
          render: (row: any) => `#${row.id}`,
        },
        {
          key: 'alert_type',
          label: 'Alert Type',
          sortable: true,
          width: '180px',
          render: (row: any) => (
            <span style={{ fontWeight: 700, color: 'var(--teal-dark)' }}>
              {row.alert_type}
            </span>
          ),
        },
        {
          key: 'matched_field',
          label: 'Matched Key Field',
          sortable: true,
          width: '200px',
          render: (row: any) => (
            <span style={{ fontWeight: 500, color: 'var(--tp)', fontFamily: 'var(--fb)' }}>
              {row.matched_field}
            </span>
          ),
        },
        {
          key: 'similarity_score',
          label: 'Confidence',
          sortable: true,
          width: '130px',
          render: (row: any) => `${row.similarity_score}%`,
        },
        {
          key: 'review_status',
          label: 'Status',
          sortable: true,
          width: '150px',
          render: (row: any) => (
            <StatusBadge status={reviewToStatus(row.review_status)} />
          ),
        },
        {
          key: 'date_generated',
          label: 'Generated On',
          sortable: true,
          width: '150px',
          render: (row: any) => new Date(row.date_generated).toLocaleDateString(),
        },
      ];
    }

    if (reportType === 'review-history') {
      return [
        {
          key: 'review_date',
          label: 'Audit Date',
          sortable: true,
          width: '180px',
          render: (row: any) => new Date(row.review_date).toLocaleString(),
        },
        {
          key: 'target_type',
          label: 'Target Ledger',
          sortable: true,
          width: '160px',
          render: (row: any) => row.target_type,
        },
        {
          key: 'target_id',
          label: 'Target ID',
          sortable: true,
          width: '120px',
          render: (row: any) => `#${row.target_id}`,
        },
        {
          key: 'reviewer_username',
          label: 'User Account',
          sortable: true,
          width: '160px',
          render: (row: any) => row.reviewer_username,
        },
        {
          key: 'reviewer_role',
          label: 'Role',
          sortable: true,
          width: '160px',
          render: (row: any) => row.reviewer_role,
        },
        {
          key: 'decision',
          label: 'Logged Action',
          sortable: true,
          width: '200px',
          render: (row: any) => (
            <StatusBadge status={reviewToStatus(row.decision)} />
          ),
        },
      ];
    }

    if (reportType === 'collection-priority') {
      return [
        {
          key: 'invoice_number',
          label: 'Invoice Number',
          sortable: true,
          width: '160px',
          render: (row: any) => (
            <span style={{ fontWeight: 600, color: 'var(--tp)' }}>
              {normalizeInvoiceNumber(row.invoice_number)}
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
          label: 'Outstanding Amount',
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
          label: 'Aging Priority',
          sortable: true,
          width: '150px',
          render: (row: any) => <StatusBadge status={priorityToStatus(row.priority_level)} />,
        },
        {
          key: 'supporting_basis',
          label: 'Justification',
          width: '300px',
          render: (row: any) => row.supporting_basis,
        },
      ];
    }

    // Default: collection-recommendations
    return [
      {
        key: 'invoice_number',
        label: 'Invoice Number',
        sortable: true,
        width: '160px',
        render: (row: any) => (
          <span style={{ fontWeight: 600, color: 'var(--tp)' }}>
            {normalizeInvoiceNumber(row.priority?.invoice_number)}
          </span>
        ),
      },
      {
        key: 'client_name',
        label: 'Client Account Name',
        sortable: true,
        width: '220px',
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
        key: 'recommended_action',
        label: 'AI Recommended Action',
        width: '300px',
        render: (row: any) => row.recommended_action,
      },
      {
        key: 'review_status',
        label: 'Review Status',
        sortable: true,
        width: '150px',
        render: (row: any) => <StatusBadge status={reviewToStatus(row.review_status)} />,
      },
    ];
  };

  return (
    <div className="main-content fade-in">
      <AiHeader title="Intelligence Reports Center" />
      
      <div className="page-container">
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <div>
            <p style={{ color: 'var(--ts)', fontSize: '14px', margin: 0 }}>
              Compile audit-ready logs, collection statuses, and duplicate detection breakdowns.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePrint} className="btn btn-outline" style={{ height: '36px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={15} />
              <span>Print</span>
            </button>
            <button onClick={handleExportCSV} className="btn btn-outline" style={{ height: '36px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Download size={15} />
              <span>Export CSV</span>
            </button>
            <button onClick={handleExportPDF} className="btn btn-primary" style={{ height: '36px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <FileText size={15} />
              <span>Export Formal PDF</span>
            </button>
          </div>
        </div>

        {/* Decision Support Advisory */}
        <DecisionSupportNotice />

        {/* Filters Card */}
        <div className="card" style={{ marginBottom: '24px', padding: '20px 24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--sh1)' }}>
          <h3 className="card-title" style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--tp)' }}>
            <Filter size={18} style={{ color: 'var(--teal)' }} />
            Compile Parameters
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--ts)' }}>Report Ledger Type</label>
              <select 
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

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--ts)' }}>Search Keyword (e.g. Client, Key)</label>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--tt)' }} />
                <input 
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '34px' }}
                  placeholder="Type to filter results..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--ts)' }}>Date Range Snapshot</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--tt)' }} />
                <select 
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
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--ts)' }}>Status Filter</label>
                <select 
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
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--ts)' }}>Priority Category</label>
                <select 
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
            <button onClick={generateReport} className="btn btn-outline" style={{ height: '36px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh Report</span>
            </button>
          </div>
        </div>

        {/* Error Banner if any */}
        {error && (
          <div className="advisory-banner danger" style={{ marginBottom: '20px' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <div><strong>Report Compilation Error</strong> — {error}</div>
          </div>
        )}

        {/* Results Speedex OneUI Card Container */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--sh1)' }}>
          <DataTable
            title="Compiled Results Summary"
            rowKey="id"
            data={filteredData}
            columns={getColumns()}
            loading={loading}
            searchPlaceholder="Search compiled results..."
            selectable
            exportable
            columnToggle
            densityToggle
            createButtons={[
              { label: 'Refresh Data', icon: 'ti-refresh', variant: 'primary', onClick: () => generateReport() },
            ]}
          />
        </div>
      </div>
    </div>
  );
};
