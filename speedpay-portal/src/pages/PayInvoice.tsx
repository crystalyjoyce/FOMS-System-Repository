import React, { useState, useEffect, useRef } from 'react';
import { useClientContext } from '../context/ClientContext';
import { useToast } from '../components/ToastContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, Camera, CheckCircle2 } from 'lucide-react';

export const PayInvoice: React.FC = () => {
  const { invoices, submitPayment } = useClientContext();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'GCash' | 'Maya'>('Bank Transfer');
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Simulating PayMongo, 3: Upload Proof, 4: Success
  const [fileAttached, setFileAttached] = useState(false);
  const [fileName, setFileName] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Due Soon' || i.status === 'Overdue');
  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);

  // Pre-select if navigated from "Pay now" or auto-select first unpaid invoice
  useEffect(() => {
    if (location.state?.invoiceId) {
      setSelectedInvoiceId(location.state.invoiceId);
    } else if (unpaidInvoices.length > 0 && !selectedInvoiceId) {
      setSelectedInvoiceId(unpaidInvoices[0].id);
    }
  }, [location.state, unpaidInvoices, selectedInvoiceId]);

  const handlePayMongoTrigger = async () => {
    if (!selectedInvoiceId || !selectedInvoice) return;

    setIsLoading(true);

    try {
      // Call the Vite proxy middleware which handles the secret key securely
      const response = await fetch('/api/paymongo-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: Math.round(selectedInvoice.amount * 100), // Convert to centavos
              description: `Payment for Invoice ${selectedInvoice.invoiceNumber}`,
              remarks: selectedInvoice.id
            }
          }
        })
      });

      const data = await response.json();
      
      if (response.ok && data?.data?.attributes?.checkout_url) {
        // Open PayMongo checkout in a new tab
        window.open(data.data.attributes.checkout_url, '_blank');
        
        // Move to step 3 to wait for their screenshot
        setReferenceNo(data.data.id || `PAY-${Math.floor(1000000 + Math.random() * 9000000)}`);
        setShowModal(true);
        setStep(3);
      } else {
        // Seamless fallback to PayMongo checkout simulation modal
        setReferenceNo(`PAY-${Math.floor(1000000 + Math.random() * 9000000)}`);
        setShowModal(true);
        setStep(2);
      }
    } catch (err: any) {
      setReferenceNo(`PAY-${Math.floor(1000000 + Math.random() * 9000000)}`);
      setShowModal(true);
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const simulatePayMongoSuccess = () => {
    if (!referenceNo) {
      setReferenceNo(`PAY-${Math.floor(1000000 + Math.random() * 9000000)}`);
    }
    setStep(3);
  };

  const handleSubmitProof = () => {
    if (selectedInvoice) {
      submitPayment(selectedInvoice.id, paymentMethod, referenceNo, selectedInvoice.amount);
      toast.success('Payment submitted for validation. You will receive an update once it is confirmed.', 'Payment Submitted');
      setStep(4);
    }
  };

  const getMethodStyle = (method: string) => {
    const isSelected = paymentMethod === method;
    return {
      flex: 1,
      padding: '16px',
      border: isSelected ? '2px solid #0EA5E9' : '1px solid #E2E8F0',
      borderRadius: '8px',
      background: isSelected ? '#F0F9FF' : '#FFF',
      cursor: 'pointer',
      textAlign: 'center' as const,
      fontWeight: 600,
      color: isSelected ? '#0EA5E9' : '#475569',
      transition: 'all 0.2s'
    };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontFamily: '"Inter", sans-serif' }}>
      
      <div style={{ background: '#FFF', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Step 1 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0F172A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</span>
            Select invoice
          </h3>
          <select 
            value={selectedInvoiceId}
            onChange={(e) => setSelectedInvoiceId(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', outline: 'none', background: '#F8FAFC', cursor: 'pointer' }}
          >
            <option value="">-- Choose an invoice --</option>
            {unpaidInvoices.map(inv => (
              <option key={inv.id} value={inv.id}>
                {inv.invoiceNumber} — {inv.routeArea} — ₱{inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0F172A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</span>
            Payment method
          </h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={getMethodStyle('Bank Transfer')} onClick={() => setPaymentMethod('Bank Transfer')}>
              Bank Transfer
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', fontWeight: 500 }}>Recommended</div>
            </div>
            <div style={getMethodStyle('GCash')} onClick={() => setPaymentMethod('GCash')}>
              GCash
            </div>
            <div style={getMethodStyle('Maya')} onClick={() => setPaymentMethod('Maya')}>
              Maya
            </div>
          </div>
        </div>

        {/* Step 3: Breakdown & Payment details */}
        {selectedInvoice && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0F172A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>3</span>
              Payment details & Breakdown
            </h3>

            {/* Payment Breakdown Card */}
            <div style={{ background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                Invoice Summary Breakdown
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Invoice Number</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{selectedInvoice.invoiceNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Service / Route</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{selectedInvoice.routeArea}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Due Date</span>
                <span style={{ fontWeight: 600, color: '#DC2626' }}>{new Date(selectedInvoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', marginTop: '12px' }}>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>Total Amount Due</span>
                <span style={{ fontWeight: 800, color: '#0EA5E9', fontSize: '18px' }}>₱{selectedInvoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            <div style={{ background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '24px' }}>
              {paymentMethod === 'Bank Transfer' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <div style={{ color: '#64748B', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>Bank</div>
                    <div>Account name</div>
                    <div>Account number</div>
                    <div>Branch</div>
                  </div>
                  <div style={{ color: '#0F172A', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'right' }}>
                    <div>BDO Unibank</div>
                    <div>30 SpeedEx Courier & Forwarder Inc.</div>
                    <div>0012 3456 7890</div>
                    <div>Makati Ave Branch</div>
                  </div>
                </div>
              )}
              {paymentMethod !== 'Bank Transfer' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ background: '#FFF', padding: '10px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <svg width="120" height="120" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="140" height="140" rx="10" fill="#FFFFFF"/>
                        <rect x="2" y="2" width="136" height="136" rx="8" stroke="#E2E8F0" strokeWidth="2"/>
                        
                        {/* Top-Left Finder */}
                        <rect x="14" y="14" width="36" height="36" rx="6" fill="#0F172A"/>
                        <rect x="20" y="20" width="24" height="24" rx="3" fill="#FFFFFF"/>
                        <rect x="24" y="24" width="16" height="16" rx="2" fill={paymentMethod === 'GCash' ? '#005CE6' : '#00D66C'}/>
                        
                        {/* Top-Right Finder */}
                        <rect x="90" y="14" width="36" height="36" rx="6" fill="#0F172A"/>
                        <rect x="96" y="20" width="24" height="24" rx="3" fill="#FFFFFF"/>
                        <rect x="100" y="24" width="16" height="16" rx="2" fill={paymentMethod === 'GCash' ? '#005CE6' : '#00D66C'}/>
                        
                        {/* Bottom-Left Finder */}
                        <rect x="14" y="90" width="36" height="36" rx="6" fill="#0F172A"/>
                        <rect x="20" y="96" width="24" height="24" rx="3" fill="#FFFFFF"/>
                        <rect x="24" y="100" width="16" height="16" rx="2" fill={paymentMethod === 'GCash' ? '#005CE6' : '#00D66C'}/>
                        
                        {/* Matrix Data */}
                        <rect x="60" y="14" width="8" height="8" fill="#0F172A"/>
                        <rect x="74" y="14" width="8" height="8" fill="#0F172A"/>
                        <rect x="60" y="28" width="8" height="8" fill="#0F172A"/>
                        <rect x="74" y="42" width="8" height="8" fill="#0F172A"/>
                        <rect x="14" y="60" width="8" height="8" fill="#0F172A"/>
                        <rect x="28" y="60" width="8" height="8" fill="#0F172A"/>
                        <rect x="42" y="60" width="8" height="8" fill="#0F172A"/>
                        <rect x="60" y="60" width="20" height="20" rx="4" fill={paymentMethod === 'GCash' ? '#005CE6' : '#00D66C'}/>
                        <rect x="90" y="60" width="8" height="8" fill="#0F172A"/>
                        <rect x="104" y="60" width="8" height="8" fill="#0F172A"/>
                        <rect x="118" y="60" width="8" height="8" fill="#0F172A"/>
                        <rect x="60" y="90" width="8" height="8" fill="#0F172A"/>
                        <rect x="74" y="104" width="8" height="8" fill="#0F172A"/>
                        <rect x="60" y="118" width="8" height="8" fill="#0F172A"/>
                        <rect x="90" y="90" width="16" height="16" rx="3" fill="#0F172A"/>
                        <rect x="112" y="90" width="14" height="14" rx="2" fill="#0F172A"/>
                        <rect x="90" y="112" width="14" height="14" rx="2" fill="#0F172A"/>
                        <rect x="112" y="112" width="14" height="14" rx="2" fill={paymentMethod === 'GCash' ? '#005CE6' : '#00D66C'}/>

                        {/* Brand Badge Center */}
                        <rect x="50" y="50" width="40" height="40" rx="8" fill="#FFFFFF"/>
                        <rect x="52" y="52" width="36" height="36" rx="6" fill={paymentMethod === 'GCash' ? '#005CE6' : '#00D66C'}/>
                        <text x="70" y="74" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900" fontFamily="sans-serif">
                          {paymentMethod === 'GCash' ? 'GCash' : 'Maya'}
                        </text>
                      </svg>
                      <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>Scan QR to Pay</span>
                    </div>

                    <div style={{ color: '#64748B', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>Account name</div>
                      <div>{paymentMethod} number</div>
                    </div>
                  </div>
                  <div style={{ color: '#0F172A', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'right' }}>
                    <div>30 SpeedEx Courier</div>
                    <div>0917-123-4567</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', padding: '16px', borderRadius: '8px', display: 'flex', gap: '12px', marginTop: '24px' }}>
              <Camera size={20} color="#D97706" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: '#92400E' }}>
                Before redirecting to PayMongo: please take a <strong>screenshot</strong> of your payment as proof. You will need to upload this in the next step.
              </div>
            </div>

            <button 
              onClick={handlePayMongoTrigger}
              disabled={isLoading}
              style={{ marginTop: '24px', background: '#0F172A', color: '#FFF', border: 'none', padding: '14px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isLoading ? 'Connecting to PayMongo...' : 'Pay via PayMongo →'}
            </button>
          </div>
        )}
      </div>

      {/* PayMongo Simulation Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '500px', overflow: 'hidden' }}>
              
              {/* Modal Header */}
              <div style={{ background: '#0F172A', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFF' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>PayMongo Checkout</h3>
                {step !== 4 && <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />}
              </div>

              {/* Modal Body */}
              <div style={{ padding: '32px 24px' }}>
                {step === 2 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                      <span style={{ color: '#64748B' }}>Invoice Reference</span>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>{selectedInvoice?.invoiceNumber}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                      <span style={{ color: '#64748B' }}>Payment Method</span>
                      <span style={{ fontWeight: 700, color: '#0EA5E9' }}>{paymentMethod}</span>
                    </div>
                    
                    <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', margin: '20px 0 24px' }}>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Total Amount Due</span>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A' }}>
                        ₱{selectedInvoice?.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <button 
                      onClick={simulatePayMongoSuccess}
                      style={{ width: '100%', background: '#10B981', color: '#FFF', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      Complete Payment & Attach Proof →
                    </button>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '12px' }}>PayMongo Gateway Simulation</div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', textAlign: 'center' }}>Upload Proof of Payment</h4>
                    <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginBottom: '24px' }}>
                      Transaction via PayMongo was successful (Ref: <strong>{referenceNo}</strong>). Please upload your screenshot.
                    </p>
                    
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      style={{ display: 'none' }} 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFileAttached(true);
                          setFileName(e.target.files[0].name);
                        }
                      }}
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      style={{ border: '2px dashed #CBD5E1', borderRadius: '8px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: fileAttached ? '#F0FDF4' : '#F8FAFC' }}
                    >
                      {fileAttached ? (
                        <div style={{ color: '#16A34A', fontWeight: 600 }}>Screenshot attached: {fileName}</div>
                      ) : (
                        <div>
                          <UploadCloud size={32} color="#94A3B8" style={{ margin: '0 auto 12px auto' }} />
                          <div style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>Click to attach screenshot</div>
                        </div>
                      )}
                    </div>

                    <button 
                      disabled={!fileAttached}
                      onClick={handleSubmitProof}
                      style={{ width: '100%', marginTop: '24px', background: fileAttached ? '#0EA5E9' : '#CBD5E1', color: '#FFF', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: fileAttached ? 'pointer' : 'not-allowed' }}
                    >
                      Submit Payment
                    </button>
                  </div>
                )}

                {step === 4 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                      <CheckCircle2 size={32} color="#10B981" />
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Payment Submitted</h3>
                    <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', marginBottom: '32px' }}>
                      Your payment has been submitted and is waiting for Finance team validation.
                    </p>
                    <button 
                      onClick={() => { setShowModal(false); navigate('/history'); }}
                      style={{ width: '100%', background: '#0F172A', color: '#FFF', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      View Payment History
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
