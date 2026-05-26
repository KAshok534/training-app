/**
 * ErrorBoundary — catches uncaught React errors anywhere in the tree
 * and shows an editorial fallback instead of a blank screen.
 *
 * Wraps the whole app in App.tsx → AuthProvider hierarchy.
 *
 * Required for Play Store stability — uncaught crashes count against your
 * "ANR & Crash rate" score and trigger automatic listing demotion.
 */
import React from 'react';

interface State { hasError: boolean; error: Error | null; }

const DISPLAY = "'Fraunces', 'Playfair Display', Georgia, serif";
const BODY    = "'DM Sans', system-ui, sans-serif";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] uncaught render error:', error, info);
  }

  handleReload = () => {
    try { window.location.reload(); } catch { /* ignore */ }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const errMsg = this.state.error?.message ?? 'An unexpected error occurred.';

    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#f7f3ec', // var(--cream) — can't rely on CSS vars if root style didn't mount
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 30px',
        textAlign: 'center',
        zIndex: 9999,
      }}>
        {/* Eyebrow */}
        <div style={{
          fontFamily: BODY,
          fontSize: 10, fontWeight: 600,
          color: '#4a7c59',
          letterSpacing: '0.34em',
          textTransform: 'uppercase',
          marginBottom: 18,
        }}>— Something went wrong</div>

        {/* Headline */}
        <h1 style={{
          fontFamily: DISPLAY,
          fontSize: 'clamp(38px, 11vw, 56px)',
          color: '#1a3a2a',
          fontWeight: 400,
          lineHeight: 0.96,
          letterSpacing: '-0.02em',
          margin: 0, marginBottom: 18,
          maxWidth: 360,
        }}>
          We hit{' '}<br/>
          <em style={{ fontStyle: 'italic', color: '#4a7c59' }}>a snag.</em>
        </h1>

        {/* Subhead */}
        <p style={{
          fontFamily: DISPLAY,
          fontStyle: 'italic',
          fontSize: 15,
          color: '#2c2c2c',
          opacity: 0.7,
          lineHeight: 1.55,
          margin: 0, marginBottom: 32,
          maxWidth: 320,
        }}>
          Something unexpected happened. Reloading usually clears it. If it keeps happening, please contact <span style={{ color: '#1a3a2a', fontWeight: 600, fontStyle: 'normal', fontFamily: BODY }}>director@aiwmr.org</span>.
        </p>

        {/* Reload CTA */}
        <button
          onClick={this.handleReload}
          style={{
            width: '100%',
            maxWidth: 320,
            padding: '18px 26px',
            background: '#1a3a2a',
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
          }}
        >
          <span>Reload App</span>
          <span style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 20, fontWeight: 400 }}>↻</span>
        </button>

        {/* Technical details — collapsible, opt-in */}
        <details style={{
          marginTop: 28,
          fontSize: 11,
          color: '#aaa',
          fontFamily: BODY,
          maxWidth: 360,
        }}>
          <summary style={{ cursor: 'pointer', fontStyle: 'italic', letterSpacing: '0.04em' }}>
            technical details
          </summary>
          <pre style={{
            marginTop: 10,
            padding: '10px 14px',
            background: 'rgba(0,0,0,0.04)',
            borderLeft: '2px solid #4a7c59',
            textAlign: 'left',
            fontSize: 10,
            fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
            color: '#666',
            overflow: 'auto',
            maxHeight: 120,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {errMsg}
          </pre>
        </details>
      </div>
    );
  }
}

export default ErrorBoundary;
