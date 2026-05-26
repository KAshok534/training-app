/**
 * SplashScreen — first 2 seconds of every app launch.
 *
 * Cream parchment (matches the auth flow that follows — no color flash).
 * AIWMR logo, italic Fraunces tagline, small caps establishment line.
 */
import React, { useEffect } from 'react';
import ParchmentBackdrop from '../components/ParchmentBackdrop';
import { DISPLAY, BODY } from '../components/AuthShell';

interface Props { onDone: () => void; }

const SplashScreen: React.FC<Props> = ({ onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <ParchmentBackdrop decorations="full">
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 30px',
      }}>
        <div style={{
          maxWidth: 360,
          textAlign: 'center',
          animation: 'fadeUpSoft 0.7s ease both',
        }}>
          {/* Establishment line above logo */}
          <div style={{
            fontFamily: BODY,
            fontSize: 9, fontWeight: 600,
            color: 'var(--moss)',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            marginBottom: 22,
            animation: 'fadeUpSoft 0.6s ease 0.1s both',
          }}>
            — Established · Hyderabad
          </div>

          {/* AIWMR logo */}
          <img
            src="/logo.png"
            alt="AIWMR Training Academy"
            style={{
              width: '78%',
              maxWidth: 280,
              height: 'auto',
              opacity: 0.95,
              animation: 'fadeUpSoft 0.8s ease 0.2s both',
            }}
          />

          {/* Italic tagline */}
          <div style={{
            fontFamily: DISPLAY,
            fontStyle: 'italic',
            fontSize: 17,
            color: 'var(--moss)',
            opacity: 0.85,
            lineHeight: 1.4,
            marginTop: 24,
            animation: 'fadeUpSoft 0.7s ease 0.4s both',
          }}>
            Training Academy
          </div>

          {/* Decorative ✦ rule */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            margin: '32px auto 0',
            maxWidth: 200,
            animation: 'fadeUpSoft 0.7s ease 0.5s both',
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
            <span style={{
              fontFamily: DISPLAY,
              fontSize: 13,
              color: 'var(--moss)',
              opacity: 0.7,
            }}>✦</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
          </div>

          {/* Subtle loading dots */}
          <div style={{
            marginTop: 32,
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            animation: 'fadeUpSoft 0.5s ease 0.7s both',
          }}>
            {[0, 1, 2].map(i => (
              <span
                key={i}
                style={{
                  width: 5, height: 5,
                  borderRadius: '50%',
                  background: 'var(--moss)',
                  opacity: 0.4,
                  animation: `pulse 1.4s ease ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Footer mark */}
        <div style={{
          position: 'absolute',
          bottom: 'calc(28px + var(--safe-bottom))',
          left: 0, right: 0,
          textAlign: 'center',
          fontFamily: DISPLAY,
          fontStyle: 'italic',
          fontSize: 11,
          color: 'var(--moss)',
          opacity: 0.55,
          letterSpacing: '0.04em',
          animation: 'fadeUpSoft 0.7s ease 0.9s both',
        }}>
          ✦{'  '}Ashrita Institute for Waste Management &amp; Research
        </div>
      </div>
    </ParchmentBackdrop>
  );
};

export default SplashScreen;
