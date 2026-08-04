import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/Buttons';
import { DataTable } from '../components/DataTable';
import { SEEDED_RATES, SEEDED_CLIENTS, BillingRate } from '../data/seed';
import { TableContainer } from '../components/TableContainer';
import { ClientInfoCard } from '../components/ClientInfoCard';
import { Card } from '../components/Card';

export const RateConfiguration: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectedClientId = id;

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
        <span onClick={() => navigate(`/rate-configuration/${row.clientId}`)} style={{ color: '#0F172A', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
          {row.clientName}
        </span>
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

  if (selectedClientId && SEEDED_CLIENTS.find(c => c.id === selectedClientId)) {
    const client = SEEDED_CLIENTS.find(c => c.id === selectedClientId)!;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div onClick={() => navigate('/rate-configuration')} style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, width: 'fit-content' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i> Back to Summary
        </div>
        
        <ClientInfoCard client={client} />

        <Card>
          <div style={{ padding: '24px' }}>
            <DataTable 
              title="Client Rates"
              data={ratesWithClientData}
              columns={tableColumns}
              rowKey="id"
              columnToggle={true}
              densityToggle={true}
              exportable={false}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <TableContainer>
        <DataTable 
          title="Client Rates"
          data={ratesWithClientData}
          columns={tableColumns.filter(c => !['region'].includes(c.key as string))}
          rowKey="id"
          columnToggle={true}
          densityToggle={true}
          exportable={false}
        />
      </TableContainer>
    </div>
  );
};

export default RateConfiguration;
