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
  );
};
