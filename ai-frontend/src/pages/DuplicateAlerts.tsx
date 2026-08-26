import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DecisionSupportNotice } from '../components/DecisionSupportNotice';
import DataTable, { ColumnDef, ActionItem } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/ToastContext';
import { AiHeader } from '../components/AiHeader';
import { Modal } from '../components/Modal';
import { 
  ShieldAlert, AlertOctagon, UploadCloud, AlertTriangle, 
  CheckCircle, RefreshCw, X, Sparkles, ExternalLink, 
  History, Eye, ArrowRight, Clipboard, Clock, Info, User, Check, AlertCircle, FileText, Camera, ZoomIn, ZoomOut, Lock, SwitchCamera
} from 'lucide-react';

// ==========================================
// DATA MODELS & STRUCTS
// ==========================================

export interface UniqueDocument {
  id: string; // Record ID
  documentType: 'INVOICE' | 'OFFICIAL_RECEIPT' | 'WAYBILL';
  documentNumber: string;
  clientName: string;
  amount: string;
  transactionDate: string;
  source: 'Uploaded' | 'Scanned';
  aiConfidence: number;
  reviewedBy: string;
  reviewerRole: string;
  reviewedDate: string;
  status: 'Unique' | 'Cleared for Normal Validation';
  reviewerNote: string;
  reason: string;
}

export interface FlaggedDuplicate {
  id: string; // Flag ID
  documentType: 'INVOICE' | 'OFFICIAL_RECEIPT' | 'WAYBILL';
  uploadedDocumentNumber: string;
  documentNumber?: string;
  existingMatchedRecord: string;
  clientName: string;
  amount: string;
  similarityScore: number;
  duplicateReason: string;
  handlingAction: string;
  flaggedBy: string;
  reviewerRole: string;
  flaggedDate: string;
  status: 'Confirmed Duplicate' | 'Submission Blocked' | 'Linked to Existing Record' | 'Returned for Correction' | 'Under Investigation' | 'Closed' | 'Pending Review';
  reviewerNote: string;
  confidence?: number;
  severity?: string;
  matchedWith?: string;
  matchedFields?: string[];
  transactionDate?: string;
  source?: string;
}

export interface HistoryRecord {
  id: string; // History ID
  documentType: 'INVOICE' | 'OFFICIAL_RECEIPT' | 'WAYBILL';
  documentNumber: string;
  clientName: string;
  aiResult: string;
  finalDecision: 'Marked as Unique' | 'Marked as Duplicate';
  reviewer: string;
  reviewerRole: string;
  decisionReason: string;
  reviewerNote: string;
  reviewedDate: string;
  relatedRecordId: string;

  // compatibility fields
  review_date?: string;
  target_type?: string;
  target_id?: string;
  reviewer_username?: string;
  decision?: string;
  remarks?: string;
  recommended_action?: string;
}

export interface AuditEvent {
  id: string;
  occurredAt: string;
  userId: string;
  role: string;
  eventType: string;
  documentId: string;
  relatedRecordId: string;
  description: string;
  previousStatus: string;
  newStatus: string;
}

export const DuplicateAlerts: React.FC = () => {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab State: 'scan' | 'unique-docs' | 'flagged-dups' | 'history'
  const [activeTab, setActiveTab] = useState<'scan' | 'unique-docs' | 'flagged-dups' | 'history'>('scan');

  // Database States
  const [uniques, setUniques] = useState<UniqueDocument[]>([]);
  const [duplicates, setDuplicates] = useState<FlaggedDuplicate[]>([]);
  const [historyList, setHistoryList] = useState<HistoryRecord[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [reviewerFilter, setReviewerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Filtered Uniques (Flow 8)
  const computedUniques = useMemo(() => {
    return uniques.filter(doc => {
      const matchesSearch = 
        doc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.reviewedBy && doc.reviewedBy.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = !docTypeFilter || doc.documentType === docTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [uniques, searchQuery, docTypeFilter]);

  // Filtered Duplicates (Flow 10)
  const computedDuplicates = useMemo(() => {
    return duplicates.filter(flag => {
      const matchesSearch = 
        flag.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flag.uploadedDocumentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flag.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flag.flaggedBy.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = !docTypeFilter || flag.documentType === docTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [duplicates, searchQuery, docTypeFilter]);

  // Filtered History (Flow 11)
  const computedHistory = useMemo(() => {
    return historyList.filter(record => {
      const matchesSearch = 
        record.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.reviewer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !statusFilter || record.finalDecision === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [historyList, searchQuery, statusFilter]);

  // ==========================================
  // FLOW 1: SCANNING & UPLOAD STATE
  // ==========================================
  const [dragActive, setDragActive] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  
  // Camera scan modal
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'Uploaded' | 'Scanned'>('Uploaded');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment'); // back cam default

  // Real webcam refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturedFileRef = useRef<File | null>(null);

  // Load progress
  const [checkingStep, setCheckingStep] = useState<number>(0); // 0: Idle, 1: Reading, 2: Extracting, 3: Comparing, 4: Results
  const [checkingProgress, setCheckingProgress] = useState(0);

  // AI OCR extraction state (editable form)
  const [extractionDone, setExtractionDone] = useState(false);
  const [extDocType, setExtDocType] = useState<'INVOICE' | 'OFFICIAL_RECEIPT' | 'WAYBILL'>('OFFICIAL_RECEIPT');
  const [extDocNum, setExtDocNum] = useState('');
  const [extClient, setExtClient] = useState('');
  const [extAmount, setExtAmount] = useState('');
  const [extDate, setExtDate] = useState('');
  const [extRef, setExtRef] = useState('');
  const [extWaybill, setExtWaybill] = useState('');
  const [ocrWarning, setOcrWarning] = useState('');

  // Save original OCR backup values
  const [originalOCR, setOriginalOCR] = useState<any>(null);

  // AI Results view state
  const [scanResultMode, setScanResultMode] = useState<'NONE' | 'CLEAR' | 'DUPLICATE' | 'INVALID'>('NONE');
  const [similarityScore, setSimilarityScore] = useState(0);
  const [matchedRecordDetails, setMatchedRecordDetails] = useState<any>(null);

  // ==========================================
  // FLOW 6: INLINE MANUAL REVIEW PANEL
  // ==========================================
  const [showManualReviewPanel, setShowManualReviewPanel] = useState(false);
  const [manualReason, setManualReason] = useState('Document is blurry');
  const [manualNote, setManualNote] = useState('');
  const [manualSelectedMatch, setManualSelectedMatch] = useState('FOMS-PAY-99812');
  const [manualObservation, setManualObservation] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1.0); // 1.0x to 2.5x
  const [manualReviewDecision, setManualReviewDecision] = useState<'Mark as Duplicate' | 'Mark as Unique'>('Mark as Duplicate');

  // Modals for confirmation
  const [showUniqueConfirmModal, setShowUniqueConfirmModal] = useState(false);
  const [uniqueReason, setUniqueReason] = useState('Different transaction');
  const [uniqueNote, setUniqueNote] = useState('');

  const [showDuplicateConfirmModal, setShowDuplicateConfirmModal] = useState(false);
  const [duplicateReason, setDuplicateReason] = useState('Same OR number');
  const [duplicateNote, setDuplicateNote] = useState('');
  const [duplicateHandling, setDuplicateHandling] = useState('Flag and Block New Submission');

  // Record History modal states
  const [showRecordHistoryModal, setShowRecordHistoryModal] = useState(false);
  const [selectedRecordHistoryNum, setSelectedRecordHistoryNum] = useState('');

  // ==========================================
  // ROLE-BASED ACCESS CONTROL (RBAC) GUARDS
  // ==========================================
  const isFinancialManager = useMemo(() => user?.role === 'Financial Manager' || user?.role === 'Finance Manager', [user]);
  const isHeadAccountant = useMemo(() => user?.role === 'Head Accountant', [user]);
  const isAccountant = useMemo(() => user?.role === 'Accountant', [user]);
  const isCoordinator = useMemo(() => user?.role === 'Coordinator', [user]);

  const canValidate = useMemo(() => {
    return isFinancialManager || isHeadAccountant || isAccountant;
  }, [isFinancialManager, isHeadAccountant, isAccountant]);

  const canForceOverride = useMemo(() => {
    return isFinancialManager || isHeadAccountant;
  }, [isFinancialManager, isHeadAccountant]);

  // ==========================================
  // DATABASE LOADING & PERSISTENCE (POSTGRESQL API)
  // ==========================================
  const loadDatabase = async () => {
    setDbLoading(true);
    try {
      // 1. Fetch cataloged unique documents from backend PostgreSQL DB
      const resUniques = await fetch('/api/ai/duplicates/unique-documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resUniques.ok) {
        const data = await resUniques.json();
        const mappedUniques: UniqueDocument[] = (Array.isArray(data) ? data : []).map((u: any) => ({
          id: u.id || `REC-${Date.now()}`,
          documentType: u.documentType || 'OFFICIAL_RECEIPT',
          documentNumber: u.documentNumber || '',
          clientName: u.clientName || 'N/A',
          amount: String(u.amount || '0.00'),
          transactionDate: u.transactionDate || new Date().toISOString().split('T')[0],
          source: u.sourceType || 'Scanned',
          aiConfidence: u.similarityScore || 0,
          reviewedBy: u.scannedBy || 'System',
          reviewerRole: u.scannedRole || 'Staff',
          reviewedDate: u.createdAt || new Date().toISOString(),
          status: 'Unique',
          reviewerNote: u.aiResult || '',
          reason: 'No duplicate detected'
        }));
        setUniques(mappedUniques);
      }

      // 2. Fetch flagged duplicate alerts from backend PostgreSQL DB
      const resDups = await fetch('/api/ai/duplicates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resDups.ok) {
        const data = await resDups.json();
        const mappedDups: FlaggedDuplicate[] = (Array.isArray(data) ? data : []).map((a: any) => ({
          id: String(a.id),
          documentType: a.alert_type || 'OFFICIAL_RECEIPT',
          uploadedDocumentNumber: a.source_record_id || 'DOC-001',
          documentNumber: a.source_record_id || 'DOC-001',
          existingMatchedRecord: a.matched_record_id || 'RECORD-001',
          clientName: a.matched_fields?.clientName || '',
          amount: String(a.matched_fields?.amount || '0.00'),
          transactionDate: a.created_at ? a.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          source: 'Scanned',
          similarityScore: a.confidence_score || 0,
          confidence: a.confidence_score || 0,
          severity: a.severity || 'Medium',
          matchedWith: a.matched_record_id || 'RECORD-001',
          duplicateReason: a.match_reason || 'AI parameter match detected',
          handlingAction: a.status || 'Pending Review',
          flaggedBy: 'AI Gemini System',
          reviewerRole: 'AI Model',
          status: a.status || 'Pending Review',
          matchedFields: a.matched_fields ? Object.keys(a.matched_fields) : ['Document Number'],
          flaggedDate: a.created_at || new Date().toISOString(),
          reviewerNote: ''
        }));
        setDuplicates(mappedDups);
      }

      // 3. Fetch review history log from backend PostgreSQL DB
      const resHistory = await fetch('/api/ai/duplicates/review-history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resHistory.ok) {
        const data = await resHistory.json();
        const mappedHistory: HistoryRecord[] = (Array.isArray(data) ? data : []).map((h: any) => ({
          id: String(h.id),
          documentType: h.target_type || 'OFFICIAL_RECEIPT',
          documentNumber: h.target_id || '',
          clientName: 'System Record',
          aiResult: h.recommended_action || 'Review Required',
          finalDecision: h.decision || 'Marked as Duplicate',
          reviewer: h.reviewer_username || 'Reviewer',
          reviewerRole: h.reviewer_role || 'Staff',
          decisionReason: h.remarks || '',
          reviewerNote: h.remarks || '',
          reviewedDate: h.review_date || new Date().toISOString(),
          relatedRecordId: h.target_id || ''
        }));
        setHistoryList(mappedHistory);
      }
    } catch (e) {
      console.error("Failed loading database records from PostgreSQL:", e);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();

    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'scan') setActiveTab('scan');
    else if (tabParam === 'unique-docs') setActiveTab('unique-docs');
    else if (tabParam === 'flagged-dups') setActiveTab('flagged-dups');
    else if (tabParam === 'history') setActiveTab('history');
  }, [location.search]);

  // ==========================================
  // PERSISTENCE SAVE WRAPPER FUNCTIONS
  // ==========================================
  const saveUniquesToStorage = async (listOrItem: any) => {
    const item = Array.isArray(listOrItem) ? listOrItem[0] : listOrItem;
    if (item && item.documentNumber) {
      try {
        await fetch('/api/ai/duplicates/save-unique', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            documentType: item.documentType || 'OFFICIAL_RECEIPT',
            documentNumber: item.documentNumber,
            clientName: item.clientName || '',
            amount: parseFloat(item.amount || '0'),
            transactionDate: item.transactionDate || new Date().toISOString().split('T')[0],
            referenceNumber: extRef,
            waybillNumber: extWaybill,
            sourceType: sourceType,
            scannedBy: user?.username,
            scannedRole: user?.role,
            aiResult: 'No Duplicate Detected',
            similarityScore: item.aiConfidence || 0
          })
        });
      } catch (err) {
        console.error('Error saving unique document to PostgreSQL:', err);
      }
    }
    loadDatabase();
  };

  const saveDuplicatesToStorage = async (listOrItem: any) => {
    loadDatabase();
  };

  const saveHistoryToStorage = async (listOrItem: any) => {
    const item = Array.isArray(listOrItem) ? listOrItem[0] : listOrItem;
    if (item) {
      try {
        await fetch('/api/ai/duplicates/review-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            targetType: item.target_type || 'DUPLICATE_ALERT',
            targetId: String(item.target_id || item.documentNumber || item.id || 'REV-01'),
            reviewerUsername: user?.username,
            reviewerRole: user?.role,
            decision: item.decision || item.finalDecision || 'Reviewed',
            remarks: item.remarks || item.reviewerNote || item.decisionReason || 'Decision recorded',
            recommendedAction: item.recommended_action || item.aiResult || 'None'
          })
        });
      } catch (err) {
        console.error('Error saving review history to PostgreSQL:', err);
      }
    }
    loadDatabase();
  };

  // ==========================================
  // AUDIT TRAIL LOGGER (REAL POSTGRESQL DB)
  // ==========================================
  const logAuditEvent = (
    eventType: string,
    documentId: string,
    relatedRecordId: string,
    description: string,
    prevStatus: string,
    newStatus: string
  ) => {
    try {
      fetch('/api/ai/dashboard/audit-trail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventType,
          actionDescription: description,
          result: 'SUCCESS',
          relatedRecordType: 'DUPLICATE_DETECTION',
          sourceReference: documentId,
          normalizedReference: relatedRecordId,
          details: {
            previousStatus: prevStatus,
            newStatus,
            username: user?.username,
            role: user?.role
          }
        })
      }).catch(err => console.error('Audit trail POST error:', err));
    } catch (e) {
      console.error(e);
    }
  };


  // ==========================================
  // FLOW 1: DOCUMENT UPLOAD & SIMULATED SCANNING
  // ==========================================
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0], 'Uploaded');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0], 'Uploaded');
    }
  };

  const processSelectedFile = (file: File, source: 'Uploaded' | 'Scanned') => {
    // Validate file size (10 MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size exceeds 10 MB limit.", "Upload Error");
      return;
    }

    // Validate type (JPG, JPEG, PNG only, no PDF)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file format. Upload JPG, JPEG, or PNG only.", "Upload Error");
      return;
    }

    // Reset all previous scan results immediately so stale INVALID/CLEAR/DUPLICATE cards don't persist
    setScanResultMode('NONE');
    setExtractionDone(false);
    setMatchedRecordDetails(null);
    setSimilarityScore(0);
    setExtDocNum('');
    setExtClient('');
    setExtAmount('');
    setExtDate('');
    setExtRef('');
    setOcrWarning('');

    setUploadFile(file);
    setSourceType(source);
    setPreviewDocUrl(URL.createObjectURL(file));

    // Audit Upload Event
    logAuditEvent('DOCUMENT_UPLOADED', `DOC-${Date.now()}`, 'NONE', `Document ${file.name} uploaded successfully.`, 'NONE', 'UPLOADED');

    // Run AI parameter extraction automatically
    runExtractionSimulation(file.name, file);
  };

  // ── Camera helpers ───────────────────────────────────────────
  const startCamera = async (facing: 'environment' | 'user') => {
    setCameraError(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 80);
    } catch (err: any) {
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Camera access was denied. Please allow camera permissions in your browser and try again.'
          : 'No camera found or the selected camera is unavailable. Try switching cameras.'
      );
      setCameraActive(false);
    }
  };

  // Real Webcam Scanning Console
  const handleOpenScanner = async () => {
    setCapturedImage(null);
    capturedFileRef.current = null;
    setShowCameraModal(true);
    await startCamera(facingMode);
  };

  const handleFlipCamera = async () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    stopCameraStream();
    await startCamera(newFacing);
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const handleCaptureScan = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    setCameraActive(false);
    stopCameraStream();

    // Convert dataURL to File for OCR pipeline
    canvas.toBlob(blob => {
      if (blob) {
        capturedFileRef.current = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      }
    }, 'image/jpeg', 0.92);
  };

  const handleRetakeScan = async () => {
    setCapturedImage(null);
    capturedFileRef.current = null;
    await startCamera(facingMode);
  };

  const handleConfirmScan = () => {
    stopCameraStream();
    setShowCameraModal(false);
    setSourceType('Scanned');

    if (capturedFileRef.current) {
      // Use real captured image
      setUploadFile(capturedFileRef.current);
      setPreviewDocUrl(capturedImage);
      logAuditEvent('DOCUMENT_SCANNED', `DOC-${Date.now()}`, 'NONE', `Physical document scanned and confirmed by user.`, 'NONE', 'SCANNED');
      runExtractionSimulation(capturedFileRef.current.name, capturedFileRef.current);
    } else {
      // Fallback if capture somehow failed
      logAuditEvent('DOCUMENT_SCANNED', `DOC-${Date.now()}`, 'NONE', `Physical document scanned and confirmed by user.`, 'NONE', 'SCANNED');
      runExtractionSimulation('scanned_receipt.png');
    }
  };

  // ==========================================
  // FLOW 2: AI PARAMETER EXTRACTION
  // ==========================================
  const runExtractionSimulation = async (fileName: string, fileOverride?: File) => {
    setCheckingStep(1); // Reading document
    setCheckingProgress(25);

    try {
      setCheckingStep(2); // Extracting information
      setCheckingProgress(60);

      const targetFile = fileOverride || uploadFile || new File(["scanned_doc"], fileName, { type: "image/png" });
      const formData = new FormData();
      formData.append('file', targetFile);

      const res = await fetch('/api/ai/duplicates/scan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const apiRes = await res.json();
        const scanData = apiRes.data || {};
        const extracted = scanData.extracted || {};
        console.log('[SCAN DEBUG] Full API response:', JSON.stringify(apiRes));
        console.log('[SCAN DEBUG] scanData.status:', scanData.status, '| extracted.documentType:', extracted.documentType);

        const docType = (extracted.documentType as any) || 'OFFICIAL_RECEIPT';
        const docNum = (extracted.documentNumber && extracted.documentNumber.trim() !== '') ? extracted.documentNumber : `OR-${Date.now().toString().slice(-6)}`;
        const clientName = (extracted.clientName && extracted.clientName.trim() !== '') ? extracted.clientName : 'Customer Name Not Read';
        const rawAmount = extracted.amount != null ? String(extracted.amount).trim() : '';
        const amt = rawAmount && rawAmount !== 'null' ? rawAmount : 'Missing';
        const warningText = extracted.warning || (amt === 'Missing' ? 'OCR amount could not be read because Gemini quota is exhausted. Please check your Gemini billing/quota in Google AI Studio.' : '');
        const dt = extracted.transactionDate || new Date().toISOString().split('T')[0];
        const ref = extracted.referenceNumber || `REF-${docNum}`;

        setExtDocType(docType === 'PROOF_OF_PAYMENT' ? 'OFFICIAL_RECEIPT' : docType);
        setExtDocNum(docNum);
        setExtClient(clientName);
        setExtAmount(amt);
        setExtDate(dt);
        setExtRef(ref);
        setOcrWarning(warningText);

        const ocrData = {
          documentType: docType,
          documentNumber: docNum,
          clientName: clientName,
          amount: amt,
          transactionDate: dt,
          referenceNumber: ref,
          waybillNumber: `WBL-${docNum}`
        };
        setOriginalOCR(ocrData);

        logAuditEvent(
          'DOCUMENT_INFORMATION_EXTRACTED',
          docNum,
          'NONE',
          `Gemini 2.5 Flash extracted metadata for ${fileName}.`,
          'UPLOADED',
          'EXTRACTED'
        );

        setCheckingStep(0);
        setCheckingProgress(100);
        setExtractionDone(true);

        // ── Document Validation Gate ─────────────────────────────────────────
        // The backend returns HTTP 200 for UNIQUE/DUPLICATE results and HTTP 422
        // for INVALID_DOCUMENT. This block handles the HTTP 200 path (still need
        // to check data-level flags as a belt-and-suspenders guard).
        //
        // Trigger INVALID state on ANY of these conditions:
        //   a) status is INVALID_DOCUMENT (backend rejected)
        //   b) top-level is_valid is explicitly false
        //   c) extracted.is_valid is explicitly false  ← Bug Fix #3 enables this
        //   d) documentType is in the invalid set
        //   e) NEEDS_GEMINI_REVIEW — Gemini was offline so we cannot auto-approve
        //   f) reason_code signals a rejection (LOW_CONFIDENCE, INVALID_DOCUMENT)

        const INVALID_DOC_TYPES = [
          'INVALID_DOCUMENT', 'INVALID_OR_UNRELATED_IMAGE',
          'PERSON_PHOTO', 'SELFIE', 'NON_FINANCIAL_DOCUMENT',
          'RANDOM_SCREENSHOT', 'UNKNOWN_IMAGE'
        ];

        const isGeminiUnavailable = (
          extracted.documentType === 'NEEDS_GEMINI_REVIEW' ||
          scanData.reason_code === 'GEMINI_UNAVAILABLE' ||
          extracted.geminiUnavailable === true ||
          scanData.status === 'GEMINI_UNAVAILABLE'
        );

        const isInvalidDocument = (
          scanData.status === 'INVALID_DOCUMENT' ||
          scanData.is_valid === false ||
          extracted.is_valid === false ||
          INVALID_DOC_TYPES.includes(extracted.documentType) ||
          scanData.reason_code === 'INVALID_DOCUMENT' ||
          scanData.reason_code === 'LOW_CONFIDENCE' ||
          scanData.reason_code === 'UNRECOGNIZED_DOCUMENT_TYPE'
        );

        if (isGeminiUnavailable) {
          // AI service offline — show specific message, do NOT show duplicate result
          toast.error(
            'AI classification service is temporarily unavailable. Please try again in a few minutes.',
            'AI Service Unavailable'
          );
          setScanResultMode('INVALID');
          setExtractionDone(false);
          // Update the INVALID card message via ocrWarning
          setOcrWarning(
            extracted.validationMessage ||
            'AI document classification is temporarily unavailable. Duplicate scanning has been stopped to prevent false results. Please try again in a few minutes.'
          );
        } else if (isInvalidDocument) {
          // Non-financial image uploaded — stop scan, show error card
          const invalidMsg =
            scanData.message ||
            extracted.validationMessage ||
            'The uploaded image does not appear to be an invoice, official receipt, billing statement, or payment document. Duplicate scanning was stopped.';

          toast.warning(
            'Invalid file content. Please upload an invoice, official receipt, billing statement, or payment document only.',
            'Invalid Document'
          );
          setScanResultMode('INVALID');
          setExtractionDone(false); // Never show extraction form for invalid docs
          setOcrWarning(invalidMsg);
          // Clear any stale extracted values so they don't leak into UI
          setExtDocNum('');
          setExtClient('');
          setExtAmount('');
          setExtRef('');

          logAuditEvent(
            'INVALID_DOCUMENT_REJECTED',
            fileName,
            'NONE',
            `Document rejected by AI classifier: ${extracted.documentType || 'UNKNOWN'}.`,
            'UPLOADED',
            'REJECTED'
          );
        } else if (scanData.status === 'FLAGGED_DUPLICATE') {
          setScanResultMode('DUPLICATE');
          setSimilarityScore(scanData.confidence_score || 95);

          const matchedRecord = scanData.matched_record || {};
          setMatchedRecordDetails({
            record_id: matchedRecord.record_id || `REC-${Date.now()}`,
            registered_or: matchedRecord.documentNumber || matchedRecord.receiptNumber || matchedRecord.invoiceNumber || matchedRecord.waybillNumber || docNum,
            client_name: matchedRecord.clientName || clientName,
            amount: matchedRecord.amount || amt || '0.00',
            entry_date: matchedRecord.transactionDate || dt,
            reference_no: matchedRecord.referenceNumber || ref,
            waybill_no: matchedRecord.waybillNumber || `WBL-${docNum}`,
            status: 'FLAGGED'
          });
          toast.warning(`Duplicate detected (${scanData.confidence_score}% similarity). Review required.`, 'AI Gemini Scan');
        } else if (scanData.status === 'UNIQUE_DOCUMENT') {
          setScanResultMode('CLEAR');
          setSimilarityScore(0);
          toast.success('Document cataloged as Unique Document (0% similarity match).', 'AI Gemini Scan');
        }
        return;
      }

      // ── Non-OK HTTP response (e.g. 415 Unsupported, 422 INVALID_DOCUMENT) ──
      // Bug Fix #5: The backend now returns HTTP 422 with a structured `detail`
      // object for INVALID_DOCUMENT cases. Parse it and route to the INVALID card
      // instead of a generic error toast.
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));

        // `detail` may be a structured object (422) or a plain string (other errors)
        const detail = errBody?.detail || {};
        const detailIsObject = typeof detail === 'object' && detail !== null;

        const detailStatus: string = detailIsObject ? (detail.status || '') : '';
        const detailMsg: string = detailIsObject
          ? (detail.message || '')
          : (typeof detail === 'string' ? detail : '');
        const detailExtracted: any = detailIsObject ? (detail.extracted || detail.details || {}) : {};
        const detailReasonCode: string = detailIsObject ? (detail.details?.reason || detail.reason_code || '') : '';

        const is422Invalid =
          res.status === 422 &&
          (
            detailStatus === 'INVALID_DOCUMENT' ||
            detailReasonCode === 'INVALID_DOCUMENT' ||
            detailReasonCode === 'LOW_CONFIDENCE' ||
            detailReasonCode === 'GEMINI_UNAVAILABLE' ||
            detailReasonCode === 'UNRECOGNIZED_DOCUMENT_TYPE'
          );

        if (is422Invalid && detailReasonCode === 'GEMINI_UNAVAILABLE') {
          // AI classification offline
          toast.error(
            'AI classification service is temporarily unavailable. Please try again in a few minutes.',
            'AI Service Unavailable'
          );
          setScanResultMode('INVALID');
          setExtractionDone(false);
          setOcrWarning(
            detailMsg ||
            detailExtracted?.validationMessage ||
            'AI document classification is temporarily unavailable. Duplicate scanning has been stopped to prevent false results. Please try again in a few minutes.'
          );
        } else if (is422Invalid) {
          // Invalid / non-financial document — show the INVALID card
          const invalidMsg =
            detailMsg ||
            detailExtracted?.validationMessage ||
            'The uploaded image does not appear to be an invoice, official receipt, billing statement, or payment document. Duplicate scanning was stopped.';

          toast.warning(
            'Invalid file content. Please upload an invoice, official receipt, billing statement, or payment document only.',
            'Invalid Document'
          );
          setScanResultMode('INVALID');
          setExtractionDone(false);
          setOcrWarning(invalidMsg);
          setExtDocNum('');
          setExtClient('');
          setExtAmount('');
          setExtRef('');

          logAuditEvent(
            'INVALID_DOCUMENT_REJECTED',
            fileName,
            'NONE',
            `Document rejected by AI classifier (HTTP 422): ${detailExtracted?.documentType || 'UNKNOWN'}.`,
            'UPLOADED',
            'REJECTED'
          );
        } else {
          // Generic HTTP error (415, 413, 400, etc.)
          const errMsg = (typeof detail === 'string' ? detail : detailMsg) || `Scan failed (HTTP ${res.status}).`;
          toast.error(errMsg, 'Scan Error');
          setScanResultMode('INVALID');
          setExtractionDone(false);
          setOcrWarning(errMsg);
        }

        setCheckingStep(0);
        setCheckingProgress(0);
        return;
      }
    } catch (err) {
      console.error('OCR API error:', err);
      toast.error('Network error. Could not reach the AI scan service.', 'Scan Error');
    }

    // Network issue fallback
    setCheckingStep(0);
    setCheckingProgress(0);
    setExtractionDone(false);
  };



  const handleRunDuplicateCheck = async () => {
    setCheckingStep(3); // Comparing existing records
    setCheckingProgress(80);

    logAuditEvent('DUPLICATE_CHECK_STARTED', extDocNum || 'DOC', 'NONE', `Comparison query launched against FOMS PostgreSQL database records.`, 'EXTRACTED', 'CHECKING');

    try {
      let checkUrl = '/api/ai/duplicates/official-receipt';
      let payloadObj: any = { receiptNumber: extDocNum };

      if (extDocType === 'INVOICE') {
        checkUrl = '/api/ai/duplicates/invoice';
        payloadObj = {
          invoiceNumber: extDocNum,
          clientId: extClient || 'CLIENT-001',
          amount: parseFloat(extAmount || '0')
        };
      } else if (extDocType === 'WAYBILL') {
        checkUrl = '/api/ai/duplicates/waybill';
        payloadObj = {
          waybillNumber: extDocNum,
          clientId: extClient || 'CLIENT-001'
        };
      }

      const res = await fetch(checkUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payloadObj)
      });

      setCheckingStep(4);
      setCheckingProgress(100);

      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.alert_id) {
          setScanResultMode('DUPLICATE');
          setSimilarityScore(95);
          setMatchedRecordDetails({
            record_id: `ALT-${data.data.alert_id}`,
            registered_or: extDocNum,
            client_name: extClient,
            amount: extAmount,
            entry_date: extDate,
            reference_no: extRef,
            waybill_no: extWaybill,
            status: 'FLAGGED'
          });
          toast.warning("Duplicate record match flagged in PostgreSQL database! Review required.", "AI Duplicate Detection");
          logAuditEvent('POSSIBLE_DUPLICATE_DETECTED', extDocNum, `ALT-${data.data.alert_id}`, `AI matched similar parameters in PostgreSQL database.`, 'CHECKING', 'DUPLICATE_FLAGGED');
        } else {
          setScanResultMode('CLEAR');
          setSimilarityScore(0);
          setMatchedRecordDetails(null);
          toast.success("No duplicate record match flagged in PostgreSQL database.", "Verification Clear");
          logAuditEvent('NO_DUPLICATE_DETECTED', extDocNum, 'NONE', `AI database comparison found 0 matching record conflicts in PostgreSQL.`, 'CHECKING', 'CLEAR');
        }
      } else {
        setScanResultMode('CLEAR');
        setSimilarityScore(0);
        setMatchedRecordDetails(null);
        toast.success("No duplicate record match flagged in PostgreSQL database.", "Verification Clear");
      }
    } catch (err) {
      console.error("Duplicate check API error:", err);
      setScanResultMode('CLEAR');
      setSimilarityScore(0);
      setMatchedRecordDetails(null);
    } finally {
      setCheckingStep(0);
      setCheckingProgress(0);
    }
  };


  const handleResetScanConsole = () => {
    setUploadFile(null);
    setPreviewDocUrl(null);
    setCapturedImage(null);
    setExtractionDone(false);
    setScanResultMode('NONE');
    setMatchedRecordDetails(null);
    setShowManualReviewPanel(false);
    setZoomLevel(1.0);
    setExtDocType('OFFICIAL_RECEIPT');
    setExtDocNum('');
    setExtClient('');
    setExtAmount('');
    setExtDate('');
    setExtRef('');
  };

  // Send to Manual Review flow
  const handleSendToManualReview = () => {
    const alertId = `ALT-MAN-${Date.now()}`;
    const newFlagged: FlaggedDuplicate = {
      id: alertId,
      documentType: extDocType,
      uploadedDocumentNumber: extDocNum || 'DOC-PENDING',
      documentNumber: extDocNum,
      existingMatchedRecord: 'Manual Review Requested',
      clientName: extClient || 'Speedex Client',
      amount: extAmount || '0.00',
      transactionDate: extDate,
      source: sourceType,
      similarityScore: 0,
      confidence: 0,
      severity: 'Low',
      matchedWith: 'Manual Review Requested',
      duplicateReason: 'Manual verification requested by user',
      handlingAction: 'Under Review',
      flaggedBy: user?.username || 'System User',
      reviewerRole: user?.role || 'Staff',
      status: 'Pending Review',
      matchedFields: ['Manual Verification Required'],
      flaggedDate: new Date().toISOString(),
      reviewerNote: ''
    };

    saveDuplicatesToStorage([newFlagged, ...duplicates]);

    logAuditEvent(
      'MANUAL_REVIEW_REQUESTED',
      alertId,
      extDocNum,
      `User requested manual review verification for document ${extDocNum}.`,
      'CHECKING',
      'PENDING_REVIEW'
    );

    toast.info(`Document ${extDocNum} added to Manual Review queue.`, 'Manual Review');
    handleResetScanConsole();
    setActiveTab('flagged-dups');
  };

  // Mark as Unique clearance flow (Flow 7)
  const handleMarkAsUniqueClick = () => {
    setUniqueNote('');
    setUniqueReason('Different transaction');
    setShowUniqueConfirmModal(true);
  };

  const submitConfirmUnique = () => {
    if (!uniqueNote.trim()) {
      toast.warning("Reviewer notes are required to confirm unique clearance.", "Required Field");
      return;
    }

    const uniqueId = `REC-UNI-00${uniques.length + 1}`;
    const newUniqueDoc: UniqueDocument = {
      id: uniqueId,
      documentType: extDocType,
      documentNumber: extDocNum,
      clientName: extClient,
      amount: extAmount,
      transactionDate: extDate,
      source: sourceType,
      aiConfidence: similarityScore === 0 ? 100 : (100 - similarityScore),
      reviewedBy: user?.username === 'financial_manager_user' ? 'Maria Santos' : (user?.username === 'head_accountant_user' ? 'Juan Dela Cruz' : 'Reviewer'),
      reviewerRole: user?.role || 'Financial Manager',
      reviewedDate: new Date().toISOString(),
      status: 'Cleared for Normal Validation',
      reviewerNote: uniqueNote.trim(),
      reason: uniqueReason
    };

    // Save to Unique collection
    saveUniquesToStorage([newUniqueDoc, ...uniques]);

    // Save history entry
    const newHistory: HistoryRecord & any = {
      id: `REV-HIS-${Date.now()}`,
      documentType: extDocType,
      documentNumber: extDocNum,
      clientName: extClient,
      aiResult: scanResultMode === 'CLEAR' ? 'No Duplicate Detected' : 'Possible Duplicate Detected',
      finalDecision: 'Marked as Unique',
      reviewer: newUniqueDoc.reviewedBy,
      reviewerRole: newUniqueDoc.reviewerRole,
      decisionReason: uniqueReason,
      reviewerNote: uniqueNote.trim(),
      reviewedDate: new Date().toISOString(),
      relatedRecordId: matchedRecordDetails?.record_id || 'NONE',

      // ReviewHistory.tsx fields compatibility
      review_date: new Date().toISOString(),
      target_type: 'DUPLICATE_ALERT',
      target_id: extDocNum,
      reviewer_username: user?.username || 'user',
      decision: 'Reviewed',
      remarks: `Marked as Unique: ${uniqueReason}. Note: ${uniqueNote.trim()}`,
      recommended_action: 'Cleared for FOMS Normal Validation'
    };
    saveHistoryToStorage([newHistory, ...historyList]);

    // Write audit events
    logAuditEvent(
      'DOCUMENT_MARKED_UNIQUE',
      uniqueId,
      newHistory.relatedRecordId,
      `Document cleared as unique. Reason: ${uniqueReason}. Note: ${uniqueNote.trim()}`,
      'DUPLICATE_FLAGGED',
      'UNIQUE'
    );
    
    logAuditEvent(
      'UNIQUE_RECORD_CREATED',
      uniqueId,
      'NONE',
      `Cleared unique document reference added to ledger verification path.`,
      'UNIQUE',
      'UNIQUE_DOCUMENTS_LEDGER'
    );

    logAuditEvent(
      'TRANSACTION_CLEARED_FOR_VALIDATION',
      uniqueId,
      'NONE',
      `Document reference cleared for normal FOMS validation process.`,
      'UNIQUE',
      'VALIDATION_LEDGER'
    );

    toast.success("Document marked as unique and added to Unique Documents.", "Clearance Recorded");
    setShowUniqueConfirmModal(false);
    handleResetScanConsole();
    setActiveTab('unique-docs');
  };

  // Mark as Duplicate submission flow (Flow 9)
  const handleMarkAsDuplicateClick = () => {
    setDuplicateNote('');
    setDuplicateReason('Same OR number');
    setDuplicateHandling('Flag and Block New Submission');
    setShowDuplicateConfirmModal(true);
  };

  const submitConfirmDuplicate = () => {
    if (!duplicateNote.trim()) {
      toast.warning("Reviewer notes are required to confirm duplicate status.", "Required Field");
      return;
    }

    const flagId = `FLG-DUP-00${duplicates.length + 1}`;
    const newFlaggedDup: FlaggedDuplicate = {
      id: flagId,
      documentType: extDocType,
      uploadedDocumentNumber: extDocNum,
      existingMatchedRecord: matchedRecordDetails?.record_id || 'FOMS-PAY-99812',
      clientName: extClient,
      amount: extAmount,
      similarityScore: similarityScore,
      duplicateReason: duplicateReason,
      handlingAction: duplicateHandling,
      flaggedBy: user?.username === 'financial_manager_user' ? 'Maria Santos' : (user?.username === 'head_accountant_user' ? 'Juan Dela Cruz' : 'Reviewer'),
      reviewerRole: user?.role || 'Financial Manager',
      flaggedDate: new Date().toISOString(),
      status: duplicateHandling === 'Flag and Block New Submission' ? 'Submission Blocked' : 'Under Investigation',
      reviewerNote: duplicateNote.trim()
    };

    // Save to Flagged Duplicates collection
    saveDuplicatesToStorage([newFlaggedDup, ...duplicates]);

    // Save history entry
    const newHistory: HistoryRecord & any = {
      id: `REV-HIS-${Date.now()}`,
      documentType: extDocType,
      documentNumber: extDocNum,
      clientName: extClient,
      aiResult: 'Possible Duplicate Detected',
      finalDecision: 'Marked as Duplicate',
      reviewer: newFlaggedDup.flaggedBy,
      reviewerRole: newFlaggedDup.reviewerRole,
      decisionReason: duplicateReason,
      reviewerNote: duplicateNote.trim(),
      reviewedDate: new Date().toISOString(),
      relatedRecordId: newFlaggedDup.existingMatchedRecord,

      // ReviewHistory.tsx fields compatibility
      review_date: new Date().toISOString(),
      target_type: 'DUPLICATE_ALERT',
      target_id: extDocNum,
      reviewer_username: user?.username || 'user',
      decision: 'Reviewed',
      remarks: `Marked as Duplicate: ${duplicateReason}. Note: ${duplicateNote.trim()}`,
      recommended_action: duplicateHandling
    };
    saveHistoryToStorage([newHistory, ...historyList]);

    // Write audit events
    logAuditEvent(
      'DOCUMENT_MARKED_DUPLICATE',
      flagId,
      newFlaggedDup.existingMatchedRecord,
      `Document flagged as confirmed duplicate. Reason: ${duplicateReason}. Action: ${duplicateHandling}`,
      'DUPLICATE_FLAGGED',
      'DUPLICATE'
    );

    logAuditEvent(
      'DUPLICATE_RECORD_FLAGGED',
      flagId,
      'NONE',
      `Duplicate transaction cataloged inside flagged duplicate ledger.`,
      'DUPLICATE',
      'FLAGGED_DUPLICATES_LEDGER'
    );

    logAuditEvent(
      'EXISTING_RECORD_LINKED',
      flagId,
      newFlaggedDup.existingMatchedRecord,
      `Uploaded candidate record linked directly to target FOMS ledger reference.`,
      'DUPLICATE',
      'LINKED'
    );

    if (duplicateHandling === 'Flag and Block New Submission') {
      logAuditEvent(
        'TRANSACTION_SUBMISSION_BLOCKED',
        flagId,
        'NONE',
        `New transaction submission blocked. Payout leak prevented.`,
        'DUPLICATE',
        'BLOCKED'
      );
    }

    toast.success("Document confirmed and flagged as duplicate.", "Validation Blocked");
    setShowDuplicateConfirmModal(false);
    handleResetScanConsole();
    setActiveTab('flagged-dups');
  };

  const handleManualSubmitReview = () => {
    if (!manualNote.trim()) {
      toast.warning("Remarks / Audit Notes are required to submit human review.", "Required Field");
      return;
    }

    if (manualReviewDecision === 'Mark as Duplicate') {
      const flagId = `FLG-DUP-00${duplicates.length + 1}`;
      const newFlaggedDup: FlaggedDuplicate = {
        id: flagId,
        documentType: extDocType,
        uploadedDocumentNumber: extDocNum,
        existingMatchedRecord: matchedRecordDetails?.record_id || 'FOMS-PAY-99812',
        clientName: extClient,
        amount: extAmount,
        similarityScore: similarityScore,
        duplicateReason: duplicateReason,
        handlingAction: duplicateHandling,
        flaggedBy: user?.username === 'financial_manager_user' ? 'Maria Santos' : (user?.username === 'head_accountant_user' ? 'Juan Dela Cruz' : 'Reviewer'),
        reviewerRole: user?.role || 'Financial Manager',
        flaggedDate: new Date().toISOString(),
        status: duplicateHandling === 'Flag and Block New Submission' ? 'Submission Blocked' : 'Under Investigation',
        reviewerNote: manualNote.trim()
      };

      saveDuplicatesToStorage([newFlaggedDup, ...duplicates]);

      const newHistory: HistoryRecord & any = {
        id: `REV-HIS-${Date.now()}`,
        documentType: extDocType,
        documentNumber: extDocNum,
        clientName: extClient,
        aiResult: 'Possible Duplicate Detected',
        finalDecision: 'Marked as Duplicate',
        reviewer: newFlaggedDup.flaggedBy,
        reviewerRole: newFlaggedDup.reviewerRole,
        decisionReason: duplicateReason,
        reviewerNote: manualNote.trim(),
        reviewedDate: new Date().toISOString(),
        relatedRecordId: newFlaggedDup.existingMatchedRecord,

        // ReviewHistory.tsx fields compatibility
        review_date: new Date().toISOString(),
        target_type: 'DUPLICATE_ALERT',
        target_id: extDocNum,
        reviewer_username: user?.username || 'user',
        decision: 'Reviewed',
        remarks: `Marked as Duplicate: ${duplicateReason}. Note: ${manualNote.trim()}`,
        recommended_action: duplicateHandling
      };
      saveHistoryToStorage([newHistory, ...historyList]);

      logAuditEvent('DOCUMENT_MARKED_DUPLICATE', flagId, newFlaggedDup.existingMatchedRecord, `Flagged as duplicate: ${duplicateReason}`, 'DUPLICATE_FLAGGED', 'DUPLICATE');
      logAuditEvent('DUPLICATE_RECORD_FLAGGED', flagId, 'NONE', `Duplicate recorded.`, 'DUPLICATE', 'FLAGGED_DUPLICATES_LEDGER');
      logAuditEvent('EXISTING_RECORD_LINKED', flagId, newFlaggedDup.existingMatchedRecord, `Linked to ledger.`, 'DUPLICATE', 'LINKED');
      if (duplicateHandling === 'Flag and Block New Submission') {
        logAuditEvent('TRANSACTION_SUBMISSION_BLOCKED', flagId, 'NONE', `Submission blocked.`, 'DUPLICATE', 'BLOCKED');
      }

      toast.success("Document confirmed and flagged as duplicate.", "Validation Blocked");
      setShowManualReviewPanel(false);
      handleResetScanConsole();
      setActiveTab('flagged-dups');
    } else {
      const uniqueId = `REC-UNI-00${uniques.length + 1}`;
      const newUniqueDoc: UniqueDocument = {
        id: uniqueId,
        documentType: extDocType,
        documentNumber: extDocNum,
        clientName: extClient,
        amount: extAmount,
        transactionDate: extDate,
        source: sourceType,
        aiConfidence: similarityScore === 0 ? 100 : (100 - similarityScore),
        reviewedBy: user?.username === 'financial_manager_user' ? 'Maria Santos' : (user?.username === 'head_accountant_user' ? 'Juan Dela Cruz' : 'Reviewer'),
        reviewerRole: user?.role || 'Financial Manager',
        reviewedDate: new Date().toISOString(),
        status: 'Cleared for Normal Validation',
        reviewerNote: manualNote.trim(),
        reason: uniqueReason
      };

      saveUniquesToStorage([newUniqueDoc, ...uniques]);

      const newHistory: HistoryRecord & any = {
        id: `REV-HIS-${Date.now()}`,
        documentType: extDocType,
        documentNumber: extDocNum,
        clientName: extClient,
        aiResult: 'Possible Duplicate Detected',
        finalDecision: 'Marked as Unique',
        reviewer: newUniqueDoc.reviewedBy,
        reviewerRole: newUniqueDoc.reviewerRole,
        decisionReason: uniqueReason,
        reviewerNote: manualNote.trim(),
        reviewedDate: new Date().toISOString(),
        relatedRecordId: matchedRecordDetails?.record_id || 'NONE',

        // ReviewHistory.tsx fields compatibility
        review_date: new Date().toISOString(),
        target_type: 'DUPLICATE_ALERT',
        target_id: extDocNum,
        reviewer_username: user?.username || 'user',
        decision: 'Reviewed',
        remarks: `Marked as Unique: ${uniqueReason}. Note: ${manualNote.trim()}`,
        recommended_action: 'Cleared for FOMS Normal Validation'
      };
      saveHistoryToStorage([newHistory, ...historyList]);

      logAuditEvent('DOCUMENT_MARKED_UNIQUE', uniqueId, newHistory.relatedRecordId, `Cleared as unique: ${uniqueReason}`, 'DUPLICATE_FLAGGED', 'UNIQUE');
      logAuditEvent('UNIQUE_RECORD_CREATED', uniqueId, 'NONE', `Unique record logged.`, 'UNIQUE', 'UNIQUE_DOCUMENTS_LEDGER');
      logAuditEvent('TRANSACTION_CLEARED_FOR_VALIDATION', uniqueId, 'NONE', `Cleared for normal validation.`, 'UNIQUE', 'VALIDATION_LEDGER');

      toast.success("Document marked as unique and added to Unique Documents.", "Clearance Recorded");
      setShowManualReviewPanel(false);
      handleResetScanConsole();
      setActiveTab('unique-docs');
    }
  };

  // Zoom helpers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 1.0));

  // Render cells difference matching style (Flow 5)
  const getCellMatchStyle = (key: string, val1: string, val2: string) => {
    const v1 = String(val1 || '').trim().toLowerCase();
    const v2 = String(val2 || '').trim().toLowerCase();
    if (!v1 || !v2) return { text: 'Missing', style: { color: 'var(--ts)', fontStyle: 'italic' } };

    if (v1 === v2) {
      return { 
        text: 'Exact Match', 
        style: { color: 'var(--err)', backgroundColor: 'var(--err-bg)', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' } 
      };
    }

    const isSimilar = v1.includes(v2) || v2.includes(v1) || (key === 'amount' && Math.abs(parseFloat(v1) - parseFloat(v2)) < 500);
    if (isSimilar) {
      return { 
        text: 'Similar Match', 
        style: { color: 'var(--warn)', backgroundColor: 'var(--warn-bg)', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' } 
      };
    }

    return { 
      text: 'Different', 
      style: { color: 'var(--ok)', backgroundColor: 'var(--ok-bg)', fontWeight: 600, padding: '3px 8px', borderRadius: '4px' } 
    };
  };

  return (
    <div className="main-content fade-in">
      <AiHeader title="Duplicate Detection Center" />

      <div className="page-container">
        {/* Top Header Row with Title, Description, and History Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>
              {activeTab === 'scan' && "Document Checking & AI Scan Console"}
              {activeTab === 'unique-docs' && "Unique Ledger Database"}
              {activeTab === 'flagged-dups' && "Flagged Duplicate Records"}
              {activeTab === 'history' && "AI Scan Review History"}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748B' }}>
              {activeTab === 'scan' && "Upload or scan invoice/receipt files to identify duplicate payments."}
              {activeTab === 'unique-docs' && "Verified non-duplicate receipts cleared for normal FOMS validation."}
              {activeTab === 'flagged-dups' && "Flagged exact or highly similar records requiring manager investigation."}
              {activeTab === 'history' && "Chronological audit trail of all manual and automated AI validation reviews."}
            </p>
          </div>
        </div>

        {/* Unified Decision Support Notice */}
        <DecisionSupportNotice />

        {/* ==========================================
            TAB 1: DOCUMENT CHECKING & AI SCAN PAGE
            ========================================== */}
        {activeTab === 'scan' && (
          <div className="tab-pane fade-in">
            {/* Scan Step 0: Upload dropzone/Scan button console */}
            {!extractionDone && checkingStep === 0 && (
              <div
                className={`card ${dragActive ? 'drag-active' : ''}`}
                style={{
                  padding: '56px 24px', borderRadius: '16px',
                  border: dragActive ? '2px dashed var(--teal)' : '2px dashed #CBD5E1',
                  background: dragActive ? 'var(--teal-bg)' : '#ffffff',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)',
                  textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('simplified-uploader')?.click()}
              >
                <input
                  type="file"
                  id="simplified-uploader"
                  style={{ display: 'none' }}
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'var(--teal)', color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', boxShadow: '0 4px 12px rgba(0, 169, 157, 0.25)',
                }}>
                  <UploadCloud size={32} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: 'var(--tp)' }}>
                  Drag &amp; Drop or Upload Document
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--ts)', maxWidth: '420px', margin: '0 auto 24px', lineHeight: 1.5 }}>
                  Support JPG, JPEG, and PNG receipt statements up to 10MB.
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-primary" onClick={() => document.getElementById('simplified-uploader')?.click()} style={{ height: '38px', padding: '0 20px', fontWeight: 700 }}>
                    Choose File
                  </button>
                  <button className="btn btn-outline" onClick={handleOpenScanner} style={{ height: '38px', padding: '0 20px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Camera size={16} />
                    <span>Scan Document</span>
                  </button>
                </div>
              </div>
            )}

            {/* Checking Loader Steps (FLOW 2) */}
            {checkingStep > 0 && checkingStep < 5 && (
              <div className="card" style={{ padding: '48px 24px', textAlign: 'center', borderRadius: '16px' }}>
                <RefreshCw size={36} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--teal)', marginBottom: '16px' }} />
                <h4 style={{ fontSize: '16.5px', fontWeight: 700, marginBottom: '12px' }}>AI Engine Processing...</h4>
                
                <div style={{ width: '280px', height: '6px', background: 'var(--border)', borderRadius: '3px', margin: '0 auto 20px', overflow: 'hidden' }}>
                  <div style={{ width: `${checkingProgress}%`, height: '100%', background: 'var(--teal)', transition: 'width 0.3s ease' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--ts)', maxWidth: '280px', margin: '0 auto', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: checkingStep >= 1 ? 'var(--tp)' : 'var(--tt)' }}>
                    {checkingStep > 1 ? <CheckCircle size={14} style={{ color: 'var(--teal)' }} /> : <Clock size={14} />}
                    <span>Reading document</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: checkingStep >= 2 ? 'var(--tp)' : 'var(--tt)' }}>
                    {checkingStep > 2 ? <CheckCircle size={14} style={{ color: 'var(--teal)' }} /> : <Clock size={14} />}
                    <span>Extracting information</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: checkingStep >= 3 ? 'var(--tp)' : 'var(--tt)' }}>
                    {checkingStep > 3 ? <CheckCircle size={14} style={{ color: 'var(--teal)' }} /> : <Clock size={14} />}
                    <span>Comparing existing records</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: checkingStep >= 4 ? 'var(--tp)' : 'var(--tt)' }}>
                    {checkingStep > 4 ? <CheckCircle size={14} style={{ color: 'var(--teal)' }} /> : <Clock size={14} />}
                    <span>Preparing result</span>
                  </div>
                </div>
              </div>
            )}

            {/* Scan Step: OCR Corrections panel (FLOW 2) */}
            {extractionDone && scanResultMode === 'NONE' && (
              <div className="grid-2">
                <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                    Verify &amp; Correct OCR Parameters
                  </h3>

                  <div className="grid-2" style={{ marginBottom: '14px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ts)', display: 'block', marginBottom: '6px' }}>Document Type</label>
                      <select className="input-select" value={extDocType} onChange={(e: any) => setExtDocType(e.target.value)}>
                        <option value="OFFICIAL_RECEIPT">Official Receipt (OR)</option>
                        <option value="INVOICE">Invoice</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ts)', display: 'block', marginBottom: '6px' }}>Document Number</label>
                      <input type="text" className="form-control" value={extDocNum} onChange={(e) => setExtDocNum(e.target.value)} />
                    </div>
                  </div>

                  {ocrWarning && (
                    <div style={{ marginBottom: '14px', padding: '12px 14px', borderRadius: '10px', background: '#fff7ed', border: '1px solid #fdba74', color: '#9a5b00', fontSize: '12.5px', fontWeight: 700, lineHeight: 1.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={15} />
                        <span>{ocrWarning}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid-2" style={{ marginBottom: '14px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ts)', display: 'block', marginBottom: '6px' }}>Client Name</label>
                      <input type="text" className="form-control" value={extClient} onChange={(e) => setExtClient(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ts)', display: 'block', marginBottom: '6px' }}>Amount</label>
                      <input type="text" className="form-control" value={extAmount} onChange={(e) => setExtAmount(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid-2" style={{ marginBottom: '14px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ts)', display: 'block', marginBottom: '6px' }}>Transaction Date</label>
                      <input type="date" className="form-control" value={extDate} onChange={(e) => setExtDate(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ts)', display: 'block', marginBottom: '6px' }}>Reference Number</label>
                      <input type="text" className="form-control" value={extRef} onChange={(e) => setExtRef(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ts)', display: 'block', marginBottom: '6px' }}>Waybill Number</label>
                    <input type="text" className="form-control" value={extWaybill} onChange={(e) => setExtWaybill(e.target.value)} />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline" onClick={handleResetScanConsole}>Remove File</button>
                    <button className="btn btn-primary" onClick={handleRunDuplicateCheck} disabled={!canValidate}>
                      Check for Duplicate
                    </button>
                  </div>
                </div>

                {/* Scanned Document Preview Box */}
                <div className="card" style={{ padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', border: '1px solid var(--border)', minHeight: '340px' }}>
                  <img 
                    src={previewDocUrl || '/receipt_preview.png'} 
                    alt="Document Preview" 
                    style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: '8px', marginBottom: '10px', border: '1px solid var(--border)' }}
                  />
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--tp)' }}>{uploadFile?.name || 'scanned_document.png'}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--ts)' }}>Source: {sourceType}</div>
                </div>
              </div>
            )}

            {/* FLOW 3.5: INVALID / NON-FINANCIAL DOCUMENT RESULT */}
            {scanResultMode === 'INVALID' && (
              <div className="card fade-in" style={{ padding: '32px', borderRadius: '16px', border: '2px solid #fca5a5', background: 'linear-gradient(135deg, #fff1f2 0%, #fff7ed 100%)' }}>
                {/* Header */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: '#fee2e2', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <AlertTriangle size={24} style={{ color: '#dc2626' }} strokeWidth={2.5} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 800, color: '#9f1239' }}>
                      {ocrWarning?.includes('unavailable') || ocrWarning?.includes('temporarily')
                        ? 'AI Classification Service Unavailable'
                        : 'Invalid Document Uploaded'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b', lineHeight: 1.6 }}>
                      {ocrWarning ||
                        'The uploaded image does not appear to be an invoice, official receipt, billing statement, or payment-related document. Duplicate scanning was stopped.'}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid #fecaca', margin: '0 0 20px' }} />

                {/* Two-column: preview + rules */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                  {/* Uploaded image preview */}
                  {previewDocUrl && (
                    <div style={{ flex: '0 0 150px', background: '#fff', borderRadius: '10px', padding: '14px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #fecaca' }}>
                      <img src={previewDocUrl} alt="Rejected document" style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px', opacity: 0.75, filter: 'grayscale(30%)' }} />
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#dc2626', marginTop: '10px', fontWeight: 700, background: '#fee2e2', borderRadius: '4px', padding: '2px 8px' }}>
                        <X size={10} strokeWidth={3} /> REJECTED
                      </span>
                    </div>
                  )}

                  {/* Allowed types notice */}
                  <div style={{ flex: 1, minWidth: '200px', background: '#fff', borderRadius: '10px', padding: '18px 20px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ✅ Accepted Document Types
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#334155', lineHeight: 1.8 }}>
                      <li>Official Receipt (OR)</li>
                      <li>Sales Invoice or Billing Invoice</li>
                      <li>Billing Statement / Statement of Account</li>
                      <li>Waybill or Delivery Receipt</li>
                      <li>Proof of Payment (bank slip, GCash, SpeedPay)</li>
                    </ul>
                    <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#9f1239', margin: '12px 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ❌ Not Accepted
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#64748b', lineHeight: 1.8 }}>
                      <li>Selfies, portraits, or person photos</li>
                      <li>Food, scenery, or random photos</li>
                      <li>Screenshots unrelated to finance</li>
                      <li>Images with no invoice / OR number</li>
                    </ul>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    className="btn"
                    onClick={handleResetScanConsole}
                    style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0 16px', height: '40px', borderRadius: '8px', fontWeight: 600, fontSize: '13px' }}
                  >
                    Clear
                  </button>
                  <button
                    className="btn"
                    onClick={() => { handleResetScanConsole(); setTimeout(() => handleOpenScanner(), 100); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e2e8f0', color: '#334155', height: '40px', borderRadius: '8px', padding: '0 16px', fontWeight: 600, fontSize: '13px' }}
                  >
                    <Camera size={14} /> Scan Again
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => { handleResetScanConsole(); setTimeout(() => document.getElementById('simplified-uploader')?.click(), 100); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '40px', borderRadius: '8px', padding: '0 20px', fontWeight: 600, fontSize: '13px' }}
                  >
                    <UploadCloud size={14} /> Upload Valid Document
                  </button>
                </div>
              </div>
            )}


            {/* FLOW 4: NO POSSIBLE DUPLICATE FOUND RESULT (CLEAR) */}
            {scanResultMode === 'CLEAR' && (
              <div className="card fade-in" style={{ padding: '32px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    backgroundColor: 'var(--ok-bg)', color: 'var(--ok)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Check size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: 'var(--ok)' }}>
                      No Duplicate Detected
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--ts)' }}>
                      No matching Official Receipt or Invoice was found in the existing FOMS records.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '28px' }}>
                  {/* Left Column: parameters */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--s1)', padding: '20px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      <div><strong>Document Type:</strong> {extDocType.replace(/_/g, ' ')}</div>
                      <div><strong>Document Number:</strong> {extDocNum}</div>
                      <div><strong>Client Name:</strong> {extClient}</div>
                      <div><strong>Amount:</strong> ₱{parseFloat(extAmount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      <div><strong>Transaction Date:</strong> {extDate}</div>
                      <div><strong>Checked Date &amp; Time:</strong> {new Date().toLocaleString()}</div>
                      <div><strong>Checked By:</strong> AI System</div>
                      <div><strong>Match Confidence:</strong> 0% Match</div>
                    </div>
                  </div>

                  {/* Right Column: preview */}
                  <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
                    <img 
                      src={previewDocUrl || '/receipt_preview.png'} 
                      alt="Checked Preview" 
                      style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button className="btn btn-outline" onClick={handleResetScanConsole} style={{ padding: '6px 16px', fontSize: '13px', borderRadius: '20px', fontWeight: 600 }}>
                    Clear / Reset Console
                  </button>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" onClick={handleResetScanConsole}>Upload Another Document</button>
                    {canValidate && (
                      <>
                        <button 
                          className="btn btn-outline" 
                          onClick={handleSendToManualReview}
                          style={{ borderColor: 'var(--warn)', color: 'var(--warn-dark)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Clock size={15} />
                          Send for Manual Review
                        </button>
                        <button className="btn btn-primary" onClick={handleMarkAsUniqueClick}>
                          Mark as Unique
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* FLOW 5: POSSIBLE DUPLICATE DETECTED RESULT */}
            {scanResultMode === 'DUPLICATE' && (
              <div className="tab-pane fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="card" style={{ padding: '32px', borderRadius: '16px', border: '1px solid rgba(225, 29, 72, 0.2)' }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      backgroundColor: 'var(--err-bg)', color: 'var(--err)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: 'var(--err)' }}>
                        Possible Duplicate Detected
                      </h3>
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--ts)' }}>
                        A possible matching Official Receipt or Invoice already exists in FOMS.
                      </p>
                    </div>
                  </div>

                  {/* Document Previews side-by-side */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                    {/* Left: Uploaded Preview */}
                    <div className="card" style={{ padding: '16px', background: 'var(--s1)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: '12.5px', fontWeight: 700, color: 'var(--ts)', textTransform: 'uppercase' }}>Uploaded / Scanned Document</h4>
                      <div style={{ overflow: 'hidden', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <img 
                          src={previewDocUrl || '/mock_receipt.png'} 
                          alt="Uploaded candidate preview" 
                          style={{ 
                            maxHeight: '100%', 
                            maxWidth: '100%', 
                            objectFit: 'contain',
                            transform: `scale(${zoomLevel})`,
                            transition: 'transform 0.15s ease'
                          }}
                        />
                      </div>
                    </div>

                    {/* Right: Existing Match Preview */}
                    <div className="card" style={{ padding: '16px', background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: '12.5px', fontWeight: 700, color: 'var(--ts)', textTransform: 'uppercase' }}>Existing Matching FOMS Record</h4>
                      <div style={{ overflow: 'hidden', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--s1)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <img 
                          src={extDocType === 'INVOICE' ? '/mock_invoice.png' : '/mock_receipt.png'} 
                          alt="Existing database match preview" 
                          style={{ 
                            maxHeight: '100%', 
                            maxWidth: '100%', 
                            objectFit: 'contain',
                            opacity: 0.85,
                            transform: `scale(${zoomLevel})`,
                            transition: 'transform 0.15s ease'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Similarity Banner info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px', background: 'var(--warn-bg)', borderRadius: '8px', border: '1px solid rgba(249, 115, 22, 0.2)', marginBottom: '24px', fontSize: '13.5px', fontWeight: 600 }}>
                    <span style={{ color: 'var(--warn-dark)' }}>Highest Similarity: {similarityScore}% Match Score</span>
                    <span style={{ color: 'var(--ts)' }}>Checked Date &amp; Time: {new Date().toLocaleString()}</span>
                  </div>

                  {/* Side-by-side comparison table (Flow 5) */}
                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Comparison Parameters Matrix</h4>
                  <div style={{ overflowX: 'auto', marginBottom: '28px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'var(--s1)', borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: 'var(--ts)', textTransform: 'uppercase' }}>Field</th>
                          <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: 'var(--ts)', textTransform: 'uppercase' }}>Uploaded Document</th>
                          <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: 'var(--ts)', textTransform: 'uppercase' }}>Existing FOMS Record</th>
                          <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: 'var(--ts)', textTransform: 'uppercase' }}>Match Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600 }}>Document Type</td>
                          <td style={{ padding: '12px 14px', fontSize: '13px' }}>{extDocType.replace(/_/g, ' ')}</td>
                          <td style={{ padding: '12px 14px', fontSize: '13px' }}>{matchedRecordDetails?.registered_or ? 'Official Receipt' : 'Invoice'}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={getCellMatchStyle('type', extDocType, matchedRecordDetails?.registered_or ? 'OFFICIAL_RECEIPT' : 'INVOICE').style}>
                              {getCellMatchStyle('type', extDocType, matchedRecordDetails?.registered_or ? 'OFFICIAL_RECEIPT' : 'INVOICE').text}
                            </span>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600 }}>OR / Invoice Number</td>
                          <td style={{ padding: '12px 14px', fontSize: '13px', fontFamily: 'var(--fb)' }}>{extDocNum}</td>
                          <td style={{ padding: '12px 14px', fontSize: '13px', fontFamily: 'var(--fb)' }}>{matchedRecordDetails?.registered_or || matchedRecordDetails?.registered_invoice}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={getCellMatchStyle('docNum', extDocNum, matchedRecordDetails?.registered_or || matchedRecordDetails?.registered_invoice).style}>
                              {getCellMatchStyle('docNum', extDocNum, matchedRecordDetails?.registered_or || matchedRecordDetails?.registered_invoice).text}
                            </span>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600 }}>Client Name</td>
                          <td style={{ padding: '12px 14px', fontSize: '13px' }}>{extClient}</td>
                          <td style={{ padding: '12px 14px', fontSize: '13px' }}>{matchedRecordDetails?.client_name}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={getCellMatchStyle('client', extClient, matchedRecordDetails?.client_name).style}>
                              {getCellMatchStyle('client', extClient, matchedRecordDetails?.client_name).text}
                            </span>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600 }}>Amount</td>
                          <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700 }}>₱{parseFloat(extAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700 }}>₱{parseFloat(matchedRecordDetails?.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={getCellMatchStyle('amount', extAmount, matchedRecordDetails?.amount).style}>
                              {getCellMatchStyle('amount', extAmount, matchedRecordDetails?.amount).text}
                            </span>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600 }}>Transaction Date</td>
                          <td style={{ padding: '12px 14px', fontSize: '13px' }}>{extDate}</td>
                          <td style={{ padding: '12px 14px', fontSize: '13px' }}>{matchedRecordDetails?.entry_date}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={getCellMatchStyle('date', extDate, matchedRecordDetails?.entry_date).style}>
                              {getCellMatchStyle('date', extDate, matchedRecordDetails?.entry_date).text}
                            </span>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600 }}>Reference Number</td>
                          <td style={{ padding: '12px 14px', fontSize: '13px' }}>{extRef}</td>
                          <td style={{ padding: '12px 14px', fontSize: '13px' }}>{matchedRecordDetails?.reference_no}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={getCellMatchStyle('ref', extRef, matchedRecordDetails?.reference_no).style}>
                              {getCellMatchStyle('ref', extRef, matchedRecordDetails?.reference_no).text}
                            </span>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600 }}>Waybill Number</td>
                          <td style={{ padding: '12px 14px', fontSize: '13px' }}>{extWaybill}</td>
                          <td style={{ padding: '12px 14px', fontSize: '13px' }}>{matchedRecordDetails?.waybill_no}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={getCellMatchStyle('waybill', extWaybill, matchedRecordDetails?.waybill_no).style}>
                              {getCellMatchStyle('waybill', extWaybill, matchedRecordDetails?.waybill_no).text}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button className="btn btn-outline" onClick={handleZoomOut} title="Zoom Out" style={{ padding: '6px' }}><ZoomOut size={16} /></button>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ts)' }}>Zoom Preview: {zoomLevel.toFixed(2)}x</span>
                      <button className="btn btn-outline" onClick={handleZoomIn} title="Zoom In" style={{ padding: '6px' }}><ZoomIn size={16} /></button>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn btn-outline" onClick={() => setShowManualReviewPanel(true)}>
                        Need Manual Review
                      </button>
                      {canValidate && (
                        <>
                          <button className="btn btn-secondary animate-hover" onClick={handleMarkAsUniqueClick}>
                            Mark as Unique
                          </button>
                          <button className="btn btn-primary animate-hover" onClick={handleMarkAsDuplicateClick}>
                            Mark as Duplicate
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* FLOW 6: COMPREHENSIVE SIDE-BY-SIDE MANUAL REVIEW MODAL OVERLAY (SCREENSHOT MATCHED) */}
                {showManualReviewPanel && (
                  <div style={{
                    position: 'fixed', inset: 0, zIndex: 280,
                    background: 'rgba(15, 23, 42, 0.65)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: '20px',
                    backdropFilter: 'blur(3.5px)'
                  }}>
                    <div className="card fade-in" style={{
                      background: '#ffffff', borderRadius: '12px',
                      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', width: '100%', maxWidth: '840px',
                      maxHeight: '94vh', overflowY: 'auto', padding: '32px', border: '1px solid #E2E8F0'
                    }}>
                      {/* Modal Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>
                          Duplicate Record Comparison (Alert #{extDocNum.includes('9011') ? '27' : '28'})
                        </h3>
                        <button onClick={() => setShowManualReviewPanel(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                          <X size={20} />
                        </button>
                      </div>

                      {/* Matching Factors Confidence alert box */}
                      <div style={{ display: 'flex', gap: '12px', padding: '16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', marginBottom: '24px', alignItems: 'flex-start' }}>
                        <Info size={18} style={{ color: '#D97706', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <h5 style={{ margin: '0 0 4px', fontSize: '13.5px', fontWeight: 700, color: '#92400E' }}>
                            Matching Factors Confidence: {similarityScore}%
                          </h5>
                          <p style={{ margin: 0, fontSize: '13px', color: '#B45309', lineHeight: '1.4' }}>
                            Highly similar {extDocType === 'INVOICE' ? 'invoice' : 'receipt'} numbers: {extDocNum} and {matchedRecordDetails?.registered_or || matchedRecordDetails?.registered_invoice}.
                          </p>
                        </div>
                      </div>

                      {/* Image Preview with Zoom Controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748B' }}>Document Image Comparison View</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button className="btn btn-outline" onClick={handleZoomOut} title="Zoom Out" style={{ padding: '4px 8px', height: '28px', fontSize: '11px' }}><ZoomOut size={12} /></button>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', minWidth: '40px', textAlign: 'center' }}>{zoomLevel.toFixed(2)}x</span>
                          <button className="btn btn-outline" onClick={handleZoomIn} title="Zoom In" style={{ padding: '4px 8px', height: '28px', fontSize: '11px' }}><ZoomIn size={12} /></button>
                        </div>
                      </div>

                      {/* Side-by-Side Images */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                        <div style={{ overflow: 'hidden', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <img 
                            src={previewDocUrl || '/mock_receipt.png'} 
                            alt="Uploaded original doc" 
                            style={{ 
                              maxHeight: '100%', 
                              maxWidth: '100%', 
                              objectFit: 'contain',
                              transform: `scale(${zoomLevel})`,
                              transition: 'transform 0.15s ease'
                            }}
                          />
                        </div>
                        <div style={{ overflow: 'hidden', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <img 
                            src={extDocType === 'INVOICE' ? '/mock_invoice.png' : '/mock_receipt.png'} 
                            alt="Legar FOMS match doc" 
                            style={{ 
                              maxHeight: '100%', 
                              maxWidth: '100%', 
                              objectFit: 'contain',
                              opacity: 0.85,
                              transform: `scale(${zoomLevel})`,
                              transition: 'transform 0.15s ease'
                            }}
                          />
                        </div>
                      </div>

                      {/* Side-by-Side Columns Parameters (exact matched grid layout from screenshot) */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
                        {/* LEFT COLUMN: Original Record details */}
                        <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px', background: '#FFFFFF' }}>
                          <h4 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: '#0F766E', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                            Original Record details
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>amount</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>{parseFloat(extAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>dueDate</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>{extDate}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>clientId</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>C-004</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>invoiceId</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>INV-005</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>updatedAt</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>2026-07-14T12:00:00Z</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>clientName</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>{extClient}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>invoiceNumber</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>{extDocNum}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>invoiceStatus</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>Sent</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>paymentStatus</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>Unpaid</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>waybillNumber</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>{extWaybill || 'WB-2026-004'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>billingReference</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>{extRef || 'REF-DELTA-04'}</span>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: Possible Matching record */}
                        <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px', background: '#FFFFFF' }}>
                          <h4 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: '#0F766E', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                            Possible Matching record
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>amount</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>{parseFloat(matchedRecordDetails?.amount || '35000').toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>dueDate</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>{matchedRecordDetails?.entry_date || '2026-07-05'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>clientId</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>C-005</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>invoiceId</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>INV-006</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>updatedAt</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>2026-07-15T13:00:00Z</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>clientName</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>{matchedRecordDetails?.client_name || 'Epsilon Corp'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>invoiceNumber</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>{matchedRecordDetails?.registered_or || matchedRecordDetails?.registered_invoice || 'INV-2026-005'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>invoiceStatus</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>Sent</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>paymentStatus</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>{matchedRecordDetails?.status === 'Validated' ? 'Paid' : 'Unpaid'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>waybillNumber</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>{matchedRecordDetails?.waybill_no || 'WB-2026-005'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>billingReference</span>
                              <span style={{ color: '#0D9488', fontWeight: 700 }}>{matchedRecordDetails?.reference_no || 'REF-EPS-05'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Log Human Validation Action Section */}
                      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '20px', marginBottom: '14px' }}>
                        <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>
                          Log Human Validation Action
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px', color: '#334155' }}>
                              Review Decision
                            </label>
                            <select 
                              className="input-select" 
                              value={manualReviewDecision} 
                              onChange={(e) => setManualReviewDecision(e.target.value as any)}
                            >
                              <option value="Mark as Duplicate">Mark as Duplicate</option>
                              <option value="Mark as Unique">Mark as Unique</option>
                            </select>
                          </div>
                          <div>
                            {manualReviewDecision === 'Mark as Duplicate' ? (
                              <>
                                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px', color: '#334155' }}>
                                  Recommended Legacy Action
                                </label>
                                <select 
                                  className="input-select" 
                                  value={duplicateHandling} 
                                  onChange={(e) => setDuplicateHandling(e.target.value)}
                                >
                                  <option value="Flag and Block New Submission">Flag and Block New Submission</option>
                                  <option value="Link to Existing Record">Link to Existing Record</option>
                                  <option value="Return for Correction">Return for Correction</option>
                                  <option value="Keep for Investigation">Keep for Investigation</option>
                                </select>
                              </>
                            ) : (
                              <>
                                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px', color: '#334155' }}>
                                  Reason why the document is unique
                                </label>
                                <select 
                                  className="input-select" 
                                  value={uniqueReason} 
                                  onChange={(e) => setUniqueReason(e.target.value)}
                                >
                                  <option value="Different transaction">Different transaction</option>
                                  <option value="Different client">Different client</option>
                                  <option value="Different amount">Different amount</option>
                                  <option value="Different date">Different date</option>
                                  <option value="Different reference number">Different reference number</option>
                                  <option value="Similar document number only">Similar document number only</option>
                                  <option value="AI extraction error">AI extraction error</option>
                                  <option value="Other">Other</option>
                                </select>
                              </>
                            )}
                          </div>
                        </div>

                        {manualReviewDecision === 'Mark as Duplicate' && (
                          <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px', color: '#334155' }}>
                              Duplicate Reason Option
                            </label>
                            <select 
                              className="input-select" 
                              value={duplicateReason} 
                              onChange={(e) => setDuplicateReason(e.target.value)}
                            >
                              <option value="Same OR number">Same OR number</option>
                              <option value="Same Invoice number">Same Invoice number</option>
                              <option value="Same client and amount">Same client and amount</option>
                              <option value="Same reference number">Same reference number</option>
                              <option value="Same transaction details">Same transaction details</option>
                              <option value="Re-uploaded document">Re-uploaded document</option>
                              <option value="Previously recorded transaction">Previously recorded transaction</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        )}

                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px', color: '#334155' }}>
                            Remarks / Audit Notes <span style={{ color: 'var(--err)' }}>*</span>
                          </label>
                          <textarea
                            className="form-control"
                            placeholder="Explain matches or safety checks (required for auditor compliance logs)..."
                            style={{ width: '100%', minHeight: '80px', padding: '10px 12px', borderRadius: '8px', fontSize: '13px' }}
                            value={manualNote}
                            onChange={(e) => setManualNote(e.target.value)}
                          />
                        </div>

                        {/* Note information box */}
                        <div style={{ display: 'flex', gap: '10px', padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', marginBottom: '20px', alignItems: 'flex-start', fontSize: '12.5px', color: '#64748B' }}>
                          <Info size={16} style={{ color: '#94A3B8', marginTop: '2px', flexShrink: 0 }} />
                          <span>Note: Submitting this review records your validation inside the AI audit service database. It does not directly modify transaction data in the legacy FOMS MSSQL tables.</span>
                        </div>
                      </div>

                      {/* Footer Buttons */}
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                        <button className="btn btn-outline" style={{ height: '36px', minWidth: '90px' }} onClick={() => setShowManualReviewPanel(false)}>
                          Close
                        </button>
                        <button 
                          className="btn btn-primary" 
                          style={{ height: '36px', minWidth: '130px', backgroundColor: '#00A99D', borderColor: '#00A99D', color: '#FFFFFF', fontWeight: 700 }}
                          onClick={handleManualSubmitReview}
                          disabled={!manualNote.trim() || !canValidate}
                        >
                          Submit Review
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 2: UNIQUE DOCUMENTS TABLE (FLOW 8)
            ========================================== */}
        {activeTab === 'unique-docs' && (
          <div className="tab-pane fade-in">
            <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--sh1)' }}>
              <DataTable<UniqueDocument>
                title="Unique Documents"
                rowKey="id"
                data={uniques}
                selectable
                exportable
                columnToggle
                densityToggle
                searchPlaceholder="Search by ID, Doc #, Client..."
                searchFields={['id', 'documentNumber', 'clientName', 'reviewedBy'] as (keyof UniqueDocument)[]}
                filters={[
                  {
                    key: 'documentType',
                    label: 'Document Type',
                    options: [
                      { label: 'Invoices', value: 'INVOICE' },
                      { label: 'Official Receipts', value: 'OFFICIAL_RECEIPT' }
                    ]
                  }
                ]}
                columns={[
                  { key: 'id', label: 'Record ID', sortable: true, width: '140px' },
                  {
                    key: 'documentType', label: 'Type', sortable: true, width: '180px',
                    render: (row) => <>{row.documentType.replace(/_/g, ' ')}</>
                  },
                  { key: 'documentNumber', label: 'OR/Invoice Number', sortable: true, width: '200px' },
                  { key: 'clientName', label: 'Client Name', sortable: true, width: '240px' },
                  {
                    key: 'amount', label: 'Amount', sortable: true, width: '140px', align: 'right',
                    render: (row) => <>₱{parseFloat(row.amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}</>,
                  },
                  { key: 'transactionDate', label: 'Transaction Date', sortable: true, width: '170px' },
                  {
                    key: 'source', label: 'Source', sortable: true, width: '120px',
                    render: (row) => (
                      <span style={{ backgroundColor: row.source === 'Scanned' ? 'var(--teal-bg)' : 'var(--s2)', color: row.source === 'Scanned' ? 'var(--teal-dark)' : 'var(--tp)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                        {row.source}
                      </span>
                    )
                  },
                  {
                    key: 'aiConfidence', label: 'AI Confidence', sortable: true, width: '150px',
                    render: (row) => <>{row.aiConfidence}%</>
                  },
                  {
                    key: 'reviewedBy', label: 'Reviewed By', sortable: true, width: '180px',
                    render: (row) => (
                      <div>
                        <div>{row.reviewedBy}</div>
                        <span style={{ fontSize: '10px', color: 'var(--tt)' }}>{row.reviewerRole}</span>
                      </div>
                    )
                  },
                  {
                    key: 'reviewedDate', label: 'Reviewed Date', sortable: true, width: '160px',
                    render: (row) => <>{new Date(row.reviewedDate).toLocaleDateString()}</>
                  },
                  {
                    key: 'status', label: 'Status', sortable: true, width: '160px',
                    render: (row) => <StatusBadge status="Cleared" />
                  }
                ]}
                actions={[
                  {
                    label: 'View History',
                    icon: 'history',
                    onClick: (row) => {
                      setSelectedRecordHistoryNum(row.documentNumber);
                      setShowRecordHistoryModal(true);
                    }
                  },
                  {
                    label: 'Details',
                    icon: 'info',
                    onClick: (row) => {
                      toast.info(`Reviewer Notes: "${row.reviewerNote}"`, `Review Details: ${row.reason}`);
                    }
                  },
                  {
                    label: 'Validate',
                    icon: 'check-circle',
                    onClick: () => {
                      toast.success("Document transaction forwarded to FOMS validation pipeline.", "Pipeline Active");
                    }
                  }
                ]}
                emptyMessage="No unique documents found."
                defaultPageSize={10}
              />
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 3: FLAGGED DUPLICATE DOCUMENTS TABLE (FLOW 10)
            ========================================== */}
        {activeTab === 'flagged-dups' && (
          <div className="tab-pane fade-in">
            <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--sh1)' }}>
              <DataTable<FlaggedDuplicate>
                title="Flagged Duplicate Documents"
                rowKey="id"
                data={duplicates}
                selectable
                exportable
                columnToggle
                densityToggle
                searchPlaceholder="Search by ID, Doc #, Client..."
                searchFields={['id', 'uploadedDocumentNumber', 'clientName', 'flaggedBy'] as (keyof FlaggedDuplicate)[]}
                filters={[
                  {
                    key: 'documentType',
                    label: 'Document Type',
                    options: [
                      { label: 'Invoices', value: 'INVOICE' },
                      { label: 'Official Receipts', value: 'OFFICIAL_RECEIPT' }
                    ]
                  }
                ]}
                columns={[
                  { key: 'id', label: 'Flag ID', sortable: true, width: '140px' },
                  {
                    key: 'documentType', label: 'Type', sortable: true, width: '180px',
                    render: (row) => <>{row.documentType.replace(/_/g, ' ')}</>
                  },
                  { key: 'uploadedDocumentNumber', label: 'Uploaded Number', sortable: true, width: '190px' },
                  {
                    key: 'existingMatchedRecord', label: 'Existing Record', sortable: true, width: '180px',
                    render: (row) => <code>{row.existingMatchedRecord}</code>
                  },
                  { key: 'clientName', label: 'Client Name', sortable: true, width: '240px' },
                  {
                    key: 'amount', label: 'Amount', sortable: true, width: '140px', align: 'right',
                    render: (row) => <>₱{parseFloat(row.amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}</>,
                  },
                  {
                    key: 'similarityScore', label: 'Similarity', sortable: true, width: '140px',
                    render: (row) => <span style={{ color: 'var(--err)', fontWeight: 700 }}>{row.similarityScore}%</span>
                  },
                  { key: 'duplicateReason', label: 'Duplicate Reason', sortable: true, width: '220px' },
                  { key: 'handlingAction', label: 'Handling Action', sortable: true, width: '240px' },
                  {
                    key: 'flaggedBy', label: 'Flagged By', sortable: true, width: '180px',
                    render: (row) => (
                      <div>
                        <div>{row.flaggedBy}</div>
                        <span style={{ fontSize: '10px', color: 'var(--tt)' }}>{row.reviewerRole}</span>
                      </div>
                    )
                  },
                  {
                    key: 'flaggedDate', label: 'Flagged Date', sortable: true, width: '160px',
                    render: (row) => <>{new Date(row.flaggedDate).toLocaleDateString()}</>
                  },
                  {
                    key: 'status', label: 'Status', sortable: true, width: '160px',
                    render: (row) => <StatusBadge status="90+ Days" />
                  }
                ]}
                actions={[
                  {
                    label: 'View History',
                    icon: 'history',
                    onClick: (row) => {
                      setSelectedRecordHistoryNum(row.uploadedDocumentNumber);
                      setShowRecordHistoryModal(true);
                    }
                  },
                  {
                    label: 'Details',
                    icon: 'info',
                    onClick: (row) => {
                      toast.info(`Reviewer Notes: "${row.reviewerNote}"`, `Review Details: ${row.duplicateReason}`);
                    }
                  },
                  {
                    label: 'Open Record',
                    icon: 'external-link',
                    onClick: (row) => {
                      toast.success(`Opening linked transaction ledger record ${row.existingMatchedRecord}...`, "FOMS Ledger Link");
                    }
                  }
                ]}
                emptyMessage="No flagged duplicates cataloged."
                defaultPageSize={10}
              />
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 4: REVIEW HISTORY LEDGER (FLOW 11)
            ========================================== */}
        {activeTab === 'history' && (
          <div className="tab-pane fade-in">
            {/* Immutable Ledger Banner */}
            <div className="advisory-banner" style={{ backgroundColor: 'var(--ok-bg)', borderColor: 'var(--ok-r)', color: 'var(--tp)', marginBottom: '20px' }}>
              <CheckCircle size={20} style={{ color: 'var(--ok)', flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', display: 'block', marginBottom: '4px', color: 'var(--ok)', letterSpacing: '0.05em' }}>
                  Immutable Review Ledger
                </span>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--ts)' }}>
                  All completed duplicate detection human review decisions cataloged in this ledger are write-locked and read-only.
                </p>
              </div>
            </div>

            <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--sh1)' }}>
              <DataTable<HistoryRecord>
                title="Review History"
                rowKey="id"
                data={historyList}
                selectable
                exportable
                columnToggle
                densityToggle
                searchPlaceholder="Search by ID, Doc #, Client..."
                searchFields={['id', 'documentNumber', 'clientName', 'reviewer'] as (keyof HistoryRecord)[]}
                filters={[
                  {
                    key: 'finalDecision',
                    label: 'Decision',
                    options: [
                      { label: 'Marked as Unique', value: 'Marked as Unique' },
                      { label: 'Marked as Duplicate', value: 'Marked as Duplicate' }
                    ]
                  }
                ]}
                columns={[
                  { key: 'id', label: 'History ID', sortable: true, width: '140px' },
                  {
                    key: 'documentType', label: 'Type', sortable: true, width: '180px',
                    render: (row) => <>{row.documentType.replace(/_/g, ' ')}</>
                  },
                  { key: 'documentNumber', label: 'Document Number', sortable: true, width: '190px' },
                  { key: 'clientName', label: 'Client Name', sortable: true, width: '240px' },
                  { key: 'aiResult', label: 'AI Result', sortable: true, width: '200px' },
                  {
                    key: 'finalDecision', label: 'Final Decision', sortable: true, width: '180px',
                    render: (row) => (
                      <span style={{
                        backgroundColor: row.finalDecision === 'Marked as Duplicate' ? 'var(--err-bg)' : 'var(--ok-bg)',
                        color: row.finalDecision === 'Marked as Duplicate' ? 'var(--err)' : 'var(--ok)',
                        fontWeight: 700, padding: '3px 8px', borderRadius: '4px', fontSize: '11px'
                      }}>
                        {row.finalDecision}
                      </span>
                    )
                  },
                  {
                    key: 'reviewer', label: 'Reviewer', sortable: true, width: '180px',
                    render: (row) => (
                      <div>
                        <div>{row.reviewer}</div>
                        <span style={{ fontSize: '10px', color: 'var(--tt)' }}>{row.reviewerRole}</span>
                      </div>
                    )
                  },
                  { key: 'decisionReason', label: 'Decision Reason', sortable: true, width: '220px' },
                  { key: 'reviewerNote', label: 'Reviewer Note', sortable: false, width: '260px' },
                  {
                    key: 'reviewedDate', label: 'Reviewed Date', sortable: true, width: '180px',
                    render: (row) => <>{new Date(row.reviewedDate).toLocaleString()}</>
                  }
                ]}
                emptyMessage="No decisions have been verified yet."
                defaultPageSize={10}
              />
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          SCAN VIEWPORT DIALOG VIEW (FLOW 1)
          ========================================== */}
      {/* ==========================================
          SCAN DOCUMENT CAMERA SIMULATOR MODAL
          ========================================== */}
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <Modal
        isOpen={showCameraModal}
        onClose={() => { stopCameraStream(); setShowCameraModal(false); }}
        title="Scan Document Console"
        footerButtons={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn btn-outline" onClick={() => { stopCameraStream(); setShowCameraModal(false); }}>Close</button>
            {cameraActive ? (
              <button className="btn btn-primary" onClick={handleCaptureScan} disabled={!!cameraError}>Capture Scan</button>
            ) : (
              <>
                <button className="btn btn-outline" onClick={handleRetakeScan}>Retake</button>
                <button className="btn btn-primary" onClick={handleConfirmScan} disabled={!capturedImage}>Confirm Scan</button>
              </>
            )}
          </div>
        }
      >
        {/* Camera error state */}
        {cameraError && (
          <div style={{ background: 'var(--err-bg)', border: '1px solid rgba(225,29,72,0.2)', borderRadius: '10px', padding: '16px 20px', marginBottom: '12px', fontSize: '13.5px', color: 'var(--err)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Live camera feed */}
        {cameraActive && !cameraError && (
          <div style={{
            position: 'relative', width: '100%', height: '300px',
            background: '#0B0F19', borderRadius: '12px',
            overflow: 'hidden', border: '2px solid var(--teal)'
          }}>
            {/* Scanning overlay guides */}
            <div style={{
              position: 'absolute', inset: '24px', border: '2px dashed var(--teal)',
              opacity: 0.6, pointerEvents: 'none', borderRadius: '8px', zIndex: 2
            }} />
            <div style={{
              position: 'absolute', width: '100%', height: '2px',
              background: 'var(--teal)', top: '50%', zIndex: 2,
              animation: 'scanLineAnim 2.5s ease-in-out infinite'
            }} />

            {/* 🔄 Camera flip button — top-right overlay */}
            <button
              onClick={handleFlipCamera}
              title={facingMode === 'environment' ? 'Switch to Front Camera' : 'Switch to Back Camera'}
              style={{
                position: 'absolute', top: '10px', right: '10px', zIndex: 10,
                background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '50%', width: '40px', height: '40px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#ffffff', backdropFilter: 'blur(4px)',
                transition: 'background 0.2s'
              }}
            >
              <SwitchCamera size={18} />
            </button>

            {/* Camera label pill — bottom-left */}
            <div style={{
              position: 'absolute', bottom: '10px', left: '10px', zIndex: 10,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
              borderRadius: '20px', padding: '4px 10px',
              fontSize: '11px', fontWeight: 600, color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              <Camera size={11} />
              {facingMode === 'environment' ? 'Back Camera' : 'Front Camera'}
            </div>

            {/* Real webcam video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px',
                // Mirror the front cam so text appears naturally
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
              }}
            />
          </div>
        )}

        {/* Captured real image preview */}
        {!cameraActive && capturedImage && (
          <div style={{ textAlign: 'center', background: 'var(--s1)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <img 
              src={capturedImage} 
              alt="Captured Document" 
              style={{ maxHeight: '300px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border)' }}
            />
            <p style={{ marginTop: '10px', fontSize: '12.5px', color: 'var(--ts)' }}>✅ Image captured. Click <strong>Confirm Scan</strong> to process, or <strong>Retake</strong> to try again.</p>
          </div>
        )}

        {/* No camera, no error, no capture — loading state */}
        {cameraActive && !cameraError && (
          <p style={{ textAlign: 'center', fontSize: '12.5px', color: 'var(--ts)', marginTop: '8px' }}>Point your camera at the invoice/receipt, then click <strong>Capture Scan</strong>.</p>
        )}
      </Modal>

      {/* ==========================================
          CONFIRM UNIQUE DOCUMENT MODAL (FLOW 7)
          ========================================== */}
      <Modal
        isOpen={showUniqueConfirmModal}
        onClose={() => setShowUniqueConfirmModal(false)}
        title="Confirm Unique Document"
        footerButtons={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn btn-outline" onClick={() => setShowUniqueConfirmModal(false)}>Cancel</button>
            <button className="btn btn-secondary animate-hover" onClick={submitConfirmUnique} disabled={!uniqueNote.trim()}>
              Confirm Unique
            </button>
          </div>
        }
      >
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            Reason the document is unique <span style={{ color: 'var(--err)' }}>*</span>
          </label>
          <select className="input-select" value={uniqueReason} onChange={(e) => setUniqueReason(e.target.value)}>
            <option value="Different transaction">Different transaction</option>
            <option value="Different client">Different client</option>
            <option value="Different amount">Different amount</option>
            <option value="Different date">Different date</option>
            <option value="Different reference number">Different reference number</option>
            <option value="Similar document number only">Similar document number only</option>
            <option value="AI extraction error">AI extraction error</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            Reviewer Note <span style={{ color: 'var(--err)' }}>*</span>
          </label>
          <textarea
            className="form-control"
            placeholder="Write reviewer remarks to justify clearance..."
            style={{ width: '100%', minHeight: '80px', padding: '10px 12px', borderRadius: '8px', fontSize: '13.5px' }}
            value={uniqueNote}
            onChange={(e) => setUniqueNote(e.target.value)}
          />
        </div>
      </Modal>

      {/* ==========================================
          CONFIRM DUPLICATE DOCUMENT MODAL (FLOW 9)
          ========================================== */}
      <Modal
        isOpen={showDuplicateConfirmModal}
        onClose={() => setShowDuplicateConfirmModal(false)}
        title="Confirm Duplicate Document"
        footerButtons={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn btn-outline" onClick={() => setShowDuplicateConfirmModal(false)}>Cancel</button>
            <button className="btn btn-primary animate-hover" onClick={submitConfirmDuplicate} disabled={!duplicateNote.trim()}>
              Confirm Duplicate
            </button>
          </div>
        }
      >
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            Duplicate Reason <span style={{ color: 'var(--err)' }}>*</span>
          </label>
          <select className="input-select" value={duplicateReason} onChange={(e) => setDuplicateReason(e.target.value)}>
            <option value="Same OR number">Same OR number</option>
            <option value="Same Invoice number">Same Invoice number</option>
            <option value="Same client and amount">Same client and amount</option>
            <option value="Same reference number">Same reference number</option>
            <option value="Same transaction details">Same transaction details</option>
            <option value="Re-uploaded document">Re-uploaded document</option>
            <option value="Previously recorded transaction">Previously recorded transaction</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            Handling Action <span style={{ color: 'var(--err)' }}>*</span>
          </label>
          <select className="input-select" value={duplicateHandling} onChange={(e) => setDuplicateHandling(e.target.value)}>
            <option value="Flag and Block New Submission">Flag and Block New Submission</option>
            <option value="Link to Existing Record">Link to Existing Record</option>
            <option value="Return for Correction">Return for Correction</option>
            <option value="Keep for Investigation">Keep for Investigation</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            Reviewer Note <span style={{ color: 'var(--err)' }}>*</span>
          </label>
          <textarea
            className="form-control"
            placeholder="Log notes about double submission validation..."
            style={{ width: '100%', minHeight: '80px', padding: '10px 12px', borderRadius: '8px', fontSize: '13.5px' }}
            value={duplicateNote}
            onChange={(e) => setDuplicateNote(e.target.value)}
          />
        </div>
      </Modal>

      {/* ==========================================
          RECORD ACTION HISTORY TIMELINE MODAL
          ========================================== */}
      {/* ==========================================
          RECORD ACTION HISTORY TIMELINE MODAL
          ========================================== */}
      <Modal
        isOpen={showRecordHistoryModal}
        onClose={() => setShowRecordHistoryModal(false)}
        title={`Document History & Review Actions — ${selectedRecordHistoryNum}`}
        footerButtons={
          <button className="btn btn-outline" style={{ height: '36px' }} onClick={() => setShowRecordHistoryModal(false)}>
            Close History
          </button>
        }
      >
        {/* Chronological Action Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {historyList.filter(h => h.documentNumber === selectedRecordHistoryNum || h.target_id === selectedRecordHistoryNum).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748B', fontStyle: 'italic', fontSize: '13px' }}>
              No recorded action history entries logged for this document number.
            </div>
          ) : (
            historyList
              .filter(h => h.documentNumber === selectedRecordHistoryNum || h.target_id === selectedRecordHistoryNum)
              .map((h, i) => (
                <div key={h.id || i} style={{ display: 'flex', gap: '12px', borderLeft: '2px solid #E2E8F0', paddingLeft: '16px', marginLeft: '6px', position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: '-6px', top: '2px', width: '10px', height: '10px',
                    borderRadius: '50%', background: h.finalDecision === 'Marked as Duplicate' ? '#EF4444' : '#0D9488'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>{h.finalDecision}</span>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(h.reviewedDate || h.review_date || '').toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '4px' }}>
                      <strong>Reviewer:</strong> {h.reviewer} ({h.reviewerRole})
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '4px' }}>
                      <strong>Decision Reason:</strong> {h.decisionReason}
                    </div>
                    <div style={{ fontSize: '12.5px', background: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', border: '1px solid #F1F5F9', color: '#64748B', fontStyle: 'italic' }}>
                      "{h.reviewerNote || h.remarks || 'No notes logged.'}"
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </Modal>

      {/* Styled Scanner Animation frames */}
      <style>{`
        @keyframes scanLineAnim {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
};
