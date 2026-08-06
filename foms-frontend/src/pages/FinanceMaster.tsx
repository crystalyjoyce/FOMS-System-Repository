import React, { useState } from 'react';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/ToastContext';
import {
  SEEDED_CLIENTS,
  SEEDED_RATES,
  SEEDED_INVOICES,
  Client,
  BillingRate,
} from '../data/seed';
import { Card } from '../components/Card';
import { TableContainer } from '../components/TableContainer';

type MasterTab = 'clients' | 'rates' | 'invoices';

export const FinanceMaster: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<MasterTab>('clients');

  const tabs: { key: MasterTab; label: string; icon: string }[] = [
    { key: 'clients', label: 'Client Registry', icon: 'ti-users' },
    { key: 'rates', label: 'Billing Rates', icon: 'ti-calculator' },
    { key: 'invoices', label: 'Invoice Records', icon: 'ti-file-invoice' },
  ];

  // ── Client Registry ────────────────────────────────────────────────
  const clientColumns = [
    { key: 'id', label: 'CLIENT CODE', sortable: true },
    { key: 'name', label: 'CLIENT NAME', sortable: true },
    { key: 'contactPerson', label: 'CONTACT PERSON' },
    { key: 'phone', label: 'CONTACT NUMBER' },
    { key: 'region', label: 'REGION' },
    { key: 'address', label: 'BILLING ADDRESS' },
    { key: 'status', label: 'STATUS', render: (row: Client) => <StatusBadge status={row.status} /> },
  ];

  const clientActions = [
    { label: 'View Account', icon: 'ti-eye', onClick: (row: Client) => toast.info(`Viewing client profile for ${row.name}`, 'Account View') },
    { label: 'Edit Profile', icon: 'ti-pencil', onClick: (row: Client) => toast.info(`Editing client profile for ${row.name}`, 'Edit Profile') },
  ];

  // ── Billing Rates ──────────────────────────────────────────────────
  const enrichedRates = SEEDED_RATES.map(rate => {
    const client = SEEDED_CLIENTS.find(c => c.id === rate.clientId);
    return { ...rate, clientName: client?.name ?? 'Unknown' };
  });

  const rateColumns = [
    { key: 'id', label: 'RATE CODE', sortable: true },
    { key: 'clientName', label: 'CLIENT NAME', sortable: true },
    { key: 'region', label: 'SERVICE AREA' },
    { key: 'baseRate', label: 'BASE RATE (₱)', render: (row: any) => `₱${row.baseRate.toFixed(2)}` },
    { key: 'vatRate', label: 'VAT RATE', render: (row: any) => `${(row.vatRate * 100).toFixed(0)}%` },
    { key: 'surchargeRate', label: 'SURCHARGE', render: (row: any) => `${(row.surchargeRate * 100).toFixed(0)}%` },
    { key: 'effectiveDate', label: 'EFFECTIVE DATE', render: (row: any) => new Date(row.effectiveDate).toLocaleDateString('en-PH') },
  ];

  const rateActions = [
    { label: 'View Rate Details', icon: 'ti-eye', onClick: (row: BillingRate) => toast.info(`Viewing details for rate ${row.id}`, 'Rate View') },
    { label: 'Update Rate', icon: 'ti-pencil', onClick: (row: BillingRate) => toast.info(`Opening edit modal for rate ${row.id}`, 'Update Rate') },
  ];

  // ── Invoice Records ────────────────────────────────────────────────
  const enrichedInvoices = SEEDED_INVOICES.map(inv => {
    const client = SEEDED_CLIENTS.find(c => c.id === inv.clientId);
    return { ...inv, clientName: client?.name ?? 'Unknown', waybillCount: inv.waybillIds.length };
  });

  const invoiceColumns = [
    { key: 'invoiceNumber', label: 'INVOICE NO.', sortable: true },
    { key: 'clientName', label: 'CLIENT NAME', sortable: true },
    { key: 'createdAt', label: 'DATE CREATED', render: (row: any) => new Date(row.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) },
    { key: 'waybillCount', label: 'WAYBILLS' },
    { key: 'totalAmount', label: 'TOTAL (₱)', render: (row: any) => `₱${row.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
    { key: 'status', label: 'STATUS', render: (row: any) => <StatusBadge status={row.status} /> },
  ];

  const invoiceActions = [
    { label: 'View Invoice', icon: 'ti-eye', onClick: (row: any) => toast.info(`Viewing full details for ${row.invoiceNumber}`, 'Invoice View') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Tab Navigation */}
      <Card noPadding style={{ padding: '8px', display: 'inline-flex', gap: '4px' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              background: activeTab === tab.key ? '#0F172A' : 'transparent',
              color: activeTab === tab.key ? '#FFFFFF' : '#64748B',
            }}
          >
            <i className={`ti ${tab.icon}`} style={{ fontSize: '16px' }} />
            {tab.label}
          </button>
        ))}
      </Card>

      {/* Tab Content */}
      <TableContainer>
        {activeTab === 'clients' && (
          <DataTable
            title={tabs.find(t => t.key === activeTab)?.label}
            data={SEEDED_CLIENTS}
            columns={clientColumns}
            actions={clientActions}
            rowKey="id"
            searchPlaceholder="Search clients..."
            searchFields={['id', 'name', 'contactPerson', 'region'] as any}
            columnToggle={true}
            densityToggle={true}
            exportable={false}
          />
        )}

        {activeTab === 'rates' && (
          <DataTable
            title={tabs.find(t => t.key === activeTab)?.label}
            data={enrichedRates}
            columns={rateColumns}
            actions={rateActions}
            rowKey="id"
            searchPlaceholder="Search rates..."
            searchFields={['clientName', 'region'] as any}
            columnToggle={true}
            densityToggle={true}
            exportable={false}
          />
        )}

        {activeTab === 'invoices' && (
          <DataTable
            title={tabs.find(t => t.key === activeTab)?.label}
            data={enrichedInvoices}
            columns={invoiceColumns}
            actions={invoiceActions}
            rowKey="id"
            searchPlaceholder="Search invoices..."
            searchFields={['invoiceNumber', 'clientName', 'status'] as any}
            columnToggle={true}
            densityToggle={true}
            exportable={false}
          />
        )}
      </TableContainer>
    </div>
  );
};

export default FinanceMaster;
