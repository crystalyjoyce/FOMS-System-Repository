import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Buttons';
import { Card } from '../components/Card';
import { CalendarPicker } from '../components/FormModals';
import { Waybill } from '../data/seed';
import { useToast } from '../components/ToastContext';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';

const WaybillDetailCard: React.FC<{ waybill: Waybill, onUpdate: (id: string, updates: Partial<Waybill>) => void }> = ({ waybill, onUpdate }) => {
  const { toast } = useToast();
  const [checklist, setChecklist] = useState({
    signature: false,
    waybillMatch: false,
    dateMatch: false,
    notDuplicate: false
  });
  const [ctcForm, setCtcForm] = useState({
    certifiedBy: '',
    certificationDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const allChecked = Object.values(checklist).every(Boolean);

  const handleValidate = () => {
    if (window.confirm('Confirm this waybill is valid for billing?')) {
      const newStatus = waybill.is_ctc ? 'Validated (CTC)' : 'Validated';
      onUpdate(waybill.id, { status: newStatus as Waybill['status'] });
      toast.success(`Waybill ${waybill.waybillNumber} successfully validated.`);
    }
  };

  const handleMarkMissing = () => {
    if (window.confirm('Mark this waybill as Missing Original Document?')) {
      onUpdate(waybill.id, { status: 'Missing' });
      toast.warning(`Waybill ${waybill.waybillNumber} marked as Missing.`);
    }
  };

  const handleCtcSubmit = () => {
    onUpdate(waybill.id, { 
      status: 'CTC Submitted',
      is_ctc: true,
      certified_by: ctcForm.certifiedBy,
      certification_date: ctcForm.certificationDate,
      reason_for_missing: ctcForm.reason,
      pod_image_url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=600&auto=format&fit=crop',
      uploaded_date: new Date().toISOString()
    });
    toast.success(`CTC details submitted for ${waybill.waybillNumber}.`);
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>Waybill Verification: {waybill.waybillNumber}</h3>
        <StatusBadge status={waybill.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>DELIVERY DATE</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{new Date(waybill.deliveryDate).toLocaleDateString('en-PH')}</span>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>DATE RECEIVED</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{waybill.uploaded_date ? new Date(waybill.uploaded_date).toLocaleDateString('en-PH') : '—'}</span>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>DESTINATION AREA</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{waybill.destinationArea || 'N/A'}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left: Document Preview */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F172A', margin: '0 0 12px' }}>Document Preview</h4>
          {waybill.pod_image_url ? (
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
              <a href={waybill.pod_image_url} target="_blank" rel="noreferrer" title="Click to view full size" style={{ display: 'block' }}>
                <img src={waybill.pod_image_url} alt="POD Document" style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
              </a>
              <div style={{ padding: '12px 16px', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ti ti-file-type-jpg" style={{ fontSize: '20px', color: '#6366F1' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                    {waybill.is_ctc ? 'Certified True Copy' : 'Original POD'}
                  </span>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748B' }}>
                  <p style={{ margin: 0 }}>By: {waybill.uploaded_by || 'Unknown'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ height: '200px', background: '#F8FAFC', border: '2px dashed #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94A3B8' }}>
              <i className="ti ti-file-off" style={{ fontSize: '32px', margin: '0 0 12px', color: '#CBD5E1' }} />
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>No document attached</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>Original POD is missing.</p>
            </div>
          )}
        </div>

        {/* Right: Actions / Verification */}
        <div>
          {waybill.status === 'Missing' ? (
            <div style={{ background: '#FFFBEB', padding: '16px', borderRadius: '12px', border: '1px solid #FDE68A' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#92400E', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-alert-triangle" /> Missing Original Document
              </h4>
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
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F172A', margin: '0 0 12px' }}>Manual Verification</h4>
              
              {waybill.status.includes('Validated') || waybill.status === 'CTC Submitted' ? (
                <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '8px', border: '1px solid #BBF7D0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                  <i className="ti ti-circle-check" style={{ fontSize: '20px' }} />
                  <span style={{ fontSize: '0.85rem' }}>
                    {waybill.status === 'CTC Submitted' ? 'CTC has been submitted and is pending final validation.' : 'This document has already been validated.'}
                  </span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input type="checkbox" checked={checklist.signature} onChange={e => setChecklist(p => ({...p, signature: e.target.checked}))} style={{ marginTop: '2px' }} />
                      <span style={{ fontSize: '0.85rem', color: '#334155' }}>Signature of recipient is legible</span>
                    </label>
                    <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input type="checkbox" checked={checklist.waybillMatch} onChange={e => setChecklist(p => ({...p, waybillMatch: e.target.checked}))} style={{ marginTop: '2px' }} />
                      <span style={{ fontSize: '0.85rem', color: '#334155' }}>Waybill number matches system record</span>
                    </label>
                    <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input type="checkbox" checked={checklist.dateMatch} onChange={e => setChecklist(p => ({...p, dateMatch: e.target.checked}))} style={{ marginTop: '2px' }} />
                      <span style={{ fontSize: '0.85rem', color: '#334155' }}>Delivery date matches system record</span>
                    </label>
                    <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input type="checkbox" checked={checklist.notDuplicate} onChange={e => setChecklist(p => ({...p, notDuplicate: e.target.checked}))} style={{ marginTop: '2px' }} />
                      <span style={{ fontSize: '0.85rem', color: '#334155' }}>Not a duplicate of a previously validated waybill</span>
                    </label>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Button 
                      variant={allChecked ? "primary" : "secondary"} 
                      title={waybill.is_ctc ? "Validate CTC" : "Validate Original"} 
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
                      Mark Missing
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export const Waybills: React.FC = () => {
  const { id: clientIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const waybillIdParam = searchParams.get('waybillId');
  const navigate = useNavigate();
  const { waybills, updateWaybill, clients } = useAppData();

  const coordinatorWaybills = waybills.filter(wb => wb.status === 'For Checking' || wb.status === 'Missing');

  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();
  const [newWaybill, setNewWaybill] = useState({
    waybillNumber: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    clientCode: clients[0]?.id || '',
    podFile: null as any
  });

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Waybill ${newWaybill.waybillNumber} successfully recorded.`);
    setIsRecording(false);
  };

  // --- View: Level 3 (Waybill Verification Document) ---
  if (waybillIdParam) {
    const wb = waybills.find(w => w.id === waybillIdParam);
    if (!wb) return <div>Waybill not found</div>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div onClick={() => navigate(`/waybills/${clientIdParam || wb.clientCode}`)} style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, width: 'fit-content' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i> Back to Client Records
        </div>
        <WaybillDetailCard waybill={wb} onUpdate={updateWaybill} />
      </div>
    );
  }

  // --- View: Level 2 (Client Detail View) ---
  if (clientIdParam) {
    const client = clients.find(c => c.id === clientIdParam);
    if (!client) return <div>Client not found</div>;

    const clientWaybills = coordinatorWaybills.filter(wb => wb.clientCode === clientIdParam);

    const columns = [
      { key: 'waybillNumber', label: 'WAYBILL NO.', sortable: true },
      { key: 'deliveryDate', label: 'DELIVERY DATE', sortable: true, render: (row: any) => new Date(row.deliveryDate).toLocaleDateString('en-US') },
      { key: 'status', label: 'STATUS', render: (row: any) => <StatusBadge status={row.status} /> }
    ];

    const actions = [
      { label: 'Verify', icon: 'ti-eye', onClick: (row: any) => navigate(`/waybills/${clientIdParam}?waybillId=${row.id}`) }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div onClick={() => navigate('/waybills')} style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, width: 'fit-content' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i> Back to Waybill Records
        </div>
        
        <Card>
          <div style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#0F172A', fontWeight: 700 }}>Client info</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>CLIENT NAME</div>
                <div style={{ fontSize: '14px', color: '#0F172A', fontWeight: 600 }}>{client.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>CLIENT ID</div>
                <div style={{ fontSize: '14px', color: '#0F172A', fontWeight: 600 }}>{client.id}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>CONTACT PERSON</div>
                <div style={{ fontSize: '14px', color: '#0F172A', fontWeight: 600 }}>{client.contactPerson || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>ADDRESS</div>
                <div style={{ fontSize: '14px', color: '#0F172A', fontWeight: 600 }}>{client.address}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>REGION</div>
                <div style={{ fontSize: '14px', color: '#0F172A', fontWeight: 600 }}>{client.region}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>BILLING CYCLE</div>
                <div style={{ fontSize: '14px', color: '#0F172A', fontWeight: 600 }}>{client.billingSchedule}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>STATUS</div>
                <div><StatusBadge status={client.status} /></div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#0F172A', fontWeight: 700 }}>Waybill History</h3>
            <DataTable 
              data={clientWaybills} 
              columns={columns} 
              actions={actions} 
              rowKey="id"
              searchPlaceholder="Search waybills..."
              searchFields={['waybillNumber', 'status'] as any}
              emptyMessage="No waybills found for this client."
              columnToggle={true} densityToggle={true} exportable={false}
            />
          </div>
        </Card>
      </div>
    );
  }

  // --- View: Level 1 (List View) ---
  const grouped = new Map<string, any[]>();
  waybills.forEach(wb => {
    if (!grouped.has(wb.clientCode)) grouped.set(wb.clientCode, []);
    grouped.get(wb.clientCode)!.push(wb);
  });

  const listData = Array.from(grouped.entries()).map(([clientId, recs]) => {
    const client = clients.find(c => c.id === clientId);
    
    let computedStatus = 'Validated';
    if (recs.some(r => r.status === 'Missing')) {
      computedStatus = 'Missing';
    } else if (recs.some(r => r.status === 'For Checking' || r.status === 'CTC Submitted' || r.status === 'Pending')) {
      computedStatus = 'Pending';
    }

    return {
      id: clientId, 
      clientName: client?.name ?? 'Unknown',
      status: computedStatus
    };
  });

  const tableColumns = [
    { key: 'id', label: 'CLIENT ID', sortable: true },
    { key: 'clientName', label: 'CLIENT NAME', sortable: true, render: (row: any) => (
      <span onClick={() => navigate(`/waybills/${row.id}`)} style={{ color: '#0F172A', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
        {row.clientName}
      </span>
    )},
    { key: 'status', label: 'STATUS', render: (row: any) => <StatusBadge status={row.status} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {isRecording && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 99999, padding: '20px'
        }}>
          <Card style={{ width: '100%', maxWidth: '500px' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>NEW RECORD</h2>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>Record Waybill / POD</h3>
              </div>
              <button onClick={() => setIsRecording(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94A3B8' }}>×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleRecordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Waybill No. *</label>
                  <input required type="text" value={newWaybill.waybillNumber} onChange={e => setNewWaybill(p => ({...p, waybillNumber: e.target.value}))} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC' }} />
                </div>
                <CalendarPicker
                  label="DELIVERY DATE *"
                  value={newWaybill.deliveryDate}
                  onChange={v => setNewWaybill(p => ({...p, deliveryDate: v}))}
                  required={true}
                />
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Client *</label>
                  <select required value={newWaybill.clientCode} onChange={e => setNewWaybill(p => ({...p, clientCode: e.target.value}))} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Upload POD (Scanned/Photo) *</label>
                  <input required type="file" accept="image/*,.pdf" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px dashed #CBD5E1', background: '#F8FAFC' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <Button variant="secondary" title="Cancel" type="button" onClick={() => setIsRecording(false)} />
                  <Button variant="primary" title="Save Record" type="submit" />
                </div>
              </form>
            </div>
          </Card>
        </div>,
        document.body
      )}

      <TableContainer>
        <DataTable 
          title="Waybill Records"
          data={listData}
          columns={tableColumns}
          rowKey="id"
          createButtons={[{ label: 'Record Waybill/POD', icon: 'ti-file-plus', onClick: () => setIsRecording(true), variant: 'primary' }]}
          emptyMessage="No waybills found."
          searchPlaceholder="Search clients..."
          searchFields={['clientName']}
          filters={[{
            key: 'status', label: 'All Statuses', options: [
              { label: 'Missing', value: 'Missing' },
              { label: 'Pending', value: 'Pending' },
              { label: 'Validated', value: 'Validated' }
            ],
            filterFn: (row: any, val: string) => row.status === val
          }]}
        />
      </TableContainer>
    </div>
  );
};

export default Waybills;
