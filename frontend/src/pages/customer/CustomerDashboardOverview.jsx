import React, { useState, useEffect } from 'react';
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
  PhoneCallIcon,
  MoreHorizontalIcon,
  ChevronRightIcon,
  TrendingUpIcon,
  InfoIcon
} from '../../components/Icons';
import bankAccountService from '../../services/bankAccountService';
import upiService from '../../services/upiService';
import walletService from '../../services/walletService';
import transactionService from '../../services/transactionService';
import landService from '../../services/landService';
import billService from '../../services/billService';

const CustomerDashboardOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bankAccounts, setBankAccounts] = useState([]);
  const [upiHandles, setUpiHandles] = useState([]);
  const [walletOverview, setWalletOverview] = useState(null);
  const [transactionSummary, setTransactionSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [landHoldings, setLandHoldings] = useState({ holdings: [], portfolioSummary: {} });
  const [activeBillCategory, setActiveBillCategory] = useState('electricity');
  const [billerSearch, setBillerSearch] = useState('');
  const [billersList, setBillersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch live overview data
  const loadOverviewData = async () => {
    setLoading(true);
    try {
      const [banksRes, upiRes, walletRes, txnSummaryRes, txnsRes, landRes, billersRes] = await Promise.all([
        bankAccountService.getLinkedAccounts().catch(() => ({ data: [] })),
        upiService.getUpiHandles().catch(() => ({ data: [] })),
        walletService.getOverview().catch(() => ({ data: null })),
        transactionService.getSummary('all').catch(() => ({ data: null })),
        transactionService.getTransactions({ page: 1, limit: 4 }).catch(() => ({ data: { records: [] } })),
        landService.getHoldings().catch(() => ({ data: { holdings: [], portfolioSummary: {} } })),
        billService.getBillers('electricity', 1, 10).catch(() => ({ data: { billers: [] } }))
      ]);

      setBankAccounts(banksRes?.data || []);
      setUpiHandles(upiRes?.data || []);
      setWalletOverview(walletRes?.data || null);
      setTransactionSummary(txnSummaryRes?.data || null);
      setRecentTransactions(txnsRes?.data?.records || []);
      setLandHoldings(landRes?.data || { holdings: [], portfolioSummary: {} });

      // Fallback electricity billers if backend demo empty
      const fetchedBillers = billersRes?.data?.billers || [];
      if (fetchedBillers.length > 0) {
        setBillersList(fetchedBillers);
      } else {
        setBillersList([
          { billerId: 'MPPKVVCL-W', billerName: 'MPPKVVCL', state: 'Madhya Pradesh' },
          { billerId: 'BSES-RAJ', billerName: 'BSES Rajdhani', state: 'Delhi' },
          { billerId: 'TATA-PWR-MUM', billerName: 'Tata Power', state: 'Mumbai' },
          { billerId: 'ADANI-ELEC-MUM', billerName: 'Adani Electricity', state: 'Mumbai' }
        ]);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverviewData();
  }, []);

  // Format currency helpers
  const formatINR = (val) => {
    const num = parseFloat(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '17 Nov 2026';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Change active category in bill widget
  const handleCategoryChange = async (catKey) => {
    setActiveBillCategory(catKey);
    try {
      const res = await billService.getBillers(catKey, 1, 10);
      const list = res?.data?.billers || [];
      if (list.length > 0) {
        setBillersList(list);
      } else {
        // Fallback demo billers for each category
        if (catKey === 'water') {
          setBillersList([
            { billerId: 'DELHI-JAL-BOARD', billerName: 'Delhi Jal Board', state: 'Delhi' },
            { billerId: 'BWSSB-BLR', billerName: 'BWSSB Bangalore', state: 'Karnataka' },
            { billerId: 'MCGM-WATER', billerName: 'MCGM Water Dept', state: 'Mumbai' }
          ]);
        } else if (catKey === 'gas') {
          setBillersList([
            { billerId: 'IGL-GAS', billerName: 'Indraprastha Gas (IGL)', state: 'Delhi NCR' },
            { billerId: 'MGL-GAS', billerName: 'Mahanagar Gas (MGL)', state: 'Mumbai' },
            { billerId: 'GUJ-GAS', billerName: 'Gujarat Gas Ltd', state: 'Gujarat' }
          ]);
        } else if (catKey === 'dth') {
          setBillersList([
            { billerId: 'TATA-PLAY', billerName: 'Tata Play (Sky)', state: 'National' },
            { billerId: 'AIRTEL-DTH', billerName: 'Airtel Digital TV', state: 'National' },
            { billerId: 'DISH-TV', billerName: 'Dish TV India', state: 'National' }
          ]);
        } else if (catKey === 'mobile_postpaid') {
          setBillersList([
            { billerId: 'JIO-POSTPAID', billerName: 'Jio Postpaid Plus', state: 'All India' },
            { billerId: 'AIRTEL-POSTPAID', billerName: 'Airtel Postpaid', state: 'All India' },
            { billerId: 'VI-POSTPAID', billerName: 'Vi Postpaid', state: 'All India' }
          ]);
        } else {
          setBillersList([
            { billerId: 'MPPKVVCL-W', billerName: 'MPPKVVCL', state: 'Madhya Pradesh' },
            { billerId: 'BSES-RAJ', billerName: 'BSES Rajdhani', state: 'Delhi' },
            { billerId: 'TATA-PWR-MUM', billerName: 'Tata Power', state: 'Mumbai' }
          ]);
        }
      }
    } catch (_) {
      // Keep existing list on error
    }
  };

  // Filter billers in widget
  const filteredBillers = billerSearch.trim()
    ? billersList.filter(
        (b) =>
          b.billerName.toLowerCase().includes(billerSearch.toLowerCase()) ||
          (b.state && b.state.toLowerCase().includes(billerSearch.toLowerCase()))
      )
    : billersList;

  // The 8 strictly approved modules
  const approvedServices = [
    {
      id: 'banks',
      title: 'Bank Accounts',
      sub: 'Link & manage accounts',
      icon: LandmarkIcon,
      path: '/app/banks'
    },
    {
      id: 'upi',
      title: 'UPI Services',
      sub: 'Instant @apnapay VPAs',
      icon: SmartphoneIcon,
      path: '/app/upi'
    },
    {
      id: 'wallet',
      title: 'Wallet & Ledger',
      sub: 'Escrow & settlements',
      icon: WalletIcon,
      path: '/app/wallet'
    },
    {
      id: 'bills',
      title: 'Bill Payments',
      sub: 'Electricity, Gas & DTH',
      icon: ReceiptIcon,
      path: '/app/bills'
    },
    {
      id: 'transactions',
      title: 'Transaction History',
      sub: 'Audit logs & statements',
      icon: HistoryIcon,
      path: '/app/transactions'
    },
    {
      id: 'land',
      title: 'Digital Land',
      sub: 'Fractional parcel assets',
      icon: LayersIcon,
      path: '/app/land'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      sub: 'Alerts & preferences',
      icon: BellIcon,
      path: '/app/profile'
    },
    {
      id: 'profile',
      title: 'Profile & Security',
      sub: 'KYC & password reset',
      icon: ShieldCheckIcon,
      path: '/app/profile'
    }
  ];

  const firstName = user?.full_name?.split(' ')[0] || 'Rohit';
  const displayWalletBal = walletOverview?.formattedBalance || formatINR(walletOverview?.balance || 5420);

  return (
    <DashboardLayout
      title="Financial Dashboard"
      subtitle="Digital payments, escrow wallet balance, banking connections, and BBPS utility bills"
      onRefresh={loadOverviewData}
    >
      {/* =================================================== */}
      {/* 1. TOP ROW: HERO BANNER (LEFT) & QUICK WALLET (RIGHT) */}
      {/* =================================================== */}
      <div className="overview-hero-row">
        {/* Hero Electric Gradient Banner */}
        <div className="hero-banner">
          {/* Subtle Ambient Glow Circles inside hero */}
          <div
            style={{
              position: 'absolute',
              top: '-50px',
              right: '80px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 213, 255, 0.35) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />

          <div className="hero-banner-content">
            <h1 className="hero-title">
              Welcome Back, {firstName}!
            </h1>
            <p className="hero-subtitle">
              Your digital payments, banking and more — all in one place
            </p>
            <button
              onClick={() => {
                const el = document.getElementById('our-services-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else navigate('/app/bills');
              }}
              className="hero-cta-btn"
            >
              <span>Explore Services</span>
              <ArrowRightIcon size={16} />
            </button>
          </div>

          {/* 3D Smartphone Illustration */}
          <div className="hero-graphic-wrap">
            <div className="phone-mockup-3d">
              <div className="phone-notch" />
              <div style={{ marginTop: '14px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #087BFF, #00D5FF)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontWeight: '900',
                    fontSize: '18px',
                    margin: '0 auto 6px auto'
                  }}
                >
                  A
                </div>
                <div className="phone-screen-logo">ApnaPay</div>
              </div>
              <div className="phone-screen-badge">
                <ShieldCheckIcon size={24} />
              </div>
              <div style={{ fontSize: '9px', color: '#00E599', fontWeight: '800', marginTop: '8px', letterSpacing: '0.5px' }}>
                100% SECURE
              </div>
            </div>
          </div>
        </div>

        {/* Quick Wallet Balance Card */}
        <div className="quick-wallet-card">
          <div>
            <div className="quick-wallet-header">
              <span className="wallet-card-label">Wallet Balance</span>
              <div className="wallet-3d-icon-box">
                <WalletIcon size={22} />
              </div>
            </div>

            <div className="wallet-card-balance">
              {loading ? '₹5,420.00' : displayWalletBal}
            </div>
          </div>

          <div className="wallet-card-actions">
            <button
              onClick={() => navigate('/app/wallet')}
              className="wallet-add-btn"
            >
              <span>Add Money</span>
              <ArrowRightIcon size={14} />
            </button>
            <div className="wallet-trend-badge">
              <span>↑ +₹250 today</span>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================== */}
      {/* 2. OUR SERVICES (STRICTLY THE 8 APPROVED MODULES)   */}
      {/* =================================================== */}
      <div id="our-services-section" className="services-section-header">
        <h2 className="services-section-title">
          Our Services
        </h2>
        <span className="services-count-indicator">
          8 Available Services
        </span>
      </div>

      <div className="services-grid-8">
        {approvedServices.map((service) => {
          const IconComponent = service.icon;
          return (
            <div
              key={service.id}
              onClick={() => navigate(service.path)}
              className="service-card-tile"
              title={`Open ${service.title}`}
            >
              <div className="service-icon-bubble">
                <IconComponent size={24} />
              </div>
              <div className="service-tile-name">
                {service.title}
              </div>
              <div className="service-tile-sub">
                {service.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* =================================================== */}
      {/* 3. BOTTOM TWO-COLUMN SECTION                        */}
      {/* =================================================== */}
      <div className="bottom-widgets-grid">
        {/* LEFT COLUMN: BILL PAYMENTS INTERACTIVE WIDGET */}
        <div className="widget-box">
          <div className="widget-box-header">
            <div className="widget-header-left">
              <div className="widget-icon-box">
                <ReceiptIcon size={20} />
              </div>
              <div>
                <h3 className="widget-title">Bill Payments</h3>
                <p className="widget-subtitle">Pay your bills quickly and securely</p>
              </div>
            </div>
            <div className="demo-mode-badge" title="Simulation & Test Mode enabled">
              <span>Demo Mode</span>
              <InfoIcon size={12} />
            </div>
          </div>

          <div className="bill-widget-body">
            {/* Column 1: Categories List */}
            <div className="bill-categories-col">
              <div
                onClick={() => handleCategoryChange('electricity')}
                className={`bill-cat-item ${activeBillCategory === 'electricity' ? 'active' : ''}`}
              >
                <ZapIcon size={14} />
                <span>Electricity</span>
              </div>
              <div
                onClick={() => handleCategoryChange('water')}
                className={`bill-cat-item ${activeBillCategory === 'water' ? 'active' : ''}`}
              >
                <DropletIcon size={14} />
                <span>Water</span>
              </div>
              <div
                onClick={() => handleCategoryChange('gas')}
                className={`bill-cat-item ${activeBillCategory === 'gas' ? 'active' : ''}`}
              >
                <FlameIcon size={14} />
                <span>Gas</span>
              </div>
              <div
                onClick={() => handleCategoryChange('dth')}
                className={`bill-cat-item ${activeBillCategory === 'dth' ? 'active' : ''}`}
              >
                <TvIcon size={14} />
                <span>DTH</span>
              </div>
              <div
                onClick={() => handleCategoryChange('mobile_postpaid')}
                className={`bill-cat-item ${activeBillCategory === 'mobile_postpaid' ? 'active' : ''}`}
              >
                <SmartphoneIcon size={14} />
                <span>Mobile</span>
              </div>
              <div
                onClick={() => navigate('/app/bills')}
                className="bill-cat-item"
              >
                <MoreHorizontalIcon size={14} />
                <span>More</span>
              </div>
            </div>

            {/* Column 2: Select Biller List */}
            <div className="bill-search-col">
              <div className="biller-search-input-wrap">
                <div style={{ position: 'absolute', left: '10px', color: '#6B87A8', display: 'flex' }}>
                  <SearchIcon size={13} />
                </div>
                <input
                  type="text"
                  value={billerSearch}
                  onChange={(e) => setBillerSearch(e.target.value)}
                  placeholder={`Search ${activeBillCategory} billers...`}
                  className="biller-search-input"
                />
              </div>

              <div className="biller-list-scroll">
                {filteredBillers.map((biller) => (
                  <div
                    key={biller.billerId}
                    onClick={() => navigate(`/app/bills?category=${activeBillCategory}&billerId=${biller.billerId}`)}
                    className="biller-item-pill"
                    title={`Pay ${biller.billerName}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div className="biller-logo-badge">
                        {biller.billerName.slice(0, 3)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="biller-name-text">
                          {biller.billerName}
                        </div>
                        <div className="biller-state-text">
                          {biller.state || 'India'}
                        </div>
                      </div>
                    </div>
                    <ChevronRightIcon size={14} style={{ color: '#6B87A8', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Quick Pay Promo Card */}
            <div
              onClick={() => navigate('/app/bills')}
              className="bill-promo-card"
              title="Click to Pay Bills"
            >
              <div className="bill-promo-icon">
                <ReceiptIcon size={24} />
              </div>
              <div className="bill-promo-title">
                Pay Bills Anytime, Anywhere
              </div>
              <div className="bill-promo-sub">
                Instant • Secure • Reliable
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MY WALLET & RECENT TRANSACTIONS WIDGET */}
        <div className="widget-box">
          <div className="widget-box-header">
            <div className="widget-header-left">
              <div className="widget-icon-box">
                <WalletIcon size={20} />
              </div>
              <div>
                <h3 className="widget-title">My Wallet</h3>
                <p className="widget-subtitle">Manage your wallet and view transactions</p>
              </div>
            </div>
          </div>

          {/* Top Half: Wallet Summary Strip */}
          <div className="wallet-strip-box">
            <div>
              <div style={{ fontSize: '11.5px', color: '#A9BDD7', fontWeight: '500' }}>Available Balance</div>
              <div className="wallet-balance-big">
                {loading ? '₹5,420.00' : displayWalletBal}
              </div>
              <button
                onClick={() => navigate('/app/wallet')}
                className="wallet-add-btn"
                style={{ marginTop: '8px', padding: '6px 14px', fontSize: '12px' }}
              >
                <span>Add Money</span>
                <ArrowRightIcon size={12} />
              </button>
            </div>

            {/* 3D Visual Illustration Box */}
            <div
              style={{
                width: '70px',
                height: '56px',
                borderRadius: '12px',
                background: 'linear-gradient(145deg, #072E5C, #0C4688)',
                border: '1.5px solid #1C518A',
                boxShadow: '0 8px 18px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00D5FF',
                flexShrink: 0
              }}
            >
              <WalletIcon size={28} />
            </div>

            {/* Wallet Summary Metrics */}
            <div className="wallet-metrics-col">
              <div className="wallet-metric-row">
                <span className="wallet-metric-label">Total Credit</span>
                <span className="wallet-metric-val credit">
                  ↑ {formatINR(transactionSummary?.totalCredit || 12500)}
                </span>
              </div>
              <div className="wallet-metric-row">
                <span className="wallet-metric-label">Total Debit</span>
                <span className="wallet-metric-val debit">
                  ↓ {formatINR(transactionSummary?.totalDebit || 7080)}
                </span>
              </div>
              <div className="wallet-metric-row">
                <span className="wallet-metric-label">Total Transactions</span>
                <span className="wallet-metric-val" style={{ color: '#FFFFFF' }}>
                  {transactionSummary?.counts?.totalTransactions || 24}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Half: Recent Transactions Mini Table */}
          <div className="recent-txns-wrap">
            <div className="recent-txns-header">
              <span className="recent-txns-title">Recent Transactions</span>
              <span
                onClick={() => navigate('/app/transactions')}
                className="recent-txns-link"
              >
                <span>View All</span>
                <ArrowRightIcon size={12} />
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="mini-txn-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.length > 0 ? (
                    recentTransactions.slice(0, 4).map((txn) => {
                      const isCredit = txn.type?.toLowerCase() === 'credit';
                      return (
                        <tr key={txn.id || txn.transaction_id}>
                          <td style={{ color: '#A9BDD7', whiteSpace: 'nowrap' }}>
                            {formatDate(txn.created_at || txn.date)}
                          </td>
                          <td style={{ fontWeight: '600', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {txn.description || txn.title || 'UPI Payment'}
                          </td>
                          <td>
                            <span className={`txn-badge ${isCredit ? 'credit' : 'debit'}`}>
                              {isCredit ? 'Credit' : 'Debit'}
                            </span>
                          </td>
                          <td style={{ fontWeight: '700', color: isCredit ? '#00E599' : '#FFFFFF', whiteSpace: 'nowrap' }}>
                            {isCredit ? '+' : '-'} {formatINR(txn.amount)}
                          </td>
                          <td>
                            <span className="txn-badge success">
                              Success
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td style={{ color: '#A9BDD7' }}>17 Nov 2026</td>
                      <td style={{ fontWeight: '600' }}>UPI Payment</td>
                      <td><span className="txn-badge debit">Debit</span></td>
                      <td style={{ fontWeight: '700' }}>- ₹500.00</td>
                      <td><span className="txn-badge success">Success</span></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboardOverview;