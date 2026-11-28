import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lock, ShieldCheck, X, Delete, CheckCircle2, KeyRound, RefreshCw } from 'lucide-react';
import mpinService from '../services/mpinService';

/**
 * Reusable 4-digit masked dot display + optional numeric keypad.
 */
export function MpinDigitBoxes({ value = '', onChange, error = false, label, autoFocus = false, showKeypad = true }) {
  const digits = value.replace(/\D/g, '').slice(0, 4);

  const handleDigit = (d) => {
    if (digits.length < 4) onChange(digits + d);
  };
  const handleBackspace = () => {
    if (digits.length > 0) onChange(digits.slice(0, -1));
  };
  const handleClear = () => onChange('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 700, color: '#CFDFEE', textAlign: 'center' }}>
          {label}
        </label>
      )}

      {/* 4 Masked Dot Boxes + hidden keyboard input for seamless typing */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
          maxLength={4}
          value={digits}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
          aria-label={label || '4-digit MPIN'}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            cursor: 'pointer',
            zIndex: 2
          }}
        />
        {[0, 1, 2, 3].map((idx) => {
          const filled = idx < digits.length;
          const active = idx === digits.length;
          return (
            <div
              key={idx}
              style={{
                width: '50px',
                height: '52px',
                borderRadius: '12px',
                background: '#071426',
                border: `1.5px solid ${error ? '#EF4444' : active || filled ? '#00D5FF' : '#17385D'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: active ? '0 0 0 3px rgba(0, 213, 255, 0.14)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {filled ? (
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#00D5FF',
                    boxShadow: '0 0 8px rgba(0, 213, 255, 0.6)'
                  }}
                />
              ) : (
                <span style={{ width: '8px', height: '2px', background: '#334155', borderRadius: '2px' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Numeric Keypad */}
      {showKeypad && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            maxWidth: '250px',
            margin: '4px auto 0',
            width: '100%'
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              style={{
                height: '40px',
                borderRadius: '10px',
                background: '#071529',
                border: '1px solid #17385D',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            style={{
              height: '40px',
              borderRadius: '10px',
              background: '#071529',
              border: '1px solid #17385D',
              color: '#94A3B8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            CLR
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            style={{
              height: '40px',
              borderRadius: '10px',
              background: '#071529',
              border: '1px solid #17385D',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            style={{
              height: '40px',
              borderRadius: '10px',
              background: '#071529',
              border: '1px solid #17385D',
              color: '#F87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Delete size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Centralized 4-digit MPIN Modal supporting:
 *  - mode="set"     : First-time Set MPIN + Confirm MPIN
 *  - mode="verify"  : Payment Authorization MPIN entry (returns mpin via onSuccess(mpin))
 *  - mode="change"  : Current MPIN -> New MPIN -> Confirm MPIN
 *  - mode="forgot"  : OTP -> New MPIN -> Confirm MPIN
 */
export default function MpinModal({
  open,
  initialMode = 'verify',
  title,
  subtitle,
  summaryRows = [],
  actionLabel,
  onClose,
  onSuccess
}) {
  const [mode, setMode] = useState(initialMode); // 'set' | 'verify' | 'change' | 'forgot'
  const [setStep, setSetStep] = useState('enter'); // 'enter' | 'confirm'
  const [mpin, setMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [currentMpin, setCurrentMpin] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSentMsg, setOtpSentMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [lockSeconds, setLockSeconds] = useState(0);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setSetStep('enter');
      setMpin('');
      setConfirmMpin('');
      setCurrentMpin('');
      setOtp('');
      setOtpSentMsg('');
      setError('');
      setSuccessMsg('');
      setLockSeconds(0);
      if (initialMode === 'verify' || initialMode === 'change') {
        mpinService.getStatus().then((res) => {
          const st = res?.data;
          if (st?.isLocked && st?.remainingSeconds > 0) {
            setLockSeconds(Number(st.remainingSeconds));
            setError('Too many incorrect MPIN attempts. Payment authorization is locked.');
          }
        }).catch(() => {});
      }
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (!open || lockSeconds <= 0) return;
    const t = setInterval(() => {
      setLockSeconds((prev) => {
        if (prev <= 1) {
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [open, lockSeconds]);

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!open) return null;

  const handleSetNext = (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{4}$/.test(mpin)) {
      setError('Please enter a 4-digit numeric MPIN.');
      return;
    }
    setConfirmMpin('');
    setSetStep('confirm');
  };

  const handleSetSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!/^\d{4}$/.test(confirmMpin)) {
      setError('Please confirm your 4-digit MPIN.');
      return;
    }
    if (mpin !== confirmMpin) {
      setError('MPIN and Confirm MPIN do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await mpinService.setMpin(mpin, confirmMpin);
      setSuccessMsg(res?.message || '4-digit Payment MPIN activated!');
      setTimeout(() => {
        onSuccess?.(mpin, res?.data);
      }, 650);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to set MPIN.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (loading || lockSeconds > 0) return;
    setError('');
    if (!/^\d{4}$/.test(mpin)) {
      setError('Please enter your 4-digit Payment MPIN.');
      return;
    }
    // Pass MPIN up to caller (or verify standalone if caller has no backend payment endpoint)
    setLoading(true);
    try {
      await onSuccess?.(mpin);
    } catch (err) {
      const respData = err?.response?.data;
      if (err?.response?.status === 423 || respData?.code === 'MPIN_LOCKED' || respData?.isLocked) {
        const secs = Number(respData?.remainingSeconds) || 900;
        setLockSeconds(secs);
      }
      setError(respData?.message || err?.message || 'Incorrect MPIN.');
      setMpin('');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!/^\d{4}$/.test(currentMpin) || !/^\d{4}$/.test(mpin) || !/^\d{4}$/.test(confirmMpin)) {
      setError('All MPIN fields must be exactly 4 numeric digits.');
      return;
    }
    if (mpin !== confirmMpin) {
      setError('New MPIN and Confirm MPIN do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await mpinService.changeMpin(currentMpin, mpin, confirmMpin);
      setSuccessMsg(res?.message || 'Payment MPIN changed successfully!');
      setTimeout(() => {
        onSuccess?.(mpin, res?.data);
      }, 750);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to change MPIN.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotOtp = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await mpinService.forgotMpin();
      setOtpSentMsg(res?.message || 'OTP sent to your registered email/mobile.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    if (!/^\d{4}$/.test(mpin) || mpin !== confirmMpin) {
      setError('New 4-digit MPIN and Confirm MPIN must match.');
      return;
    }
    setLoading(true);
    try {
      const res = await mpinService.resetMpin(otp, mpin, confirmMpin);
      setSuccessMsg(res?.message || 'Payment MPIN reset successfully!');
      setTimeout(() => {
        onSuccess?.(mpin, res?.data);
      }, 750);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset MPIN.');
    } finally {
      setLoading(false);
    }
  };

  const modalHeading =
    title ||
    (mode === 'set'
      ? setStep === 'confirm'
        ? 'Confirm 4-Digit MPIN'
        : 'Set 4-Digit Payment MPIN'
      : mode === 'change'
      ? 'Change Payment MPIN'
      : mode === 'forgot'
      ? 'Reset Forgotten MPIN'
      : 'Enter 4-Digit Payment MPIN');

  const modalSub =
    subtitle ||
    (mode === 'set'
      ? 'Set one common 4-digit PIN for Wallet & all ApnaPay payments'
      : mode === 'change'
      ? 'Verify your current MPIN to set a new one'
      : mode === 'forgot'
      ? 'Verify OTP sent to your registered email/mobile'
      : 'Authorize securely with your ApnaPay MPIN');

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 13, 27, 0.92)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '16px'
      }}
    >
      <div
        className="dashboard-card"
        style={{
          width: '100%',
          maxWidth: '430px',
          padding: '22px',
          borderRadius: '20px',
          background: '#0B162C',
          border: '1px solid rgba(0, 213, 255, 0.22)',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(0, 213, 255, 0.14)',
                color: '#00D5FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {mode === 'set' ? <ShieldCheck size={19} /> : mode === 'forgot' ? <KeyRound size={19} /> : <Lock size={19} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>{modalHeading}</h3>
              <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#8BA0BD' }}>{modalSub}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{ background: 'none', border: 'none', color: '#8BA0BD', cursor: 'pointer' }}
          >
            <X size={19} />
          </button>
        </div>

        {/* Optional payment summary */}
        {summaryRows.length > 0 && mode === 'verify' && (
          <div
            style={{
              background: '#071426',
              border: '1px solid #17385D',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '14px',
              fontSize: '12.5px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            {summaryRows.map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8BA0BD' }}>{row.label}</span>
                <strong style={{ color: row.highlight ? '#10B981' : '#FFFFFF' }}>{row.value}</strong>
              </div>
            ))}
          </div>
        )}

        {successMsg ? (
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <CheckCircle2 size={44} color="#10B981" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>{successMsg}</div>
          </div>
        ) : (
          <>
            {/* MODE: SET MPIN */}
            {mode === 'set' && setStep === 'enter' && (
              <form onSubmit={handleSetNext} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <MpinDigitBoxes
                  value={mpin}
                  onChange={setMpin}
                  error={Boolean(error)}
                  label="Enter New 4-Digit MPIN"
                  autoFocus
                />
                {error && <div style={{ color: '#F87171', fontSize: '12px', textAlign: 'center', fontWeight: 600 }}>{error}</div>}
                <button
                  type="submit"
                  disabled={mpin.length !== 4}
                  className="auth-button primary"
                  style={{
                    width: '100%',
                    height: '44px',
                    fontWeight: 800,
                    background: mpin.length === 4 ? 'linear-gradient(135deg, #00D5FF 0%, #0077FF 100%)' : '#1E293B',
                    color: mpin.length === 4 ? '#050D1B' : '#64748B'
                  }}
                >
                  Continue to Confirm MPIN →
                </button>
              </form>
            )}

            {mode === 'set' && setStep === 'confirm' && (
              <form onSubmit={handleSetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <MpinDigitBoxes
                  value={confirmMpin}
                  onChange={setConfirmMpin}
                  error={Boolean(error)}
                  label="Re-enter 4-Digit MPIN to Confirm"
                  autoFocus
                />
                {error && <div style={{ color: '#F87171', fontSize: '12px', textAlign: 'center', fontWeight: 600 }}>{error}</div>}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSetStep('enter');
                      setConfirmMpin('');
                      setError('');
                    }}
                    className="auth-button secondary"
                    style={{ flex: 1, height: '44px', margin: 0 }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || confirmMpin.length !== 4}
                    className="auth-button primary"
                    style={{
                      flex: 2,
                      height: '44px',
                      margin: 0,
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF'
                    }}
                  >
                    {loading ? 'Saving MPIN...' : 'Save & Activate MPIN'}
                  </button>
                </div>
              </form>
            )}

            {/* MODE: VERIFY MPIN */}
            {mode === 'verify' && (
              <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <MpinDigitBoxes
                  value={mpin}
                  onChange={setMpin}
                  error={Boolean(error)}
                  label="Enter Your 4-Digit MPIN"
                  autoFocus
                />
                {lockSeconds > 0 && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      textAlign: 'center',
                      fontSize: '12px',
                      color: '#FCA5A5',
                      fontWeight: 700
                    }}
                  >
                    MPIN Locked • Retry in {formatCountdown(lockSeconds)}
                  </div>
                )}
                {error && <div style={{ color: '#F87171', fontSize: '12px', textAlign: 'center', fontWeight: 600 }}>{error}</div>}
                <div style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError('');
                      setMpin('');
                      setConfirmMpin('');
                    }}
                    style={{ background: 'none', border: 'none', color: '#00D5FF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Forgot MPIN?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading || lockSeconds > 0 || mpin.length !== 4}
                  className="auth-button primary"
                  style={{
                    width: '100%',
                    height: '44px',
                    fontWeight: 800,
                    background: lockSeconds > 0 || mpin.length !== 4 ? '#1E293B' : 'linear-gradient(135deg, #00D5FF 0%, #0077FF 100%)',
                    color: lockSeconds > 0 || mpin.length !== 4 ? '#64748B' : '#050D1B'
                  }}
                >
                  {lockSeconds > 0
                    ? `Locked (${formatCountdown(lockSeconds)})`
                    : loading
                    ? 'Verifying...'
                    : actionLabel || 'Verify & Authorize'}
                </button>
              </form>
            )}

            {/* MODE: CHANGE MPIN */}
            {mode === 'change' && (
              <form onSubmit={handleChangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CFDFEE', marginBottom: '4px' }}>
                    Current 4-Digit MPIN
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    maxLength={4}
                    value={currentMpin}
                    onChange={(e) => setCurrentMpin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="auth-input"
                    style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '0.35em', fontWeight: 800, WebkitTextSecurity: 'disc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CFDFEE', marginBottom: '4px' }}>
                    New 4-Digit MPIN
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    maxLength={4}
                    value={mpin}
                    onChange={(e) => setMpin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="auth-input"
                    style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '0.35em', fontWeight: 800, WebkitTextSecurity: 'disc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CFDFEE', marginBottom: '4px' }}>
                    Confirm New MPIN
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    maxLength={4}
                    value={confirmMpin}
                    onChange={(e) => setConfirmMpin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="auth-input"
                    style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '0.35em', fontWeight: 800, WebkitTextSecurity: 'disc' }}
                  />
                </div>
                {error && <div style={{ color: '#F87171', fontSize: '12px', textAlign: 'center', fontWeight: 600 }}>{error}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError('');
                    }}
                    style={{ background: 'none', border: 'none', color: '#00D5FF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Forgot current MPIN?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="auth-button primary"
                  style={{
                    width: '100%',
                    height: '44px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #00D5FF 0%, #0077FF 100%)',
                    color: '#050D1B'
                  }}
                >
                  {loading ? 'Updating...' : 'Update Payment MPIN'}
                </button>
              </form>
            )}

            {/* MODE: FORGOT / RESET MPIN */}
            {mode === 'forgot' && (
              <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    background: '#071426',
                    border: '1px solid #17385D',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#CBD5E1' }}>
                    {otpSentMsg || 'Request a 6-digit OTP to your registered email / phone.'}
                  </span>
                  <button
                    type="button"
                    onClick={handleSendForgotOtp}
                    disabled={loading}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      background: 'rgba(0, 213, 255, 0.16)',
                      border: '1px solid rgba(0, 213, 255, 0.35)',
                      color: '#00D5FF',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {otpSentMsg ? 'Resend' : 'Send OTP'}
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CFDFEE', marginBottom: '4px' }}>
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit OTP"
                    className="auth-input"
                    style={{ textAlign: 'center', fontSize: '16px', letterSpacing: '0.25em', fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CFDFEE', marginBottom: '4px' }}>
                    New 4-Digit MPIN
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    maxLength={4}
                    value={mpin}
                    onChange={(e) => setMpin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="auth-input"
                    style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '0.35em', fontWeight: 800, WebkitTextSecurity: 'disc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CFDFEE', marginBottom: '4px' }}>
                    Confirm New MPIN
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    maxLength={4}
                    value={confirmMpin}
                    onChange={(e) => setConfirmMpin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="auth-input"
                    style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '0.35em', fontWeight: 800, WebkitTextSecurity: 'disc' }}
                  />
                </div>
                {error && <div style={{ color: '#F87171', fontSize: '12px', textAlign: 'center', fontWeight: 600 }}>{error}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="auth-button primary"
                  style={{
                    width: '100%',
                    height: '44px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF'
                  }}
                >
                  {loading ? 'Resetting...' : 'Verify OTP & Reset MPIN'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
