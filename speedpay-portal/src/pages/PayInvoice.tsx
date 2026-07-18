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
  const [apiError, setApiError] = useState('');

  // Pre-select if navigated from "Pay now"
  useEffect(() => {
    if (location.state?.invoiceId) {
      setSelectedInvoiceId(location.state.invoiceId);
    }
  }, [location.state]);

  const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Due Soon' || i.status === 'Overdue');
  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);

  const handlePayMongoTrigger = async () => {
    if (!selectedInvoiceId || !selectedInvoice) return;

    setIsLoading(true);
    setApiError('');

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
        setReferenceNo(data.data.id || `PAY-${Math.floor(Math.random() * 9000000)}`);
        setShowModal(true);
        setStep(3);
      } else {
        const errMsg = data?.error || data?.errors?.[0]?.detail || 'Failed to create payment link.';
        console.error("PayMongo Error:", data);
        setApiError(errMsg);
        setShowModal(true);
        setStep(2); // Show error in modal
      }
    } catch (err: any) {
      setApiError(err.message || 'Network error.');
      setShowModal(true);
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const simulatePayMongoSuccess = () => {
    setReferenceNo(`PAY-${Math.floor(1000000 + Math.random() * 9000000)}`);
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

        {/* Step 3 */}
        {selectedInvoiceId && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0F172A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>3</span>
              Payment details
            </h3>
            
            <div style={{ background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '24px' }}>
              {paymentMethod === 'Bank Transfer' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <div style={{ color: '#64748B', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>Bank</div>
                    <div>Account name</div>
                    <div>Account number</div>
                    <div>Branch</div>
                  </div>
                  <div style={{ color: '#0F172A', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'right' }}>
                    <div>BDO Unibank</div>
                    <div>30 SpeedEx Courier & Forwarder Inc.</div>
                    <div>0012 3456 7890</div>
                    <div>Makati Ave Branch</div>
                  </div>
                </div>
              )}
              {paymentMethod !== 'Bank Transfer' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <div style={{ color: '#64748B', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>Account name</div>
                    <div>{paymentMethod} number</div>
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ width: '120px', height: '120px', border: '1px dashed #CBD5E1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '12px' }}>
                        QR Code
                      </div>
                    </div>
                  </div>
                  <div style={{ color: '#0F172A', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'right' }}>
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
                    {apiError ? (
                      <div style={{ color: '#EF4444', padding: '16px', background: '#FEF2F2', borderRadius: '8px', marginBottom: '16px' }}>
                        <strong>API Error:</strong> {apiError}
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                          <span style={{ color: '#64748B' }}>Invoice</span>
                          <span style={{ fontWeight: 600 }}>{selectedInvoice?.invoiceNumber}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '24px' }}>
                          <span style={{ color: '#64748B' }}>Method</span>
                          <span style={{ fontWeight: 600 }}>{paymentMethod}</span>
                        </div>
                        
                        <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', marginBottom: '32px' }}>
                          ₱{selectedInvoice?.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>

                        <button 
                          onClick={simulatePayMongoSuccess}
                          style={{ width: '100%', background: '#10B981', color: '#FFF', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Pay now (Simulated)
                        </button>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '12px' }}>Fallback simulated PayMongo checkout.</div>
                      </>
                    )}
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
