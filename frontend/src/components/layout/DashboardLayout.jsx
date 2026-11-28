import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import walletService from '../../services/walletService';
import BackButton from '../BackButton';
import NotificationDropdown from '../NotificationDropdown';
import {
  ShieldIcon,
  HomeIcon,
  BankIcon,
  HistoryIcon,
  TrendingUpIcon,
  UserIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  WalletIcon,
  ReceiptIcon,
  SearchIcon,
  ShieldCheckIcon,
  BellIcon,
  QrCodeIcon,
  HelpCircleIcon,
  SparklesIcon,
  GridIcon,
  SendIcon,
  CreditCardIcon,
  SmartphoneIcon,
  LayersIcon,
  AlertCircleIcon
} from '../Icons';

const DashboardLayout = ({
  children,
  title = 'Dashboard',
  subtitle = '',
  onRefresh = null,
  showBack = undefined,
  backFallback = '/app',
  onBack = null,
  backLabel = 'Back'
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    walletService.getBalance()
      .then((res) => {
        if (isMounted && res?.data?.formattedBalance) {
          setWalletBalance(res.data.formattedBalance);
        }
      })
      .catch(() => { });
    return () => { isMounted = false; };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isOverview = location.pathname === '/app';
  const shouldShowBack = showBack !== undefined ? showBack : !isOverview;

  const navItems = [
    {
      to: '/app',
      label: 'Dashboard',
      icon: HomeIcon,
      exact: true
    },
    {
      to: '/app/services',
      label: 'All Services',
      icon: GridIcon,
      badge: 'Hub',
      badgeColor: 'blue'
    },
    {
      to: '/app/wallet',
      label: 'Wallet & Ledger',
      icon: WalletIcon
    },
    {
      to: '/app/banks',
      label: 'Bank Accounts',
      icon: BankIcon
    },
    {
      to: '/app/upi',
      label: 'UPI Services',
      icon: ShieldIcon
    },
    {
      to: '/app/recharge',
      label: 'Mobile Recharge',
      icon: SmartphoneIcon,
      badge: 'FAST',
      badgeColor: 'blue'
    },
    {
      to: '/app/bills',
      label: 'Bill Payments',
      icon: ReceiptIcon,
      badge: 'BBPS',
      badgeColor: 'blue'
    },
    {
      to: '/app/sip',
      label: 'SIP & Wealth',
      icon: TrendingUpIcon,
      badge: 'INVEST',
      badgeColor: 'green'
    },
    {
      to: '/app/land',
      label: 'Digital Land',
      icon: LayersIcon,
      badge: 'Active',
      badgeColor: 'green'
    },
    {
      to: '/app/transactions',
      label: 'Transaction History',
      icon: HistoryIcon
    },
    {
      to: '/app/disputes',
      label: 'Dispute & Refunds',
      icon: AlertCircleIcon,
      badge: 'HELP',
      badgeColor: 'blue'
    },
    {
      to: '/app/kyc',
      label: 'KYC Verification',
      icon: ShieldCheckIcon
    },
    {
      to: '/app/profile',
      label: 'Profile & Settings',
      icon: UserIcon
    }
  ];

  const searchableServices = [
    { title: 'Mobile Recharge', path: '/app/recharge', desc: 'Prepaid & postpaid plans across Jio, Airtel, Vi, BSNL' },
    { title: 'SIP & Wealth', path: '/app/sip', desc: 'Micro SIP plans starting from ₹10/day & mutual funds' },
    { title: 'Dispute & Refunds', path: '/app/disputes', desc: '24-hour grievance SLA, track disputes & refunds' },
    { title: 'KYC Verification', path: '/app/kyc', desc: 'RBI compliant identity, PAN, Aadhaar & video KYC' },
    { title: 'Wallet & Ledger', path: '/app/wallet', desc: 'Add money, view escrow ledger balance' },
    { title: 'Bank Accounts', path: '/app/banks', desc: 'Link Indian bank accounts with IFSC' },
    { title: 'UPI Services', path: '/app/upi', desc: 'Manage @apnapay UPI IDs and VPAs' },
    { title: 'Bill Payments', path: '/app/bills', desc: 'Electricity, Water, Gas, DTH & Mobile bills' },
    { title: 'Transaction History', path: '/app/transactions', desc: 'Search and filter financial records' },
    { title: 'Digital Land', path: '/app/land', desc: 'Buy & sell fractional digital land assets' },
    { title: 'Profile & Security', path: '/app/profile', desc: 'Notification preferences, KYC & password' }
  ];

  const filteredServices = searchQuery.trim()
    ? searchableServices.filter((s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  const getInitials = (name) => {
    if (!name) return 'RP';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = user?.full_name || 'Rohit Sharma';
  const displayEmail = user?.email || 'rohit@example.com';
  const initials = getInitials(displayName);

  return (
    <div className="portal-root">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="portal-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* =================================================== */}
      {/* 1. FIXED LEFT SIDEBAR (STATIONARY WHILE CONTENT SCROLLS) */}
      {/* =================================================== */}
      <aside className={`portal-sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Top Brand Header (Clickable - Navigates to ApnaPay Main Dashboard) */}
        <div className="portal-sidebar-header">
          <Link
            to="/app"
            onClick={() => setMobileOpen(false)}
            className="sidebar-brand-link"
            title="Go to ApnaPay Main Dashboard"
            aria-label="ApnaPay Home"
          >
            <div
              className="brand-logo-icon"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0, 168, 255, 0.4)',
                fontWeight: '900',
                fontSize: '20px',
                color: '#FFFFFF',
                flexShrink: 0
              }}
            >
              A
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', color: '#FFFFFF', lineHeight: 1.2 }}>
                Apna<span style={{ color: '#00D5FF' }}>Pay</span>
              </div>
              <div style={{ fontSize: '11px', color: '#A9BDD7', fontWeight: '500', marginTop: '1px' }}>
                Digital Payments for All
              </div>
            </div>
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#A9BDD7',
              cursor: 'pointer',
              display: 'none'
            }}
            className="mobile-close-btn"
            aria-label="Close Navigation"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Middle Section – Navigation */}
        <nav className="portal-sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={() => setMobileOpen(false)}
                className={({ isActive: linkActive }) =>
                  `sidebar-link ${linkActive ? 'active' : ''}`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`sidebar-badge ${item.badgeColor || 'blue'}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Trust Badge Pinned Above User Footer */}
        <div className="sidebar-trust-badge">
          <div className="trust-icon-wrap">
            <ShieldCheckIcon size={18} />
          </div>
          <div>
            <div className="trust-title">ApnaPay</div>
            <div className="trust-subtitle">Safe • Secure • Reliable</div>
          </div>
        </div>

        {/* Bottom Section – User Profile Card & Logout */}
        <div className="portal-sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar-initials">
              {initials}
            </div>
            <div className="user-info">
              <div className="user-name">
                {displayName}
              </div>
              <div className="user-email">
                {displayEmail}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="sidebar-logout-btn"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOutIcon size={18} />
            </button>
          </div>

          {/* Admin Console Link (matching Screenshot 1 & 2) */}
          <Link
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className="sidebar-link"
            style={{
              marginTop: '8px',
              padding: '8px 12px',
              fontSize: '12.5px',
              color: '#A9BDD7',
              borderRadius: '8px',
              border: '1px solid rgba(0, 168, 255, 0.2)',
              background: 'rgba(7, 20, 38, 0.6)',
              minHeight: '36px',
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none'
            }}
            title="Open Admin Console"
          >
            <ShieldIcon size={16} />
            <span style={{ fontWeight: '600' }}>Admin Console</span>
            <span className="sidebar-badge blue" style={{ marginLeft: 'auto' }}>
              ADMIN
            </span>
          </Link>
        </div>
      </aside>

      {/* =================================================== */}
      {/* 2. MAIN VIEW AREA (INDEPENDENT VERTICAL SCROLLING)   */}
      {/* =================================================== */}
      <div className="portal-main-area">
        {/* Fixed Top Dashboard Header */}
        <header className="portal-top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            {/* Hamburger for mobile (<1024px) - Only on main overview where shouldShowBack is false */}
            {!shouldShowBack && (
              <button
                onClick={() => setMobileOpen(true)}
                className="portal-hamburger-btn"
                aria-label="Open Navigation Menu"
              >
                <MenuIcon size={22} />
              </button>
            )}

            {/* Back Button on every internal page (Corner Back Arrow on phone view) */}
            {shouldShowBack && (
              <BackButton
                fallback={backFallback}
                label={backLabel}
                onClick={onBack}
              />
            )}

            {/* Mobile Header Title on internal subpages */}
            {shouldShowBack && title && (
              <div className="mobile-header-title-text show-on-mobile">
                {title}
              </div>
            )}

            {/* Search Services Field */}
            <div className="top-search-wrap">
              <div className="top-search-icon">
                <SearchIcon size={16} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 250)}
                placeholder="Search services..."
                className="top-search-input"
              />

              {/* Quick Jump Search Results Dropdown */}
              {searchFocused && filteredServices.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    background: '#0B1B32',
                    border: '1px solid #17385D',
                    borderRadius: '12px',
                    padding: '6px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
                    zIndex: 150
                  }}
                >
                  {filteredServices.map((srv) => (
                    <div
                      key={srv.path}
                      onMouseDown={() => {
                        navigate(srv.path);
                        setSearchQuery('');
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#0E223D')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>{srv.title}</div>
                      <div style={{ fontSize: '11px', color: '#A9BDD7' }}>{srv.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Controls (Scan QR on Desktop, Notifications, User Avatar & Help) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              className="hide-on-mobile"
              onClick={() => {
                if (location.pathname !== '/app') {
                  navigate('/app');
                  setTimeout(() => window.dispatchEvent(new CustomEvent('open-qr-scanner')), 150);
                } else {
                  window.dispatchEvent(new CustomEvent('open-qr-scanner'));
                }
              }}
              title="Scan any QR Code"
              aria-label="Scan any QR Code"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                height: '38px',
                padding: '0 14px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 168, 255, 0.35)'
              }}
            >
              <QrCodeIcon size={16} />
              <span>Scan QR</span>
            </button>

            {/* Notification Bell Dropdown */}
            <NotificationDropdown />

            {/* User Profile Avatar with PhonePe-style Mini QR Badge (Only GP Avatar, no text name) */}
            <div
              className="header-user-pill"
              onClick={() => navigate('/app/profile')}
              title="Go to Profile & Security"
              style={{
                width: '38px',
                height: '38px',
                padding: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0B1B32',
                border: '1px solid #17385D'
              }}
            >
              <div className="header-user-avatar" style={{ position: 'relative', width: '30px', height: '30px', fontSize: '11px' }}>
                {initials}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('open-my-qr'));
                  }}
                  title="Open My QR Code"
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #087BFF, #00D5FF)',
                    border: '1.5px solid #071426',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}
                >
                  <QrCodeIcon size={8} />
                </span>
              </div>
            </div>

            {/* Help & Support Button (Corner) */}
            <button
              onClick={() => setHelpOpen(true)}
              title="Help & Support"
              className="auth-button secondary"
              style={{
                width: '38px',
                height: '38px',
                padding: 0,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                color: '#A9BDD7',
                borderColor: '#17385D'
              }}
              aria-label="Help & Support"
            >
              <HelpCircleIcon size={18} />
            </button>
          </div>
        </header>

        {/* 3. Main Page Content (Independently Scrolls Vertically Below Header) */}
        <main className="portal-page-content fade-in">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (PhonePe inspired 5-tab layout with center QR action) */}
        <nav className="mobile-bottom-nav">
          <NavLink
            to="/app"
            end
            className={({ isActive }) => `mobile-bottom-link ${isActive ? 'active' : ''}`}
          >
            <HomeIcon size={20} />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/app/services"
            className={({ isActive }) => `mobile-bottom-link ${isActive ? 'active' : ''}`}
          >
            <GridIcon size={20} />
            <span>Services</span>
          </NavLink>

          {/* Elevated Center Glowing QR Scan Button */}
          <div className="mobile-center-qr-wrap">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-qr-scanner'))}
              className="mobile-center-qr-btn"
              title="Scan any QR Code"
              aria-label="Scan any QR Code"
            >
              <QrCodeIcon size={24} />
            </button>
            <span className="mobile-center-qr-label">Scan QR</span>
          </div>

          {/* Alerts Tab in Bottom Nav (Wallet preserved in sidebar, balance pill and dashboard) */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-alerts-dropdown'))}
            className="mobile-bottom-link mobile-bottom-alerts-btn"
            title="Alerts & Notifications"
            aria-label="Alerts & Notifications"
          >
            <BellIcon size={20} />
            <span>Alerts</span>
          </button>

          <NavLink
            to="/app/transactions"
            className={({ isActive }) => `mobile-bottom-link ${isActive ? 'active' : ''}`}
          >
            <HistoryIcon size={20} />
            <span>History</span>
          </NavLink>
        </nav>
      </div>

      {/* Help & Support Modal */}
      {helpOpen && (
        <div
          className="admin-land-modal-overlay"
          onClick={() => setHelpOpen(false)}
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
                <HelpCircleIcon size={20} style={{ color: '#00A8FF' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  ApnaPay Help & Support
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="admin-land-modal-close-btn"
                title="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="admin-land-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#00D5FF', marginBottom: '4px' }}>
                  Simulated Payment Sandbox
                </div>
                <div style={{ fontSize: '12px', color: '#A9BDD7', lineHeight: 1.4 }}>
                  ApnaPay operates in a secure demo sandbox environment. All wallet balances, UPI transfers, and BBPS utility bill payments are simulated on your double-entry escrow ledger.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: '#0B1B32', border: '1px solid #17385D', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#FFFFFF' }}>How do I send money?</div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Use "To Mobile Number" or "Scan & Pay" with any valid 10-digit number or @apnapay UPI ID.</div>
                </div>
                <div style={{ background: '#0B1B32', border: '1px solid #17385D', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#FFFFFF' }}>How do I check balance?</div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Click "Check Balance" on the dashboard to view your escrow wallet and linked bank accounts.</div>
                </div>
                <div style={{ background: '#0B1B32', border: '1px solid #17385D', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#FFFFFF' }}>What is Digital Land & SIP?</div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>ApnaPay's signature innovative modules allowing simulated fractional property investments and recurring wealth planning.</div>
                </div>
              </div>
            </div>

            <div className="admin-land-modal-footer">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="auth-button"
                style={{ width: '100%', height: '36px', fontSize: '13px', margin: 0 }}
              >
                Close Support
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
