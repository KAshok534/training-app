import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

/**
 * Shows an install banner at the top of the screen when the PWA is installable.
 * Automatically disappears after install or dismissal.
 */
const InstallBanner: React.FC = () => {
  const { canInstall, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = React.useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div style={{
      position:'fixed', top:'var(--safe-top)', left:0, right:0, zIndex: 9999,
      background:'var(--forest)', color:'white',
      display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
      animation:'fadeUp 0.4s ease',
      boxShadow:'0 4px 20px rgba(0,0,0,0.2)',
    }}>
      <span style={{ fontSize: 24 }}>🌿</span>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:700, fontSize:14 }}>Install AIWMR App</div>
        <div style={{ fontSize:12, color:'var(--sage)', marginTop:1 }}>
          Add to home screen for the best experience
        </div>
      </div>
      <button
        onClick={promptInstall}
        style={{ background:'var(--leaf)', color:'var(--forest)', border:'none', borderRadius:10, padding:'8px 16px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans', sans-serif", whiteSpace:'nowrap' }}
      >
        Install
      </button>
      <button
        onClick={()=>setDismissed(true)}
        style={{ background:'rgba(255,255,255,0.12)', border:'none', borderRadius:8, padding:'6px 10px', color:'white', cursor:'pointer', fontSize:12 }}
      >
        ✕
      </button>
    </div>
  );
};

export default InstallBanner;
