import React from 'react';
import { useClientContext } from '../context/ClientContext';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

export const PaymentHistory: React.FC = () => {
  const { payments } = useClientContext();

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Pending Validation': return <span style={{ background: '#F3E8FF', color: '#7E22CE', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>Pending Validation</span>;
      case 'Validated': return <span style={{ background: '#D1FAE5', color: '#047857', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>Validated</span>;
      case 'Rejected': return <span style={{ background: '#FEE2E2', color: '#B91C1C', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>Rejected</span>;
      default: return <span style={{ background: '#F1F5F9', color: '#475569', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>{status}</span>;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontFamily: '"Inter", sans-serif' }}>
      
      <div style={{ background: '#FFF', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', padding: '24px' }}>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>DATE SUBMITTED</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>INVOICE ID</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>REFERENCE NO.</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>METHOD</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>AMOUNT</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>STATUS</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(pay => (
                <tr key={pay.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#64748B' }}>
                    {new Date(pay.dateSubmitted).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#3B82F6' }}>{pay.invoiceId}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#0F172A', fontFamily: 'monospace' }}>{pay.referenceNo}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#0F172A' }}>{pay.paymentMethod}</td>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>₱{pay.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '16px' }}>{getStatusBadge(pay.status)}</td>
                  <td style={{ padding: '16px', fontSize: '13px' }}>
                    {pay.status === 'Validated' && pay.officialReceipt && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 500 }}>
                        <FileText size={14} /> {pay.officialReceipt}
                      </div>
                    )}
                    {pay.status === 'Rejected' && pay.rejectionReason && (
                      <div style={{ color: '#EF4444' }}>
                        {pay.rejectionReason}
                      </div>
                    )}
                    {pay.status === 'Pending Validation' && (
                      <div style={{ color: '#94A3B8' }}>Awaiting Finance</div>
                    )}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
                    No payment history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </motion.div>
  );
};
