import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { Card } from '../components/Card';
import { StatusCard } from '../components/StatusCard';
import { Button } from '../components/Buttons';
import { useToast } from '../components/ToastContext';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';

export const WaybillLogs: React.FC = () => {
  const { toast } = useToast();
  const { waybills, clients, updateWaybill } = useAppData();
  const [ctcModal, setCtcModal] = useState<any>(null);
  const [ctcFile, setCtcFile] = useState<File | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  let enriched: any[] = [];
  if (selectedClientId) {
    enriched = waybills.filter(wb => wb.clientCode === selectedClientId).map(wb => {
      const client = clients.find(c => c.id === wb.clientCode);
      return {
        ...wb,
        clientName: client?.name ?? 'Unknown Client',
        podVerification: wb.hasOriginalPOD ? 'Original POD' : wb.hasApprovedCTC ? 'Approved CTC' : 'Missing',
      };
    });
  } else {
    const grouped = new Map<string, any[]>();
    waybills.forEach(wb => {
      if (!grouped.has(wb.clientCode)) grouped.set(wb.clientCode, []);
      grouped.get(wb.clientCode)!.push(wb);
    });
    enriched = Array.from(grouped.entries()).map(([clientId, recs]) => {
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
        podVerification: 'Mixed',
        status: status,
        isGrouped: true
      };
    });
  }

  const columns = [
    { key: 'waybillNumber', label: 'WAYBILL NO.', sortable: true },
    { key: 'clientName', label: 'CLIENT NAME', sortable: true, render: (row: any) => (
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
      sortable: true,
      render: (row: any) => new Date(row.deliveryDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
    },
    {
      key: 'podVerification',
      label: 'POD VERIFICATION',
      render: (row: any) => <StatusBadge status={row.podVerification} />,
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: 'encodedAt',
      label: 'ENCODED AT',
      render: (row: any) => new Date(row.encodedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
    },
  ];

  const actions = [
    { label: 'View Waybill', icon: 'ti-eye', onClick: (row: any) => toast.info(`Viewing waybill ${row.waybillNumber}`, 'Waybill View') },
    { 
      label: 'Upload CTC', 
      icon: 'ti-upload', 
      onClick: (row: any) => setCtcModal(row),
      hidden: (row: any) => row.podVerification !== 'Missing'
    },
  ];



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {(() => {
          const kpiWaybills = selectedClientId ? waybills.filter(wb => wb.clientCode === selectedClientId) : waybills;
          return (
            <>
              <StatusCard label="Total Waybills" value={kpiWaybills.length} icon="ti-file-description" variant="new" />
              <StatusCard label="Validated" value={kpiWaybills.filter((w: any) => w.status === 'Validated' || w.status === 'Validated (CTC)').length} icon="ti-circle-check" variant="success" />
              <StatusCard label="Pending Validation" value={kpiWaybills.filter((w: any) => w.status === 'Pending Validation' || w.status === 'CTC Submitted').length} icon="ti-clock-hour-4" variant="warning" />
              <StatusCard label="Billed" value={kpiWaybills.filter((w: any) => w.status === 'Billed').length} icon="ti-file-invoice" variant="info" />
            </>
          );
        })()}
      </div>

      {/* Table */}
      
      <TableContainer>
        <DataTable
          title="All Waybill Records"
          data={enriched}
          columns={selectedClientId ? columns : columns.filter(c => !['waybillNumber', 'status'].includes(c.key as string))}
          actions={selectedClientId ? actions : undefined}
          rowKey="id"
          searchPlaceholder="Search waybills..."
          searchFields={['waybillNumber', 'clientName', 'status'] as any}
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { label: 'Draft', value: 'Draft' },
                { label: 'Pending Validation', value: 'Pending Validation' },
                { label: 'Validated', value: 'Validated' },
                { label: 'CTC Submitted', value: 'CTC Submitted' },
                { label: 'Validated (CTC)', value: 'Validated (CTC)' },
                { label: 'Billed', value: 'Billed' },
                { label: 'Rejected', value: 'Rejected' }
              ],
              filterFn: (row: any, val: string) => row.status === val
            }
          ]}
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

      {ctcModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '400px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#0F172A' }}>Upload Certified True Copy</h2>
            <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: '#64748B' }}>Waybill: <strong>{ctcModal.waybillNumber}</strong></p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1', marginBottom: '24px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Select File</label>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setCtcFile(e.target.files?.[0] ?? null)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="secondary" title="Cancel" onClick={() => { setCtcModal(null); setCtcFile(null); }} />
              <Button variant="primary" title="Submit CTC" disabled={!ctcFile} onClick={() => { 
                updateWaybill(ctcModal.id, { hasApprovedCTC: false, status: 'CTC Submitted' });
                toast.success(`CTC for ${ctcModal.waybillNumber} submitted for verification.`, 'CTC Uploaded'); 
                setCtcModal(null); 
                setCtcFile(null); 
              }} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default WaybillLogs;
