import React, { useEffect } from 'react';

interface Props { onDone: ()=>void; }

const SplashScreen: React.FC<Props> = ({ onDone }) => {
  useEffect(()=>{ const t = setTimeout(onDone, 2000); return ()=>clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position:'fixed', inset:0, background:'var(--forest)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ textAlign:'center', animation:'fadeUp 0.8s ease' }}>
        <div style={{ width:96, height:96, borderRadius:24, background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', border:'2px solid rgba(106,173,120,0.4)', fontSize:48 }}>🌿</div>
        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:30, color:'white', fontWeight:900 }}>AIWMR</div>
        <div style={{ color:'var(--sage)', fontSize:13, marginTop:6, letterSpacing:'0.14em', textTransform:'uppercase' }}>Training Academy</div>
        <div style={{ marginTop:40, display:'flex', gap:6, justifyContent:'center' }}>
          {[0,1,2].map(i=>(
            <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'var(--leaf)', animation:`pulse 1.2s ease ${i*0.2}s infinite` }}/>
          ))}
        </div>
      </div>
    </div>
  );
};
export default SplashScreen;
