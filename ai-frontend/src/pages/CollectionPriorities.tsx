import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DecisionSupportNotice } from '../components/DecisionSupportNotice';
import { useToast } from '../components/ToastContext';
import { AiHeader } from '../components/AiHeader';
import { Sparkles, TrendingUp, RefreshCw, Download, CheckCircle, AlertCircle, X, Search } from 'lucide-react';
import { normalizeInvoiceNumber } from '../utils/referenceNormalizer';

// ─── Priority Score Slider ─────────────────────────────────────────────────
function PrioritySlider({ score, priorityLevel, size = 'md' }: { score: number; priorityLevel?: string; size?: 'sm' | 'md' }) {
  // Red for high/overdue, Orange for medium, Green for low based on text level
  const p = String(priorityLevel || '').toUpperCase();
  const color = 
    p.includes('HIGH') || p.includes('CRITICAL') || p.includes('URGENT') ? '#DC2626' :
    p.includes('MEDIUM') || p.includes('MED') ? '#F97316' : 
    '#22C55E'; // Low or default

  const trackH = size === 'sm' ? 6 : 8;

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: size === 'sm' ? 80 : 120 }}>
      <div style={{ flex: 1, position: 'relative', height: trackH, background: '#E5E7EB', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${score}%`, background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

// ─── Priority Badge ──────────────────────────────────────────────────────────
function PriorityBadge({ level }: { level: string }) {
  const l = String(level || '').toLowerCase();
  const isHigh = l.includes('high') || l.includes('urgent') || l.includes('critical');
  const isMed = l.includes('medium') || l.includes('med');

  const cfg = isHigh
    ? { bg: '#FEE2E2', color: '#B91C1C', text: 'High priority' }
    : isMed
    ? { bg: '#FEF3C7', color: '#D97706', text: 'Medium priority' }
    : { bg: '#D1FAE5', color: '#059669', text: 'Low priority' };

  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
      {cfg.text}
    </span>
  );
}

// ─── Review Status Badge ─────────────────────────────────────────────────────
function ReviewBadge({ status }: { status: string }) {
  const s = String(status || '').toLowerCase();
  const cfg =
    s.includes('processing') || s.includes('accepted')
      ? { bg: '#ECFDF5', color: '#059669', border: '#6EE7B7', text: 'Processing' }
      : s.includes('reviewed') || s.includes('completed')
      ? { bg: '#EDE9FE', color: '#7C3AED', border: '#C4B5FD', text: 'Reviewed' }
      : s.includes('reject')
      ? { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', text: 'Rejected' }
      : { bg: '#F9FAFB', color: '#6B7280', border: '#D1D5DB', text: status || 'Pending Review' };

  return (
    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
      {cfg.text}
    </span>
  );
}

export const CollectionPriorities: React.FC = () => {
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'priorities' | 'recommendations'>('priorities');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Priorities State
  const [priorities, setPriorities] = useState<any[]>([]);
  const [loadingPriorities, setLoadingPriorities] = useState(true);
  const [errorPriorities, setErrorPriorities] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<any | null>(null);

  // Recommendations State
  const [recs, setRecs] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [errorRecs, setErrorRecs] = useState<string | null>(null);
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
      const res = await fetch('/api/ai/collection/priorities', {
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
      const res = await fetch(`/api/ai/collection/recommendations?status=Pending Review`, {
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

  useEffect(() => { fetchPriorities(); }, [token]);
  useEffect(() => {
    if (activeTab === 'recommendations') fetchRecommendations();
  }, [token, activeTab]);

  const handleOpenPriorityDetail = async (row: any) => {
    try {
      const res = await fetch(`/api/ai/collection/priorities/${row.id}`, {
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
      const res = await fetch(`/api/ai/collection/recommendations/${selectedRec.id}/review`, {
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

  const getScore = (row: any) => {
    const p = String(row.priority_level || '').toUpperCase();
    return row.priority_score || row.risk_score || (
      p.includes('CRITICAL') || p.includes('URGENT') ? 95 :
      p.includes('HIGH') ? 82 :
      p.includes('MEDIUM') ? 55 : 15
    );
  };

  const getDaysOverdue = (dueDate: string) => {
    if (!dueDate || dueDate === 'N/A') return 0;
    const diff = (new Date().getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.round(diff));
  };

  // ── Computed KPIs ──────────────────────────────────────────────────────────
  const activeList = activeTab === 'priorities' ? priorities : recs;

  const kpiHigh = useMemo(() => {
    const list = activeTab === 'priorities' ? priorities : recs;
    return list.filter(r => {
      const lvl = String((r.priority_level || r.priority?.priority_level || '')).toLowerCase();
      return lvl.includes('high') || lvl.includes('urgent') || lvl.includes('critical');
    }).length;
  }, [priorities, recs, activeTab]);

  const kpiMed = useMemo(() => {
    const list = activeTab === 'priorities' ? priorities : recs;
    return list.filter(r => {
      const lvl = String((r.priority_level || r.priority?.priority_level || '')).toLowerCase();
      return lvl.includes('medium') || lvl.includes('med');
    }).length;
  }, [priorities, recs, activeTab]);

  const kpiLow = useMemo(() => {
    const list = activeTab === 'priorities' ? priorities : recs;
    return list.filter(r => {
      const lvl = String((r.priority_level || r.priority?.priority_level || '')).toLowerCase();
      return !lvl.includes('high') && !lvl.includes('urgent') && !lvl.includes('critical') && !lvl.includes('medium') && !lvl.includes('med');
    }).length;
  }, [priorities, recs, activeTab]);

  const kpiTotal = useMemo(() => {
    const list = activeTab === 'priorities' ? priorities : recs;
    return list.reduce((sum, r) => sum + (r.outstanding_balance || r.priority?.outstanding_balance || 0), 0);
  }, [priorities, recs, activeTab]);

  const totalItems = activeList.length || 1;

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filteredPriorities = useMemo(() => {
    return priorities.filter(r => {
      const lvl = String(r.priority_level || '').toLowerCase();
      const matchFilter =
        priorityFilter === 'all' ? true :
        priorityFilter === 'high' ? (lvl.includes('high') || lvl.includes('urgent') || lvl.includes('critical')) :
        priorityFilter === 'medium' ? (lvl.includes('medium') || lvl.includes('med')) :
        priorityFilter === 'low' ? (!lvl.includes('high') && !lvl.includes('urgent') && !lvl.includes('critical') && !lvl.includes('medium')) :
        true;

      const s = search.toLowerCase();
      const matchSearch = !s || (
        (r.client_name || '').toLowerCase().includes(s) ||
        (r.invoice_number || '').toLowerCase().includes(s) ||
        (r.normalized_invoice_number || '').toLowerCase().includes(s)
      );
      return matchFilter && matchSearch;
    });
  }, [priorities, priorityFilter, search]);

  const filteredRecs = useMemo(() => {
    return recs.filter(r => {
      const lvl = String(r.priority?.priority_level || '').toLowerCase();
      const matchFilter =
        priorityFilter === 'all' ? true :
        priorityFilter === 'high' ? (lvl.includes('high') || lvl.includes('urgent') || lvl.includes('critical')) :
        priorityFilter === 'medium' ? (lvl.includes('medium') || lvl.includes('med')) :
        priorityFilter === 'low' ? (!lvl.includes('high') && !lvl.includes('urgent') && !lvl.includes('critical') && !lvl.includes('medium')) :
        true;

      const s = search.toLowerCase();
      const matchSearch = !s || (
        (r.priority?.client_name || '').toLowerCase().includes(s) ||
        (r.priority?.invoice_number || '').toLowerCase().includes(s)
      );
      return matchFilter && matchSearch;
    });
  }, [recs, priorityFilter, search]);

  const filterLabel = priorityFilter === 'all' ? 'All Priorities' :
    priorityFilter === 'high' ? 'High Priority' :
    priorityFilter === 'medium' ? 'Medium Priority' : 'Low Priority';

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const handleExport = () => {
    const rows = activeTab === 'priorities' ? filteredPriorities : filteredRecs;
    if (!rows.length) return;
    const headers = activeTab === 'priorities'
      ? ['Account', 'Invoice', 'Balance', 'Due Date', 'Priority', 'Score', 'Days Overdue']
      : ['Account', 'Invoice', 'Balance', 'Due Date', 'Priority', 'Status', 'Action'];

    const csv = [
      headers.join(','),
      ...rows.map(r => {
        if (activeTab === 'priorities') {
          return [
            `"${r.client_name || ''}"`,
            `"${r.normalized_invoice_number || r.invoice_number || ''}"`,
            r.outstanding_balance || 0,
            r.due_date ? new Date(r.due_date).toLocaleDateString() : '',
            `"${r.priority_level || ''}"`,
            getScore(r),
            getDaysOverdue(r.due_date),
          ].join(',');
        } else {
          return [
            `"${r.priority?.client_name || ''}"`,
            `"${r.priority?.invoice_number || ''}"`,
            r.priority?.outstanding_balance || 0,
            r.priority?.due_date ? new Date(r.priority?.due_date).toLocaleDateString() : '',
            `"${r.priority?.priority_level || ''}"`,
            `"${r.review_status || ''}"`,
            `"${r.recommended_action || ''}"`,
          ].join(',');
        }
      }),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loading = activeTab === 'priorities' ? loadingPriorities : loadingRecs;
  const error = activeTab === 'priorities' ? errorPriorities : errorRecs;

  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '10px 14px',
    fontSize: 12, fontWeight: 600,
    color: '#9CA3AF', borderBottom: '1px solid #F3F4F6',
    whiteSpace: 'nowrap',
  };

  return (
    <div className="main-content fade-in">
      <AiHeader title="Collection Priorities" />

      <div className="page-container">
        <DecisionSupportNotice />

        {/* ── Tab Switcher ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['priorities', 'recommendations'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearch(''); setPriorityFilter('all'); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10,
                border: activeTab === tab ? 'none' : '1px solid #E5E7EB',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                background: activeTab === tab ? 'var(--teal, #059669)' : '#ffffff',
                color: activeTab === tab ? '#ffffff' : '#374151',
                boxShadow: activeTab === tab ? '0 4px 12px rgba(5,150,105,0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
              }}
            >
              {tab === 'priorities'
                ? <TrendingUp size={15} style={{ color: activeTab === tab ? '#fff' : 'var(--teal, #059669)' }} />
                : <Sparkles size={15} style={{ color: activeTab === tab ? '#fff' : 'var(--teal, #059669)' }} />
              }
              {tab === 'priorities' ? 'Collection Priorities' : 'Recommendations & Review'}
            </button>
          ))}
        </div>

        {/* ── KPI Cards ────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'HIGH PRIORITY', value: kpiHigh, pct: Math.round((kpiHigh / totalItems) * 100), border: '#FECACA', bg: '#FFF5F5', color: '#B91C1C' },
            { label: 'MEDIUM PRIORITY', value: kpiMed, pct: Math.round((kpiMed / totalItems) * 100), border: '#FDE68A', bg: '#FFFBEB', color: '#92400E' },
            { label: 'LOW PRIORITY', value: kpiLow, pct: Math.round((kpiLow / totalItems) * 100), border: '#BBF7D0', bg: '#F0FDF4', color: '#065F46' },
            {
              label: 'TOTAL OUTSTANDING', value: null,
              amount: `₱${kpiTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
              sub: 'Across all accounts', border: '#E5E7EB', bg: '#FAFAFA', color: '#111827',
            },
          ].map((kpi, i) => (
            <div key={i} style={{ background: kpi.bg, border: `1px solid ${kpi.border}`, borderRadius: 12, padding: '18px 20px' }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: kpi.color, letterSpacing: '0.06em' }}>{kpi.label}</p>
              {kpi.value !== null
                ? <p style={{ margin: '0 0 4px', fontSize: 32, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{kpi.value}</p>
                : <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: kpi.color, lineHeight: 1.2 }}>{kpi.amount}</p>
              }
              <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>
                {kpi.value !== null ? `${kpi.pct}% of total` : kpi.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Toolbar ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={activeTab === 'priorities' ? 'Search by client, invoice, or reference...' : 'Search recommendations...'}
              style={{
                width: '100%', paddingLeft: 36, paddingRight: 14,
                height: 38, borderRadius: 8, border: '1px solid #E5E7EB',
                fontSize: 13, color: '#374151', background: '#fff',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Priority filter dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowFilterDropdown(v => !v)}
              style={{
                height: 38, padding: '0 14px', borderRadius: 8, border: '1px solid #E5E7EB',
                background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151',
                display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              }}
            >
              {filterLabel} <span style={{ fontSize: 10 }}>▾</span>
            </button>
            {showFilterDropdown && (
              <div
                style={{
                  position: 'absolute', top: '110%', left: 0, zIndex: 50,
                  background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: 160, overflow: 'hidden',
                }}
              >
                {[
                  { label: 'All Priorities', value: 'all' },
                  { label: 'High Priority', value: 'high' },
                  { label: 'Medium Priority', value: 'medium' },
                  { label: 'Low Priority', value: 'low' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setPriorityFilter(opt.value); setShowFilterDropdown(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '10px 16px', background: priorityFilter === opt.value ? '#F0FDF4' : 'transparent',
                      border: 'none', cursor: 'pointer', fontSize: 13,
                      color: priorityFilter === opt.value ? '#059669' : '#374151',
                      fontWeight: priorityFilter === opt.value ? 700 : 500,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            style={{
              height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid #E5E7EB',
              background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              color: '#374151', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <Download size={14} /> Export
          </button>

          <button
            onClick={() => activeTab === 'priorities' ? fetchPriorities() : fetchRecommendations()}
            style={{
              height: 38, padding: '0 18px', borderRadius: 8, border: 'none',
              background: 'var(--teal, #059669)', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#B91C1C', fontSize: 13, fontWeight: 600 }}>
            ⚠ AI Service Offline — {error}
          </div>
        )}

        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: '#9CA3AF', gap: 10 }}>
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 14 }}>Loading data...</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {/* ── PRIORITIES TABLE ── */}
              {activeTab === 'priorities' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead style={{ background: '#FAFAFA' }}>
                    <tr>
                      <th style={thStyle}>Account</th>
                      <th style={thStyle}>Balance</th>
                      <th style={thStyle}>Due date</th>
                      <th style={{ ...thStyle, minWidth: 140 }}>Priority score</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Overdue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPriorities.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: '#9CA3AF', fontSize: 14 }}>No collection priorities found.</td></tr>
                    )}
                    {filteredPriorities.map((row, i) => {
                      const score = getScore(row);
                      const overdue = getDaysOverdue(row.due_date);
                      return (
                        <tr
                          key={row.id || i}
                          onClick={() => handleOpenPriorityDetail(row)}
                          style={{ borderBottom: '1px solid #F3F4F6', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                        >
                          <td style={{ padding: '14px 14px' }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#0EA5E9' }}>
                              {row.client_name || 'Unknown Account'}
                            </div>
                            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                              {row.normalized_invoice_number || normalizeInvoiceNumber(row.invoice_number) || '—'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 14px', fontWeight: 700, fontSize: 14, color: '#111827' }}>
                            ₱{(row.outstanding_balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '14px 14px', fontSize: 13, color: '#374151' }}>
                            {row.due_date && row.due_date !== 'N/A'
                              ? new Date(row.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                              : '—'}
                          </td>
                          <td style={{ padding: '14px 14px' }}>
                            <PrioritySlider score={score} priorityLevel={row.priority_level} />
                          </td>
                          <td style={{ padding: '14px 14px', textAlign: 'right', fontWeight: 600, fontSize: 13, color: overdue > 30 ? '#DC2626' : overdue > 0 ? '#D97706' : '#6B7280' }}>
                            {overdue > 0 ? `${overdue}d` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* ── RECOMMENDATIONS TABLE ── */}
              {activeTab === 'recommendations' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead style={{ background: '#FAFAFA' }}>
                    <tr>
                      <th style={thStyle}>Account</th>
                      <th style={thStyle}>Balance</th>
                      <th style={thStyle}>Due date</th>
                      <th style={{ ...thStyle, minWidth: 140 }}>Priority score</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecs.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: '#9CA3AF', fontSize: 14 }}>No recommendations found.</td></tr>
                    )}
                    {filteredRecs.map((row, i) => {
                      const p = row.priority || {};
                      const score = getScore(p);
                      return (
                        <tr
                          key={row.id || i}
                          onClick={() => handleOpenRecReview(row)}
                          style={{ borderBottom: '1px solid #F3F4F6', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                        >
                          <td style={{ padding: '14px 14px' }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#0EA5E9' }}>
                              {p.client_name || 'Unknown Account'}
                            </div>
                            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                              {p.normalized_invoice_number || normalizeInvoiceNumber(p.invoice_number) || '—'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 14px', fontWeight: 700, fontSize: 14, color: '#111827' }}>
                            ₱{(p.outstanding_balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '14px 14px', fontSize: 13, color: '#374151' }}>
                            {p.due_date && p.due_date !== 'N/A'
                              ? new Date(p.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                              : '—'}
                          </td>
                          <td style={{ padding: '14px 14px' }}>
                            <PrioritySlider score={score} priorityLevel={p.priority_level} />
                          </td>
                          <td style={{ padding: '14px 14px', textAlign: 'right' }}>
                            <ReviewBadge status={row.review_status || 'Pending Review'} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── PRIORITY DETAIL SIDE PANEL ──────────────────────────────────────── */}
      {selectedPriority && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedPriority(null); }}
        >
          {/* Dimmed left */}
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)' }} onClick={() => setSelectedPriority(null)} />

          {/* Side panel */}
          <div style={{
            width: 360, background: '#fff', height: '100%', overflowY: 'auto',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.2s ease',
          }}>
            <div style={{ padding: '20px 20px 0', borderBottom: '1px solid #F3F4F6', paddingBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 12, color: '#9CA3AF' }}>
                    {selectedPriority.normalized_invoice_number || normalizeInvoiceNumber(selectedPriority.invoice_number) || selectedPriority.invoice_number}
                  </p>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827' }}>
                    {selectedPriority.client_name}
                  </h3>
                </div>
                <button onClick={() => setSelectedPriority(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ marginTop: 10 }}>
                <PriorityBadge level={selectedPriority.priority_level} />
              </div>
            </div>

            <div style={{ padding: 20, flex: 1 }}>
              {/* Key metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Outstanding balance</p>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>
                    ₱{(selectedPriority.outstanding_balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Due date</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#374151' }}>
                    {selectedPriority.due_date && selectedPriority.due_date !== 'N/A'
                      ? new Date(selectedPriority.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Days overdue</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#DC2626' }}>
                    {getDaysOverdue(selectedPriority.due_date)} days
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Priority score</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PrioritySlider score={selectedPriority.score || getScore(selectedPriority)} priorityLevel={selectedPriority.priority_level} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', whiteSpace: 'nowrap' }}>
                      {Math.round(selectedPriority.score || getScore(selectedPriority))}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Action basis */}
              {(selectedPriority.supporting_basis || selectedPriority.explanation) && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#374151' }}>Action basis</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                    {selectedPriority.supporting_basis || selectedPriority.explanation}
                  </p>
                </div>
              )}

              {/* AI recommendation */}
              {selectedPriority.explanation && (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Sparkles size={14} style={{ color: '#059669' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#065F46' }}>AI recommendation</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                    {selectedPriority.explanation}
                  </p>
                </div>
              )}

              {/* Factor breakdown as next steps */}
              {selectedPriority.factors?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#374151' }}>Suggested next steps</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedPriority.factors.slice(0, 4).map((f: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', flexShrink: 0, marginTop: 4 }} />
                        <span style={{ fontSize: 13, color: '#374151' }}>{f.name}: {f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Default next steps if no factors */}
              {(!selectedPriority.factors || selectedPriority.factors.length === 0) && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#374151' }}>Suggested next steps</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {['Contact client via phone or email', 'Send payment reminder', 'Schedule follow-up if no response'].map((step, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', flexShrink: 0, marginTop: 4 }} />
                        <span style={{ fontSize: 13, color: '#374151' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10 }}>
              <button
                onClick={() => setSelectedPriority(null)}
                style={{ flex: 1, height: 40, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#374151' }}
              >
                Close
              </button>
              <button
                onClick={() => { setSelectedPriority(null); toast.success('Priority marked as reviewed.', 'Reviewed'); }}
                style={{ flex: 1.5, height: 40, borderRadius: 8, border: 'none', background: 'var(--teal, #059669)', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#fff' }}
              >
                Mark as reviewed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RECOMMENDATION REVIEW SIDE PANEL ────────────────────────────────── */}
      {selectedRec && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedRec(null); }}
        >
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)' }} onClick={() => setSelectedRec(null)} />
          <div style={{
            width: 380, background: '#fff', height: '100%', overflowY: 'auto',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 12, color: '#9CA3AF' }}>
                    {selectedRec.priority?.normalized_invoice_number || normalizeInvoiceNumber(selectedRec.priority?.invoice_number) || selectedRec.priority?.invoice_number}
                  </p>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827' }}>
                    {selectedRec.priority?.client_name}
                  </h3>
                </div>
                <button onClick={() => setSelectedRec(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <PriorityBadge level={selectedRec.priority?.priority_level} />
                <ReviewBadge status={selectedRec.review_status || 'Pending Review'} />
              </div>
            </div>

            <div style={{ padding: 20, flex: 1 }}>
              {/* Key metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Outstanding balance</p>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>
                    ₱{(selectedRec.priority?.outstanding_balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Due date</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#374151' }}>
                    {selectedRec.priority?.due_date && selectedRec.priority?.due_date !== 'N/A'
                      ? new Date(selectedRec.priority?.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Days overdue</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#DC2626' }}>
                    {getDaysOverdue(selectedRec.priority?.due_date)} days
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Priority score</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PrioritySlider score={getScore(selectedRec.priority || {})} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', whiteSpace: 'nowrap' }}>
                      {Math.round(getScore(selectedRec.priority || {}))}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Action basis */}
              {selectedRec.priority?.supporting_basis && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#374151' }}>Action basis</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                    {selectedRec.priority?.supporting_basis}
                  </p>
                </div>
              )}

              {/* AI Recommendation */}
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Sparkles size={14} style={{ color: '#059669' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#065F46' }}>AI recommendation</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                  {selectedRec.recommended_action}
                </p>
              </div>

              {/* Explanation basis */}
              {selectedRec.explanation_basis?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#374151' }}>Suggested next steps</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedRec.explanation_basis.map((reason: string, idx: number) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', flexShrink: 0, marginTop: 4 }} />
                        <span style={{ fontSize: 13, color: '#374151' }}>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Finance Review form */}
              {canSubmitReviews && selectedRec.review_status === 'Pending Review' && (
                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16 }}>
                  <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase' }}>Finance Review</p>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: '#6B7280' }}>Review Decision</label>
                    <select
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
                      value={decision}
                      onChange={e => setDecision(e.target.value)}
                    >
                      <option value="Accepted as Recommendation">Accept Recommendation</option>
                      <option value="Reviewed">Reviewed & Closed</option>
                      <option value="Rejected">Reject</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: '#6B7280' }}>
                      Remarks / Notes <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <textarea
                      style={{ width: '100%', minHeight: 80, padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                      placeholder="Log your validation steps..."
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Already reviewed notice */}
              {selectedRec.review_status !== 'Pending Review' && (
                <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 8, border: '1px solid #BBF7D0' }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={16} /> Human review validation logged.
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#374151' }}>Status: {selectedRec.review_status}</p>
                </div>
              )}

              {!canSubmitReviews && selectedRec.review_status === 'Pending Review' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#DC2626', fontSize: 13 }}>
                  <AlertCircle size={16} /> Not authorized to submit reviews.
                </div>
              )}
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10 }}>
              <button
                onClick={() => setSelectedRec(null)}
                style={{ flex: 1, height: 40, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#374151' }}
              >
                Close
              </button>
              {canSubmitReviews && selectedRec.review_status === 'Pending Review' && (
                <button
                  disabled={modalLoading || !remarks.trim()}
                  onClick={handleSubmitRecReview}
                  style={{
                    flex: 1.5, height: 40, borderRadius: 8, border: 'none',
                    background: 'var(--teal, #059669)', cursor: 'pointer',
                    fontWeight: 700, fontSize: 13, color: '#fff',
                    opacity: (modalLoading || !remarks.trim()) ? 0.6 : 1,
                  }}
                >
                  {modalLoading ? 'Saving...' : 'Mark as reviewed'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
