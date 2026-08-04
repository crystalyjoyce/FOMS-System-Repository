import React, { useState } from 'react';
import { useClientContext } from '../context/ClientContext';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export const MyInvoices: React.FC = () => {
  const { invoices } = useClientContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.routeArea.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Unpaid': return <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>Unpaid</span>;
      case 'Due Soon': return <span style={{ background: '#FEF3C7', color: '#B45309', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>Due Soon</span>;
      case 'Overdue': return <span style={{ background: '#FEE2E2', color: '#B91C1C', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>Overdue</span>;
      case 'Paid': return <span style={{ background: '#D1FAE5', color: '#047857', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>Paid</span>;
      case 'Pending Validation': return <span style={{ background: '#F3E8FF', color: '#7E22CE', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>Pending Validation</span>;
      default: return <span style={{ background: '#F1F5F9', color: '#475569', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>{status}</span>;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontFamily: '"Inter", sans-serif' }}>
      
      <div style={{ background: '#FFF', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', padding: '24px' }}>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by invoice number or route..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 16px 10px 44px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: '150px', padding: '10px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', outline: 'none', background: '#FFF', cursor: 'pointer' }}
          >
            <option value="All">All</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Due Soon">Due Soon</option>
            <option value="Overdue">Overdue</option>
            <option value="Pending Validation">Pending Validation</option>
            <option value="Paid">Paid</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>INVOICE ID</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>ROUTE / DELIVERY AREA</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>AMOUNT</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>DUE DATE</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>STATUS</th>
                <th style={{ padding: '16px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#3B82F6' }}>{inv.invoiceNumber}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#0F172A' }}>{inv.routeArea}</td>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>₱{inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#0F172A' }}>{new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td style={{ padding: '16px' }}>{getStatusBadge(inv.status)}</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    {(inv.status === 'Unpaid' || inv.status === 'Due Soon' || inv.status === 'Overdue') && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate('/pay', { state: { invoiceId: inv.id } }); }}
                        style={{ background: '#0EA5E9', color: '#FFF', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Pay now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
                    No invoices found.
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
