/**
 * OfflineBanner — slim top banner that appears when navigator.onLine is false.
 *
 * Rendered globally in App.tsx so it sits above every screen.
 * Auto-hides 2 seconds after coming back online, with a brief "Back online" note.
 */
import React, { useEffect, useState } from 'react';

const DISPLAY = "'Fraunces', 'Playfair Display', Georgia, serif";
const BODY    = "'DM Sans', system-ui, sans-serif";

const OfflineBanner: React.FC = () => {
  const [online, setOnline]               = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showRecovered, setShowRecovered] = useState(false);

  useEffect(() => {
    const handleOnline  = () => {
      setOnline(true);
      setShowRecovered(true);
      const t = setTimeout(() => setShowRecovered(false), 2200);
      return () => clearTimeout(t);
    };
    const handleOffline = () => {
      setOnline(false);
      setShowRecovered(false);
    };
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-clear recovered note when navigating offline
  useEffect(() => { if (!online) setShowRecovered(false); }, [online]);

  if (online && !showRecovered) return null;

  const offline = !online;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 9998,
        background: offline ? 'var(--red)' : 'var(--moss)',
        color: 'white',
        paddingTop:    'calc(8px + var(--safe-top))',
        paddingBottom: 8,
        paddingLeft:   16,
        paddingRight:  16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        fontFamily: BODY,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        animation: 'slideDownSoft 0.35s ease both',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
      }}
    >
      <span style={{
        display: 'inline-block',
        width: 6, height: 6,
        borderRadius: '50%',
        background: 'white',
        opacity: offline ? 1 : 0.85,
        animation: offline ? 'pulse 1.6s ease-in-out infinite' : undefined,
      }}/>
      <span>
        {offline ? 'You are offline' : 'Back online'}
      </span>
      <span style={{
        fontFamily: DISPLAY,
        fontStyle: 'italic',
        fontSize: 11,
        letterSpacing: '0.04em',
        textTransform: 'none',
        opacity: 0.85,
        marginLeft: 4,
      }}>
        {offline ? '— some features may be unavailable' : '✓'}
      </span>
    </div>
  );
};

export default OfflineBanner;
