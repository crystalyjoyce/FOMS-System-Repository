import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { Card } from '../components/Card';
import { Button } from '../components/Buttons';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';
import { ClientInfoCard } from '../components/ClientInfoCard';

export const Receipts: React.FC = () => {
  const { id: clientIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const receiptIdParam = searchParams.get('receiptId');
  const navigate = useNavigate();
  const { user } = useAuth();

  const { receipts, clients, invoices, payments } = useAppData();

  // ─────────────────────────────────────────────────────────────
  // DETAIL VIEW — card form with Print/PDF popup
  // ─────────────────────────────────────────────────────────────
  if (receiptIdParam) {
    const raw = receipts.find(r => r.id === receiptIdParam);
    if (!raw) return <div>Receipt not found</div>;

    const client  = clients.find(c => c.id === raw.clientId);
    const invoice = invoices.find(i => i.id === raw.invoiceId);
    const payment = payments.find(p => p.id === raw.paymentId);

    const or = {
      ...raw,
      clientName:      client?.name                         ?? 'Unknown',
      clientCode:      raw.clientId                         || '—',
      invoiceNumber:   invoice?.invoiceNumber               ?? raw.invoiceId,
      paymentMethod:   payment?.paymentMethod               ?? 'N/A',
      referenceNumber: payment?.referenceNumber ?? raw.referenceNumber ?? 'N/A',
    };

    const issuedByName = user?.fullName || 'Finance Accountant';

    // ── Number → words ──────────────────────────────────────────
    function numberToWords(amount: number): string {
      if (amount === 0) return 'Zero Pesos Only';
      const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
        'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
      const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
      function conv(n: number): string {
        if (n < 20)      return ones[n];
        if (n < 100)     return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
        if (n < 1000)    return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' '+conv(n%100) : '');
        if (n < 1000000) return conv(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' '+conv(n%1000) : '');
        return conv(Math.floor(n/1000000)) + ' Million' + (n%1000000 ? ' '+conv(n%1000000) : '');
      }
      const pesos    = Math.floor(amount);
      const centavos = Math.round((amount - pesos) * 100);
      let result = conv(pesos) + ' Pesos';
      if (centavos > 0) result += ' and ' + conv(centavos) + '/100 Centavos';
      return result + ' Only';
    }

    // ── Print handler: opens a new popup window with the formal OR document ──
    const handlePrint = () => {
      const issuedDate = new Date(or.issuedAt).toLocaleDateString('en-PH', {
        month: 'long', day: 'numeric', year: 'numeric',
      });
      const amountFormatted = `&#8369;${or.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
      const amountWords     = numberToWords(or.amount);

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Official Receipt &mdash; ${or.receiptNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 13px;
      color: #111;
      background: #fff;
      padding: 40px 48px;
      max-width: 820px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      font-size: 30px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .subtitle {
      text-align: center;
      color: #DC2626;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.04em;
      margin-bottom: 28px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #111;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .company-name { font-size: 17px; font-weight: 800; }
    .company-info { font-size: 12px; color: #374151; line-height: 1.7; margin-top: 4px; }
    .or-meta      { text-align: right; font-size: 13px; line-height: 2; }
    .or-meta strong { font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    td { padding: 9px 14px; border: 1px solid #D1D5DB; vertical-align: top; line-height: 1.5; }
    td:first-child { font-weight: 700; width: 38%; background: #F9FAFB; white-space: nowrap; }
    .box {
      border: 1px solid #D1D5DB;
      border-radius: 4px;
      padding: 14px 16px;
      margin-bottom: 20px;
      background: #F9FAFB;
    }
    .box-label { font-weight: 700; margin-bottom: 6px; }
    .box-body   { color: #374151; line-height: 1.6; }
    .vrow { display: flex; gap: 8px; margin-bottom: 5px; }
    .vrow .vl { font-weight: 700; min-width: 170px; }
    .vrow .vv { color: #374151; }
    .sigs {
      display: flex;
      justify-content: space-between;
      margin-top: 48px;
      margin-bottom: 16px;
    }
    .sig { text-align: center; width: 42%; }
    .sig-line { border-top: 1.5px solid #111; margin-bottom: 6px; }
    .sig-label { font-weight: 700; font-size: 12px; letter-spacing: 0.03em; }
    .footer {
      text-align: center;
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #6B7280;
      border-top: 1px solid #E5E7EB;
      padding-top: 12px;
      margin-top: 8px;
    }
    @media print {
      body { padding: 20px 32px; }
      @page { margin: 0.5in; size: A4; }
    }
  </style>
</head>
<body>
  <h1>Official Receipt</h1>
  <div class="subtitle">FOR SYSTEM TESTING ONLY &mdash; NOT A VALID RECEIPT</div>

  <div class="header">
    <div>
      <div class="company-name">SPEEDEX Logistics Services</div>
      <div class="company-info">
        123 Finance Avenue, Quezon City, Philippines<br/>
        TIN: 123-456-789-000<br/>
        Contact: (02) 8123-4567
      </div>
    </div>
    <div class="or-meta">
      <div>Official Receipt No.:&nbsp;&nbsp;<strong>${or.receiptNumber}</strong></div>
      <div>Date:&nbsp;&nbsp;<strong>${issuedDate}</strong></div>
    </div>
  </div>

  <table>
    <tbody>
      <tr><td>Received From:</td><td>${or.clientName}</td></tr>
      <tr><td>Client Code:</td><td>${or.clientCode}</td></tr>
      <tr><td>Invoice No.:</td><td>${or.invoiceNumber}</td></tr>
      <tr><td>Amount Received:</td><td>${amountFormatted}</td></tr>
      <tr><td>Amount in Words:</td><td>${amountWords}</td></tr>
      <tr><td>Payment Method:</td><td>${or.paymentMethod}</td></tr>
      <tr><td>Payment Reference No.:</td><td>${or.referenceNumber}</td></tr>
      <tr><td>Payment Status:</td><td>Validated</td></tr>
      <tr><td>Invoice Status:</td><td>Paid</td></tr>
      <tr><td>Outstanding Balance:</td><td>&#8369;0.00</td></tr>
    </tbody>
  </table>

  <div class="box">
    <div class="box-label">Purpose of Payment:</div>
    <div class="box-body">Full payment for logistics and delivery services covered by Invoice No. ${or.invoiceNumber}.</div>
  </div>

  <div class="box" style="background:#fff;">
    <div class="vrow"><span class="vl">Received / Validated By:</span><span class="vv">${issuedByName}</span></div>
    <div class="vrow"><span class="vl">Validation Date:</span><span class="vv">${issuedDate}</span></div>
    <div class="vrow"><span class="vl">Remarks:</span><span class="vv">Payment successfully validated and linked to the corresponding invoice and Accounts Receivable record.</span></div>
  </div>

  <div class="sigs">
    <div class="sig"><div class="sig-line"></div><div class="sig-label">Received By</div></div>
    <div class="sig"><div class="sig-line"></div><div class="sig-label">Authorized Signature</div></div>
  </div>

  <div class="footer">System-Generated Test Receipt</div>

  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;

      const win = window.open('', '_blank', 'width=900,height=750');
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    };

    // ── Card form layout (same as original) ─────────────────────
    const inputStyle = (accent?: string): React.CSSProperties => ({
      padding: '12px 16px',
      border: `1px solid ${accent ?? '#E2E8F0'}`,
      borderRadius: '8px',
      fontSize: '14px',
      color: accent === '#FCD34D' ? '#92400E' : accent === '#10B981' ? '#10B981' : '#0F172A',
      background: accent === '#FCD34D' ? '#FFFBEB' : accent === '#10B981' ? '#F0FDF4' : '#F8FAFC',
      fontWeight: (accent === '#FCD34D' || accent === '#10B981') ? 700 : 400,
      outline: 'none',
    });

    const labelStyle: React.CSSProperties = {
      fontSize: '11px', fontWeight: 800, color: '#64748B',
      textTransform: 'uppercase', letterSpacing: '0.05em',
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div
          onClick={() => navigate(`/receipts/${clientIdParam}`)}
          style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, width: 'fit-content' }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: '16px' }} /> Back to Receipts
        </div>

        <Card>
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
            {/* APPROVED stamp */}
            <div style={{
              position: 'absolute', top: '40px', right: '40px',
              border: '4px solid rgba(16,185,129,0.4)', color: 'rgba(16,185,129,0.4)',
              padding: '8px 24px', borderRadius: '8px', fontWeight: 900,
              fontSize: '32px', letterSpacing: '0.2em', textTransform: 'uppercase',
              transform: 'rotate(15deg)', pointerEvents: 'none', zIndex: 10,
            }}>
              APPROVED
            </div>

            <h3 style={{ margin: '0 0 -8px', fontSize: '1rem', color: '#0F172A', fontWeight: 700 }}>
              Official Receipt Details
            </h3>

            {/* Row 1 — OR Number + Date Issued */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>OR NUMBER</label>
                <input type="text" value={or.receiptNumber} disabled style={inputStyle('#FCD34D')} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>DATE ISSUED</label>
                <input
                  type="text"
                  value={new Date(or.issuedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  disabled
                  style={inputStyle()}
                />
              </div>
            </div>

            {/* Row 2 — Client Name + Invoice No. */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>CLIENT NAME</label>
                <input type="text" value={or.clientName} disabled style={inputStyle()} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>LINKED INVOICE NO.</label>
                <input type="text" value={or.invoiceNumber} disabled style={inputStyle()} />
              </div>
            </div>

            {/* Row 3 — Payment Method + Reference Number */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>PAYMENT METHOD</label>
                <input type="text" value={or.paymentMethod} disabled style={inputStyle()} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>REFERENCE NUMBER</label>
                <input type="text" value={or.referenceNumber} disabled style={{ ...inputStyle(), fontFamily: 'monospace' }} />
              </div>
            </div>

            {/* Row 4 — Amount + Payment ID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>AMOUNT RECEIVED</label>
                <input
                  type="text"
                  value={`₱${or.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                  disabled
                  style={inputStyle('#10B981')}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>LINKED PAYMENT ID</label>
                <input type="text" value={or.paymentId} disabled style={{ ...inputStyle(), fontWeight: 600 }} />
              </div>
            </div>

            {/* Row 5 — Validated / Issued By */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>VALIDATED / ISSUED BY</label>
              <input type="text" value={issuedByName} disabled style={{ ...inputStyle(), fontStyle: 'italic', color: '#64748B' }} />
            </div>

            <hr style={{ border: 0, borderTop: '1px solid #E2E8F0', margin: 0 }} />

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <Button title="Close" variant="secondary" onClick={() => navigate(`/receipts/${clientIdParam}`)} />
              <Button title="Print / PDF" variant="primary" icon="ti-printer" onClick={handlePrint} />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CLIENT DETAIL VIEW — OR History table
  // ─────────────────────────────────────────────────────────────
  if (clientIdParam) {
    const client = clients.find(c => c.id === clientIdParam);
    if (!client) return <div>Client not found</div>;

    const clientReceipts = receipts
      .filter(r => r.clientId === clientIdParam)
      .map(r => {
        const inv = invoices.find(i => i.id === r.invoiceId);
        const pmt = payments.find(p => p.id === r.paymentId);
        return {
          ...r,
          invoiceNumber:   inv?.invoiceNumber   ?? r.invoiceId,
          paymentMethod:   pmt?.paymentMethod   ?? 'N/A',
          referenceNumber: pmt?.referenceNumber ?? 'N/A',
        };
      });

    const columns = [
      { key: 'receiptNumber',   label: 'OR NUMBER',         sortable: true },
      { key: 'invoiceNumber',   label: 'LINKED INVOICE' },
      { key: 'referenceNumber', label: 'PAYMENT REFERENCE' },
      { key: 'amount',    label: 'AMOUNT',      render: (row: any) => `₱${row.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
      { key: 'issuedAt',  label: 'DATE ISSUED', render: (row: any) => new Date(row.issuedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) },
    ];

    const actions = [
      { label: 'View Details', icon: 'ti-eye', onClick: (row: any) => navigate(`/receipts/${clientIdParam}?receiptId=${row.id}`) },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div onClick={() => navigate('/receipts')} style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, width: 'fit-content' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: '16px' }} /> Back to Receipts
        </div>

        <ClientInfoCard client={client} />

        <Card>
          <div style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#0F172A', fontWeight: 700 }}>Official Receipt History</h3>
            <DataTable
              data={clientReceipts}
              columns={columns}
              actions={actions}
              rowKey="id"
              searchPlaceholder="Search receipts..."
              searchFields={['receiptNumber', 'invoiceNumber', 'referenceNumber'] as any}
              emptyMessage="No official receipts issued for this client yet."
              columnToggle={true} densityToggle={true} exportable={false}
            />
          </div>
        </Card>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // LIST VIEW — all clients
  // ─────────────────────────────────────────────────────────────
  const relevantClientIds = new Set<string>();
  receipts.forEach(r => relevantClientIds.add(r.clientId));
  payments.filter(p => p.status === 'Validated').forEach(p => relevantClientIds.add(p.clientId));

  const listData = Array.from(relevantClientIds).map(clientId => {
    const client = clients.find(c => c.id === clientId);
    const clientPayments = payments.filter(p => p.clientId === clientId && p.status === 'Validated');
    const hasPending = clientPayments.some(p => !receipts.some(r => r.paymentId === p.id));
    return {
      id: clientId,
      clientName: client?.name ?? 'Unknown',
      status: hasPending ? 'Pending' : 'Issued',
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <TableContainer>
        <DataTable
          data={listData}
          columns={[
            { key: 'id',         label: 'CLIENT ID',   sortable: true },
            { key: 'clientName', label: 'CLIENT NAME', sortable: true, render: (row: any) => (
              <span onClick={() => navigate(`/receipts/${row.id}`)} style={{ color: '#0F172A', fontWeight: 700, cursor: 'pointer' }}>
                {row.clientName}
              </span>
            )},
            { key: 'status', label: 'STATUS', render: (row: any) => <StatusBadge status={row.status} /> },
          ]}
          rowKey="id"
          title="Official Receipts"
          searchPlaceholder="Search clients..."
          searchFields={['clientName'] as any}
          emptyMessage="No official receipts issued yet."
          exportable={false}
          columnToggle={true}
          densityToggle={true}
          filters={[{
            key: 'status', label: 'All Statuses',
            options: [{ label: 'Pending', value: 'Pending' }, { label: 'Issued', value: 'Issued' }],
            filterFn: (row: any, val: string) => row.status === val,
          }]}
        />
      </TableContainer>
    </div>
  );
};

export default Receipts;
