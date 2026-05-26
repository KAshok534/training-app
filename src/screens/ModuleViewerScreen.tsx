/**
 * ModuleViewerScreen — editorial dark-mode slide viewer
 *
 * Swipeable per-slide image viewer for 'slideshow' type modules.
 * Loads slides from public/course-content/<path>/slide-01.jpg … slide-NN.jpg
 *
 * Input methods (all three work):
 *   - Swipe left / right
 *   - Tap left-third / right-third of the screen
 *   - Prev / Next buttons in the bottom bar
 *
 * On open: marks user_progress → 'in-progress' (unless already 'completed')
 * On last slide: bottom bar morphs to "Take Assessment" CTA
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useEnrollment } from '../hooks/useEnrollment';
import { DISPLAY, BODY } from '../components/AuthShell';
import type { CourseModule } from '../types';

interface Props {
  moduleData: CourseModule;
  onBack: () => void;
  onStartAssessment: (module: CourseModule) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0');

const toRoman = (n: number): string => {
  const map: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let result = ''; let num = n;
  for (const [val, sym] of map) {
    while (num >= val) { result += sym; num -= val; }
  }
  return result;
};

const ModuleViewerScreen: React.FC<Props> = ({ moduleData, onBack, onStartAssessment }) => {
  const { user } = useAuth();
  useEnrollment(); // warm context for child screens

  const total = moduleData.slideCount ?? 1;
  const base  = moduleData.slideBaseUrl ?? '';

  const [current, setCurrent]     = useState(1);
  const [imgError, setImgError]   = useState(false);
  const [showHint, setShowHint]   = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);

  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);

  // Mark in-progress on mount (fire-and-forget)
  useEffect(() => {
    if (!user || moduleData.status === 'completed') return;
    supabase.from('user_progress').upsert(
      { user_id: user.id, module_id: moduleData.id, status: 'in-progress' },
      { onConflict: 'user_id,module_id' },
    );
  }, [user, moduleData.id, moduleData.status]);

  // Hide the swipe hint after 3.5s
  useEffect(() => {
    if (!showHint) return;
    const t = setTimeout(() => setShowHint(false), 3500);
    return () => clearTimeout(t);
  }, [showHint]);

  // Reset image-loaded state when slide changes
  useEffect(() => { setImgLoaded(false); setImgError(false); }, [current]);

  const goTo = useCallback((n: number) => {
    setImgError(false);
    setCurrent(c => {
      const next = Math.max(1, Math.min(total, n));
      if (next !== c) setShowHint(false); // any nav dismisses the hint
      return next;
    });
  }, [total]);

  // ── Swipe handling (also distinguishes from vertical scroll attempts) ───
  const handlePointerDown = (e: React.PointerEvent) => {
    swipeStartX.current = e.clientX;
    swipeStartY.current = e.clientY;
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (swipeStartX.current === null || swipeStartY.current === null) return;
    const dx = e.clientX - swipeStartX.current;
    const dy = e.clientY - swipeStartY.current;
    swipeStartX.current = null;
    swipeStartY.current = null;

    // Vertical swipe — ignore (user might be trying to scroll)
    if (Math.abs(dy) > Math.abs(dx)) return;
    // Too short — treat as tap (handled separately)
    if (Math.abs(dx) < 40) return;

    if (dx < 0) goTo(current + 1);
    else        goTo(current - 1);
  };

  // ── Tap zones: left third → prev, right third → next, middle → nothing ──
  const handleZoneClick = (zone: 'left' | 'right') => {
    if (zone === 'left')  goTo(current - 1);
    if (zone === 'right') goTo(current + 1);
  };

  // ── Keyboard navigation (for desktop preview) ───────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(current + 1);
      if (e.key === 'ArrowLeft')  goTo(current - 1);
      if (e.key === 'Escape')     onBack();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, goTo, onBack]);

  const pct      = Math.round(((current - 1) / Math.max(total - 1, 1)) * 100);
  const slideUrl = `${base}/slide-${pad(current)}.jpg`;
  const isLast   = current === total;
  const isFirst  = current === 1;

  // Preload next + previous slide for instant transitions
  const preloadNext = current < total ? `${base}/slide-${pad(current + 1)}.jpg` : null;
  const preloadPrev = current > 1     ? `${base}/slide-${pad(current - 1)}.jpg` : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column',
      background: '#0d1d15', // deep forest, paper grain darkened
      overflow: 'hidden',
    }}>
      {/* Subtle paper grain overlay (very low opacity for the dark mode) */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        opacity: 0.4,
        background: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.05 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
      }}/>

      {/* ─── TOP BAR — editorial chrome ──────────────────────────────────── */}
      <header style={{
        position: 'relative', zIndex: 2, flexShrink: 0,
        padding: 'calc(14px + var(--safe-top)) 20px 12px',
        animation: 'fadeUpSoft 0.5s ease 0.1s both',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          maxWidth: 520, margin: '0 auto',
        }}>
          <button onClick={onBack}
            style={{
              fontFamily: DISPLAY,
              fontStyle: 'italic',
              fontSize: 14,
              color: 'rgba(255,255,255,0.7)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '6px 14px',
              borderRadius: 2,
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            ✕ exit
          </button>

          <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <div style={{
              fontFamily: DISPLAY,
              fontSize: 14,
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.9)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}>
              {moduleData.title}
            </div>
            <div style={{
              fontFamily: BODY,
              fontSize: 9, fontWeight: 600,
              color: 'rgba(168,197,176,0.7)',
              letterSpacing: '0.34em',
              textTransform: 'uppercase',
              marginTop: 3,
            }}>
              {toRoman(current)} <span style={{ opacity: 0.5 }}>of</span> {toRoman(total)}
            </div>
          </div>

          <div style={{
            fontFamily: BODY,
            fontSize: 10, fontWeight: 700,
            color: 'var(--leaf)',
            letterSpacing: '0.14em',
            minWidth: 36, textAlign: 'right',
            flexShrink: 0,
          }}>
            {pct}%
          </div>
        </div>

        {/* Progress rule */}
        <div style={{
          maxWidth: 520, margin: '14px auto 0',
          height: 1,
          background: 'rgba(255,255,255,0.1)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0,
            height: 1,
            background: 'var(--leaf)',
            width: `${pct}%`,
            transition: 'width 0.5s ease',
            boxShadow: '0 0 8px rgba(106,173,120,0.5)',
          }}/>
        </div>
      </header>

      {/* ─── SLIDE STAGE ───────────────────────────────────────────────── */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        style={{
          position: 'relative', zIndex: 1,
          flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          touchAction: 'pan-y',
          userSelect: 'none',
          padding: '12px 16px',
          overflow: 'hidden',
        }}
      >
        {/* Left tap zone (prev) */}
        <div
          onClick={() => handleZoneClick('left')}
          style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: '32%',
            zIndex: 3,
            cursor: isFirst ? 'default' : 'w-resize',
          }}
          aria-label="Previous slide"
        />

        {/* Right tap zone (next) */}
        <div
          onClick={() => handleZoneClick('right')}
          style={{
            position: 'absolute',
            right: 0, top: 0, bottom: 0,
            width: '32%',
            zIndex: 3,
            cursor: isLast ? 'default' : 'e-resize',
          }}
          aria-label="Next slide"
        />

        {/* The slide itself — floats with a soft drop shadow like a printed plate */}
        <div style={{
          position: 'relative',
          maxWidth: '100%', maxHeight: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          filter: 'drop-shadow(0 18px 40px rgba(0,0,0,0.55))',
        }}>
          {imgError ? (
            <div style={{
              padding: '40px 30px',
              textAlign: 'center',
              fontFamily: DISPLAY,
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.5)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>✦</div>
              <div style={{ fontSize: 15 }}>This slide could not be loaded.</div>
            </div>
          ) : (
            <img
              key={slideUrl}
              src={slideUrl}
              alt={`Slide ${current}`}
              draggable={false}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                display: 'block',
                opacity: imgLoaded ? 1 : 0,
                transition: 'opacity 0.25s ease',
                borderRadius: 2,
              }}
            />
          )}

          {/* Loading shimmer placeholder */}
          {!imgLoaded && !imgError && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: DISPLAY, fontStyle: 'italic',
              fontSize: 13, color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.04em',
            }}>
              loading slide…
            </div>
          )}
        </div>

        {/* First-time swipe hint */}
        {showHint && current === 1 && (
          <div style={{
            position: 'absolute',
            bottom: 20, left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 4,
            pointerEvents: 'none',
            fontFamily: DISPLAY,
            fontStyle: 'italic',
            fontSize: 13,
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: '0.05em',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(10px)',
            padding: '8px 18px',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.08)',
            animation: 'fadeUpSoft 0.5s ease 0.6s both, hintPulse 2s ease-in-out 1s infinite',
            whiteSpace: 'nowrap',
          }}>
            swipe or tap edges to navigate
          </div>
        )}
      </div>

      {/* ─── BOTTOM BAR — morphs on last slide ────────────────────────────── */}
      <footer style={{
        position: 'relative', zIndex: 2, flexShrink: 0,
        padding: '14px 20px calc(14px + var(--safe-bottom))',
        animation: 'fadeUpSoft 0.5s ease 0.2s both',
      }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>

          {isLast ? (
            /* ─── Last slide: editorial completion CTA ─── */
            <>
              <div style={{
                fontFamily: BODY,
                fontSize: 9, fontWeight: 600,
                color: 'var(--leaf)',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                textAlign: 'center',
                marginBottom: 8,
              }}>
                ✦ End of module ✦
              </div>
              <p style={{
                fontFamily: DISPLAY,
                fontStyle: 'italic',
                fontSize: 14,
                color: 'rgba(255,255,255,0.7)',
                textAlign: 'center',
                margin: '0 0 14px',
                lineHeight: 1.4,
              }}>
                You've reached the end. Take the assessment when ready.
              </p>

              {/* Cream-on-dark CTA — pops against the forest bg */}
              <button
                onClick={() => onStartAssessment(moduleData)}
                onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(1px)'; }}
                onMouseUp={e   => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';   }}
                onMouseLeave={e=> { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';   }}
                style={{
                  width: '100%',
                  padding: '18px 26px',
                  background: 'var(--cream)',
                  color: 'var(--forest)',
                  border: 'none',
                  borderRadius: 2,
                  fontFamily: BODY,
                  fontSize: 13, fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.24em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                  boxShadow: '0 8px 28px -6px rgba(0,0,0,0.5)',
                  transition: 'transform 0.12s ease, box-shadow 0.2s ease',
                }}
              >
                <span>Take Assessment</span>
                <span style={{
                  fontFamily: DISPLAY,
                  fontStyle: 'italic',
                  fontSize: 20,
                  fontWeight: 400,
                  textTransform: 'none',
                  letterSpacing: 0,
                  transform: 'translateY(-1px)',
                }}>→</span>
              </button>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 24,
                marginTop: 14,
              }}>
                <button
                  onClick={() => goTo(current - 1)}
                  style={{
                    fontFamily: DISPLAY,
                    fontStyle: 'italic',
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.55)',
                    background: 'none', border: 'none',
                    padding: 0, cursor: 'pointer',
                    textDecoration: 'underline',
                    textDecorationStyle: 'dotted',
                    textUnderlineOffset: '4px',
                  }}
                >
                  ↩ back one slide
                </button>
                <button
                  onClick={onBack}
                  style={{
                    fontFamily: DISPLAY,
                    fontStyle: 'italic',
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.55)',
                    background: 'none', border: 'none',
                    padding: 0, cursor: 'pointer',
                    textDecoration: 'underline',
                    textDecorationStyle: 'dotted',
                    textUnderlineOffset: '4px',
                  }}
                >
                  save & exit
                </button>
              </div>
            </>
          ) : (
            /* ─── Mid-slideshow nav ─── */
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <button
                onClick={() => goTo(current - 1)}
                disabled={isFirst}
                style={{
                  flex: '0 0 38%',
                  padding: '14px 18px',
                  background: 'transparent',
                  color: isFirst ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: 2,
                  fontFamily: BODY,
                  fontSize: 11, fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.22em',
                  cursor: isFirst ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 18, fontWeight: 400, letterSpacing: 0 }}>‹</span>
                <span>Prev</span>
              </button>

              <button
                onClick={() => goTo(current + 1)}
                style={{
                  flex: 1,
                  padding: '14px 18px',
                  background: 'var(--leaf)',
                  color: 'var(--forest)',
                  border: 'none',
                  borderRadius: 2,
                  fontFamily: BODY,
                  fontSize: 12, fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.22em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  boxShadow: '0 6px 20px -6px rgba(106,173,120,0.6)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Next</span>
                <span style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 20, fontWeight: 400, letterSpacing: 0, transform: 'translateY(-1px)' }}>→</span>
              </button>
            </div>
          )}
        </div>
      </footer>

      {/* Preload neighbour slides for instant transitions */}
      {preloadNext && <link rel="preload" as="image" href={preloadNext}/>}
      {preloadPrev && <link rel="preload" as="image" href={preloadPrev}/>}
    </div>
  );
};

export default ModuleViewerScreen;
