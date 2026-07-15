import React from 'react';
import Button from '../components/Buttons';
import { DataTable } from '../components/DataTable';
import { SEEDED_RATES, SEEDED_CLIENTS, BillingRate } from '../data/seed';
import { TableContainer } from '../components/TableContainer';

export const RateConfiguration: React.FC = () => {
  const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null);

  // Combine Rates with Client Data
  let ratesWithClientData: any[] = [];
  if (selectedClientId) {
    ratesWithClientData = SEEDED_RATES.filter(r => r.clientId === selectedClientId).map(rate => {
      const client = SEEDED_CLIENTS.find(c => c.id === rate.clientId);
      return {
        ...rate,
        clientName: client ? client.name : 'Unknown Client',
        vatStatus: client ? client.vatStatus : 'Non-VATable',
        vatRate: client && client.vatRate !== null ? `${(client.vatRate * 100).toFixed(0)}%` : '—',
        agreedSchedule: client ? client.billingSchedule : 'Monthly'
      };
    });
  } else {
    const grouped = new Map<string, any[]>();
    SEEDED_RATES.forEach(rate => {
      if (!grouped.has(rate.clientId)) grouped.set(rate.clientId, []);
      grouped.get(rate.clientId)!.push(rate);
    });
    ratesWithClientData = Array.from(grouped.entries()).map(([clientId, recs]) => {
      const client = SEEDED_CLIENTS.find(c => c.id === clientId);
      const statuses = Array.from(new Set(recs.map(r => r.region)));
      const region = statuses.length === 1 ? statuses[0] : 'Mixed';
      
      return {
        id: clientId, 
        clientId,
        clientName: client ? client.name : 'Unknown Client',
        region: region,
        baseRate: recs.reduce((sum, r) => sum + r.baseRate, 0),
        vatStatus: client ? client.vatStatus : 'Non-VATable',
        vatRate: client && client.vatRate !== null ? `${(client.vatRate * 100).toFixed(0)}%` : '—',
        agreedSchedule: client ? client.billingSchedule : 'Monthly',
        isGrouped: true
      };
    });
  }

  const tableColumns = [
    { key: 'clientName', label: 'CLIENT NAME', render: (row: any) => (
      !selectedClientId ? (
        <button onClick={() => setSelectedClientId(row.clientId)} style={{ background: 'none', border: 'none', padding: 0, color: '#3B82F6', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
          {row.clientName}
        </button>
      ) : (
        <span style={{ fontWeight: 600 }}>{row.clientName}</span>
      )
    ) },
    { key: 'region', label: 'SERVICE AREA' },
    { 
      key: 'baseRate', 
      label: 'BASE FREIGHT RATE',
      render: (row: any) => `₱${row.baseRate.toFixed(2)}`
    },
    { key: 'vatStatus', label: 'VAT STATUS' },
    { key: 'vatRate', label: 'VAT RATE' },
    { key: 'agreedSchedule', label: 'AGREED SCHEDULE' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <TableContainer>
        <DataTable 
          title="Client Rates"
          data={ratesWithClientData}
          columns={selectedClientId ? tableColumns : tableColumns.filter(c => !['region'].includes(c.key as string))}
          rowKey="id"
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
    </div>
  );
};

export default RateConfiguration;
