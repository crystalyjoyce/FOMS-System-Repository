import React, { useState, useEffect } from 'react';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { Card } from '../components/Card';
import { Button } from '../components/Buttons';
import { CustomDatePicker } from '../components/CustomDatePicker';
import {
  SEEDED_CLIENTS, SEEDED_RATES,
  Waybill, Invoice, BillingRate
} from '../data/seed';
import { useToast } from '../components/ToastContext';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';

type Step = 1 | 2 | 3;

export const InvoiceCreation: React.FC = () => {
  const { toast } = useToast();
  const { waybills, invoices, addInvoice, updateWaybill, clients } = useAppData();
  const [step, setStep] = useState<Step>(1);
  const [selectedWaybills, setSelectedWaybills] = useState<string[]>([]);
  const [billingPeriod, setBillingPeriod] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [issueDate, setIssueDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(defaultDueDate);

  useEffect(() => {
    if (issueDate) {
      const d = new Date(issueDate);
      d.setDate(d.getDate() + 30);
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [issueDate]);

  // Derive client and schedule from first selected waybill
  const firstSelectedWaybill = waybills.find(w => w.id === selectedWaybills[0]);
  const invoiceClient = clients.find(c => c.id === firstSelectedWaybill?.clientCode);
  const derivedBillingSchedule = invoiceClient?.billingSchedule ?? 'Monthly';

  useEffect(() => {
    if (selectedWaybills.length > 0) {
      const dates = selectedWaybills
        .map(id => waybills.find(w => w.id === id)?.deliveryDate)
        .filter(Boolean)
        .map(d => new Date(d as string).getTime());
      
      if (dates.length > 0) {
        const earliestDate = new Date(Math.min(...dates));
        let startDate = new Date(earliestDate);
        let endDate = new Date(earliestDate);

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
        
        let periodStr = "";
        if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
          periodStr = `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${endDate.getDate()}, ${endDate.getFullYear()}`;
        } else {
          periodStr = `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
        }
        setBillingPeriod(periodStr);
        setIssueDate(endDate.toISOString().split('T')[0]);
      }
    } else {
      setBillingPeriod('');
    }
  }, [selectedWaybills, derivedBillingSchedule]);

  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const isDateInvalid = new Date(dueDate) < new Date(issueDate);
  const isBillingPeriodInvalid = !billingPeriod;

  // Only validated or CTC submitted (not yet billed) waybills
  const availableWaybills = waybills.filter(w => 
    (w.status === 'Validated' || w.status === 'Validated (CTC)' || w.status === 'CTC Submitted') && !w.invoiceId
  );

  // ── Billing Calculation ────────────────────────────────────────
  const computeInvoice = () => {
    let base = 0;
    let vat = 0;
    let surcharge = 0;

    selectedWaybills.forEach(wbId => {
      const wb = waybills.find(w => w.id === wbId);
      if (!wb) return;
      const rate = SEEDED_RATES.find(r => r.clientId === wb.clientCode);
      const client = clients.find(c => c.id === wb.clientCode);
      if (!rate) return;
      const lineBase = rate.baseRate;
      base += lineBase;
      vat += lineBase * (client?.vatRate ?? 0);
      surcharge += lineBase * rate.surchargeRate;
    });

    return { base, vat, surcharge, total: base + vat + surcharge };
  };

  const calc = computeInvoice();

  // ── Client Validation ───────────────────────────────────────────
  const selectedClientCodes = new Set(
    selectedWaybills.map(id => waybills.find(w => w.id === id)?.clientCode)
  );
  const hasMultipleClients = selectedClientCodes.size > 1;

  const waybillColumns = [
    { key: 'waybillNumber', label: 'WAYBILL NO.', sortable: true },
    { key: 'clientCode', label: 'CLIENT', render: (row: any) => (
      !selectedClientId ? (
        <span onClick={() => setSelectedClientId(row.clientCode)} style={{ color: '#0F172A', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
          {row.clientName}
        </span>
      ) : (
        <span style={{ fontWeight: 600 }}>{row.clientName}</span>
      )
    ), sortable: true },
    { key: 'deliveryDate', label: 'DELIVERY DATE', render: (row: any) => new Date(row.deliveryDate).toLocaleDateString('en-PH'), sortable: true },
    { key: 'status', label: 'DOCUMENT STATUS', render: (row: any) => <span style={{ fontWeight: 600, color: row.status === 'Validated' ? '#10B981' : '#F59E0B' }}>{row.status}</span> },
    { key: 'baseRate', label: 'BASE RATE', render: (row: any) => `₱${(row.baseRate || 0).toFixed(2)}` }
  ];

  // Enrich available waybills for DataTable searching/filtering
  let filteredAvailableWaybills: any[] = [];
  if (selectedClientId) {
    filteredAvailableWaybills = availableWaybills.filter(wb => wb.clientCode === selectedClientId).map(wb => {
      const rate = SEEDED_RATES.find(r => r.clientId === wb.clientCode);
      return {
        ...wb,
        clientName: clients.find(c => c.id === wb.clientCode)?.name ?? wb.clientCode,
        baseRate: rate ? rate.baseRate : 0
      };
    });
  } else {
    const grouped = new Map<string, any[]>();
    availableWaybills.forEach(wb => {
      if (!grouped.has(wb.clientCode)) grouped.set(wb.clientCode, []);
      grouped.get(wb.clientCode)!.push(wb);
    });
    filteredAvailableWaybills = Array.from(grouped.entries()).map(([clientId, recs]) => {
      const client = clients.find(c => c.id === clientId);
      const statuses = Array.from(new Set(recs.map(r => r.status)));
      const status = statuses.length === 1 ? statuses[0] : 'Mixed';
      const maxDate = new Date(Math.max(...recs.map(r => new Date(r.deliveryDate).getTime())));
      const rate = SEEDED_RATES.find(r => r.clientId === clientId);
      
      return {
        id: clientId, 
        clientCode: clientId,
        waybillNumber: recs.length === 1 ? recs[0].waybillNumber : '[Multiple]',
        clientName: client?.name ?? 'Unknown',
        deliveryDate: maxDate.toISOString(),
        status: status,
        baseRate: (rate ? rate.baseRate : 0) * recs.length,
        isGrouped: true
      };
    });
  }

  // Unique clients for filter dropdown
  const availableClients = Array.from(new Set(filteredAvailableWaybills.map(w => w.clientName)));

  if (submitted) {
    return (
      <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-circle-check" style={{ fontSize: 36, color: '#10B981' }} />
        </div>
        <h2 style={{ margin: 0, color: '#0F172A', fontSize: '1.4rem' }}>Invoice Submitted for Review</h2>
        <p style={{ margin: 0, color: '#64748B', textAlign: 'center', maxWidth: 400 }}>
          Your invoice has been created and is now <strong>Pending Approval</strong> by the Head Accountant.
        </p>
        <Button 
          title="Create Another Invoice"
          variant="primary"
          style={{ marginTop: 8 }}
          onClick={() => { setSubmitted(false); setStep(1); setSelectedWaybills([]); setBillingPeriod(''); setNotes(''); }}
        />
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Progress Steps */}
      <Card noPadding style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 0 }}>
        {([{ n: 1, label: 'Select Waybills' }, { n: 2, label: 'Review & Compute' }, { n: 3, label: 'Confirm & Submit' }] as const).map(({ n, label }, idx) => (
          <React.Fragment key={n}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step >= n ? '#0F172A' : '#F1F5F9',
                color: step >= n ? '#fff' : '#94A3B8', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s'
              }}>{step > n ? <i className="ti ti-check" style={{ fontSize: 18 }} /> : n}</div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: step >= n ? '#0F172A' : '#94A3B8' }}>{label}</span>
            </div>
            {idx < 2 && <div style={{ flex: 2, height: 2, background: step > n ? '#0F172A' : '#E2E8F0', borderRadius: 2, marginBottom: 20 }} />}
          </React.Fragment>
        ))}
      </Card>

      {/* Step 1: Select Waybills */}
      {step === 1 && (
        <>
          <TableContainer style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}>
            

            <DataTable
              key={selectedClientId ?? 'all'}
              title="Select Validated Waybills"
              data={filteredAvailableWaybills}
              columns={selectedClientId ? waybillColumns : waybillColumns.filter(c => !['waybillNumber', 'status'].includes(c.key as string))}
              rowKey="id"
              selectable={selectedClientId !== null}
              onSelectionChange={(keys) => setSelectedWaybills(keys as string[])}
              searchPlaceholder="Search waybill no. or client..."
              searchFields={['waybillNumber', 'clientName']}
              defaultPageSize={10}
              pageSizeOptions={[10, 25, 50]}
              columnToggle={true}
              filters={[
                {
                  key: 'clientName',
                  label: 'Client',
                  options: availableClients.map(c => ({ label: c, value: c }))
                },
                {
                  key: 'status',
                  label: 'Document Status',
                  options: [
                    { label: 'Validated', value: 'Validated' },
                    { label: 'CTC Submitted', value: 'CTC Submitted' }
                  ]
                }
              ]}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, padding: '0 32px' }}>
              {selectedWaybills.length > 0 ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EEF2FF', color: '#4338CA', padding: '6px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700, border: '1px solid #C7D2FE' }}>
                  <i className="ti ti-checkbox" style={{ fontSize: 16 }} />
                  {selectedWaybills.length} waybill{selectedWaybills.length !== 1 ? 's' : ''} selected
                </span>
              ) : <span />}
              <Button
                title="Next: Set Billing Period"
                variant="primary"
                disabled={selectedWaybills.length === 0}
                onClick={() => {
                  if (hasMultipleClients) {
                    toast.error('Validation Error: All selected waybills must belong to the same client.', 'Warning');
                    return;
                  }
                  setStep(2);
                }}
              />
            </div>
          </TableContainer>
          {selectedClientId && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button variant="secondary" title="← Back to Summary" onClick={() => setSelectedClientId(null)} />
            </div>
          )}
        </>
      )}

      {/* Step 2: Review & Compute */}
      {step === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
          <Card>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>Billing Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Billing Schedule</label>
                <input type="text" value={derivedBillingSchedule} readOnly disabled
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F1F5F9', fontSize: '0.9rem', color: '#64748B', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Issue Date</label>
                  <CustomDatePicker value={issueDate} onChange={setIssueDate} />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Due Date (Auto-computed)</label>
                  <CustomDatePicker value={dueDate} isInvalid={isDateInvalid} disabled={true} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Billing Period</label>
                <div style={{ position: 'relative' }}>
                  <i className="ti ti-calendar" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input type="text" value={billingPeriod} disabled
                    style={{ width: '100%', padding: '11px 14px 11px 42px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F1F5F9', fontSize: '0.9rem', color: '#94A3B8', boxSizing: 'border-box', cursor: 'not-allowed' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Notes (Optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Additional billing notes..."
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>Selected Waybills ({selectedWaybills.length})</h4>
              {selectedWaybills.map(id => {
                const wb = waybills.find(w => w.id === id);
                const client = wb ? clients.find(c => c.id === wb.clientCode) : null;
                return wb ? (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>{wb.waybillNumber}</span>
                    <span style={{ fontSize: '0.875rem', color: '#94A3B8' }}>{client?.name}</span>
                  </div>
                ) : null;
              })}
            </div>
          </Card>

          {/* Auto-computed Summary */}
          <div style={{ background: '#0F172A', borderRadius: 12, padding: 24, boxShadow: '0 4px 20px rgba(15,23,42,.12)', color: '#fff', alignSelf: 'start' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 700 }}>Billing Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Base Freight Amount', value: calc.base },
                { label: 'VAT (12%)', value: calc.vat },
                { label: 'Surcharge', value: calc.surcharge },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>{row.label}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#E2E8F0' }}>₱{row.value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
              <div style={{ height: 1, background: '#334155', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>TOTAL</span>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#A5F3FC' }}>₱{calc.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '4px 0 0' }}>Due Date: +30 days from invoice date</p>
            </div>
            <div style={{ marginTop: 24, padding: '12px 16px', background: '#1E293B', borderRadius: 8 }}>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8' }}>Rates applied from the Client Rates matrix per client region. All computations are auto-generated.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', gridColumn: '1 / -1' }}>
            <Button 
              title="Back"
              variant="secondary"
              onClick={() => setStep(1)}
            />
            <Button 
              title="Next: Confirm & Submit"
              variant="primary"
              disabled={isBillingPeriodInvalid || isDateInvalid}
              onClick={() => setStep(3)}
            />
          </div>
        </div>
      )}

      {/* Step 3: Confirm & Submit */}
      {step === 3 && (
        <div style={{ padding: 32, maxWidth: 640, margin: '0 auto', width: '100%' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>Confirm Invoice Submission</h3>
          <p style={{ margin: '0 0 24px', color: '#64748B', fontSize: '0.875rem' }}>Review the details below before submitting for Head Accountant approval.</p>
          {[
            { label: 'Waybills Included', value: `${selectedWaybills.length} waybill(s)` },
            { label: 'Billing Schedule', value: derivedBillingSchedule },
            { label: 'Issue Date', value: issueDate },
            { label: 'Due Date', value: dueDate },
            { label: 'Billing Period', value: billingPeriod },
            { label: 'Base Amount', value: `₱${calc.base.toFixed(2)}` },
            { label: 'VAT (12%)', value: `₱${calc.vat.toFixed(2)}` },
            { label: 'Surcharge', value: `₱${calc.surcharge.toFixed(2)}` },
            { label: 'TOTAL AMOUNT', value: `₱${calc.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748B' }}>{row.label}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: row.label.includes('TOTAL') ? 800 : 600, color: row.label.includes('TOTAL') ? '#0F172A' : '#1E293B' }}>{row.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 28 }}>
            <Button 
              title="Back"
              variant="secondary"
              onClick={() => setStep(2)}
            />
            <Button 
              title="Submit Invoice for Approval"
              variant="success"
              icon="ti-check"
              onClick={() => {
                // Build new invoice and write to shared context
                const newInvoiceId = `INV-${Date.now()}`;
                const invNum = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
                const newInvoice: Invoice = {
                  id: newInvoiceId,
                  invoiceNumber: invNum,
                  clientId: invoiceClient?.id ?? '',
                  waybillIds: selectedWaybills,
                  amount: calc.base,
                  vatAmount: calc.vat,
                  surchargeAmount: calc.surcharge,
                  totalAmount: calc.total,
                  billingSchedule: derivedBillingSchedule,
                  billingPeriod,
                  status: 'Pending Approval',
                  createdBy: 'EMP-003',
                  createdAt: new Date(issueDate).toISOString(),
                  dueDate: new Date(dueDate).toISOString(),
                  notes,
                };
                addInvoice(newInvoice);
                // Mark each waybill as Billed so it disappears from selection
                selectedWaybills.forEach(id => updateWaybill(id, { status: 'Billed' }));
                setSubmitted(true);
                toast.success(`Invoice ${invNum} submitted for Head Accountant approval.`, 'Invoice Submitted');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceCreation;
