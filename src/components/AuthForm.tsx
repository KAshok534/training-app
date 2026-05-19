/**
 * AuthForm — shared editorial form primitives for auth screens
 *
 * Exports:
 *  - <Eyebrow/>      small caps "— Member access" style label
 *  - <Headline/>     huge Fraunces display headline with italic accent
 *  - <Subhead/>      italic Fraunces editorial subhead
 *  - <Divider/>      decorative ✦ rule
 *  - <Field/>        underlined input with floating small-caps label
 *  - <PasswordField/> like Field, with inline show/hide toggle
 *  - <PrimaryButton/> sharp-edged forest CTA with italic arrow
 *  - <InlineLink/>    italic Fraunces text-button with dotted underline
 *  - <ErrorBar/>      left-rule error message
 *  - <Sidenote/>      left-rule informational notice (for demo mode etc.)
 */
import React from 'react';
import { DISPLAY, BODY } from './AuthShell';

// ─── Typography ──────────────────────────────────────────────────────────────

export const Eyebrow: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0.05 }) => (
  <div style={{
    fontFamily: BODY,
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--moss)',
    letterSpacing: '0.34em',
    textTransform: 'uppercase',
    marginBottom: 18,
    animation: `fadeUpSoft 0.6s ease ${delay}s both`,
  }}>
    {text}
  </div>
);

export const Headline: React.FC<{
  primary: React.ReactNode;
  italicAccent: React.ReactNode;
  delay?: number;
}> = ({ primary, italicAccent, delay = 0.15 }) => (
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
    animation: `fadeUpSoft 0.7s ease ${delay}s both`,
  }}>
    {primary}<br/>
    <em style={{ fontStyle: 'italic', color: 'var(--moss)', fontWeight: 400 }}>{italicAccent}</em>
  </h1>
);

export const Subhead: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0.25 }) => (
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
    maxWidth: 380,
    animation: `fadeUpSoft 0.7s ease ${delay}s both`,
  }}>
    {children}
  </p>
);

export const Divider: React.FC<{ delay?: number }> = ({ delay = 0.35 }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 30,
    animation: `fadeUpSoft 0.6s ease ${delay}s both`,
  }}>
    <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
    <span style={{ fontFamily: DISPLAY, fontSize: 13, color: 'var(--moss)', opacity: 0.7 }}>✦</span>
    <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
  </div>
);

export const SectionLabel: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0.4 }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 18,
    animation: `fadeUpSoft 0.6s ease ${delay}s both`,
  }}>
    <span style={{
      fontFamily: BODY,
      fontSize: 9,
      fontWeight: 600,
      color: 'var(--moss)',
      letterSpacing: '0.32em',
      textTransform: 'uppercase',
      opacity: 0.75,
    }}>
      {text}
    </span>
    <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.12)' }}/>
  </div>
);

// ─── Form primitives ─────────────────────────────────────────────────────────

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
  transition: 'border-color 0.25s ease',
  borderRadius: 0,
});

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  focused: string | null;
  setFocused: (s: string | null) => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  delay?: number;
}

export const Field: React.FC<FieldProps> = ({
  id, label, type = 'text', value, onChange, focused, setFocused,
  autoComplete, placeholder, required, delay = 0.45,
}) => (
  <div style={{ marginBottom: 22, animation: `fadeUpSoft 0.6s ease ${delay}s both` }}>
    <label style={labelStyle}>
      {label}
      {required && <span style={{ color: 'var(--moss)', marginLeft: 6, opacity: 0.6 }}>·</span>}
    </label>
    <input
      style={{ ...underlinedInput(focused === id), marginTop: 6 }}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(id)}
      onBlur={() => setFocused(null)}
      autoComplete={autoComplete}
      placeholder={placeholder}
    />
  </div>
);

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  focused: string | null;
  setFocused: (s: string | null) => void;
  show: boolean;
  toggleShow: () => void;
  autoComplete?: string;
  placeholder?: string;
  delay?: number;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  id, label, value, onChange, focused, setFocused, show, toggleShow,
  autoComplete, placeholder, delay = 0.5,
}) => (
  <div style={{ marginBottom: 22, animation: `fadeUpSoft 0.6s ease ${delay}s both` }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 6,
    }}>
      <label style={labelStyle}>{label}</label>
      <button
        type="button"
        onClick={toggleShow}
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
        {show ? 'hide' : 'show'}
      </button>
    </div>
    <input
      style={underlinedInput(focused === id)}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(id)}
      onBlur={() => setFocused(null)}
      autoComplete={autoComplete}
      placeholder={placeholder}
    />
  </div>
);

interface PrimaryButtonProps {
  onClick: () => void;
  label: string;
  arrow?: string;
  loading?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ onClick, label, arrow = '→', loading = false }) => (
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

interface InlineLinkProps {
  onClick: () => void;
  children: React.ReactNode;
}

export const InlineLink: React.FC<InlineLinkProps> = ({ onClick, children }) => (
  <button
    onClick={onClick}
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
    {children}
  </button>
);

export const ErrorBar: React.FC<{ text: string }> = ({ text }) => (
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

export const Sidenote: React.FC<{ title: string; children: React.ReactNode; delay?: number }> = ({
  title, children, delay = 0.85,
}) => (
  <div style={{
    marginTop: 28,
    padding: '14px 16px',
    background: 'rgba(45,90,61,0.045)',
    borderLeft: '2px solid var(--moss)',
    fontFamily: BODY,
    animation: `fadeUpSoft 0.6s ease ${delay}s both`,
  }}>
    <div style={{
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--moss)',
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      marginBottom: 5,
    }}>
      {title}
    </div>
    <div style={{ fontSize: 12, color: '#888', lineHeight: 1.55 }}>
      {children}
    </div>
  </div>
);

// ─── Bottom secondary CTA (used for cross-links between auth screens) ────────

interface BottomCTAProps {
  eyebrow: string;
  label: string;
  onClick: () => void;
  delay?: number;
}

export const BottomCTA: React.FC<BottomCTAProps> = ({ eyebrow, label, onClick, delay = 0.75 }) => (
  <div style={{
    marginTop: 38,
    paddingTop: 28,
    borderTop: '1px solid rgba(26,58,42,0.12)',
    textAlign: 'center',
    animation: `fadeUpSoft 0.6s ease ${delay}s both`,
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
      {eyebrow}
    </div>
    <button
      onClick={onClick}
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
      {label}
      <span style={{ marginLeft: 8 }}>→</span>
    </button>
  </div>
);
