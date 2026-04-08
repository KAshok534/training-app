import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

// ─── Platform detection ────────────────────────────────────────────────────────
const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !(window as Window & { MSStream?: unknown }).MSStream;

const isAndroid = /Android/.test(navigator.userAgent);
const isMobile  = isIOS || isAndroid;

const isInStandaloneMode =
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

// Show once per browser session — reappears on next visit until installed
const SESSION_KEY = 'aiwmr_install_seen';

// ─── Shared sheet wrapper ──────────────────────────────────────────────────────
const Sheet: React.FC<{ children: React.ReactNode; onBackdropClick: () => void }> = ({ children, onBackdropClick }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', flexDirection: 'column' }}>
    <div onClick={onBackdropClick} style={{ flex: 1, background: 'rgba(0,0,0,0.45)' }}/>
    <div style={{ background: 'var(--cream)', borderRadius: '24px 24px 0 0', padding: '28px 24px 44px', animation: 'slideUp 0.4s cubic-bezier(0.34,1.1,0.64,1)' }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--sand)', margin: '0 auto 24px' }}/>
      {children}
    </div>
  </div>
);

// ─── Android — native install button (when beforeinstallprompt fired) ──────────
const AndroidInstallSheet: React.FC<{ onInstall: () => void; onDismiss: () => void }> = ({ onInstall, onDismiss }) => (
  <Sheet onBackdropClick={onDismiss}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
      <img src="/icons/android-chrome-192x192.png" alt="AIWMR" style={{ width: 56, height: 56, borderRadius: 16 }}/>
      <div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: 'var(--forest)' }}>Install AIWMR App</div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Training Academy · Free</div>
      </div>
    </div>

    {[
      ['⚡', 'Works offline — study anytime, anywhere'],
      ['🔔', 'Get notified about upcoming sessions'],
      ['📱', 'Full-screen app — no browser bar'],
    ].map(([icon, text]) => (
      <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{icon}</span>
        <span style={{ fontSize: 14, color: 'var(--charcoal)' }}>{text}</span>
      </div>
    ))}

    <button onClick={onInstall} style={{ width: '100%', marginTop: 20, padding: 15, background: 'var(--forest)', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
      Install App
    </button>
    <button onClick={onDismiss} style={{ width: '100%', marginTop: 10, padding: 12, background: 'none', color: '#aaa', border: 'none', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
      Maybe Later
    </button>
  </Sheet>
);

// ─── Android — manual fallback (beforeinstallprompt didn't fire) ───────────────
const AndroidManualSheet: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <Sheet onBackdropClick={onDismiss}>
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: 'var(--forest)', marginBottom: 6 }}>
      Install AIWMR App
    </div>
    <div style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Add to your home screen in 3 steps</div>

    {[
      ['1', '⋮  Menu',      'Tap the 3-dot menu in the top-right of Chrome'],
      ['2', '➕  Add',       'Tap "Add to Home screen"'],
      ['3', '✅  Install',   'Tap "Install" on the confirmation dialog'],
    ].map(([num, label, desc]) => (
      <div key={num} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--forest)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{num}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
        </div>
      </div>
    ))}

    <div style={{ textAlign: 'center', padding: 12, background: 'rgba(26,58,42,0.06)', borderRadius: 12, marginBottom: 20 }}>
      <span style={{ fontSize: 13, color: 'var(--forest)', fontWeight: 600 }}>
        👆 Look for ⋮ in the top-right corner of your browser
      </span>
    </div>

    <button onClick={onDismiss} style={{ width: '100%', padding: 14, background: 'var(--forest)', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
      Got It
    </button>
  </Sheet>
);

// ─── iOS — manual install instructions ────────────────────────────────────────
const IOSSheet: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <Sheet onBackdropClick={onDismiss}>
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: 'var(--forest)', marginBottom: 6 }}>
      Install AIWMR App
    </div>
    <div style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Add to your home screen in 3 steps</div>

    {[
      ['1', '⬆️  Share',   'Tap the Share button at the bottom of Safari'],
      ['2', '➕  Add',      'Scroll down and tap "Add to Home Screen"'],
      ['3', '✅  Done',     'Tap "Add" in the top-right corner'],
    ].map(([num, label, desc]) => (
      <div key={num} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--forest)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{num}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
        </div>
      </div>
    ))}

    <div style={{ textAlign: 'center', padding: 12, background: 'rgba(26,58,42,0.06)', borderRadius: 12, marginBottom: 20 }}>
      <span style={{ fontSize: 13, color: 'var(--forest)', fontWeight: 600 }}>
        👇 Look for the Share icon at the bottom of Safari
      </span>
    </div>

    <button onClick={onDismiss} style={{ width: '100%', padding: 14, background: 'var(--forest)', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
      Got It
    </button>
  </Sheet>
);

// ─── Main component ────────────────────────────────────────────────────────────
const InstallBanner: React.FC = () => {
  const { canInstall, promptInstall } = usePWAInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Never show if already running as installed PWA
    if (isInStandaloneMode) return;
    // Only show on mobile devices
    if (!isMobile) return;
    // Already dismissed this session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Show after 1.5s so app has fully loaded — no dependency on canInstall
    // (canInstall may come in later; the JSX will show the right variant)
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []); // run once on mount only

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
  };

  const handleInstall = async () => {
    await promptInstall();
    setVisible(false);
  };

  if (!visible) return null;

  if (isIOS)    return <IOSSheet onDismiss={handleDismiss}/>;

  // Android: use native install button if available, else manual instructions
  if (canInstall) return <AndroidInstallSheet onInstall={handleInstall} onDismiss={handleDismiss}/>;
  return <AndroidManualSheet onDismiss={handleDismiss}/>;
};

export default InstallBanner;
