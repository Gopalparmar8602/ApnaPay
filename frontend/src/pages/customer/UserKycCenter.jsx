import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Key,
  Calendar,
  User,
  Check,
  RotateCcw,
  Wallet,
  Lock,
  ChevronRight,
  Zap,
  QrCode,
  Settings,
  History,
  TrendingUp,
  Plus,
  Send,
  Download,
  Info
} from 'lucide-react';
import api from '../../services/api';

export default function UserKycCenter() {
  const navigate = useNavigate();

  // Loading & Global State
  const [loading, setLoading] = useState(true);
  const [kycData, setKycData] = useState(null);
  const [walletData, setWalletData] = useState({ available_balance: 0.0 });
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text }

  // Current Step: 1 | 2 | 3 | 4 | 5
  // Step 1: PAN Card Details & OTP
  // Step 2: Aadhaar Card Details & OTP
  // Step 3: PhonePe Wallet KYC Details (Parent, Occupation, Nominee, Declarations)
  // Step 4: Wallet Limits Upgrade (₹1 Lakh vs ₹2 Lakh)
  // Step 5: Activated ApnaPay Wallet Dashboard
  const [currentStep, setCurrentStep] = useState(1);

  // Sub-step for Step 1 (false = PAN form, true = PAN OTP)
  const [isPanOtpActive, setIsPanOtpActive] = useState(false);
  // Sub-step for Step 2 (false = Aadhaar form, true = Aadhaar OTP)
  const [isAadhaarOtpActive, setIsAadhaarOtpActive] = useState(false);

  // ==========================================
  // STEP 1: PAN State
  // ==========================================
  const [panNumber, setPanNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [panErrors, setPanErrors] = useState({});
  const [isSubmittingPan, setIsSubmittingPan] = useState(false);

  // PAN OTP State
  const [panOtp, setPanOtp] = useState('');
  const [panOtpError, setPanOtpError] = useState(null);
  const [isVerifyingPanOtp, setIsVerifyingPanOtp] = useState(false);
  const [panCooldown, setPanCooldown] = useState(0);
  const [panExpiry, setPanExpiry] = useState(0);

  // ==========================================
  // STEP 2: Aadhaar State
  // ==========================================
  const [idType, setIdType] = useState('aadhaar'); // 'aadhaar' | 'vid'
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarConsent, setAadhaarConsent] = useState(true);
  const [aadhaarError, setAadhaarError] = useState(null);
  const [isSubmittingAadhaar, setIsSubmittingAadhaar] = useState(false);

  // Aadhaar OTP State
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarOtpError, setAadhaarOtpError] = useState(null);
  const [isVerifyingAadhaarOtp, setIsVerifyingAadhaarOtp] = useState(false);
  const [aadhaarCooldown, setAadhaarCooldown] = useState(0);
  const [aadhaarExpiry, setAadhaarExpiry] = useState(0);

  // ==========================================
  // STEP 3: Profile & Nominee Details State
  // ==========================================
  const [parentRelation, setParentRelation] = useState('Father');
  const [parentName, setParentName] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('Single');
  const [occupationType, setOccupationType] = useState('Salaried');
  const [annualIncome, setAnnualIncome] = useState('1 to 5 Lakhs');
  const [nomineeRelation, setNomineeRelation] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeDob, setNomineeDob] = useState('');
  const [hasDisability, setHasDisability] = useState('No');
  const [isTaxResidentIndia, setIsTaxResidentIndia] = useState(true);
  const [isPep, setIsPep] = useState(false);
  const [otpEkycDeclaration, setOtpEkycDeclaration] = useState(true);
  const [detailsErrors, setDetailsErrors] = useState({});
  const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);

  // ==========================================
  // STEP 4: Limit Upgrade State
  // ==========================================
  const [isUpgradingLimit, setIsUpgradingLimit] = useState(false);

  // Contact Info Masking
  const [maskedPhone, setMaskedPhone] = useState('******80069');
  const [maskedEmail, setMaskedEmail] = useState('g****2@gmail.com');

  // Timers for OTP Expiry & Resend Cooldown
  useEffect(() => {
    let interval = null;
    if (panCooldown > 0) {
      interval = setInterval(() => setPanCooldown((c) => Math.max(0, c - 1)), 1000);
    }
    return () => clearInterval(interval);
  }, [panCooldown]);

  useEffect(() => {
    let interval = null;
    if (panExpiry > 0) {
      interval = setInterval(() => setPanExpiry((e) => Math.max(0, e - 1)), 1000);
    }
    return () => clearInterval(interval);
  }, [panExpiry]);

  useEffect(() => {
    let interval = null;
    if (aadhaarCooldown > 0) {
      interval = setInterval(() => setAadhaarCooldown((c) => Math.max(0, c - 1)), 1000);
    }
    return () => clearInterval(interval);
  }, [aadhaarCooldown]);

  useEffect(() => {
    let interval = null;
    if (aadhaarExpiry > 0) {
      interval = setInterval(() => setAadhaarExpiry((e) => Math.max(0, e - 1)), 1000);
    }
    return () => clearInterval(interval);
  }, [aadhaarExpiry]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Initial Load: Fetch KYC Status from Backend
  const fetchKycStatus = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.get('/kyc/status');
      if (res.data?.success) {
        const d = res.data.data;
        setKycData(d);

        if (d.wallet) {
          setWalletData(d.wallet);
        }

        if (d.user?.masked_phone || d.mobile_verification?.masked_phone) {
          setMaskedPhone(d.user?.masked_phone || d.mobile_verification?.masked_phone);
        }
        if (d.user?.email) {
          const parts = d.user.email.split('@');
          if (parts.length === 2) {
            const [u, dom] = parts;
            setMaskedEmail(`${u[0]}****${u.slice(-1)}@${dom}`);
          }
        }

        if (d.personal_details?.full_name || d.user?.full_name) {
          setFullName((prev) => prev || d.personal_details?.full_name || d.user?.full_name || '');
        }
        if (d.personal_details?.date_of_birth) {
          setDateOfBirth((prev) => prev || d.personal_details.date_of_birth);
        }

        // Hydrate Step 3 details if present
        if (d.kyc?.parent_relation) setParentRelation(d.kyc.parent_relation);
        if (d.kyc?.parent_name) setParentName(d.kyc.parent_name);
        if (d.kyc?.marital_status) setMaritalStatus(d.kyc.marital_status);
        if (d.kyc?.occupation_type) setOccupationType(d.kyc.occupation_type);
        if (d.kyc?.annual_income) setAnnualIncome(d.kyc.annual_income);
        if (d.kyc?.nominee_relation) setNomineeRelation(d.kyc.nominee_relation);
        if (d.kyc?.nominee_name) setNomineeName(d.kyc.nominee_name);
        if (d.kyc?.nominee_dob) setNomineeDob(d.kyc.nominee_dob);
        if (d.kyc?.has_disability) setHasDisability(d.kyc.has_disability);

        // Resume at the exact correct step
        const step = d.kyc?.current_step || 1;
        setCurrentStep(step);
      }
    } catch (err) {
      console.error('Fetch KYC Status Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  // Format Aadhaar display (XXXX XXXX XXXX)
  const formatAadhaarInput = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    const parts = [];
    const chunkSize = 4;
    for (let i = 0; i < digits.length; i += chunkSize) {
      parts.push(digits.substring(i, i + chunkSize));
    }
    return parts.join(' ');
  };

  // Quick Demo Autofills
  const handleFillDemoPan = () => {
    setPanNumber('GSSPP4232F');
    setFullName(kycData?.user?.full_name || 'GOPAL PARMAR');
    setDateOfBirth('1998-05-15');
    setPanErrors({});
  };

  const handleFillDemoAadhaar = () => {
    setAadhaarNumber('8951 3847 1629');
    setAadhaarError(null);
  };

  const handleFillDemoDetails = () => {
    setParentRelation('Father');
    setParentName('Shyam Parmar');
    setMaritalStatus('Single');
    setOccupationType('Salaried');
    setAnnualIncome('1 to 5 Lakhs');
    setNomineeRelation('Sibling');
    setNomineeName('Shree Krishna Parmar');
    setNomineeDob('1999-08-15');
    setHasDisability('No');
    setIsTaxResidentIndia(true);
    setIsPep(false);
    setOtpEkycDeclaration(true);
    setDetailsErrors({});
  };

  // ============================================================
  // STEP 1: SUBMIT PAN DETAILS
  // ============================================================
  const handleSubmitPan = async (e) => {
    e?.preventDefault();
    const errors = {};
    const cleanPan = panNumber.trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!cleanPan) {
      errors.panNumber = 'PAN Card Number is required.';
    } else if (!panRegex.test(cleanPan)) {
      errors.panNumber = 'Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F).';
    }

    if (!fullName.trim()) {
      errors.fullName = 'Full Name as per PAN Card is required.';
    } else if (fullName.trim().length < 3) {
      errors.fullName = 'Please enter your complete legal name.';
    }

    if (!dateOfBirth) {
      errors.dateOfBirth = 'Date of Birth is required.';
    } else {
      const dob = new Date(dateOfBirth);
      const ageDiff = Date.now() - dob.getTime();
      const age = new Date(ageDiff).getUTCFullYear() - 1970;
      if (age < 18) {
        errors.dateOfBirth = 'You must be at least 18 years old to complete KYC.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setPanErrors(errors);
      return;
    }

    setPanErrors({});
    setIsSubmittingPan(true);
    setFeedback(null);

    try {
      const res = await api.post('/kyc/pan/verify', {
        panNumber: cleanPan,
        fullName: fullName.trim(),
        dateOfBirth
      });

      if (res.data?.success) {
        if (res.data.data?.masked_phone) setMaskedPhone(res.data.data.masked_phone);
        if (res.data.data?.masked_email) setMaskedEmail(res.data.data.masked_email);
        setPanExpiry(res.data.data?.expires_in_seconds || 300);
        setPanCooldown(res.data.data?.resend_cooldown_seconds || 30);
        setFeedback({
          type: 'success',
          text: res.data.message || 'PAN verified. Verification OTP sent to registered mobile and email.'
        });
        setIsPanOtpActive(true); // Open OTP verification
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to verify PAN details. Please try again.';
      setPanErrors({ submit: msg });
    } finally {
      setIsSubmittingPan(false);
    }
  };

  // ============================================================
  // STEP 1 OTP: VERIFY PAN OTP
  // ============================================================
  const handleVerifyPanOtp = async (e) => {
    e?.preventDefault();
    if (!panOtp || panOtp.trim().length !== 6) {
      setPanOtpError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsVerifyingPanOtp(true);
    setPanOtpError(null);
    setFeedback(null);

    try {
      const res = await api.post('/kyc/pan/verify-otp', {
        otp: panOtp.trim()
      });

      if (res.data?.success) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([80, 40, 100]);
          } catch (_) {}
        }
        setPanOtp('');
        setIsPanOtpActive(false);
        setFeedback({
          type: 'success',
          text: 'PAN Card verified successfully! Proceeding to Step 2 (Aadhaar Verification).'
        });
        await fetchKycStatus();
        setCurrentStep(2); // Proceed to Step 2: Aadhaar
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP. Please check your email or use sandbox code 123456.';
      setPanOtpError(msg);
    } finally {
      setIsVerifyingPanOtp(false);
    }
  };

  const handleResendPanOtp = async () => {
    if (panCooldown > 0) return;
    setPanOtpError(null);
    try {
      const res = await api.post('/kyc/pan/resend-otp');
      if (res.data?.success) {
        setPanCooldown(res.data.data?.resend_cooldown_seconds || 30);
        setPanExpiry(res.data.data?.expires_in_seconds || 300);
        if (res.data.data?.masked_email) setMaskedEmail(res.data.data.masked_email);
        setFeedback({
          type: 'success',
          text: res.data.message || 'New verification OTP sent to your registered mobile and email.'
        });
      }
    } catch (err) {
      setPanOtpError(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  // ============================================================
  // STEP 2: SUBMIT AADHAAR DETAILS
  // ============================================================
  const handleSubmitAadhaar = async (e) => {
    e?.preventDefault();
    const cleanDigits = aadhaarNumber.replace(/\D/g, '');

    if (!cleanDigits) {
      setAadhaarError('Aadhaar Number is required.');
      return;
    }
    if (idType === 'aadhaar' && cleanDigits.length !== 12) {
      setAadhaarError('Aadhaar must be exactly 12 numeric digits.');
      return;
    }
    if (idType === 'vid' && cleanDigits.length !== 16) {
      setAadhaarError('Aadhaar VID must be exactly 16 numeric digits.');
      return;
    }
    if (!aadhaarConsent) {
      setAadhaarError('Please agree to the Aadhaar consent to proceed.');
      return;
    }

    setAadhaarError(null);
    setIsSubmittingAadhaar(true);
    setFeedback(null);

    try {
      const res = await api.post('/kyc/aadhaar/verify', {
        aadhaarNumber: cleanDigits
      });

      if (res.data?.success) {
        if (res.data.data?.masked_phone) setMaskedPhone(res.data.data.masked_phone);
        if (res.data.data?.masked_email) setMaskedEmail(res.data.data.masked_email);
        setAadhaarExpiry(res.data.data?.expires_in_seconds || 300);
        setAadhaarCooldown(res.data.data?.resend_cooldown_seconds || 30);
        setFeedback({
          type: 'success',
          text: res.data.message || 'UIDAI Aadhaar OTP sent to your registered mobile and email.'
        });
        setIsAadhaarOtpActive(true); // Open OTP verification
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to initiate Aadhaar verification.';
      setAadhaarError(msg);
    } finally {
      setIsSubmittingAadhaar(false);
    }
  };

  // ============================================================
  // STEP 2 OTP: VERIFY AADHAAR OTP
  // ============================================================
  const handleVerifyAadhaarOtp = async (e) => {
    e?.preventDefault();
    if (!aadhaarOtp || aadhaarOtp.trim().length !== 6) {
      setAadhaarOtpError('Please enter the complete 6-digit Aadhaar OTP.');
      return;
    }

    setIsVerifyingAadhaarOtp(true);
    setAadhaarOtpError(null);
    setFeedback(null);

    try {
      const res = await api.post('/kyc/aadhaar/verify-otp', {
        otp: aadhaarOtp.trim()
      });

      if (res.data?.success) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([100, 50, 150]);
          } catch (_) {}
        }
        setAadhaarOtp('');
        setIsAadhaarOtpActive(false);
        setFeedback({
          type: 'success',
          text: 'Aadhaar verified successfully! Please enter your personal details to complete KYC.'
        });
        await fetchKycStatus();
        setCurrentStep(3); // Proceed to Step 3: Details
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid Aadhaar OTP entered. Check your email or use sandbox code 123456.';
      setAadhaarOtpError(msg);
    } finally {
      setIsVerifyingAadhaarOtp(false);
    }
  };

  const handleResendAadhaarOtp = async () => {
    if (aadhaarCooldown > 0) return;
    setAadhaarOtpError(null);
    try {
      const res = await api.post('/kyc/aadhaar/resend-otp');
      if (res.data?.success) {
        setAadhaarCooldown(res.data.data?.resend_cooldown_seconds || 30);
        setAadhaarExpiry(res.data.data?.expires_in_seconds || 300);
        if (res.data.data?.masked_email) setMaskedEmail(res.data.data.masked_email);
        setFeedback({
          type: 'success',
          text: res.data.message || 'New UIDAI verification OTP sent to your registered mobile and email.'
        });
      }
    } catch (err) {
      setAadhaarOtpError(err.response?.data?.message || 'Failed to resend Aadhaar OTP.');
    }
  };

  // ============================================================
  // STEP 3: SUBMIT PROFILE & NOMINEE DETAILS
  // ============================================================
  const handleSubmitDetails = async (e) => {
    e?.preventDefault();
    const errors = {};

    if (!parentName.trim()) {
      errors.parentName = `${parentRelation}'s Name is required.`;
    }
    if (!maritalStatus) {
      errors.maritalStatus = 'Marital status is required.';
    }
    if (!occupationType) {
      errors.occupationType = 'Occupation type is required.';
    }
    if (!annualIncome) {
      errors.annualIncome = 'Annual income range is required.';
    }

    if (nomineeRelation && nomineeRelation !== 'None') {
      if (!nomineeName.trim()) {
        errors.nomineeName = "Nominee's Name is required.";
      }
      if (!nomineeDob) {
        errors.nomineeDob = "Nominee's Date of Birth is required.";
      }
    }

    if (!isTaxResidentIndia || isPep || !otpEkycDeclaration) {
      errors.declarations = 'Please confirm all regulatory declarations to proceed.';
    }

    if (Object.keys(errors).length > 0) {
      setDetailsErrors(errors);
      return;
    }

    setDetailsErrors({});
    setIsSubmittingDetails(true);
    setFeedback(null);

    try {
      const res = await api.post('/kyc/details', {
        parentRelation,
        parentName: parentName.trim(),
        maritalStatus,
        occupationType,
        annualIncome,
        nomineeRelation,
        nomineeName: nomineeName.trim(),
        nomineeDob: nomineeDob || null,
        hasDisability,
        isTaxResidentIndia,
        isPep,
        otpEkycDeclaration
      });

      if (res.data?.success) {
        setFeedback({
          type: 'success',
          text: res.data.message || 'KYC Details submitted successfully! Your wallet is ready.'
        });
        await fetchKycStatus();
        setCurrentStep(4); // Proceed to Step 4: Limit Upgrade / Ready Screen
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit profile details. Please try again.';
      setDetailsErrors({ submit: msg });
    } finally {
      setIsSubmittingDetails(false);
    }
  };

  // ============================================================
  // STEP 4: UPGRADE WALLET LIMIT
  // ============================================================
  const handleUpgradeLimit = async (tier) => {
    setIsUpgradingLimit(true);
    setFeedback(null);
    try {
      const res = await api.post('/kyc/wallet/upgrade-limit', { tier });
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          text: res.data.message || 'Wallet limit updated successfully!'
        });
        await fetchKycStatus();
        setCurrentStep(5); // Proceed to Step 5: Active Wallet Dashboard
      }
    } catch (err) {
      console.error('Upgrade limit error:', err);
    } finally {
      setIsUpgradingLimit(false);
    }
  };

  // ============================================================
  // RESET KYC FOR DEMO TESTING
  // ============================================================
  const handleResetKyc = async () => {
    if (!window.confirm('Reset KYC to unverified state to test the complete PhonePe flow again?')) return;
    try {
      await api.post('/kyc/reset-demo');
      setPanNumber('');
      setDateOfBirth('');
      setAadhaarNumber('');
      setPanOtp('');
      setAadhaarOtp('');
      setIsPanOtpActive(false);
      setIsAadhaarOtpActive(false);
      setParentName('');
      setNomineeName('');
      setNomineeDob('');
      setFeedback({ type: 'success', text: 'KYC reset to initial state. You can now test the complete flow.' });
      setCurrentStep(1);
      await fetchKycStatus();
    } catch (_) {}
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#A9BDD7' }}>
        <RefreshCw size={30} className="animate-spin" style={{ margin: '0 auto 14px auto', color: '#00D5FF' }} />
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>Loading PhonePe-Style Wallet KYC...</div>
        <div style={{ fontSize: '12px', color: '#6B87A8', marginTop: '4px' }}>Connecting to verification engine with Nodemailer OTP</div>
      </div>
    );
  }

  const isPanVerified = kycData?.kyc?.pan_verification_status === 'Verified';
  const isAadhaarVerified = kycData?.kyc?.aadhaar_verification_status === 'Verified';
  const verifiedPanNumber = kycData?.kyc?.pan_number || panNumber || 'GSSPP4232F';
  const verifiedPanName = kycData?.kyc?.pan_name || fullName || 'GOPAL PARMAR';

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '10px 0 50px 0' }}>
      {/* Top App Header with Back navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0 20px 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/app')}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer'
            }}
            title="Back to Customer Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px' }}>
              ApnaPay Wallet KYC
            </h1>
            <p style={{ fontSize: '12px', color: '#8BA0BD', margin: '2px 0 0 0' }}>
              PhonePe-Style Instant E-KYC Verification
            </p>
          </div>
        </div>

        {/* Reset button for demo testing */}
        <button
          onClick={handleResetKyc}
          className="auth-button secondary"
          style={{ width: 'auto', padding: '0 12px', height: '32px', fontSize: '11px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          title="Reset flow to step 1 for testing"
        >
          <RotateCcw size={12} />
          <span>Reset Demo</span>
        </button>
      </div>

      {/* 3-Milestone Stepper (PAN -> Aadhaar -> Details) as seen in PhonePe Video */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          padding: '0 20px',
          marginBottom: '28px'
        }}
      >
        {/* Background Connecting Line */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '45px',
            right: '45px',
            height: '2px',
            background: 'rgba(255, 255, 255, 0.12)',
            zIndex: 1
          }}
        />
        {/* Active Fill Line */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '45px',
            width:
              currentStep >= 5
                ? 'calc(100% - 90px)'
                : currentStep >= 3
                ? 'calc(100% - 90px)'
                : currentStep === 2
                ? 'calc(50% - 45px)'
                : '0%',
            height: '2px',
            background: 'linear-gradient(90deg, #10B981, #00D5FF)',
            zIndex: 2,
            transition: 'width 0.4s ease'
          }}
        />

        {/* Milestone 1: PAN */}
        <div style={{ zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '800',
              background: isPanVerified ? '#10B981' : currentStep === 1 ? '#00D5FF' : '#1A293E',
              color: isPanVerified || currentStep === 1 ? '#050D1B' : '#6B87A8',
              boxShadow: currentStep === 1 ? '0 0 14px rgba(0, 213, 255, 0.4)' : isPanVerified ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none'
            }}
          >
            {isPanVerified ? <Check size={16} strokeWidth={3} /> : '1'}
          </div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: currentStep === 1 ? '#00D5FF' : isPanVerified ? '#10B981' : '#6B87A8' }}>
            PAN
          </span>
        </div>

        {/* Milestone 2: Aadhaar */}
        <div style={{ zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '800',
              background: isAadhaarVerified ? '#10B981' : currentStep === 2 ? '#00D5FF' : '#1A293E',
              color: isAadhaarVerified || currentStep === 2 ? '#050D1B' : '#6B87A8',
              boxShadow: currentStep === 2 ? '0 0 14px rgba(0, 213, 255, 0.4)' : isAadhaarVerified ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none'
            }}
          >
            {isAadhaarVerified ? <Check size={16} strokeWidth={3} /> : '2'}
          </div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: currentStep === 2 ? '#00D5FF' : isAadhaarVerified ? '#10B981' : '#6B87A8' }}>
            Aadhaar
          </span>
        </div>

        {/* Milestone 3: Details */}
        <div style={{ zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '800',
              background: currentStep >= 4 ? '#10B981' : currentStep === 3 ? '#00D5FF' : '#1A293E',
              color: currentStep >= 4 || currentStep === 3 ? '#050D1B' : '#6B87A8',
              boxShadow: currentStep === 3 ? '0 0 14px rgba(0, 213, 255, 0.4)' : currentStep >= 4 ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none'
            }}
          >
            {currentStep >= 4 ? <Check size={16} strokeWidth={3} /> : '3'}
          </div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: currentStep === 3 ? '#00D5FF' : currentStep >= 4 ? '#10B981' : '#6B87A8' }}>
            Details
          </span>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          style={{
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
            border: `1px solid ${feedback.type === 'success' ? '#10B981' : '#EF4444'}`,
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            color: feedback.type === 'success' ? '#34D399' : '#FCA5A5'
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 1: PAN CARD DETAILS & OTP VERIFICATION */}
      {/* ============================================================ */}
      {currentStep === 1 && !isPanOtpActive && (
        <div className="dashboard-card" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                Enter PAN Card Details
              </h2>
              <p style={{ fontSize: '12px', color: '#8BA0BD', margin: '3px 0 0 0' }}>
                As mandated by RBI guidelines for wallet e-KYC
              </p>
            </div>
            <button
              onClick={handleFillDemoPan}
              className="quick-chip"
              style={{
                background: 'rgba(0, 213, 255, 0.12)',
                border: '1px solid rgba(0, 213, 255, 0.35)',
                color: '#00D5FF',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Fill Demo PAN
            </button>
          </div>

          <form onSubmit={handleSubmitPan}>
            {/* PAN Card Number */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#CFDFEE', marginBottom: '6px' }}>
                PAN Card Number
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  className="auth-input"
                  style={{
                    letterSpacing: '2px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    borderColor: panErrors.panNumber ? '#EF4444' : 'rgba(255, 255, 255, 0.14)'
                  }}
                />
              </div>
              {panErrors.panNumber && (
                <div style={{ color: '#EF4444', fontSize: '11px', marginTop: '4px' }}>{panErrors.panNumber}</div>
              )}
            </div>

            {/* Full Name as per PAN */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#CFDFEE', marginBottom: '6px' }}>
                Full Name (as per PAN)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="auth-input"
                style={{ borderColor: panErrors.fullName ? '#EF4444' : 'rgba(255, 255, 255, 0.14)' }}
              />
              {panErrors.fullName && (
                <div style={{ color: '#EF4444', fontSize: '11px', marginTop: '4px' }}>{panErrors.fullName}</div>
              )}
            </div>

            {/* Date of Birth */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#CFDFEE', marginBottom: '6px' }}>
                Date of Birth (as per PAN)
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="auth-input"
                style={{ borderColor: panErrors.dateOfBirth ? '#EF4444' : 'rgba(255, 255, 255, 0.14)' }}
              />
              {panErrors.dateOfBirth && (
                <div style={{ color: '#EF4444', fontSize: '11px', marginTop: '4px' }}>{panErrors.dateOfBirth}</div>
              )}
            </div>

            {/* Consent Notice */}
            <div
              style={{
                fontSize: '11px',
                color: '#6B87A8',
                lineHeight: '1.5',
                padding: '10px 12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                marginBottom: '20px'
              }}
            >
              By proceeding further, you allow ApnaPay to verify your PAN details with NSDL / Income Tax Department and download your KYC records.
            </div>

            {panErrors.submit && (
              <div style={{ color: '#EF4444', fontSize: '12px', marginBottom: '14px', textAlign: 'center' }}>
                {panErrors.submit}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingPan}
              className="auth-button primary"
              style={{
                width: '100%',
                height: '46px',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isSubmittingPan ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Verifying PAN with NSDL...</span>
                </>
              ) : (
                <>
                  <span>Verify PAN Details</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* STEP 1 OTP SUB-STEP */}
      {currentStep === 1 && isPanOtpActive && (
        <div className="dashboard-card" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(0, 213, 255, 0.15)',
                color: '#00D5FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}
            >
              <Smartphone size={24} />
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Enter PAN Verification OTP
            </h2>
            <p style={{ fontSize: '12px', color: '#8BA0BD', margin: '4px 0 0 0' }}>
              OTP dispatched to registered mobile ({maskedPhone}) and email ({maskedEmail})
            </p>
          </div>

          <form onSubmit={handleVerifyPanOtp}>
            <div style={{ marginBottom: '18px' }}>
              <input
                type="text"
                maxLength={6}
                value={panOtp}
                onChange={(e) => setPanOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="auth-input"
                style={{
                  textAlign: 'center',
                  fontSize: '22px',
                  letterSpacing: '8px',
                  fontWeight: '800',
                  borderColor: panOtpError ? '#EF4444' : 'rgba(0, 213, 255, 0.4)'
                }}
                autoFocus
              />
              {panOtpError && (
                <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', textAlign: 'center' }}>
                  {panOtpError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', color: '#8BA0BD' }}>
                Expires in: <strong style={{ color: '#00D5FF' }}>{formatTimer(panExpiry)}</strong>
              </span>
              <button
                type="button"
                onClick={handleResendPanOtp}
                disabled={panCooldown > 0}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: panCooldown > 0 ? '#5A7394' : '#00D5FF',
                  cursor: panCooldown > 0 ? 'default' : 'pointer'
                }}
              >
                {panCooldown > 0 ? `Resend OTP in ${panCooldown}s` : 'Resend OTP to Email & Phone'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isVerifyingPanOtp || panOtp.length !== 6}
              className="auth-button primary"
              style={{
                width: '100%',
                height: '46px',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isVerifyingPanOtp ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify OTP & Continue</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsPanOtpActive(false)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: '#8BA0BD',
                fontSize: '12px',
                marginTop: '12px',
                cursor: 'pointer'
              }}
            >
              Edit PAN Details
            </button>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 2: AADHAAR CARD DETAILS & OTP VERIFICATION */}
      {/* ============================================================ */}
      {currentStep === 2 && !isAadhaarOtpActive && (
        <div className="dashboard-card" style={{ padding: '24px', borderRadius: '16px' }}>
          {/* Green Verified PAN Banner as seen in PhonePe Video */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px'
            }}
          >
            <div style={{ fontSize: '11px', color: '#A9BDD7', marginBottom: '3px' }}>
              Enter Aadhaar with the same name as on your PAN
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: '800', fontSize: '13px' }}>
              <CheckCircle2 size={16} />
              <span>{verifiedPanNumber} : {verifiedPanName}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>Choose type</span>
            <button
              onClick={handleFillDemoAadhaar}
              className="quick-chip"
              style={{
                background: 'rgba(0, 213, 255, 0.12)',
                border: '1px solid rgba(0, 213, 255, 0.35)',
                color: '#00D5FF',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Fill Demo Aadhaar
            </button>
          </div>

          {/* Radio Options: Aadhaar vs Aadhaar VID */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '18px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#CFDFEE', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="idType"
                checked={idType === 'aadhaar'}
                onChange={() => setIdType('aadhaar')}
              />
              <span>Aadhaar</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#CFDFEE', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="idType"
                checked={idType === 'vid'}
                onChange={() => setIdType('vid')}
              />
              <span>Aadhaar VID</span>
            </label>
          </div>

          <form onSubmit={handleSubmitAadhaar}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#CFDFEE', marginBottom: '6px' }}>
                {idType === 'aadhaar' ? 'Enter 12 digit Aadhaar number' : 'Enter 16 digit Aadhaar Virtual ID'}
              </label>
              <input
                type="text"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(formatAadhaarInput(e.target.value))}
                placeholder={idType === 'aadhaar' ? '0000 0000 0000' : '0000 0000 0000 0000'}
                className="auth-input"
                style={{
                  letterSpacing: '2px',
                  fontWeight: '700',
                  borderColor: aadhaarError ? '#EF4444' : 'rgba(255, 255, 255, 0.14)'
                }}
              />
              {aadhaarError && (
                <div style={{ color: '#EF4444', fontSize: '11px', marginTop: '4px' }}>{aadhaarError}</div>
              )}
            </div>

            {/* Consent Checkbox */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '22px' }}>
              <input
                type="checkbox"
                id="aadhaarConsent"
                checked={aadhaarConsent}
                onChange={(e) => setAadhaarConsent(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer' }}
              />
              <label htmlFor="aadhaarConsent" style={{ fontSize: '12px', color: '#A9BDD7', lineHeight: '1.4', cursor: 'pointer' }}>
                I agree to the Aadhaar consent and authorize ApnaPay to authenticate my identity via UIDAI e-KYC service.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmittingAadhaar}
              className="auth-button primary"
              style={{
                width: '100%',
                height: '46px',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isSubmittingAadhaar ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Connecting to UIDAI Gateway...</span>
                </>
              ) : (
                <>
                  <span>Continue to Verify</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* STEP 2 OTP SUB-STEP */}
      {currentStep === 2 && isAadhaarOtpActive && (
        <div className="dashboard-card" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}
            >
              <Key size={24} />
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Enter UIDAI Aadhaar OTP
            </h2>
            <p style={{ fontSize: '12px', color: '#8BA0BD', margin: '4px 0 0 0' }}>
              OTP sent to your Aadhaar-registered mobile ({maskedPhone}) and email ({maskedEmail})
            </p>
          </div>

          <form onSubmit={handleVerifyAadhaarOtp}>
            <div style={{ marginBottom: '18px' }}>
              <input
                type="text"
                maxLength={6}
                value={aadhaarOtp}
                onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="auth-input"
                style={{
                  textAlign: 'center',
                  fontSize: '22px',
                  letterSpacing: '8px',
                  fontWeight: '800',
                  borderColor: aadhaarOtpError ? '#EF4444' : 'rgba(16, 185, 129, 0.4)'
                }}
                autoFocus
              />
              {aadhaarOtpError && (
                <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', textAlign: 'center' }}>
                  {aadhaarOtpError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', color: '#8BA0BD' }}>
                Expires in: <strong style={{ color: '#10B981' }}>{formatTimer(aadhaarExpiry)}</strong>
              </span>
              <button
                type="button"
                onClick={handleResendAadhaarOtp}
                disabled={aadhaarCooldown > 0}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: aadhaarCooldown > 0 ? '#5A7394' : '#00D5FF',
                  cursor: aadhaarCooldown > 0 ? 'default' : 'pointer'
                }}
              >
                {aadhaarCooldown > 0 ? `Resend OTP in ${aadhaarCooldown}s` : 'Resend Aadhaar OTP'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isVerifyingAadhaarOtp || aadhaarOtp.length !== 6}
              className="auth-button primary"
              style={{
                width: '100%',
                height: '46px',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isVerifyingAadhaarOtp ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Verifying UIDAI Authentication...</span>
                </>
              ) : (
                <>
                  <span>Verify & Proceed to Details</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsAadhaarOtpActive(false)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: '#8BA0BD',
                fontSize: '12px',
                marginTop: '12px',
                cursor: 'pointer'
              }}
            >
              Edit Aadhaar Number
            </button>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 3: DETAILS (PhonePe Wallet Profile Details) */}
      {/* ============================================================ */}
      {currentStep === 3 && (
        <div className="dashboard-card" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                Personal & Regulatory Details
              </h2>
              <p style={{ fontSize: '12px', color: '#8BA0BD', margin: '3px 0 0 0' }}>
                Complete profile information to activate wallet limits
              </p>
            </div>
            <button
              onClick={handleFillDemoDetails}
              className="quick-chip"
              style={{
                background: 'rgba(0, 213, 255, 0.12)',
                border: '1px solid rgba(0, 213, 255, 0.35)',
                color: '#00D5FF',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Fill Demo Details
            </button>
          </div>

          <form onSubmit={handleSubmitDetails}>
            {/* Parent Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#CFDFEE', marginBottom: '6px' }}>
                  Parent Details
                </label>
                <select
                  value={parentRelation}
                  onChange={(e) => setParentRelation(e.target.value)}
                  className="auth-input"
                  style={{ height: '42px', cursor: 'pointer' }}
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Spouse">Spouse</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#CFDFEE', marginBottom: '6px' }}>
                  {parentRelation}'s Name
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder={`Enter ${parentRelation.toLowerCase()}'s full name`}
                  className="auth-input"
                  style={{ height: '42px', borderColor: detailsErrors.parentName ? '#EF4444' : 'rgba(255, 255, 255, 0.14)' }}
                />
                {detailsErrors.parentName && (
                  <div style={{ color: '#EF4444', fontSize: '11px', marginTop: '4px' }}>{detailsErrors.parentName}</div>
                )}
              </div>
            </div>

            {/* Marital Status */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#CFDFEE', marginBottom: '6px' }}>
                Your Marital Status
              </label>
              <select
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
                className="auth-input"
                style={{ height: '42px', cursor: 'pointer' }}
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Occupation Type */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#CFDFEE', marginBottom: '6px' }}>
                Your Occupation Type
              </label>
              <select
                value={occupationType}
                onChange={(e) => setOccupationType(e.target.value)}
                className="auth-input"
                style={{ height: '42px', cursor: 'pointer' }}
              >
                <option value="Salaried">Salaried</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Business">Business</option>
                <option value="Student">Student</option>
                <option value="Retired">Retired</option>
                <option value="Homemaker">Homemaker</option>
              </select>
            </div>

            {/* Annual Income */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#CFDFEE', marginBottom: '6px' }}>
                Your Annual Income
              </label>
              <select
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
                className="auth-input"
                style={{ height: '42px', cursor: 'pointer' }}
              >
                <option value="0 to 1 Lakh">0 to 1 Lakh</option>
                <option value="1 to 5 Lakhs">1 to 5 Lakhs</option>
                <option value="5 to 10 Lakhs">5 to 10 Lakhs</option>
                <option value="Above 10 Lakhs">Above 10 Lakhs</option>
              </select>
            </div>

            {/* Nominee (Optional) */}
            <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#CFDFEE' }}>
                  Nominee (optional)
                </label>
                <span style={{ fontSize: '11px', color: '#6B87A8' }}>Recommended for wallet security</span>
              </div>
              <select
                value={nomineeRelation}
                onChange={(e) => setNomineeRelation(e.target.value)}
                className="auth-input"
                style={{ height: '42px', marginBottom: nomineeRelation && nomineeRelation !== 'None' ? '12px' : '0', cursor: 'pointer' }}
              >
                <option value="">Select Nominee</option>
                <option value="Sibling">Sibling</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Spouse">Spouse</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="None">None</option>
              </select>

              {nomineeRelation && nomineeRelation !== 'None' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8BA0BD', marginBottom: '4px' }}>
                      {nomineeRelation}'s Name
                    </label>
                    <input
                      type="text"
                      value={nomineeName}
                      onChange={(e) => setNomineeName(e.target.value)}
                      placeholder="Full name"
                      className="auth-input"
                      style={{ height: '40px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8BA0BD', marginBottom: '4px' }}>
                      {nomineeRelation}'s Date of Birth
                    </label>
                    <input
                      type="date"
                      value={nomineeDob}
                      onChange={(e) => setNomineeDob(e.target.value)}
                      className="auth-input"
                      style={{ height: '40px' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Disability Question as seen in PhonePe Video */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#CFDFEE', marginBottom: '8px' }}>
                Are you a person with physical disability?
              </label>
              <div style={{ display: 'flex', gap: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#CFDFEE', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="disability"
                    checked={hasDisability === 'Yes'}
                    onChange={() => setHasDisability('Yes')}
                  />
                  <span>Yes</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#CFDFEE', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="disability"
                    checked={hasDisability === 'No'}
                    onChange={() => setHasDisability('No')}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {/* 3 Declarations (Checkboxes) as seen in PhonePe Video */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '11px', color: '#A9BDD7', lineHeight: '1.4', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isTaxResidentIndia}
                  onChange={(e) => setIsTaxResidentIndia(e.target.checked)}
                  style={{ marginTop: '2px' }}
                />
                <span>I am a tax resident and national of India and not a resident or national of any other country</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '11px', color: '#A9BDD7', lineHeight: '1.4', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!isPep}
                  onChange={(e) => setIsPep(!e.target.checked)}
                  style={{ marginTop: '2px' }}
                />
                <span>I am neither a politically exposed person nor related to a politically exposed person</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '11px', color: '#A9BDD7', lineHeight: '1.4', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={otpEkycDeclaration}
                  onChange={(e) => setOtpEkycDeclaration(e.target.checked)}
                  style={{ marginTop: '2px' }}
                />
                <span>I confirm that no other account has been opened using OTP based eKYC authentication</span>
              </label>
            </div>

            {detailsErrors.declarations && (
              <div style={{ color: '#EF4444', fontSize: '11px', marginBottom: '14px' }}>{detailsErrors.declarations}</div>
            )}
            {detailsErrors.submit && (
              <div style={{ color: '#EF4444', fontSize: '12px', marginBottom: '14px', textAlign: 'center' }}>
                {detailsErrors.submit}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingDetails}
              className="auth-button primary"
              style={{
                width: '100%',
                height: '46px',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isSubmittingDetails ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Submitting Details...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Proceed</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 4: WALLET LIMITS UPGRADE (PhonePe Frame 13 Comparison) */}
      {/* ============================================================ */}
      {currentStep === 4 && (
        <div className="dashboard-card" style={{ padding: '28px 24px', borderRadius: '16px', textAlign: 'center' }}>
          {/* Header Graphic */}
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(0, 213, 255, 0.2), rgba(16, 185, 129, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#00D5FF'
            }}
          >
            <Wallet size={32} />
          </div>

          <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 6px 0' }}>
            Your wallet with ₹1 lakh limit is ready to use!
          </h2>
          <p style={{ fontSize: '12px', color: '#8BA0BD', margin: '0 0 24px 0' }}>
            Identity verified via PAN & Aadhaar eKYC. Choose your preferred wallet tier below.
          </p>

          {/* Comparison Card (Current vs Higher Limits) */}
          <div
            style={{
              background: '#071529',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              overflow: 'hidden',
              marginBottom: '26px',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                padding: '12px 18px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF' }}>
                Unlock your wallet's full power
              </span>
              <Zap size={14} color="#FBBF24" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', padding: '10px 16px', fontSize: '11px', color: '#6B87A8', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span>FEATURE</span>
              <span style={{ textAlign: 'center' }}>Current</span>
              <span style={{ textAlign: 'center', color: '#00D5FF', fontWeight: '800' }}>HIGHER LIMITS</span>
            </div>

            <div style={{ padding: '8px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', padding: '10px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '12px' }}>
                <span style={{ color: '#CFDFEE' }}>Balance limit</span>
                <span style={{ textAlign: 'center', color: '#8BA0BD' }}>₹1 lakh</span>
                <span style={{ textAlign: 'center', color: '#00D5FF', fontWeight: '800' }}>₹2 lakh</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', padding: '10px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '12px' }}>
                <span style={{ color: '#CFDFEE' }}>Yearly top-up limit</span>
                <span style={{ textAlign: 'center', color: '#8BA0BD' }}>₹2 lakh</span>
                <span style={{ textAlign: 'center', color: '#00D5FF', fontWeight: '800' }}>No limit</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', padding: '10px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '12px' }}>
                <span style={{ color: '#CFDFEE' }}>Validity</span>
                <span style={{ textAlign: 'center', color: '#8BA0BD' }}>1 year</span>
                <span style={{ textAlign: 'center', color: '#10B981', fontWeight: '800' }}>Lifetime</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', padding: '10px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '12px' }}>
                <span style={{ color: '#CFDFEE' }}>Top-up via credit card</span>
                <span style={{ textAlign: 'center', color: '#10B981' }}>✓</span>
                <span style={{ textAlign: 'center', color: '#10B981' }}>✓</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', padding: '10px 0', fontSize: '12px' }}>
                <span style={{ color: '#CFDFEE' }}>Withdraw & pay via UPI</span>
                <span style={{ textAlign: 'center', color: '#10B981' }}>✓</span>
                <span style={{ textAlign: 'center', color: '#10B981' }}>✓</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => handleUpgradeLimit('HIGHER_LIMITS')}
              disabled={isUpgradingLimit}
              className="auth-button primary"
              style={{
                width: '100%',
                height: '48px',
                fontSize: '14px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #00D5FF 0%, #0077FF 100%)',
                color: '#050D1B'
              }}
            >
              {isUpgradingLimit ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                'Upgrade to Higher Limits (₹2 Lakh)'
              )}
            </button>

            <button
              onClick={() => handleUpgradeLimit('STANDARD')}
              disabled={isUpgradingLimit}
              style={{
                background: 'none',
                border: 'none',
                color: '#8BA0BD',
                fontSize: '13px',
                padding: '8px',
                cursor: 'pointer'
              }}
            >
              Continue with ₹1 Lakh Limit
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 5: ACTIVATED PHONEPE-STYLE APNAPAY WALLET SCREEN */}
      {/* ============================================================ */}
      {currentStep === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Main Wallet Balance Card (PhonePe Video Frame 15) */}
          <div
            style={{
              background: 'linear-gradient(135deg, #071F42 0%, #040D1D 100%)',
              border: '1px solid rgba(0, 213, 255, 0.25)',
              borderRadius: '18px',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#A9BDD7', fontWeight: '600' }}>Wallet balance</span>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: '800'
                }}
              >
                100% KYC VERIFIED
              </span>
            </div>

            <div style={{ fontSize: '34px', fontWeight: '900', color: '#FFFFFF', marginBottom: '18px', letterSpacing: '-0.5px' }}>
              ₹{Number(walletData?.available_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>

            {/* Limits Progress Bar */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#8BA0BD', marginBottom: '8px' }}>
                <span>Added this year: <strong>₹0</strong></span>
                <span>
                  Yearly limit:{' '}
                  <strong style={{ color: '#00D5FF' }}>
                    {kycData?.kyc?.wallet_tier === 'HIGHER_LIMITS' ? 'Unlimited' : '₹2,00,000'}
                  </strong>
                </span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: '4%', height: '100%', background: '#00D5FF' }} />
              </div>
            </div>
          </div>

          {/* Quick Actions (3 Circular Buttons: Transfer, Add Money, Withdraw) */}
          <div
            className="dashboard-card"
            style={{
              padding: '18px 20px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around'
            }}
          >
            {/* Transfer */}
            <div
              onClick={() => navigate('/app/money-transfer')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}
              >
                <Send size={20} />
              </div>
              <span style={{ fontSize: '12px', color: '#CFDFEE', fontWeight: '600' }}>Transfer</span>
            </div>

            {/* Add Money (Highlighted Primary) */}
            <div
              onClick={() => navigate('/app/wallet-ledger')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00D5FF 0%, #0077FF 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#050D1B',
                  boxShadow: '0 4px 14px rgba(0, 213, 255, 0.35)'
                }}
              >
                <Plus size={24} strokeWidth={3} />
              </div>
              <span style={{ fontSize: '12px', color: '#00D5FF', fontWeight: '700' }}>Add money</span>
            </div>

            {/* Withdraw */}
            <div
              onClick={() => navigate('/app/bank-accounts')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}
              >
                <Download size={20} />
              </div>
              <span style={{ fontSize: '12px', color: '#CFDFEE', fontWeight: '600' }}>Withdraw</span>
            </div>
          </div>

          {/* Feature List (Set auto top-up, QR, Settings, Past payments) */}
          <div className="dashboard-card" style={{ padding: '8px 0', borderRadius: '16px' }}>
            <div
              onClick={() => navigate('/app/wallet-ledger')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <TrendingUp size={18} color="#00D5FF" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>Set auto top-up</div>
                  <div style={{ fontSize: '11px', color: '#6B87A8' }}>Auto top-up when balance runs low</div>
                </div>
              </div>
              <ChevronRight size={16} color="#6B87A8" />
            </div>

            <div
              onClick={() => navigate('/app/qr-payments')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <QrCode size={18} color="#10B981" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>View QR code</div>
                  <div style={{ fontSize: '11px', color: '#6B87A8' }}>Receive payments instantly via Bharat QR</div>
                </div>
              </div>
              <ChevronRight size={16} color="#6B87A8" />
            </div>

            <div
              onClick={() => navigate('/app/profile-settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Settings size={18} color="#8BA0BD" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>Wallet settings</div>
                  <div style={{ fontSize: '11px', color: '#6B87A8' }}>Payment PIN, auto-debit & preferences</div>
                </div>
              </div>
              <ChevronRight size={16} color="#6B87A8" />
            </div>

            <div
              onClick={() => navigate('/app/transactions')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <History size={18} color="#A78BFA" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>View past payments</div>
                  <div style={{ fontSize: '11px', color: '#6B87A8' }}>Audited double-entry ledger statements</div>
                </div>
              </div>
              <ChevronRight size={16} color="#6B87A8" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
