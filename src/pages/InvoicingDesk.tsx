import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Buttons';
import { InvoiceDocument } from '../components/InvoiceDocument';
import { SEEDED_CLIENTS, Invoice } from '../data/seed';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';
import { useToast } from '../components/ToastContext';
// @ts-ignore
import html2pdf from 'html2pdf.js';

type InvoiceStatusFilter = 'All' | 'Draft' | 'Pending Approval' | 'Verified' | 'Finalized';

export const InvoicingDesk: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { invoices, clients, updateInvoice } = useAppData();
  const [activeFilter, setActiveFilter] = useState<InvoiceStatusFilter>('All');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Toggle body class to blur the entire layout behind the modal
  useEffect(() => {
    if (viewInvoice) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [viewInvoice]);

  let enrichedInvoices: any[] = [];
  if (selectedClientId) {
    enrichedInvoices = invoices.filter(i => i.clientId === selectedClientId).map(inv => {
      const client = clients.find(c => c.id === inv.clientId);
      return {
        ...inv,
        clientName: client?.name ?? 'Unknown Client',
        waybillCount: inv.waybillIds.length,
      };
    });
  } else {
    const grouped = new Map<string, any[]>();
    invoices.forEach(inv => {
      if (!grouped.has(inv.clientId)) grouped.set(inv.clientId, []);
      grouped.get(inv.clientId)!.push(inv);
    });
    enrichedInvoices = Array.from(grouped.entries()).map(([clientId, recs]) => {
      const client = clients.find(c => c.id === clientId);
      const statuses = Array.from(new Set(recs.map(r => r.status)));
      const status = statuses.length === 1 ? statuses[0] : 'Mixed';
      const maxDate = new Date(Math.max(...recs.map(r => new Date(r.createdAt).getTime())));
      
      return {
        id: clientId, 
        clientId,
        invoiceNumber: recs.length === 1 ? recs[0].invoiceNumber : '[Multiple]',
        clientName: client?.name ?? 'Unknown',
        waybillCount: recs.reduce((sum, r) => sum + r.waybillIds.length, 0),
        totalAmount: recs.reduce((sum, r) => sum + r.totalAmount, 0),
        createdAt: maxDate.toISOString(),
        status: status,
        isGrouped: true
      };
    });
  }

  const filteredInvoices = enrichedInvoices.filter(inv => {
    if (activeFilter === 'All') return true;
    if (inv.isGrouped && inv.status === 'Mixed') return true; // show mixed if filtering? or maybe keep simple
    return inv.status === activeFilter;
  });

  const handleAction = (id: string, action: string) => {
    const inv = invoices.find(i => i.invoiceNumber === id);
    if (!inv) return;

    if (action === 'Viewing') {
      setViewInvoice(inv);
    } else if (action === 'Downloading') {
      setViewInvoice(inv);
      setIsPrintMode(true);
      toast.info(`Generating PDF for ${inv.invoiceNumber}...`, 'Please wait');
      
      setTimeout(() => {
        const element = document.getElementById('hidden-print-area');
        if (element) {
          const opt = {
            margin:       10,
            filename:     `${inv.invoiceNumber}.pdf`,
            image:        { type: 'jpeg' as const, quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
          };
          
          html2pdf().from(element).set(opt).save().then(() => {
            setIsPrintMode(false);
            setViewInvoice(null);
            toast.success('PDF Downloaded successfully!', 'Success');
          });
        }
      }, 500);
    } else if (action === 'Submitting') {
      updateInvoice(inv.id, { status: 'Pending Approval' });
      toast.success(`Invoice ${inv.invoiceNumber} submitted for approval.`, 'Success');
    }
  };

  const tableColumns = [
    { key: 'invoiceNumber', label: 'INVOICE NO.', sortable: true },
    { key: 'clientName', label: 'CLIENT NAME', sortable: true, render: (row: any) => (
      !selectedClientId ? (
        <button onClick={() => setSelectedClientId(row.clientId)} style={{ background: 'none', border: 'none', padding: 0, color: '#3B82F6', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
          {row.clientName}
        </button>
      ) : (
        <span style={{ fontWeight: 600 }}>{row.clientName}</span>
      )
    ) },
    {
      key: 'createdAt',
      label: 'DATE CREATED',
      sortable: true,
      render: (row: any) => new Date(row.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
    },
    { key: 'waybillCount', label: 'WAYBILLS' },
    {
      key: 'totalAmount',
      label: 'TOTAL AMOUNT',
      sortable: true,
      render: (row: any) => `₱${row.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row: any) => <StatusBadge status={row.status} />
    }
  ];

  const actions = [
    { label: 'View Details', icon: 'ti-eye', onClick: (row: any) => handleAction(row.invoiceNumber, 'Viewing') },
    { label: 'Download PDF', icon: 'ti-file-download', onClick: (row: any) => handleAction(row.invoiceNumber, 'Downloading') },
    { label: 'Submit for Approval', icon: 'ti-send', onClick: (row: any) => handleAction(row.invoiceNumber, 'Submitting'), hidden: (row: any) => row.status !== 'Draft' }
  ];

  const filterOptions = ['Draft', 'Pending Approval', 'Verified', 'Finalized'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      

      
      <TableContainer>
        <DataTable 
          title="Invoicing"
          data={enrichedInvoices}
          columns={selectedClientId ? tableColumns : tableColumns.filter(c => !['invoiceNumber', 'status'].includes(c.key as string))}
          actions={selectedClientId ? actions : undefined}
          rowKey="id"
          searchPlaceholder="Search by invoice no. or client..."
          searchFields={['invoiceNumber', 'clientName']}
          emptyMessage="No invoices found."
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: filterOptions.map(opt => ({ label: opt, value: opt }))
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

      {/* Invoice Details Modal */}
      {viewInvoice && !isPrintMode && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,23,42,0.45)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={() => setViewInvoice(null)}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '420px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: '0 32px 64px -12px rgba(0,0,0,0.5)'
          }}
          onClick={e => e.stopPropagation()}>
            <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px 16px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-file-invoice" style={{ color: '#10B981', fontSize: 18 }} />
                </div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0F172A', fontWeight: 700 }}>Invoice Details</h2>
              </div>
              <button 
                onClick={() => setViewInvoice(null)}
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', color: '#475569' }}
              >
                <i className="ti ti-x" style={{ fontSize: 16 }} />
              </button>
            </div>
            
            <div style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
              <InvoiceDocument invoice={viewInvoice} compact={true} />
            </div>

            <div style={{ background: '#fff', borderTop: '1px solid #E2E8F0', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: 12, borderRadius: '0 0 16px 16px' }}>
              <Button 
                title="Close" 
                variant="secondary" 
                onClick={() => setViewInvoice(null)} 
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Hidden Print Area for html2pdf */}
      {viewInvoice && isPrintMode && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px', background: '#fff', zIndex: -1 }}>
          <div id="hidden-print-area">
            <InvoiceDocument invoice={viewInvoice} />
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicingDesk;
