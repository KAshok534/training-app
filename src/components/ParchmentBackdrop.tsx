/**
 * ParchmentBackdrop — shared cream-paper background with optional decorations
 *
 * Used by AuthShell, AssessmentScreen, and any other screen that wants the
 * editorial-botanical atmosphere. Decoration levels:
 *
 *   - 'full'       cream + grain + topographic contour SVG + botanical leaf
 *   - 'grain-only' cream + grain (used during focused activities like the quiz)
 *   - 'none'       cream only
 */
import React from 'react';

interface Props {
  decorations?: 'full' | 'grain-only' | 'none';
  children: React.ReactNode;
}

const ParchmentBackdrop: React.FC<Props> = ({ decorations = 'full', children }) => (
  <div style={{
    height: '100%',
    width: '100%',
    background: 'var(--cream)',
    position: 'relative',
    overflow: 'hidden',
  }}>
    {/* Paper grain noise overlay */}
    {decorations !== 'none' && (
      <div aria-hidden style={{
        position:'absolute', inset:0, pointerEvents:'none', zIndex:0, opacity:0.55,
        background: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.07 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
      }}/>
    )}

    {/* Topographic contour-map accent — top right */}
    {decorations === 'full' && (
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
    )}

    {/* Botanical leaf line drawing — bottom left */}
    {decorations === 'full' && (
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
    )}

    {/* Content layer */}
    <div style={{ position: 'relative', zIndex: 1, height: '100%', width: '100%' }}>
      {children}
    </div>
  </div>
);

export default ParchmentBackdrop;
