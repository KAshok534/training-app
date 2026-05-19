import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Props { onShowRegister: () => void; }

// ── Type system ──────────────────────────────────────────────────────────────
const DISPLAY = "'Fraunces', 'Playfair Display', Georgia, serif";
const BODY    = "'DM Sans', system-ui, sans-serif";

const LoginScreen: React.FC<Props> = ({ onShowRegister }) => {
  const { signIn, isDemo } = useAuth();

  // Login state
  const [email, setEmail]               = useState(isDemo ? 'student@example.com' : '');
  const [password, setPassword]         = useState(isDemo ? 'password123' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  // Forgot password state
  const [forgotMode, setForgotMode]       = useState(false);
  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent]       = useState(false);
  const [forgotError, setForgotError]     = useState('');

  // Focused field tracking (animates underline)
  const [focused, setFocused] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true); setError('');
    const err = await signIn(email, password);
    if (err) {
      if (err.toLowerCase().includes('email not confirmed'))
        setError('Please verify your email first. Check your inbox for the verification link.');
      else if (err.toLowerCase().includes('invalid login'))
        setError('Incorrect email or password. Please try again.');
      else
        setError(err);
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setForgotError('');
    if (!forgotEmail.trim()) { setForgotError('Please enter your email address.'); return; }
    setForgotLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: window.location.origin,
    });
    setForgotLoading(false);
    if (err) setForgotError(err.message);
    else     setForgotSent(true);
  };

  // ── Determine which mode we're in ─────────────────────────────────────────
  const mode: 'login' | 'forgot' | 'sent' =
    forgotMode ? (forgotSent ? 'sent' : 'forgot') : 'login';

  return (
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

          {/* ── Top bar: logo + establishment line ── */}
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

          {/* ── Mode-switching content (re-keyed on mode change to re-animate) ── */}
          <div key={mode} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

            {/* Eyebrow */}
            <div style={{
              fontFamily: BODY,
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--moss)',
              letterSpacing: '0.34em',
              textTransform: 'uppercase',
              marginBottom: 18,
              animation: 'fadeUpSoft 0.6s ease 0.05s both',
            }}>
              {mode === 'login'  && <>— Member access</>}
              {mode === 'forgot' && <>— Account recovery</>}
              {mode === 'sent'   && <>— Link dispatched</>}
            </div>

            {/* Display headline */}
            <h1 style={{
              fontFamily: DISPLAY,
              fontSize: 'clamp(46px, 13vw, 70px)',
              color: 'var(--forest)',
              fontWeight: 400,
              lineHeight: 0.96,
              letterSpacing: '-0.022em',
              margin: 0,
              marginBottom: 18,
              fontVariationSettings: '"opsz" 144, "SOFT" 80',
              animation: 'fadeUpSoft 0.7s ease 0.15s both',
            }}>
              {mode === 'login' && (
                <>Welcome<br/>
                  <em style={{ fontStyle: 'italic', color: 'var(--moss)', fontWeight: 400 }}>back.</em>
                </>
              )}
              {mode === 'forgot' && (
                <>Reset your<br/>
                  <em style={{ fontStyle: 'italic', color: 'var(--moss)', fontWeight: 400 }}>password.</em>
                </>
              )}
              {mode === 'sent' && (
                <>Check<br/>
                  <em style={{ fontStyle: 'italic', color: 'var(--moss)', fontWeight: 400 }}>your inbox.</em>
                </>
              )}
            </h1>

            {/* Editorial subhead */}
            <p style={{
              fontFamily: DISPLAY,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 16,
              color: 'var(--charcoal)',
              opacity: 0.72,
              lineHeight: 1.5,
              margin: 0,
              marginBottom: 36,
              maxWidth: 360,
              animation: 'fadeUpSoft 0.7s ease 0.25s both',
            }}>
              {mode === 'login'  && <>Continue cultivating expertise in waste management & environmental stewardship.</>}
              {mode === 'forgot' && <>Enter your registered email and we'll send a secure recovery link.</>}
              {mode === 'sent'   && <>A recovery link was sent to <span style={{ color: 'var(--forest)', fontStyle: 'normal', fontWeight: 600, fontFamily: BODY }}>{forgotEmail}</span>. Follow it to choose a new password.</>}
            </p>

            {/* Decorative divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 30,
              animation: 'fadeUpSoft 0.6s ease 0.35s both',
            }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
              <span style={{ fontFamily: DISPLAY, fontSize: 13, color: 'var(--moss)', opacity: 0.7 }}>✦</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
            </div>

            {/* ── Mode: SENT ── */}
            {mode === 'sent' && (
              <div style={{ animation: 'fadeUpSoft 0.6s ease 0.45s both' }}>
                <PrimaryButton
                  onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail(''); }}
                  label="Return to Sign In"
                  arrow="↩"
                />
              </div>
            )}

            {/* ── Mode: FORGOT ── */}
            {mode === 'forgot' && (
              <>
                {forgotError && <ErrorBar text={forgotError}/>}

                <Field
                  id="forgot-email"
                  label="Email Address"
                  type="email"
                  value={forgotEmail}
                  onChange={setForgotEmail}
                  focused={focused}
                  setFocused={setFocused}
                  autoComplete="email"
                  delay={0.45}
                />

                <div style={{ animation: 'fadeUpSoft 0.6s ease 0.6s both', marginTop: 8 }}>
                  <PrimaryButton
                    onClick={handleForgot}
                    loading={forgotLoading}
                    label="Send Recovery Link"
                    arrow="→"
                  />
                </div>

                <div style={{ textAlign: 'center', marginTop: 26, animation: 'fadeUpSoft 0.6s ease 0.7s both' }}>
                  <button
                    onClick={() => { setForgotMode(false); setForgotError(''); }}
                    style={inlineLink()}
                  >
                    <span style={{ fontFamily: DISPLAY, fontStyle: 'italic' }}>↩</span>{' '}back to sign in
                  </button>
                </div>
              </>
            )}

            {/* ── Mode: LOGIN ── */}
            {mode === 'login' && (
              <>
                {error && <ErrorBar text={error}/>}

                <Field
                  id="email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  focused={focused}
                  setFocused={setFocused}
                  autoComplete="email"
                  delay={0.45}
                />

                {/* Password row — label + show/hide toggle inline */}
                <div style={{ marginBottom: 10, animation: 'fadeUpSoft 0.6s ease 0.52s both' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 6,
                  }}>
                    <label style={labelStyle}>Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      style={{
                        fontFamily: DISPLAY,
                        fontStyle: 'italic',
                        fontSize: 12,
                        color: 'var(--moss)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                        textDecorationStyle: 'dotted',
                        textUnderlineOffset: '3px',
                      }}
                    >
                      {showPassword ? 'hide' : 'show'}
                    </button>
                  </div>
                  <input
                    style={underlinedInput(focused === 'password')}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    autoComplete="current-password"
                  />
                </div>

                {/* Forgot password link */}
                <div style={{
                  textAlign: 'right',
                  marginTop: 12,
                  marginBottom: 38,
                  animation: 'fadeUpSoft 0.6s ease 0.58s both',
                }}>
                  <button
                    onClick={() => { setForgotMode(true); setForgotEmail(email); setError(''); }}
                    style={{
                      fontFamily: DISPLAY,
                      fontStyle: 'italic',
                      fontSize: 14,
                      color: 'var(--moss)',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      textDecoration: 'underline',
                      textDecorationStyle: 'dotted',
                      textUnderlineOffset: '4px',
                    }}
                  >
                    Forgot your password?
                  </button>
                </div>

                <div style={{ animation: 'fadeUpSoft 0.6s ease 0.65s both' }}>
                  <PrimaryButton
                    onClick={handleLogin}
                    loading={loading}
                    label="Sign In"
                    arrow="→"
                  />
                </div>

                {/* New to AIWMR section */}
                <div style={{
                  marginTop: 38,
                  paddingTop: 28,
                  borderTop: '1px solid rgba(26,58,42,0.12)',
                  textAlign: 'center',
                  animation: 'fadeUpSoft 0.6s ease 0.75s both',
                }}>
                  <div style={{
                    fontFamily: BODY,
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--moss)',
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                  }}>
                    New to AIWMR
                  </div>
                  <button
                    onClick={onShowRegister}
                    style={{
                      fontFamily: DISPLAY,
                      fontStyle: 'italic',
                      fontSize: 19,
                      color: 'var(--forest)',
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                    }}
                  >
                    Create your account
                    <span style={{ marginLeft: 8 }}>→</span>
                  </button>
                </div>

                {isDemo && (
                  <div style={{
                    marginTop: 28,
                    padding: '14px 16px',
                    background: 'rgba(45,90,61,0.045)',
                    borderLeft: '2px solid var(--moss)',
                    fontFamily: BODY,
                    animation: 'fadeUpSoft 0.6s ease 0.85s both',
                  }}>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--moss)',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      marginBottom: 5,
                    }}>
                      ❋ Demo Mode
                    </div>
                    <div style={{ fontSize: 12, color: '#888', lineHeight: 1.55 }}>
                      Credentials pre-filled. Connect Supabase in <code style={{ fontFamily: 'ui-monospace, "JetBrains Mono", monospace', fontSize: 11 }}>.env</code> to enable real auth.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Footer mark ── */}
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
};

// ─── Subcomponents ──────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontFamily: BODY,
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--moss)',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  display: 'block',
};

const underlinedInput = (isFocused: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '12px 0',
  border: 'none',
  borderBottom: isFocused
    ? '1.5px solid var(--forest)'
    : '1px solid rgba(26,58,42,0.18)',
  background: 'transparent',
  fontSize: 16,
  color: 'var(--charcoal)',
  outline: 'none',
  fontFamily: BODY,
  transition: 'border-color 0.25s ease, padding 0.25s ease',
});

const inlineLink = (): React.CSSProperties => ({
  fontFamily: DISPLAY,
  fontStyle: 'italic',
  fontSize: 14,
  color: 'var(--moss)',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
  textDecoration: 'underline',
  textDecorationStyle: 'dotted',
  textUnderlineOffset: '4px',
});

interface FieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  focused: string | null;
  setFocused: (s: string | null) => void;
  autoComplete?: string;
  delay?: number;
}

const Field: React.FC<FieldProps> = ({
  id, label, type, value, onChange, focused, setFocused, autoComplete, delay = 0.45,
}) => (
  <div style={{ marginBottom: 22, animation: `fadeUpSoft 0.6s ease ${delay}s both` }}>
    <label style={labelStyle}>{label}</label>
    <input
      style={{ ...underlinedInput(focused === id), marginTop: 6 }}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(id)}
      onBlur={() => setFocused(null)}
      autoComplete={autoComplete}
    />
  </div>
);

interface PrimaryButtonProps {
  onClick: () => void;
  label: string;
  arrow: string;
  loading?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ onClick, label, arrow, loading = false }) => (
  <button
    onClick={onClick}
    disabled={loading}
    onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(1px)'; }}
    onMouseUp={e   => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';   }}
    onMouseLeave={e=> { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';   }}
    style={{
      width: '100%',
      padding: '18px 26px',
      background: loading ? 'var(--moss)' : 'var(--forest)',
      color: 'white',
      border: 'none',
      borderRadius: 2,
      fontFamily: BODY,
      fontSize: 13,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      opacity: loading ? 0.85 : 1,
      transition: 'transform 0.12s ease, background 0.2s ease, box-shadow 0.2s ease',
      boxShadow: '0 8px 28px -10px rgba(26,58,42,0.45)',
      position: 'relative',
    }}
  >
    {loading ? (
      <span style={{
        display: 'inline-block',
        width: 16, height: 16,
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: 'white',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}/>
    ) : (
      <>
        <span>{label}</span>
        <span style={{
          fontFamily: DISPLAY,
          fontStyle: 'italic',
          fontSize: 20,
          letterSpacing: 0,
          fontWeight: 400,
          textTransform: 'none',
          transform: 'translateY(-1px)',
        }}>{arrow}</span>
      </>
    )}
  </button>
);

const ErrorBar: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    borderLeft: '2px solid var(--red)',
    padding: '10px 0 10px 14px',
    marginBottom: 22,
    fontSize: 13,
    color: 'var(--red)',
    fontFamily: BODY,
    lineHeight: 1.55,
    animation: 'fadeUpSoft 0.4s ease',
    background: 'rgba(192,57,43,0.04)',
  }}>
    {text}
  </div>
);

export default LoginScreen;
