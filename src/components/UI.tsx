import React from 'react';

interface BadgeProps { text: string; color?: string; bg?: string; }
export const Badge: React.FC<BadgeProps> = ({ text, color='var(--pine)', bg='rgba(45,90,61,0.12)' }) => (
  <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding:'3px 10px', borderRadius: 20, letterSpacing:'0.04em', textTransform:'uppercase', display:'inline-block', whiteSpace:'nowrap' }}>{text}</span>
);

interface ProgressBarProps { value: number; max: number; color?: string; height?: number; }
export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, color='var(--leaf)', height=6 }) => (
  <div style={{ background:'var(--sand)', borderRadius: 10, height, overflow:'hidden', width:'100%' }}>
    <div style={{ width:`${Math.min(100, Math.round((value/max)*100))}%`, height:'100%', background: color, borderRadius: 10, transition:'width 1s ease' }}/>
  </div>
);

export const Spinner: React.FC<{ size?: number; color?: string }> = ({ size=20, color='white' }) => (
  <div style={{ width: size, height: size, border:`2px solid rgba(255,255,255,0.25)`, borderTopColor: color, borderRadius:'50%', animation:'spin 0.8s linear infinite', flexShrink: 0 }}/>
);

interface BtnProps { loading?: boolean; disabled?: boolean; onClick?: ()=>void; children: React.ReactNode; style?: React.CSSProperties; variant?: 'primary'|'secondary'|'ghost'; }
export const Btn: React.FC<BtnProps> = ({ loading=false, disabled=false, onClick, children, style, variant='primary' }) => {
  const base: React.CSSProperties = {
    display:'flex', alignItems:'center', justifyContent:'center', gap: 8,
    padding:'14px 20px', borderRadius: 14, border:'none', cursor: disabled||loading?'not-allowed':'pointer',
    fontSize: 15, fontWeight: 700, fontFamily:"'DM Sans', sans-serif", width:'100%',
    opacity: disabled ? 0.6 : 1, transition:'opacity 0.2s, transform 0.1s',
    ...(variant==='primary' ? { background:'var(--forest)', color:'white' } :
        variant==='secondary' ? { background:'var(--sand)', color:'var(--charcoal)' } :
        { background:'transparent', color:'var(--forest)' }),
    ...style,
  };
  return <button onClick={onClick} disabled={disabled||loading} style={base}>{loading ? <Spinner /> : children}</button>;
};

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; onClick?: ()=>void }> = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background:'var(--white)', borderRadius: 18, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', cursor: onClick?'pointer':'default', ...style }}>
    {children}
  </div>
);

export const Divider: React.FC = () => (
  <div style={{ height: 1, background:'var(--sand)', margin:'4px 0' }}/>
);
