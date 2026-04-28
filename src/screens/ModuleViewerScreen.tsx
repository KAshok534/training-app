/**
 * ModuleViewerScreen
 *
 * Swipeable per-slide image viewer for 'slideshow' type modules.
 * Loads slides from public/course-content/<path>/slide-01.jpg … slide-NN.jpg
 *
 * On open: marks user_progress → 'in-progress' (unless already 'completed')
 * On last slide: shows "Take Assessment →" CTA
 */
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useEnrollment } from '../hooks/useEnrollment';
import type { CourseModule } from '../types';

interface Props {
  moduleData: CourseModule;
  onBack: () => void;
  onStartAssessment: (module: CourseModule) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

const ModuleViewerScreen: React.FC<Props> = ({ moduleData, onBack, onStartAssessment }) => {
  const { user } = useAuth();
  useEnrollment(); // ensure enrollment context is warm (used by child screens)
  const total           = moduleData.slideCount ?? 1;
  const base            = moduleData.slideBaseUrl ?? '';

  const [current, setCurrent]   = useState(1);
  const [imgError, setImgError] = useState(false);

  // Swipe tracking
  const swipeStartX = useRef<number | null>(null);

  // Mark in-progress on mount (fire-and-forget)
  useEffect(() => {
    if (!user || moduleData.status === 'completed') return;
    supabase.from('user_progress').upsert(
      { user_id: user.id, module_id: moduleData.id, status: 'in-progress' },
      { onConflict: 'user_id,module_id' }
    );
  }, [user, moduleData.id, moduleData.status]);

  const goTo = (n: number) => {
    setImgError(false);
    setCurrent(Math.max(1, Math.min(total, n)));
  };

  const handlePointerDown = (e: React.PointerEvent) => { swipeStartX.current = e.clientX; };
  const handlePointerUp   = (e: React.PointerEvent) => {
    if (swipeStartX.current === null) return;
    const dx = e.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(dx) < 40) return; // too short
    if (dx < 0) goTo(current + 1); // swipe left → next
    else         goTo(current - 1); // swipe right → prev
  };

  const pct = Math.round(((current - 1) / Math.max(total - 1, 1)) * 100);

  const slideUrl = `${base}/slide-${pad(current)}.jpg`;
  const isLast   = current === total;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#111', position:'fixed', inset:0, zIndex:50 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'rgba(0,0,0,0.7)', flexShrink:0, paddingTop:`max(12px, env(safe-area-inset-top))` }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'white', width:36, height:36, borderRadius:10, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          ‹
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:'white', fontSize:13, fontWeight:700, fontFamily:"'DM Sans', sans-serif", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {moduleData.title}
          </div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontFamily:"'DM Sans', sans-serif", marginTop:1 }}>
            Slide {current} of {total}
          </div>
        </div>
        <div style={{ color:'var(--leaf)', fontSize:12, fontWeight:700, fontFamily:"'DM Sans', sans-serif", flexShrink:0 }}>
          {pct}%
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height:3, background:'rgba(255,255,255,0.1)', flexShrink:0 }}>
        <div style={{ height:'100%', background:'var(--leaf)', width:`${pct}%`, transition:'width 0.3s ease' }}/>
      </div>

      {/* Slide image */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', touchAction:'pan-y', userSelect:'none' }}
      >
        {imgError ? (
          <div style={{ textAlign:'center', color:'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize:40, marginBottom:8 }}>🖼️</div>
            <div style={{ fontSize:13 }}>Slide unavailable</div>
          </div>
        ) : (
          <img
            key={slideUrl}
            src={slideUrl}
            alt={`Slide ${current}`}
            draggable={false}
            onError={() => setImgError(true)}
            style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', display:'block' }}
          />
        )}
      </div>

      {/* Bottom controls */}
      <div style={{ flexShrink:0, background:'rgba(0,0,0,0.7)', padding:'12px 16px', paddingBottom:`max(12px, env(safe-area-inset-bottom))` }}>
        {isLast ? (
          /* Last slide — show Assessment CTA */
          <div>
            <button
              onClick={() => onStartAssessment(moduleData)}
              style={{ width:'100%', padding:'16px', background:'var(--leaf)', color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, fontFamily:"'DM Sans', sans-serif", cursor:'pointer', marginBottom:10 }}
            >
              🎯 Take Assessment →
            </button>
            <div style={{ display:'flex', gap:10 }}>
              <button
                onClick={() => goTo(current - 1)}
                style={{ flex:1, padding:'12px', background:'rgba(255,255,255,0.1)', color:'white', border:'none', borderRadius:12, fontSize:13, fontWeight:600, fontFamily:"'DM Sans', sans-serif", cursor:'pointer' }}
              >
                ‹ Prev
              </button>
              <button
                onClick={onBack}
                style={{ flex:1, padding:'12px', background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', border:'none', borderRadius:12, fontSize:13, fontFamily:"'DM Sans', sans-serif", cursor:'pointer' }}
              >
                Save & Exit
              </button>
            </div>
          </div>
        ) : (
          /* Normal slide nav */
          <div style={{ display:'flex', gap:10 }}>
            <button
              onClick={() => goTo(current - 1)}
              disabled={current === 1}
              style={{ flex:1, padding:'14px', background: current === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)', color: current === 1 ? 'rgba(255,255,255,0.3)' : 'white', border:'none', borderRadius:12, fontSize:14, fontWeight:600, fontFamily:"'DM Sans', sans-serif", cursor: current === 1 ? 'default' : 'pointer' }}
            >
              ‹ Prev
            </button>
            <button
              onClick={() => goTo(current + 1)}
              style={{ flex:2, padding:'14px', background:'var(--forest)', color:'white', border:'none', borderRadius:12, fontSize:14, fontWeight:700, fontFamily:"'DM Sans', sans-serif", cursor:'pointer' }}
            >
              Next ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleViewerScreen;
