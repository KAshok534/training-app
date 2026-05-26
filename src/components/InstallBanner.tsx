/**
 * InstallBanner — editorial PWA install prompt.
 *
 * Bottom sheet shown on mobile after 1.5s, three variants:
 *   - AndroidInstallSheet  : native beforeinstallprompt is available
 *   - AndroidManualSheet   : fallback Chrome menu instructions
 *   - IOSSheet             : Safari Share → Add to Home Screen
 *
 * Dismissed state persists in sessionStorage so it reappears next browser session.
 */
import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const DISPLAY = "'Fraunces', 'Playfair Display', Georgia, serif";
const BODY    = "'DM Sans', system-ui, sans-serif";

// ─── Platform detection ──────────────────────────────────────────────────────
const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !(window as Window & { MSStream?: unknown }).MSStream;

const isAndroid = /Android/.test(navigator.userAgent);
const isMobile  = isIOS || isAndroid;

const isInStandaloneMode =
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

const SESSION_KEY = 'aiwmr_install_seen';

// ─── Shared sheet wrapper ────────────────────────────────────────────────────
const Sheet: React.FC<{ children: React.ReactNode; onBackdropClick: () => void }> = ({ children, onBackdropClick }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 9000,
    display: 'flex', flexDirection: 'column',
  }}>
    <div onClick={onBackdropClick}
      style={{
        flex: 1,
        background: 'rgba(13,29,21,0.6)',
        backdropFilter: 'blur(4px)',
      }}/>
    <div style={{
      background: 'var(--cream)',
      padding: 'calc(28px) 26px calc(36px + var(--safe-bottom))',
      animation: 'slideUp 0.4s cubic-bezier(0.34, 1.2, 0.64, 1)',
      position: 'relative',
      boxShadow: '0 -20px 60px rgba(0,0,0,0.25)',
      maxHeight: '88vh',
      overflowY: 'auto',
    }}>
      {/* Drag handle */}
      <div aria-hidden style={{
        width: 40, height: 3,
        background: 'rgba(26,58,42,0.25)',
        borderRadius: 2,
        margin: '0 auto 22px',
      }}/>
      {children}
    </div>
  </div>
);

// ─── Shared editorial header ─────────────────────────────────────────────────
const SheetHeader: React.FC<{ eyebrow: string; headline: string; italicAccent: string; sub: string }> = ({ eyebrow, headline, italicAccent, sub }) => (
  <>
    <div style={{
      fontFamily: BODY,
      fontSize: 10, fontWeight: 600,
      color: 'var(--moss)',
      letterSpacing: '0.34em',
      textTransform: 'uppercase',
      marginBottom: 12,
    }}>
      {eyebrow}
    </div>

    <h2 style={{
      fontFamily: DISPLAY,
      fontSize: 'clamp(32px, 9vw, 44px)',
      color: 'var(--forest)',
      fontWeight: 400,
      lineHeight: 1.0,
      letterSpacing: '-0.022em',
      margin: 0, marginBottom: 14,
      fontVariationSettings: '"opsz" 144, "SOFT" 80',
    }}>
      {headline}<br/>
      <em style={{ fontStyle: 'italic', color: 'var(--moss)', fontWeight: 400 }}>{italicAccent}</em>
    </h2>

    <p style={{
      fontFamily: DISPLAY,
      fontStyle: 'italic',
      fontSize: 15,
      color: 'var(--charcoal)',
      opacity: 0.7,
      lineHeight: 1.5,
      margin: '0 0 28px',
    }}>
      {sub}
    </p>
  </>
);

// ─── Numbered step list (editorial) ─────────────────────────────────────────
const StepList: React.FC<{ steps: { label: string; desc: string }[] }> = ({ steps }) => (
  <ol style={{
    listStyle: 'none',
    padding: 0, margin: '0 0 24px',
  }}>
    {steps.map((s, i) => (
      <li key={i} style={{
        display: 'flex',
        gap: 18,
        padding: '16px 0',
        borderTop: i === 0 ? '1px solid rgba(26,58,42,0.18)' : 'none',
        borderBottom: '1px solid rgba(26,58,42,0.18)',
      }}>
        <span style={{
          fontFamily: DISPLAY,
          fontStyle: 'italic',
          fontSize: 17,
          color: 'var(--moss)',
          minWidth: 24,
          lineHeight: 1.4,
          opacity: 0.85,
        }}>
          {['i', 'ii', 'iii', 'iv'][i] ?? `${i + 1}`}.
        </span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: DISPLAY,
            fontSize: 16,
            color: 'var(--forest)',
            fontWeight: 400,
            lineHeight: 1.3,
            marginBottom: 4,
          }}>
            {s.label}
          </div>
          <div style={{
            fontFamily: DISPLAY,
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--charcoal)',
            opacity: 0.65,
            lineHeight: 1.5,
          }}>
            {s.desc}
          </div>
        </div>
      </li>
    ))}
  </ol>
);

// ─── Editorial PrimaryButton (inline to avoid circular import) ──────────────
const InstallButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      padding: '18px 26px',
      background: 'var(--forest)',
      color: 'white',
      border: 'none',
      borderRadius: 2,
      fontFamily: BODY,
      fontSize: 13, fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      boxShadow: '0 8px 28px -10px rgba(26,58,42,0.45)',
      transition: 'transform 0.12s ease',
    }}
  >
    <span>{label}</span>
    <span style={{
      fontFamily: DISPLAY,
      fontStyle: 'italic',
      fontSize: 20,
      fontWeight: 400,
      textTransform: 'none',
      letterSpacing: 0,
      transform: 'translateY(-1px)',
    }}>→</span>
  </button>
);

const InlineDismiss: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      marginTop: 16,
      background: 'none',
      border: 'none',
      padding: '8px 0',
      cursor: 'pointer',
      fontFamily: DISPLAY,
      fontStyle: 'italic',
      fontSize: 14,
      color: 'var(--moss)',
      opacity: 0.8,
    }}
  >
    {label}
  </button>
);

// ─── Hint card (subtle pointer to UI element on the browser chrome) ─────────
const HintCard: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    padding: '14px 16px',
    marginBottom: 22,
    background: 'rgba(45,90,61,0.05)',
    borderLeft: '2px solid var(--moss)',
    fontFamily: DISPLAY,
    fontStyle: 'italic',
    fontSize: 13,
    color: 'var(--forest)',
    lineHeight: 1.5,
  }}>
    {text}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Variant: Android with native install prompt available
// ═══════════════════════════════════════════════════════════════════════════
const AndroidInstallSheet: React.FC<{ onInstall: () => void; onDismiss: () => void }> = ({ onInstall, onDismiss }) => (
  <Sheet onBackdropClick={onDismiss}>
    {/* Logo + meta */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      marginBottom: 24,
    }}>
      <img
        src="/icons/maskable-192x192.png"
        alt="AIWMR"
        style={{
          width: 56, height: 56,
          borderRadius: 12,
          border: '1px solid rgba(26,58,42,0.12)',
        }}
      />
      <div>
        <div style={{
          fontFamily: BODY,
          fontSize: 9, fontWeight: 700,
          color: 'var(--moss)',
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>
          ✦ AIWMR · Free
        </div>
        <div style={{
          fontFamily: DISPLAY,
          fontStyle: 'italic',
          fontSize: 19,
          color: 'var(--forest)',
          fontWeight: 500,
          lineHeight: 1.2,
        }}>
          Training Academy
        </div>
      </div>
    </div>

    <SheetHeader
      eyebrow="— Install the app"
      headline="Take it"
      italicAccent="with you."
      sub="Install AIWMR on your home screen for offline study and a fullscreen experience."
    />

    {/* Feature list */}
    <ul style={{
      listStyle: 'none',
      padding: 0, margin: '0 0 28px',
      fontFamily: DISPLAY,
      fontSize: 15,
      color: 'var(--charcoal)',
      opacity: 0.82,
      lineHeight: 1.7,
    }}>
      {[
        'Works offline — study anywhere',
        'Reminders for upcoming live sessions',
        'Fullscreen — no browser chrome',
      ].map(text => (
        <li key={text} style={{ display: 'flex', gap: 14, marginBottom: 8 }}>
          <span style={{ color: 'var(--moss)', fontSize: 12 }}>✦</span>
          <span>{text}</span>
        </li>
      ))}
    </ul>

    <InstallButton label="Install App" onClick={onInstall}/>
    <InlineDismiss label="maybe later" onClick={onDismiss}/>
  </Sheet>
);

// ═══════════════════════════════════════════════════════════════════════════
// Variant: Android manual (Chrome menu instructions)
// ═══════════════════════════════════════════════════════════════════════════
const AndroidManualSheet: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <Sheet onBackdropClick={onDismiss}>
    <SheetHeader
      eyebrow="— Add to home screen"
      headline="In three"
      italicAccent="taps."
      sub="Add AIWMR to your home screen for faster access and offline learning."
    />

    <StepList steps={[
      { label: 'Open the Chrome menu', desc: 'Tap the three vertical dots (⋮) in the top-right corner of Chrome.' },
      { label: 'Add to home screen',  desc: 'Scroll down and tap "Add to Home screen".' },
      { label: 'Confirm install',     desc: 'Tap "Install" on the confirmation dialog.' },
    ]}/>

    <HintCard text="✦ The ⋮ menu lives at the top-right of your browser."/>

    <InstallButton label="Got It" onClick={onDismiss}/>
  </Sheet>
);

// ═══════════════════════════════════════════════════════════════════════════
// Variant: iOS (Safari Share → Add to Home Screen)
// ═══════════════════════════════════════════════════════════════════════════
const IOSSheet: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <Sheet onBackdropClick={onDismiss}>
    <SheetHeader
      eyebrow="— Add to home screen"
      headline="In three"
      italicAccent="taps."
      sub="Add AIWMR to your iPhone home screen for faster access and a native-app feel."
    />

    <StepList steps={[
      { label: 'Open Safari Share',   desc: 'Tap the Share button (square with an upward arrow) at the bottom of Safari.' },
      { label: 'Add to home screen',  desc: 'Scroll down and tap "Add to Home Screen".' },
      { label: 'Confirm',             desc: 'Tap "Add" in the top-right corner.' },
    ]}/>

    <HintCard text="✦ The Share icon sits at the bottom of Safari."/>

    <InstallButton label="Got It" onClick={onDismiss}/>
  </Sheet>
);

// ═══════════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════════
const InstallBanner: React.FC = () => {
  const { canInstall, promptInstall } = usePWAInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode) return;
    if (!isMobile) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
  };

  const handleInstall = async () => {
    await promptInstall();
    setVisible(false);
  };

  if (!visible) return null;

  if (isIOS) return <IOSSheet onDismiss={handleDismiss}/>;

  // Android: prefer native install button if browser fired beforeinstallprompt
  if (canInstall) return <AndroidInstallSheet onInstall={handleInstall} onDismiss={handleDismiss}/>;
  return <AndroidManualSheet onDismiss={handleDismiss}/>;
};

export default InstallBanner;
