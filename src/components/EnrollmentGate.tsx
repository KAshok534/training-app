import React from 'react';
import { Spinner } from './UI';

interface Props {
  loading: boolean;
  enrolled: boolean;
  icon: string;
  title: string;
  message: string;
  onBrowse: () => void;
  children: React.ReactNode;
}

const EnrollmentGate: React.FC<Props> = ({ loading, enrolled, icon, title, message, onBrowse, children }) => {
  if (loading) return (
    <div style={{ position:'fixed', inset:0, background:'var(--cream)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Spinner size={32} color="var(--forest)"/>
    </div>
  );

  if (!enrolled) return (
    <div className="screen">
      <div style={{ background:'var(--forest)', padding:'20px 20px 24px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:24, fontWeight:900 }}>{title}</div>
        <div style={{ color:'var(--sage)', fontSize:13, marginTop:2 }}>AIWMR Training Academy</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 32px', textAlign:'center' }}>
        <div style={{ fontSize:72, marginBottom:20 }}>{icon}</div>
        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:22, fontWeight:700, color:'var(--forest)', marginBottom:12 }}>
          {title} Locked
        </div>
        <div style={{ fontSize:14, color:'#888', lineHeight:1.7, marginBottom:32, maxWidth:280 }}>
          {message}
        </div>
        <button onClick={onBrowse} style={{ padding:'14px 32px', background:'var(--forest)', color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
          Browse Courses →
        </button>
      </div>
    </div>
  );

  return <>{children}</>;
};

export default EnrollmentGate;
