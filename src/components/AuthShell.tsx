/**
 * AuthShell — shared editorial chrome for auth screens
 *
 * Provides the cream parchment background with paper-grain noise overlay,
 * topographic contour-map SVG (top right), botanical leaf line drawing
 * (bottom left), institutional top bar (AIWMR logo + ESTABLISHED metadata),
 * and the footer mark.
 *
 * Used by LoginScreen, RegisterScreen, ResetPasswordScreen.
 */
import React from 'react';

export const DISPLAY = "'Fraunces', 'Playfair Display', Georgia, serif";
export const BODY    = "'DM Sans', system-ui, sans-serif";

interface Props { children: React.ReactNode; }

const AuthShell: React.FC<Props> = ({ children }) => (
  <div style={{
    height: '100%',
    width: '100%',
    background: 'var(--cream)',
    position: 'relative',
    overflow: 'hidden',
  }}>
    {/* Paper grain noise overlay */}
    <div aria-hidden style={{
      position:'absolute', inset:0, pointerEvents:'none', zIndex:0, opacity:0.55,
      background: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.07 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
    }}/>

    {/* Topographic contour-map accent — top right */}
    <svg
      aria-hidden
      viewBox="0 0 400 400"
      style={{
        position: 'absolute',
        top: -160, right: -140,
        width: 520, height: 520,
        opacity: 0.085,
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'driftSlow 22s ease-in-out infinite',
      }}
    >
      <g fill="none" stroke="#1a3a2a" strokeWidth="1.1">
        <ellipse cx="200" cy="200" rx="32"  ry="42"/>
        <ellipse cx="200" cy="200" rx="58"  ry="74"/>
        <ellipse cx="200" cy="200" rx="86"  ry="108"/>
        <ellipse cx="200" cy="200" rx="116" ry="144"/>
        <ellipse cx="200" cy="200" rx="148" ry="182"/>
        <ellipse cx="200" cy="200" rx="182" ry="222"/>
      </g>
    </svg>

    {/* Botanical leaf line drawing — bottom left */}
    <svg
      aria-hidden
      viewBox="0 0 100 220"
      style={{
        position: 'absolute',
        bottom: -40, left: -22,
        width: 160,
        opacity: 0.13,
        pointerEvents: 'none',
        zIndex: 0,
        transform: 'rotate(-12deg)',
      }}
    >
      <g fill="none" stroke="#1a3a2a" strokeWidth="1.2" strokeLinecap="round">
        <path d="M50,210 Q50,110 50,12"/>
        <path d="M50,188 Q30,176 14,154"/>
        <path d="M50,168 Q70,156 86,134"/>
        <path d="M50,146 Q30,134 16,112"/>
        <path d="M50,124 Q72,112 84,88"/>
        <path d="M50,102 Q30,90 18,68"/>
        <path d="M50,80  Q70,68 80,46"/>
        <path d="M50,58  Q34,48 26,30"/>
      </g>
    </svg>

    {/* Scrollable content frame */}
    <div style={{
      position: 'relative',
      zIndex: 1,
      height: '100%',
      width: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
    }}>
      <div style={{
        maxWidth: 460,
        margin: '0 auto',
        padding: 'calc(28px + var(--safe-top)) 30px calc(36px + var(--safe-bottom))',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top bar: logo + establishment line */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 56,
          animation: 'fadeUpSoft 0.65s ease 0s both',
        }}>
          <img
            src="/logo.png"
            alt="AIWMR Training Academy"
            style={{ width: 108, height: 'auto', opacity: 0.94 }}
          />
          <div style={{
            fontFamily: BODY,
            fontSize: 9,
            fontWeight: 500,
            color: 'var(--moss)',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            textAlign: 'right',
            lineHeight: 1.8,
            paddingTop: 6,
          }}>
            Established<br/>
            <span style={{ opacity: 0.65 }}>Hyderabad · India</span>
          </div>
        </header>

        {/* Page content */}
        {children}

        {/* Footer mark */}
        <div style={{
          marginTop: 'auto',
          paddingTop: 48,
          textAlign: 'center',
          fontFamily: DISPLAY,
          fontStyle: 'italic',
          fontSize: 11,
          color: 'var(--moss)',
          opacity: 0.6,
          letterSpacing: '0.04em',
          animation: 'fadeUpSoft 0.7s ease 0.95s both',
        }}>
          ✦{'  '}Ashrita Institute for Waste Management & Research
        </div>
      </div>
    </div>
  </div>
);

export default AuthShell;
