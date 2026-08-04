import React from 'react';
import { SEEDED_WAYBILLS, SEEDED_CLIENTS, SEEDED_RATES, Invoice } from '../data/seed';

export const InvoiceDocument: React.FC<{ invoice: Invoice; compact?: boolean }> = ({ invoice, compact = false }) => {
  const client = SEEDED_CLIENTS.find(c => c.id === invoice.clientId);
  const waybills = invoice.waybillIds.map(id => SEEDED_WAYBILLS.find(w => w.id === id)).filter(Boolean) as any[];
  const rate = SEEDED_RATES.find(r => r.clientId === invoice.clientId);

  let subtotal = 0;
  waybills.forEach(wb => {
    subtotal += rate ? rate.baseRate : 0;
  });

  const vatRate = client?.vatRate ?? 0;
  const vat = subtotal * vatRate;
  const surcharge = rate ? subtotal * rate.surchargeRate : 0;
  const totalDue = subtotal + vat + surcharge;

  // Derive dates
  const issueDate = new Date(invoice.createdAt);
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 30);

  // Derive billing period from waybills
  let billingPeriod = "N/A";
  if (waybills.length > 0) {
    const dates = waybills.map(w => new Date(w.deliveryDate).getTime());
    const earliestDate = new Date(Math.min(...dates));
    let startDate = new Date(earliestDate);
    let endDate = new Date(earliestDate);
    
    const derivedBillingSchedule = client?.billingSchedule ?? 'Monthly';

    if (derivedBillingSchedule === 'Weekly') {
      endDate.setDate(startDate.getDate() + 6);
    } else if (derivedBillingSchedule === 'Semi-monthly') {
      if (startDate.getDate() <= 15) {
        startDate.setDate(1);
        endDate.setDate(15);
      } else {
        startDate.setDate(16);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      }
    } else {
      // Monthly default
      startDate.setDate(1);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    }

    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
      billingPeriod = `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${endDate.getDate()}, ${endDate.getFullYear()}`;
    } else {
      billingPeriod = `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    }
  }

  return (
    <div className="invoice-document" style={{
      background: '#fff',
      color: '#0F172A',
      fontFamily: 'Inter, sans-serif',
      padding: compact ? '24px' : '40px',
      maxWidth: compact ? '100%' : '800px',
      margin: '0 auto'
    }}>
      <style>
        {`
          @media print {
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body * { visibility: hidden; }
            .printable-section, .printable-section * { visibility: visible; }
            .printable-section {
              position: fixed;
              left: 0; top: 0;
              width: 100vw;
              padding: 28px 36px;
              box-sizing: border-box;
              background: #fff !important;
              color: #0F172A !important;
              font-family: 'Inter', Arial, sans-serif !important;
              font-size: 12pt !important;
              -webkit-font-smoothing: antialiased;
            }
            .printable-section table { border-collapse: collapse; width: 100%; }
            .printable-section th,
            .printable-section td {
              border: 0.5pt solid #CBD5E1;
              padding: 6pt 10pt;
              font-size: 10pt;
              color: #0F172A;
            }
            .printable-section th { background: #F1F5F9 !important; font-weight: 700; }
            .no-print { display: none !important; }
            @page { margin: 12mm; size: A4 portrait; }
          }
        `}
      </style>

      <div className="printable-section">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #E2E8F0', paddingBottom: compact ? '16px' : '24px', marginBottom: compact ? '20px' : '32px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: compact ? '1.1rem' : '2rem', color: '#0F172A', fontWeight: 800 }}>INVOICE</h1>
            <p style={{ margin: 0, fontSize: compact ? '0.75rem' : '1rem', color: '#64748B', fontWeight: 600 }}>{invoice.invoiceNumber}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: '0 0 3px', fontSize: compact ? '0.95rem' : '1.2rem', color: '#0F172A' }}>{client?.name ?? 'Unknown Client'}</h2>
            <p style={{ margin: '0 0 2px', fontSize: compact ? '0.72rem' : '0.85rem', color: '#64748B' }}>Billing Period: <strong style={{ color: '#0F172A' }}>{billingPeriod}</strong></p>
            <p style={{ margin: '0 0 2px', fontSize: compact ? '0.72rem' : '0.85rem', color: '#64748B' }}>Issue Date: <strong style={{ color: '#0F172A' }}>{issueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
            <p style={{ margin: '0', fontSize: compact ? '0.72rem' : '0.85rem', color: '#64748B' }}>Due Date: <strong style={{ color: '#0F172A' }}>{dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
          </div>
        </div>

        {/* Line Items */}
        <div style={{ marginBottom: compact ? '16px' : '40px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: compact ? '8px 12px' : '12px 16px', background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', fontSize: compact ? '0.75rem' : '0.85rem', color: '#475569', fontWeight: 700 }}>Waybill No.</th>
                <th style={{ textAlign: 'left', padding: compact ? '8px 12px' : '12px 16px', background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', fontSize: compact ? '0.75rem' : '0.85rem', color: '#475569', fontWeight: 700 }}>Delivery Date</th>
                <th style={{ textAlign: 'right', padding: compact ? '8px 12px' : '12px 16px', background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', fontSize: compact ? '0.75rem' : '0.85rem', color: '#475569', fontWeight: 700 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {waybills.map(wb => (
                <tr key={wb.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: compact ? '8px 12px' : '12px 16px', fontSize: compact ? '0.8rem' : '0.9rem', color: '#0F172A', fontWeight: 600 }}>{wb.waybillNumber}</td>
                  <td style={{ padding: compact ? '8px 12px' : '12px 16px', fontSize: compact ? '0.8rem' : '0.9rem', color: '#64748B' }}>{new Date(wb.deliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td style={{ padding: compact ? '8px 12px' : '12px 16px', fontSize: compact ? '0.8rem' : '0.9rem', color: '#0F172A', textAlign: 'right' }}>₱{(rate ? rate.baseRate : 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: compact ? '220px' : '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: compact ? '6px 0' : '8px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: compact ? '0.78rem' : '0.9rem', color: '#64748B' }}>Subtotal</span>
              <span style={{ fontSize: compact ? '0.78rem' : '0.9rem', color: '#0F172A', fontWeight: 600 }}>₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: compact ? '6px 0' : '8px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: compact ? '0.78rem' : '0.9rem', color: '#64748B' }}>VAT ({(vatRate * 100).toFixed(0)}%)</span>
              <span style={{ fontSize: compact ? '0.78rem' : '0.9rem', color: '#0F172A', fontWeight: 600 }}>₱{vat.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: compact ? '6px 0' : '8px 0', borderBottom: '2px solid #E2E8F0' }}>
              <span style={{ fontSize: compact ? '0.78rem' : '0.9rem', color: '#64748B' }}>Surcharge</span>
              <span style={{ fontSize: compact ? '0.78rem' : '0.9rem', color: '#0F172A', fontWeight: 600 }}>₱{surcharge.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: compact ? '10px 0 0' : '16px 0 0' }}>
              <span style={{ fontSize: compact ? '0.9rem' : '1.1rem', color: '#0F172A', fontWeight: 800 }}>TOTAL DUE</span>
              <span style={{ fontSize: compact ? '1rem' : '1.2rem', color: '#14B8A6', fontWeight: 800 }}>₱{totalDue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
