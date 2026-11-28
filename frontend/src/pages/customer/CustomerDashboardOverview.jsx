import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  ShieldIcon,
  UserIcon,
  WalletIcon,
  BankIcon,
  LandmarkIcon,
  SmartphoneIcon,
  ReceiptIcon,
  HistoryIcon,
  LayersIcon,
  BellIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SearchIcon,
  ZapIcon,
  DropletIcon,
  FlameIcon,
  TvIcon,
  WifiIcon,
  MoreHorizontalIcon,
  ChevronRightIcon,
  TrendingUpIcon,
  InfoIcon,
  QrCodeIcon,
  SendIcon,
  CopyIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  RefreshCwIcon,
  XIcon,
  CreditCardIcon,
  SparklesIcon,
  HelpCircleIcon,
  ShareIcon,
  DownloadIcon,
  MapPinIcon,
  ArrowLeftIcon
} from '../../components/Icons';
import bankAccountService from '../../services/bankAccountService';
import upiService from '../../services/upiService';
import walletService from '../../services/walletService';
import transactionService from '../../services/transactionService';
import billService from '../../services/billService';
import landService from '../../services/landService';
import { SUPPORTED_BANKS } from '../../utils/bankValidation';

const CustomerDashboardOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [walletOverview, setWalletOverview] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [upiHandles, setUpiHandles] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [txnsLoading, setTxnsLoading] = useState(true);
  const [activeBillCategory, setActiveBillCategory] = useState('electricity');
  const [billersList, setBillersList] = useState([]);
  const [billerSearch, setBillerSearch] = useState('');
  const [dataRefreshing, setDataRefreshing] = useState(false);

  // Digital Land & SIP States
  const [landProjects, setLandProjects] = useState([]);
  const [landHoldingsSummary, setLandHoldingsSummary] = useState({ totalUnitsHeld: 0, totalInvestedValue: 0 });
  const [featuredLandProject, setFeaturedLandProject] = useState(null);

  // Modals state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [scanPayModalOpen, setScanPayModalOpen] = useState(false);
  const [checkBalanceModalOpen, setCheckBalanceModalOpen] = useState(false);
  const [addMoneyModalOpen, setAddMoneyModalOpen] = useState(false);
  const [sipModalOpen, setSipModalOpen] = useState(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [infoModal, setInfoModal] = useState(null);

  // GPay Onboarding States
  const [onboardingStep, setOnboardingStep] = useState(1); // 1 = Consent, 2 = Bank, 3 = UPI, 4 = Success
  const [selectedOnboardBank, setSelectedOnboardBank] = useState(null);
  const [onboardBankSearch, setOnboardBankSearch] = useState('');
  const [onboardUpiHandle, setOnboardUpiHandle] = useState('');
  const [onboardSetPrimary, setOnboardSetPrimary] = useState(true);
  // Paytm-style optional consents: strictly FALSE by default (opt-in)
  const [optInWhatsapp, setOptInWhatsapp] = useState(false);
  const [optInSms, setOptInSms] = useState(false);
  const [onboardingSubmitting, setOnboardingSubmitting] = useState(false);

  // Interaction states
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [quickAmount, setQuickAmount] = useState('500');
  const [scanUpiInput, setScanUpiInput] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [balanceRefreshing, setBalanceRefreshing] = useState(false);

  // Check Balance (PhonePe-style flow) states
  const [checkBalanceStep, setCheckBalanceStep] = useState('list'); // 'list' | 'pin' | 'loading' | 'result'
  const [selectedBalanceBank, setSelectedBalanceBank] = useState(null);
  const [upiPinInput, setUpiPinInput] = useState('');
  const [showUpiPin, setShowUpiPin] = useState(false);
  const [upiPinError, setUpiPinError] = useState('');
  const [fetchedBankBalance, setFetchedBankBalance] = useState(null);

  // My QR Carousel state (0 = Bank UPI QR, 1 = ApnaPay Wallet QR)
  const [activeQrSlide, setActiveQrSlide] = useState(0);
  const [qrTouchStartX, setQrTouchStartX] = useState(null);

  // Live QR Camera Scanner states & refs
  const qrVideoRef = useRef(null);
  const qrStreamRef = useRef(null);
  const qrFileInputRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [scannedPayeeInfo, setScannedPayeeInfo] = useState('');

  const stopQrCamera = useCallback(() => {
    if (qrStreamRef.current) {
      qrStreamRef.current.getTracks().forEach((t) => {
        try { t.stop(); } catch { }
      });
      qrStreamRef.current = null;
    }
    if (qrVideoRef.current) {
      qrVideoRef.current.srcObject = null;
    }
    setCameraStream(null);
    setCameraActive(false);
    setTorchOn(false);
  }, []);

  const parseScannedQrValue = useCallback((rawValue) => {
    const val = String(rawValue || '').trim();
    if (!val) return;
    if (val.toLowerCase().startsWith('upi://')) {
      try {
        const url = new URL(val);
        const pa = url.searchParams.get('pa') || '';
        const pn = url.searchParams.get('pn') || '';
        const am = url.searchParams.get('am') || '';
        if (pa) setScanUpiInput(pa);
        if (am && !isNaN(parseFloat(am))) setQuickAmount(String(parseFloat(am)));
        setScannedPayeeInfo(pn ? `${pn} (${pa})` : pa);
        showToast(`QR Scanned: ${pn || pa}`);
        return;
      } catch { }
    }
    setScanUpiInput(val);
    setScannedPayeeInfo(val);
    showToast(`QR Scanned: ${val}`);
  }, []);

  const startQrCamera = useCallback(async () => {
    setCameraError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API is not supported in this browser. Use Upload QR or manual UPI ID.');
      return;
    }
    try {
      stopQrCamera();
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      qrStreamRef.current = stream;
      setCameraStream(stream);
      setCameraActive(true);
    } catch (err) {
      const errName = err?.name || '';
      const errText = err?.message || '';
      const isSystemDenied = errText.toLowerCase().includes('system');
      const msg = isSystemDenied
        ? 'Camera blocked by Windows Privacy Settings. Enable Camera access in Windows Settings → Privacy & Security → Camera, then click Retry.'
        : errName === 'NotAllowedError' || errName === 'PermissionDeniedError'
          ? `Camera permission denied (${errText || errName}). Click "Reset permission" in browser address bar or allow camera, then click Retry.`
          : errName === 'NotFoundError' || errName === 'DevicesNotFoundError'
            ? 'No camera device found. You can Upload a QR image or enter UPI ID below.'
            : errName === 'NotReadableError' || errName === 'TrackStartError'
              ? 'Camera is busy in another app/tab. Close other camera apps and click Retry.'
              : `Unable to start camera (${errName}: ${errText}). You can Upload a QR image or enter UPI ID below.`;
      setCameraError(msg);
      setCameraActive(false);
    }
  }, [stopQrCamera]);

  // Attach MediaStream to mounted <video> reliably (even across portal mounts)
  useEffect(() => {
    const videoEl = qrVideoRef.current;
    if (!scanPayModalOpen || !cameraStream || !videoEl) return;
    videoEl.srcObject = cameraStream;
    videoEl.play().catch(() => {});
  }, [scanPayModalOpen, cameraStream]);

  // Start/stop camera automatically when Scan & Pay modal opens/closes
  useEffect(() => {
    if (!scanPayModalOpen) {
      stopQrCamera();
      setCameraError('');
      setScannedPayeeInfo('');
      return;
    }
    startQrCamera();
    return () => {
      stopQrCamera();
    };
  }, [scanPayModalOpen, startQrCamera, stopQrCamera]);

  // Live QR BarcodeDetector loop while camera is active
  useEffect(() => {
    if (!scanPayModalOpen || !cameraActive) return;
    if (typeof window === 'undefined' || !('BarcodeDetector' in window)) return;

    let detector;
    try {
      detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    } catch {
      return;
    }

    const timer = setInterval(async () => {
      if (!qrVideoRef.current || qrVideoRef.current.readyState < 2) return;
      try {
        const codes = await detector.detect(qrVideoRef.current);
        if (codes && codes.length > 0 && codes[0].rawValue) {
          parseScannedQrValue(codes[0].rawValue);
        }
      } catch { }
    }, 400);

    return () => clearInterval(timer);
  }, [scanPayModalOpen, cameraActive, parseScannedQrValue]);

  const handleToggleTorch = async () => {
    const track = qrStreamRef.current?.getVideoTracks?.()[0];
    if (!track) {
      showToast('Start camera first to toggle torch.');
      return;
    }
    const caps = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
    if (!caps?.torch) {
      showToast('Torch/flashlight is not supported on this camera.');
      return;
    }
    try {
      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      showToast('Could not toggle camera torch.');
    }
  };

  const handleUploadQrImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const bitmap = await createImageBitmap(file);
        const codes = await detector.detect(bitmap);
        if (codes && codes.length > 0 && codes[0].rawValue) {
          parseScannedQrValue(codes[0].rawValue);
          return;
        }
        showToast('No QR code detected in the selected image.');
        return;
      } catch { }
    }
    showToast('QR image loaded. Enter UPI ID below if auto-decode is unavailable.');
  };

  // SIP Simulator interactive state
  const [sipFrequency, setSipFrequency] = useState('daily'); // 'daily' | 'monthly'
  const [sipAmount, setSipAmount] = useState('50');
  const [sipHorizonYears, setSipHorizonYears] = useState(3);

  // Toast notification helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? '' : cur));
    }, 2800);
  };

  // Global custom event listeners (from DashboardLayout header and mobile bottom nav)
  useEffect(() => {
    const handleOpenScanner = () => setScanPayModalOpen(true);
    const handleOpenMyQr = () => setQrModalOpen(true);

    window.addEventListener('open-qr-scanner', handleOpenScanner);
    window.addEventListener('open-my-qr', handleOpenMyQr);

    return () => {
      window.removeEventListener('open-qr-scanner', handleOpenScanner);
      window.removeEventListener('open-my-qr', handleOpenMyQr);
    };
  }, []);

  // Lock body scroll when any modal is open
  useEffect(() => {
    const hasActiveModal = Boolean(
      qrModalOpen ||
      scanPayModalOpen ||
      checkBalanceModalOpen ||
      addMoneyModalOpen ||
      sipModalOpen ||
      onboardingModalOpen ||
      infoModal
    );
    if (hasActiveModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [qrModalOpen, scanPayModalOpen, checkBalanceModalOpen, addMoneyModalOpen, sipModalOpen, onboardingModalOpen, infoModal]);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setQrModalOpen(false);
        setScanPayModalOpen(false);
        setCheckBalanceModalOpen(false);
        setAddMoneyModalOpen(false);
        setSipModalOpen(false);
        setOnboardingModalOpen(false);
        setInfoModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Format currency helpers
  const formatINR = (val) => {
    const num = parseFloat(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return String(dateStr);
    }
  };

  // Fetch all live overview data
  const loadOverviewData = useCallback(async () => {
    setDataRefreshing(true);
    try {
      const [walletRes, banksRes, upiRes, txnsRes, billersRes, landRes, holdingsRes] = await Promise.all([
        walletService.getOverview().catch(() => ({ data: null })),
        bankAccountService.getLinkedAccounts().catch(() => ({ data: [] })),
        upiService.getUpiHandles().catch(() => ({ data: [] })),
        transactionService.getTransactions({ page: 1, limit: 5 }).catch(() => ({ data: { records: [] } })),
        billService.getBillers(activeBillCategory, 1, 10).catch(() => ({ data: { billers: [] } })),
        landService.getProjects({ page: 1, limit: 6 }).catch(() => ({ data: { projects: [] } })),
        landService.getHoldings({ page: 1, limit: 10 }).catch(() => ({ data: { holdings: [], portfolioSummary: {} } }))
      ]);

      if (walletRes?.data) setWalletOverview(walletRes.data);
      if (banksRes?.data) setBankAccounts(banksRes.data);
      if (upiRes?.data) setUpiHandles(upiRes.data);
      if (txnsRes?.data?.records) setRecentTransactions(txnsRes.data.records);

      if (landRes?.data?.projects?.length) {
        setLandProjects(landRes.data.projects);
        setFeaturedLandProject(landRes.data.projects[0]);
      } else {
        // High quality fallback project matching actual seed database
        setFeaturedLandProject({
          title: 'Cyber City Commercial Parcel',
          city: 'Gurgaon',
          state: 'Haryana',
          price_per_unit: 1000,
          available_units: 850,
          total_units: 1000,
          risk_category: 'Low',
          asset_type: 'Commercial Grade-A'
        });
      }

      if (holdingsRes?.data?.portfolioSummary) {
        setLandHoldingsSummary(holdingsRes.data.portfolioSummary);
      }

      const rawBillers = Array.isArray(billersRes?.data)
        ? billersRes.data
        : (billersRes?.data?.billers || billersRes?.billers || []);
      if (rawBillers.length > 0) {
        setBillersList(
          rawBillers.map((b) => ({
            billerId: b.id || b.billerId || b.biller_code,
            billerName: b.biller_name || b.billerName || 'Biller',
            state: b.state || 'India'
          }))
        );
      } else {
        setBillersList([
          { billerId: 'MPPKVVCL-W', billerName: 'MPPKVVCL - West Discom', state: 'Madhya Pradesh' },
          { billerId: 'BSES-RAJ', billerName: 'BSES Rajdhani Power Ltd', state: 'Delhi' },
          { billerId: 'TATA-PWR-MUM', billerName: 'Tata Power Electricity', state: 'Mumbai' },
          { billerId: 'ADANI-ELEC-MUM', billerName: 'Adani Electricity', state: 'Mumbai' }
        ]);
      }
    } catch (err) {
      console.warn('Overview load warning:', err.message);
    } finally {
      setWalletLoading(false);
      setTxnsLoading(false);
      setDataRefreshing(false);
    }
  }, [activeBillCategory]);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  // Handle category switch in bill payments widget
  const handleCategoryChange = async (catKey) => {
    setActiveBillCategory(catKey);
    setBillerSearch('');
    try {
      const res = await billService.getBillers(catKey, 1, 10);
      const rawList = Array.isArray(res?.data) ? res.data : (res?.data?.billers || res?.billers || []);
      if (rawList.length > 0) {
        setBillersList(
          rawList.map((b) => ({
            billerId: b.id || b.billerId || b.biller_code,
            billerName: b.biller_name || b.billerName || 'Biller',
            state: b.state || 'India'
          }))
        );
        return;
      }
      if (catKey === 'water') {
        setBillersList([
          { billerId: 'DELHI-JAL-BOARD', billerName: 'Delhi Jal Board', state: 'Delhi' },
          { billerId: 'BWSSB-BLR', billerName: 'Bangalore Water Supply (BWSSB)', state: 'Karnataka' },
          { billerId: 'MCGM-WATER', billerName: 'MCGM Water Department', state: 'Mumbai' }
        ]);
      } else if (catKey === 'gas') {
        setBillersList([
          { billerId: 'IGL-GAS', billerName: 'Indraprastha Gas (IGL)', state: 'Delhi NCR' },
          { billerId: 'MGL-GAS', billerName: 'Mahanagar Gas Limited (MGL)', state: 'Mumbai' },
          { billerId: 'GUJ-GAS', billerName: 'Gujarat Gas Ltd', state: 'Gujarat' }
        ]);
      } else if (catKey === 'dth') {
        setBillersList([
          { billerId: 'TATA-PLAY', billerName: 'Tata Play (Sky)', state: 'National' },
          { billerId: 'AIRTEL-DTH', billerName: 'Airtel Digital TV', state: 'National' },
          { billerId: 'DISH-TV', billerName: 'Dish TV India', state: 'National' }
        ]);
      } else if (catKey === 'broadband') {
        setBillersList([
          { billerId: 'JIO-FIBER', billerName: 'JioFiber Broadband', state: 'All India' },
          { billerId: 'AIRTEL-XTREME', billerName: 'Airtel Xstream Fiber', state: 'All India' },
          { billerId: 'ACT-CORP', billerName: 'ACT Fibernet', state: 'Major Cities' }
        ]);
      } else if (catKey === 'mobile_postpaid') {
        setBillersList([
          { billerId: 'JIO-POSTPAID', billerName: 'Jio Postpaid Plus', state: 'All India' },
          { billerId: 'AIRTEL-POSTPAID', billerName: 'Airtel Postpaid', state: 'All India' },
          { billerId: 'VI-POSTPAID', billerName: 'Vi Postpaid', state: 'All India' }
        ]);
      } else {
        setBillersList([
          { billerId: 'MPPKVVCL-W', billerName: 'MPPKVVCL - West Discom', state: 'Madhya Pradesh' },
          { billerId: 'BSES-RAJ', billerName: 'BSES Rajdhani Power Ltd', state: 'Delhi' },
          { billerId: 'TATA-PWR-MUM', billerName: 'Tata Power Electricity', state: 'Mumbai' },
          { billerId: 'ADANI-ELEC-MUM', billerName: 'Adani Electricity', state: 'Mumbai' }
        ]);
      }
    } catch (_) { }
  };

  // Filter billers in widget search
  const filteredBillers = billerSearch.trim()
    ? billersList.filter(
      (b) =>
        (b.billerName || b.biller_name || '').toLowerCase().includes(billerSearch.toLowerCase()) ||
        (b.state && b.state.toLowerCase().includes(billerSearch.toLowerCase()))
    )
    : billersList;

  // Primary UPI handle
  const primaryUpi = upiHandles.find((u) => u.isPrimary)?.upiId ||
    upiHandles[0]?.upiId ||
    `${user?.phone || '8602612434'}@apnapay`;

  // Primary Bank Account
  const primaryBank = bankAccounts.find((b) => b.isPrimary || b.is_primary) || bankAccounts[0];
  const primaryBankName = primaryBank?.bankName || primaryBank?.bank_name || 'State Bank of India';
  const primaryBankLast4 = primaryBank?.accountLast4 || primaryBank?.account_last4 || (primaryBank?.accountNumber ? primaryBank.accountNumber.slice(-4) : (primaryBank?.maskedAccountNumber ? primaryBank.maskedAccountNumber.slice(-4) : '9422'));
  const walletQrId = `${user?.phone || '8602612434'}.wallet@apnapay`;

  const displayName = user?.full_name || 'Customer';
  const rawBalance = walletOverview?.available_balance ?? walletOverview?.balance ?? 5420;
  const displayWalletBal = walletOverview?.formattedBalance || formatINR(rawBalance);

  // Copy UPI Handle helper
  const handleCopyUpi = (text) => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedUpi(true);
      showToast('UPI ID copied to clipboard!');
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  // Calculate simulated SIP maturity
  const calculateSipReturn = () => {
    const amt = parseFloat(sipAmount) || 50;
    const r = 0.12 / 12; // 12% annual rate monthly
    const totalMonths = sipHorizonYears * 12;
    const monthlyAmt = sipFrequency === 'daily' ? amt * 30 : amt;
    const invested = monthlyAmt * totalMonths;
    const futureVal = monthlyAmt * ((Math.pow(1 + r, totalMonths) - 1) / r) * (1 + r);
    return {
      invested: Math.round(invested),
      futureVal: Math.round(futureVal),
      profit: Math.round(futureVal - invested)
    };
  };

  const sipResult = calculateSipReturn();

  // Filter banks in GPay onboarding step 2
  const filteredOnboardBanks = onboardBankSearch.trim()
    ? SUPPORTED_BANKS.filter(
      (b) =>
        b.name.toLowerCase().includes(onboardBankSearch.toLowerCase()) ||
        b.shortName.toLowerCase().includes(onboardBankSearch.toLowerCase()) ||
        b.ifscPrefix.toLowerCase().includes(onboardBankSearch.toLowerCase())
    )
    : SUPPORTED_BANKS;

  // Complete GPay-style Bank & UPI Onboarding
  const handleCompleteOnboarding = async () => {
    if (!selectedOnboardBank) return;
    setOnboardingSubmitting(true);
    try {
      // 1. Link Bank Account (simulated with standard valid account digits)
      const mockAcctNum = `${selectedOnboardBank.ifscPrefix}9981280069`.replace(/[^0-9]/g, '').padEnd(11, '0').slice(0, 11);
      const linkRes = await bankAccountService.linkAccount({
        bankName: selectedOnboardBank.name,
        accountNumber: mockAcctNum,
        confirmAccountNumber: mockAcctNum,
        ifscCode: `${selectedOnboardBank.ifscPrefix}0001234`,
        accountHolderName: displayName,
        isPrimary: bankAccounts.length === 0
      }).catch(() => null);

      // 2. Register UPI Handle if specified
      const handleToCreate = onboardUpiHandle.trim() || `${user?.phone || '8602612434'}`;
      await upiService.createUpiHandle({
        handlePrefix: handleToCreate.split('@')[0],
        suffix: '@apnapay',
        bankAccountId: linkRes?.data?.accountId || null,
        isPrimary: onboardSetPrimary
      }).catch(() => null);

      setOnboardingStep(4);
      loadOverviewData();
      showToast('Bank account linked & @apnapay UPI activated successfully!');
    } catch (err) {
      console.warn('Onboarding error:', err.message);
      setOnboardingStep(4);
    } finally {
      setOnboardingSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="Financial Dashboard"
      subtitle="Digital payments, escrow wallet balance, banking connections, and BBPS utility bills"
      onRefresh={loadOverviewData}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #071426, #0B1B32)',
            border: '1px solid #00D5FF',
            color: '#FFFFFF',
            padding: '10px 22px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: '700',
            boxShadow: '0 12px 36px rgba(0, 168, 255, 0.45)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircleIcon size={16} style={{ color: '#00E599' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. TOP PROMOTIONAL BANNER                                 */}
      {/* ========================================================= */}
      <div
        style={{
          background: 'linear-gradient(135deg, #071426 0%, #0C2442 60%, #071426 100%)',
          border: '1px solid #17385D',
          borderRadius: '16px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1 }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(0, 168, 255, 0.4)',
              flexShrink: 0
            }}
          >
            <QrCodeIcon size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#FFFFFF' }}>
                Save on QR Payments with ApnaPay UPI
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: '800',
                  color: '#00E599',
                  background: 'rgba(0, 229, 153, 0.15)',
                  border: '1px solid rgba(0, 229, 153, 0.35)',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}
              >
                Zero Gateway Fees
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#A9BDD7', margin: '2px 0 0' }}>
              Instant Bharat UPI scan, verified bank settlements & 100% audited double-entry ledger.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1 }}>
          <button
            onClick={() => setScanPayModalOpen(true)}
            className="auth-button"
            style={{
              width: 'auto',
              height: '36px',
              padding: '0 18px',
              fontSize: '12.5px',
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Scan any QR code"
          >
            <QrCodeIcon size={15} />
            <span>Scan Any QR</span>
          </button>
          <button
            onClick={() => setQrModalOpen(true)}
            className="auth-button secondary"
            style={{
              width: 'auto',
              height: '36px',
              padding: '0 16px',
              fontSize: '12.5px',
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Open personal QR code"
          >
            <span>My QR</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. PRIORITY 1: MONEY TRANSFERS (Payment App Core)         */}
      {/* 4 Circular Action Buttons + Live Escrow Balance Strip     */}
      {/* ========================================================= */}
      <div className="money-transfers-section">
        <div className="money-transfers-header">
          <div
            className="money-transfers-header-left"
            onClick={() => navigate('/app/transfers')}
            style={{ cursor: 'pointer' }}
            title="Open Money Transfers Management"
          >
            <h2 className="money-transfers-title-text" style={{ margin: 0, whiteSpace: 'nowrap' }}>
              Money Transfers
            </h2>
            <span className="money-transfers-badge">
              Instant 24x7
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="hide-on-mobile"
              onClick={() => navigate('/app/transfers')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8BA2C1',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                whiteSpace: 'nowrap'
              }}
              title="View Money Transfer remittance history & management"
            >
              <span>Manage Transfers</span>
              <ArrowRightIcon size={12} />
            </button>
            <button
              onClick={() => {
                setOnboardingStep(1);
                setSelectedOnboardBank(null);
                setOnboardingModalOpen(true);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00D5FF',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <ShieldIcon size={13} />
              <span className="hide-on-mobile">+ Link Bank / Setup UPI</span>
              <span className="show-on-mobile">+ Link Bank</span>
            </button>
          </div>
        </div>

        {/* 4 Circular Action Buttons in a Single Row */}
        <div className="money-transfers-grid">
          {/* 1. To Mobile Number */}
          <button
            type="button"
            onClick={() => {
              setScanUpiInput('');
              setScanPayModalOpen(true);
            }}
            className="money-transfer-circle-card"
            title="Transfer to 10-digit mobile number or UPI ID"
          >
            <div
              className="money-transfer-circle-icon"
              style={{
                background: 'linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)',
                color: '#FFFFFF'
              }}
            >
              <SmartphoneIcon size={26} />
            </div>
            <div className="money-transfer-title">To Mobile Number</div>
            <div className="money-transfer-sub">Instant UPI</div>
          </button>

          {/* 2. To Bank & Self A/c */}
          <button
            type="button"
            onClick={() => {
              if (bankAccounts.length === 0) {
                setOnboardingStep(1);
                setOnboardingModalOpen(true);
              } else {
                navigate('/app/banks');
              }
            }}
            className="money-transfer-circle-card"
            title="Transfer money to linked bank accounts or self account"
          >
            <div
              className="money-transfer-circle-icon"
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                color: '#FFFFFF'
              }}
            >
              <LandmarkIcon size={26} />
            </div>
            <div className="money-transfer-title">To Bank & Self A/c</div>
            <div className="money-transfer-sub">IMPS / NEFT</div>
          </button>

          {/* 3. ApnaPay Wallet */}
          <button
            type="button"
            onClick={() => navigate('/app/kyc')}
            className="money-transfer-circle-card"
            title="Open ApnaPay Wallet & PhonePe-style e-KYC activation"
          >
            <div
              className="money-transfer-circle-icon"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #00E599 100%)',
                color: '#FFFFFF'
              }}
            >
              <WalletIcon size={26} />
            </div>
            <div className="money-transfer-title">ApnaPay Wallet</div>
            <div className="money-transfer-sub">+ Add Money</div>
          </button>

          {/* 4. Check Balance */}
          <button
            type="button"
            onClick={() => {
              setCheckBalanceStep('list');
              setSelectedBalanceBank(null);
              setUpiPinInput('');
              setUpiPinError('');
              setFetchedBankBalance(null);
              setCheckBalanceModalOpen(true);
            }}
            className="money-transfer-circle-card"
            title="Check wallet ledger balance and linked bank accounts"
          >
            <div
              className="money-transfer-circle-icon"
              style={{
                background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
                color: '#FFFFFF'
              }}
            >
              <CreditCardIcon size={26} />
            </div>
            <div className="money-transfer-title">Check Balance</div>
            <div className="money-transfer-sub">Live Status</div>
          </button>
        </div>

        {/* Live Wallet Balance Strip Bar (Directly Under 4 Buttons) */}
        <div className="balance-strip-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(0, 168, 255, 0.15)',
                color: '#00A8FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <WalletIcon size={16} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#A9BDD7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Wallet Escrow Balance</span>
                <button
                  type="button"
                  onClick={() => setShowBalance(!showBalance)}
                  style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}
                  title={showBalance ? 'Hide Balance' : 'Show Balance'}
                  aria-label="Toggle wallet balance visibility"
                >
                  {showBalance ? <EyeOffIcon size={13} /> : <EyeIcon size={13} />}
                </button>
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF', marginTop: '1px' }}>
                {walletLoading ? (
                  <span style={{ fontSize: '13px', color: '#A9BDD7' }}>Loading...</span>
                ) : showBalance ? (
                  displayWalletBal
                ) : (
                  '₹ • • • • •'
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setAddMoneyModalOpen(true)}
              className="auth-button"
              style={{ width: 'auto', height: '32px', padding: '0 14px', fontSize: '12px', margin: 0 }}
            >
              + Add Money
            </button>
            <button
              onClick={() => navigate('/app/wallet')}
              className="auth-button secondary"
              style={{ width: 'auto', height: '32px', padding: '0 12px', fontSize: '12px', margin: 0 }}
            >
              View Ledger →
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. PRIORITY 2 & 3: APNAPAY UNIQUE SIGNATURE INNOVATIONS   */}
      {/* Placed prominently near the upper part of the dashboard   */}
      {/* DIGITAL LAND (Priority 2) & SIP (Priority 3)              */}
      {/* ========================================================= */}
      <div className="innovations-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 168, 255, 0.12)', border: '1px solid rgba(0, 168, 255, 0.3)', padding: '2px 10px', borderRadius: '12px', marginBottom: '6px' }}>
              <SparklesIcon size={12} style={{ color: '#00D5FF' }} />
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#00D5FF', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                ApnaPay Exclusive Features
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px' }}>
              Digital Land & SIP Wealth Planning
            </h2>
            <p style={{ fontSize: '12.5px', color: '#A9BDD7', margin: '2px 0 0' }}>
              Fractional real estate assets on double-entry ledger and systematic wealth accumulation
            </p>
          </div>
          <span style={{ fontSize: '11px', color: '#00E599', fontWeight: '700' }}>
            ● 100% Audited Ledger Sync
          </span>
        </div>

        <div className="innovations-grid">
          {/* ------------------------------------------------------- */}
          {/* INNOVATION 1: DIGITAL LAND FEATURED SECTION (Priority 2) */}
          {/* ------------------------------------------------------- */}
          <div className="innovation-card land-featured">
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '13px',
                      background: 'linear-gradient(135deg, rgba(8, 123, 255, 0.25), rgba(0, 213, 255, 0.25))',
                      border: '1px solid rgba(0, 213, 255, 0.4)',
                      color: '#00D5FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(0, 168, 255, 0.3)'
                    }}
                  >
                    <LayersIcon size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16.5px', fontWeight: '900', color: '#FFFFFF', margin: 0, letterSpacing: '-0.2px' }}>
                      Digital Land Marketplace
                    </h3>
                    <span style={{ fontSize: '11px', color: '#00D5FF', fontWeight: '600' }}>
                      Fractional Digital Property Units
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    color: '#00D5FF',
                    background: 'rgba(0, 213, 255, 0.15)',
                    border: '1px solid rgba(0, 213, 255, 0.4)',
                    padding: '3px 8px',
                    borderRadius: '8px'
                  }}
                >
                  LEDGER BACKED
                </span>
              </div>

              {/* Holdings & Projects Live Metrics Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(7, 20, 38, 0.7)', border: '1px solid #1E3A5F', borderRadius: '10px', padding: '10px', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#A9BDD7', textTransform: 'uppercase' }}>Verified Parcels</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF', marginTop: '2px' }}>
                    {landProjects.length || 4} Available
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#A9BDD7', textTransform: 'uppercase' }}>Your Holdings</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#00E599', marginTop: '2px' }}>
                    {landHoldingsSummary.totalUnitsHeld || 0} Units
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#A9BDD7', textTransform: 'uppercase' }}>Entry Price</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#00D5FF', marginTop: '2px' }}>
                    ₹{featuredLandProject?.price_per_unit || 1000}/unit
                  </div>
                </div>
              </div>

              {/* Featured Project Spotlight Card */}
              {featuredLandProject && (
                <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF' }}>
                      {featuredLandProject.title}
                    </div>
                    <span style={{ fontSize: '10px', color: '#00E599', fontWeight: '700' }}>
                      ● High Liquidity
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#A9BDD7', marginBottom: '6px' }}>
                    <MapPinIcon size={12} style={{ color: '#00A8FF' }} />
                    <span>{featuredLandProject.city}, {featuredLandProject.state}</span>
                    <span>•</span>
                    <span>{featuredLandProject.asset_type || 'Commercial Grade-A'}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.4 }}>
                    Fractional land tokens recorded on your double-entry escrow ledger. Instant buy/sell in demo sandbox.
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(0, 168, 255, 0.25)' }}>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Simulated Property Sandbox
              </span>
              <button
                onClick={() => navigate('/app/land')}
                className="auth-button"
                style={{
                  width: 'auto',
                  height: '36px',
                  padding: '0 18px',
                  fontSize: '12.5px',
                  margin: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #087BFF, #00D5FF)',
                  fontWeight: '800'
                }}
              >
                <span>Explore Digital Land</span>
                <ArrowRightIcon size={13} />
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------- */}
          {/* INNOVATION 2: SIP & WEALTH PLANNING (Priority 3)        */}
          {/* ------------------------------------------------------- */}
          <div className="innovation-card sip">
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '13px',
                      background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.25), rgba(0, 229, 153, 0.25))',
                      border: '1px solid rgba(0, 229, 153, 0.4)',
                      color: '#00E599',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(0, 229, 153, 0.3)'
                    }}
                  >
                    <TrendingUpIcon size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16.5px', fontWeight: '900', color: '#FFFFFF', margin: 0, letterSpacing: '-0.2px' }}>
                      SIP & Wealth Planning
                    </h3>
                    <span style={{ fontSize: '11px', color: '#00E599', fontWeight: '600' }}>
                      Automated Recurring Savings Pool
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    color: '#00E599',
                    background: 'rgba(0, 229, 153, 0.15)',
                    border: '1px solid rgba(0, 229, 153, 0.4)',
                    padding: '3px 8px',
                    borderRadius: '8px'
                  }}
                >
                  FROM ₹10/DAY
                </span>
              </div>

              {/* 3 Prominent SIP Plan Highlights */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                <div
                  onClick={() => {
                    setSipFrequency('daily');
                    setSipAmount('10');
                    setSipModalOpen(true);
                  }}
                  style={{ background: '#071426', border: '1px solid #1E3A5F', borderRadius: '10px', padding: '10px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00E599')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E3A5F')}
                >
                  <div style={{ fontSize: '10px', color: '#A9BDD7', fontWeight: '700' }}>Daily Micro</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#00E599', marginTop: '2px' }}>₹10/day</div>
                  <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '2px' }}>Low friction</div>
                </div>

                <div
                  onClick={() => {
                    setSipFrequency('monthly');
                    setSipAmount('250');
                    setSipModalOpen(true);
                  }}
                  style={{ background: '#071426', border: '1px solid #1E3A5F', borderRadius: '10px', padding: '10px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00D5FF')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E3A5F')}
                >
                  <div style={{ fontSize: '10px', color: '#A9BDD7', fontWeight: '700' }}>Choti SIP</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#00D5FF', marginTop: '2px' }}>₹250/mo</div>
                  <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '2px' }}>Budget friendly</div>
                </div>

                <div
                  onClick={() => {
                    setSipFrequency('monthly');
                    setSipAmount('1000');
                    setSipModalOpen(true);
                  }}
                  style={{ background: '#071426', border: '1px solid #1E3A5F', borderRadius: '10px', padding: '10px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#A855F7')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E3A5F')}
                >
                  <div style={{ fontSize: '10px', color: '#A9BDD7', fontWeight: '700' }}>Growth Pool</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#C084FC', marginTop: '2px' }}>₹1,000/mo</div>
                  <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '2px' }}>Compound pool</div>
                </div>
              </div>

              {/* Simulator Preview Box */}
              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#A9BDD7' }}>Sample Daily Plan (₹50/day):</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#00E599' }}>₹65,490 / 3 yrs</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', lineHeight: 1.4 }}>
                  Synchronized with your ApnaPay Escrow Wallet. Simulated 12% CAGR demo calculation.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(0, 229, 153, 0.25)' }}>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Escrow Wallet Linked
              </span>
              <button
                onClick={() => navigate('/app/sip')}
                className="auth-button"
                style={{
                  width: 'auto',
                  height: '36px',
                  padding: '0 18px',
                  fontSize: '12.5px',
                  margin: 0,
                  background: 'linear-gradient(135deg, #059669 0%, #00E599 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Explore SIP Planning</span>
                <ArrowRightIcon size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. PRIORITY 4: RECHARGE & BILLS (BBPS Standard Grid)       */}
      {/* ========================================================= */}
      <div style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', margin: 0, letterSpacing: '-0.2px' }}>
              Recharge & Bills
            </h2>
            <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#00E599', background: 'rgba(0, 229, 153, 0.12)', border: '1px solid rgba(0, 229, 153, 0.3)', padding: '2px 8px', borderRadius: '10px' }}>
              BBPS Assured
            </span>
          </div>
          <button
            onClick={() => navigate('/app/bills')}
            style={{ background: 'transparent', border: 'none', color: '#00A8FF', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span>View All Billers</span>
            <ArrowRightIcon size={14} />
          </button>
        </div>

        {/* 8 PhonePe-style Bill Payment Cards */}
        <div className="recharge-bills-grid">
          {[
            { id: 'mobile_postpaid', label: 'Mobile Recharge', icon: SmartphoneIcon, color: '#00A8FF', bg: 'rgba(0, 168, 255, 0.12)' },
            { id: 'electricity', label: 'Electricity Bill', icon: ZapIcon, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
            { id: 'water', label: 'Water Bill', icon: DropletIcon, color: '#00D5FF', bg: 'rgba(0, 213, 255, 0.12)' },
            { id: 'gas', label: 'Gas Cylinder', icon: FlameIcon, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
            { id: 'dth', label: 'DTH TV', icon: TvIcon, color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)' },
            { id: 'broadband', label: 'Broadband / Wifi', icon: WifiIcon, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
            { id: 'loan_repay', label: 'Loan Repay', icon: ReceiptIcon, color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', isSpecial: true },
            { id: 'more_bills', label: 'More Services', icon: MoreHorizontalIcon, color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)', isMore: true }
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => {
                  if (cat.id === 'mobile_postpaid') {
                    navigate('/app/recharge');
                  } else if (cat.isMore || cat.isSpecial) {
                    navigate('/app/bills');
                  } else {
                    handleCategoryChange(cat.id);
                    navigate(`/app/bills?category=${cat.id}`);
                  }
                }}
                className="recharge-bill-card"
                title={`Pay ${cat.label}`}
              >
                <div className="recharge-icon-bubble" style={{ background: cat.bg, color: cat.color }}>
                  <Icon size={22} />
                </div>
                <div className="recharge-card-name">{cat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. TWO-COLUMN: QUICK BILL WIDGET & RECENT TRANSACTIONS     */}
      {/* ========================================================= */}
      <div className="bottom-widgets-grid">
        {/* Left Column: Interactive BBPS Quick Biller Widget */}
        <div className="widget-box">
          <div className="widget-box-header">
            <div className="widget-header-left">
              <div className="widget-icon-box">
                <ReceiptIcon size={20} />
              </div>
              <div>
                <h3 className="widget-title">Quick Bill Payment</h3>
                <p className="widget-subtitle">Select category or search operator</p>
              </div>
            </div>
            <div className="demo-mode-badge" title="Simulation mode enabled">
              <span>Demo Mode</span>
              <InfoIcon size={12} />
            </div>
          </div>

          <div className="bill-widget-body">
            {/* Column 1: Category Picker (Horizontal Scrollable on Mobile) */}
            <div className="bill-categories-col">
              {[
                { id: 'electricity', label: 'Electricity', icon: ZapIcon },
                { id: 'water', label: 'Water', icon: DropletIcon },
                { id: 'gas', label: 'Gas', icon: FlameIcon },
                { id: 'dth', label: 'DTH', icon: TvIcon },
                { id: 'mobile_postpaid', label: 'Mobile', icon: SmartphoneIcon }
              ].map((c) => {
                const Icon = c.icon;
                const isActive = activeBillCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCategoryChange(c.id)}
                    className={`bill-cat-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={14} />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Column 2: Biller List & Search */}
            <div className="bill-search-col">
              <div className="biller-search-input-wrap">
                <div style={{ position: 'absolute', left: '10px', color: '#6B87A8', display: 'flex' }}>
                  <SearchIcon size={13} />
                </div>
                <input
                  type="text"
                  value={billerSearch}
                  onChange={(e) => setBillerSearch(e.target.value)}
                  placeholder={`Search ${activeBillCategory.replace('_', ' ')} billers...`}
                  className="biller-search-input"
                />
              </div>

              <div className="biller-list-scroll">
                {filteredBillers && filteredBillers.length > 0 ? (
                  filteredBillers.map((biller) => (
                    <div
                      key={biller.billerId || biller.id || biller.biller_code}
                      onClick={() => navigate(`/app/bills?category=${activeBillCategory}&billerId=${biller.billerId || biller.id || biller.biller_code}`)}
                      className="biller-item-pill"
                      title={`Pay ${biller.billerName || biller.biller_name}`}
                      role="button"
                      tabIndex={0}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div className="biller-logo-badge">
                          {(biller.billerName || biller.biller_name || 'BIL').slice(0, 3)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="biller-name-text">
                            {biller.billerName || biller.biller_name}
                          </div>
                          <div className="biller-state-text">
                            {biller.state || 'India'}
                          </div>
                        </div>
                      </div>
                      <ChevronRightIcon size={14} style={{ color: '#6B87A8', flexShrink: 0 }} />
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 12px', color: '#A9BDD7', fontSize: '12.5px' }}>
                    No billers found for "{billerSearch}".
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Quick Pay Promo Card */}
            <div
              onClick={() => navigate('/app/bills')}
              className="bill-promo-card"
              title="Click to Pay Bills"
              role="button"
              tabIndex={0}
            >
              <div className="bill-promo-icon">
                <ReceiptIcon size={22} />
              </div>
              <div className="bill-promo-text-wrap" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="bill-promo-title">
                  Pay Bills Anytime, Anywhere
                </div>
                <div className="bill-promo-sub">
                  Instant • Secure • Reliable
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Transactions Modern Card */}
        <div className="widget-box">
          <div className="widget-box-header">
            <div className="widget-header-left">
              <div className="widget-icon-box" style={{ background: 'rgba(0, 229, 153, 0.12)', color: '#00E599' }}>
                <HistoryIcon size={20} />
              </div>
              <div>
                <h3 className="widget-title">Recent Transactions</h3>
                <p className="widget-subtitle">Latest 5 financial ledger entries</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/app/transactions')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00A8FF',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>View All</span>
              <ArrowRightIcon size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {txnsLoading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#A9BDD7' }}>
                <RefreshCwIcon size={20} style={{ animation: 'spin 1s linear infinite', color: '#00A8FF', marginBottom: '8px' }} />
                <div style={{ fontSize: '12px' }}>Loading transactions...</div>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#A9BDD7' }}>
                <HistoryIcon size={32} style={{ color: '#334155', marginBottom: '8px' }} />
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF' }}>No Transactions Yet</div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                  Start by sending money or paying a utility bill.
                </div>
              </div>
            ) : (
              recentTransactions.slice(0, 5).map((txn) => {
                const isCredit = String(txn.transaction_type || txn.type).toLowerCase() === 'credit';
                const status = String(txn.status || 'completed').toLowerCase();
                const isSuccess = status === 'completed' || status === 'success';
                const isPending = status === 'pending';

                return (
                  <div
                    key={txn.id || txn.transaction_id || Math.random()}
                    onClick={() => navigate('/app/transactions')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: '#071426',
                      border: '1px solid #17385D',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00A8FF';
                      e.currentTarget.style.background = '#0C2038';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#17385D';
                      e.currentTarget.style.background = '#071426';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: isCredit ? 'rgba(0, 229, 153, 0.12)' : 'rgba(0, 168, 255, 0.12)',
                        color: isCredit ? '#00E599' : '#00A8FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isCredit ? <ArrowDownLeftIcon size={16} /> : <ArrowUpRightIcon size={16} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {txn.description || (isCredit ? 'Received Money' : 'UPI Payment')}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                          {formatDateTime(txn.created_at || txn.date)}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: isCredit ? '#00E599' : '#FFFFFF' }}>
                        {isCredit ? '+' : '-'} {formatINR(txn.amount)}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        color: isSuccess ? '#10B981' : isPending ? '#F59E0B' : '#EF4444',
                        marginTop: '2px'
                      }}>
                        {status}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. LINKED BANKING & UPI DUAL SECTION                      */}
      {/* ========================================================= */}
      <div className="banking-summary-grid">
        {/* Linked Banks Card */}
        <div className="banking-summary-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 168, 255, 0.12)', color: '#00A8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LandmarkIcon size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    Linked Bank Accounts
                  </h4>
                  <span style={{ fontSize: '11.5px', color: '#A9BDD7' }}>
                    {bankAccounts.length} Connected Account{bankAccounts.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setOnboardingStep(1);
                  setSelectedOnboardBank(null);
                  setOnboardingModalOpen(true);
                }}
                style={{ background: 'transparent', border: 'none', color: '#00A8FF', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                + Link New
              </button>
            </div>

            {primaryBank ? (
              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>
                    {primaryBankName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#A9BDD7', fontFamily: 'monospace', marginTop: '2px' }}>
                    •••• •••• {primaryBankLast4}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                    IFSC: {primaryBank.ifscCode || primaryBank.ifsc_code || 'ICIC0001234'}
                  </div>
                </div>
                <span style={{ background: 'rgba(0, 229, 153, 0.15)', color: '#00E599', border: '1px solid rgba(0, 229, 153, 0.35)', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '10px' }}>
                  PRIMARY
                </span>
              </div>
            ) : (
              <div style={{ background: '#071426', border: '1px dashed #17385D', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#A9BDD7' }}>No bank accounts linked yet.</div>
                <button
                  onClick={() => {
                    setOnboardingStep(1);
                    setOnboardingModalOpen(true);
                  }}
                  className="auth-button"
                  style={{ width: 'auto', padding: '6px 14px', fontSize: '12px', height: '32px', marginTop: '8px' }}
                >
                  Link Bank Account
                </button>
              </div>
            )}
          </div>

          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#64748B' }}>NPCI Verified Banking Sandbox</span>
            <button
              onClick={() => navigate('/app/banks')}
              style={{ background: 'transparent', border: 'none', color: '#00D5FF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Manage Accounts</span>
              <ArrowRightIcon size={12} />
            </button>
          </div>
        </div>

        {/* UPI Handles Card */}
        <div className="banking-summary-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 229, 153, 0.12)', color: '#00E599', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldIcon size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    UPI Services & VPAs
                  </h4>
                  <span style={{ fontSize: '11.5px', color: '#A9BDD7' }}>
                    {upiHandles.length || 1} Active VPA Handle{upiHandles.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setQrModalOpen(true)}
                style={{ background: 'transparent', border: 'none', color: '#00E599', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <QrCodeIcon size={14} />
                <span>Show QR</span>
              </button>
            </div>

            <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Primary UPI Address
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#00D5FF', fontFamily: 'monospace', marginTop: '2px' }}>
                  {primaryUpi}
                </div>
                <div style={{ fontSize: '11px', color: '#00E599', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00E599' }} />
                  <span>Ready for incoming UPI payments</span>
                </div>
              </div>
              <button
                onClick={() => handleCopyUpi(primaryUpi)}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 10px', height: '32px', fontSize: '11px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Copy UPI Address"
              >
                {copiedUpi ? <CheckIcon size={13} style={{ color: '#00E599' }} /> : <CopyIcon size={13} />}
                <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#64748B' }}>@apnapay Verified Virtual Address</span>
            <button
              onClick={() => navigate('/app/upi')}
              style={{ background: 'transparent', border: 'none', color: '#00D5FF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Manage UPI VPAs</span>
              <ArrowRightIcon size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 7. ALL SERVICES: ORGANIZED 10-SERVICE GRID                */}
      {/* ========================================================= */}
      <div style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', margin: 0, letterSpacing: '-0.2px' }}>
              All Services & Features
            </h2>
            <p style={{ fontSize: '12px', color: '#A9BDD7', margin: '2px 0 0' }}>
              Complete suite of payments, banking, investment assets & security tools
            </p>
          </div>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            10 Modules Active
          </span>
        </div>

        <div className="all-services-grid">
          {[
            { id: 'banks', title: 'Bank Accounts', desc: 'Link and manage accounts', icon: LandmarkIcon, path: '/app/banks', color: '#00A8FF' },
            { id: 'upi', title: 'UPI Services', desc: 'VPAs, QR and instant payments', icon: SmartphoneIcon, path: '/app/upi', color: '#00E599' },
            { id: 'wallet', title: 'Wallet & Ledger', desc: 'Escrow balance & settlements', icon: WalletIcon, path: '/app/wallet', color: '#00D5FF' },
            { id: 'bills', title: 'Bill Payments', desc: 'Electricity, Gas, Water & DTH', icon: ReceiptIcon, path: '/app/bills', color: '#F59E0B' },
            { id: 'recharge', title: 'Mobile Recharge', desc: 'Prepaid & postpaid plans', icon: SmartphoneIcon, path: '/app/recharge', color: '#38BDF8' },
            { id: 'txns', title: 'Transaction History', desc: 'Audit statements & receipts', icon: HistoryIcon, path: '/app/transactions', color: '#818CF8' },
            { id: 'land', title: 'Digital Land', desc: 'Fractional land parcel units', icon: LayersIcon, path: '/app/land', color: '#A855F7' },
            { id: 'sip', title: 'SIP & Wealth', desc: 'Systematic investment plans', icon: TrendingUpIcon, path: '/app/sip', color: '#34D399' },
            { id: 'refunds', title: 'Refund & Disputes', desc: 'Track payment inquiries', icon: ShieldCheckIcon, path: '/app/disputes', color: '#FB7185' },
            { id: 'profile', title: 'Profile & KYC', desc: 'Security, limits and settings', icon: UserIcon, path: '/app/profile', color: '#94A3B8' }
          ].map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.id}
                onClick={srv.onClick ? srv.onClick : () => navigate(srv.path)}
                className="all-service-card"
                title={`Open ${srv.title}`}
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${srv.color}35`,
                  color: srv.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px'
                }}>
                  <Icon size={22} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', marginBottom: '2px' }}>
                  {srv.title}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.3 }}>
                  {srv.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 8. INFORMATIONAL TRUST & DISCLAIMER BANNER                */}
      {/* ========================================================= */}
      <div className="trust-security-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(0, 229, 153, 0.15)', color: '#00E599', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheckIcon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#FFFFFF' }}>
              ApnaPay 100% Secure Sandbox Payment Gateway
            </div>
            <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '3px', lineHeight: 1.4 }}>
              ApnaPay is a demonstration application. Payments and financial services displayed here are simulated on your audited double-entry ledger. Bank-grade 256-bit SSL encryption • NPCI simulated UPI protocols • Instant settlement alerts.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/app/profile')}
            className="auth-button secondary"
            style={{ width: 'auto', height: '34px', padding: '0 14px', fontSize: '12px', margin: 0 }}
          >
            Profile & Settings
          </button>
          <button
            onClick={() => navigate('/app/disputes')}
            className="auth-button secondary"
            style={{ width: 'auto', height: '34px', padding: '0 14px', fontSize: '12px', margin: 0 }}
            title="Open Dispute & Refund Grievance Portal"
          >
            Help & Support
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: GPAY-STYLE BANK & UPI ONBOARDING FLOW            */}
      {/* With Paytm-Style Optional Consent Checkboxes (Opt-in)     */}
      {/* ========================================================= */}
      {onboardingModalOpen && (
        <div
          className="admin-land-modal-overlay"
          onClick={() => setOnboardingModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-land-modal-container"
            style={{ maxWidth: '460px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <button
                  type="button"
                  onClick={() => {
                    if (onboardingStep > 1) {
                      setOnboardingStep(prev => prev - 1);
                    } else {
                      setOnboardingModalOpen(false);
                    }
                  }}
                  className="modal-corner-back-btn"
                  title="Back"
                  aria-label="Back"
                >
                  <ArrowLeftIcon size={18} />
                </button>
                <ShieldIcon size={20} style={{ color: '#00A8FF' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  {onboardingStep === 1 && 'Step 1: Verification & Consent'}
                  {onboardingStep === 2 && 'Step 2: Select Your Bank'}
                  {onboardingStep === 3 && 'Step 3: Register @apnapay UPI'}
                  {onboardingStep === 4 && 'Setup Complete!'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOnboardingModalOpen(false)}
                className="admin-land-modal-close-btn"
                title="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="admin-land-modal-body">
              {/* STEP 1: CONSENT & IDENTITY VERIFICATION */}
              {onboardingStep === 1 && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #087BFF, #00D5FF)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', marginBottom: '8px' }}>
                      <SmartphoneIcon size={26} />
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF' }}>
                      Verify Mobile & Permissions
                    </div>
                    <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '2px' }}>
                      NPCI simulated UPI verification for registered number:
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#00D5FF', fontFamily: 'monospace', marginTop: '4px' }}>
                      +91 {user?.phone || '8602612434'}
                    </div>
                  </div>

                  {/* Paytm-style optional consents (EXPLICITLY OPT-IN: NOT PRE-CHECKED) */}
                  <div className="paytm-consent-box">
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Optional Communication Permissions
                    </div>

                    <label className="paytm-consent-row">
                      <input
                        type="checkbox"
                        checked={optInWhatsapp}
                        onChange={(e) => setOptInWhatsapp(e.target.checked)}
                      />
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#FFFFFF' }}>
                          Receive payment receipts on WhatsApp
                        </div>
                        <div style={{ fontSize: '11px', color: '#A9BDD7' }}>
                          Instant transaction updates and refund receipts sent to WhatsApp
                        </div>
                      </div>
                    </label>

                    <label className="paytm-consent-row">
                      <input
                        type="checkbox"
                        checked={optInSms}
                        onChange={(e) => setOptInSms(e.target.checked)}
                      />
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#FFFFFF' }}>
                          SMS alerts for offline merchant transactions
                        </div>
                        <div style={{ fontSize: '11px', color: '#A9BDD7' }}>
                          Optional real-time SMS status updates for Bharat QR payments
                        </div>
                      </div>
                    </label>

                    <div style={{ fontSize: '10.5px', color: '#64748B', fontStyle: 'italic', borderTop: '1px solid #17385D', paddingTop: '6px' }}>
                      Note: These consents are optional and not mandatory for UPI banking linkage.
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: BANK SELECTION (GPay-Style Bank Grid) */}
              {onboardingStep === 2 && (
                <div>
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <SearchIcon size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: '#64748B' }} />
                    <input
                      type="text"
                      placeholder="Search bank name or IFSC..."
                      value={onboardBankSearch}
                      onChange={(e) => setOnboardBankSearch(e.target.value)}
                      className="biller-search-input"
                      style={{ paddingLeft: '32px' }}
                      autoFocus
                    />
                  </div>

                  <div className="gpay-bank-grid">
                    {filteredOnboardBanks.map((bank) => {
                      const isSelected = selectedOnboardBank?.id === bank.id;
                      return (
                        <div
                          key={bank.id}
                          onClick={() => setSelectedOnboardBank(bank)}
                          className={`gpay-bank-card ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="gpay-bank-badge">
                            {bank.shortName.slice(0, 3)}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {bank.name}
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                              IFSC: {bank.ifscPrefix}
                            </div>
                          </div>
                          {isSelected && <CheckCircleIcon size={16} style={{ color: '#00E599' }} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: UPI HANDLE REGISTRATION */}
              {onboardingStep === 3 && (
                <div>
                  <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(0, 168, 255, 0.15)', color: '#00A8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LandmarkIcon size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>
                        {selectedOnboardBank?.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#00E599' }}>
                        Linked with IFSC {selectedOnboardBank?.ifscPrefix}0001234
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#A9BDD7', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                      Create Your Personal UPI ID
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#0B1B32', border: '1px solid #1E3A5F', borderRadius: '8px', padding: '0 10px' }}>
                      <input
                        type="text"
                        placeholder={user?.phone || '8602612434'}
                        value={onboardUpiHandle}
                        onChange={(e) => setOnboardUpiHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                        style={{
                          flex: 1,
                          height: '38px',
                          background: 'transparent',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#00D5FF' }}>
                        @apnapay
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                      Suggested: {user?.phone || '8602612434'}@apnapay
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={onboardSetPrimary}
                      onChange={(e) => setOnboardSetPrimary(e.target.checked)}
                      style={{ accentColor: '#00A8FF' }}
                    />
                    <span style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: '600' }}>
                      Set as primary UPI handle for incoming transfers
                    </span>
                  </label>
                </div>
              )}

              {/* STEP 4: SUCCESS CONFIRMATION */}
              {onboardingStep === 4 && (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(0, 229, 153, 0.15)', border: '2px solid #00E599', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#00E599', marginBottom: '12px' }}>
                    <CheckCircleIcon size={32} />
                  </div>
                  <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 4px 0' }}>
                    Account & UPI Activated!
                  </h4>
                  <p style={{ fontSize: '12.5px', color: '#A9BDD7', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                    Your {selectedOnboardBank?.name || 'bank'} account is linked and ready for instant Bharat UPI payments with your personal @apnapay address.
                  </p>

                  <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px', textAlign: 'left', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11.5px', color: '#A9BDD7' }}>Active VPA:</span>
                      <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#00D5FF', fontFamily: 'monospace' }}>
                        {(onboardUpiHandle || user?.phone || '8602612434')}@apnapay
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11.5px', color: '#A9BDD7' }}>Bank Status:</span>
                      <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#00E599' }}>
                        ● Active & Verified
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="admin-land-modal-footer">
              {onboardingStep === 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setOnboardingModalOpen(false)}
                    className="auth-button secondary"
                    style={{ width: 'auto', padding: '0 16px', height: '36px', fontSize: '12.5px', margin: 0 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(2)}
                    className="auth-button"
                    style={{ width: 'auto', padding: '0 20px', height: '36px', fontSize: '12.5px', margin: 0 }}
                  >
                    Select Bank →
                  </button>
                </>
              )}

              {onboardingStep === 2 && (
                <>
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(1)}
                    className="auth-button secondary"
                    style={{ width: 'auto', padding: '0 16px', height: '36px', fontSize: '12.5px', margin: 0 }}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    disabled={!selectedOnboardBank}
                    onClick={() => setOnboardingStep(3)}
                    className="auth-button"
                    style={{
                      width: 'auto',
                      padding: '0 20px',
                      height: '36px',
                      fontSize: '12.5px',
                      margin: 0,
                      opacity: selectedOnboardBank ? 1 : 0.5
                    }}
                  >
                    Continue to UPI Setup →
                  </button>
                </>
              )}

              {onboardingStep === 3 && (
                <>
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(2)}
                    className="auth-button secondary"
                    style={{ width: 'auto', padding: '0 16px', height: '36px', fontSize: '12.5px', margin: 0 }}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    disabled={onboardingSubmitting}
                    onClick={handleCompleteOnboarding}
                    className="auth-button"
                    style={{
                      width: 'auto',
                      padding: '0 20px',
                      height: '36px',
                      fontSize: '12.5px',
                      margin: 0,
                      background: 'linear-gradient(135deg, #059669 0%, #00E599 100%)',
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: '800'
                    }}
                  >
                    {onboardingSubmitting ? 'Registering...' : 'Activate & Link Bank →'}
                  </button>
                </>
              )}

              {onboardingStep === 4 && (
                <button
                  type="button"
                  onClick={() => setOnboardingModalOpen(false)}
                  className="auth-button"
                  style={{ width: '100%', height: '38px', fontSize: '13px', margin: 0 }}
                >
                  Start Paying with ApnaPay →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: PHONEPE-STYLE SLIDING MY QR MODAL (BANK & WALLET)*/}
      {/* ========================================================= */}
      {qrModalOpen && createPortal(
        <div
          className="admin-land-modal-overlay"
          style={{ position: 'fixed', inset: 0, zIndex: 10000 }}
          onClick={() => setQrModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-land-modal-container"
            style={{
              maxWidth: '410px',
              width: 'min(410px, calc(100vw - 24px))',
              padding: '18px 18px 20px',
              background: '#081426',
              border: '1px solid #17385D',
              borderRadius: '18px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCodeIcon size={18} style={{ color: '#00D5FF' }} />
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                  My QR Codes
                </span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#00D5FF', background: 'rgba(0, 213, 255, 0.12)', border: '1px solid rgba(0, 213, 255, 0.3)', padding: '2px 7px', borderRadius: '999px' }}>
                  DEMO
                </span>
              </div>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="admin-land-modal-close-btn"
                title="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* Quick Toggle Pills (Bank QR vs Wallet QR) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: '#050D1B', padding: '4px', borderRadius: '10px', border: '1px solid #17385D', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setActiveQrSlide(0)}
                style={{
                  padding: '7px 8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeQrSlide === 0 ? 'linear-gradient(135deg, #087BFF, #00A8FF)' : 'transparent',
                  color: activeQrSlide === 0 ? '#FFFFFF' : '#A9BDD7',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Bank Account QR
              </button>
              <button
                type="button"
                onClick={() => setActiveQrSlide(1)}
                style={{
                  padding: '7px 8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeQrSlide === 1 ? 'linear-gradient(135deg, #059669, #00E599)' : 'transparent',
                  color: activeQrSlide === 1 ? '#050D1B' : '#A9BDD7',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                ApnaPay Wallet QR
              </button>
            </div>

            {/* Sliding QR Carousel Viewport */}
            <div
              style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px' }}
              onTouchStart={(e) => setQrTouchStartX(e.touches[0].clientX)}
              onTouchEnd={(e) => {
                if (qrTouchStartX === null) return;
                const diff = qrTouchStartX - e.changedTouches[0].clientX;
                if (diff > 40 && activeQrSlide < 1) setActiveQrSlide(1);
                if (diff < -40 && activeQrSlide > 0) setActiveQrSlide(0);
                setQrTouchStartX(null);
              }}
            >
              <div
                style={{
                  display: 'flex',
                  transform: `translateX(-${activeQrSlide * 100}%)`,
                  transition: 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)'
                }}
              >
                {/* SLIDE 1: BANK ACCOUNT UPI QR */}
                <div style={{ minWidth: '100%', padding: '16px 14px', background: '#0B1B32', border: '1px solid #17385D', borderRadius: '16px', textAlign: 'center' }}>
                  <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '14px', width: '212px', height: '212px', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)' }}>
                    <svg viewBox="0 0 100 100" width="184" height="184" aria-label="Bank UPI QR Code">
                      <rect width="100" height="100" fill="#FFFFFF" />
                      {/* Finder patterns */}
                      <rect x="4" y="4" width="24" height="24" rx="3" fill="#050D1B" />
                      <rect x="8" y="8" width="16" height="16" rx="2" fill="#FFFFFF" />
                      <rect x="12" y="12" width="8" height="8" rx="1" fill="#050D1B" />
                      <rect x="72" y="4" width="24" height="24" rx="3" fill="#050D1B" />
                      <rect x="76" y="8" width="16" height="16" rx="2" fill="#FFFFFF" />
                      <rect x="80" y="12" width="8" height="8" rx="1" fill="#050D1B" />
                      <rect x="4" y="72" width="24" height="24" rx="3" fill="#050D1B" />
                      <rect x="8" y="76" width="16" height="16" rx="2" fill="#FFFFFF" />
                      <rect x="12" y="80" width="8" height="8" rx="1" fill="#050D1B" />
                      {/* Dense QR data modules */}
                      <path fill="#050D1B" d="M34 6h6v6h-6zM44 6h4v10h-4zM52 6h6v6h-6zM62 6h4v6h-4zM34 16h6v4h-6zM54 16h10v4h-10zM34 24h10v4h-10zM50 24h4v8h-4zM60 24h6v4h-6zM6 34h8v4H6zM18 34h10v4H18zM34 34h6v6h-6zM62 34h6v6h-6zM74 34h6v4h-6zM86 34h10v4H86zM8 44h6v6H8zM20 44h8v4h-8zM72 44h8v6h-8zM86 44h6v8h-6zM6 56h10v4H6zM22 56h6v6h-6zM74 56h10v4H74zM90 56h6v6h-6zM34 64h8v6h-8zM58 64h8v4h-8zM72 64h6v6h-6zM84 64h10v6H84zM34 74h4v10h-4zM44 74h8v4h-8zM58 74h6v10h-6zM72 74h8v8h-8zM86 74h10v4H86zM34 88h10v8H34zM50 86h6v10h-6zM68 88h8v8h-8zM82 86h12v10H82z" />
                    </svg>
                    {/* Center ApnaPay Badge */}
                    <div style={{ position: 'absolute', width: '40px', height: '40px', borderRadius: '50%', background: '#050D1B', border: '3px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
                      <span style={{ fontWeight: '900', fontSize: '18px', color: '#00D5FF' }}>A</span>
                    </div>
                  </div>

                  {/* Bank Label Pill */}
                  <button
                    type="button"
                    onClick={() => {
                      setQrModalOpen(false);
                      navigate('/app/banks');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#071426',
                      border: '1px solid #17385D',
                      borderRadius: '999px',
                      padding: '6px 14px',
                      cursor: 'pointer',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}
                  >
                    <LandmarkIcon size={14} style={{ color: '#00A8FF' }} />
                    <span>{primaryBankName} - {primaryBankLast4}</span>
                    <ChevronRightIcon size={14} style={{ color: '#A9BDD7' }} />
                  </button>
                </div>

                {/* SLIDE 2: APNAPAY WALLET QR */}
                <div style={{ minWidth: '100%', padding: '16px 14px', background: '#0B1B32', border: '1px solid #17385D', borderRadius: '16px', textAlign: 'center' }}>
                  <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '14px', width: '212px', height: '212px', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)' }}>
                    <svg viewBox="0 0 100 100" width="184" height="184" aria-label="ApnaPay Wallet QR Code">
                      <rect width="100" height="100" fill="#FFFFFF" />
                      {/* Finder patterns */}
                      <rect x="4" y="4" width="24" height="24" rx="3" fill="#050D1B" />
                      <rect x="8" y="8" width="16" height="16" rx="2" fill="#FFFFFF" />
                      <rect x="12" y="12" width="8" height="8" rx="1" fill="#050D1B" />
                      <rect x="72" y="4" width="24" height="24" rx="3" fill="#050D1B" />
                      <rect x="76" y="8" width="16" height="16" rx="2" fill="#FFFFFF" />
                      <rect x="80" y="12" width="8" height="8" rx="1" fill="#050D1B" />
                      <rect x="4" y="72" width="24" height="24" rx="3" fill="#050D1B" />
                      <rect x="8" y="76" width="16" height="16" rx="2" fill="#FFFFFF" />
                      <rect x="12" y="80" width="8" height="8" rx="1" fill="#050D1B" />
                      {/* Distinct Wallet QR data modules */}
                      <path fill="#050D1B" d="M36 6h8v4h-8zM48 6h6v8h-6zM58 6h8v6h-8zM34 14h6v8h-6zM44 18h10v4H44zM60 16h6v8h-6zM36 26h8v4h-8zM50 26h12v4H50zM6 34h10v6H6zM20 34h8v4h-8zM34 34h4v8h-4zM62 34h6v8h-6zM72 34h8v6h-8zM86 34h10v6H86zM10 44h8v8h-8zM22 46h6v4h-6zM74 44h6v8h-6zM86 46h8v6h-8zM6 56h8v6H6zM18 56h10v4H18zM72 56h10v6H72zM88 56h8v4h-8zM34 64h6v6h-6zM46 66h8v4h-8zM60 64h6v8h-6zM74 66h8v4h-8zM86 64h10v6H86zM34 74h10v4H34zM48 74h6v10h-6zM58 76h8v6h-8zM72 74h10v6H72zM88 74h8v10h-8zM34 84h8v12h-8zM48 88h12v8H48zM66 86h8v10h-8zM80 88h14v8H80z" />
                    </svg>
                    {/* Center ApnaPay Wallet Badge */}
                    <div style={{ position: 'absolute', width: '40px', height: '40px', borderRadius: '50%', background: '#050D1B', border: '3px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
                      <span style={{ fontWeight: '900', fontSize: '18px', color: '#00E599' }}>A</span>
                    </div>
                  </div>

                  {/* Wallet Label Pill */}
                  <button
                    type="button"
                    onClick={() => {
                      setQrModalOpen(false);
                      navigate('/app/wallet');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#071426',
                      border: '1px solid rgba(0, 229, 153, 0.35)',
                      borderRadius: '999px',
                      padding: '6px 14px',
                      cursor: 'pointer',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}
                  >
                    <WalletIcon size={14} style={{ color: '#00E599' }} />
                    <span>ApnaPay Wallet</span>
                    <ChevronRightIcon size={14} style={{ color: '#00E599' }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Slide Controls & Dot Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', margin: '12px 0 8px' }}>
              <button
                type="button"
                onClick={() => setActiveQrSlide(0)}
                disabled={activeQrSlide === 0}
                style={{ background: 'transparent', border: 'none', color: activeQrSlide === 0 ? '#334155' : '#00D5FF', cursor: activeQrSlide === 0 ? 'default' : 'pointer', padding: '2px', display: 'flex' }}
                aria-label="Previous QR"
              >
                <ArrowLeftIcon size={15} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {[0, 1].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveQrSlide(idx)}
                    aria-label={idx === 0 ? 'Bank Account QR' : 'Wallet QR'}
                    style={{
                      width: activeQrSlide === idx ? '18px' : '7px',
                      height: '7px',
                      borderRadius: '999px',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: activeQrSlide === idx ? '#00D5FF' : '#214C7C'
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveQrSlide(1)}
                disabled={activeQrSlide === 1}
                style={{ background: 'transparent', border: 'none', color: activeQrSlide === 1 ? '#334155' : '#00D5FF', cursor: activeQrSlide === 1 ? 'default' : 'pointer', padding: '2px', display: 'flex' }}
                aria-label="Next QR"
              >
                <ArrowRightIcon size={15} />
              </button>
            </div>

            {/* Active UPI / Wallet ID Row with Copy Icon */}
            <div className="phonepe-qr-vpa-row" style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', color: '#A9BDD7' }}>
                {activeQrSlide === 0 ? 'UPI ID:' : 'Wallet ID:'}
              </span>
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: activeQrSlide === 0 ? '#00D5FF' : '#00E599', fontFamily: 'monospace' }}>
                {activeQrSlide === 0 ? primaryUpi : walletQrId}
              </span>
              <button
                type="button"
                onClick={() => handleCopyUpi(activeQrSlide === 0 ? primaryUpi : walletQrId)}
                style={{ background: 'transparent', border: 'none', color: '#00E599', cursor: 'pointer', padding: '2px', display: 'flex' }}
                title="Copy ID"
              >
                {copiedUpi ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
              </button>
            </div>

            {/* Two Action Buttons: Download and Share */}
            <div className="phonepe-qr-buttons-row">
              <button
                type="button"
                onClick={() => {
                  showToast(`${activeQrSlide === 0 ? 'Bank UPI' : 'ApnaPay Wallet'} QR Code saved!`);
                }}
                className="auth-button secondary"
                style={{
                  height: '40px',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: '700'
                }}
              >
                <DownloadIcon size={15} />
                <span>Download</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetId = activeQrSlide === 0 ? primaryUpi : walletQrId;
                  if (navigator.share) {
                    navigator.share({
                      title: 'My ApnaPay QR',
                      text: `Pay me via ApnaPay: ${targetId}`,
                      url: window.location.href
                    }).catch(() => {});
                  } else {
                    handleCopyUpi(targetId);
                    showToast('QR payment ID copied to share!');
                  }
                }}
                className="auth-button secondary"
                style={{
                  height: '40px',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: '700'
                }}
              >
                <ShareIcon size={15} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CHECK BALANCE MODAL (PHONEPE-STYLE FLOW)         */}
      {/* ========================================================= */}
      {checkBalanceModalOpen && createPortal(
        <div
          className="admin-land-modal-overlay"
          style={{ position: 'fixed', inset: 0, zIndex: 10000 }}
          onClick={() => setCheckBalanceModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-land-modal-container"
            style={{ maxWidth: '430px', width: 'min(430px, calc(100vw - 24px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <button
                  type="button"
                  onClick={() => {
                    if (checkBalanceStep === 'pin' || checkBalanceStep === 'result') {
                      setCheckBalanceStep('list');
                      setUpiPinInput('');
                      setUpiPinError('');
                    } else {
                      setCheckBalanceModalOpen(false);
                    }
                  }}
                  className="modal-corner-back-btn"
                  title="Back"
                  aria-label="Back"
                >
                  <ArrowLeftIcon size={18} />
                </button>
                <CreditCardIcon size={20} style={{ color: '#F59E0B' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  {checkBalanceStep === 'pin'
                    ? 'Enter UPI PIN'
                    : checkBalanceStep === 'loading'
                      ? 'Fetching Balance'
                      : checkBalanceStep === 'result'
                        ? 'Bank Balance'
                        : 'Check Balance'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckBalanceModalOpen(false)}
                className="admin-land-modal-close-btn"
                title="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="admin-land-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* STEP 1: LIST OF PAYMENT METHODS */}
              {checkBalanceStep === 'list' && (
                <>
                  {/* Promo Banner (Daily SIP / Gold style) */}
                  <div
                    onClick={() => {
                      setCheckBalanceModalOpen(false);
                      setSipFrequency('daily');
                      setSipAmount('40');
                      setSipModalOpen(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(8, 123, 255, 0.28) 0%, rgba(0, 168, 255, 0.14) 100%)',
                      border: '1px solid rgba(0, 168, 255, 0.35)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Build ₹1,200 in 1 month</span>
                        <ArrowRightIcon size={14} style={{ color: '#00D5FF' }} />
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>
                        Save ₹40/day in Digital Wealth &amp; SIP
                      </div>
                    </div>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'rgba(245, 158, 11, 0.18)',
                        color: '#F59E0B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <TrendingUpIcon size={18} />
                    </div>
                  </div>

                  {/* Linked Bank Accounts */}
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#6B87A8', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '2px' }}>
                    Linked Bank Accounts
                  </div>

                  {bankAccounts.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '2px' }}>
                      {bankAccounts.map((acct, idx) => {
                        const bName = acct.bankName || acct.bank_name || 'Linked Bank';
                        const last4 = acct.accountLast4 || acct.account_last4 || (acct.accountNumber ? acct.accountNumber.slice(-4) : (acct.maskedAccountNumber ? acct.maskedAccountNumber.slice(-4) : '9422'));
                        return (
                          <button
                            key={acct.id || idx}
                            type="button"
                            onClick={() => {
                              setSelectedBalanceBank({ ...acct, displayBankName: bName, displayLast4: last4 });
                              setUpiPinInput('');
                              setUpiPinError('');
                              setCheckBalanceStep('pin');
                            }}
                            style={{
                              width: '100%',
                              background: '#071426',
                              border: '1px solid #17385D',
                              borderRadius: '11px',
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'border-color 0.18s ease',
                              flexShrink: 0
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00A8FF')}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#17385D')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(0, 168, 255, 0.15)', color: '#00A8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <LandmarkIcon size={18} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {bName} - {last4}
                                </div>
                                <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>Bank Account</span>
                                  {(acct.isPrimary || acct.is_primary) && (
                                    <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#00E599', background: 'rgba(0, 229, 153, 0.12)', padding: '1px 6px', borderRadius: '6px' }}>
                                      PRIMARY
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ChevronRightIcon size={16} style={{ color: '#6B87A8', flexShrink: 0 }} />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      style={{
                        background: '#071426',
                        border: '1px dashed #214C7C',
                        borderRadius: '12px',
                        padding: '14px',
                        fontSize: '12.5px',
                        color: '#A9BDD7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <span>No bank account linked yet.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCheckBalanceModalOpen(false);
                          setOnboardingStep(1);
                          setOnboardingModalOpen(true);
                        }}
                        style={{ background: 'rgba(0, 168, 255, 0.15)', color: '#00D5FF', border: '1px solid rgba(0, 168, 255, 0.35)', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        + Link Bank
                      </button>
                    </div>
                  )}

                  {/* ApnaPay Wallet */}
                  <button
                    type="button"
                    onClick={() => {
                      setCheckBalanceModalOpen(false);
                      navigate('/app/wallet');
                    }}
                    style={{
                      width: '100%',
                      background: '#071426',
                      border: '1px solid #17385D',
                      borderRadius: '12px',
                      padding: '13px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00E599')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#17385D')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 229, 153, 0.15)', color: '#00E599', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <WalletIcon size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>ApnaPay Wallet</div>
                        <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '2px' }}>
                          Balance: <strong style={{ color: '#00E599' }}>{displayWalletBal}</strong>
                        </div>
                        <div style={{ fontSize: '11px', color: '#00D5FF', marginTop: '2px' }}>
                          Instant zero-PIN wallet payments
                        </div>
                      </div>
                    </div>
                    <ChevronRightIcon size={18} style={{ color: '#6B87A8', flexShrink: 0 }} />
                  </button>

                  {/* RuPay Credit Card */}
                  <div
                    style={{
                      background: '#071426',
                      border: '1px solid #17385D',
                      borderRadius: '12px',
                      padding: '13px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#C084FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CreditCardIcon size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>RuPay Credit Card</div>
                        <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>Pay via UPI using credit card</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckBalanceModalOpen(false);
                        navigate('/app/upi');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#00D5FF',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      Link Now
                    </button>
                  </div>

                  {/* Add New Payment Method */}
                  <button
                    type="button"
                    onClick={() => {
                      setCheckBalanceModalOpen(false);
                      setOnboardingStep(1);
                      setOnboardingModalOpen(true);
                    }}
                    style={{
                      width: '100%',
                      background: '#071426',
                      border: '1px solid #17385D',
                      borderRadius: '12px',
                      padding: '13px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00A8FF')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#17385D')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.06)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', flexShrink: 0 }}>
                        +
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>Add new payment method</div>
                        <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>Bank Account, UPI &amp; more</div>
                      </div>
                    </div>
                    <ChevronRightIcon size={18} style={{ color: '#6B87A8', flexShrink: 0 }} />
                  </button>
                </>
              )}

              {/* STEP 2: ENTER UPI PIN */}
              {checkBalanceStep === 'pin' && selectedBalanceBank && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!/^\d{4}$|^\d{6}$/.test(upiPinInput)) {
                      setUpiPinError('Please enter a valid 4-digit or 6-digit UPI PIN.');
                      return;
                    }
                    setUpiPinError('');
                    setCheckBalanceStep('loading');
                    try {
                      const res = await bankAccountService.checkBalance(
                        selectedBalanceBank.id,
                        upiPinInput,
                        !selectedBalanceBank.hasUpiPin
                      );
                      const bal = res?.data?.balance ?? 0;
                      setFetchedBankBalance(bal);
                      setBankAccounts((prev) =>
                        prev.map((b) =>
                          b.id === selectedBalanceBank.id ? { ...b, hasUpiPin: true, balance: bal } : b
                        )
                      );
                      setSelectedBalanceBank((prev) => (prev ? { ...prev, hasUpiPin: true } : prev));
                      setCheckBalanceStep('result');
                    } catch (err) {
                      const msg = err?.response?.data?.message || 'Incorrect UPI PIN. Please try again.';
                      setUpiPinError(msg);
                      setCheckBalanceStep('pin');
                    }
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                >
                  <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <LandmarkIcon size={20} style={{ color: '#00A8FF' }} />
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#FFFFFF' }}>
                          {selectedBalanceBank.displayBankName}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#A9BDD7' }}>
                          Account •••• {selectedBalanceBank.displayLast4}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#00D5FF', background: 'rgba(0, 213, 255, 0.12)', padding: '3px 8px', borderRadius: '6px' }}>
                      {selectedBalanceBank.hasUpiPin ? 'UPI PIN' : 'FIRST-TIME PIN'}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#A9BDD7' }}>
                        {selectedBalanceBank.hasUpiPin
                          ? 'ENTER 4 OR 6-DIGIT UPI PIN'
                          : 'SET 4 OR 6-DIGIT UPI PIN (FIRST TIME)'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowUpiPin((v) => !v)}
                        style={{ background: 'transparent', border: 'none', color: '#00D5FF', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        {showUpiPin ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                        <span>{showUpiPin ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <input
                      type={showUpiPin ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={6}
                      autoFocus
                      value={upiPinInput}
                      onChange={(e) => {
                        setUpiPinInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                        if (upiPinError) setUpiPinError('');
                      }}
                      placeholder="••••••"
                      className="auth-input"
                      style={{
                        textAlign: 'center',
                        letterSpacing: showUpiPin ? '8px' : '10px',
                        fontSize: '20px',
                        fontWeight: '800',
                        height: '48px'
                      }}
                    />
                    {upiPinError && (
                      <div style={{ color: '#FF4D4D', fontSize: '12px', marginTop: '6px', fontWeight: '600' }}>
                        {upiPinError}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '11px', color: '#6B87A8', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                    <ShieldCheckIcon size={14} style={{ color: '#00E599' }} />
                    <span>Secured by NPCI UPI 256-bit Encryption</span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setCheckBalanceStep('list')}
                      className="auth-button secondary"
                      style={{ flex: 1, height: '40px', margin: 0, fontSize: '13px' }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="auth-button"
                      style={{ flex: 2, height: '40px', margin: 0, fontSize: '13px' }}
                    >
                      Check Balance
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: LOADING / NPCI SYNC */}
              {checkBalanceStep === 'loading' && (
                <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                  <RefreshCwIcon size={36} style={{ color: '#00D5FF', animation: 'spin 1s linear infinite' }} />
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF' }}>
                    Fetching balance securely...
                  </div>
                  <div style={{ fontSize: '12px', color: '#A9BDD7' }}>
                    Connecting to {selectedBalanceBank?.displayBankName || 'Bank'} via NPCI UPI gateway
                  </div>
                </div>
              )}

              {/* STEP 4: FETCHED BANK BALANCE RESULT */}
              {checkBalanceStep === 'result' && selectedBalanceBank && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(0, 229, 153, 0.12) 0%, rgba(0, 168, 255, 0.08) 100%)',
                      border: '1px solid rgba(0, 229, 153, 0.35)',
                      borderRadius: '14px',
                      padding: '20px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 229, 153, 0.16)', color: '#00E599', padding: '4px 10px', borderRadius: '999px', fontSize: '11.5px', fontWeight: '700', marginBottom: '12px' }}>
                      <CheckCircleIcon size={14} />
                      <span>Bank Account Balance Fetched Successfully</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#A9BDD7', fontWeight: '600' }}>
                      {selectedBalanceBank.displayBankName} •••• {selectedBalanceBank.displayLast4}
                    </div>
                    <div style={{ fontSize: '30px', fontWeight: '900', color: '#FFFFFF', marginTop: '6px', letterSpacing: '-0.5px' }}>
                      {formatINR(fetchedBankBalance ?? 0)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B87A8', marginTop: '6px' }}>
                      Available Balance • Checked just now
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckBalanceStep('list');
                        setUpiPinInput('');
                        setFetchedBankBalance(null);
                      }}
                      className="auth-button secondary"
                      style={{ flex: 1, height: '40px', margin: 0, fontSize: '12.5px' }}
                    >
                      Check Another
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckBalanceModalOpen(false)}
                      className="auth-button"
                      style={{ flex: 1, height: '40px', margin: 0, fontSize: '12.5px' }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 4: SCAN & PAY / LIVE CAMERA QR SCANNER              */}
      {/* ========================================================= */}
      {scanPayModalOpen && createPortal(
        <div
          className="admin-land-modal-overlay"
          style={{ position: 'fixed', inset: 0, zIndex: 10000 }}
          onClick={() => setScanPayModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-land-modal-container"
            style={{ maxWidth: '430px', width: 'min(430px, calc(100vw - 24px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <button
                  type="button"
                  onClick={() => setScanPayModalOpen(false)}
                  className="modal-corner-back-btn"
                  title="Back"
                  aria-label="Back"
                >
                  <ArrowLeftIcon size={18} />
                </button>
                <QrCodeIcon size={20} style={{ color: '#00A8FF' }} />
                <div>
                  <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    Scan any QR
                  </h3>
                  <div style={{ fontSize: '11px', color: '#A9BDD7' }}>
                    PhonePe • Google Pay • BHIM • Paytm
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScanPayModalOpen(false)}
                className="admin-land-modal-close-btn"
                title="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="admin-land-modal-body">
              {/* Live Camera Viewfinder */}
              <div
                style={{
                  width: '100%',
                  height: '220px',
                  background: '#040B16',
                  border: '1px solid #1E3A5F',
                  borderRadius: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 24px rgba(0, 168, 255, 0.16)'
                }}
              >
                <video
                  ref={qrVideoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => qrVideoRef.current?.play().catch(() => {})}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: cameraActive ? 1 : 0,
                    transition: 'opacity 0.2s ease'
                  }}
                />

                {/* Corner Scanner Brackets */}
                <div style={{ position: 'absolute', top: '18px', left: '18px', width: '26px', height: '26px', borderTop: '3px solid #00D5FF', borderLeft: '3px solid #00D5FF', borderTopLeftRadius: '6px', zIndex: 2 }} />
                <div style={{ position: 'absolute', top: '18px', right: '18px', width: '26px', height: '26px', borderTop: '3px solid #00D5FF', borderRight: '3px solid #00D5FF', borderTopRightRadius: '6px', zIndex: 2 }} />
                <div style={{ position: 'absolute', bottom: '18px', left: '18px', width: '26px', height: '26px', borderBottom: '3px solid #00D5FF', borderLeft: '3px solid #00D5FF', borderBottomLeftRadius: '6px', zIndex: 2 }} />
                <div style={{ position: 'absolute', bottom: '18px', right: '18px', width: '26px', height: '26px', borderBottom: '3px solid #00D5FF', borderRight: '3px solid #00D5FF', borderBottomRightRadius: '6px', zIndex: 2 }} />

                {!cameraActive && (
                  <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '0 20px' }}>
                    <QrCodeIcon size={42} style={{ color: 'rgba(0, 213, 255, 0.5)', marginBottom: '8px' }} />
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#FFFFFF' }}>
                      {cameraError ? 'Camera Unavailable' : 'Starting Camera...'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '4px', lineHeight: '1.35' }}>
                      {cameraError || 'Allow camera permission to scan any UPI QR code'}
                    </div>
                    {cameraError && (
                      <button
                        type="button"
                        onClick={startQrCamera}
                        style={{
                          marginTop: '10px',
                          padding: '5px 12px',
                          borderRadius: '999px',
                          border: '1px solid #00D5FF',
                          background: 'rgba(0, 213, 255, 0.14)',
                          color: '#00D5FF',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Retry Camera
                      </button>
                    )}
                  </div>
                )}

                {scannedPayeeInfo && (
                  <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 4, background: 'rgba(5, 13, 27, 0.9)', border: '1px solid #00E599', color: '#00E599', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                    Detected: {scannedPayeeInfo}
                  </div>
                )}
              </div>

              {/* PhonePe-style Upload QR & Torch Action Buttons */}
              <input
                ref={qrFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleUploadQrImage}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => qrFileInputRef.current?.click()}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#FFFFFF' }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#0B1B32', border: '1px solid #1E3A5F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00D5FF' }}>
                    <DownloadIcon size={18} style={{ transform: 'rotate(180deg)' }} />
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#A9BDD7' }}>Upload QR</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleTorch}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#FFFFFF' }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: torchOn ? 'rgba(245, 158, 11, 0.2)' : '#0B1B32', border: `1px solid ${torchOn ? '#F59E0B' : '#1E3A5F'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: torchOn ? '#F59E0B' : '#00D5FF' }}>
                    <ZapIcon size={18} />
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: '600', color: torchOn ? '#F59E0B' : '#A9BDD7' }}>Torch</span>
                </button>
              </div>

              {/* Manual Input Fallback */}
              <div style={{ marginTop: '14px', background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px' }}>
                <label style={{ fontSize: '12px', color: '#A9BDD7', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  Or enter 10-Digit Mobile / UPI ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210 or merchant@apnapay"
                  value={scanUpiInput}
                  onChange={(e) => setScanUpiInput(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    background: '#0B1B32',
                    border: '1px solid #1E3A5F',
                    borderRadius: '8px',
                    padding: '0 12px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Quick Amount Presets */}
              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '12px', color: '#A9BDD7', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  Transfer Amount
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {['100', '250', '500', '1000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuickAmount(amt)}
                      style={{
                        padding: '8px 0',
                        borderRadius: '8px',
                        border: quickAmount === amt ? '1px solid #00A8FF' : '1px solid #17385D',
                        background: quickAmount === amt ? 'rgba(0, 168, 255, 0.15)' : '#071426',
                        color: quickAmount === amt ? '#00A8FF' : '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-land-modal-footer">
              <button
                type="button"
                onClick={() => setScanPayModalOpen(false)}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '13px', margin: 0 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanPayModalOpen(false);
                  navigate('/app/transfers', {
                    state: { payee: scanUpiInput, amount: quickAmount }
                  });
                }}
                className="auth-button"
                style={{ width: 'auto', padding: '0 20px', height: '38px', fontSize: '13px', margin: 0 }}
              >
                Proceed to Pay ₹{quickAmount} →
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 5: INTERACTIVE SIP WEALTH PLANNING SIMULATOR        */}
      {/* ========================================================= */}
      {sipModalOpen && (
        <div
          className="admin-land-modal-overlay"
          onClick={() => setSipModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-land-modal-container"
            style={{ maxWidth: '460px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <button
                  type="button"
                  onClick={() => setSipModalOpen(false)}
                  className="modal-corner-back-btn"
                  title="Back"
                  aria-label="Back"
                >
                  <ArrowLeftIcon size={18} />
                </button>
                <TrendingUpIcon size={20} style={{ color: '#00E599' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  ApnaPay SIP & Wealth Simulator
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSipModalOpen(false)}
                className="admin-land-modal-close-btn"
                title="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="admin-land-modal-body">
              {/* Frequency Toggle: Daily vs Monthly */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#071426', padding: '4px', borderRadius: '10px', border: '1px solid #17385D', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSipFrequency('daily');
                    setSipAmount('50');
                  }}
                  style={{
                    padding: '8px 0',
                    border: 'none',
                    borderRadius: '8px',
                    background: sipFrequency === 'daily' ? 'linear-gradient(135deg, #087BFF, #00D5FF)' : 'transparent',
                    color: '#FFFFFF',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Daily SIP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSipFrequency('monthly');
                    setSipAmount('1000');
                  }}
                  style={{
                    padding: '8px 0',
                    border: 'none',
                    borderRadius: '8px',
                    background: sipFrequency === 'monthly' ? 'linear-gradient(135deg, #087BFF, #00D5FF)' : 'transparent',
                    color: '#FFFFFF',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Monthly SIP
                </button>
              </div>

              {/* Amount Selection */}
              <div>
                <label style={{ fontSize: '12px', color: '#A9BDD7', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  {sipFrequency === 'daily' ? 'Select Daily Investment' : 'Select Monthly Investment'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {(sipFrequency === 'daily' ? ['10', '50', '100'] : ['500', '1000', '2500']).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSipAmount(amt)}
                      style={{
                        padding: '10px 0',
                        borderRadius: '8px',
                        border: sipAmount === amt ? '1px solid #00E599' : '1px solid #17385D',
                        background: sipAmount === amt ? 'rgba(0, 229, 153, 0.15)' : '#071426',
                        color: sipAmount === amt ? '#00E599' : '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      ₹{amt}/{sipFrequency === 'daily' ? 'day' : 'mo'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Investment Horizon */}
              <div style={{ marginTop: '14px' }}>
                <label style={{ fontSize: '12px', color: '#A9BDD7', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  Investment Horizon
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[1, 3, 5].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setSipHorizonYears(yr)}
                      style={{
                        padding: '8px 0',
                        borderRadius: '8px',
                        border: sipHorizonYears === yr ? '1px solid #00A8FF' : '1px solid #17385D',
                        background: sipHorizonYears === yr ? 'rgba(0, 168, 255, 0.15)' : '#071426',
                        color: sipHorizonYears === yr ? '#00A8FF' : '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        cursor: 'pointer'
                      }}
                    >
                      {yr} Year{yr > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulation Result Box */}
              <div
                style={{
                  background: '#071426',
                  border: '1px solid #1E3A5F',
                  borderRadius: '12px',
                  padding: '14px',
                  marginTop: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#A9BDD7' }}>Total Invested Amount:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>₹{sipResult.invested.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#A9BDD7' }}>Estimated Returns (12% CAGR):</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#00E599' }}>+₹{sipResult.profit.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #17385D' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF' }}>Projected Maturity Value:</span>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: '#00D5FF' }}>₹{sipResult.futureVal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="admin-land-modal-footer">
              <button
                type="button"
                onClick={() => setSipModalOpen(false)}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '13px', margin: 0 }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSipModalOpen(false);
                  showToast(`Simulated ${sipFrequency} SIP of ₹${sipAmount} initiated on your escrow ledger!`);
                }}
                className="auth-button"
                style={{
                  width: 'auto',
                  padding: '0 20px',
                  height: '38px',
                  fontSize: '13px',
                  margin: 0,
                  background: 'linear-gradient(135deg, #059669 0%, #00E599 100%)',
                  border: 'none',
                  color: '#FFFFFF'
                }}
              >
                Start Simulated SIP →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: QUICK ADD MONEY MODAL                            */}
      {/* ========================================================= */}
      {addMoneyModalOpen && (
        <div
          className="admin-land-modal-overlay"
          onClick={() => setAddMoneyModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-land-modal-container"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <button
                  type="button"
                  onClick={() => setAddMoneyModalOpen(false)}
                  className="modal-corner-back-btn"
                  title="Back"
                  aria-label="Back"
                >
                  <ArrowLeftIcon size={18} />
                </button>
                <WalletIcon size={18} style={{ color: '#00E599' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  Add Money to ApnaPay Wallet
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddMoneyModalOpen(false)}
                className="admin-land-modal-close-btn"
                title="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="admin-land-modal-body">
              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase' }}>Current Available Balance</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF' }}>{displayWalletBal}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase' }}>Deposit Status</div>
                  <span style={{ fontSize: '11px', color: '#00E599', fontWeight: '700' }}>● Instant Escrow</span>
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '12px', color: '#A9BDD7', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  Select Top-up Amount
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {['200', '500', '1000', '2000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuickAmount(amt)}
                      style={{
                        padding: '10px 0',
                        borderRadius: '8px',
                        border: quickAmount === amt ? '1px solid #00E599' : '1px solid #17385D',
                        background: quickAmount === amt ? 'rgba(0, 229, 153, 0.15)' : '#071426',
                        color: quickAmount === amt ? '#00E599' : '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(0, 229, 153, 0.08)', border: '1px solid rgba(0, 229, 153, 0.25)', borderRadius: '8px', padding: '10px 12px', fontSize: '11.5px', color: '#A9BDD7', lineHeight: 1.4 }}>
                Funds are immediately credited to your double-entry escrow ledger. You can transfer, pay utility bills, or invest in Digital Land parcels.
              </div>
            </div>

            <div className="admin-land-modal-footer">
              <button
                type="button"
                onClick={() => setAddMoneyModalOpen(false)}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '13px', margin: 0 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddMoneyModalOpen(false);
                  navigate('/app/wallet');
                }}
                className="auth-button"
                style={{
                  width: 'auto',
                  padding: '0 20px',
                  height: '38px',
                  fontSize: '13px',
                  margin: 0,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: '700'
                }}
              >
                Proceed to Deposit ₹{quickAmount} →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: GENERAL INFO MODAL                               */}
      {/* ========================================================= */}
      {infoModal && (
        <div
          className="admin-land-modal-overlay"
          onClick={() => setInfoModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-land-modal-container"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <button
                  type="button"
                  onClick={() => setInfoModal(null)}
                  className="modal-corner-back-btn"
                  title="Back"
                  aria-label="Back"
                >
                  <ArrowLeftIcon size={18} />
                </button>
                <InfoIcon size={18} style={{ color: '#00A8FF' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  {infoModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="admin-land-modal-close-btn"
                title="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="admin-land-modal-body">
              <p style={{ color: '#E2E8F0', fontSize: '13.5px', lineHeight: 1.5, margin: 0 }}>
                {infoModal.content}
              </p>
            </div>

            <div className="admin-land-modal-footer" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 18px', height: '36px', fontSize: '13px', margin: 0 }}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerDashboardOverview;
