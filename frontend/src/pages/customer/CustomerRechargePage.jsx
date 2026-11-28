import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import walletService from '../../services/walletService';
import bankAccountService from '../../services/bankAccountService';
import MpinModal from '../../components/MpinModal';
import {
  SmartphoneIcon,
  SearchIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  ZapIcon,
  HistoryIcon,
  ShieldCheckIcon,
  WalletIcon,
  LandmarkIcon,
  EyeIcon,
  EyeOffIcon
} from '../../components/Icons';

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(val) || 0);

const CustomerRechargePage = () => {
  const navigate = useNavigate();

  // Step state: 'number' | 'plans' | 'confirm' | 'success'
  const [step, setStep] = useState('number');

  // Backend data
  const [operators, setOperators] = useState([]);
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [walletBalance, setWalletBalance] = useState('₹0.00');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);

  // Selected recharge state
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [planSearch, setPlanSearch] = useState('');
  const [planCategory, setPlanCategory] = useState('all'); // 'all' | 'popular' | 'unlimited' | 'true5g' | 'data' | 'yearly' | 'ott' | 'topup'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [customAmount, setCustomAmount] = useState('');

  // Payment Method & PIN step state
  const [paymentSource, setPaymentSource] = useState('wallet'); // 'wallet' | 'bank:<id>'
  const [rechargePin, setRechargePin] = useState('');
  const [showRechargePin, setShowRechargePin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [showSetMpinModal, setShowSetMpinModal] = useState(false);

  // Submission & feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [receiptData, setReceiptData] = useState(null);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [opRes, histRes, plansRes, walRes, bankRes] = await Promise.allSettled([
        api.get('/recharge/operators'),
        api.get('/recharge/history'),
        api.get('/recharge/plans'),
        walletService.getBalance(),
        bankAccountService.getLinkedAccounts()
      ]);

      if (walRes.status === 'fulfilled') {
        setWalletBalance(walRes.value?.data?.formattedBalance || formatINR(walRes.value?.data?.available_balance || 0));
      }

      if (bankRes.status === 'fulfilled') {
        const banks = bankRes.value?.data || [];
        setBankAccounts(banks);
        if (banks.length > 0 && paymentSource === 'wallet') {
          // Keep wallet default unless user picks bank
        }
      }

      if (opRes.status === 'fulfilled') {
        const ops = (opRes.value?.data?.data || opRes.value?.data?.operators || []).filter(
          (o) => !o.service_type || o.service_type === 'prepaid' || o.service_type === 'mobile' || o.service_type === 'postpaid'
        );
        const allOps = ops.length > 0 ? ops : (opRes.value?.data?.data || opRes.value?.data?.operators || []);
        setOperators(allOps);
        if (allOps.length > 0 && !selectedOperatorId) {
          setSelectedOperatorId(String(allOps[0].id));
        }
      }

      if (plansRes.status === 'fulfilled') {
        setPlans(plansRes.value?.data?.data || plansRes.value?.data?.plans || []);
      }

      if (histRes.status === 'fulfilled') {
        setHistory(histRes.value?.data?.data || histRes.value?.data?.recharges || []);
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Unable to load recharge data.');
    } finally {
      setLoading(false);
    }
  }, [selectedOperatorId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleNumberContinue = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setPlansLoading(true);
    setStep('plans');
    setTimeout(() => setPlansLoading(false), 300);
  };

  const handleSelectRecent = (item) => {
    const num = String(item.mobile_number || '').replace(/\D/g, '').slice(-10);
    if (num) setMobileNumber(num);
    if (item.operator_id) setSelectedOperatorId(String(item.operator_id));
    setErrorMsg('');
    setStep('plans');
  };

  const selectedOperator = operators.find((o) => String(o.id) === String(selectedOperatorId)) || operators[0] || null;

  const operatorPlans = plans.filter((p) => !selectedOperatorId || String(p.operator_id) === String(selectedOperatorId));

  const filteredPlans = operatorPlans.filter((p) => {
    const q = planSearch.trim().toLowerCase();
    const amt = parseFloat(p.amount) || 0;
    const valDays = Number(p.validity_days) || 0;
    const amtStr = String(amt);
    const nameStr = String(p.plan_name || '').toLowerCase();
    const dataStr = String(p.benefits?.data || '').toLowerCase();
    const voiceStr = String(p.benefits?.voice || '').toLowerCase();
    const matchesSearch = !q || amtStr.includes(q) || nameStr.includes(q) || dataStr.includes(q);
    if (!matchesSearch) return false;

    if (planCategory === 'popular') return [199, 239, 299, 349, 399, 629, 799, 859, 899].includes(amt);
    if (planCategory === 'unlimited') return voiceStr.includes('unlimited') || nameStr.includes('unlimited');
    if (planCategory === 'true5g') return dataStr.includes('5g') || nameStr.includes('5g');
    if (planCategory === 'data') return voiceStr.includes('no voice') || nameStr.includes('data');
    if (planCategory === 'yearly') return valDays >= 200 || nameStr.includes('annual');
    if (planCategory === 'ott') return nameStr.includes('ott') || nameStr.includes('prime') || nameStr.includes('netflix') || nameStr.includes('entertainment');
    if (planCategory === 'topup') return valDays === 0 || nameStr.includes('top-up') || voiceStr.includes('talktime');
    return true;
  });

  const suggestedPlans = operatorPlans.filter((p) => [19, 349].includes(parseFloat(p.amount))).slice(0, 2);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setCustomAmount(String(parseFloat(plan.amount) || ''));
    setErrorMsg('');
    setStep('confirm');
  };

  const handleProceedCustomAmount = () => {
    const amt = parseFloat(customAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid recharge amount greater than ₹0.');
      return;
    }
    setSelectedPlan(null);
    setErrorMsg('');
    setStep('confirm');
  };

  const handleExecuteRecharge = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (submitting) return;
    setPinError('');

    if (!/^\d{4}$|^\d{6}$/.test(rechargePin)) {
      setPinError('Please enter your 4-digit or 6-digit UPI / Security PIN.');
      return;
    }

    const amt = selectedPlan ? parseFloat(selectedPlan.amount) : parseFloat(customAmount);
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setErrorMsg('Invalid 10-digit mobile number.');
      return;
    }
    if (!amt || amt <= 0) {
      setErrorMsg('Invalid recharge amount.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      // If a linked bank account is selected, verify its UPI PIN via backend first
      if (paymentSource.startsWith('bank:')) {
        const bankId = Number(paymentSource.split(':')[1]);
        const bankObj = bankAccounts.find((b) => b.id === bankId);
        await bankAccountService.checkBalance(bankId, rechargePin, bankObj ? !bankObj.hasUpiPin : false);
      }

      const res = await api.post('/recharge/create', {
        operator_id: Number(selectedOperatorId || selectedOperator?.id || 1),
        plan_id: selectedPlan ? selectedPlan.id : undefined,
        mobile_number: mobileNumber,
        amount: amt,
        payment_source: paymentSource,
        ...(paymentSource === 'wallet' ? { mpin: rechargePin } : {})
      });
      setReceiptData(
        res?.data?.data || {
          mobile_number: mobileNumber,
          operator_name: selectedOperator?.operator_name || 'Prepaid Operator',
          amount: amt,
          status: 'success',
          reference: `RCH-${Date.now().toString().slice(-6)}`
        }
      );
      setRechargePin('');
      setStep('success');
      loadInitialData();
    } catch (err) {
      if (err?.response?.data?.code === 'MPIN_NOT_SET') {
        setShowSetMpinModal(true);
        return;
      }
      const msg = err?.response?.data?.message || 'Recharge authorization failed. Please try again.';
      if (err?.response?.status === 401 || err?.response?.data?.code === 'INVALID_PIN') {
        setPinError(msg);
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {errorMsg && (
        <div className="auth-alert error">
          <AlertCircleIcon size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 1: MOBILE NUMBER ENTRY & RECENT RECHARGES            */}
      {/* ========================================================= */}
      {step === 'number' && (
        <>
          {/* Validity Reminder Card */}
          <div
            className="dashboard-card"
            style={{
              margin: 0,
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(8, 123, 255, 0.16) 0%, rgba(11, 27, 50, 0.96) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF' }}>
                Be reminded before your plan validity expires
              </div>
              <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '2px' }}>
                Instant prepaid, postpaid &amp; data top-up across Jio, Airtel, Vi, Idea, BSNL &amp; MTNL
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#00D5FF',
                background: 'rgba(0, 213, 255, 0.12)',
                border: '1px solid rgba(0, 213, 255, 0.35)',
                padding: '4px 10px',
                borderRadius: '999px'
              }}
            >
              FAST RECHARGE
            </span>
          </div>

          {/* Search by Number Card */}
          <div className="dashboard-card" style={{ margin: 0, padding: '20px' }}>
            <form onSubmit={handleNumberContinue}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#A9BDD7', marginBottom: '8px' }}>
                Search by Number
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div
                  style={{
                    flex: '1 1 240px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    height: '44px',
                    padding: '0 14px',
                    background: '#071426',
                    border: '1px solid #17385D',
                    borderRadius: '10px',
                    boxSizing: 'border-box'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', color: '#00D5FF', flexShrink: 0 }}>
                    <SmartphoneIcon size={17} />
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => {
                      setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Enter 10-digit mobile number"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#FFFFFF',
                      fontSize: '15px',
                      fontWeight: '700',
                      letterSpacing: '0.5px'
                    }}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="auth-button"
                  style={{ width: 'auto', padding: '0 22px', height: '44px', margin: 0, fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Browse Plans</span>
                  <ArrowRightIcon size={15} />
                </button>
              </div>
            </form>
          </div>

          {/* Recent Recharges */}
          <div className="dashboard-card" style={{ margin: 0, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HistoryIcon size={17} style={{ color: '#00A8FF' }} />
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  Recent Recharges
                </h3>
              </div>
              <button
                type="button"
                onClick={loadInitialData}
                style={{ background: 'transparent', border: 'none', color: '#00D5FF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }}
              >
                <RefreshCwIcon size={13} className={loading ? 'spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#A9BDD7', fontSize: '13px' }}>
                Loading recent recharges...
              </div>
            ) : history.length === 0 ? (
              <div style={{ background: '#071426', border: '1px dashed #17385D', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#A9BDD7', fontSize: '12.5px' }}>
                No recent recharges found. Enter any 10-digit mobile number above to view plans.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.slice(0, 6).map((item, idx) => (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => handleSelectRecent(item)}
                    style={{
                      width: '100%',
                      background: '#071426',
                      border: '1px solid #17385D',
                      borderRadius: '11px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00A8FF')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#17385D')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(0, 168, 255, 0.14)', color: '#00D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <SmartphoneIcon size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>
                          {item.operator_name || 'Prepaid'} • {item.mobile_number}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>
                          {formatINR(item.amount)} • {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#00E599', background: 'rgba(0, 229, 153, 0.12)', padding: '3px 9px', borderRadius: '999px' }}>
                      Repeat →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* STEP 2: SELECT A RECHARGE PLAN                            */}
      {/* ========================================================= */}
      {step === 'plans' && (
        <>
          {/* Selected Number & Operator Bar */}
          <div className="dashboard-card" style={{ margin: 0, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setStep('number')}
                  className="back-button"
                  title="Change mobile number"
                  aria-label="Back"
                >
                  <ArrowLeftIcon size={18} />
                </button>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF' }}>
                    +91 {mobileNumber}
                  </div>
                  <div style={{ fontSize: '12px', color: '#00D5FF' }}>
                    {selectedOperator?.operator_name || 'Prepaid Operator'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <select
                  value={selectedOperatorId}
                  onChange={(e) => setSelectedOperatorId(e.target.value)}
                  className="auth-input"
                  style={{ width: 'auto', height: '36px', fontSize: '12.5px', padding: '0 10px' }}
                >
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.operator_name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setStep('number')}
                  style={{ background: 'transparent', border: 'none', color: '#00D5FF', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* Suggested Plans Strip */}
          {suggestedPlans.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              {suggestedPlans.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => handleSelectPlan(sp)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(8, 123, 255, 0.14) 0%, #0B1B32 100%)',
                    border: '1px solid #1E3A5F',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#00D5FF', fontWeight: '700', textTransform: 'uppercase' }}>
                      Suggested Plan
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF', marginTop: '2px' }}>
                      {formatINR(sp.amount)}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>
                      {sp.benefits?.data || 'Data'} • {sp.validity_days} {sp.validity_days === 1 ? 'Day' : 'Days'}
                    </div>
                  </div>
                  <ArrowRightIcon size={16} style={{ color: '#00D5FF', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}

          {/* Search Plan + Category Tabs + Plan Cards */}
          <div className="dashboard-card" style={{ margin: 0, padding: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: '40px',
                padding: '0 12px',
                background: '#071426',
                border: '1px solid #17385D',
                borderRadius: '10px',
                marginBottom: '12px',
                boxSizing: 'border-box'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', color: '#6B87A8', flexShrink: 0 }}>
                <SearchIcon size={16} />
              </span>
              <input
                type="text"
                value={planSearch}
                onChange={(e) => setPlanSearch(e.target.value)}
                placeholder="Search a plan, e.g. 349, 5G, etc."
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  fontSize: '13px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '14px' }}>
              {[
                { id: 'all', label: `All Plans (${operatorPlans.length})` },
                { id: 'popular', label: 'Popular' },
                { id: 'unlimited', label: 'Unlimited 4G+5G' },
                { id: 'true5g', label: 'True 5G Unlimited' },
                { id: 'data', label: 'Data Addon' },
                { id: 'yearly', label: 'Yearly Plans' },
                { id: 'ott', label: 'OTT & Entertainment' },
                { id: 'topup', label: 'Top Up' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPlanCategory(tab.id)}
                  style={{
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    border: planCategory === tab.id ? '1px solid #00D5FF' : '1px solid #17385D',
                    background: planCategory === tab.id ? 'rgba(0, 213, 255, 0.14)' : '#071426',
                    color: planCategory === tab.id ? '#00D5FF' : '#A9BDD7',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {plansLoading ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#A9BDD7', fontSize: '13px' }}>
                Getting plans from operator...
              </div>
            ) : filteredPlans.length === 0 ? (
              <div style={{ background: '#071426', border: '1px dashed #17385D', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#A9BDD7', fontSize: '13px' }}>
                No matching plans found for this filter. You can proceed with a custom amount below.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    style={{
                      background: '#071426',
                      border: '1px solid #17385D',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      transition: 'border-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00A8FF')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#17385D')}
                  >
                    <div style={{ minWidth: 0, flex: '1 1 260px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '20px', fontWeight: '900', color: '#FFFFFF' }}>
                          {formatINR(plan.amount)}
                        </span>
                        <span style={{ fontSize: '12px', color: '#00E599', fontWeight: '700' }}>
                          Validity: {plan.validity_days} Days
                        </span>
                        {plan.benefits?.data && (
                          <span style={{ fontSize: '12px', color: '#00D5FF', fontWeight: '700' }}>
                            Data: {plan.benefits.data}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', marginTop: '4px' }}>
                        {plan.plan_name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>
                        {plan.benefits?.voice || 'Unlimited Calls'} • {plan.benefits?.sms || '100 SMS/day'}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="auth-button"
                      style={{ width: 'auto', padding: '0 16px', height: '36px', fontSize: '12.5px', margin: 0 }}
                    >
                      Select Plan →
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Custom Amount Fallback */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #17385D', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="number"
                min="10"
                step="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Or enter custom amount (₹)"
                className="auth-input"
                style={{ flex: '1 1 180px', height: '38px', fontSize: '13px' }}
              />
              <button
                type="button"
                onClick={handleProceedCustomAmount}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '12.5px', margin: 0 }}
              >
                Proceed with Amount
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* STEP 3: CONFIRM & PAY                                     */}
      {/* ========================================================= */}
      {step === 'confirm' && (
        <div className="dashboard-card" style={{ margin: 0, padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setStep('plans')}
              className="back-button"
              aria-label="Back"
            >
              <ArrowLeftIcon size={18} />
            </button>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                Confirm Mobile Recharge
              </h3>
              <p style={{ fontSize: '12px', color: '#A9BDD7', margin: 0 }}>
                Review operator, number, and plan before paying
              </p>
            </div>
          </div>

          <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#A9BDD7' }}>Mobile Number:</span>
              <span style={{ color: '#FFFFFF', fontWeight: '700' }}>+91 {mobileNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#A9BDD7' }}>Operator:</span>
              <span style={{ color: '#00D5FF', fontWeight: '700' }}>{selectedOperator?.operator_name || 'Prepaid'}</span>
            </div>
            {selectedPlan && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#A9BDD7' }}>Selected Plan:</span>
                <span style={{ color: '#FFFFFF', fontWeight: '600' }}>{selectedPlan.plan_name} ({selectedPlan.validity_days} Days)</span>
              </div>
            )}
            <div style={{ borderTop: '1px solid #17385D', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#A9BDD7', fontWeight: '600' }}>Total Payable:</span>
              <span style={{ color: '#00E599', fontSize: '18px', fontWeight: '900' }}>
                {formatINR(selectedPlan ? selectedPlan.amount : customAmount)}
              </span>
            </div>
          </div>

          {/* Payment Method Selection (Wallet + Linked Bank Accounts) */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#A9BDD7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Select Payment Method
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setPaymentSource('wallet')}
                style={{
                  width: '100%',
                  background: '#071426',
                  border: paymentSource === 'wallet' ? '1.5px solid #00E599' : '1px solid #17385D',
                  borderRadius: '10px',
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <WalletIcon size={18} style={{ color: '#00E599' }} />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#FFFFFF' }}>ApnaPay Wallet</div>
                    <div style={{ fontSize: '11.5px', color: '#A9BDD7' }}>Usable balance: {walletBalance}</div>
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: paymentSource === 'wallet' ? '#00E599' : '#6B87A8' }}>
                  {paymentSource === 'wallet' ? '✓ SELECTED' : 'Select'}
                </span>
              </button>

              {bankAccounts.map((b) => {
                const key = `bank:${b.id}`;
                const last4 = b.accountLast4 || b.maskedAccountNumber?.slice(-4) || 'XXXX';
                const isSel = paymentSource === key;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setPaymentSource(key)}
                    style={{
                      width: '100%',
                      background: '#071426',
                      border: isSel ? '1.5px solid #00A8FF' : '1px solid #17385D',
                      borderRadius: '10px',
                      padding: '11px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <LandmarkIcon size={18} style={{ color: '#00A8FF' }} />
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#FFFFFF' }}>{b.bankName}</div>
                        <div style={{ fontSize: '11.5px', color: '#A9BDD7' }}>A/c •••• {last4} • UPI</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: isSel ? '#00D5FF' : '#6B87A8' }}>
                      {isSel ? '✓ SELECTED' : 'Select'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setStep('plans')}
              className="auth-button secondary"
              style={{ flex: 1, height: '42px', margin: 0, fontSize: '13px' }}
            >
              Change Plan
            </button>
            <button
              type="button"
              onClick={() => {
                setRechargePin('');
                setPinError('');
                setStep('pin');
              }}
              className="auth-button"
              style={{ flex: 2, height: '42px', margin: 0, fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <ZapIcon size={15} />
              <span>Pay {formatINR(selectedPlan ? selectedPlan.amount : customAmount)} →</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 4: ENTER UPI / SECURITY PIN BEFORE RECHARGE          */}
      {/* ========================================================= */}
      {step === 'pin' && (
        <div className="dashboard-card" style={{ margin: 0, padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => !submitting && setStep('confirm')}
              className="back-button"
              aria-label="Back"
            >
              <ArrowLeftIcon size={18} />
            </button>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                Enter UPI / Security PIN
              </h3>
              <p style={{ fontSize: '12px', color: '#A9BDD7', margin: 0 }}>
                Authorize {formatINR(selectedPlan ? selectedPlan.amount : customAmount)} for +91 {mobileNumber}
              </p>
            </div>
          </div>

          <form onSubmit={handleExecuteRecharge} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#A9BDD7' }}>
                  ENTER 4 OR 6-DIGIT PIN
                </label>
                <button
                  type="button"
                  onClick={() => setShowRechargePin((v) => !v)}
                  style={{ background: 'transparent', border: 'none', color: '#00D5FF', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {showRechargePin ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                  <span>{showRechargePin ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showRechargePin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={6}
                autoFocus
                value={rechargePin}
                onChange={(e) => {
                  setRechargePin(e.target.value.replace(/\D/g, '').slice(0, 6));
                  if (pinError) setPinError('');
                }}
                placeholder="••••••"
                className="auth-input"
                style={{
                  textAlign: 'center',
                  letterSpacing: showRechargePin ? '8px' : '10px',
                  fontSize: '20px',
                  fontWeight: '800',
                  height: '48px'
                }}
              />
              {pinError && (
                <div style={{ color: '#FF4D4D', fontSize: '12px', marginTop: '6px', fontWeight: '600' }}>
                  {pinError}
                </div>
              )}
            </div>

            <div style={{ fontSize: '11.5px', color: '#A9BDD7', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <ShieldCheckIcon size={15} style={{ color: '#00E599' }} />
              <span>Secured by ApnaPay 256-bit Encryption</span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStep('confirm')}
                className="auth-button secondary"
                style={{ flex: 1, height: '42px', margin: 0, fontSize: '13px' }}
                disabled={submitting}
              >
                Back
              </button>
              <button
                type="submit"
                className="auth-button"
                style={{ flex: 2, height: '42px', margin: 0, fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                disabled={submitting}
              >
                <ZapIcon size={15} />
                <span>{submitting ? 'Processing Recharge...' : `Confirm & Pay ${formatINR(selectedPlan ? selectedPlan.amount : customAmount)}`}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 4: RECHARGE SUCCESS RECEIPT                          */}
      {/* ========================================================= */}
      {step === 'success' && receiptData && (
        <div className="dashboard-card" style={{ margin: 0, padding: '24px', textAlign: 'center' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'rgba(0, 229, 153, 0.16)', color: '#00E599', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <CheckCircleIcon size={28} />
          </div>
          <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 4px' }}>
            Mobile Recharge Successful!
          </h3>
          <p style={{ fontSize: '13px', color: '#A9BDD7', margin: '0 0 16px' }}>
            +91 {receiptData.mobile_number || mobileNumber} • {receiptData.operator_name || selectedOperator?.operator_name}
          </p>

          <div style={{ fontSize: '26px', fontWeight: '900', color: '#00E599', marginBottom: '18px' }}>
            {formatINR(receiptData.amount)}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setStep('number');
                setSelectedPlan(null);
                setCustomAmount('');
                setReceiptData(null);
              }}
              className="auth-button secondary"
              style={{ width: 'auto', padding: '0 18px', height: '38px', margin: 0, fontSize: '13px' }}
            >
              New Recharge
            </button>
            <button
              type="button"
              onClick={() => navigate('/app')}
              className="auth-button"
              style={{ width: 'auto', padding: '0 20px', height: '38px', margin: 0, fontSize: '13px' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
      <MpinModal
        open={showSetMpinModal}
        initialMode="set"
        onClose={() => setShowSetMpinModal(false)}
        onSuccess={(newPin) => {
          setShowSetMpinModal(false);
          setRechargePin(newPin);
          setPinError('');
        }}
      />
    </div>
  );
};

export default CustomerRechargePage;
