import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  WalletIcon,
  TrendingUpIcon,
  ShieldIcon,
  RefreshCwIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  PlusIcon,
  SendIcon,
  DownloadIcon,
  QrCodeIcon,
  LockIcon,
  FilterIcon,
  BankIcon,
  XIcon
} from '../../components/Icons';
import walletService from '../../services/walletService';
import bankAccountService from '../../services/bankAccountService';
import { CopyIcon } from '../../components/Icons';
import { POPULAR_INDIAN_BANKS, ALL_INDIAN_BANKS } from '../../data/indianBanks';

// Deterministic 21x21 QR-style SVG matrix generator for Wallet/UPI URI
const buildQrMatrix = (payload) => {
  const size = 21;
  const grid = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0, c0) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = isBorder || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Deterministic hash from payload
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const inTiming = r === 6 || c === 6;
      if (inTopLeft || inTopRight || inBottomLeft || inTiming) continue;
      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      grid[r][c] = ((hash >>> 0) % 10) < 5;
    }
  }
  return grid;
};

const CustomerWalletPage = () => {
  const navigate = useNavigate();

  // State: Data
  const [overview, setOverview] = useState(null);
  const [limits, setLimits] = useState(null);
  const [summary, setSummary] = useState(null);
  const [ledgerRecords, setLedgerRecords] = useState([]);
  const [pagination, setPagination] = useState({});
  const [linkedBanks, setLinkedBanks] = useState([]);

  // State: Loading & Feedback
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text }

  // State: Filters
  const [ledgerType, setLedgerType] = useState('all');
  const [ledgerPage, setLedgerPage] = useState(1);
  const [summaryPeriod, setSummaryPeriod] = useState('all');

  // State: Add Money Modal (3-step real flow: 'form' | 'confirm' | 'receipt')
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addStep, setAddStep] = useState('form');
  const [addAmount, setAddAmount] = useState('1000');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [addSourceDetail, setAddSourceDetail] = useState('');
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [addError, setAddError] = useState('');
  const [addReceipt, setAddReceipt] = useState(null);

  // State: Withdraw Modal ('form' | 'addBank' | 'fetchingBank' | 'bankAdded' | 'confirm' | 'connecting' | 'receipt')
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState('form');
  const [withdrawAmount, setWithdrawAmount] = useState('500');
  const [withdrawBankId, setWithdrawBankId] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('HDFC Bank - XX4321');
  const [withdrawBankIfsc, setWithdrawBankIfsc] = useState('');
  const [transferMode, setTransferMode] = useState('IMPS');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawReceipt, setWithdrawReceipt] = useState(null);
  const [showWithdrawDetails, setShowWithdrawDetails] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [fetchingBankName, setFetchingBankName] = useState('');
  const [addedBankInfo, setAddedBankInfo] = useState(null);

  // State: Wallet Transfer Modal ('form' | 'confirm' | 'connecting' | 'receipt')
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferStep, setTransferStep] = useState('form');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('100');
  const [transferNote, setTransferNote] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferReceipt, setTransferReceipt] = useState(null);
  const [showTransferDetails, setShowTransferDetails] = useState(false);

  // State: My QR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrRequestAmount, setQrRequestAmount] = useState('');
  const [qrCopied, setQrCopied] = useState(false);

  // State: Ledger Entry Receipt Modal
  const [selectedLedgerEntry, setSelectedLedgerEntry] = useState(null);

  // Format INR Helper
  const formatINR = (val) => {
    const num = parseFloat(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 1. Load Overview, Limits, Summary & Linked Banks
  const loadWalletMeta = async () => {
    setLoadingOverview(true);
    try {
      const [ovRes, limRes, sumRes, banksRes] = await Promise.all([
        walletService.getOverview().catch((err) => ({ error: err.response?.data?.message || 'Could not load overview' })),
        walletService.getLimits().catch(() => ({ data: null })),
        walletService.getSummary(summaryPeriod).catch(() => ({ data: null })),
        bankAccountService.getLinkedAccounts().catch(() => ({ data: [] }))
      ]);

      if (ovRes?.error) {
        setFeedback({ type: 'error', text: ovRes.error });
      } else {
        setOverview(ovRes?.data || null);
      }
      setLimits(limRes?.data || null);
      setSummary(sumRes?.data || null);

      const accounts = banksRes?.data || [];
      setLinkedBanks(accounts);
      if (accounts.length > 0) {
        const primary = accounts.find((b) => b.isPrimary || b.is_primary) || accounts[0];
        setWithdrawBankId(String(primary.id));
        const last4 = String(
          primary.accountLast4 || primary.account_last4 || primary.accountNumber || primary.account_number || primary.maskedAccountNumber || ''
        ).replace(/\D/g, '').slice(-4);
        setWithdrawBank(`${primary.bankName || primary.bank_name}${last4 ? ` - XX${last4}` : ''}`);
        setWithdrawBankIfsc(primary.ifscCode || primary.ifsc_code || '');
      }
    } catch (err) {
      console.error('Wallet Meta Error:', err);
      setFeedback({ type: 'error', text: 'Failed to connect to wallet switch.' });
    } finally {
      setLoadingOverview(false);
    }
  };

  // 2. Load Ledger Records
  const loadLedger = async (page = 1, type = ledgerType) => {
    setLoadingLedger(true);
    try {
      const res = await walletService.getLedger({ page, limit: 10, type });
      if (res?.data) {
        // Backend returns records (or dual alias ledger)
        const records = res.data.records || res.data.ledger || [];
        setLedgerRecords(records);
        setPagination(res.data.pagination || {});
      } else {
        setLedgerRecords([]);
        setPagination({});
      }
    } catch (err) {
      console.error('Ledger Load Error:', err);
      setLedgerRecords([]);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    loadWalletMeta();
  }, [summaryPeriod]);

  useEffect(() => {
    loadLedger(ledgerPage, ledgerType);
  }, [ledgerPage, ledgerType]);

  // Lock background page scroll while any wallet modal is open
  useEffect(() => {
    const anyModalOpen = showAddMoneyModal || showWithdrawModal || showTransferModal || showQrModal || Boolean(selectedLedgerEntry);
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddMoneyModal, showWithdrawModal, showTransferModal, showQrModal, selectedLedgerEntry]);

  const handleRefreshAll = () => {
    setFeedback(null);
    loadWalletMeta();
    loadLedger(ledgerPage, ledgerType);
  };

  const handleTypeChange = (newType) => {
    setLedgerType(newType);
    setLedgerPage(1);
  };

  const openAddMoneyModal = () => {
    setAddError('');
    setAddReceipt(null);
    setAddStep('form');
    setAddSourceDetail('');
    setShowAddMoneyModal(true);
  };

  const openWithdrawModal = () => {
    setWithdrawError('');
    setWithdrawReceipt(null);
    setBankSearchQuery('');
    setAddedBankInfo(null);
    setWithdrawStep('form');
    setShowWithdrawModal(true);
  };

  const handleSelectBankToLink = async (bankObj) => {
    setWithdrawError('');
    setFetchingBankName(bankObj.name);
    setWithdrawStep('fetchingBank');

    try {
      const [res] = await Promise.all([
        walletService.quickLinkBank({
          bankName: bankObj.name,
          ifscPrefix: bankObj.code || 'APNA'
        }),
        new Promise((r) => setTimeout(r, 700))
      ]);
      if (res?.success && res.data) {
        const acc = res.data;
        const label = `${acc.bankName}${acc.accountLast4 ? ` - XX${acc.accountLast4}` : ''}`;
        setAddedBankInfo(acc);
        setWithdrawBankId(String(acc.id));
        setWithdrawBank(label);
        setWithdrawBankIfsc(acc.ifscCode || '');
        setLinkedBanks((prev) => {
          const exists = prev.some((b) => String(b.id) === String(acc.id));
          return exists ? prev : [acc, ...prev];
        });
        setWithdrawStep('bankAdded');
      } else {
        setWithdrawError(res?.message || 'Unable to fetch bank account details.');
        setWithdrawStep('addBank');
      }
    } catch (err) {
      setWithdrawError(err.response?.data?.message || 'Failed to link bank account.');
      setWithdrawStep('addBank');
    }
  };

  // 3. Handle Add Money (Step 1 Validate -> Step 2 Confirm -> Step 3 Receipt)
  const handleAddMoneyReview = (e) => {
    e?.preventDefault();
    const amt = parseFloat(addAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      setAddError('Please enter a valid amount greater than ₹0.');
      return;
    }
    if (amt > 100000) {
      setAddError('Maximum top-up amount is ₹1,00,000 per transaction.');
      return;
    }
    if (amt > depositHeadroom) {
      setAddError(`Exceeds KYC wallet capacity. Maximum allowed top-up is ${formatINR(depositHeadroom)}.`);
      return;
    }
    setAddError('');
    setAddStep('confirm');
  };

  const handleAddMoneyConfirm = async () => {
    const amt = parseFloat(addAmount);
    setAddError('');
    setIsAddingMoney(true);

    try {
      const res = await walletService.addMoney(amt, paymentMethod, {
        sourceLabel: addSourceDetail.trim() || undefined
      });
      if (res?.success) {
        setAddReceipt(res.data || {
          addedAmount: amt,
          paymentMethod,
          availableBalance: (parseFloat(overview?.availableBalance ?? 0) + amt),
          referenceNumber: `TOPUP-${Date.now()}`,
          utrNumber: `UTR${Date.now().toString().slice(-9)}`
        });
        setAddStep('receipt');
        setFeedback({
          type: 'success',
          text: res.message || `₹${amt.toLocaleString('en-IN')} successfully added to your wallet!`
        });
        handleRefreshAll();
      } else {
        setAddError(res?.message || 'Failed to add money.');
        setAddStep('form');
      }
    } catch (err) {
      setAddError(err.response?.data?.message || 'Transaction could not be processed.');
      setAddStep('form');
    } finally {
      setIsAddingMoney(false);
    }
  };

  // 4. Handle Withdraw Money (Form -> Confirm -> Connecting -> Receipt)
  const handleWithdrawReview = (e) => {
    e?.preventDefault();
    const amt = parseFloat(withdrawAmount);
    const available = parseFloat(overview?.availableBalance ?? overview?.balance ?? 0);

    if (!amt || isNaN(amt) || amt < 1) {
      setWithdrawError('Minimum withdrawal amount is ₹1.');
      return;
    }
    if (amt > available) {
      setWithdrawError(`Insufficient funds. Your available balance is ${formatINR(available)}.`);
      return;
    }
    setWithdrawError('');
    setWithdrawStep('confirm');
  };

  const handleWithdrawConfirm = async () => {
    const amt = parseFloat(withdrawAmount);
    setWithdrawError('');
    setIsWithdrawing(true);
    setWithdrawStep('connecting');
    setShowWithdrawDetails(false);

    try {
      const selectedAcc = linkedBanks.find((b) => String(b.id) === String(withdrawBankId));
      const [res] = await Promise.all([
        walletService.withdraw(amt, withdrawBank, {
          bankAccountId: selectedAcc ? selectedAcc.id : undefined,
          ifscCode: selectedAcc?.ifscCode || selectedAcc?.ifsc_code || undefined,
          transferMode
        }),
        new Promise((r) => setTimeout(r, 700))
      ]);
      if (res?.success) {
        setWithdrawReceipt(res.data || {
          withdrawnAmount: amt,
          bankName: withdrawBank,
          transferMode,
          availableBalance: Math.max(0, parseFloat(overview?.availableBalance ?? 0) - amt),
          referenceNumber: `WTH-${Date.now()}`,
          utrNumber: `${transferMode}${Date.now().toString().slice(-9)}`,
          timestamp: new Date().toISOString()
        });
        setWithdrawStep('receipt');
        setFeedback({
          type: 'success',
          text: res.message || `₹${amt.toLocaleString('en-IN')} withdrawn successfully to your bank account!`
        });
        handleRefreshAll();
      } else {
        setWithdrawError(res?.message || 'Failed to process withdrawal.');
        setWithdrawStep('form');
      }
    } catch (err) {
      setWithdrawError(err.response?.data?.message || 'Withdrawal could not be completed.');
      setWithdrawStep('form');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // 5. Handle Wallet-to-Wallet Transfer
  const openTransferModal = () => {
    const avail = parseFloat(overview?.availableBalance ?? overview?.balance ?? 0);
    setTransferAmount(avail >= 100 ? '100' : avail >= 1 ? String(Math.floor(avail)) : '');
    setTransferError('');
    setTransferReceipt(null);
    setTransferStep('form');
    setShowTransferDetails(false);
    setShowTransferModal(true);
  };

  const handleTransferReview = (e) => {
    e?.preventDefault();
    const amt = parseFloat(transferAmount);
    const available = parseFloat(overview?.availableBalance ?? overview?.balance ?? 0);

    if (!transferRecipient.trim() || transferRecipient.trim().length < 3) {
      setTransferError('Enter a valid Mobile Number, @apnapay UPI ID, or Wallet ID.');
      return;
    }
    if (!amt || isNaN(amt) || amt < 1) {
      setTransferError('Minimum wallet transfer amount is ₹1.');
      return;
    }
    if (amt > available) {
      setTransferError(`Insufficient funds. Your available balance is ${formatINR(available)}.`);
      return;
    }
    setTransferError('');
    setTransferStep('confirm');
  };

  const handleTransferConfirm = async () => {
    const amt = parseFloat(transferAmount);
    setTransferError('');
    setIsTransferring(true);
    setTransferStep('connecting');
    setShowTransferDetails(false);

    try {
      const [res] = await Promise.all([
        walletService.transfer({
          recipient: transferRecipient.trim(),
          amount: amt,
          note: transferNote.trim()
        }),
        new Promise((r) => setTimeout(r, 700))
      ]);
      if (res?.success) {
        setTransferReceipt(res.data || {
          transferredAmount: amt,
          recipient: transferRecipient.trim(),
          availableBalance: Math.max(0, parseFloat(overview?.availableBalance ?? 0) - amt),
          referenceNumber: `WLTTR-${Date.now()}`,
          utrNumber: `WLT${Date.now().toString().slice(-9)}`,
          timestamp: new Date().toISOString()
        });
        setTransferStep('receipt');
        setFeedback({
          type: 'success',
          text: res.message || `₹${amt.toLocaleString('en-IN')} transferred from wallet!`
        });
        handleRefreshAll();
      } else {
        setTransferError(res?.message || 'Wallet transfer failed.');
        setTransferStep('form');
      }
    } catch (err) {
      setTransferError(err.response?.data?.message || 'Wallet transfer could not be completed.');
      setTransferStep('form');
    } finally {
      setIsTransferring(false);
    }
  };

  // Safe data readings
  const rawBalance = overview?.availableBalance ?? overview?.balance ?? 0;
  const currentTier = limits?.walletTier || (limits?.kycStatus === 'verified' ? 'Full KYC Verified' : 'Minimum KYC');
  const maxCap = limits?.maxBalance ?? 200000;
  const perTxn = limits?.limits?.perTransactionLimit ?? 100000;
  const dailyLimit = limits?.limits?.dailyLimit ?? 200000;
  const dailyRem = limits?.utilization?.dailyRemaining ?? dailyLimit;
  const monthlyLimit = limits?.limits?.monthlyLimit ?? 500000;
  const monthlyRem = limits?.utilization?.monthlyRemaining ?? monthlyLimit;
  const depositHeadroom = limits?.walletCapacityRemaining ?? Math.max(0, maxCap - rawBalance);

  const totalCredits = summary?.lifetime?.totalCredit ?? overview?.stats?.totalCredit ?? 0;
  const totalDebits = summary?.lifetime?.totalDebit ?? overview?.stats?.totalDebit ?? 0;
  const netFinancialFlow = summary?.lifetime?.netFlow ?? overview?.stats?.netFlow ?? (totalCredits - totalDebits);
  const totalTransactionsCount = summary?.lifetime?.totalTransactions ?? overview?.stats?.totalTransactions ?? ledgerRecords.length;

  return (
    <DashboardLayout
      title="Wallet & Ledger"
      subtitle="Inspect live escrow balance, velocity limits, and double-entry debit & credit ledger records"
      backFallback="/app"
      onRefresh={handleRefreshAll}
    >
      {/* Global Feedback Banner */}
      {feedback && (
        <div
          style={{
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
            border: `1px solid ${feedback.type === 'success' ? '#10B981' : '#EF4444'}`,
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            color: feedback.type === 'success' ? '#34D399' : '#FCA5A5'
          }}
        >
          {feedback.type === 'success' ? <CheckCircleIcon size={18} /> : <AlertCircleIcon size={18} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. TOP MAIN WALLET CARD (PhonePe & Modern Fintech Inspired) */}
      {/* ============================================================ */}
      <div
        className="dashboard-card"
        style={{
          background: 'linear-gradient(135deg, #071F42 0%, #040D1D 100%)',
          borderColor: 'rgba(0, 213, 255, 0.3)',
          borderRadius: '20px',
          padding: '26px',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'rgba(0, 213, 255, 0.15)',
                  color: '#00D5FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <WalletIcon size={16} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#00D5FF', letterSpacing: '0.8px' }}>
                APNAPAY SECURE ESCROW WALLET
              </span>
              <span className="sidebar-badge green" style={{ fontSize: '10px' }}>
                ● {overview?.status === 'active' ? 'Active' : 'Live'}
              </span>
            </div>

            <div style={{ fontSize: '13px', color: '#8BA0BD' }}>Available Balance</div>
            <div
              style={{
                fontSize: '38px',
                fontWeight: '900',
                color: '#FFFFFF',
                letterSpacing: '-0.8px',
                margin: '4px 0 12px 0'
              }}
            >
              {loadingOverview ? '₹...' : formatINR(rawBalance)}
            </div>

            {/* Account Details Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#A9BDD7', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '6px' }}>
                A/C: #WLT-{overview?.walletId || '29'}
              </span>
              <span style={{ fontSize: '11px', color: '#A9BDD7', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '6px' }}>
                Currency: INR (₹)
              </span>
              <span style={{ fontSize: '11px', color: '#10B981', background: 'rgba(16, 185, 129, 0.12)', padding: '4px 10px', borderRadius: '6px', fontWeight: '700' }}>
                100% Double-Entry Audited
              </span>
            </div>
          </div>

          {/* KYC Tier Badge & Sync */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <div
              style={{
                background: '#071529',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '12px 18px',
                textAlign: 'right'
              }}
            >
              <div style={{ fontSize: '10px', color: '#8BA0BD', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                KYC Compliance Tier
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#10B981', marginTop: '2px' }}>
                {currentTier}
              </div>
              <div style={{ fontSize: '11px', color: '#6B87A8', marginTop: '2px' }}>
                Max Capacity: {formatINR(maxCap)}
              </div>
            </div>

            <button
              onClick={handleRefreshAll}
              className="auth-button secondary"
              style={{
                width: 'auto',
                padding: '0 14px',
                height: '34px',
                fontSize: '11px',
                margin: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Sync latest balance from ledger"
            >
              <RefreshCwIcon size={13} className={loadingOverview ? 'animate-spin' : ''} />
              <span>Sync Ledger</span>
            </button>
          </div>
        </div>

        {/* Quick Action Buttons Row */}
        <div
          style={{
            marginTop: '22px',
            paddingTop: '18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          {/* Add Money (Primary Action) */}
          <button
            onClick={openAddMoneyModal}
            className="auth-button primary"
            style={{
              width: 'auto',
              padding: '0 20px',
              height: '42px',
              fontSize: '13px',
              fontWeight: '800',
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #00D5FF 0%, #0077FF 100%)',
              color: '#050D1B',
              boxShadow: '0 0 16px rgba(0, 213, 255, 0.35)'
            }}
          >
            <PlusIcon size={16} strokeWidth={3} />
            <span>Add Money</span>
          </button>

          {/* Wallet Transfer */}
          <button
            onClick={openTransferModal}
            className="auth-button secondary"
            style={{
              width: 'auto',
              padding: '0 18px',
              height: '42px',
              fontSize: '13px',
              fontWeight: '700',
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <SendIcon size={15} />
            <span>Transfer</span>
          </button>

          {/* Withdraw to Bank */}
          <button
            onClick={openWithdrawModal}
            className="auth-button secondary"
            style={{
              width: 'auto',
              padding: '0 18px',
              height: '42px',
              fontSize: '13px',
              fontWeight: '700',
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <DownloadIcon size={15} />
            <span>Withdraw to Bank</span>
          </button>

          {/* Wallet My QR */}
          <button
            onClick={() => {
              setQrRequestAmount('');
              setQrCopied(false);
              setShowQrModal(true);
            }}
            className="auth-button secondary"
            style={{
              width: 'auto',
              padding: '0 16px',
              height: '42px',
              fontSize: '13px',
              fontWeight: '700',
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderColor: 'rgba(0, 213, 255, 0.35)',
              color: '#00D5FF'
            }}
          >
            <QrCodeIcon size={15} />
            <span>My QR</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. VELOCITY & TRANSACTION LIMITS (RBI Compliant) */}
      {/* ============================================================ */}
      <div className="dashboard-card" style={{ marginBottom: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldIcon size={18} style={{ color: '#00D5FF' }} />
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Transaction & Velocity Limits
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
            <CheckCircleIcon size={14} />
            RBI PPI Master Directions Compliant
          </span>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
          {/* Per-Transaction Limit */}
          <div className="stat-item" style={{ background: '#071529', borderRadius: '12px', padding: '14px' }}>
            <span className="stat-label" style={{ fontSize: '11px', color: '#8BA0BD' }}>Per-Transaction Limit</span>
            <div className="stat-value" style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', marginTop: '4px' }}>
              {formatINR(perTxn)}
            </div>
            <div style={{ fontSize: '11px', color: '#6B87A8', marginTop: '4px' }}>Single transfer ceiling</div>
          </div>

          {/* Daily Limit */}
          <div className="stat-item" style={{ background: '#071529', borderRadius: '12px', padding: '14px' }}>
            <span className="stat-label" style={{ fontSize: '11px', color: '#8BA0BD' }}>Daily Outflow Limit</span>
            <div className="stat-value" style={{ fontSize: '20px', fontWeight: '800', color: '#00D5FF', marginTop: '4px' }}>
              {formatINR(dailyLimit)}
            </div>
            <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>
              Remaining today: {formatINR(dailyRem)}
            </div>
          </div>

          {/* Monthly Limit */}
          <div className="stat-item" style={{ background: '#071529', borderRadius: '12px', padding: '14px' }}>
            <span className="stat-label" style={{ fontSize: '11px', color: '#8BA0BD' }}>Monthly Velocity Limit</span>
            <div className="stat-value" style={{ fontSize: '20px', fontWeight: '800', color: '#F59E0B', marginTop: '4px' }}>
              {formatINR(monthlyLimit)}
            </div>
            <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>
              Remaining this month: {formatINR(monthlyRem)}
            </div>
          </div>

          {/* Headroom */}
          <div className="stat-item" style={{ background: '#071529', borderRadius: '12px', padding: '14px' }}>
            <span className="stat-label" style={{ fontSize: '11px', color: '#8BA0BD' }}>Deposit Headroom</span>
            <div className="stat-value" style={{ fontSize: '20px', fontWeight: '800', color: '#10B981', marginTop: '4px' }}>
              {formatINR(depositHeadroom)}
            </div>
            <div style={{ fontSize: '11px', color: '#6B87A8', marginTop: '4px' }}>Allowed inflow capacity</div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. FINANCIAL FLOW SUMMARY */}
      {/* ============================================================ */}
      <div className="dashboard-card" style={{ marginBottom: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUpIcon size={18} style={{ color: '#10B981' }} />
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Financial Flow Summary
            </h3>
          </div>

          {/* Period Filters */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Lifetime' },
              { id: 'today', label: 'Today' },
              { id: 'weekly', label: 'Last 7 Days' },
              { id: 'monthly', label: 'This Month' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSummaryPeriod(p.id)}
                style={{
                  background: summaryPeriod === p.id ? '#087BFF' : '#071529',
                  color: summaryPeriod === p.id ? '#FFFFFF' : '#A9BDD7',
                  border: '1px solid #17385D',
                  borderRadius: '20px',
                  padding: '4px 14px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: summaryPeriod === p.id ? '700' : '400',
                  transition: 'all 0.2s'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
          {/* Credits (+) */}
          <div className="stat-item" style={{ background: 'rgba(16, 185, 129, 0.06)', borderColor: 'rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-label" style={{ fontSize: '11px', color: '#A9BDD7' }}>Total Credits (+)</span>
              <ArrowDownLeftIcon size={16} style={{ color: '#10B981' }} />
            </div>
            <div className="stat-value" style={{ color: '#10B981', fontSize: '22px', fontWeight: '800', marginTop: '4px' }}>
              +{formatINR(totalCredits)}
            </div>
            <div style={{ fontSize: '11px', color: '#8BA0BD', marginTop: '4px' }}>Total deposit & inflow</div>
          </div>

          {/* Debits (-) */}
          <div className="stat-item" style={{ background: 'rgba(239, 68, 68, 0.06)', borderColor: 'rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-label" style={{ fontSize: '11px', color: '#A9BDD7' }}>Total Debits (-)</span>
              <ArrowUpRightIcon size={16} style={{ color: '#EF4444' }} />
            </div>
            <div className="stat-value" style={{ color: '#EF4444', fontSize: '22px', fontWeight: '800', marginTop: '4px' }}>
              -{formatINR(totalDebits)}
            </div>
            <div style={{ fontSize: '11px', color: '#8BA0BD', marginTop: '4px' }}>Outflow & settlements</div>
          </div>

          {/* Net Financial Flow */}
          <div className="stat-item" style={{ background: '#071529', borderRadius: '12px', padding: '14px' }}>
            <span className="stat-label" style={{ fontSize: '11px', color: '#A9BDD7' }}>Net Financial Flow</span>
            <div
              className="stat-value"
              style={{
                fontSize: '22px',
                fontWeight: '800',
                marginTop: '4px',
                color: netFinancialFlow >= 0 ? '#10B981' : '#EF4444'
              }}
            >
              {netFinancialFlow >= 0 ? '+' : ''}{formatINR(netFinancialFlow)}
            </div>
            <div style={{ fontSize: '11px', color: '#8BA0BD', marginTop: '4px' }}>Net account variance</div>
          </div>

          {/* Total Operations */}
          <div className="stat-item" style={{ background: '#071529', borderRadius: '12px', padding: '14px' }}>
            <span className="stat-label" style={{ fontSize: '11px', color: '#A9BDD7' }}>Total Operations</span>
            <div className="stat-value" style={{ fontSize: '22px', fontWeight: '800', color: '#00D5FF', marginTop: '4px' }}>
              {totalTransactionsCount}
            </div>
            <div style={{ fontSize: '11px', color: '#8BA0BD', marginTop: '4px' }}>Audited entries</div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. DEBIT & CREDIT LEDGER TABLE */}
      {/* ============================================================ */}
      <div className="dashboard-card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '18px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WalletIcon size={18} style={{ color: '#00D5FF' }} />
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              Debit & Credit Ledger Entries
            </h3>
          </div>

          {/* Filter Pills: All / Credits / Debits */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Entries' },
              { id: 'credit', label: 'Credits Only (+)' },
              { id: 'debit', label: 'Debits Only (-)' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleTypeChange(t.id)}
                style={{
                  background: ledgerType === t.id ? '#087BFF' : '#071529',
                  color: ledgerType === t.id ? '#FFFFFF' : '#A9BDD7',
                  border: '1px solid #17385D',
                  borderRadius: '16px',
                  padding: '4px 14px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: ledgerType === t.id ? '700' : '400',
                  transition: 'all 0.2s'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Content */}
        {loadingLedger ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#A9BDD7' }}>
            <RefreshCwIcon size={24} className="animate-spin" style={{ margin: '0 auto 10px auto', color: '#00D5FF' }} />
            <div style={{ fontSize: '13px' }}>Loading ledger entries...</div>
          </div>
        ) : !ledgerRecords || ledgerRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#071426', margin: '20px', borderRadius: '12px', border: '1px dashed #17385D' }}>
            <p style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '700', margin: 0 }}>No Ledger Entries Found</p>
            <p style={{ color: '#8BA0BD', fontSize: '12px', margin: '4px 0 16px 0' }}>
              Transactions matching the selected filter ({ledgerType}) will appear here automatically.
            </p>
            <button
              onClick={() => setShowAddMoneyModal(true)}
              className="auth-button primary"
              style={{ width: 'auto', padding: '0 18px', height: '36px', fontSize: '12px', margin: '0 auto' }}
            >
              Add Money to Test Ledger
            </button>
          </div>
        ) : (
          <div className="table-responsive" style={{ padding: '0 10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #17385D', color: '#8BA0BD', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 14px' }}>Type</th>
                  <th style={{ padding: '12px 14px' }}>Description</th>
                  <th style={{ padding: '12px 14px' }}>Reference</th>
                  <th style={{ padding: '12px 14px' }}>Date & Time</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRecords.map((entry) => {
                  const isCredit = entry.entryType === 'credit';
                  return (
                    <tr
                      key={entry.id}
                      onClick={() => setSelectedLedgerEntry(entry)}
                      title="Click to view transaction receipt"
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s', cursor: 'pointer' }}
                    >
                      {/* Entry Type */}
                      <td style={{ padding: '14px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: isCredit ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
                            color: isCredit ? '#10B981' : '#EF4444',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '800',
                            textTransform: 'uppercase'
                          }}
                        >
                          {isCredit ? <ArrowDownLeftIcon size={12} /> : <ArrowUpRightIcon size={12} />}
                          {entry.entryType}
                        </span>
                      </td>

                      {/* Description */}
                      <td style={{ padding: '14px', color: '#FFFFFF', fontWeight: '600' }}>
                        {entry.description || (isCredit ? 'Wallet Top-up' : 'Wallet Debit Operation')}
                      </td>

                      {/* Reference */}
                      <td style={{ padding: '14px', color: '#00D5FF', fontFamily: 'monospace', fontSize: '12px' }}>
                        {entry.referenceNumber || (entry.referenceId ? `#REF-${entry.referenceId}` : `#TXN-${entry.id}`)}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px', color: '#8BA0BD', whiteSpace: 'nowrap' }}>
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-IN') : 'N/A'}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: '800', color: isCredit ? '#10B981' : '#EF4444', whiteSpace: 'nowrap' }}>
                        {isCredit ? '+' : '-'}{entry.formattedAmount || formatINR(entry.amount)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <span className="sidebar-badge green" style={{ fontSize: '10px' }}>
                          ● {entry.status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination?.totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  padding: '16px 14px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <span style={{ fontSize: '12px', color: '#8BA0BD' }}>
                  Showing Page {pagination.page} of {pagination.totalPages} ({pagination.totalRecords} records)
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    disabled={!pagination.hasPrevPage}
                    onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                    style={{
                      background: '#071426',
                      border: '1px solid #17385D',
                      color: pagination.hasPrevPage ? '#FFFFFF' : '#475569',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Previous
                  </button>
                  <button
                    disabled={!pagination.hasNextPage}
                    onClick={() => setLedgerPage((p) => p + 1)}
                    style={{
                      background: '#071426',
                      border: '1px solid #17385D',
                      color: pagination.hasNextPage ? '#FFFFFF' : '#475569',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 5. ADD MONEY MODAL (3-Step Real Process) */}
      {/* ============================================================ */}
      {typeof document !== 'undefined' && createPortal(
        <>
      {showAddMoneyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 13, 27, 0.94)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
        >
          <div
            className="dashboard-card"
            style={{
              width: '100%',
              maxWidth: '470px',
              padding: '24px',
              borderRadius: '20px',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(0, 213, 255, 0.15)',
                    color: '#00D5FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <PlusIcon size={20} strokeWidth={3} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    {addStep === 'receipt' ? 'Top-up Successful' : addStep === 'confirm' ? 'Confirm Wallet Top-up' : 'Add Money to Wallet'}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#8BA0BD', margin: '2px 0 0 0' }}>
                    {addStep === 'receipt' ? 'Credited to ApnaPay Escrow Ledger' : `Headroom: ${formatINR(depositHeadroom)}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddMoneyModal(false)}
                style={{ background: 'none', border: 'none', color: '#8BA0BD', cursor: 'pointer' }}
              >
                <XIcon size={20} />
              </button>
            </div>

            {addStep === 'form' && (
              <form onSubmit={handleAddMoneyReview}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#CFDFEE', marginBottom: '6px' }}>
                    Amount to Add (₹)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', fontWeight: '800', color: '#00D5FF', pointerEvents: 'none' }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="auth-input"
                      style={{ paddingLeft: '38px', fontSize: '18px', fontWeight: '800' }}
                      min="1"
                      max="100000"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Preset Amount Chips */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {['100', '500', '1000', '2000', '5000'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAddAmount(preset)}
                      style={{
                        background: addAmount === preset ? 'rgba(0, 213, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${addAmount === preset ? '#00D5FF' : 'rgba(255, 255, 255, 0.1)'}`,
                        color: addAmount === preset ? '#00D5FF' : '#CFDFEE',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      +₹{preset}
                    </button>
                  ))}
                </div>

                {/* Payment Method Selector */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#CFDFEE', marginBottom: '6px' }}>
                    Funding Source
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { id: 'UPI', label: 'Bharat UPI' },
                      { id: 'Linked Bank', label: 'Linked Bank' },
                      { id: 'Debit Card', label: 'Debit Card' },
                      { id: 'Net Banking', label: 'NetBanking' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.id);
                          setAddSourceDetail('');
                        }}
                        style={{
                          background: paymentMethod === m.id ? 'rgba(0, 213, 255, 0.15)' : '#071529',
                          border: `1px solid ${paymentMethod === m.id ? '#00D5FF' : '#17385D'}`,
                          color: paymentMethod === m.id ? '#00D5FF' : '#8BA0BD',
                          padding: '10px 8px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Source Details Input */}
                <div style={{ marginBottom: '16px' }}>
                  {paymentMethod === 'UPI' && (
                    <>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8BA0BD', marginBottom: '5px' }}>
                        Sender UPI ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={addSourceDetail}
                        onChange={(e) => setAddSourceDetail(e.target.value)}
                        placeholder={overview?.walletVpa || 'yourname@okaxis'}
                        className="auth-input"
                        style={{ height: '38px', fontSize: '13px' }}
                      />
                    </>
                  )}
                  {paymentMethod === 'Linked Bank' && (
                    <>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8BA0BD', marginBottom: '5px' }}>
                        Select Linked Bank Account
                      </label>
                      <select
                        value={addSourceDetail}
                        onChange={(e) => setAddSourceDetail(e.target.value)}
                        className="auth-input"
                        style={{ height: '40px', fontSize: '13px', cursor: 'pointer' }}
                      >
                        {linkedBanks.length > 0 ? (
                          linkedBanks.map((acc) => {
                            const name = acc.bankName || acc.bank_name;
                            const last4 = String(acc.accountNumber || acc.account_number || '').slice(-4);
                            const label = `${name} ••••${last4}`;
                            return <option key={acc.id} value={label}>{label}</option>;
                          })
                        ) : (
                          <>
                            <option value="HDFC Bank ••••4321">HDFC Bank ••••4321</option>
                            <option value="SBI ••••8910">State Bank of India ••••8910</option>
                          </>
                        )}
                      </select>
                    </>
                  )}
                  {paymentMethod === 'Debit Card' && (
                    <>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8BA0BD', marginBottom: '5px' }}>
                        Card Last 4 Digits (Demo)
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={addSourceDetail}
                        onChange={(e) => setAddSourceDetail(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 4829"
                        className="auth-input"
                        style={{ height: '38px', fontSize: '13px' }}
                      />
                    </>
                  )}
                  {paymentMethod === 'Net Banking' && (
                    <>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8BA0BD', marginBottom: '5px' }}>
                        Select Bank Portal
                      </label>
                      <select
                        value={addSourceDetail}
                        onChange={(e) => setAddSourceDetail(e.target.value)}
                        className="auth-input"
                        style={{ height: '40px', fontSize: '13px', cursor: 'pointer' }}
                      >
                        <option value="HDFC NetBanking">HDFC Bank NetBanking</option>
                        <option value="SBI YONO">State Bank of India</option>
                        <option value="ICICI iMobile">ICICI Bank</option>
                        <option value="Axis Bank">Axis Bank</option>
                      </select>
                    </>
                  )}
                </div>

                {addError && (
                  <div style={{ color: '#EF4444', fontSize: '12px', marginBottom: '14px', textAlign: 'center' }}>
                    {addError}
                  </div>
                )}

                <button
                  type="submit"
                  className="auth-button primary"
                  style={{
                    width: '100%',
                    height: '46px',
                    fontSize: '14px',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #00D5FF 0%, #0077FF 100%)',
                    color: '#050D1B'
                  }}
                >
                  {`Review Top-up of ₹${parseFloat(addAmount || 0).toLocaleString('en-IN')} →`}
                </button>
              </form>
            )}

            {addStep === 'confirm' && (
              <div>
                <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                    <span style={{ color: '#8BA0BD' }}>Top-up Amount</span>
                    <strong style={{ color: '#FFFFFF', fontSize: '15px' }}>{formatINR(addAmount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                    <span style={{ color: '#8BA0BD' }}>Payment Method</span>
                    <span style={{ color: '#00D5FF', fontWeight: '700' }}>{paymentMethod}{addSourceDetail ? ` (${addSourceDetail})` : ''}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                    <span style={{ color: '#8BA0BD' }}>Gateway Convenience Fee</span>
                    <span style={{ color: '#10B981', fontWeight: '700' }}>₹0.00 (FREE)</span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#A9BDD7' }}>New Wallet Balance</span>
                    <strong style={{ color: '#10B981' }}>{formatINR(parseFloat(rawBalance) + parseFloat(addAmount || 0))}</strong>
                  </div>
                </div>

                {addError && (
                  <div style={{ color: '#EF4444', fontSize: '12px', marginBottom: '14px', textAlign: 'center' }}>
                    {addError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setAddStep('form')}
                    className="auth-button secondary"
                    style={{ flex: 1, height: '44px', margin: 0 }}
                    disabled={isAddingMoney}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMoneyConfirm}
                    disabled={isAddingMoney}
                    className="auth-button primary"
                    style={{
                      flex: 2,
                      height: '44px',
                      margin: 0,
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #00D5FF 0%, #0077FF 100%)',
                      color: '#050D1B'
                    }}
                  >
                    {isAddingMoney ? <RefreshCwIcon size={18} className="animate-spin" /> : `Authorize & Pay ${formatINR(addAmount)}`}
                  </button>
                </div>
              </div>
            )}

            {addStep === 'receipt' && addReceipt && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <CheckCircleIcon size={30} />
                </div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#FFFFFF', marginBottom: '4px' }}>
                  +{formatINR(addReceipt.addedAmount)}
                </div>
                <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '700', marginBottom: '16px' }}>
                  ● Credited to ApnaPay Wallet
                </div>
                <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '12px', padding: '14px', textAlign: 'left', fontSize: '12px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#8BA0BD' }}>Reference ID</span>
                    <span style={{ color: '#00D5FF', fontFamily: 'monospace' }}>{addReceipt.referenceNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#8BA0BD' }}>UTR / Bank Ref</span>
                    <span style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>{addReceipt.utrNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#8BA0BD' }}>Method</span>
                    <span style={{ color: '#FFFFFF' }}>{addReceipt.sourceLabel || addReceipt.paymentMethod}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8BA0BD' }}>Updated Balance</span>
                    <strong style={{ color: '#10B981' }}>{formatINR(addReceipt.availableBalance)}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMoneyModal(false)}
                  className="auth-button primary"
                  style={{ width: '100%', height: '42px', fontWeight: '800', background: 'linear-gradient(135deg, #00D5FF 0%, #0077FF 100%)', color: '#050D1B' }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. WITHDRAW TO BANK MODAL (PhonePe-Inspired Real Process) */}
      {/* ============================================================ */}
      {showWithdrawModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 13, 27, 0.94)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
        >
          <div
            className="dashboard-card"
            style={{
              width: '100%',
              maxWidth: '470px',
              padding: withdrawStep === 'receipt' ? '0' : '24px',
              borderRadius: '20px',
              position: 'relative',
              maxHeight: '92vh',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
          >
            {withdrawStep !== 'receipt' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {withdrawStep === 'addBank' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setBankSearchQuery('');
                        setWithdrawStep('form');
                      }}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: '#071426',
                        border: '1px solid #17385D',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '700'
                      }}
                    >
                      ←
                    </button>
                  ) : (
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <BankIcon size={20} />
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                      {withdrawStep === 'addBank'
                        ? 'Add new bank account'
                        : withdrawStep === 'fetchingBank'
                        ? 'Fetching your account details'
                        : withdrawStep === 'bankAdded'
                        ? 'Account Added'
                        : withdrawStep === 'connecting'
                        ? 'Connecting Securely'
                        : withdrawStep === 'confirm'
                        ? 'Confirm Bank Settlement'
                        : 'Withdraw Money'}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#8BA0BD', margin: '2px 0 0 0' }}>
                      {withdrawStep === 'addBank'
                        ? 'Select or search your bank to link instantly'
                        : `Available balance: ${formatINR(rawBalance)}`}
                    </p>
                  </div>
                </div>
                {withdrawStep !== 'connecting' && withdrawStep !== 'fetchingBank' && (
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    style={{ background: 'none', border: 'none', color: '#8BA0BD', cursor: 'pointer' }}
                  >
                    <XIcon size={20} />
                  </button>
                )}
              </div>
            )}

            {withdrawStep === 'form' && (
              <form onSubmit={handleWithdrawReview}>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#CFDFEE' }}>
                      Amount
                    </label>
                    {rawBalance >= 1 && (
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount(String(Math.floor(rawBalance)))}
                        style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#10B981', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Withdraw Max
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', fontWeight: '800', color: '#10B981', pointerEvents: 'none' }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter Amount"
                      className="auth-input"
                      style={{ paddingLeft: '38px', fontSize: '18px', fontWeight: '800', height: '46px' }}
                      min="1"
                      max={rawBalance}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Withdraw to: Single Selected Linked Bank + Add new bank account */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#CFDFEE', marginBottom: '8px' }}>
                    Withdraw to
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Only ONE selected/primary linked bank shown here */}
                    <div
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid #10B981'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FFFFFF', color: '#087BFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: '900', fontSize: '12px' }}>
                          <BankIcon size={16} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {withdrawBank}
                          </div>
                          {withdrawBankIfsc && (
                            <div style={{ fontSize: '11px', color: '#8BA0BD' }}>IFSC: {withdrawBankIfsc} • Linked</div>
                          )}
                        </div>
                      </div>
                      <CheckCircleIcon size={20} style={{ color: '#10B981', flexShrink: 0 }} />
                    </div>

                    {/* Add new bank account > */}
                    <button
                      type="button"
                      onClick={() => {
                        setBankSearchQuery('');
                        setWithdrawError('');
                        setWithdrawStep('addBank');
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: '#071529',
                        border: '1px solid #17385D',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0, 213, 255, 0.12)', color: '#00D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <BankIcon size={16} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0' }}>
                          Add new bank account
                        </span>
                      </div>
                      <span style={{ color: '#8BA0BD', fontSize: '16px', fontWeight: '700' }}>›</span>
                    </button>
                  </div>
                </div>

                {/* Settlement Rail (Compact single row) */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { id: 'IMPS', label: 'IMPS Instant (24×7)', fee: '₹0 Fee' },
                      { id: 'NEFT', label: 'NEFT Standard', fee: '₹0 Fee' }
                    ].map((rail) => (
                      <button
                        key={rail.id}
                        type="button"
                        onClick={() => setTransferMode(rail.id)}
                        style={{
                          background: transferMode === rail.id ? 'rgba(16, 185, 129, 0.15)' : '#071529',
                          border: `1px solid ${transferMode === rail.id ? '#10B981' : '#17385D'}`,
                          color: transferMode === rail.id ? '#10B981' : '#8BA0BD',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div>{rail.label}</div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>{rail.fee}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Balance preview */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: '#8BA0BD',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>Balance after withdrawal:</span>
                  <strong style={{ color: '#FFFFFF' }}>
                    {formatINR(Math.max(0, rawBalance - parseFloat(withdrawAmount || 0)))}
                  </strong>
                </div>

                {withdrawError && (
                  <div style={{ color: '#EF4444', fontSize: '12px', marginBottom: '10px', textAlign: 'center' }}>
                    {withdrawError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={parseFloat(withdrawAmount || 0) < 1 || parseFloat(withdrawAmount || 0) > rawBalance}
                  className="auth-button primary"
                  style={{
                    width: '100%',
                    height: '44px',
                    fontSize: '14px',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    margin: 0
                  }}
                >
                  {`Withdraw Now • ₹${parseFloat(withdrawAmount || 0).toLocaleString('en-IN')}`}
                </button>
              </form>
            )}

            {/* ADD NEW BANK ACCOUNT PICKER (Search + Popular Banks + All Banks) */}
            {withdrawStep === 'addBank' && (() => {
              const q = bankSearchQuery.trim().toLowerCase();
              const filteredBanks = q
                ? ALL_INDIAN_BANKS.filter(
                    (b) =>
                      b.name.toLowerCase().includes(q) ||
                      (b.code && b.code.toLowerCase().includes(q)) ||
                      (b.aliases && b.aliases.some((a) => a.includes(q)))
                  )
                : ALL_INDIAN_BANKS;

              return (
                <div>
                  {/* Search by bank name */}
                  <div style={{ position: 'relative', marginBottom: '14px' }}>
                    <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#8BA0BD', fontSize: '14px', pointerEvents: 'none' }}>
                      🔍
                    </span>
                    <input
                      type="text"
                      value={bankSearchQuery}
                      onChange={(e) => setBankSearchQuery(e.target.value)}
                      placeholder="Search by bank name (e.g. SBI, HDFC, ICICI...)"
                      className="auth-input"
                      style={{ paddingLeft: '36px', paddingRight: '34px', height: '42px', fontSize: '13px' }}
                      autoFocus
                    />
                    {bankSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setBankSearchQuery('')}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8BA0BD', cursor: 'pointer', fontSize: '14px' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                    {/* Popular Banks 3x3 Grid when not searching */}
                    {!q && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#8BA0BD', letterSpacing: '0.6px', marginBottom: '10px', textTransform: 'uppercase' }}>
                          Popular Banks
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          {POPULAR_INDIAN_BANKS.map((pb) => (
                            <button
                              key={pb.name}
                              type="button"
                              onClick={() => handleSelectBankToLink(pb)}
                              style={{
                                background: '#071426',
                                border: '1px solid #17385D',
                                borderRadius: '12px',
                                padding: '10px 6px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                textAlign: 'center'
                              }}
                            >
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: pb.color,
                                  color: '#FFFFFF',
                                  fontSize: '10px',
                                  fontWeight: '800',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {pb.short}
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: '600', color: '#E2E8F0', lineHeight: '1.25' }}>
                                {pb.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Banks List */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#8BA0BD', letterSpacing: '0.6px', marginBottom: '8px', textTransform: 'uppercase' }}>
                        {q ? `Search Results (${filteredBanks.length})` : `All Banks (${ALL_INDIAN_BANKS.length})`}
                      </div>
                      {filteredBanks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 12px', color: '#8BA0BD', fontSize: '13px' }}>
                          No bank matching "{bankSearchQuery}". Try another name or IFSC code.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {filteredBanks.map((b) => (
                            <button
                              key={b.name}
                              type="button"
                              onClick={() => handleSelectBankToLink(b)}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                background: '#071426',
                                border: '1px solid rgba(23, 56, 93, 0.8)',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(0, 168, 255, 0.14)', color: '#00D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <BankIcon size={15} />
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF' }}>{b.name}</span>
                              </div>
                              <span style={{ fontSize: '11px', color: '#6B87A8', fontFamily: 'monospace' }}>{b.code}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* FETCHING ACCOUNT DETAILS STEP */}
            {withdrawStep === 'fetchingBank' && (
              <div style={{ textAlign: 'center', padding: '44px 16px' }}>
                <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'rgba(0, 168, 255, 0.15)', color: '#00D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <RefreshCwIcon size={28} className="animate-spin" />
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF' }}>
                  Fetching your account details...
                </div>
                <div style={{ fontSize: '12px', color: '#8BA0BD', marginTop: '6px' }}>
                  Verifying mobile-linked account with {fetchingBankName}
                </div>
              </div>
            )}

            {/* ACCOUNT ADDED SUCCESS STEP */}
            {withdrawStep === 'bankAdded' && addedBankInfo && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.18)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <CheckCircleIcon size={32} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', marginBottom: '4px' }}>
                  Account Added
                </div>
                <div style={{ fontSize: '12px', color: '#8BA0BD', marginBottom: '16px' }}>
                  All Set for Wallet Withdrawals & UPI Payments
                </div>

                <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '14px', padding: '14px', textAlign: 'left', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(0, 168, 255, 0.15)', color: '#00D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BankIcon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>
                        {addedBankInfo.bankName} - XX{addedBankInfo.accountLast4}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#8BA0BD' }}>
                        Saving Account • {addedBankInfo.accountHolderName}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#10B981', fontWeight: '600' }}>
                    ● IFSC: {addedBankInfo.ifscCode} • Ready for instant IMPS/NEFT
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setWithdrawStep('form')}
                  className="auth-button primary"
                  style={{
                    width: '100%',
                    height: '44px',
                    fontSize: '14px',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    margin: 0
                  }}
                >
                  Done
                </button>
              </div>
            )}

            {withdrawStep === 'confirm' && (
              <div>
                <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                    <span style={{ color: '#8BA0BD' }}>Withdrawal Amount</span>
                    <strong style={{ color: '#FFFFFF', fontSize: '15px' }}>{formatINR(withdrawAmount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                    <span style={{ color: '#8BA0BD' }}>Withdraw To</span>
                    <span style={{ color: '#FFFFFF', fontWeight: '700' }}>{withdrawBank}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                    <span style={{ color: '#8BA0BD' }}>Settlement Rail</span>
                    <span style={{ color: '#10B981', fontWeight: '700' }}>{transferMode} • Instant</span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#A9BDD7' }}>Remaining Wallet Balance</span>
                    <strong style={{ color: '#00D5FF' }}>{formatINR(Math.max(0, rawBalance - parseFloat(withdrawAmount || 0)))}</strong>
                  </div>
                </div>

                {withdrawError && (
                  <div style={{ color: '#EF4444', fontSize: '12px', marginBottom: '14px', textAlign: 'center' }}>
                    {withdrawError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setWithdrawStep('form')}
                    className="auth-button secondary"
                    style={{ flex: 1, height: '44px', margin: 0 }}
                    disabled={isWithdrawing}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleWithdrawConfirm}
                    disabled={isWithdrawing}
                    className="auth-button primary"
                    style={{
                      flex: 2,
                      height: '44px',
                      margin: 0,
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF'
                    }}
                  >
                    {`Confirm & Withdraw ${formatINR(withdrawAmount)}`}
                  </button>
                </div>
              </div>
            )}

            {withdrawStep === 'connecting' && (
              <div style={{ textAlign: 'center', padding: '44px 16px' }}>
                <RefreshCwIcon size={36} className="animate-spin" style={{ color: '#10B981', margin: '0 auto 14px' }} />
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF' }}>Connecting Securely...</div>
                <div style={{ fontSize: '12px', color: '#8BA0BD', marginTop: '6px' }}>
                  Settling {formatINR(withdrawAmount)} via {transferMode} to {withdrawBank}
                </div>
              </div>
            )}

            {withdrawStep === 'receipt' && withdrawReceipt && (
              <div>
                {/* Green PhonePe-style Success Header */}
                <div style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', padding: '26px 20px', textAlign: 'center' }}>
                  <div style={{ width: '58px', height: '58px', borderRadius: '50%', background: '#FFFFFF', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 8px 20px rgba(0,0,0,0.25)' }}>
                    <CheckCircleIcon size={34} />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF' }}>Withdrawal Successful</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.88)', marginTop: '4px' }}>
                    {new Date(withdrawReceipt.timestamp || Date.now()).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </div>
                </div>

                <div style={{ padding: '20px 24px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 213, 255, 0.14)', color: '#00D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <WalletIcon size={18} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>ApnaPay Wallet</span>
                    </div>
                    <strong style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF' }}>
                      {formatINR(withdrawReceipt.withdrawnAmount)}
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '10px 14px', fontSize: '12.5px', color: '#A7F3D0', marginBottom: '14px' }}>
                    Note: {formatINR(withdrawReceipt.withdrawnAmount)} has been transferred to your {withdrawReceipt.bankName}.
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowWithdrawDetails((v) => !v)}
                    style={{ width: '100%', background: '#071426', border: '1px solid #17385D', color: '#00D5FF', borderRadius: '10px', padding: '9px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', marginBottom: '14px' }}
                  >
                    {showWithdrawDetails ? 'Hide Details ▲' : 'View Details ▼'}
                  </button>

                  {showWithdrawDetails && (
                    <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '12px', padding: '14px', textAlign: 'left', fontSize: '12px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#8BA0BD' }}>Reference ID</span>
                        <span style={{ color: '#00D5FF', fontFamily: 'monospace' }}>{withdrawReceipt.referenceNumber}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#8BA0BD' }}>UTR Number</span>
                        <span style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>{withdrawReceipt.utrNumber}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#8BA0BD' }}>Credited To</span>
                        <span style={{ color: '#FFFFFF' }}>{withdrawReceipt.bankName}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8BA0BD' }}>Remaining Balance</span>
                        <strong style={{ color: '#10B981' }}>{formatINR(withdrawReceipt.availableBalance)}</strong>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="auth-button primary"
                    style={{ width: '100%', height: '42px', fontWeight: '800', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF', margin: 0 }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6B. WALLET TRANSFER MODAL (Wallet-to-Wallet Real Process) */}
      {/* ============================================================ */}
      {showTransferModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 13, 27, 0.94)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
        >
          <div
            className="dashboard-card"
            style={{
              width: '100%',
              maxWidth: '470px',
              padding: transferStep === 'receipt' ? '0' : '24px',
              borderRadius: '20px',
              position: 'relative',
              maxHeight: '92vh',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
          >
            {transferStep !== 'receipt' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(0, 168, 255, 0.15)',
                      color: '#00D5FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <SendIcon size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                      {transferStep === 'connecting' ? 'Connecting Securely' : transferStep === 'confirm' ? 'Confirm Wallet Transfer' : 'Wallet Transfer'}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#8BA0BD', margin: '2px 0 0 0' }}>
                      Wallet Balance: {formatINR(rawBalance)}
                    </p>
                  </div>
                </div>
                {transferStep !== 'connecting' && (
                  <button
                    onClick={() => setShowTransferModal(false)}
                    style={{ background: 'none', border: 'none', color: '#8BA0BD', cursor: 'pointer' }}
                  >
                    <XIcon size={20} />
                  </button>
                )}
              </div>
            )}

            {transferStep === 'form' && (
              <form onSubmit={handleTransferReview}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#CFDFEE', marginBottom: '6px' }}>
                    Recipient Mobile / @apnapay UPI / Wallet ID
                  </label>
                  <input
                    type="text"
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    placeholder="e.g. 9981280069 or user@apnapay or #WLT-29"
                    className="auth-input"
                    autoFocus
                  />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#CFDFEE' }}>
                      Amount (₹)
                    </label>
                    {rawBalance >= 1 && (
                      <button
                        type="button"
                        onClick={() => setTransferAmount(String(Math.floor(rawBalance)))}
                        style={{ background: 'rgba(0, 213, 255, 0.14)', border: '1px solid rgba(0, 213, 255, 0.35)', color: '#00D5FF', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Send Max
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', fontWeight: '800', color: '#00D5FF', pointerEvents: 'none' }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="Enter Amount"
                      className="auth-input"
                      style={{ paddingLeft: '38px', fontSize: '18px', fontWeight: '800', height: '46px' }}
                      min="1"
                      max={rawBalance > 0 ? rawBalance : undefined}
                    />
                  </div>
                </div>

                {/* Preset Chips */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {['50', '100', '500', '1000'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTransferAmount(preset)}
                      style={{
                        background: transferAmount === preset ? 'rgba(0, 213, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${transferAmount === preset ? '#00D5FF' : 'rgba(255, 255, 255, 0.1)'}`,
                        color: transferAmount === preset ? '#00D5FF' : '#CFDFEE',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#CFDFEE', marginBottom: '6px' }}>
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    placeholder="e.g. Dinner split, Wallet send"
                    className="auth-input"
                    style={{ height: '38px', fontSize: '13px' }}
                  />
                </div>

                {/* Balance preview */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: '#8BA0BD',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>Balance after transfer:</span>
                  <strong style={{ color: '#FFFFFF' }}>
                    {formatINR(Math.max(0, rawBalance - parseFloat(transferAmount || 0)))}
                  </strong>
                </div>

                {/* Insufficient balance helper with + Add Money shortcut */}
                {(rawBalance <= 0 || parseFloat(transferAmount || 0) > rawBalance) && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      fontSize: '12px',
                      color: '#FCA5A5'
                    }}
                  >
                    <span>
                      {rawBalance <= 0
                        ? 'Your wallet balance is ₹0.00. Add money to transfer.'
                        : `Insufficient balance (Available: ${formatINR(rawBalance)})`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTransferModal(false);
                        openAddMoneyModal();
                      }}
                      style={{
                        background: '#00D5FF',
                        color: '#050D1B',
                        border: 'none',
                        borderRadius: '7px',
                        padding: '5px 10px',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + Add Money
                    </button>
                  </div>
                )}

                {transferError && (
                  <div style={{ color: '#EF4444', fontSize: '12px', marginBottom: '12px', textAlign: 'center' }}>
                    {transferError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={parseFloat(transferAmount || 0) < 1 || parseFloat(transferAmount || 0) > rawBalance}
                  className="auth-button primary"
                  style={{
                    width: '100%',
                    height: '44px',
                    fontSize: '14px',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #00D5FF 0%, #0077FF 100%)',
                    color: '#050D1B',
                    margin: 0,
                    opacity: (parseFloat(transferAmount || 0) < 1 || parseFloat(transferAmount || 0) > rawBalance) ? 0.5 : 1
                  }}
                >
                  {`Transfer from Wallet • ₹${parseFloat(transferAmount || 0).toLocaleString('en-IN')}`}
                </button>
              </form>
            )}

            {transferStep === 'confirm' && (
              <div>
                <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                    <span style={{ color: '#8BA0BD' }}>Transfer Amount</span>
                    <strong style={{ color: '#FFFFFF', fontSize: '15px' }}>{formatINR(transferAmount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                    <span style={{ color: '#8BA0BD' }}>Recipient</span>
                    <span style={{ color: '#00D5FF', fontWeight: '700' }}>{transferRecipient}</span>
                  </div>
                  {transferNote && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                      <span style={{ color: '#8BA0BD' }}>Note</span>
                      <span style={{ color: '#FFFFFF' }}>{transferNote}</span>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#A9BDD7' }}>Remaining Wallet Balance</span>
                    <strong style={{ color: '#10B981' }}>{formatINR(Math.max(0, rawBalance - parseFloat(transferAmount || 0)))}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setTransferStep('form')}
                    className="auth-button secondary"
                    style={{ flex: 1, height: '44px', margin: 0 }}
                    disabled={isTransferring}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleTransferConfirm}
                    disabled={isTransferring}
                    className="auth-button primary"
                    style={{
                      flex: 2,
                      height: '44px',
                      margin: 0,
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #00D5FF 0%, #0077FF 100%)',
                      color: '#050D1B'
                    }}
                  >
                    {`Confirm & Send ${formatINR(transferAmount)}`}
                  </button>
                </div>
              </div>
            )}

            {transferStep === 'connecting' && (
              <div style={{ textAlign: 'center', padding: '44px 16px' }}>
                <RefreshCwIcon size={36} className="animate-spin" style={{ color: '#00D5FF', margin: '0 auto 14px' }} />
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF' }}>Connecting Securely...</div>
                <div style={{ fontSize: '12px', color: '#8BA0BD', marginTop: '6px' }}>
                  Transferring {formatINR(transferAmount)} from ApnaPay Wallet to {transferRecipient}
                </div>
              </div>
            )}

            {transferStep === 'receipt' && transferReceipt && (
              <div>
                <div style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', padding: '26px 20px', textAlign: 'center' }}>
                  <div style={{ width: '58px', height: '58px', borderRadius: '50%', background: '#FFFFFF', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 8px 20px rgba(0,0,0,0.25)' }}>
                    <CheckCircleIcon size={34} />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF' }}>Wallet Transfer Successful</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.88)', marginTop: '4px' }}>
                    {new Date(transferReceipt.timestamp || Date.now()).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </div>
                </div>

                <div style={{ padding: '20px 24px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 213, 255, 0.14)', color: '#00D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <WalletIcon size={18} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>ApnaPay Wallet</span>
                    </div>
                    <strong style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF' }}>
                      {formatINR(transferReceipt.transferredAmount)}
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '10px 14px', fontSize: '12.5px', color: '#A7F3D0', marginBottom: '14px' }}>
                    Note: {formatINR(transferReceipt.transferredAmount)} transferred to {transferReceipt.recipient}.
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTransferDetails((v) => !v)}
                    style={{ width: '100%', background: '#071426', border: '1px solid #17385D', color: '#00D5FF', borderRadius: '10px', padding: '9px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', marginBottom: '14px' }}
                  >
                    {showTransferDetails ? 'Hide Details ▲' : 'View Details ▼'}
                  </button>

                  {showTransferDetails && (
                    <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '12px', padding: '14px', textAlign: 'left', fontSize: '12px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#8BA0BD' }}>Reference ID</span>
                        <span style={{ color: '#00D5FF', fontFamily: 'monospace' }}>{transferReceipt.referenceNumber}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#8BA0BD' }}>UTR Number</span>
                        <span style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>{transferReceipt.utrNumber}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#8BA0BD' }}>Recipient</span>
                        <span style={{ color: '#FFFFFF' }}>{transferReceipt.recipient}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8BA0BD' }}>Remaining Balance</span>
                        <strong style={{ color: '#10B981' }}>{formatINR(transferReceipt.availableBalance)}</strong>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="auth-button primary"
                    style={{ width: '100%', height: '42px', fontWeight: '800', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF', margin: 0 }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. WALLET MY QR MODAL */}
      {/* ============================================================ */}
      {showQrModal && (() => {
        const walletVpa = overview?.walletVpa || `wallet${overview?.walletId || '29'}@apnapay`;
        const ownerName = overview?.ownerName || 'ApnaPay Wallet User';
        const amtNum = parseFloat(qrRequestAmount);
        const upiUri = `upi://pay?pa=${encodeURIComponent(walletVpa)}&pn=${encodeURIComponent(ownerName)}${amtNum > 0 ? `&am=${amtNum}` : ''}&cu=INR&tn=${encodeURIComponent('ApnaPay Wallet')}`;
        const qrMatrix = buildQrMatrix(upiUri);

        const handleDownloadQr = () => {
          const svgEl = document.getElementById('apnapay-wallet-qr-svg');
          if (!svgEl) return;
          const serializer = new XMLSerializer();
          const source = serializer.serializeToString(svgEl);
          const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `ApnaPay-Wallet-QR-${overview?.walletId || '29'}.svg`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
        };

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(5, 13, 27, 0.94)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '16px'
            }}
          >
            <div
              className="dashboard-card"
              style={{
                width: '100%',
                maxWidth: '420px',
                padding: '24px',
                borderRadius: '22px',
                textAlign: 'center',
                maxHeight: '92vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <QrCodeIcon size={20} style={{ color: '#00D5FF' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    My Wallet QR Code
                  </h3>
                </div>
                <button
                  onClick={() => setShowQrModal(false)}
                  style={{ background: 'none', border: 'none', color: '#8BA0BD', cursor: 'pointer' }}
                >
                  <XIcon size={20} />
                </button>
              </div>

              <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF' }}>{ownerName}</div>
              <div style={{ fontSize: '12px', color: '#8BA0BD', marginBottom: '14px' }}>
                Wallet A/C: #WLT-{overview?.walletId || '29'} • Receive directly into Wallet
              </div>

              {/* Scannable QR Card */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '18px',
                  padding: '18px',
                  width: '230px',
                  margin: '0 auto 14px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
                }}
              >
                <svg
                  id="apnapay-wallet-qr-svg"
                  viewBox="0 0 23 23"
                  width="194"
                  height="194"
                  style={{ display: 'block', margin: '0 auto' }}
                >
                  <rect width="23" height="23" fill="#FFFFFF" />
                  {qrMatrix.map((row, r) =>
                    row.map((cell, c) =>
                      cell ? (
                        <rect key={`${r}-${c}`} x={c + 1} y={r + 1} width="1" height="1" fill="#050D1B" />
                      ) : null
                    )
                  )}
                </svg>
                <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: '800', color: '#087BFF', letterSpacing: '0.5px' }}>
                  APNAPAY BHARAT QR {amtNum > 0 ? `• ₹${amtNum.toLocaleString('en-IN')}` : ''}
                </div>
              </div>

              {/* VPA Pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#071426',
                  border: '1px solid #17385D',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  marginBottom: '14px'
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#00D5FF' }}>{walletVpa}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(walletVpa);
                    setQrCopied(true);
                    setTimeout(() => setQrCopied(false), 2000);
                  }}
                  style={{ background: 'none', border: 'none', color: qrCopied ? '#10B981' : '#A9BDD7', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700' }}
                >
                  <CopyIcon size={14} />
                  <span>{qrCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              {/* Optional Request Amount */}
              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8BA0BD', marginBottom: '5px' }}>
                  Set Request Amount (Optional ₹)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={qrRequestAmount}
                  onChange={(e) => setQrRequestAmount(e.target.value)}
                  placeholder="Leave blank for any amount"
                  className="auth-input"
                  style={{ height: '38px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="auth-button primary"
                  style={{
                    flex: 1,
                    height: '40px',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    margin: 0,
                    background: 'linear-gradient(135deg, #00D5FF 0%, #0077FF 100%)',
                    color: '#050D1B'
                  }}
                >
                  Download QR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQrModal(false);
                    navigate('/app/qr');
                  }}
                  className="auth-button secondary"
                  style={{ flex: 1, height: '40px', fontSize: '12.5px', fontWeight: '700', margin: 0 }}
                >
                  Scan & Pay QR
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================ */}
      {/* 8. LEDGER ENTRY RECEIPT MODAL */}
      {/* ============================================================ */}
      {selectedLedgerEntry && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 13, 27, 0.94)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
        >
          <div className="dashboard-card" style={{ width: '100%', maxWidth: '420px', padding: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>Ledger Entry Receipt</h3>
              <button onClick={() => setSelectedLedgerEntry(null)} style={{ background: 'none', border: 'none', color: '#8BA0BD', cursor: 'pointer' }}>
                <XIcon size={20} />
              </button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '26px', fontWeight: '900', color: selectedLedgerEntry.entryType === 'credit' ? '#10B981' : '#EF4444' }}>
                {selectedLedgerEntry.entryType === 'credit' ? '+' : '-'}{selectedLedgerEntry.formattedAmount || formatINR(selectedLedgerEntry.amount)}
              </div>
              <div style={{ fontSize: '12px', color: '#8BA0BD', marginTop: '4px' }}>
                {selectedLedgerEntry.description || 'Wallet Ledger Entry'}
              </div>
            </div>
            <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '12px', padding: '14px', fontSize: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8BA0BD' }}>Entry Type</span>
                <span style={{ color: '#FFFFFF', textTransform: 'uppercase', fontWeight: '700' }}>{selectedLedgerEntry.entryType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8BA0BD' }}>Reference</span>
                <span style={{ color: '#00D5FF', fontFamily: 'monospace' }}>
                  {selectedLedgerEntry.referenceNumber || (selectedLedgerEntry.referenceId ? `#REF-${selectedLedgerEntry.referenceId}` : `#TXN-${selectedLedgerEntry.id}`)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8BA0BD' }}>Date & Time</span>
                <span style={{ color: '#FFFFFF' }}>
                  {selectedLedgerEntry.createdAt ? new Date(selectedLedgerEntry.createdAt).toLocaleString('en-IN') : 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8BA0BD' }}>Status</span>
                <span style={{ color: '#10B981', fontWeight: '700', textTransform: 'uppercase' }}>{selectedLedgerEntry.status || 'completed'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLedgerEntry(null)}
              className="auth-button secondary"
              style={{ width: '100%', height: '40px', margin: 0 }}
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
        </>,
        document.body
      )}
    </DashboardLayout>
  );
};

export default CustomerWalletPage;
