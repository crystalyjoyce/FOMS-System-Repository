import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AiHeader } from '../components/AiHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { Shield, ShieldAlert } from 'lucide-react';

export const ReviewHistory: React.FC = () => {
  const { token } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/duplicates/review-history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const serverList = await res.json();
        setHistory(Array.isArray(serverList) ? serverList : []);
      } else {
        setHistory([]);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load review history.");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [token]);

  const decisionToStatus = (dec: string) => {
    switch (dec) {
      case 'Reviewed':
      case 'Accepted as Recommendation':
        return 'Completed';
      case 'Dismissed':
        return 'Cancelled';
      case 'Rejected':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const columns: import('../components/DataTable').ColumnDef<any>[] = [
    {
      key: 'review_date',
      label: 'Review Date',
      sortable: true,
      width: '180px',
      render: (row: any) => new Date(row.review_date).toLocaleString(),
    },
    {
      key: 'target_type',
      label: 'Target Type',
      sortable: true,
      width: '170px',
      render: (row: any) => (
        <StatusBadge
          status={row.target_type === 'DUPLICATE_ALERT' ? 'Overdue' : 'Processing'}
        />
      ),
    },
    {
      key: 'target_id',
      label: 'Target ID',
      sortable: true,
      width: '130px',
      render: (row: any) => `#${row.target_id}`,
    },
    {
      key: 'reviewer_username',
      label: 'Reviewer',
      sortable: true,
      width: '180px',
      render: (row: any) => (
        <code style={{ background: 'var(--s2)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{row.reviewer_username}</code>
      ),
    },
    {
      key: 'reviewer_role',
      label: 'Role',
      sortable: true,
      width: '180px',
    },
    {
      key: 'decision',
      label: 'Decision',
      sortable: true,
      width: '150px',
      render: (row: any) => <StatusBadge status={decisionToStatus(row.decision)} />,
    },
    {
      key: 'remarks',
      label: 'Investigation Notes',
      width: '240px',
      render: (row: any) => (
        <div style={{ minWidth: '220px', maxWidth: '300px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--tp)', whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.remarks}</div>
          {row.recommended_action && (
            <div style={{ fontSize: '11px', color: 'var(--tt)', marginTop: '4px' }}>
              <i className="ti ti-file-text" style={{ marginRight: '4px' }} />
              Follow-up: {row.recommended_action}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="main-content fade-in">
      <AiHeader title="Review History" />

      <div className="page-container">
        {/* Immutable Compliance Advisory */}
        <div className="advisory-banner" style={{ backgroundColor: 'var(--ok-bg)', borderColor: 'var(--ok-r)', color: 'var(--tp)', marginBottom: '20px' }}>
          <Shield size={20} style={{ color: 'var(--ok)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', display: 'block', marginBottom: '4px', color: 'var(--ok)', letterSpacing: '0.05em' }}>
              Immutable Compliance Ledger
            </span>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--ts)' }}>
              All human review decisions stored in this ledger are write-locked and cannot be edited or deleted by ordinary finance personnel.
            </p>
          </div>
        </div>

        {error && (
          <div className="advisory-banner danger" style={{ marginBottom: '20px' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <div><strong>Service Offline</strong> — {error}</div>
          </div>
        )}

        <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--sh1)' }}>
          <DataTable
            title="Review History"
            rowKey="id"
            data={history}
            columns={columns}
            loading={loading}
            searchPlaceholder="Search history..."
            selectable
            exportable
            columnToggle
            densityToggle
            filters={[
              {
                key: 'target_type',
                label: 'All Targets',
                options: [
                  { label: 'Duplicate Alerts', value: 'DUPLICATE_ALERT' },
                  { label: 'Collection Priority', value: 'COLLECTION_RECOMMENDATION' },
                ],
              },
            ]}
            createButtons={[
              { label: 'Refresh Data', icon: 'ti-refresh', variant: 'primary', onClick: () => fetchHistory() },
            ]}
          />
        </div>
      </div>
    </div>
  );
};
