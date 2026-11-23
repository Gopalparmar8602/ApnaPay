import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldIcon,
  ShieldCheckIcon,
  WalletIcon,
  BankIcon,
  LandmarkIcon,
  SmartphoneIcon,
  ReceiptIcon,
  HistoryIcon,
  LayersIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ZapIcon,
  DropletIcon,
  FlameIcon,
  TvIcon,
  WifiIcon,
  QrCodeIcon,
  SendIcon,
  CheckIcon,
  LockIcon,
  ChevronRightIcon,
  TrendingUpIcon,
  SparklesIcon,
  MenuIcon,
  XIcon,
  GlobeIcon,
  MailIcon,
  UserIcon,
  BellIcon
} from '../../components/Icons';

const LandingPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Monitor scroll for navbar elevation
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Smooth scroll handler for section navigation
  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper for route redirection when action requires authentication
  const getActionTarget = (authRoute) => {
    return isAuthenticated ? authRoute : '/login';
  };

  return (
    <div className="landing-root">
      {/* ========================================================= */}
      {/* 1. PUBLIC NAVBAR (STICKY & RESPONSIVE)                   */}
      {/* ========================================================= */}
      <header className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-container">
          {/* Logo & Branding */}
          <Link
            to="/"
            onClick={() => {
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="landing-brand"
            aria-label="ApnaPay Home"
            title="Go to ApnaPay Home"
          >
            <div className="landing-brand-logo">A</div>
            <div>
              <div className="landing-brand-name">
                Apna<span>Pay</span>
              </div>
              <div className="landing-brand-tagline">
                Digital Payments for All
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="landing-nav-links">
            <button
              onClick={() => scrollToSection('hero')}
              className="landing-nav-link"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('payments')}
              className="landing-nav-link"
            >
              Payments
            </button>
            <button
              onClick={() => scrollToSection('bills')}
              className="landing-nav-link"
            >
              Recharge & Bills
            </button>
            <button
              onClick={() => scrollToSection('banking')}
              className="landing-nav-link"
            >
              Banking
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="landing-nav-link"
            >
              Our Services
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="landing-nav-link"
            >
              About ApnaPay
            </button>
          </nav>

          {/* Action Buttons (Login & Register / Go to Dashboard) */}
          <div className="landing-nav-actions">
            {isAuthenticated ? (
              <Link to="/app" className="landing-btn-primary">
                <span>Go to Dashboard</span>
                <ArrowRightIcon size={14} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="landing-btn-login">
                  Login
                </Link>
                <Link to="/signup" className="landing-btn-primary">
                  <span>Get Started</span>
                  <ArrowRightIcon size={14} />
                </Link>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="landing-hamburger"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div className={`landing-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <button
          onClick={() => scrollToSection('hero')}
          className="landing-mobile-link"
        >
          Home
        </button>
        <button
          onClick={() => scrollToSection('payments')}
          className="landing-mobile-link"
        >
          Payments
        </button>
        <button
          onClick={() => scrollToSection('bills')}
          className="landing-mobile-link"
        >
          Recharge & Bills
        </button>
        <button
          onClick={() => scrollToSection('banking')}
          className="landing-mobile-link"
        >
          Banking
        </button>
        <button
          onClick={() => scrollToSection('services')}
          className="landing-mobile-link"
        >
          Our Services
        </button>
        <button
          onClick={() => scrollToSection('about')}
          className="landing-mobile-link"
        >
          About ApnaPay
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          {isAuthenticated ? (
            <Link to="/app" className="landing-btn-primary" style={{ justifyContent: 'center' }}>
              <span>Go to Dashboard</span>
              <ArrowRightIcon size={14} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="landing-btn-login" style={{ justifyContent: 'center' }}>
                Login
              </Link>
              <Link to="/signup" className="landing-btn-primary" style={{ justifyContent: 'center' }}>
                <span>Get Started</span>
                <ArrowRightIcon size={14} />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. HERO SECTION                                          */}
      {/* ========================================================= */}
      <section id="hero" className="landing-hero-wrapper">
        <div className="landing-hero">
          <div className="landing-hero-glow-1" />
          <div className="landing-hero-glow-2" />

          {/* Left Hero Content */}
          <div className="landing-hero-left">
            <div className="landing-badge">
              <SparklesIcon size={14} />
              <span>Next-Gen Digital Payments</span>
            </div>

            <h1 className="landing-hero-title">
              Payments Made Simple. <br />
              <span>Your Digital Life, All in One Place.</span>
            </h1>

            <p className="landing-hero-subtitle">
              Experience smarter digital payments, manage your wallet, connect your bank accounts, explore services and track your transactions with ApnaPay.
            </p>

            {/* 3 Call to Action Buttons */}
            <div className="landing-hero-actions">
              <Link to="/signup" className="landing-hero-btn-main">
                <span>Get Started</span>
                <ArrowRightIcon size={16} />
              </Link>
              <Link to="/login" className="landing-hero-btn-sub">
                <span>Login to ApnaPay</span>
              </Link>
              <button
                onClick={() => scrollToSection('services')}
                className="landing-hero-btn-alt"
              >
                <span>Explore Services</span>
                <ChevronRightIcon size={16} />
              </button>
            </div>

            {/* Trust Points Checklist */}
            <div className="landing-hero-points">
              <div className="landing-hero-point">
                <CheckCircleIcon size={16} className="landing-hero-point-icon" />
                <span>Simulated Sandbox Payments</span>
              </div>
              <div className="landing-hero-point">
                <CheckCircleIcon size={16} className="landing-hero-point-icon" />
                <span>Instant QR & UPI Transfers</span>
              </div>
              <div className="landing-hero-point">
                <CheckCircleIcon size={16} className="landing-hero-point-icon" />
                <span>Double-Entry Escrow Ledger</span>
              </div>
            </div>
          </div>

          {/* Right Hero Visual: 3D Smartphone Mockup */}
          <div className="landing-phone-mockup-wrapper">
            {/* Floating Card 1: Payment Sent */}
            <div className="landing-floating-card-1">
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0, 229, 153, 0.15)', color: '#00E599', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon size={18} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#A9BDD7' }}>Payment Sent</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF' }}>₹500.00 via UPI</div>
              </div>
            </div>

            {/* Smartphone Body */}
            <div className="landing-phone-body">
              <div className="landing-phone-notch" />

              {/* App Header Inside Phone */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'linear-gradient(135deg, #087BFF, #00D5FF)', color: '#fff', fontSize: '14px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    A
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>ApnaPay</div>
                </div>
                <span style={{ fontSize: '9px', fontWeight: '700', color: '#00E599', background: 'rgba(0, 229, 153, 0.15)', padding: '2px 6px', borderRadius: '8px' }}>
                  LIVE DEMO
                </span>
              </div>

              {/* Mini Wallet Balance Card Inside Phone */}
              <div style={{ background: 'linear-gradient(135deg, #087BFF 0%, #0B2B54 100%)', borderRadius: '16px', padding: '14px', marginBottom: '12px', border: '1px solid rgba(0, 213, 255, 0.3)' }}>
                <div style={{ fontSize: '10px', color: '#E2E8F0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Wallet Balance
                </div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#FFFFFF', margin: '4px 0' }}>
                  ₹5,420.00
                </div>
                <div style={{ fontSize: '9px', color: '#00E599', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00E599' }} />
                  <span>Escrow Protected Ledger</span>
                </div>
              </div>

              {/* 4 Mini Action Circles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '14px' }}>
                {[
                  { icon: QrCodeIcon, label: 'Scan', color: '#00A8FF' },
                  { icon: SendIcon, label: 'Send', color: '#00E599' },
                  { icon: LandmarkIcon, label: 'Bank', color: '#C084FC' },
                  { icon: ReceiptIcon, label: 'Bills', color: '#F59E0B' }
                ].map((act, i) => {
                  const Icon = act.icon;
                  return (
                    <div key={i} style={{ background: '#0B1B32', border: '1px solid #17385D', borderRadius: '10px', padding: '8px 4px' }}>
                      <div style={{ color: act.color, display: 'flex', justifyContent: 'center', marginBottom: '2px' }}>
                        <Icon size={16} />
                      </div>
                      <div style={{ fontSize: '9px', color: '#A9BDD7', fontWeight: '700' }}>{act.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Stylized QR Code Inside Phone */}
              <div style={{ background: '#0B1B32', border: '1px solid #17385D', borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#A9BDD7', marginBottom: '6px' }}>
                  Personal Bharat UPI QR
                </div>
                <div style={{ background: '#050D1A', borderRadius: '10px', padding: '10px', display: 'inline-block' }}>
                  <QrCodeIcon size={84} style={{ color: '#00D5FF' }} />
                </div>
                <div style={{ fontSize: '9.5px', color: '#00E599', fontWeight: '700', marginTop: '6px', fontFamily: 'monospace' }}>
                  user@apnapay
                </div>
              </div>
            </div>

            {/* Floating Card 2: Bank Linked */}
            <div className="landing-floating-card-2">
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0, 168, 255, 0.15)', color: '#00A8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BankIcon size={18} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#A9BDD7' }}>Bank Linked</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF' }}>ICICI Bank •••• 9123</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. QUICK PAYMENT SERVICES SECTION (5 CARDS)               */}
      {/* ========================================================= */}
      <section id="payments" className="landing-section">
        <div className="landing-section-header">
          <div className="landing-badge">EVERYDAY PAYMENTS</div>
          <h2 className="landing-title">
            Everything You Need for <span>Everyday Payments</span>
          </h2>
          <p className="landing-subtitle">
            Experience lightning-fast fund transfers, seamless retail merchant QR payments, and unified Indian banking connections.
          </p>
        </div>

        <div className="landing-services-grid">
          {/* Card 1: Scan & Pay */}
          <div className="landing-service-card">
            <div>
              <div className="landing-service-icon-box" style={{ background: 'rgba(0, 168, 255, 0.12)', color: '#00A8FF' }}>
                <QrCodeIcon size={26} />
              </div>
              <h3 className="landing-service-card-title">Scan & Pay</h3>
              <p className="landing-service-card-desc">
                Scan Bharat QR codes across local retail counters, stores, and merchant outlets for quick, cashless payments.
              </p>
            </div>
            <Link to={getActionTarget('/app/upi')} className="landing-service-card-link">
              <span>Try Scan & Pay</span>
              <ChevronRightIcon size={14} />
            </Link>
          </div>

          {/* Card 2: Send Money */}
          <div className="landing-service-card">
            <div>
              <div className="landing-service-icon-box" style={{ background: 'rgba(0, 229, 153, 0.12)', color: '#00E599' }}>
                <SendIcon size={26} />
              </div>
              <h3 className="landing-service-card-title">Send Money</h3>
              <p className="landing-service-card-desc">
                Transfer money instantly to registered mobile numbers, contacts, or friends with zero delay and instant confirmation receipts.
              </p>
            </div>
            <Link to={getActionTarget('/app/upi')} className="landing-service-card-link">
              <span>Send Money Now</span>
              <ChevronRightIcon size={14} />
            </Link>
          </div>

          {/* Card 3: QR Payments */}
          <div className="landing-service-card">
            <div>
              <div className="landing-service-icon-box" style={{ background: 'rgba(0, 213, 255, 0.12)', color: '#00D5FF' }}>
                <ZapIcon size={26} />
              </div>
              <h3 className="landing-service-card-title">QR Payments</h3>
              <p className="landing-service-card-desc">
                Generate personal static and dynamic UPI QR codes to accept seamless peer-to-peer and merchant payments anytime.
              </p>
            </div>
            <Link to={getActionTarget('/app/upi')} className="landing-service-card-link">
              <span>Generate QR</span>
              <ChevronRightIcon size={14} />
            </Link>
          </div>

          {/* Card 4: Bank Transfers */}
          <div className="landing-service-card">
            <div>
              <div className="landing-service-icon-box" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
                <LandmarkIcon size={26} />
              </div>
              <h3 className="landing-service-card-title">Bank Transfers</h3>
              <p className="landing-service-card-desc">
                Connect and manage multiple Indian bank accounts with IFSC validation for simulated IMPS, NEFT, and RTGS settlements.
              </p>
            </div>
            <Link to={getActionTarget('/app/banks')} className="landing-service-card-link">
              <span>Connect Bank</span>
              <ChevronRightIcon size={14} />
            </Link>
          </div>

          {/* Card 5: Wallet & Ledger */}
          <div className="landing-service-card">
            <div>
              <div className="landing-service-icon-box" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#C084FC' }}>
                <WalletIcon size={26} />
              </div>
              <h3 className="landing-service-card-title">Wallet & Ledger</h3>
              <p className="landing-service-card-desc">
                Instant wallet top-ups with complete double-entry bookkeeping, escrow protection, and tamper-evident audit history.
              </p>
            </div>
            <Link to={getActionTarget('/app/wallet')} className="landing-service-card-link">
              <span>Open Wallet</span>
              <ChevronRightIcon size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. RECHARGE & BILL PAYMENTS SECTION (WARM TINT BAND)      */}
      {/* ========================================================= */}
      <section id="bills" className="landing-band-section">
        <div className="landing-section">
          <div className="landing-section-header">
            <div className="landing-badge" style={{ color: '#00E599', borderColor: 'rgba(0, 229, 153, 0.35)', background: 'rgba(0, 229, 153, 0.08)' }}>
              BBPS ASSURED
            </div>
            <h2 className="landing-title">
              Recharge & Pay Bills, <span>Effortlessly</span>
            </h2>
            <p className="landing-subtitle">
              Settle your monthly electricity, water, piped gas, and DTH utilities with comprehensive Bharat Bill Payment System integration.
            </p>
          </div>

          <div className="landing-bills-grid">
            {[
              { id: 'mobile', name: 'Mobile Recharge', icon: SmartphoneIcon, color: '#00A8FF', sub: 'Prepaid & Postpaid' },
              { id: 'electricity', name: 'Electricity Bills', icon: ZapIcon, color: '#F59E0B', sub: 'State Discoms' },
              { id: 'dth', name: 'DTH Recharge', icon: TvIcon, color: '#A855F7', sub: 'Tata Play, Airtel' },
              { id: 'gas', name: 'Piped & Cylinder Gas', icon: FlameIcon, color: '#EF4444', sub: 'IGL, MGL & More' },
              { id: 'water', name: 'Water Utility', icon: DropletIcon, color: '#00D5FF', sub: 'Municipal Boards' },
              { id: 'broadband', name: 'Broadband / Fiber', icon: WifiIcon, color: '#10B981', sub: 'High-speed Internet' }
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.id}
                  to={getActionTarget('/app/bills')}
                  className="landing-bill-card"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="landing-bill-icon-wrap" style={{ background: `${cat.color}18`, color: cat.color }}>
                    <Icon size={24} />
                  </div>
                  <div className="landing-bill-card-name">{cat.name}</div>
                  <div className="landing-bill-card-sub">{cat.sub}</div>
                </Link>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <Link to={getActionTarget('/app/bills')} className="landing-btn-primary" style={{ padding: '12px 28px' }}>
              <span>Explore All Utility Billers</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. BANKING & WALLET SECTION                              */}
      {/* ========================================================= */}
      <section id="banking" className="landing-section">
        <div className="landing-section-header">
          <div className="landing-badge">ESCROW & BANKING</div>
          <h2 className="landing-title">
            Manage Your Money <span>with Ease</span>
          </h2>
          <p className="landing-subtitle">
            Link verified bank accounts, configure UPI handles, inspect real-time transaction ledgers, and manage balances with full transparency.
          </p>
        </div>

        <div className="landing-wallet-showcase">
          {/* Left Column: Feature Highlights */}
          <div className="landing-wallet-feature-list">
            <div className="landing-wallet-feature-item">
              <div className="landing-wallet-feature-icon">
                <BankIcon size={20} />
              </div>
              <div>
                <div className="landing-wallet-feature-title">Manage Linked Bank Accounts</div>
                <p className="landing-wallet-feature-desc">
                  Link verified Indian banks (SBI, HDFC, ICICI, PNB) with automated IFSC validation and set default settlement accounts.
                </p>
              </div>
            </div>

            <div className="landing-wallet-feature-item">
              <div className="landing-wallet-feature-icon" style={{ background: 'rgba(0, 213, 255, 0.12)', color: '#00D5FF' }}>
                <SmartphoneIcon size={20} />
              </div>
              <div>
                <div className="landing-wallet-feature-title">UPI Services</div>
                <p className="landing-wallet-feature-desc">
                  Instant virtual payment addresses (VPAs) e.g. <code>user@apnapay</code> for smooth and secure inter-bank fund transfers.
                </p>
              </div>
            </div>

            <div className="landing-wallet-feature-item">
              <div className="landing-wallet-feature-icon" style={{ background: 'rgba(0, 229, 153, 0.12)', color: '#00E599' }}>
                <WalletIcon size={20} />
              </div>
              <div>
                <div className="landing-wallet-feature-title">Wallet Balance & Double-Entry Ledger</div>
                <p className="landing-wallet-feature-desc">
                  Strict cryptographic accounting generates dual credit/debit records on every transaction to prevent balance drift.
                </p>
              </div>
            </div>

            <div className="landing-wallet-feature-item">
              <div className="landing-wallet-feature-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#C084FC' }}>
                <HistoryIcon size={20} />
              </div>
              <div>
                <div className="landing-wallet-feature-title">Transaction History</div>
                <p className="landing-wallet-feature-desc">
                  Searchable, chronologically audited logs with instant receipt breakdowns, dispute status, and automated refund tracking.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <Link to={getActionTarget('/app/wallet')} className="landing-btn-primary">
                <span>Manage Banking & Wallet</span>
                <ArrowRightIcon size={14} />
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Ledger Preview Mockup */}
          <div className="landing-wallet-ledger-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF' }}>Recent Activity Feed</div>
              <span style={{ fontSize: '10px', color: '#00E599', background: 'rgba(0, 229, 153, 0.15)', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                SIMULATED REALTIME
              </span>
            </div>

            {/* Linked Bank Card Snapshot */}
            <div style={{ background: 'linear-gradient(135deg, #0A2244 0%, #0F2D54 100%)', border: '1px solid #1D4373', borderRadius: '14px', padding: '14px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 168, 255, 0.15)', color: '#00A8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BankIcon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF' }}>ICICI Bank</div>
                  <div style={{ fontSize: '11px', color: '#88A2C3', fontFamily: 'monospace' }}>•••• 9123 • ICIC000001</div>
                </div>
              </div>
              <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#00E599', background: 'rgba(0, 229, 153, 0.15)', padding: '3px 8px', borderRadius: '8px' }}>
                PRIMARY
              </span>
            </div>

            {/* Ledger Transactions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { title: 'Electricity Discom Settlement', time: 'Today, 10:45 AM', amt: '- ₹850.00', status: 'SUCCESS', isCredit: false },
                { title: 'Received via UPI (rohit@apnapay)', time: 'Yesterday, 04:20 PM', amt: '+ ₹1,200.00', status: 'SUCCESS', isCredit: true },
                { title: 'Wallet Top-up via Netbanking', time: '21 Nov, 02:15 PM', amt: '+ ₹5,000.00', status: 'SUCCESS', isCredit: true },
                { title: 'Mobile Prepaid 28-Day Plan', time: '19 Nov, 11:30 AM', amt: '- ₹299.00', status: 'SUCCESS', isCredit: false }
              ].map((txn, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#051122', border: '1px solid #143254', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: txn.isCredit ? 'rgba(0, 229, 153, 0.12)' : 'rgba(0, 168, 255, 0.12)', color: txn.isCredit ? '#00E599' : '#00A8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {txn.isCredit ? <CheckIcon size={14} /> : <ReceiptIcon size={14} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#FFFFFF' }}>{txn.title}</div>
                      <div style={{ fontSize: '10.5px', color: '#64748B' }}>{txn.time}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: txn.isCredit ? '#00E599' : '#FFFFFF' }}>
                      {txn.amt}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#10B981', fontWeight: '700' }}>
                      {txn.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. EXPLORE MORE SERVICES SECTION (6 CARDS)               */}
      {/* ========================================================= */}
      <section id="services" className="landing-section">
        <div className="landing-section-header">
          <div className="landing-badge">EXPLORE ECOSYSTEM</div>
          <h2 className="landing-title">
            Explore More with <span>ApnaPay</span>
          </h2>
          <p className="landing-subtitle">
            Discover specialized modules engineered for digital asset management, real-time alert notifications, and profile compliance.
          </p>
        </div>

        <div className="landing-explore-grid">
          {/* Card 1: Digital Land */}
          <div className="landing-explore-card">
            <div>
              <div className="landing-service-icon-box" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#C084FC' }}>
                <LayersIcon size={26} />
              </div>
              <h3 className="landing-service-card-title">Digital Land</h3>
              <p className="landing-service-card-desc">
                Invest in fractional digital land parcels with audited admin verification, order tracking, and simulated asset registry.
              </p>
            </div>
            <Link to={getActionTarget('/app/land')} className="landing-service-card-link">
              <span>View Digital Land</span>
              <ChevronRightIcon size={14} />
            </Link>
          </div>

          {/* Card 2: Notifications */}
          <div className="landing-explore-card">
            <div>
              <div className="landing-service-icon-box" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
                <BellIcon size={26} />
              </div>
              <h3 className="landing-service-card-title">Notifications</h3>
              <p className="landing-service-card-desc">
                Receive real-time multi-channel alerts on account logins, KYC updates, order status changes, and ledger credits.
              </p>
            </div>
            <Link to={getActionTarget('/app')} className="landing-service-card-link">
              <span>View Alerts</span>
              <ChevronRightIcon size={14} />
            </Link>
          </div>

          {/* Card 3: Transaction History */}
          <div className="landing-explore-card">
            <div>
              <div className="landing-service-icon-box" style={{ background: 'rgba(0, 168, 255, 0.12)', color: '#00A8FF' }}>
                <HistoryIcon size={26} />
              </div>
              <h3 className="landing-service-card-title">Transaction History</h3>
              <p className="landing-service-card-desc">
                Access detailed chronological audit statements with status filters, date ranges, and downloadable payment receipts.
              </p>
            </div>
            <Link to={getActionTarget('/app/transactions')} className="landing-service-card-link">
              <span>View Statements</span>
              <ChevronRightIcon size={14} />
            </Link>
          </div>

          {/* Card 4: Refund & Dispute */}
          <div className="landing-explore-card">
            <div>
              <div className="landing-service-icon-box" style={{ background: 'rgba(0, 229, 153, 0.12)', color: '#00E599' }}>
                <ShieldCheckIcon size={26} />
              </div>
              <h3 className="landing-service-card-title">Refund & Dispute</h3>
              <p className="landing-service-card-desc">
                Transparent end-to-end tracking of pending bank settlements, failed payment tickets, and automated escrow reversals.
              </p>
            </div>
            <Link to={getActionTarget('/app/transactions')} className="landing-service-card-link">
              <span>Check Dispute Status</span>
              <ChevronRightIcon size={14} />
            </Link>
          </div>

          {/* Card 5: SIP */}
          <div className="landing-explore-card">
            <div>
              <div className="landing-service-icon-box" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                <TrendingUpIcon size={26} />
              </div>
              <h3 className="landing-service-card-title">SIP Simulator</h3>
              <p className="landing-service-card-desc">
                Simulate disciplined recurring mutual fund investments with dynamic CAGR growth forecasting and monthly contribution tracking.
              </p>
            </div>
            <Link to={getActionTarget('/app/bills')} className="landing-service-card-link">
              <span>Calculate SIP</span>
              <ChevronRightIcon size={14} />
            </Link>
          </div>

          {/* Card 6: Profile & KYC */}
          <div className="landing-explore-card">
            <div>
              <div className="landing-service-icon-box" style={{ background: 'rgba(0, 213, 255, 0.12)', color: '#00D5FF' }}>
                <UserIcon size={26} />
              </div>
              <h3 className="landing-service-card-title">Profile & KYC</h3>
              <p className="landing-service-card-desc">
                Manage profile details, submit demo KYC verification documents, maintain phone and email credentials, and review active sessions.
              </p>
            </div>
            <Link to={getActionTarget('/app/profile')} className="landing-service-card-link">
              <span>Manage Profile</span>
              <ChevronRightIcon size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. HOW APNAPAY WORKS SECTION                             */}
      {/* ========================================================= */}
      <section id="how-it-works" className="landing-band-section">
        <div className="landing-section">
          <div className="landing-section-header">
            <div className="landing-badge">SIMPLE WORKFLOW</div>
            <h2 className="landing-title">
              How <span>ApnaPay Works</span>
            </h2>
            <p className="landing-subtitle">
              Get started with ApnaPay in minutes. No paperwork, no complicated setups — just seamless digital payments.
            </p>
          </div>

          <div className="landing-steps-grid">
            {/* Step 1 */}
            <div className="landing-step-card">
              <div className="landing-step-number">01</div>
              <h3 className="landing-step-title">Step 1: Create Your Account</h3>
              <p className="landing-step-desc">
                Register and access your ApnaPay account securely using your phone, email, and one-time verification in under 60 seconds.
              </p>
            </div>

            {/* Step 2 */}
            <div className="landing-step-card">
              <div className="landing-step-number">02</div>
              <h3 className="landing-step-title">Step 2: Explore Services</h3>
              <p className="landing-step-desc">
                Explore wallet, bank account, UPI, payment, recharge, and other available services in one unified and easy-to-use console.
              </p>
            </div>

            {/* Step 3 */}
            <div className="landing-step-card">
              <div className="landing-step-number">03</div>
              <h3 className="landing-step-title">Step 3: Manage Your Activity</h3>
              <p className="landing-step-desc">
                View transaction history, notifications, and available services with complete ledger audit transparency right from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. SECURITY & TRUST SECTION                              */}
      {/* ========================================================= */}
      <section id="security" className="landing-section">
        <div className="landing-section-header">
          <div className="landing-badge" style={{ color: '#00E599', borderColor: 'rgba(0, 229, 153, 0.35)', background: 'rgba(0, 229, 153, 0.08)' }}>
            FINTECH ARCHITECTURE
          </div>
          <h2 className="landing-title">
            Your Experience. <span>Your Security.</span>
          </h2>
          <p className="landing-subtitle">
            Engineered with modern cryptographic best practices, audited database isolation, and transparent ledger logging.
          </p>
        </div>

        <div className="landing-security-grid">
          <div className="landing-security-card">
            <div className="landing-security-icon-box">
              <LockIcon size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', marginBottom: '8px' }}>
              Authentication
            </h3>
            <p style={{ fontSize: '13px', color: '#A9BDD7', lineHeight: 1.55, margin: 0 }}>
              Robust bcrypt-salted password protection with brute-force prevention, email checks, and strict credential validation.
            </p>
          </div>

          <div className="landing-security-card">
            <div className="landing-security-icon-box" style={{ background: 'rgba(0, 213, 255, 0.12)', color: '#00D5FF' }}>
              <MailIcon size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', marginBottom: '8px' }}>
              OTP Verification
            </h3>
            <p style={{ fontSize: '13px', color: '#A9BDD7', lineHeight: 1.55, margin: 0 }}>
              6-digit time-restricted OTP verification dispatched directly to verified emails with strict rate-limiting and expiry windows.
            </p>
          </div>

          <div className="landing-security-card">
            <div className="landing-security-icon-box" style={{ background: 'rgba(0, 168, 255, 0.12)', color: '#00A8FF' }}>
              <ShieldCheckIcon size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', marginBottom: '8px' }}>
              Account Protection
            </h3>
            <p style={{ fontSize: '13px', color: '#A9BDD7', lineHeight: 1.55, margin: 0 }}>
              Proactive session tracking, suspicious activity monitoring, and instant one-click remote session revocation on logout.
            </p>
          </div>

          <div className="landing-security-card">
            <div className="landing-security-icon-box" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#C084FC' }}>
              <ShieldIcon size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', marginBottom: '8px' }}>
              Secure Session Management
            </h3>
            <p style={{ fontSize: '13px', color: '#A9BDD7', lineHeight: 1.55, margin: 0 }}>
              Stateless JWT tokens paired with encrypted session refresh tokens and server-side blacklisting for enterprise security.
            </p>
          </div>

          <div className="landing-security-card">
            <div className="landing-security-icon-box" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
              <UserIcon size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', marginBottom: '8px' }}>
              Profile & KYC Management
            </h3>
            <p style={{ fontSize: '13px', color: '#A9BDD7', lineHeight: 1.55, margin: 0 }}>
              Structured profile governance with simulated tier-based KYC approval pipelines and sensitive field masking.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. ABOUT APNAPAY SECTION                                  */}
      {/* ========================================================= */}
      <section id="about" className="landing-band-section">
        <div className="landing-section">
          <div className="landing-about-container">
            <div>
              <div className="landing-badge">ABOUT APNAPAY</div>
              <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
                Modern Digital Payments, Built for Everyone.
              </h2>
              <p style={{ fontSize: '15px', color: '#A9BDD7', lineHeight: 1.65, margin: '0 0 16px 0' }}>
                ApnaPay is an Indian digital payment and fintech demonstration platform inspired by PhonePe. We replicate the speed, usability, and architecture of real-world payment apps — including instant UPI peer transfers, BBPS utility billers, multi-bank management, and double-entry ledger settlement.
              </p>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                Designed as a portfolio and learning showcase, ApnaPay gives developers and visitors a complete hands-on experience of how production fintech systems handle sessions, transactional integrity, and user workflows.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/signup" className="landing-btn-primary" style={{ padding: '12px 28px' }}>
                  <span>Try Live Demo</span>
                  <ArrowRightIcon size={14} />
                </Link>
                <Link to="/admin/login" className="landing-btn-login" style={{ padding: '11px 24px' }}>
                  <span>Admin Console</span>
                </Link>
              </div>
            </div>

            <div className="landing-about-stat-grid">
              <div className="landing-about-stat-box">
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#00D5FF', marginBottom: '6px' }}>100%</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', marginBottom: '4px' }}>Sandbox Safe</div>
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>Zero real-money risk</div>
              </div>

              <div className="landing-about-stat-box">
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#00E599', marginBottom: '6px' }}>2FA</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', marginBottom: '4px' }}>Email OTP</div>
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>Bcrypt salted protection</div>
              </div>

              <div className="landing-about-stat-box">
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#00A8FF', marginBottom: '6px' }}>BBPS</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', marginBottom: '4px' }}>6+ Utility Categories</div>
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>Discoms, Gas, Water & DTH</div>
              </div>

              <div className="landing-about-stat-box">
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#C084FC', marginBottom: '6px' }}>24/7</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', marginBottom: '4px' }}>Double-Entry Ledger</div>
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>Realtime balance audits</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 10. FINAL CTA SECTION                                    */}
      {/* ========================================================= */}
      <section className="landing-section">
        <div className="landing-cta-banner">
          <div className="landing-cta-glow" />
          <h2 className="landing-cta-title">
            Discover a Simpler Digital Payment Experience
          </h2>
          <p className="landing-cta-sub">
            Explore the services and features available with ApnaPay.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
            <Link to="/signup" className="landing-cta-btn-white">
              <span>Get Started</span>
              <ArrowRightIcon size={16} />
            </Link>
            <Link to="/login" className="landing-cta-btn-outline">
              <span>Login</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 11. PROFESSIONAL FOOTER                                  */}
      {/* ========================================================= */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="landing-footer-grid">
            {/* Column 1: Brand & Overview */}
            <div>
              <Link
                to="/"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="landing-brand"
                style={{ marginBottom: '14px' }}
                aria-label="ApnaPay Home"
                title="Go to ApnaPay Home"
              >
                <div className="landing-brand-logo">A</div>
                <div>
                  <div className="landing-brand-name">
                    Apna<span>Pay</span>
                  </div>
                  <div className="landing-brand-tagline">
                    Digital Payments for All
                  </div>
                </div>
              </Link>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, marginTop: '12px' }}>
                Unified fintech application for demonstration, simulated payments, BBPS utility settlements, and digital portfolio management.
              </p>
            </div>

            {/* Column 2: Products */}
            <div>
              <div className="landing-footer-col-title">Payments</div>
              <ul className="landing-footer-links">
                <li><button onClick={() => scrollToSection('payments')} className="landing-footer-link" style={{ background: 'none', border: 'none', padding: 0 }}>Scan & Pay</button></li>
                <li><button onClick={() => scrollToSection('payments')} className="landing-footer-link" style={{ background: 'none', border: 'none', padding: 0 }}>Send Money</button></li>
                <li><button onClick={() => scrollToSection('payments')} className="landing-footer-link" style={{ background: 'none', border: 'none', padding: 0 }}>QR Payments</button></li>
                <li><button onClick={() => scrollToSection('banking')} className="landing-footer-link" style={{ background: 'none', border: 'none', padding: 0 }}>Bank Transfers</button></li>
                <li><button onClick={() => scrollToSection('banking')} className="landing-footer-link" style={{ background: 'none', border: 'none', padding: 0 }}>Wallet & Ledger</button></li>
              </ul>
            </div>

            {/* Column 3: Platform */}
            <div>
              <div className="landing-footer-col-title">Recharge & Bills</div>
              <ul className="landing-footer-links">
                <li><button onClick={() => scrollToSection('bills')} className="landing-footer-link" style={{ background: 'none', border: 'none', padding: 0 }}>Mobile Recharge</button></li>
                <li><button onClick={() => scrollToSection('bills')} className="landing-footer-link" style={{ background: 'none', border: 'none', padding: 0 }}>Electricity Bills</button></li>
                <li><button onClick={() => scrollToSection('bills')} className="landing-footer-link" style={{ background: 'none', border: 'none', padding: 0 }}>DTH Recharge</button></li>
                <li><button onClick={() => scrollToSection('bills')} className="landing-footer-link" style={{ background: 'none', border: 'none', padding: 0 }}>Water & Gas Utilities</button></li>
                <li><button onClick={() => scrollToSection('services')} className="landing-footer-link" style={{ background: 'none', border: 'none', padding: 0 }}>Digital Land</button></li>
              </ul>
            </div>

            {/* Column 4: Quick Access */}
            <div>
              <div className="landing-footer-col-title">Account & Platform</div>
              <ul className="landing-footer-links">
                <li><Link to="/login" className="landing-footer-link">Login</Link></li>
                <li><Link to="/signup" className="landing-footer-link">Register</Link></li>
                <li><button onClick={() => scrollToSection('about')} className="landing-footer-link" style={{ background: 'none', border: 'none', padding: 0 }}>About ApnaPay</button></li>
                <li><button onClick={() => scrollToSection('security')} className="landing-footer-link" style={{ background: 'none', border: 'none', padding: 0 }}>Security</button></li>
                <li><Link to="/admin/login" className="landing-footer-link">Admin Portal</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Disclaimer & Copyright */}
          <div className="landing-footer-bottom">
            <p className="landing-footer-disclaimer">
              ApnaPay is a demonstration project. Services and transactions displayed may operate in demo mode and do not represent actual financial services.
            </p>
            <div className="landing-footer-copy">
              © {new Date().getFullYear()} ApnaPay Digital Payments. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
