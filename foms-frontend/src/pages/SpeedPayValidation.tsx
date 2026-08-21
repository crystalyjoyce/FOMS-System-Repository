import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { SpeedPaySubmission } from '../data/seed';
import { Card } from '../components/Card';
import { Button } from '../components/Buttons';
import { useToast } from '../components/ToastContext';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';
import api from '../services/api';

// ─── Mini Bar Chart ───────────────────────────────────────────────
function BarChart({ data, color = '#6366F1', height = 120 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700, textAlign: 'center' }}>
            {d.value > 0 ? (d.value >= 1000 ? `₱${(d.value / 1000).toFixed(0)}k` : `₱${d.value}`) : ''}
          </div>
          <div
            style={{
              width: '100%',
              background: `linear-gradient(180deg, ${color}, ${color}99)`,
              borderRadius: '4px 4px 0 0',
              height: `${(d.value / max) * (height - 30)}px`,
              minHeight: d.value > 0 ? 4 : 0,
              transition: 'height 0.4s ease',
            }}
          />
          <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Mini Donut Chart ──────────────────────────────────────────────
function DonutChart({ segments, size = 100 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 16;
  let cumulative = 0;

  const arcs = segments.map(seg => {
    const pct = seg.value / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += pct;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = pct > 0.5 ? 1 : 0;
    return { ...seg, d: pct > 0.001 ? `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}` : '' };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
      {arcs.map((arc, i) =>
        arc.d ? (
          <path key={i} d={arc.d} fill="none" stroke={arc.color} strokeWidth={strokeWidth} strokeLinecap="round" />
        ) : null
      )}
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={12} fontWeight={800} fill="#0F172A">
        {total}
      </text>
    </svg>
  );
}

export const SpeedPayValidation: React.FC = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get('submissionId');
  const navigate = useNavigate();
  const { speedPay, invoices, updateSpeedPay, updateInvoice, addReceipt, receipts, clients, addPayment } = useAppData();

  const [validationStatus, setValidationStatus] = useState<'Approve' | 'Reject'>('Approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Enrich SpeedPay submissions ─────────────────────────────────
  const allEnriched = speedPay.map(sub => {
    const invoice = invoices.find(i => i.id === sub.invoiceId);
    const clientId = (sub as any).clientId || (invoice ? invoice.clientId : 'UNKNOWN');
    const client = clients.find(c => c.id === clientId);
    return {
      ...sub,
      clientId,
      clientName: client?.name ?? sub.clientName ?? 'Unknown',
      invoiceNumber: sub.invoiceNumber ?? invoice?.invoiceNumber ?? sub.invoiceId,
      invoiceAmount: invoice?.totalAmount ?? sub.amountPaid ?? 0,
    };
  });
  console.log('[SpeedPayValidation] submissionId:', submissionId);
  console.log('[SpeedPayValidation] allEnriched ids:', allEnriched.map(s => s.id));

  // ─── Chart Data ───────────────────────────────────────────────────
  const pending = allEnriched.filter(s => s.status === 'Pending Validation').length;
  const validated = allEnriched.filter(s => s.status === 'Validated').length;
  const rejected = allEnriched.filter(s => s.status === 'Rejected').length;
  const todayStr = new Date().toLocaleDateString('en-PH');
  const validatedToday = allEnriched.filter(s => s.status === 'Validated' && new Date((s as any).validatedAt || '').toLocaleDateString('en-PH') === todayStr).length;
  const rejectedToday = allEnriched.filter(s => s.status === 'Rejected').length;

  const totalCollected = useMemo(() =>
    allEnriched.filter(s => s.status === 'Validated').reduce((sum, s) => sum + (s.amountPaid ?? 0), 0),
    [allEnriched]
  );

  const totalOutstanding = useMemo(() =>
    invoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + (i.totalAmount ?? 0), 0),
    [invoices]
  );

  const totalPaid = useMemo(() =>
    invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.totalAmount ?? 0), 0),
    [invoices]
  );

  const pendingAmount = useMemo(() =>
    allEnriched.filter(s => s.status === 'Pending Validation').reduce((sum, s) => sum + (s.amountPaid ?? 0), 0),
    [allEnriched]
  );

  // Monthly payment summary (last 6 months)
  const monthlyData = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const year = d.getFullYear();
      const month = d.getMonth();
      const value = allEnriched
        .filter(s => {
          const sd = new Date(s.submittedAt);
          return sd.getFullYear() === year && sd.getMonth() === month && s.status === 'Validated';
        })
        .reduce((sum, s) => sum + (s.amountPaid ?? 0), 0);
      months.push({ label, value });
    }
    return months;
  }, [allEnriched]);

  // Payment method breakdown
  const methodBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    allEnriched.forEach(s => {
      const m = s.paymentMethod ?? 'Unknown';
      counts[m] = (counts[m] ?? 0) + 1;
    });
    const colors: Record<string, string> = {
      GCash: '#007AFF', Maya: '#00AA6C', 'Bank Transfer': '#1E3A5F',
      'BDO Online': '#0066CC', 'BPI Online': '#CC0000', Unknown: '#94A3B8'
    };
    return Object.entries(counts).map(([label, value]) => ({ label, value, color: colors[label] ?? '#6366F1' }));
  }, [allEnriched]);

  // ─── Handle Validate/Reject ───────────────────────────────────────
  const handleValidate = async (sub: any) => {
    setIsSubmitting(true);
    try {
      if (validationStatus === 'Approve') {
        updateSpeedPay(sub.id, { status: 'Validated', validatedBy: 'EMP-001', validatedAt: new Date().toISOString() } as any);
        await api.put(`/speedpay/submissions/${sub.id}/status`, { status: 'Validated' }).catch(() => {});
        const linkedInvoice = invoices.find(i => i.id === sub.invoiceId);
        if (linkedInvoice) updateInvoice(linkedInvoice.id, { status: 'Paid' });
        addPayment({
          id: `PAY-${Date.now()}`,
          clientId: sub.clientId ?? linkedInvoice?.clientId ?? 'UNKNOWN',
          invoiceId: sub.invoiceId,
          amount: sub.amountPaid,
          paymentMethod: sub.paymentMethod,
          referenceNumber: sub.referenceNumber,
          proofOfPaymentUrl: sub.proofFileUrl,
          recordedBy: 'EMP-001',
          recordedAt: new Date().toISOString(),
          status: 'Validated',
          bankConfirmed: true,
        });
        const orNum = `OR-${new Date().getFullYear()}-${String(receipts.length + 1).padStart(4, '0')}`;
        addReceipt({
          id: `OR-${Date.now()}`,
          receiptNumber: orNum,
          invoiceId: sub.invoiceId,
          paymentId: sub.id,
          clientId: sub.clientId ?? 'UNKNOWN',
          amount: sub.amountPaid,
          referenceNumber: sub.referenceNumber,
          issuedBy: 'EMP-001',
          issuedAt: new Date().toISOString(),
        });
        toast.success(`Payment from ${sub.clientName} has been Approved. Official Receipt generated.`, 'Payment Validated');
      } else {
        updateSpeedPay(sub.id, { status: 'Rejected', rejectionReason } as any);
        await api.put(`/speedpay/submissions/${sub.id}/status`, { status: 'Rejected', remarks: rejectionReason }).catch(() => {});
        toast.error(`Payment from ${sub.clientName} has been Rejected.`, 'Payment Rejected');
      }
      navigate('/speedpay-validation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: 'id', label: 'TRANSACTION ID', render: (row: any) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748B' }}>{row.id.substring(0, 8)}...</span> },
    {
      key: 'clientName', label: 'CLIENT NAME', sortable: true,
      render: (row: any) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{row.clientName}</div>
          {row.clientId && row.clientId !== 'UNKNOWN' && <div style={{ fontSize: 11, color: '#64748B' }}>{row.clientId}</div>}
        </div>
      )
    },
    { key: 'invoiceNumber', label: 'INVOICE NO.' },
    { key: 'paymentMethod', label: 'METHOD' },
    {
      key: 'amountPaid', label: 'AMOUNT', sortable: true,
      render: (row: any) => <span style={{ fontWeight: 700, color: '#0F172A' }}>₱{Number(row.amountPaid).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
    },
    {
      key: 'proofFileName', label: 'PROOF',
      render: (row: any) => row.proofFileName
        ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><i className="ti ti-photo" style={{ fontSize: 16, color: '#0EA5E9' }} /><span style={{ fontSize: 12, color: '#64748B' }}>{row.proofFileName}</span></span>
        : <span style={{ color: '#94A3B8' }}>None</span>
    },
    {
      key: 'submittedAt', label: 'SUBMITTED',
      render: (row: any) => new Date(row.submittedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    },
    { key: 'status', label: 'STATUS', render: (row: any) => <StatusBadge status={row.status} /> },
  ];

  const actions = [
    {
      label: 'Validate',
      icon: 'ti-check',
      onClick: (row: any) => navigate(`/speedpay-validation?submissionId=${row.id}`),
      hidden: (row: any) => row.status !== 'Pending Validation',
    },
  ];

  // ─── Detail / Validation View ──────────────────────────────────────
  if (submissionId) {
    const sub = allEnriched.find(s => s.id === submissionId);
    if (!sub) return <div style={{ padding: 32 }}>Submission not found.</div>;
    console.log('[SpeedPayValidation] sub.status is:', sub.status);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div onClick={() => navigate('/speedpay-validation')}
          style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, width: 'fit-content' }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 16 }} /> Back to Queue
        </div>

        <Card>
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0F172A', fontWeight: 700 }}>Validate SpeedPay Submission</h3>
              <StatusBadge status={sub.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 6 }}>CLIENT NAME</label>
                <div style={{ padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, color: '#0F172A', fontWeight: 600 }}>{sub.clientName}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 6 }}>CLIENT ID</label>
                <div style={{ padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, color: '#0F172A' }}>{(sub as any).clientId || '—'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 6 }}>LINKED INVOICE NO.</label>
                <div style={{ padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, color: '#0F172A' }}>{sub.invoiceNumber}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 6 }}>AMOUNT PAID</label>
                <div style={{ padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, color: '#0F172A', fontWeight: 700 }}>₱{Number(sub.amountPaid).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 6 }}>PAYMENT METHOD</label>
                <div style={{ padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, color: '#0F172A' }}>{sub.paymentMethod}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 6 }}>REFERENCE NUMBER</label>
                <div style={{ padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, color: '#0F172A', fontFamily: 'monospace' }}>{sub.referenceNumber}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 6 }}>DATE SUBMITTED</label>
                <div style={{ padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, color: '#0F172A' }}>
                  {new Date(sub.submittedAt).toLocaleString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {sub.proofFileName && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>PROOF OF PAYMENT</label>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, background: '#F8FAFC', padding: 16, textAlign: 'center' }}>
                  {sub.proofFileUrl ? (
                    <img src={sub.proofFileUrl} alt="Proof" style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 4, objectFit: 'contain' }} />
                  ) : (
                    <div style={{ padding: '32px 0', color: '#94A3B8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <i className="ti ti-photo" style={{ fontSize: 48 }} />
                      <span style={{ fontSize: 14 }}>{sub.proofFileName}</span>
                      <span style={{ fontSize: 12 }}>(File uploaded — preview not available in this view)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <hr style={{ border: 0, borderTop: '1px solid #E2E8F0', margin: 0 }} />

            {sub.status === 'Pending Validation' ? (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>VALIDATION DECISION</label>
                  <select
                    value={validationStatus}
                    onChange={(e) => setValidationStatus(e.target.value as 'Approve' | 'Reject')}
                    style={{
                      width: '100%', padding: '12px 16px',
                      border: validationStatus === 'Approve' ? '2px solid #10B981' : '2px solid #EF4444',
                      borderRadius: 8, fontSize: 14, outline: 'none',
                      background: validationStatus === 'Approve' ? '#F0FDF4' : '#FEF2F2',
                      color: validationStatus === 'Approve' ? '#047857' : '#B91C1C',
                      cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700
                    }}
                  >
                    <option value="Approve">✓ Approve — Mark as Validated</option>
                    <option value="Reject">✗ Reject — Return to Client</option>
                  </select>
                </div>
                {validationStatus === 'Reject' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>REJECTION REASON <span style={{ color: '#EF4444' }}>*</span></label>
                    <textarea
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder="Provide a clear reason for rejection (e.g., amount mismatch, invalid proof)..."
                      rows={4}
                      style={{ width: '100%', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
                <hr style={{ border: 0, borderTop: '1px solid #E2E8F0', margin: 0 }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                  <Button title="Cancel" variant="secondary" onClick={() => navigate('/speedpay-validation')} />
                  <Button
                    title={isSubmitting ? 'Processing...' : (validationStatus === 'Approve' ? 'Approve Payment' : 'Reject Payment')}
                    onClick={() => handleValidate(sub)}
                    disabled={isSubmitting || (validationStatus === 'Reject' && !rejectionReason.trim())}
                  />
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#64748B', fontSize: 14 }}>
                This submission has already been <strong>{sub.status}</strong>.
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ─── Main Dashboard View ────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Pending Validation', value: pending, color: '#F59E0B', icon: 'ti-clock', sub: `₱${pendingAmount.toLocaleString('en-PH', { maximumFractionDigits: 0 })} awaiting` },
          { label: 'Validated', value: validated, color: '#10B981', icon: 'ti-check', sub: `Today: ${validatedToday}` },
          { label: 'Rejected', value: rejected, color: '#EF4444', icon: 'ti-x', sub: `Total returned` },
          { label: 'Total Collected', value: `₱${(totalCollected/1000).toFixed(1)}k`, color: '#6366F1', icon: 'ti-cash', sub: `From validated payments` },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: kpi.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`ti ${kpi.icon}`} style={{ fontSize: 20, color: kpi.color }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A' }}>{kpi.value}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>{kpi.label}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>


      {/* Policy banner */}
      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <i className="ti ti-info-circle" style={{ color: '#F59E0B', fontSize: 20, flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400E' }}>
          <strong>Validation Policy:</strong> Confirm that the submitted amount matches the invoice total and that the payment has been received in the company account before approving.
        </p>
      </div>

      <TableContainer>
        <DataTable
          title="SpeedPay Validations"
          data={allEnriched}
          columns={columns}
          actions={actions}
          rowKey="id"
          searchPlaceholder="Search by client, invoice, or reference..."
        />
      </TableContainer>
    </div>
  );
};

export default SpeedPayValidation;
