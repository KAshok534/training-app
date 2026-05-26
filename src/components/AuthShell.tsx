/**
 * AuthShell — shared editorial chrome for auth screens
 *
 * Wraps ParchmentBackdrop with auth-specific chrome: scrollable centered frame,
 * institutional top bar (AIWMR logo + ESTABLISHED metadata), and footer mark.
 *
 * Used by LoginScreen, RegisterScreen, ResetPasswordScreen.
 */
import React from 'react';
import ParchmentBackdrop from './ParchmentBackdrop';

export const DISPLAY = "'Fraunces', 'Playfair Display', Georgia, serif";
export const BODY    = "'DM Sans', system-ui, sans-serif";

interface Props { children: React.ReactNode; }

const AuthShell: React.FC<Props> = ({ children }) => (
  <ParchmentBackdrop decorations="full">
    <div style={{
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
          opacity: 0.7,
          letterSpacing: '0.04em',
          lineHeight: 1.8,
          animation: 'fadeUpSoft 0.7s ease 0.95s both',
        }}>
          <div>✦&nbsp;&nbsp;Ashrita Institute for Waste Management &amp; Research</div>
          <div style={{ marginTop: 6, opacity: 0.85 }}>
            <a href="/privacy.html"
              style={{
                color: 'var(--moss)',
                textDecoration: 'underline',
                textDecorationStyle: 'dotted',
                textUnderlineOffset: '3px',
              }}>
              privacy policy
            </a>
          </div>
        </div>
      </div>
    </div>
  </ParchmentBackdrop>
);

export default AuthShell;
