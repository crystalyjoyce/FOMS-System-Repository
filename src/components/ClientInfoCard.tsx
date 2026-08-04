import React from 'react';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';

export interface ClientData {
  id: string;
  name: string;
  contactPerson?: string;
  address: string;
  region: string;
  billingSchedule: string;
  status: string;
}

export const ClientInfoCard: React.FC<{ client: ClientData }> = ({ client }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ background: '#0F172A', color: 'white', padding: '32px 24px', borderRadius: '12px' }}>
        <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Company Code</p>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{client.id} · {client.name}</h2>
        <div style={{ width: 'fit-content' }}>
          <StatusBadge status={client.status} />
        </div>
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
    </div>
  );
};
