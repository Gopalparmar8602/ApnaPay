import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  ShieldIcon,
  ShieldCheckIcon,
  PlusIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  QrCodeIcon,
  CopyIcon,
  BankIcon,
  LandmarkIcon,
  XIcon,
  CheckIcon,
  TrashIcon,
  HistoryIcon,
  ArrowRightIcon,
  SettingsIcon
} from '../../components/Icons';
import upiService from '../../services/upiService';
import bankAccountService from '../../services/bankAccountService';
import transactionService from '../../services/transactionService';

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(Number(val) || 0);

const CustomerUpiPage = () => {
  const navigate = useNavigate();
  const [upiHandles, setUpiHandles] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [recentUpiTxns, setRecentUpiTxns] = useState([]);
  const [supportedSuffixes, setSupportedSuffixes] = useState(['@apnapay', '@apnabank', '@upi']);
  const [loading, setLoading] = useState(true);

  // Register Modal
  const [showModal, setShowModal] = useState(false);
  const [handlePrefix, setHandlePrefix] = useState('');
  const [selectedSuffix, setSelectedSuffix] = useState('@apnapay');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Action states
  const [qrModalHandle, setQrModalHandle] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [settingPrimaryUpiId, setSettingPrimaryUpiId] = useState(null);
  const [settingPrimaryBankId, setSettingPrimaryBankId] = useState(null);

  // Demo UI preferences (persisted locally for demo UX)
  const [collectRequestsEnabled, setCollectRequestsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('apnapay_upi_collect_demo');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [instantAlertsEnabled, setInstantAlertsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('apnapay_upi_alerts_demo');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  // Banner feedback
  const [bannerSuccess, setBannerSuccess] = useState('');
  const [bannerError, setBannerError] = useState('');

  // Delete Modal
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setBannerError('');
    try {
      const [upiRes, banksRes, txnsRes] = await Promise.allSettled([
        upiService.getUpiHandles(),
        bankAccountService.getLinkedAccounts(),
        transactionService.getTransactions({ limit: 6 })
      ]);

      if (upiRes.status === 'fulfilled') {
        setUpiHandles(upiRes.value?.data || []);
        if (upiRes.value?.availableSuffixes?.length) {
          setSupportedSuffixes(upiRes.value.availableSuffixes);
        }
      } else {
        setBannerError(upiRes.reason?.response?.data?.message || 'Unable to load UPI handles.');
      }

      if (banksRes.status === 'fulfilled') {
        setBankAccounts(banksRes.value?.data || []);
      }

      if (txnsRes.status === 'fulfilled') {
        const list = txnsRes.value?.data?.transactions || txnsRes.value?.data || [];
        setRecentUpiTxns(Array.isArray(list) ? list.slice(0, 6) : []);
      }
    } catch (err) {
      setBannerError(err?.response?.data?.message || err?.message || 'Unable to load UPI data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const primaryUpi = upiHandles.find((h) => h.isPrimary) || upiHandles[0] || null;
  const primaryBank = bankAccounts.find((b) => b.isPrimary) || bankAccounts[0] || null;
  const activeHandlesCount = upiHandles.filter((h) => h.status === 'active').length;

  const openRegisterModal = () => {
    setHandlePrefix('');
    setSelectedSuffix(supportedSuffixes[0] || '@apnapay');
    setSelectedBankId(primaryBank?.id ? String(primaryBank.id) : '');
    setIsPrimary(upiHandles.length === 0);
    setFormError('');
    setShowModal(true);
  };

  const handleRegisterUpi = async (e) => {
    e.preventDefault();
    setFormError('');
    setBannerSuccess('');

    const clean = handlePrefix.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    if (!clean || clean.length < 3) {
      setFormError('Handle prefix must be at least 3 characters (letters, numbers, dot, dash, underscore).');
      return;
    }

    const fullUpiId = `${clean}${selectedSuffix}`;
    if (upiHandles.some((h) => h.upiId?.toLowerCase() === fullUpiId && h.status === 'active')) {
      setFormError(`"${fullUpiId}" is already in your active UPI IDs.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await upiService.createUpiHandle({
        upiId: fullUpiId,
        bankAccountId: selectedBankId ? Number(selectedBankId) : undefined,
        isPrimary
      });

      setBannerSuccess(res?.message || `UPI ID ${fullUpiId} created successfully!`);
      setShowModal(false);
      await loadData();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to register UPI ID.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPrimaryUpi = async (handle) => {
    if (!handle || handle.isPrimary) return;
    setSettingPrimaryUpiId(handle.id);
    setBannerError('');
    setBannerSuccess('');
    try {
      const res = await upiService.setPrimaryUpiHandle(handle.id);
      setBannerSuccess(res?.message || `${handle.upiId} set as your default UPI ID.`);
      await loadData();
    } catch (err) {
      setBannerError(err?.response?.data?.message || 'Unable to update default UPI ID.');
    } finally {
      setSettingPrimaryUpiId(null);
    }
  };

  const handleSetPrimaryBank = async (bank) => {
    if (!bank || bank.isPrimary) return;
    setSettingPrimaryBankId(bank.id);
    setBannerError('');
    setBannerSuccess('');
    try {
      const res = await bankAccountService.setPrimaryAccount(bank.id);
      setBannerSuccess(res?.message || `${bank.bankName} set as your default bank account.`);
      await loadData();
    } catch (err) {
      setBannerError(err?.response?.data?.message || 'Unable to update default bank account.');
    } finally {
      setSettingPrimaryBankId(null);
    }
  };

  const copyToClipboard = (text, id) => {
    if (!text || !navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteModal) return;
    setIsDeleting(true);
    setBannerError('');
    setBannerSuccess('');
    try {
      const res = await upiService.deleteUpiHandle(confirmDeleteModal.id);
      setBannerSuccess(res?.message || `UPI ID ${confirmDeleteModal.upiId} removed successfully.`);
      setConfirmDeleteModal(null);
      await loadData();
    } catch (err) {
      setBannerError(err?.response?.data?.message || err?.message || 'Failed to remove UPI ID.');
      setConfirmDeleteModal(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBack = () => {
    if (confirmDeleteModal) {
      setConfirmDeleteModal(null);
      return;
    }
    if (showModal) {
      setShowModal(false);
      return;
    }
    if (qrModalHandle) {
      setQrModalHandle(null);
      return;
    }
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/app');
    }
  };

  return (
    <DashboardLayout
      title="UPI Services"
      subtitle="Manage your UPI IDs, default VPA, linked bank accounts, and UPI preferences"
      backFallback="/app"
      onBack={handleBack}
      onRefresh={loadData}
    >
      {/* Top Action Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '18px'
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              UPI Management Hub
            </h2>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: '700',
                padding: '3px 9px',
                borderRadius: '999px',
                background: 'rgba(0, 213, 255, 0.14)',
                border: '1px solid rgba(0, 213, 255, 0.35)',
                color: '#00D5FF'
              }}
            >
              DEMO MODE
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#A9BDD7', margin: '3px 0 0' }}>
            Manage your virtual payment addresses and settlement bank routing securely.
          </p>
        </div>

        <button
          type="button"
          onClick={openRegisterModal}
          className="auth-button"
          style={{
            width: 'auto',
            padding: '0 18px',
            height: '40px',
            fontSize: '13px',
            margin: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <PlusIcon size={16} />
          <span>Create UPI ID</span>
        </button>
      </div>

      {/* Feedback Alerts */}
      {bannerSuccess && (
        <div className="auth-alert success" style={{ marginBottom: '16px' }}>
          <CheckCircleIcon size={16} />
          <span>{bannerSuccess}</span>
        </div>
      )}
      {bannerError && (
        <div className="auth-alert error" style={{ marginBottom: '16px' }}>
          <AlertCircleIcon size={16} />
          <span>{bannerError}</span>
        </div>
      )}

      {/* 1. Summary Strip (UPI Status, Default UPI, Default Bank, Active Count) */}
      <div className="upi-summary-grid">
        <div className="dashboard-card" style={{ margin: 0, padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#6B87A8', fontWeight: '700', textTransform: 'uppercase' }}>
            UPI Status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: activeHandlesCount > 0 ? '#00E599' : '#F59E0B',
                boxShadow: activeHandlesCount > 0 ? '0 0 8px #00E599' : 'none',
                flexShrink: 0
              }}
            />
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF' }}>
              {activeHandlesCount > 0 ? 'Active (Demo)' : 'Setup Pending'}
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '4px' }}>
            {activeHandlesCount} active UPI {activeHandlesCount === 1 ? 'ID' : 'IDs'}
          </div>
        </div>

        <div className="dashboard-card" style={{ margin: 0, padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#6B87A8', fontWeight: '700', textTransform: 'uppercase' }}>
            Default UPI ID
          </div>
          <div
            style={{
              fontSize: '14.5px',
              fontWeight: '800',
              color: '#00D5FF',
              marginTop: '8px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={primaryUpi?.upiId || 'Not set'}
          >
            {primaryUpi ? primaryUpi.upiId : 'No default VPA'}
          </div>
          <div style={{ marginTop: '6px' }}>
            {primaryUpi ? (
              <button
                type="button"
                onClick={() => copyToClipboard(primaryUpi.upiId, 'summary-upi')}
                style={{
                  background: 'rgba(0, 168, 255, 0.12)',
                  border: '1px solid rgba(0, 168, 255, 0.3)',
                  color: '#00D5FF',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copiedId === 'summary-upi' ? <CheckIcon size={11} /> : <CopyIcon size={11} />}
                <span>{copiedId === 'summary-upi' ? 'Copied' : 'Copy Default ID'}</span>
              </button>
            ) : (
              <span style={{ fontSize: '11.5px', color: '#A9BDD7' }}>Create a UPI ID to begin</span>
            )}
          </div>
        </div>

        <div className="dashboard-card" style={{ margin: 0, padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#6B87A8', fontWeight: '700', textTransform: 'uppercase' }}>
            Default Bank Account
          </div>
          <div
            style={{
              fontSize: '14.5px',
              fontWeight: '800',
              color: '#FFFFFF',
              marginTop: '8px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {primaryBank ? primaryBank.bankName : 'No Bank Linked'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#00E599', marginTop: '4px', fontWeight: '600' }}>
            {primaryBank
              ? `A/c •••• ${primaryBank.accountLast4 || primaryBank.maskedAccountNumber?.slice(-4) || 'XXXX'}`
              : 'Link a bank for settlements'}
          </div>
        </div>

        <div className="dashboard-card" style={{ margin: 0, padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#6B87A8', fontWeight: '700', textTransform: 'uppercase' }}>
            Linked Accounts
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', marginTop: '6px' }}>
            {bankAccounts.length}
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/banks')}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              color: '#00A8FF',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '4px'
            }}
          >
            <span>Manage Banks</span>
            <ArrowRightIcon size={12} />
          </button>
        </div>
      </div>

      {/* Main 2x2 Responsive Grid Layout */}
      <div className="upi-main-layout">
        {/* ROW 1, COL 1: MY UPI IDS */}
        <div className="dashboard-card" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', alignSelf: 'start' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(0, 168, 255, 0.14)',
                    color: '#00D5FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ShieldIcon size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    My UPI IDs ({upiHandles.length})
                  </h3>
                  <p style={{ fontSize: '12px', color: '#A9BDD7', margin: 0 }}>
                    Copy, set default, view QR or remove your registered VPAs
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#A9BDD7', fontSize: '13.5px' }}>
                Loading your UPI IDs...
              </div>
            ) : upiHandles.length === 0 ? (
              <div
                style={{
                  background: '#071426',
                  border: '1px dashed #214C7C',
                  borderRadius: '12px',
                  padding: '32px 20px',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'rgba(0, 168, 255, 0.12)',
                    border: '1px solid rgba(0, 168, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: '#00D5FF'
                  }}
                >
                  <ShieldIcon size={24} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: '0 0 6px' }}>
                  No UPI IDs Found
                </h4>
                <p style={{ fontSize: '13px', color: '#A9BDD7', maxWidth: '380px', margin: '0 auto 16px' }}>
                  Create your demo @apnapay UPI ID to start receiving payments and generating QR codes.
                </p>
                <button
                  type="button"
                  onClick={openRegisterModal}
                  className="auth-button"
                  style={{ width: 'auto', padding: '0 20px', height: '38px', fontSize: '13px', margin: '0 auto' }}
                >
                  + Create Your First UPI ID
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                {upiHandles.map((handle) => {
                  const isActive = handle.status === 'active';
                  return (
                    <div
                      key={handle.id}
                      style={{
                        background: handle.isPrimary
                          ? 'linear-gradient(135deg, rgba(0, 229, 153, 0.08) 0%, rgba(7, 20, 38, 0.95) 100%)'
                          : '#071426',
                        border: `1.5px solid ${handle.isPrimary ? '#00E599' : '#17385D'}`,
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '16px',
                              fontWeight: '800',
                              color: '#00D5FF',
                              wordBreak: 'break-all'
                            }}
                          >
                            {handle.upiId}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#A9BDD7', marginTop: '4px', flexWrap: 'wrap' }}>
                            <BankIcon size={13} style={{ color: '#00A8FF', flexShrink: 0 }} />
                            {handle.bankName ? (
                              <span>
                                {handle.bankName} <strong style={{ color: '#FFFFFF' }}>(••••{handle.accountLast4})</strong>
                              </span>
                            ) : (
                              <span style={{ color: '#F59E0B' }}>Default settlement account</span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: isActive ? 'rgba(0, 229, 153, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                              color: isActive ? '#00E599' : '#F59E0B',
                              border: `1px solid ${isActive ? 'rgba(0, 229, 153, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`
                            }}
                          >
                            {isActive ? 'ACTIVE' : String(handle.status || 'INACTIVE').toUpperCase()}
                          </span>

                          {handle.isPrimary && (
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: '800',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: 'rgba(8, 123, 255, 0.2)',
                                color: '#00D5FF',
                                border: '1px solid rgba(0, 213, 255, 0.4)'
                              }}
                            >
                              DEFAULT VPA
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div
                        style={{
                          paddingTop: '10px',
                          borderTop: '1px solid rgba(23, 56, 93, 0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(handle.upiId, handle.id)}
                            className="auth-button secondary"
                            style={{
                              width: 'auto',
                              padding: '0 10px',
                              height: '32px',
                              fontSize: '11.5px',
                              margin: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            {copiedId === handle.id ? (
                              <>
                                <CheckIcon size={12} style={{ color: '#00E599' }} />
                                <span style={{ color: '#00E599' }}>Copied!</span>
                              </>
                            ) : (
                              <>
                                <CopyIcon size={12} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setQrModalHandle(handle)}
                            className="auth-button secondary"
                            style={{
                              width: 'auto',
                              padding: '0 10px',
                              height: '32px',
                              fontSize: '11.5px',
                              margin: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <QrCodeIcon size={13} />
                            <span>QR Code</span>
                          </button>

                          {!handle.isPrimary && isActive && (
                            <button
                              type="button"
                              disabled={settingPrimaryUpiId === handle.id}
                              onClick={() => handleSetPrimaryUpi(handle)}
                              style={{
                                height: '32px',
                                padding: '0 10px',
                                borderRadius: '8px',
                                background: 'rgba(0, 168, 255, 0.12)',
                                border: '1px solid rgba(0, 168, 255, 0.35)',
                                color: '#00D5FF',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              {settingPrimaryUpiId === handle.id ? 'Updating...' : 'Set Default'}
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setConfirmDeleteModal(handle)}
                          className="auth-button secondary"
                          title="Remove UPI ID"
                          style={{
                            width: 'auto',
                            padding: '0 10px',
                            height: '32px',
                            fontSize: '11.5px',
                            margin: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#EF4444',
                            borderColor: 'rgba(239, 68, 68, 0.35)'
                          }}
                        >
                          <TrashIcon size={13} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        {/* ROW 1, COL 2: LINKED BANK ACCOUNTS */}
        <div className="dashboard-card" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', alignSelf: 'start' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              marginBottom: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '9px',
                  background: 'rgba(0, 229, 153, 0.14)',
                  color: '#00E599',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <LandmarkIcon size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  Linked Bank Accounts
                </h3>
                <p style={{ fontSize: '12px', color: '#A9BDD7', margin: 0 }}>
                  Select your default settlement account
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#A9BDD7', fontSize: '13px' }}>
              Loading linked bank accounts...
            </div>
          ) : bankAccounts.length === 0 ? (
            <div
              style={{
                background: '#071426',
                border: '1px dashed #214C7C',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{ fontSize: '13px', color: '#A9BDD7', marginBottom: '12px' }}>
                No verified bank account linked yet.
              </div>
              <button
                type="button"
                onClick={() => navigate('/app/banks')}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 16px', height: '34px', fontSize: '12px', margin: '0 auto' }}
              >
                Link Bank Account
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
              {bankAccounts.map((bank) => {
                const last4 = bank.accountLast4 || bank.maskedAccountNumber?.slice(-4) || 'XXXX';
                return (
                  <div
                    key={bank.id}
                    style={{
                      background: '#071426',
                      border: `1px solid ${bank.isPrimary ? '#00A8FF' : '#17385D'}`,
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#FFFFFF' }}>
                        {bank.bankName}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>
                        A/c ••••••••{last4} • <span style={{ color: '#00E599', textTransform: 'capitalize' }}>{bank.status || 'active'}</span>
                      </div>
                    </div>

                    {bank.isPrimary ? (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          color: '#00E599',
                          background: 'rgba(0, 229, 153, 0.14)',
                          border: '1px solid rgba(0, 229, 153, 0.35)',
                          padding: '3px 8px',
                          borderRadius: '999px'
                        }}
                      >
                        DEFAULT
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={settingPrimaryBankId === bank.id}
                        onClick={() => handleSetPrimaryBank(bank)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '8px',
                          background: 'rgba(0, 168, 255, 0.12)',
                          border: '1px solid rgba(0, 168, 255, 0.35)',
                          color: '#00D5FF',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {settingPrimaryBankId === bank.id ? 'Saving...' : 'Set Default'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ROW 2, COL 1: RECENT PAYMENT ACTIVITY */}
        <div className="dashboard-card" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '9px',
                  background: 'rgba(8, 123, 255, 0.14)',
                  color: '#00A8FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <HistoryIcon size={17} />
              </div>
              <div>
                <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  Recent Payment Activity
                </h3>
                <p style={{ fontSize: '12px', color: '#A9BDD7', margin: 0 }}>
                  Latest transactions from your ApnaPay ledger
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/app/transactions')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00D5FF',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>View All</span>
              <ArrowRightIcon size={13} />
            </button>
          </div>

          {recentUpiTxns.length === 0 ? (
            <div
              style={{
                background: '#071426',
                border: '1px solid #17385D',
                borderRadius: '10px',
                padding: '24px 18px',
                textAlign: 'center',
                fontSize: '12.5px',
                color: '#A9BDD7',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              No recent UPI or transfer transactions yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentUpiTxns.map((tx, idx) => {
                const isCredit = tx.entryType === 'credit';
                const displayAmt = tx.formattedAmount || `${isCredit ? '+' : '-'}${formatINR(tx.amount)}`;
                const dateVal = tx.createdAt || tx.created_at;
                return (
                  <div
                    key={tx.id || idx}
                    style={{
                      background: '#071426',
                      border: '1px solid #17385D',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tx.description || tx.transactionType || 'Transaction'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B87A8', marginTop: '2px' }}>
                        {dateVal ? new Date(dateVal).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'} •{' '}
                        <span style={{ color: '#A9BDD7', textTransform: 'capitalize' }}>{tx.paymentMethod || 'wallet'}</span> •{' '}
                        <span style={{ color: tx.status === 'completed' || tx.status === 'success' ? '#00E599' : '#A9BDD7', textTransform: 'capitalize' }}>
                          {tx.status || 'completed'}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: '800', color: isCredit ? '#00E599' : '#FFFFFF', flexShrink: 0 }}>
                      {displayAmt}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ROW 2, COL 2: UPI SETTINGS */}
        <div className="dashboard-card" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '9px',
                  background: 'rgba(168, 85, 247, 0.14)',
                  color: '#C084FC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <SettingsIcon size={17} />
              </div>
              <div>
                <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  UPI Settings
                </h3>
                <p style={{ fontSize: '12px', color: '#A9BDD7', margin: 0 }}>
                  Demo preferences &amp; security info
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label
                style={{
                  background: '#071426',
                  border: '1px solid #17385D',
                  borderRadius: '10px',
                  padding: '11px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>
                    Allow UPI Collect Requests
                  </div>
                  <div style={{ fontSize: '11px', color: '#A9BDD7' }}>
                    Demo preference for incoming payment requests
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={collectRequestsEnabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setCollectRequestsEnabled(val);
                    try { localStorage.setItem('apnapay_upi_collect_demo', String(val)); } catch { }
                  }}
                  style={{ accentColor: '#00A8FF', width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </label>

              <label
                style={{
                  background: '#071426',
                  border: '1px solid #17385D',
                  borderRadius: '10px',
                  padding: '11px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>
                    Instant VPA Credit Alerts
                  </div>
                  <div style={{ fontSize: '11px', color: '#A9BDD7' }}>
                    Notify when a new UPI ID or transfer completes
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={instantAlertsEnabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setInstantAlertsEnabled(val);
                    try { localStorage.setItem('apnapay_upi_alerts_demo', String(val)); } catch { }
                  }}
                  style={{ accentColor: '#00A8FF', width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </label>

              <div
                style={{
                  background: 'rgba(0, 168, 255, 0.08)',
                  border: '1px solid rgba(0, 168, 255, 0.25)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '11.5px',
                  color: '#A9BDD7',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  lineHeight: '1.45'
                }}
              >
                <ShieldCheckIcon size={16} style={{ color: '#00D5FF', flexShrink: 0, marginTop: '1px' }} />
                <span>
                  <strong style={{ color: '#FFFFFF' }}>Demo UPI Environment:</strong> All UPI IDs and bank routing are simulated locally in ApnaPay. Real NPCI transactions and real bank UPI PINs are not processed.
                </span>
              </div>
            </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: REGISTER NEW UPI HANDLE                         */}
      {/* ======================================================== */}
      {showModal &&
        createPortal(
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 10000 }} onClick={() => setShowModal(false)}>
            <div
              className="modal-content"
              style={{ maxWidth: '460px', width: 'min(460px, calc(100vw - 24px))' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '6px', background: 'rgba(0, 213, 255, 0.12)', borderRadius: '8px', color: '#00D5FF' }}>
                    <ShieldIcon size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16.5px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                      Create UPI ID (Demo)
                    </h3>
                    <p style={{ fontSize: '12px', color: '#A9BDD7', margin: 0 }}>
                      Choose a unique virtual payment address
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#A9BDD7', cursor: 'pointer' }}
                >
                  <XIcon size={20} />
                </button>
              </div>

              <div className="modal-body">
                {formError && (
                  <div className="auth-alert error" style={{ marginBottom: '16px' }}>
                    <AlertCircleIcon size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterUpi} noValidate>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#A9BDD7', marginBottom: '6px' }}>
                      Desired Handle Prefix
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. gopal, myname, mobile"
                        value={handlePrefix}
                        onChange={(e) => setHandlePrefix(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                        style={{ flex: '1 1 0%', minWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                        required
                        autoFocus
                      />
                      <select
                        value={selectedSuffix}
                        onChange={(e) => setSelectedSuffix(e.target.value)}
                        style={{
                          flexShrink: 0,
                          background: '#0B1B32',
                          border: '1px solid #17385D',
                          borderLeft: 'none',
                          color: '#00A8FF',
                          fontWeight: '700',
                          fontSize: '13px',
                          padding: '11px 12px',
                          borderRadius: '0 10px 10px 0',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        {supportedSuffixes.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B87A8', marginTop: '6px' }}>
                      Preview: <strong style={{ color: '#00D5FF' }}>{handlePrefix || 'yourname'}{selectedSuffix}</strong>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#A9BDD7', marginBottom: '6px' }}>
                      Link Settlement Bank Account
                    </label>
                    <select
                      className="form-input"
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                    >
                      <option value="">Default (Primary Active Bank Account)</option>
                      {bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} (••••{b.accountLast4}) {b.isPrimary ? '★ Default' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#FFFFFF' }}>
                      <input
                        type="checkbox"
                        checked={isPrimary}
                        onChange={(e) => setIsPrimary(e.target.checked)}
                        style={{ accentColor: '#00A8FF', width: '15px', height: '15px' }}
                      />
                      <span>Set as default UPI ID</span>
                    </label>
                  </div>

                  <div className="modal-footer" style={{ padding: 0 }}>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="auth-button secondary"
                      style={{ width: 'auto', padding: '0 16px', height: '40px', fontSize: '13px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !handlePrefix.trim()}
                      className="auth-button"
                      style={{ width: 'auto', padding: '0 22px', height: '40px', fontSize: '13px' }}
                    >
                      {isSubmitting ? 'Creating...' : 'Create UPI ID'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ======================================================== */}
      {/* MODAL 2: QR CODE PREVIEW                                 */}
      {/* ======================================================== */}
      {qrModalHandle &&
        createPortal(
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 10000 }} onClick={() => setQrModalHandle(null)}>
            <div
              className="modal-content"
              style={{ maxWidth: '380px', width: 'min(380px, calc(100vw - 24px))', textAlign: 'center' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                  UPI QR Code (Demo)
                </h3>
                <button
                  type="button"
                  onClick={() => setQrModalHandle(null)}
                  style={{ background: 'transparent', border: 'none', color: '#A9BDD7', cursor: 'pointer' }}
                >
                  <XIcon size={18} />
                </button>
              </div>

              <div className="modal-body" style={{ padding: '22px 20px' }}>
                <div
                  style={{
                    width: '190px',
                    height: '190px',
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '14px',
                    margin: '0 auto 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                  }}
                >
                  <QrCodeIcon size={135} style={{ color: '#050D1B' }} />
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#087BFF', marginTop: '4px' }}>
                    ApnaPay UPI
                  </span>
                </div>

                <div style={{ fontSize: '15px', fontWeight: '800', color: '#00D5FF', wordBreak: 'break-all' }}>
                  {qrModalHandle.upiId}
                </div>
                <p style={{ fontSize: '12px', color: '#A9BDD7', margin: '6px 0 16px' }}>
                  Demo QR representation for receiving funds via your ApnaPay VPA.
                </p>

                <button
                  type="button"
                  onClick={() => copyToClipboard(qrModalHandle.upiId, 'modal')}
                  className="auth-button"
                  style={{ width: '100%', height: '38px', fontSize: '13px', margin: 0 }}
                >
                  {copiedId === 'modal' ? 'Copied to Clipboard!' : 'Copy UPI ID'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ======================================================== */}
      {/* MODAL 3: CONFIRM DELETE UPI HANDLE                       */}
      {/* ======================================================== */}
      {confirmDeleteModal &&
        createPortal(
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 10000 }} onClick={() => setConfirmDeleteModal(null)}>
            <div
              className="modal-card"
              style={{ maxWidth: '420px', width: 'min(420px, calc(100vw - 24px))', textAlign: 'center' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#EF4444' }}>
                <TrashIcon size={22} />
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#FFFFFF', marginBottom: '8px' }}>
                Remove UPI ID?
              </h3>

              <p style={{ fontSize: '13px', color: '#A9BDD7', marginBottom: '14px', lineHeight: '1.5' }}>
                Are you sure you want to remove <strong style={{ color: '#00D5FF' }}>{confirmDeleteModal.upiId}</strong>?
              </p>

              {confirmDeleteModal.isPrimary && (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#FCD34D', textAlign: 'left', marginBottom: '14px' }}>
                  Note: Removing your default UPI ID will automatically promote another active UPI ID as default.
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteModal(null)}
                  className="auth-button secondary"
                  style={{ flex: 1, margin: 0, height: '38px', fontSize: '13px' }}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="auth-button"
                  style={{ flex: 1, margin: 0, height: '38px', fontSize: '13px', background: '#EF4444', borderColor: '#EF4444' }}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Removing...' : 'Confirm Remove'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </DashboardLayout>
  );
};

export default CustomerUpiPage;
