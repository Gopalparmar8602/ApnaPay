import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';

function LandIllustration() {
  return (
    <svg viewBox="0 0 180 120" style={{ width: '100%', maxWidth: '170px', height: 'auto' }} aria-hidden="true">
      <defs>
        <linearGradient id="apnaLandGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#00D5FF" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <rect x="16" y="18" width="148" height="84" rx="14" fill="rgba(16, 185, 129, 0.12)" stroke="rgba(16, 185, 129, 0.35)" />
      {/* Isometric Digital Land Parcels */}
      <polygon points="90,30 140,54 90,78 40,54" fill="url(#apnaLandGrad)" opacity="0.88" />
      <polygon points="90,78 140,54 140,68 90,92" fill="#059669" opacity="0.9" />
      <polygon points="40,54 90,78 90,92 40,68" fill="#047857" opacity="0.9" />
      {/* Parcel Grid Lines */}
      <line x1="65" y1="42" x2="115" y2="66" stroke="#ECFDF5" strokeWidth="1.2" strokeOpacity="0.55" />
      <line x1="115" y1="42" x2="65" y2="66" stroke="#ECFDF5" strokeWidth="1.2" strokeOpacity="0.55" />
      {/* Pin Marker */}
      <circle cx="90" cy="46" r="6" fill="#FFFFFF" />
      <circle cx="90" cy="46" r="2.5" fill="#10B981" />
    </svg>
  );
}

function SipIllustration() {
  return (
    <svg viewBox="0 0 180 120" style={{ width: '100%', maxWidth: '170px', height: 'auto' }} aria-hidden="true">
      <defs>
        <linearGradient id="apnaSipArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#0099FF" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="16" y="18" width="148" height="84" rx="14" fill="rgba(168, 85, 247, 0.12)" stroke="rgba(168, 85, 247, 0.35)" />
      {/* Bars */}
      <rect x="36" y="72" width="14" height="18" rx="4" fill="#38BDF8" opacity="0.55" />
      <rect x="60" y="60" width="14" height="30" rx="4" fill="#60A5FA" opacity="0.7" />
      <rect x="84" y="48" width="14" height="42" rx="4" fill="#818CF8" opacity="0.85" />
      <rect x="108" y="36" width="14" height="54" rx="4" fill="#A855F7" />
      <rect x="132" y="26" width="14" height="64" rx="4" fill="#10B981" />
      {/* Growth Curve */}
      <polygon points="38,76 67,62 91,50 115,36 139,26 139,90 38,90" fill="url(#apnaSipArea)" />
      <polyline points="38,76 67,62 91,50 115,36 139,26" fill="none" stroke="#E9D5FF" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="139" cy="26" r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
    </svg>
  );
}

function QrIllustration() {
  return (
    <svg viewBox="0 0 180 120" style={{ width: '100%', maxWidth: '170px', height: 'auto' }} aria-hidden="true">
      <rect x="16" y="18" width="148" height="84" rx="14" fill="rgba(0, 213, 255, 0.1)" stroke="rgba(0, 213, 255, 0.3)" />
      {/* Scanner Frame */}
      <path d="M56 36 H46 V46 M124 36 H134 V46 M56 84 H46 V74 M124 84 H134 V74" fill="none" stroke="#00D5FF" strokeWidth="3" strokeLinecap="round" />
      <rect x="64" y="42" width="18" height="18" rx="3" fill="none" stroke="#FFFFFF" strokeWidth="2.2" />
      <rect x="70" y="48" width="6" height="6" fill="#00D5FF" />
      <rect x="98" y="42" width="18" height="18" rx="3" fill="none" stroke="#FFFFFF" strokeWidth="2.2" />
      <rect x="104" y="48" width="6" height="6" fill="#00D5FF" />
      <rect x="64" y="66" width="18" height="14" rx="2" fill="#38BDF8" opacity="0.65" />
      <rect x="92" y="66" width="24" height="6" rx="2" fill="#FFFFFF" opacity="0.7" />
      <line x1="48" y1="60" x2="132" y2="60" stroke="#00D5FF" strokeWidth="2" strokeDasharray="4 3" />
    </svg>
  );
}

function BillsIllustration() {
  return (
    <svg viewBox="0 0 180 120" style={{ width: '100%', maxWidth: '170px', height: 'auto' }} aria-hidden="true">
      <rect x="16" y="18" width="148" height="84" rx="14" fill="rgba(245, 158, 11, 0.1)" stroke="rgba(245, 158, 11, 0.3)" />
      <rect x="44" y="34" width="38" height="52" rx="8" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.8" />
      <circle cx="63" cy="54" r="9" fill="rgba(56,189,248,0.2)" />
      <polygon points="64,47 58,56 63,56 61,62 68,53 63,53" fill="#38BDF8" />
      <rect x="94" y="34" width="44" height="22" rx="6" fill="rgba(245, 158, 11, 0.22)" stroke="#F59E0B" strokeWidth="1.4" />
      <rect x="94" y="64" width="44" height="22" rx="6" fill="rgba(16, 185, 129, 0.22)" stroke="#10B981" strokeWidth="1.4" />
    </svg>
  );
}

export default function PromoCarousel({ onNavigate, onOpenScanQr }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);

  const slides = [
    {
      id: 'digital-land',
      badge: 'ApnaPay Exclusive • Demo',
      title: 'Own a Piece of Digital Land',
      subtitle: 'Explore demo land investment projects and discover a new investment experience.',
      cta: 'Explore Digital Land',
      accent: '#10B981',
      bg: 'linear-gradient(135deg, #062825 0%, #0B1933 55%, #071326 100%)',
      border: 'rgba(16, 185, 129, 0.35)',
      ctaBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      ctaColor: '#FFFFFF',
      illustration: <LandIllustration />,
      onAction: () => onNavigate('/app/land')
    },
    {
      id: 'sip-wealth',
      badge: 'Featured Wealth • Demo',
      title: 'Build Your Wealth with SIP',
      subtitle: 'Explore funds and start your demo SIP journey with flexible monthly investment options.',
      cta: 'Start a SIP',
      accent: '#A855F7',
      bg: 'linear-gradient(135deg, #27124A 0%, #0F1D3A 55%, #071326 100%)',
      border: 'rgba(168, 85, 247, 0.4)',
      ctaBg: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
      ctaColor: '#FFFFFF',
      illustration: <SipIllustration />,
      onAction: () => onNavigate('/app/sip?start=1')
    },
    {
      id: 'scan-qr',
      badge: 'Quick Payment',
      title: 'Pay Instantly with QR',
      subtitle: 'Explore the ApnaPay QR payment experience with camera & UPI scan.',
      cta: 'Scan & Pay',
      accent: '#00D5FF',
      bg: 'linear-gradient(135deg, #072A49 0%, #0B1933 60%, #071326 100%)',
      border: 'rgba(0, 213, 255, 0.35)',
      ctaBg: 'linear-gradient(135deg, #00D5FF 0%, #0077FF 100%)',
      ctaColor: '#050D1B',
      illustration: <QrIllustration />,
      onAction: () => onOpenScanQr?.()
    },
    {
      id: 'bills-recharge',
      badge: 'Utility Services',
      title: 'Your Bills, One Place',
      subtitle: 'Explore mobile recharge and BBPS bill payment services seamlessly.',
      cta: 'Pay Bills',
      accent: '#F59E0B',
      bg: 'linear-gradient(135deg, #2C1E0B 0%, #0B1933 58%, #071326 100%)',
      border: 'rgba(245, 158, 11, 0.35)',
      ctaBg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      ctaColor: '#FFFFFF',
      illustration: <BillsIllustration />,
      onAction: () => onNavigate('/app/bills')
    }
  ];

  // Auto-rotation every 6 seconds unless paused or reduced-motion preferred
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (paused || prefersReduced) return;

    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  const goPrev = () => {
    setPaused(true);
    setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setPaused(true);
    setActiveIdx((prev) => (prev + 1) % slides.length);
  };

  const current = slides[activeIdx];

  return (
    <section
      aria-label="ApnaPay Featured Promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches?.[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const endX = e.changedTouches?.[0]?.clientX ?? touchStartX.current;
        const diff = touchStartX.current - endX;
        if (diff > 40) goNext();
        else if (diff < -40) goPrev();
        touchStartX.current = null;
      }}
      style={{
        position: 'relative',
        background: current.bg,
        border: `1px solid ${current.border}`,
        borderRadius: '18px',
        padding: '18px 20px',
        marginBottom: '20px',
        overflow: 'hidden',
        transition: 'background 0.35s ease, border-color 0.35s ease'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        {/* Left Promotional Copy + CTA */}
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', border: `1px solid ${current.border}`, fontSize: '10.5px', fontWeight: 700, color: current.accent, marginBottom: '8px' }}>
            <Sparkles size={11} />
            <span>{current.badge}</span>
          </div>

          <h2 style={{ margin: '0 0 6px', fontSize: 'clamp(17px, 2.2vw, 22px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.25 }}>
            {current.title}
          </h2>
          <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#CBD5E1', lineHeight: 1.45, maxWidth: '520px' }}>
            {current.subtitle}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={current.onAction}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 18px',
                borderRadius: '10px',
                background: current.ctaBg,
                border: 'none',
                color: current.ctaColor,
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(0,0,0,0.25)'
              }}
            >
              <span>{current.cta}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Right Illustration */}
        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto'
          }}
        >
          {current.illustration}
        </div>
      </div>

      {/* Bottom Controls: Dots + Prev/Next */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} role="tablist" aria-label="Promotional slides">
          {slides.map((s, idx) => {
            const active = idx === activeIdx;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Show ${s.title}`}
                onClick={() => {
                  setPaused(true);
                  setActiveIdx(idx);
                }}
                style={{
                  width: active ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '999px',
                  border: 'none',
                  padding: 0,
                  background: active ? current.accent : 'rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
              />
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous promotional slide"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(11, 18, 34, 0.7)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next promotional slide"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(11, 18, 34, 0.7)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
