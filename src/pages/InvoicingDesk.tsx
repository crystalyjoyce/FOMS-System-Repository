import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Buttons';
import { Card } from '../components/Card';
import { InvoiceDocument } from '../components/InvoiceDocument';
import { SEEDED_CLIENTS, Invoice } from '../data/seed';
import { useAppData } from '../context/AppDataContext';
import { TableContainer } from '../components/TableContainer';
import { useToast } from '../components/ToastContext';
import { ClientInfoCard } from '../components/ClientInfoCard';
// @ts-ignore
import html2pdf from 'html2pdf.js';

type InvoiceStatusFilter = 'All' | 'Draft' | 'Pending Approval' | 'Verified' | 'Finalized';

export const InvoicingDesk: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const actionParam = searchParams.get('action');
  
  const { toast } = useToast();
  const { invoices, clients, updateInvoice } = useAppData();
  const [activeFilter, setActiveFilter] = useState<InvoiceStatusFilter>('All');
  
  const [isPrintMode, setIsPrintMode] = useState(false);

  let viewInvoice = null;
  let viewClient = null;

  if (id) {
    viewInvoice = invoices.find(i => i.id === id);
    if (!viewInvoice) {
      viewClient = clients.find(c => c.id === id);
    }
  }

  const selectedClientId = viewClient ? viewClient.id : null;

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
        invoiceId: recs.length === 1 ? recs[0].id : undefined,
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

  const handleAction = (invId: string, action: string) => {
    const inv = invoices.find(i => i.invoiceNumber === invId || i.id === invId);
    if (!inv) return;

    if (action === 'Viewing') {
      navigate(`/invoicing-desk/${inv.id}`);
    } else if (action === 'Downloading') {
      navigate(`/invoicing-desk/${inv.id}?action=download`);
    } else if (action === 'Submitting') {
      updateInvoice(inv.id, { status: 'Pending Approval' });
      toast.success(`Invoice ${inv.invoiceNumber} submitted for approval.`, 'Success');
    } else if (action === 'Finalizing') {
      updateInvoice(inv.id, { status: 'Finalized' });
      toast.success(`Invoice ${inv.invoiceNumber} finalized successfully.`, 'Success');
    }
  };

  useEffect(() => {
    if (viewInvoice && actionParam === 'download') {
      if (!isPrintMode) {
        setIsPrintMode(true);
        toast.info(`Generating PDF for ${viewInvoice.invoiceNumber}...`, 'Please wait');
        
        setTimeout(() => {
          const element = document.getElementById('hidden-print-area');
          if (element) {
            const opt = {
              margin:       10,
              filename:     `${viewInvoice.invoiceNumber}.pdf`,
              image:        { type: 'jpeg' as const, quality: 0.98 },
              html2canvas:  { scale: 2, useCORS: true },
              jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
            };
            
            html2pdf().from(element).set(opt).save().then(() => {
              setIsPrintMode(false);
              toast.success('PDF Downloaded successfully!', 'Success');
              navigate('/invoicing-desk');
            });
          }
        }, 500);
      }
    }
  }, [viewInvoice, actionParam, isPrintMode, navigate, toast]);

  const tableColumns = [
    { key: 'invoiceNumber', label: 'INVOICE NO.', sortable: true },
    { key: 'clientName', label: 'CLIENT NAME', sortable: true, render: (row: any) => (
      !selectedClientId ? (
        <span onClick={() => navigate(`/invoicing-desk/${row.clientId}`)} style={{ color: '#0F172A', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
          {row.clientName}
        </span>
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
    { label: 'View Details', icon: 'ti-eye', onClick: (row: any) => handleAction(row.invoiceId || row.id, 'Viewing') },
    { label: 'Download PDF', icon: 'ti-file-download', onClick: (row: any) => handleAction(row.invoiceId || row.id, 'Downloading') },
    { label: 'Submit for Approval', icon: 'ti-send', onClick: (row: any) => handleAction(row.invoiceId || row.id, 'Submitting'), hidden: (row: any) => row.status !== 'Draft' },
    { label: 'Finalize', icon: 'ti-file-check', onClick: (row: any) => handleAction(row.invoiceId || row.id, 'Finalizing'), hidden: (row: any) => row.status !== 'Verified' }
  ];

  const filterOptions = ['Draft', 'Pending Approval', 'Verified', 'Finalized'];

  // --- Invoice Detail View ---
  if (viewInvoice) {
    if (actionParam !== 'download') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, width: 'fit-content' }}>
            <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i> Back
          </div>

          <Card>
            <div style={{ padding: '32px' }}>
              <h3 style={{ margin: '0 0 -8px', fontSize: '1rem', color: '#0F172A', fontWeight: 700 }}>Invoice Details</h3>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px', gap: '12px' }}>
                <Button 
                  title="Download PDF" 
                  variant="secondary" 
                  icon="ti-file-download"
                  onClick={() => handleAction(viewInvoice.id, 'Downloading')}
                />
                {viewInvoice.status === 'Verified' && (
                  <Button 
                    title="Finalize Invoice" 
                    variant="success" 
                    icon="ti-file-check"
                    onClick={() => handleAction(viewInvoice.id, 'Finalizing')}
                  />
                )}
                {viewInvoice.status === 'Draft' && (
                  <Button 
                    title="Submit for Approval" 
                    variant="primary" 
                    icon="ti-send"
                    onClick={() => handleAction(viewInvoice.id, 'Submitting')}
                  />
                )}
              </div>
              <InvoiceDocument invoice={viewInvoice} compact={false} />
            </div>
          </Card>
        </div>
      );
    }
  }

  // --- Client Detail View ---
  if (viewClient) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div onClick={() => navigate('/invoicing-desk')} style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, width: 'fit-content' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i> Back to Invoicing
        </div>
        
        <ClientInfoCard client={viewClient} />

        <Card>
          <div style={{ padding: '24px' }}>
            <DataTable 
              title="Client Invoices"
              data={enrichedInvoices}
              columns={tableColumns}
              actions={actions}
              rowKey="id"
              searchPlaceholder="Search by invoice no..."
              searchFields={['invoiceNumber']}
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
          </div>
        </Card>
      </div>
    );
  }

  // --- List View ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <TableContainer>
        <DataTable 
          title="Invoicing"
          data={enrichedInvoices}
          columns={tableColumns.filter(c => !['invoiceNumber', 'status'].includes(c.key as string))}
          rowKey="id"
          searchPlaceholder="Search by client..."
          searchFields={['clientName']}
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

      {/* Hidden Print Area for html2pdf */}
      {viewInvoice && actionParam === 'download' && isPrintMode && (
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
