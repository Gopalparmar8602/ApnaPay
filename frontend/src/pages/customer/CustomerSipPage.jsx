import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Search,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Calendar,
  CheckCircle2,
  X,
  Wallet,
  Building2,
  Pause,
  Play,
  XCircle,
  Filter,
  Info,
  Clock,
  RefreshCw,
  Award,
  Layers
} from 'lucide-react';
import api from '../../services/api';
import walletService from '../../services/walletService';
import bankAccountService from '../../services/bankAccountService';

const PLAN_TIERS = [
  {
    id: 'Aggressive Growth',
    risk: 'Very High Risk',
    returns: '12% - 20%',
    color: '#A855F7',
    desc: 'Small & mid-cap equity funds focused on maximum long-term wealth creation.'
  },
  {
    id: 'High Growth',
    risk: 'High Risk',
    returns: '12% - 18%',
    color: '#0099FF',
    desc: 'Diversified growth equity funds balancing high return potential with quality.'
  },
  {
    id: 'Balanced',
    risk: 'Moderately High Risk',
    returns: '10% - 15%',
    color: '#10B981',
    desc: 'Large & flexi-cap funds offering steady compounding with controlled volatility.'
  },
  {
    id: 'Cautious',
    risk: 'Moderate Risk',
    returns: '8% - 12%',
    color: '#F59E0B',
    desc: 'Bluechip & corporate bond mix suited for medium-term financial goals.'
  },
  {
    id: 'Stable',
    risk: 'Low Risk',
    returns: '6% - 9%',
    color: '#38BDF8',
    desc: 'Liquid & ultra-short debt funds with high capital safety and instant liquidity.'
  }
];

const INVESTMENT_IDEAS = [
  { id: 'best', label: 'Best SIP Funds', badge: 'TOP PICKS', icon: '🏆', filter: (f) => Number(f.return_5y) >= 17 },
  { id: 'choti', label: 'Choti SIP @250', badge: '₹250', icon: '🪙', presetAmount: 250, filter: (f) => Number(f.minimum_investment) <= 250 },
  { id: 'high-growth', label: 'High Growth funds', badge: '18%+', icon: '🚀', filter: (f) => f.plan_tier === 'High Growth' || f.plan_tier === 'Aggressive Growth' },
  { id: 'daily', label: 'Daily SIP with ₹10', badge: '₹10', icon: '📅', presetAmount: 10, presetFreq: 'daily', filter: (f) => Number(f.minimum_investment) <= 100 },
  { id: 'lumpsum', label: 'Lumpsum Picks', badge: 'ONE-TIME', icon: '💎', filter: (f) => Number(f.fund_size_cr) >= 20000 },
  { id: 'silver', label: 'Silver funds', badge: 'METAL', icon: '🥈', filter: (f) => f.category === 'Silver' || f.product_name.toLowerCase().includes('silver') },
  { id: 'trending', label: 'Trending themes', badge: 'HOT', icon: '🔥', filter: (f) => f.category === 'Sectoral' },
  { id: 'new', label: 'New fund offering', badge: 'NFO', icon: '✨', filter: (f) => Boolean(f.is_new_fund) }
];

const CATEGORIES = [
  'All',
  'Large Cap',
  'Large & Mid Cap',
  'Mid Cap',
  'Small Cap',
  'Index',
  'Flexi Cap',
  'Value',
  'Tax Saver',
  'Sectoral',
  'Multi Asset',
  'Silver',
  'Debt'
];

function formatCompactINR(num) {
  if (!Number.isFinite(num)) return '₹0';
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(2)} K`;
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

function calcSipFutureValue(monthlyAmount, years, annualRate = 0.12) {
  const P = Number(monthlyAmount) || 0;
  const n = years * 12;
  const r = annualRate / 12;
  if (P <= 0 || n <= 0) return 0;
  return P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

export default function CustomerSipPage() {
  // Primary views: 'hub' | 'all-funds' | 'wizard' | 'portfolio'
  const [view, setView] = useState('hub');

  // Data state
  const [funds, setFunds] = useState([]);
  const [mySips, setMySips] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [investmentAccount, setInvestmentAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hub & All-Funds filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [sortBy, setSortBy] = useState('returns'); // 'returns' | 'min' | 'size'
  const [fundDetailsModal, setFundDetailsModal] = useState(null);

  // Start SIP Wizard state
  // wizardStep: 'amount' | 'plan' | 'fund' | 'pan' | 'pin' | 'success'
  const [wizardStep, setWizardStep] = useState('amount');
  const [sipAmount, setSipAmount] = useState('100');
  const [sipFrequency, setSipFrequency] = useState('monthly');
  const [selectedPlanTier, setSelectedPlanTier] = useState('Aggressive Growth');
  const [selectedFund, setSelectedFund] = useState(null);
  const [sipDay, setSipDay] = useState(10);
  const [showDayModal, setShowDayModal] = useState(false);

  // PAN Setup state
  const [panInput, setPanInput] = useState('');
  const [panConsent, setPanConsent] = useState(true);
  const [panError, setPanError] = useState('');

  // Payment & PIN state
  const [paymentSource, setPaymentSource] = useState('wallet');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sipReceipt, setSipReceipt] = useState(null);

  // Portfolio action modals
  const [installmentsModal, setInstallmentsModal] = useState(null);
  const [cancelModalSip, setCancelModalSip] = useState(null);
  const [cancelReason, setCancelReason] = useState('Financial priority changed');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3200);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [prodRes, sipRes, walRes, bankRes, invAccRes] = await Promise.allSettled([
        api.get('/sip/products'),
        api.get('/sip/my-sips'),
        walletService.getBalance(),
        bankAccountService.getAccounts(),
        api.get('/sip/investment-account')
      ]);

      if (prodRes.status === 'fulfilled') {
        const list = prodRes.value?.data?.data || [];
        setFunds(list);
      }
      if (sipRes.status === 'fulfilled') {
        setMySips(sipRes.value?.data?.data || []);
      }
      if (walRes.status === 'fulfilled') {
        const bal = walRes.value?.data?.available_balance ?? walRes.value?.data?.balance ?? 0;
        setWalletBalance(Number(bal) || 0);
      }
      if (bankRes.status === 'fulfilled') {
        const accts = bankRes.value?.data || [];
        setBankAccounts(accts);
      }
      if (invAccRes.status === 'fulfilled') {
        setInvestmentAccount(invAccRes.value?.data?.data || null);
      }
    } catch (_) {
      // handled per promise
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filtered funds for Hub / All Funds
  const filteredFunds = useMemo(() => {
    let list = [...funds];
    if (selectedIdea) {
      const ideaObj = INVESTMENT_IDEAS.find((i) => i.id === selectedIdea);
      if (ideaObj?.filter) list = list.filter(ideaObj.filter);
    }
    if (selectedCategory && selectedCategory !== 'All') {
      list = list.filter(
        (f) =>
          (f.category || '').toLowerCase() === selectedCategory.toLowerCase() ||
          (f.sub_category || '').toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.product_name?.toLowerCase().includes(q) ||
          f.provider_name?.toLowerCase().includes(q) ||
          f.category?.toLowerCase().includes(q) ||
          f.sub_category?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortBy === 'min') return Number(a.minimum_investment) - Number(b.minimum_investment);
      if (sortBy === 'size') return Number(b.fund_size_cr || 0) - Number(a.fund_size_cr || 0);
      return Number(b.return_5y || 0) - Number(a.return_5y || 0);
    });
    return list;
  }, [funds, selectedIdea, selectedCategory, searchQuery, sortBy]);

  const focusFunds = useMemo(() => funds.filter((f) => Boolean(f.is_in_focus)), [funds]);
  const newFunds = useMemo(() => funds.filter((f) => Boolean(f.is_new_fund)), [funds]);

  // Funds matching selected Plan Tier in Step 3
  const tierFunds = useMemo(() => {
    const matching = funds.filter((f) => f.plan_tier === selectedPlanTier);
    return matching.length > 0 ? matching : funds;
  }, [funds, selectedPlanTier]);

  useEffect(() => {
    if (tierFunds.length > 0 && (!selectedFund || !tierFunds.some((f) => f.id === selectedFund.id))) {
      // Prefer HDFC Mid Cap Fund for Aggressive Growth if present
      const preferred = tierFunds.find((f) => f.product_name.includes('HDFC Mid Cap')) || tierFunds[0];
      setSelectedFund(preferred);
    }
  }, [tierFunds, selectedFund]);

  // Compounding chart points (Years 4 to 20)
  const chartYears = [4, 6, 8, 10, 12, 14, 16, 18, 20];
  const numericAmount = Math.max(0, Number(sipAmount) || 0);
  const monthlyEquivalent = sipFrequency === 'daily' ? numericAmount * 30 : numericAmount;
  const projected20Y = calcSipFutureValue(monthlyEquivalent, 20, 0.12);
  const chartValues = chartYears.map((yr) => calcSipFutureValue(monthlyEquivalent, yr, 0.12));
  const maxChartVal = Math.max(...chartValues, 1);

  const openStartSipWizard = (presetFund = null, presetAmt = null, presetFreq = 'monthly') => {
    setSipFrequency(presetFreq);
    if (presetAmt) setSipAmount(String(presetAmt));
    else if (!sipAmount || Number(sipAmount) < 10) setSipAmount('100');

    if (presetFund) {
      setSelectedFund(presetFund);
      if (presetFund.plan_tier) setSelectedPlanTier(presetFund.plan_tier);
      const minAmt = Number(presetFund.minimum_investment || 100);
      if (!presetAmt && Number(sipAmount) < minAmt) {
        setSipAmount(String(minAmt));
      }
      setWizardStep('fund');
    } else {
      setWizardStep('amount');
    }
    setPinInput('');
    setPinError('');
    setPanError('');
    setView('wizard');
  };

  const handleIdeaClick = (idea) => {
    if (idea.presetAmount) {
      openStartSipWizard(null, idea.presetAmount, idea.presetFreq || 'monthly');
      return;
    }
    setSelectedIdea(idea.id);
    setSelectedCategory('All');
    setView('all-funds');
  };

  const handleConfirmDay = () => {
    setShowDayModal(false);
    if (investmentAccount?.pan_number) {
      setWizardStep('pin');
    } else {
      setWizardStep('pan');
    }
  };

  const handleSavePan = async (e) => {
    e.preventDefault();
    setPanError('');
    const cleaned = panInput.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleaned)) {
      setPanError('Please enter a valid 10-character PAN (e.g., ABCDE1234F).');
      return;
    }
    if (!panConsent) {
      setPanError('Please accept the SEBI KYC consent to proceed.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/sip/investment-account', { pan_number: cleaned });
      setInvestmentAccount(res.data?.data || { pan_number: cleaned, kyc_status: 'verified' });
      setWizardStep('pin');
    } catch (err) {
      setPanError(err?.response?.data?.message || 'Unable to verify PAN. Please check and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteSip = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setPinError('');

    if (!/^\d{4}$|^\d{6}$/.test(pinInput)) {
      setPinError('Please enter your 4-digit or 6-digit UPI / Security PIN.');
      return;
    }
    const amt = Number(sipAmount);
    const minInv = Number(selectedFund?.minimum_investment || 100);
    if (!Number.isFinite(amt) || amt < minInv) {
      setPinError(`Minimum SIP amount for ${selectedFund?.product_name} is ₹${minInv}.`);
      return;
    }

    setSubmitting(true);
    try {
      // Verify bank UPI PIN if a linked bank account is selected
      if (paymentSource.startsWith('bank:')) {
        const bankId = Number(paymentSource.split(':')[1]);
        const bankObj = bankAccounts.find((b) => b.id === bankId);
        await bankAccountService.checkBalance(bankId, pinInput, bankObj ? !bankObj.hasUpiPin : false);
      }

      const res = await api.post('/sip/create', {
        product_id: selectedFund.id,
        installment_amount: amt,
        frequency: sipFrequency,
        debit_day: sipDay,
        total_installments: 12,
        payment_source: paymentSource
      });

      setSipReceipt({
        ...(res.data?.data || {}),
        product_name: selectedFund.product_name,
        provider_name: selectedFund.provider_name,
        sip_day: sipDay,
        payment_source: paymentSource
      });
      setPinInput('');
      setWizardStep('success');
      loadAllData();
    } catch (err) {
      const msg = err?.response?.data?.message || 'SIP authorization failed. Please try again.';
      setPinError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePauseResume = async (sip) => {
    try {
      const action = sip.status === 'active' ? 'pause' : 'resume';
      await api.put(`/sip/${sip.id}/${action}`);
      showToast(`SIP ${action === 'pause' ? 'paused' : 'resumed'} successfully.`);
      loadAllData();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Unable to update SIP status.');
    }
  };

  const handleCancelSip = async (e) => {
    e.preventDefault();
    if (!cancelModalSip) return;
    try {
      await api.post(`/sip/${cancelModalSip.id}/cancel`, {
        cancellation_reason: cancelReason || 'User requested cancellation'
      });
      setCancelModalSip(null);
      showToast('SIP cancellation submitted.');
      loadAllData();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Unable to cancel SIP.');
    }
  };

  const handleViewInstallments = async (sip) => {
    try {
      const res = await api.get(`/sip/${sip.id}/installments`);
      setInstallmentsModal({ sip, list: res.data?.data || [] });
    } catch (_) {
      showToast('Unable to load installments.');
    }
  };

  // ==================== RENDER ====================
  return (
    <div style={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: '#0F172A',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34D399',
            padding: '12px 18px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Top Navigation & Search */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'rgba(17, 28, 51, 0.85)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '14px 18px'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { id: 'hub', label: 'Mutual Funds', icon: Sparkles },
            { id: 'all-funds', label: 'Explore Funds', icon: Layers },
            { id: 'wizard', label: 'Start a SIP', icon: TrendingUp },
            { id: 'portfolio', label: `My SIPs (${mySips.length})`, icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === 'wizard') openStartSipWizard();
                  else {
                    if (tab.id === 'all-funds') setSelectedIdea(null);
                    setView(tab.id);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: active ? '1px solid rgba(0, 153, 255, 0.5)' : '1px solid rgba(255,255,255,0.06)',
                  background: active ? 'linear-gradient(135deg, rgba(0,153,255,0.2), rgba(168,85,247,0.18))' : 'rgba(11,18,34,0.6)',
                  color: active ? '#FFFFFF' : '#94A3B8',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#0B1222',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '0 12px',
            height: '38px',
            minWidth: '240px',
            flex: '0 1 320px'
          }}
        >
          <Search size={15} color="#64748B" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (view === 'hub' && e.target.value.trim()) setView('all-funds');
            }}
            placeholder="Search mutual funds, AMC..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFFFFF',
              fontSize: '13px',
              width: '100%'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ==================== VIEW 1: MUTUAL FUNDS HUB ==================== */}
      {view === 'hub' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Hero Banner: Start a SIP */}
          <div
            onClick={() => openStartSipWizard()}
            style={{
              background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.55) 0%, rgba(17, 28, 51, 0.95) 65%, rgba(0, 153, 255, 0.25) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              borderRadius: '18px',
              padding: '22px 24px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #A855F7, #0099FF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0
                }}
              >
                <TrendingUp size={26} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>Start a SIP</h2>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      background: 'rgba(168, 85, 247, 0.22)',
                      color: '#E9D5FF',
                      border: '1px solid rgba(168, 85, 247, 0.4)'
                    }}
                  >
                    CRISP TOP PICKS
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#CBD5E1' }}>
                  Grow your money with SIP now • Start with as little as ₹100/mo or ₹10/day
                </p>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#A855F7',
                color: '#FFFFFF',
                padding: '10px 18px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700
              }}
            >
              <span>Start in 5 Seconds</span>
              <ChevronRight size={16} />
            </div>
          </div>

          {/* Funds in Focus */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>Funds in Focus</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                  CRISP Top Picks shortlisted for consistent 5Y performance
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedIdea(null);
                  setSelectedCategory('All');
                  setView('all-funds');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38BDF8',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>View All</span>
                <ChevronRight size={15} />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '14px'
              }}
            >
              {(focusFunds.length ? focusFunds : funds.slice(0, 4)).map((fund) => (
                <div
                  key={fund.id}
                  onClick={() => setFundDetailsModal(fund)}
                  style={{
                    background: 'rgba(17, 28, 51, 0.85)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: 'rgba(0, 153, 255, 0.14)',
                          border: '1px solid rgba(0, 153, 255, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#38BDF8',
                          flexShrink: 0
                        }}
                      >
                        {(fund.amc_code || fund.product_name.slice(0, 4)).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.3 }}>
                          {fund.product_name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                          {fund.sub_category || fund.category || 'Equity Fund'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} color="#64748B" />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '10px',
                      borderTop: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>5Y return</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#10B981' }}>
                        {Number(fund.return_5y || 15.0).toFixed(2)}% p.a.
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Min. amount</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                        ₹{Number(fund.minimum_investment || 100).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Investment Ideas (8-tile grid) */}
          <section
            style={{
              background: 'rgba(17, 28, 51, 0.65)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '18px'
            }}
          >
            <h3 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
              Investment Ideas
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '12px'
              }}
            >
              {INVESTMENT_IDEAS.map((idea) => (
                <button
                  key={idea.id}
                  type="button"
                  onClick={() => handleIdeaClick(idea)}
                  style={{
                    background: '#0B1222',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '14px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '22px' }}>{idea.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0', lineHeight: 1.3 }}>
                    {idea.label}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#A855F7',
                      background: 'rgba(168, 85, 247, 0.14)',
                      padding: '2px 8px',
                      borderRadius: '999px'
                    }}
                  >
                    {idea.badge}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Fund Categories */}
          <section
            style={{
              background: 'rgba(17, 28, 51, 0.65)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '18px'
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>Fund categories</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                Most common equity & debt fund categories
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedIdea(null);
                    setSelectedCategory(cat);
                    setView('all-funds');
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: '#0B1222',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#E2E8F0',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          {/* Top New Funds */}
          {newFunds.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>Top New Funds</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                    Newly launched & trending mutual fund schemes
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '14px'
                }}
              >
                {newFunds.map((fund) => (
                  <div
                    key={fund.id}
                    onClick={() => setFundDetailsModal(fund)}
                    style={{
                      background: 'rgba(17, 28, 51, 0.85)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>{fund.product_name}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{fund.sub_category}</div>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#38BDF8',
                          background: 'rgba(56, 189, 248, 0.14)',
                          padding: '2px 7px',
                          borderRadius: '6px'
                        }}
                      >
                        NEW
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>3Y return</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#10B981' }}>
                          {Number(fund.return_3y || fund.return_5y || 16).toFixed(2)}% p.a.
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Min. amount</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                          ₹{Number(fund.minimum_investment || 100)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ==================== VIEW 2: ALL FUNDS EXPLORER ==================== */}
      {view === 'all-funds' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedIdea(null);
                  setView('hub');
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(17, 28, 51, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
                  All Funds ({filteredFunds.length})
                </h2>
                <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                  {selectedIdea
                    ? `Filtered by: ${INVESTMENT_IDEAS.find((i) => i.id === selectedIdea)?.label}`
                    : 'Returns as per latest available mutual fund data'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  background: '#0B1222',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '13px'
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    Category: {c}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: '#0B1222',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '13px'
                }}
              >
                <option value="returns">Sort: 5Y Returns</option>
                <option value="min">Sort: Min. Investment</option>
                <option value="size">Sort: Fund Size</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Loading mutual funds...</div>
          ) : filteredFunds.length === 0 ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                background: 'rgba(17, 28, 51, 0.6)',
                borderRadius: '14px',
                color: '#94A3B8'
              }}
            >
              No funds match the current filter.{' '}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedIdea(null);
                  setSearchQuery('');
                }}
                style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', fontWeight: 600 }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredFunds.map((fund) => (
                <div
                  key={fund.id}
                  style={{
                    background: 'rgba(17, 28, 51, 0.85)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'rgba(0, 153, 255, 0.14)',
                          border: '1px solid rgba(0, 153, 255, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#38BDF8'
                        }}
                      >
                        {(fund.amc_code || fund.product_name.slice(0, 4)).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>{fund.product_name}</div>
                        <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                          {fund.sub_category || fund.category} • {fund.provider_name}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setFundDetailsModal(fund)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '9px',
                          background: 'rgba(168, 85, 247, 0.14)',
                          border: '1px solid rgba(168, 85, 247, 0.35)',
                          color: '#E9D5FF',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        More Details
                      </button>
                      <button
                        type="button"
                        onClick={() => openStartSipWizard(fund)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '9px',
                          background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Start SIP →
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(90px, 1fr))',
                      gap: '12px',
                      paddingTop: '10px',
                      borderTop: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Last 5Y</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#10B981' }}>
                        {Number(fund.return_5y || 15).toFixed(2)}% p.a
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Min Invest.</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                        ₹{Number(fund.minimum_investment || 100).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Fund Size</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                        ₹{Number(fund.fund_size_cr || 5000).toLocaleString('en-IN')} Cr
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== VIEW 3: START A SIP GUIDED WIZARD ==================== */}
      {view === 'wizard' && (
        <div
          style={{
            background: 'rgba(17, 28, 51, 0.88)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '18px',
            padding: '22px'
          }}
        >
          {/* Wizard Step Indicator */}
          {wizardStep !== 'success' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  if (wizardStep === 'amount') setView('hub');
                  else if (wizardStep === 'plan') setWizardStep('amount');
                  else if (wizardStep === 'fund') setWizardStep('plan');
                  else if (wizardStep === 'pan') setWizardStep('fund');
                  else if (wizardStep === 'pin') setWizardStep('fund');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#0B1222',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#E2E8F0',
                  padding: '7px 12px',
                  borderRadius: '9px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {['amount', 'plan', 'fund', 'pin'].map((st, idx) => {
                  const active = wizardStep === st || (st === 'pin' && wizardStep === 'pan');
                  return (
                    <span
                      key={st}
                      style={{
                        width: active ? '26px' : '10px',
                        height: '8px',
                        borderRadius: '999px',
                        background: active ? '#A855F7' : 'rgba(255,255,255,0.14)',
                        transition: 'all 0.2s'
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 1: AMOUNT + LIVE COMPOUNDING CHART */}
          {wizardStep === 'amount' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '24px' }}>
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#E9D5FF',
                    background: 'rgba(168, 85, 247, 0.2)',
                    padding: '4px 10px',
                    borderRadius: '999px'
                  }}
                >
                  CRISP TOP PICKS
                </span>
                <h2 style={{ margin: '10px 0 14px', fontSize: '22px', fontWeight: 700, color: '#FFFFFF' }}>
                  Build long-term wealth with SIP
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
                  {[
                    'Start with as little as ₹100',
                    'Ride out market ups and downs with steady investments',
                    'Withdraw or stop anytime — zero lock-in'
                  ].map((pt) => (
                    <div key={pt} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#CBD5E1' }}>
                      <CheckCircle2 size={16} color="#A855F7" style={{ flexShrink: 0 }} />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>

                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '8px' }}>
                  How much do you want to invest {sipFrequency === 'daily' ? 'every day' : 'every month'}?
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#0B1222',
                    border: '1px solid rgba(168, 85, 247, 0.45)',
                    borderRadius: '12px',
                    padding: '0 14px',
                    height: '48px'
                  }}
                >
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#A855F7' }}>₹</span>
                  <input
                    type="number"
                    min={sipFrequency === 'daily' ? 10 : 100}
                    value={sipAmount}
                    onChange={(e) => setSipAmount(e.target.value)}
                    placeholder="Amount"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#FFFFFF',
                      fontSize: '18px',
                      fontWeight: 700,
                      width: '100%'
                    }}
                  />
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
                  Min ₹{sipFrequency === 'daily' ? '10' : '100'} • Recommended Amount:
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {(sipFrequency === 'daily' ? [10, 50, 100, 250] : [100, 500, 1000, 2000]).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSipAmount(String(amt))}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '999px',
                        border: Number(sipAmount) === amt ? '1px solid #A855F7' : '1px solid rgba(255,255,255,0.14)',
                        background: Number(sipAmount) === amt ? 'rgba(168, 85, 247, 0.22)' : '#0B1222',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compounding Growth Chart */}
              <div
                style={{
                  background: '#0B1222',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', color: '#94A3B8' }}>Your money can grow to</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>
                    {formatCompactINR(projected20Y)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Assuming a return of 12% p.a over 20 years</div>
                </div>

                {/* SVG Compounding Curve */}
                <svg viewBox="0 0 360 130" style={{ width: '100%', height: '130px', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="sipGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const pts = chartValues.map((val, i) => {
                      const x = 16 + (i * 328) / (chartValues.length - 1);
                      const y = 105 - (val / maxChartVal) * 88;
                      return { x, y, yr: chartYears[i], val };
                    });
                    const poly = pts.map((p) => `${p.x},${p.y}`).join(' ');
                    const area = `16,105 ${poly} ${pts[pts.length - 1].x},105`;
                    return (
                      <>
                        <polygon points={area} fill="url(#sipGrad)" />
                        <polyline points={poly} fill="none" stroke="#10B981" strokeWidth="2.5" />
                        {pts.map((p) => (
                          <g key={p.yr}>
                            <circle cx={p.x} cy={p.y} r="4" fill="#10B981" stroke="#0B1222" strokeWidth="1.5" />
                            <text x={p.x} y="124" textAnchor="middle" fill="#64748B" fontSize="10">
                              {p.yr}y
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>

                <button
                  type="button"
                  disabled={numericAmount < (sipFrequency === 'daily' ? 10 : 100)}
                  onClick={() => setWizardStep('plan')}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    background:
                      numericAmount >= (sipFrequency === 'daily' ? 10 : 100)
                        ? 'linear-gradient(135deg, #A855F7, #7C3AED)'
                        : '#1E293B',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: numericAmount >= (sipFrequency === 'daily' ? 10 : 100) ? 'pointer' : 'not-allowed'
                  }}
                >
                  PROCEED →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT PLAN TIER */}
          {wizardStep === 'plan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>
                  Select a plan to invest ₹{Number(sipAmount).toLocaleString('en-IN')}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                  Choose a risk & return profile suited to your goal
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {PLAN_TIERS.map((tier) => {
                  const selected = selectedPlanTier === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedPlanTier(tier.id)}
                      style={{
                        background: selected ? 'rgba(168, 85, 247, 0.14)' : '#0B1222',
                        border: selected ? '1.5px solid #A855F7' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px',
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>{tier.id}</div>
                          <div style={{ fontSize: '12px', color: tier.color, fontWeight: 600 }}>{tier.risk}</div>
                        </div>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: selected ? '6px solid #10B981' : '2px solid #475569',
                            background: '#0B1222'
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
                        {tier.returns}{' '}
                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#94A3B8' }}>returns per annum</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.4 }}>{tier.desc}</div>
                      {selected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWizardStep('fund');
                          }}
                          style={{
                            marginTop: '4px',
                            padding: '10px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
                            border: 'none',
                            color: '#FFFFFF',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          PROCEED
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: SELECT FUND */}
          {wizardStep === 'fund' && selectedFund && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>
                  In which {selectedPlanTier} fund do you want to invest ₹{Number(sipAmount).toLocaleString('en-IN')}?
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                  CRISP Top Pick matched to your plan • Withdraw anytime
                </p>
              </div>

              {/* Primary Selected Fund Card */}
              <div
                style={{
                  background: '#0B1222',
                  border: '1.5px solid rgba(168, 85, 247, 0.5)',
                  borderRadius: '16px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'rgba(168, 85, 247, 0.16)',
                        color: '#E9D5FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '12px'
                      }}
                    >
                      {(selectedFund.amc_code || 'FUND').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF' }}>{selectedFund.product_name}</div>
                      <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                        {selectedFund.sub_category || selectedFund.category} • Min ₹{Number(selectedFund.minimum_investment || 100)}
                      </div>
                    </div>
                  </div>

                  {selectedFund.badge_text && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        background: 'rgba(245, 158, 11, 0.18)',
                        color: '#FCD34D',
                        padding: '4px 10px',
                        borderRadius: '999px'
                      }}
                    >
                      🪙 {selectedFund.badge_text}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(17, 28, 51, 0.7)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Last 5Y</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#10B981' }}>
                      {Number(selectedFund.return_5y || 18).toFixed(2)}% p.a
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Since Launch</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                      {Number(selectedFund.return_since_launch || 16).toFixed(2)}% p.a
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Lock-in</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>No Lock in</div>
                    <div style={{ fontSize: '10px', color: '#94A3B8' }}>withdraw anytime</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Fund Size</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                      ₹{Number(selectedFund.fund_size_cr || 10000).toLocaleString('en-IN')} Cr
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowDayModal(true)}
                    style={{
                      flex: '1 1 220px',
                      padding: '13px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    PROCEED TO INVEST →
                  </button>
                  <button
                    type="button"
                    onClick={() => setFundDetailsModal(selectedFund)}
                    style={{
                      padding: '13px 18px',
                      borderRadius: '12px',
                      background: 'transparent',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      color: '#E9D5FF',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    VIEW MORE DETAILS
                  </button>
                </div>
              </div>

              {/* Other Funds in Tier */}
              {tierFunds.length > 1 && (
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#CBD5E1', marginBottom: '10px' }}>
                    Other {selectedPlanTier} funds
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                    {tierFunds
                      .filter((f) => f.id !== selectedFund.id)
                      .map((f) => (
                        <div
                          key={f.id}
                          onClick={() => setSelectedFund(f)}
                          style={{
                            background: '#0B1222',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            padding: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>{f.product_name}</div>
                            <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, marginTop: '3px' }}>
                              5Y: {Number(f.return_5y || 15).toFixed(2)}% p.a • Min ₹{Number(f.minimum_investment || 100)}
                            </div>
                          </div>
                          <span style={{ fontSize: '12px', color: '#A855F7', fontWeight: 600 }}>Select</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: PAN / INVESTMENT ACCOUNT SETUP */}
          {wizardStep === 'pan' && (
            <form onSubmit={handleSavePan} style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase' }}>
                  Account Creation
                </span>
                <h2 style={{ margin: '6px 0 4px', fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>
                  Let&apos;s set up your investment account
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>
                  It&apos;s free and completely digital
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                  Enter your PAN
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={panInput}
                  onChange={(e) => setPanInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="e.g. ABCDE1234F"
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 14px',
                    borderRadius: '12px',
                    background: '#0B1222',
                    border: '1px solid rgba(255,255,255,0.14)',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#94A3B8', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={panConsent}
                  onChange={(e) => setPanConsent(e.target.checked)}
                  style={{ marginTop: '2px', accentColor: '#A855F7' }}
                />
                <span>
                  I authorize ApnaPay Wealth to verify my PAN for KYC & mutual fund investment account setup as per SEBI regulations.
                </span>
              </label>

              {panError && <div style={{ color: '#F87171', fontSize: '12px', fontWeight: 600 }}>{panError}</div>}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '13px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {submitting ? 'Verifying PAN...' : 'Continue →'}
              </button>
            </form>
          )}

          {/* STEP 6: PAYMENT SOURCE & UPI PIN */}
          {wizardStep === 'pin' && selectedFund && (
            <form onSubmit={handleExecuteSip} style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>
                  Authorize First SIP Installment
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                  Verify payment method and enter your UPI / Security PIN
                </p>
              </div>

              {/* Order Summary */}
              <div
                style={{
                  background: '#0B1222',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Fund</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{selectedFund.product_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>SIP Amount ({sipFrequency})</span>
                  <span style={{ color: '#10B981', fontWeight: 800 }}>₹{Number(sipAmount).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>SIP Debit Day</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{sipDay}th of every month</span>
                </div>
                {investmentAccount?.pan_number && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>PAN Verified</span>
                    <span style={{ color: '#38BDF8', fontWeight: 600 }}>{investmentAccount.pan_number}</span>
                  </div>
                )}
              </div>

              {/* Payment Source */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '8px' }}>
                  Pay First Installment & Setup Mandate via
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: '10px',
                      background: '#0B1222',
                      border: paymentSource === 'wallet' ? '1.5px solid #A855F7' : '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Wallet size={17} color="#38BDF8" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>ApnaPay Wallet</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                          Available: ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="sipPaySource"
                      checked={paymentSource === 'wallet'}
                      onChange={() => setPaymentSource('wallet')}
                    />
                  </label>

                  {bankAccounts.map((bank) => {
                    const key = `bank:${bank.id}`;
                    return (
                      <label
                        key={bank.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px',
                          borderRadius: '10px',
                          background: '#0B1222',
                          border: paymentSource === key ? '1.5px solid #A855F7' : '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Building2 size={17} color="#A855F7" />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                              {bank.bankName} ({bank.maskedAccountNumber})
                            </div>
                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>UPI Autopay Mandate</div>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="sipPaySource"
                          checked={paymentSource === key}
                          onChange={() => setPaymentSource(key)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* PIN Input */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                  Enter 4-digit or 6-digit UPI / Security PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••"
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 14px',
                    borderRadius: '12px',
                    background: '#0B1222',
                    border: '1px solid rgba(255,255,255,0.14)',
                    color: '#FFFFFF',
                    fontSize: '18px',
                    letterSpacing: '0.25em',
                    textAlign: 'center'
                  }}
                />
              </div>

              {pinError && <div style={{ color: '#F87171', fontSize: '12px', fontWeight: 600 }}>{pinError}</div>}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '13px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {submitting ? 'Processing SIP...' : `Pay ₹${Number(sipAmount).toLocaleString('en-IN')} & Start SIP`}
              </button>
            </form>
          )}

          {/* STEP 7: SUCCESS RECEIPT */}
          {wizardStep === 'success' && sipReceipt && (
            <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.16)',
                  border: '1.5px solid #10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981'
                }}
              >
                <CheckCircle2 size={34} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#FFFFFF' }}>SIP Started Successfully!</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94A3B8' }}>
                  First installment paid & recurring SIP mandate activated
                </p>
              </div>

              <div
                style={{
                  width: '100%',
                  background: '#0B1222',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontSize: '13px',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Fund Name</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{sipReceipt.product_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>SIP Amount</span>
                  <span style={{ color: '#10B981', fontWeight: 800 }}>
                    ₹{Number(sipReceipt.installment_amount).toLocaleString('en-IN')} / {sipReceipt.frequency}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Next Due Date</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{sipReceipt.next_due_date}</span>
                </div>
                {sipReceipt.transaction_reference && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Txn Reference</span>
                    <span style={{ color: '#38BDF8', fontWeight: 600 }}>{sipReceipt.transaction_reference}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => setView('portfolio')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  View My SIPs
                </button>
                <button
                  type="button"
                  onClick={() => setView('hub')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#0B1222',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Explore Funds
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== VIEW 4: MY SIPS & PORTFOLIO ==================== */}
      {view === 'portfolio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>My Active & Past SIPs</h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                Manage installments, pause, resume or cancel your SIPs anytime
              </p>
            </div>
            <button
              type="button"
              onClick={() => openStartSipWizard()}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + Start New SIP
            </button>
          </div>

          {mySips.length === 0 ? (
            <div
              style={{
                background: 'rgba(17, 28, 51, 0.7)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
                color: '#94A3B8'
              }}
            >
              You haven&apos;t started any SIP yet. Start one with as little as ₹100/month!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mySips.map((sip) => (
                <div
                  key={sip.id}
                  style={{
                    background: 'rgba(17, 28, 51, 0.85)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '14px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>{sip.product_name}</span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background:
                            sip.status === 'active'
                              ? 'rgba(16, 185, 129, 0.16)'
                              : sip.status === 'paused'
                              ? 'rgba(245, 158, 11, 0.16)'
                              : 'rgba(239, 68, 68, 0.16)',
                          color: sip.status === 'active' ? '#34D399' : sip.status === 'paused' ? '#FBBF24' : '#F87171'
                        }}
                      >
                        {String(sip.status).toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                      ₹{Number(sip.installment_amount).toLocaleString('en-IN')} / {sip.frequency} • Next Due:{' '}
                      {sip.next_due_date ? String(sip.next_due_date).slice(0, 10) : '—'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleViewInstallments(sip)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        background: '#0B1222',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#E2E8F0',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Installments
                    </button>
                    {(sip.status === 'active' || sip.status === 'paused') && (
                      <button
                        type="button"
                        onClick={() => handlePauseResume(sip)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          background: 'rgba(245, 158, 11, 0.14)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          color: '#FCD34D',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {sip.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
                        <span>{sip.status === 'active' ? 'Pause' : 'Resume'}</span>
                      </button>
                    )}
                    {sip.status !== 'cancelled' && sip.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => setCancelModalSip(sip)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.14)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#F87171',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== MODAL: SELECT DAY OF SIP (1-28) ==================== */}
      {showDayModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.78)',
            zIndex: 9990,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '400px',
              background: '#111C33',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '18px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#FFFFFF' }}>Select Day of SIP</h3>
              <button
                type="button"
                onClick={() => setShowDayModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => {
                const active = sipDay === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSipDay(day)}
                    style={{
                      height: '38px',
                      borderRadius: '50%',
                      border: 'none',
                      background: active ? '#10B981' : '#0B1222',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: active ? 800 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleConfirmDay}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              SELECT ({sipDay}th)
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL: FUND DETAILS ==================== */}
      {fundDetailsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.78)',
            zIndex: 9990,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#111C33',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '18px',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
                  {fundDetailsModal.product_name}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                  {fundDetailsModal.provider_name} • {fundDetailsModal.sub_category || fundDetailsModal.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFundDetailsModal(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                background: '#0B1222',
                padding: '14px',
                borderRadius: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>5Y Return</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#10B981' }}>
                  {Number(fundDetailsModal.return_5y || 15).toFixed(2)}% p.a.
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Since Launch</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                  {Number(fundDetailsModal.return_since_launch || 15).toFixed(2)}% p.a.
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Min. SIP</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                  ₹{Number(fundDetailsModal.minimum_investment || 100)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Fund Size (AUM)</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                  ₹{Number(fundDetailsModal.fund_size_cr || 10000).toLocaleString('en-IN')} Cr
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const chosen = fundDetailsModal;
                setFundDetailsModal(null);
                openStartSipWizard(chosen);
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Invest with SIP →
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL: INSTALLMENTS ==================== */}
      {installmentsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.78)',
            zIndex: 9990,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              maxHeight: '80vh',
              overflowY: 'auto',
              background: '#111C33',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '18px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                Installments — {installmentsModal.sip.product_name}
              </h3>
              <button
                type="button"
                onClick={() => setInstallmentsModal(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            {installmentsModal.list.map((inst) => (
              <div
                key={inst.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: '#0B1222',
                  fontSize: '13px'
                }}
              >
                <span style={{ color: '#CBD5E1' }}>
                  #{inst.installment_number} • {String(inst.due_date).slice(0, 10)}
                </span>
                <span style={{ fontWeight: 700, color: inst.status === 'paid' ? '#10B981' : '#94A3B8' }}>
                  ₹{Number(inst.amount).toLocaleString('en-IN')} ({inst.status})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== MODAL: CANCEL SIP ==================== */}
      {cancelModalSip && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.78)',
            zIndex: 9990,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <form
            onSubmit={handleCancelSip}
            style={{
              width: '100%',
              maxWidth: '400px',
              background: '#111C33',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '18px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#FFFFFF' }}>Cancel SIP?</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
              {cancelModalSip.product_name} (₹{Number(cancelModalSip.installment_amount).toLocaleString('en-IN')})
            </p>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation"
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: '#0B1222',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#FFFFFF',
                fontSize: '13px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setCancelModalSip(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  background: '#0B1222',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                Keep SIP
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  background: '#EF4444',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Confirm Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
