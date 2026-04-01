import React, { useState } from 'react';
import { Card } from '../components/UI';
import Icon from '../components/Icon';

const AttendanceScreen: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [scanned,  setScanned]  = useState(false);

  const startScan = () => {
    setScanning(true);
    // 🔧 REPLACE WITH REAL QR SCANNER:
    // npm install react-qr-reader
    // import { QrReader } from 'react-qr-reader';
    // On result: validate QR against supabase.from('session_qr_codes') then insert attendance
    setTimeout(()=>{ setScanning(false); setScanned(true); }, 2500);
  };

  return (
    <div className="screen">
      <div style={{ background:'var(--forest)', padding:'20px 20px 24px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:24, fontWeight:900 }}>Attendance</div>
        <div style={{ color:'var(--sage)', fontSize:13, marginTop:2 }}>QR-Based Check-in System</div>
      </div>

      <div style={{ padding:'16px' }}>
        {scanned ? (
          <div style={{ textAlign:'center', animation:'fadeUp 0.4s ease' }}>
            <div style={{ fontSize:80, marginBottom:20 }}>✅</div>
            <div style={{ fontFamily:"'Playfair Display', serif", fontSize:28, fontWeight:900, color:'var(--forest)', marginBottom:6 }}>Marked!</div>
            <div style={{ color:'#888', fontSize:14, marginBottom:24 }}>Feb 17, 2026 · 10:22 AM</div>
            <Card style={{ padding:20, marginBottom:20 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[['Session','Day 14'],['Attended','12/14'],['Percentage','87%'],['Status','✅ Good']].map(([l,v])=>(
                  <div key={l} style={{ textAlign:'center', padding:12, background:'var(--mist)', borderRadius:12 }}>
                    <div style={{ fontWeight:700, fontSize:16, color:'var(--forest)' }}>{v}</div>
                    <div style={{ fontSize:11, color:'#999', marginTop:3 }}>{l}</div>
                  </div>
                ))}
              </div>
            </Card>
            <button onClick={()=>setScanned(false)} style={{ padding:'12px 32px', background:'var(--sand)', color:'var(--charcoal)', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
              Scan Again
            </button>
          </div>
        ) : (
          <div>
            <Card style={{ padding:24, marginBottom:16, textAlign:'center' }}>
              <div style={{ fontSize:14, color:'#888', marginBottom:20 }}>Point camera at session QR code</div>
              {/* QR Viewfinder */}
              <div style={{ position:'relative', width:240, height:240, margin:'0 auto', borderRadius:16, border:'2px dashed var(--sage)', overflow:'hidden' }}>
                {([
                  { top:12, left:12, borderRadius:'8px 0 0 0',  borderRight:'none', borderBottom:'none' },
                  { top:12, right:12, borderRadius:'0 8px 0 0', borderLeft:'none',  borderBottom:'none' },
                  { bottom:12, left:12, borderRadius:'0 0 0 8px', borderRight:'none', borderTop:'none'  },
                  { bottom:12, right:12, borderRadius:'0 0 8px 0', borderLeft:'none', borderTop:'none'  },
                ] as React.CSSProperties[]).map((st,i)=>(
                  <div key={i} style={{ position:'absolute', width:24, height:24, border:`3px solid ${scanning?'var(--amber)':'var(--forest)'}`, transition:'border-color 0.3s', ...st }}/>
                ))}
                {scanning && <div style={{ position:'absolute', left:12, right:12, height:2, background:'linear-gradient(90deg,transparent,var(--leaf),transparent)', top:'30%', animation:'scanLine 1.5s ease-in-out infinite' }}/>}
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10 }}>
                  <Icon name="scan" size={52} color={scanning?'var(--amber)':'var(--sage)'}/>
                  {scanning && <div style={{ fontSize:12, color:'var(--amber)', fontWeight:700, animation:'pulse 1s infinite' }}>Scanning...</div>}
                </div>
              </div>
            </Card>

            <button onClick={startScan} disabled={scanning} style={{ width:'100%', padding:'16px', background:scanning?'var(--sage)':'var(--forest)', color:'white', border:'none', borderRadius:16, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif", marginBottom:12, transition:'background 0.2s' }}>
              {scanning?'Scanning...':'📷 Scan QR Code'}
            </button>
            <button onClick={()=>setScanned(true)} style={{ width:'100%', padding:'14px', background:'var(--sand)', color:'var(--charcoal)', border:'none', borderRadius:16, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
              Enter Code Manually
            </button>

            {/* Monthly calendar grid */}
            <Card style={{ padding:20, marginTop:16 }}>
              <div style={{ fontWeight:700, marginBottom:14 }}>This Month's Record</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6 }}>
                {Array.from({length:28},(_,i)=>{
                  const s = i<14?(((i*7+3)%5!==0)?'present':'absent'):i<16?'today':'future';
                  return <div key={i} style={{ aspectRatio:'1', borderRadius:6, background:s==='present'?'var(--leaf)':s==='absent'?'rgba(192,57,43,0.2)':s==='today'?'var(--amber)':'var(--sand)', border:s==='today'?'2px solid var(--earth)':'none' }}/>;
                })}
              </div>
              <div style={{ display:'flex', gap:16, marginTop:12 }}>
                {[['var(--leaf)','Present'],['rgba(192,57,43,0.3)','Absent'],['var(--sand)','Upcoming']].map(([c,l])=>(
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:c }}/>
                    <span style={{ fontSize:11, color:'#888' }}>{l}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
export default AttendanceScreen;
