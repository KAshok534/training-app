import React from 'react';

/**
 * Shows a non-intrusive banner when running in demo mode (no Supabase connected).
 * Disappears once you add your .env credentials.
 */
const DemoBanner: React.FC<{ isDemo: boolean }> = ({ isDemo }) => {
  const [visible, setVisible] = React.useState(true);
  if (!isDemo || !visible) return null;
  return (
    <div style={{
      background:'rgba(212,148,58,0.12)', borderBottom:'1.5px solid rgba(212,148,58,0.3)',
      padding:'8px 16px', display:'flex', alignItems:'center', gap:10, flexShrink:0,
    }}>
      <span style={{ fontSize:16 }}>🔧</span>
      <div style={{ flex:1, fontSize:12, color:'var(--earth)' }}>
        <strong>Demo mode</strong> — Add your <code style={{ background:'rgba(0,0,0,0.06)', padding:'1px 4px', borderRadius:4 }}>.env</code> credentials to connect Supabase
      </div>
      <button onClick={()=>setVisible(false)} style={{ background:'none', border:'none', color:'var(--earth)', cursor:'pointer', fontSize:14 }}>✕</button>
    </div>
  );
};

export default DemoBanner;
