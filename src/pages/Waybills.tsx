import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Buttons';
import { Card } from '../components/Card';
import { CalendarPicker } from '../components/FormModals';
import { SEEDED_CLIENTS, Waybill } from '../data/seed';
import { useToast } from '../components/ToastContext';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';

export const Waybills: React.FC = () => {
  const { toast } = useToast();
  const { waybills, updateWaybill, clients } = useAppData();
  
  // Modal State
  const [selectedWaybill, setSelectedWaybill] = useState<Waybill | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // Verification Checklist State
  const [checklist, setChecklist] = useState({
    signature: false,
    waybillMatch: false,
    dateMatch: false,
    notDuplicate: false
  });

  // CTC Form State for 'Missing' waybills
  const [ctcForm, setCtcForm] = useState({
    certifiedBy: '',
    certificationDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  let enrichedWaybills: any[] = [];
  const coordinatorWaybills = waybills.filter(wb => wb.status === 'For Checking' || wb.status === 'Missing');

  if (selectedClientId) {
    enrichedWaybills = coordinatorWaybills.filter(wb => wb.clientCode === selectedClientId).map(wb => {
      const client = clients.find(c => c.id === wb.clientCode);
      return {
        ...wb,
        clientName: client ? client.name : wb.clientCode,
      };
    });
  } else {
    const grouped = new Map<string, any[]>();
    coordinatorWaybills.forEach(wb => {
      if (!grouped.has(wb.clientCode)) grouped.set(wb.clientCode, []);
      grouped.get(wb.clientCode)!.push(wb);
    });
    enrichedWaybills = Array.from(grouped.entries()).map(([clientId, recs]) => {
      const client = clients.find(c => c.id === clientId);
      const maxDate = new Date(Math.max(...recs.map(r => new Date(r.deliveryDate).getTime())));
      const statuses = Array.from(new Set(recs.map(r => r.status)));
      const status = statuses.length === 1 ? statuses[0] : 'Mixed';
      
      return {
        id: clientId, 
        clientCode: clientId,
        waybillNumber: recs.length === 1 ? recs[0].waybillNumber : '[Multiple]',
        clientName: client?.name ?? 'Unknown',
        deliveryDate: maxDate.toISOString(),
        uploaded_date: maxDate.toISOString(),
        status: status,
        isGrouped: true
      };
    });
  }

  const handleView = (row: Waybill) => {
    setSelectedWaybill(row);
    // Reset checklist on open
    setChecklist({ signature: false, waybillMatch: false, dateMatch: false, notDuplicate: false });
    setCtcForm({ certifiedBy: '', certificationDate: new Date().toISOString().split('T')[0], reason: '' });
  };

  const handleCloseModal = () => {
    setSelectedWaybill(null);
  };

  const allChecked = Object.values(checklist).every(Boolean);

  const handleValidate = () => {
    if (!selectedWaybill) return;
    if (window.confirm('Confirm this waybill is valid for billing?')) {
      const newStatus = selectedWaybill.is_ctc ? 'Validated (CTC)' : 'Validated';
      updateWaybill(selectedWaybill.id, { status: newStatus as Waybill['status'] });
      toast.success(`Waybill ${selectedWaybill.waybillNumber} successfully validated.`);
      handleCloseModal();
    }
  };

  const handleMarkMissing = () => {
    if (!selectedWaybill) return;
    if (window.confirm('Mark this waybill as Missing Original Document?')) {
      updateWaybill(selectedWaybill.id, { status: 'Missing' });
      toast.warning(`Waybill ${selectedWaybill.waybillNumber} marked as Missing.`);
      handleCloseModal();
    }
  };

  const handleCtcSubmit = () => {
    if (!selectedWaybill) return;
    updateWaybill(selectedWaybill.id, { 
      status: 'CTC Submitted',
      is_ctc: true,
      certified_by: ctcForm.certifiedBy,
      certification_date: ctcForm.certificationDate,
      reason_for_missing: ctcForm.reason,
      pod_image_url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=600&auto=format&fit=crop',
      uploaded_date: new Date().toISOString()
    });
    toast.success(`CTC details submitted for ${selectedWaybill.waybillNumber}.`);
    handleCloseModal();
  };

  const tableColumns = [
    { key: 'waybillNumber', label: 'WAYBILL NO.', sortable: true },
    { key: 'clientName', label: 'CLIENT', sortable: true, render: (row: any) => (
      !selectedClientId ? (
        <button onClick={() => setSelectedClientId(row.clientCode)} style={{ background: 'none', border: 'none', padding: 0, color: '#3B82F6', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
          {row.clientName}
        </button>
      ) : (
        <span style={{ fontWeight: 600 }}>{row.clientName}</span>
      )
    ) },
    { 
      key: 'deliveryDate', 
      label: 'DELIVERY DATE',
      render: (row: any) => new Date(row.deliveryDate).toLocaleDateString('en-PH')
    },
    { 
      key: 'status', 
      label: 'DOCUMENT STATUS',
      render: (row: any) => <StatusBadge status={row.status} />
    },
    { 
      key: 'uploaded_date', 
      label: 'DATE RECEIVED',
      render: (row: any) => {
        const d = row.uploaded_date || row.encodedAt;
        return d ? new Date(d).toLocaleDateString('en-PH') : '—';
      }
    }
  ];

  const actions = [
    { label: 'View', icon: 'ti-eye', onClick: handleView }
  ];

  const hasForChecking = enrichedWaybills.some(wb => wb.status === 'For Checking');
  const defaultFilters: Record<string, string> | undefined = (selectedClientId && hasForChecking) ? { status: 'For Checking' } : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Data Table */}
      
      <TableContainer>
        <DataTable 
          key={selectedClientId ?? 'all'}
          title="Waybills Data"
          data={enrichedWaybills}
          columns={selectedClientId ? tableColumns : tableColumns.filter(c => !['waybillNumber', 'status'].includes(c.key as string))}
          actions={selectedClientId ? actions : undefined}
          rowKey="id"
          emptyMessage="No waybills found matching criteria."
          searchPlaceholder="Search waybill no. or client..."
          searchFields={['waybillNumber', 'clientName'] as any}
          defaultFilters={defaultFilters}
          filters={selectedClientId ? [
            {
              key: 'status',
              label: 'Status',
              options: [
                { label: 'For Checking', value: 'For Checking' },
                { label: 'Missing', value: 'Missing' }
              ]
            }
          ] : []}
          columnToggle={true}
          densityToggle={true}
          exportable={false}
        />
      </TableContainer>
      {selectedClientId && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button variant="secondary" title="← Back to Summary" onClick={() => setSelectedClientId(null)} />
        </div>
      )}

      {selectedWaybill && createPortal(
        <div className="modal-overlay" onClick={handleCloseModal} style={{ zIndex: 99999 }}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-hd">
              <h2 className="modal-hd-title">Waybill Verification: {selectedWaybill.waybillNumber}</h2>
              <button className="modal-x-btn" onClick={handleCloseModal} aria-label="Close">
                <i className="ti ti-x" style={{ fontSize: 16 }} />
              </button>
            </div>
            <div className="modal-hd-divider" />

            <div className="modal-bd">
              
              {/* Read-only Delivery Info */}
              <div className="modal-row-2">
                <div>
                  <span className="modal-detail-label">WAYBILL NO.</span>
                  <span className="modal-detail-value">{selectedWaybill.waybillNumber}</span>
                </div>
                <div>
                  <span className="modal-detail-label">CLIENT</span>
                  <span className="modal-detail-value">{(selectedWaybill as any).clientName}</span>
                </div>
              </div>
              <div className="modal-row-2">
                <div>
                  <span className="modal-detail-label">DELIVERY DATE</span>
                  <span className="modal-detail-value">{new Date(selectedWaybill.deliveryDate).toLocaleDateString('en-PH')}</span>
                </div>
                <div>
                  <span className="modal-detail-label">DESTINATION AREA</span>
                  <span className="modal-detail-value">{selectedWaybill.destinationArea || 'N/A'}</span>
                </div>
              </div>

              {/* Main Stacked Layout (Changed from split to column for smaller width) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '8px' }}>
                
                {/* Left: Document Preview */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', margin: '0 0 16px' }}>Document Preview</h3>
                  {selectedWaybill.pod_image_url ? (
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                      <a href={selectedWaybill.pod_image_url} target="_blank" rel="noreferrer" title="Click to view full size" style={{ display: 'block' }}>
                        <img src={selectedWaybill.pod_image_url} alt="POD Document" style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block', transition: 'opacity 0.2s' }} />
                      </a>
                      <div style={{ padding: '12px 16px', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="ti ti-file-type-jpg" style={{ fontSize: '20px', color: '#6366F1' }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                            {selectedWaybill.is_ctc ? 'Certified True Copy' : 'Original POD'}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748B' }}>
                          <p style={{ margin: 0 }}>By: {selectedWaybill.uploaded_by || 'Unknown'}</p>
                          <p style={{ margin: '2px 0 0' }}>{selectedWaybill.uploaded_date ? new Date(selectedWaybill.uploaded_date).toLocaleString('en-PH') : ''}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: '240px', background: '#F8FAFC', border: '2px dashed #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94A3B8' }}>
                      <i className="ti ti-file-off" style={{ fontSize: '32px', margin: '0 0 12px', color: '#CBD5E1' }} />
                      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>No document attached</p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>Original POD is missing.</p>
                    </div>
                  )}
                </div>

                {/* Right: Actions / Verification */}
                <div>
                  {selectedWaybill.status === 'Missing' ? (
                    <div style={{ background: '#FFFBEB', padding: '20px', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#92400E', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="ti ti-alert-triangle" /> Missing Original Document
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#B45309', margin: '0 0 16px' }}>
                        The original POD was not received. Please submit CTC details to proceed.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400E', display: 'block', marginBottom: '4px' }}>Certified By *</label>
                          <input type="text" value={ctcForm.certifiedBy} onChange={e => setCtcForm(p => ({...p, certifiedBy: e.target.value}))} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #FCD34D', background: '#fff' }} />
                        </div>
                          <CalendarPicker
                            label="CERTIFICATION DATE"
                            value={ctcForm.certificationDate}
                            onChange={v => setCtcForm(p => ({...p, certificationDate: v}))}
                            required={true}
                          />
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400E', display: 'block', marginBottom: '4px' }}>Reason for Missing Original *</label>
                          <input type="text" value={ctcForm.reason} onChange={e => setCtcForm(p => ({...p, reason: e.target.value}))} placeholder="e.g. Lost in transit" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #FCD34D', background: '#fff' }} />
                        </div>
                        <div style={{ marginTop: '8px' }}>
                          <Button variant="primary" title="Mark CTC Submitted" onClick={handleCtcSubmit} disabled={!ctcForm.certifiedBy || !ctcForm.certificationDate || !ctcForm.reason} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', margin: '0 0 16px' }}>Manual Verification</h3>
                      
                      {selectedWaybill.status.includes('Validated') || selectedWaybill.status === 'CTC Submitted' ? (
                        <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '8px', border: '1px solid #BBF7D0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                          <i className="ti ti-circle-check" style={{ fontSize: '20px' }} />
                          {selectedWaybill.status === 'CTC Submitted' ? 'CTC has been submitted and is pending final validation.' : 'This document has already been validated.'}
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                              <input type="checkbox" checked={checklist.signature} onChange={e => setChecklist(p => ({...p, signature: e.target.checked}))} style={{ marginTop: '4px' }} />
                              <span style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>Signature of recipient is present and legible</span>
                            </label>
                            <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                              <input type="checkbox" checked={checklist.waybillMatch} onChange={e => setChecklist(p => ({...p, waybillMatch: e.target.checked}))} style={{ marginTop: '4px' }} />
                              <span style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>Waybill number on document matches system record</span>
                            </label>
                            <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                              <input type="checkbox" checked={checklist.dateMatch} onChange={e => setChecklist(p => ({...p, dateMatch: e.target.checked}))} style={{ marginTop: '4px' }} />
                              <span style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>Delivery date on document matches system record</span>
                            </label>
                            <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                              <input type="checkbox" checked={checklist.notDuplicate} onChange={e => setChecklist(p => ({...p, notDuplicate: e.target.checked}))} style={{ marginTop: '4px' }} />
                              <span style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>Not a duplicate of a previously validated waybill</span>
                            </label>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <Button 
                              variant={allChecked ? "primary" : "secondary"} 
                              title={selectedWaybill.is_ctc ? "Validate CTC" : "Validate Original"} 
                              onClick={handleValidate} 
                              disabled={!allChecked}
                            />
                            <button
                              onClick={handleMarkMissing}
                              style={{
                                background: '#fff', border: '1px solid #E2E8F0', color: '#DC2626',
                                borderRadius: 6, padding: '0 16px', fontSize: '0.875rem',
                                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                              }}
                            >
                              <i className="ti ti-alert-triangle" />
                              Mark as Missing
                            </button>
                          </div>
                          {!allChecked && (
                            <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                              Please complete the checklist to enable validation. Mark as missing if the document is unavailable.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Waybills;
