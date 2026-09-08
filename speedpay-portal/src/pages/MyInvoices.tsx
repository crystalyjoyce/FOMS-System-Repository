import React, { useState } from 'react';
import { useClientContext } from '../context/ClientContext';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';

// Helper to convert number to words for PHP amounts
function numberToWords(amount: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convertWhole = (num: number): string => {
    if (num < 20) return units[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? '-' + units[num % 10] : '');
    if (num < 1000) return units[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convertWhole(num % 100) : '');
    if (num < 1000000) return convertWhole(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convertWhole(num % 1000) : '');
    return convertWhole(Math.floor(num / 1000000)) + ' Million' + (num % 1000000 !== 0 ? ' ' + convertWhole(num % 1000000) : '');
  };

  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);
  
  if (amount === 0) return 'Zero Pesos Only';
  let words = convertWhole(whole) + ' Pesos';
  if (cents > 0) words += ` and ${cents}/100`;
  return words + ' Only';
}

export const MyInvoices: React.FC = () => {
  const { invoices, payments, user } = useClientContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [receiptData, setReceiptData] = useState<{ invoice: any, payment: any } | null>(null);

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
                    {inv.status === 'Paid' && (
                      <button 
                        onClick={(e) => { 
                           e.stopPropagation(); 
                           const payment = payments.find(p => p.invoiceId === inv.id && p.status === 'Validated') || {
                             id: 'TEST-PAYREF-' + Date.now().toString().slice(-5),
                             paymentMethod: 'Mock Payment',
                             dateSubmitted: new Date().toISOString(),
                             status: 'Validated'
                           };
                           setReceiptData({ invoice: inv, payment });
                        }}
                        style={{ background: '#10B981', color: '#FFF', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        View Receipt
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

      {/* HTML Receipt Modal */}
      {receiptData && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px', overflowY: 'auto' }}
          onClick={() => setReceiptData(null)}
        >
          <div 
            style={{ background: '#FFF', borderRadius: '12px', padding: '24px', maxWidth: '850px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', margin: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0F172A' }}>Official Receipt Preview</h3>
              <button onClick={() => setReceiptData(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748B' }}>&times;</button>
            </div>
            
            {/* The printable receipt area */}
            <div id="receipt-capture-area" style={{ background: '#FFF', padding: '40px', border: '1px solid #E2E8F0', color: '#000', fontFamily: 'Arial, sans-serif' }}>
              
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>OFFICIAL RECEIPT</h1>
                <p style={{ color: 'red', margin: '8px 0 0', fontWeight: 'bold', fontSize: '16px' }}>FOR SYSTEM TESTING ONLY — NOT A VALID RECEIPT</p>
              </div>

              {/* Company Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px' }}>SPEEDEX Logistics Services</div>
                  <div style={{ fontSize: '14px' }}>123 Finance Avenue, Quezon City, Philippines</div>
                  <div style={{ fontSize: '14px' }}>TIN: 123-456-789-000</div>
                  <div style={{ fontSize: '14px' }}>Contact: (02) 8123-4567</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '14px' }}>
                  <div style={{ marginBottom: '4px' }}>Official Receipt No.: <strong style={{ marginLeft: '8px' }}>{receiptData.payment.officialReceipt || `OR-TEST-${Math.floor(Math.random()*10000).toString().padStart(5, '0')}`}</strong></div>
                  <div>Date: <strong style={{ marginLeft: '8px' }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
                </div>
              </div>

              {/* Details Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '14px' }}>
                <tbody>
                  {[
                    ['Received From:', receiptData.invoice.clientName || user?.companyName || user?.name || 'Unknown Client'],
                    ['Client Code:', user?.id || 'CL-UNKNOWN'],
                    ['Invoice No.:', receiptData.invoice.invoiceNumber],
                    ['Waybill No.:', `WB-TEST-${receiptData.invoice.invoiceNumber.slice(-5)}`],
                    ['Amount Received:', `₱${receiptData.invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
                    ['Amount in Words:', numberToWords(receiptData.invoice.amount)],
                    ['Payment Method:', receiptData.payment.paymentMethod || 'Bank Transfer'],
                    ['Payment Reference No.:', receiptData.payment.referenceNo || receiptData.payment.id],
                    ['Payment Status:', receiptData.payment.status],
                    ['Invoice Status:', receiptData.invoice.status],
                    ['Outstanding Balance:', '₱0.00']
                  ].map(([label, value], idx) => (
                    <tr key={idx}>
                      <td style={{ border: '1px solid #000', padding: '8px 12px', fontWeight: 'bold', width: '35%' }}>{label}</td>
                      <td style={{ border: '1px solid #000', padding: '8px 12px' }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Purpose Box */}
              <div style={{ border: '1px solid #000', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Purpose of Payment:</div>
                <div style={{ fontSize: '14px' }}>Full payment for logistics and delivery services covered by Invoice No. {receiptData.invoice.invoiceNumber}.</div>
              </div>

              {/* Signatures Box */}
              <div style={{ border: '1px solid #000', padding: '12px', marginBottom: '40px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 'bold', width: '35%', paddingBottom: '8px' }}>Received / Validated By:</td>
                      <td style={{ paddingBottom: '8px' }}>Test Accountant</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', paddingBottom: '8px' }}>Validation Date:</td>
                      <td style={{ paddingBottom: '8px' }}>{new Date(receiptData.payment.dateSubmitted || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', verticalAlign: 'top' }}>Remarks:</td>
                      <td>Payment successfully validated and linked to the corresponding invoice and Accounts Receivable record.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '24px' }}>
                <div style={{ textAlign: 'center', width: '250px' }}>
                  <div style={{ borderBottom: '1px solid #000', height: '24px', marginBottom: '8px' }}></div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Received By</div>
                </div>
                <div style={{ textAlign: 'center', width: '250px' }}>
                  <div style={{ borderBottom: '1px solid #000', height: '24px', marginBottom: '8px' }}></div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Authorized Signature</div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginTop: '16px' }}>
                SYSTEM-GENERATED TEST RECEIPT
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button onClick={() => setReceiptData(null)} style={{ background: '#F1F5F9', color: '#475569', border: 'none', padding: '8px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              <button 
                onClick={async () => {
                  const el = document.getElementById('receipt-capture-area');
                  if (!el) return;
                  const canvas = await html2canvas(el, { scale: 2 });
                  const dataUrl = canvas.toDataURL('image/png');
                  const a = document.createElement('a');
                  a.href = dataUrl;
                  a.download = `Official-Receipt-${receiptData.invoice.invoiceNumber}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                style={{ background: '#3B82F6', color: '#FFF', border: 'none', padding: '8px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Download Receipt Image
              </button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
};
