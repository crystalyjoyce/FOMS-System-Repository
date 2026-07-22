import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiHeader } from '../components/AiHeader';
import { DecisionSupportNotice } from '../components/DecisionSupportNotice';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/ToastContext';
import { 
  UploadCloud, FileText, AlertTriangle, CheckCircle, RefreshCw, X, 
  Sparkles, ExternalLink, History, Eye, ArrowRight 
} from 'lucide-react';

export const DocumentCheck: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [hasUploaded, setHasUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [actionDone, setActionDone] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Sample Previous AI Scans History
  const previousScanHistory = [
    {
      id: 'SCAN-8821',
      document_type: 'Official Receipt (OR)',
      reference: 'OR-2024-0012345',
      scan_date: '7/21/2026, 3:05 PM',
      client_name: 'ABC Trading Corporation',
      amount: '₱15,250.00',
      ai_result: 'Potential Duplicate (98%)',
      status_variant: '90+ Days',
      matched_with: 'FOMS-PAY-99812'
    },
    {
      id: 'SCAN-8819',
      document_type: 'Invoice Record',
      reference: 'INV-2024-00892',
      scan_date: '7/20/2026, 2:15 PM',
      client_name: 'Global Logistics Inc.',
      amount: '₱42,800.00',
      ai_result: 'Unique (0% Match)',
      status_variant: 'Active',
      matched_with: 'None'
    },
    {
      id: 'SCAN-8814',
      document_type: 'SpeedPay Reference',
      reference: 'SP-99812-2024',
      scan_date: '7/19/2026, 11:30 AM',
      client_name: 'FastFreight Express',
      amount: '₱8,500.00',
      ai_result: 'Similar Match (85%)',
      status_variant: '60 - 90 Days',
      matched_with: 'SP-99810-2024'
    },
    {
      id: 'SCAN-8805',
      document_type: 'Waybill Manifest',
      reference: 'WBL-2024-556677',
      scan_date: '7/18/2026, 4:45 PM',
      client_name: 'Metro Retail Co.',
      amount: '₱19,300.00',
      ai_result: 'Unique (0% Match)',
      status_variant: 'Active',
      matched_with: 'None'
    }
  ];

  const handleDemoUpload = () => {
    setAnalyzing(true);
    setActionDone(null);
    setTimeout(() => {
      setAnalyzing(false);
      setHasUploaded(true);
      toast.info('AI extracted parameters & checked database records.', 'Document Scanned');
    }, 700);
  };

  const handleReset = () => {
    setHasUploaded(false);
    setAnalyzing(false);
    setActionDone(null);
  };

  const handleAction = (decision: string) => {
    setActionDone(decision);

    const isDuplicate = decision === 'Mark as Duplicate';
    const statusVal = isDuplicate ? 'Reviewed' : 'Dismissed';
    const remarksVal = isDuplicate 
      ? 'Extracted document marked as duplicate during scanning check.' 
      : 'Extracted document marked as unique / safe after validation.';

    const newHistoryEntry = {
      id: Date.now(),
      review_date: new Date().toISOString(),
      target_type: 'DUPLICATE_ALERT',
      target_id: 'OR-2024-0012345',
      reviewer_username: 'Maria Santos',
      reviewer_role: 'Financial Manager',
      decision: statusVal,
      remarks: remarksVal,
      recommended_action: isDuplicate ? 'CancelDuplicateSubmission' : 'DismissAlert',
    };

    // Save entry to LocalStorage so it instantly reflects in Review History (/ai/review-history)
    try {
      const existingStr = localStorage.getItem('foms_review_history');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem('foms_review_history', JSON.stringify([newHistoryEntry, ...existing]));
    } catch (e) {
      console.error(e);
    }

    toast.success(`Document marked as ${isDuplicate ? 'duplicate' : 'unique'}. Saved to Review History!`, 'Action Logged');

    // Redirect to the Duplicate Alerts table (Tab 1) where this scanned row is rendered
    setTimeout(() => {
      navigate('/ai/duplicate-alerts?status=Pending Review');
    }, 450);
  };

  const handleManualReview = () => {
    toast.info('Queued for manual verification. Opening Duplicate Alerts comparison view...', 'Redirecting');
    setTimeout(() => {
      navigate('/ai/duplicate-alerts?action=compare&or=OR-2024-0012345');
    }, 400);
  };

  const handleLoadHistoryItem = (item: any) => {
    setShowHistoryModal(false);
    handleDemoUpload();
  };

  return (
    <div className="main-content fade-in">
      <AiHeader title="Duplicate Detection" />

      <div className="page-container">
        <DecisionSupportNotice />

        {/* Page Description Header with History Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ color: 'var(--ts)', fontSize: '14px', margin: 0 }}>
              Check ORs, invoices, waybills, and SpeedPay references for duplicates before validating.
            </p>
          </div>
          <button
            onClick={() => setShowHistoryModal(true)}
            className="btn btn-outline"
            style={{ height: '38px', padding: '0 16px', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <History size={16} style={{ color: 'var(--teal)' }} />
            <span>Scan History</span>
          </button>
        </div>

        {/* State 1: Dropzone Upload */}
        {!hasUploaded && !analyzing && (
          <div
            className="card"
            style={{
              padding: '56px 24px',
              borderRadius: '16px',
              border: '2px dashed var(--teal)',
              background: 'var(--teal-bg)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={handleDemoUpload}
          >
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--teal)', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', boxShadow: '0 4px 12px rgba(0, 169, 157, 0.25)',
            }}>
              <UploadCloud size={32} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: 'var(--tp)' }}>
              Drag and drop your file here
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--tt)', margin: '0 0 20px' }}>or</p>

            <button
              className="btn btn-primary"
              style={{ padding: '0 24px', height: '40px', fontSize: '14px', fontWeight: 600 }}
              onClick={(e) => { e.stopPropagation(); handleDemoUpload(); }}
            >
              Choose file
            </button>

            <p style={{ fontSize: '12px', color: 'var(--teal-dark)', marginTop: '24px', textDecoration: 'underline' }}>
              Click anywhere here to load a sample OR for this demo
            </p>
          </div>
        )}

        {/* State 1.5: Analyzing Skeleton */}
        {analyzing && (
          <div className="card text-center" style={{ padding: '60px 24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <RefreshCw size={36} style={{ color: 'var(--teal)', marginBottom: '16px', animation: 'spin 1s linear infinite' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>AI Extracting Document Parameters...</h3>
            <p style={{ color: 'var(--ts)', fontSize: '13px' }}>Matching against official OR, Invoice, and SpeedPay registries...</p>
          </div>
        )}

        {/* State 2: Extracted Result & Duplicate Comparison */}
        {hasUploaded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Top 2 Grid Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              
              {/* Card 1: Extracted Info */}
              <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--sh1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--tp)' }}>
                    Extracted information
                  </h3>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--teal-dark)', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--teal-bg)', padding: '2px 8px', borderRadius: '6px' }}>
                    <Sparkles size={13} /> AI extracted
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: '12px', fontSize: '14px' }}>
                  <span style={{ color: 'var(--tt)', fontSize: '13px' }}>Document type</span>
                  <div>
                    <span className="badge" style={{ background: 'var(--s2)', color: 'var(--teal-dark)', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                      OR
                    </span>
                  </div>

                  <span style={{ color: 'var(--tt)', fontSize: '13px' }}>OR number</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--fb)', color: 'var(--tp)' }}>OR-2024-0012345</span>

                  <span style={{ color: 'var(--tt)', fontSize: '13px' }}>Date</span>
                  <span style={{ color: 'var(--tp)' }}>May 20, 2024</span>

                  <span style={{ color: 'var(--tt)', fontSize: '13px' }}>Amount</span>
                  <span style={{ fontWeight: 700, color: 'var(--tp)' }}>₱15,250.00</span>

                  <span style={{ color: 'var(--tt)', fontSize: '13px' }}>Client</span>
                  <span style={{ color: 'var(--tp)' }}>ABC Trading Corporation</span>

                  <span style={{ color: 'var(--tt)', fontSize: '13px' }}>Waybill no.</span>
                  <span style={{ fontWeight: 600, color: 'var(--tp)' }}>WBL-2024-556677</span>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={handleReset}
                    style={{ background: 'none', border: 'none', color: 'var(--tt)', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <X size={14} /> Upload a different file
                  </button>
                </div>
              </div>

              {/* Card 2: AI Duplicate Check Result */}
              <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--sh1)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: 'var(--tp)' }}>
                  AI duplicate check result
                </h3>

                <div style={{ background: 'var(--err-bg)', border: '1px solid var(--err-r)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--err)', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                    <AlertTriangle size={18} /> Potential duplicate detected
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--err)' }}>
                    Matches an existing record on OR number.
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    <span style={{ color: 'var(--tt)' }}>Match confidence</span>
                    <span style={{ color: 'var(--err)', fontWeight: 700 }}>98%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--s2)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '98%', height: '100%', background: 'var(--err)', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Possible Duplicate Matches Table */}
            <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--sh1)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: 'var(--tp)' }}>
                Possible duplicate matches
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--s1)' }}>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--ts)', textTransform: 'uppercase' }}>Record</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--ts)', textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--ts)', textTransform: 'uppercase' }}>Client</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--ts)', textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--ts)', textTransform: 'uppercase' }}>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600 }}>
                        <div>OR-2024-0012345</div>
                        <span style={{ fontSize: '11px', background: 'var(--err-bg)', color: 'var(--err)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, marginTop: '2px', display: 'inline-block' }}>
                          Likely duplicate
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--ts)' }}>May 18, 2024</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--tp)' }}>ABC Trading Corporation</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: 'var(--tp)' }}>₱15,250.00</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'var(--s2)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: '98%', height: '100%', background: 'var(--err)' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--err)' }}>98%</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600 }}>
                        <div>OR-2024-0012001</div>
                        <span style={{ fontSize: '11px', background: 'var(--warn-bg)', color: 'var(--warn)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, marginTop: '2px', display: 'inline-block' }}>
                          Similar
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--ts)' }}>May 10, 2024</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--tp)' }}>ABC Trading Corporation</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: 'var(--tp)' }}>₱15,250.00</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'var(--s2)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: '85%', height: '100%', background: 'var(--warn)' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--warn)' }}>85%</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Card 4: Action Controls */}
            <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--sh1)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: 'var(--tp)' }}>
                Actions
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--tt)', margin: '0 0 20px' }}>
                A finance user must validate before this is recorded.
              </p>

              {actionDone ? (
                <div style={{ background: 'var(--ok-bg)', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--ok-r)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={18} style={{ color: 'var(--ok)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--ok)', fontSize: '14px' }}>
                    Validation action recorded: "{actionDone}".
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <button
                    onClick={() => handleAction('Mark as Duplicate')}
                    className="btn btn-primary"
                    style={{ height: '40px', padding: '0 20px', fontWeight: 600 }}
                  >
                    Mark as duplicate
                  </button>
                  <button
                    onClick={() => handleAction('Mark as Unique')}
                    className="btn btn-secondary"
                    style={{ height: '40px', padding: '0 20px', fontWeight: 600 }}
                  >
                    Mark as unique
                  </button>
                  <button
                    onClick={handleManualReview}
                    className="btn btn-outline"
                    style={{ height: '40px', padding: '0 20px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    Need manual review <ExternalLink size={14} />
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Previous AI Duplicate Check Scan History Modal */}
      {showHistoryModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.45)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowHistoryModal(false); }}
        >
          <div style={{
            background: 'var(--s0)', borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--sh4)', width: '100%', maxWidth: '820px',
            maxHeight: '88vh', overflow: 'auto', padding: '32px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, fontFamily: 'var(--fh)', color: 'var(--tp)' }}>
                  Previous AI Duplicate Scans &amp; History
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--tt)' }}>
                  Review previous document scans, extracted parameters, and AI duplicate detection results.
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--tt)', fontSize: '20px' }}
              >
                <i className="ti ti-x" />
              </button>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--s1)' }}>
                    <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: 'var(--ts)', textTransform: 'uppercase' }}>Scan Reference</th>
                    <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: 'var(--ts)', textTransform: 'uppercase' }}>Doc Type</th>
                    <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: 'var(--ts)', textTransform: 'uppercase' }}>Client &amp; Amount</th>
                    <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: 'var(--ts)', textTransform: 'uppercase' }}>Scan Date</th>
                    <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: 'var(--ts)', textTransform: 'uppercase' }}>AI Check Result</th>
                    <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: 'var(--ts)', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {previousScanHistory.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: 'var(--tp)' }}>
                        <div>{item.reference}</div>
                        <span style={{ fontSize: '11px', color: 'var(--tt)', fontWeight: 400 }}>ID: {item.id}</span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--ts)' }}>
                        {item.document_type}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--tp)' }}>{item.amount}</div>
                        <span style={{ fontSize: '12px', color: 'var(--tt)' }}>{item.client_name}</span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--tt)' }}>
                        {item.scan_date}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px' }}>
                        {item.ai_result.includes('Duplicate') ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--err-bg)', color: 'var(--err)', border: '1px solid var(--err-r)', fontWeight: 700, fontSize: '12px', padding: '3px 10px', borderRadius: '20px' }}>
                            ⚠️ {item.ai_result}
                          </span>
                        ) : item.ai_result.includes('Similar') ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--warn-bg)', color: 'var(--warn)', border: '1px solid var(--warn-r)', fontWeight: 700, fontSize: '12px', padding: '3px 10px', borderRadius: '20px' }}>
                            ⚡ {item.ai_result}
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--ok-bg)', color: 'var(--ok)', border: '1px solid var(--ok-r)', fontWeight: 700, fontSize: '12px', padding: '3px 10px', borderRadius: '20px' }}>
                            ✓ {item.ai_result}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleLoadHistoryItem(item)}
                          className="btn btn-outline"
                          style={{ padding: '4px 10px', fontSize: '12px', height: '30px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={12} /> Load
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => { setShowHistoryModal(false); navigate('/ai/review-history'); }}
                style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                View Full Audit Review History <ArrowRight size={14} />
              </button>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
