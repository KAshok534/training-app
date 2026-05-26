/**
 * DemoBanner — non-intrusive top banner when running without Supabase credentials.
 * Editorial styling matching the rest of the app.
 */
import React, { useState } from 'react';

const DISPLAY = "'Fraunces', 'Playfair Display', Georgia, serif";
const BODY    = "'DM Sans', system-ui, sans-serif";

const DemoBanner: React.FC<{ isDemo: boolean }> = ({ isDemo }) => {
  const [visible, setVisible] = useState(true);
  if (!isDemo || !visible) return null;

  return (
    <div style={{
      background: 'rgba(212,148,58,0.08)',
      borderBottom: '1px solid rgba(212,148,58,0.3)',
      borderTop:    '2px solid var(--amber)',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      flexShrink: 0,
      fontFamily: BODY,
    }}>
      <span style={{
        fontSize: 9,
        fontWeight: 700,
        color: 'var(--earth)',
        letterSpacing: '0.4em',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}>
        ✦ Demo
      </span>

      <div style={{
        flex: 1,
        fontFamily: DISPLAY,
        fontStyle: 'italic',
        fontSize: 13,
        color: 'var(--earth)',
        lineHeight: 1.4,
        opacity: 0.9,
      }}>
        Running without Supabase. Add credentials in{' '}
        <code style={{
          fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
          fontStyle: 'normal',
          fontSize: 11,
          background: 'rgba(0,0,0,0.05)',
          padding: '1px 6px',
          color: 'var(--forest)',
        }}>.env</code>
        {' '}to connect.
      </div>

      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--earth)',
          cursor: 'pointer',
          fontFamily: DISPLAY,
          fontStyle: 'italic',
          fontSize: 16,
          padding: 0,
          opacity: 0.7,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
};

export default DemoBanner;
