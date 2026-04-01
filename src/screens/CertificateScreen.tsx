import React, { useState } from 'react';
import { COURSES } from '../data';
import Icon from '../components/Icon';

const CertificateScreen: React.FC = () => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded,  setDownloaded]  = useState(false);

  const certName = 'Sushanth Gade';
  const certCourse = 'Online Certification Course in Environment & Waste Management';
  const certId = 'AIWMR-2026-042';
  const certDate = 'Mar 15, 2026';

  const handleDownload = () => {
    setDownloading(true);
    // Build a printable HTML page and trigger print-to-PDF
    const html = `<!DOCTYPE html><html><head><title>AIWMR Certificate</title>
    <style>
      body { margin:0; background:#f7f3ec; font-family:Georgia,serif; display:flex; align-items:center; justify-content:center; min-height:100vh; }
      .cert { width:720px; padding:60px; background:linear-gradient(135deg,#1a3a2a,#2d5a3d); color:white; border-radius:16px; text-align:center; }
      .label { color:#c9a84c; font-size:13px; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:20px; }
      .sub { color:rgba(255,255,255,0.55); font-size:14px; margin-bottom:8px; }
      .name { font-size:34px; font-weight:900; margin-bottom:10px; }
      .course { color:#c9a84c; font-size:18px; font-weight:700; margin-bottom:28px; line-height:1.4; }
      .meta { font-size:13px; color:rgba(255,255,255,0.6); margin-top:20px; }
    </style></head><body>
    <div class="cert">
      <div class="label">✦ Certificate of Completion ✦</div>
      <div class="sub">This is to certify that</div>
      <div class="name">${certName}</div>
      <div class="sub">has successfully completed</div>
      <div class="course">${certCourse}</div>
      <div class="meta">Issued: ${certDate} &nbsp;|&nbsp; Cert ID: ${certId}</div>
    </div></body></html>`;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 400);
    }
    setTimeout(() => { setDownloading(false); setDownloaded(true); }, 1800);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'AIWMR Certificate',
      text: `${certName} has earned a certificate in ${certCourse}. Cert ID: ${certId}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* dismissed */ }
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      alert('Certificate details copied to clipboard!');
    }
  };

  return (
    <div className="screen">
      <div style={{ background:'var(--forest)', padding:'20px 20px 24px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:24, fontWeight:900 }}>Certificates</div>
        <div style={{ color:'var(--sage)', fontSize:13, marginTop:2 }}>Your earned credentials</div>
      </div>

      <div style={{ padding:'16px' }}>
        {/* Certificate card */}
        <div style={{ background:'linear-gradient(135deg, var(--forest) 0%, var(--pine) 60%, #1e4d30 100%)', borderRadius:24, padding:28, marginBottom:16, position:'relative', overflow:'hidden', boxShadow:'0 12px 40px rgba(26,58,42,0.4)' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:150, height:150, borderRadius:'50%', border:'2px solid rgba(201,168,76,0.15)' }}/>
          <div style={{ textAlign:'center', position:'relative' }}>
            <div style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:16 }}>✦ Certificate of Completion ✦</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginBottom:6 }}>This is to certify that</div>
            <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:26, fontWeight:900, marginBottom:6 }}>Sushanth Gade</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginBottom:12 }}>has successfully completed</div>
            <div style={{ fontFamily:"'Playfair Display', serif", color:'var(--gold)', fontSize:16, fontWeight:700, lineHeight:1.3, marginBottom:20 }}>
              Online Certification Course in<br/>Environment & Waste Management
            </div>
            <div style={{ display:'flex', justifyContent:'center', gap:20, marginBottom:20 }}>
              {[['Issued','Mar 15, 2026'],['Cert ID','AIWMR-2026-042']].map(([l,v],i)=>(
                <React.Fragment key={l}>
                  {i>0&&<div style={{ width:1, background:'rgba(255,255,255,0.1)' }}/>}
                  <div style={{ textAlign:'center' }}>
                    <div style={{ color:'var(--sage)', fontSize:11 }}>{l}</div>
                    <div style={{ color:'white', fontSize:13, fontWeight:600 }}>{v}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
            {/* Deterministic QR pattern */}
            <div style={{ display:'inline-block', padding:8, background:'white', borderRadius:8 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, width:70 }}>
                {Array.from({length:49},(_,i)=>(
                  <div key={i} style={{ width:'100%', aspectRatio:'1', background:(i*13+7)%3!==0?'#1a3a2a':'transparent' }}/>
                ))}
              </div>
            </div>
            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:10, marginTop:6 }}>Scan to verify</div>
          </div>
        </div>

        <button onClick={handleDownload} style={{ width:'100%', padding:'16px', background:downloaded?'var(--leaf)':'var(--forest)', color:'white', border:'none', borderRadius:16, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif", marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'background 0.3s' }}>
          {downloading
            ? <div style={{ width:20, height:20, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
            : downloaded ? <><Icon name="check" size={18} color="white"/><span>Downloaded!</span></>
            : <><Icon name="download" size={18} color="white"/><span>Download Certificate (PDF)</span></>}
        </button>

        <button onClick={handleShare} style={{ width:'100%', padding:'14px', background:'var(--sand)', color:'var(--charcoal)', border:'none', borderRadius:16, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif", marginBottom:24 }}>
          🔗 Share Certificate
        </button>

        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:18, fontWeight:700, marginBottom:12 }}>Upcoming Certificates</div>
        {COURSES.slice(1).map(c=>(
          <div key={c.id} style={{ background:'rgba(255,255,255,0.6)', borderRadius:16, padding:16, marginBottom:10, display:'flex', alignItems:'center', gap:14, opacity:0.7 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:`${c.color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{c.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:14 }}>{c.title}</div>
              <div style={{ fontSize:12, color:'#aaa', marginTop:3 }}>Not yet enrolled</div>
            </div>
            <Icon name="lock" size={18} color="#ccc"/>
          </div>
        ))}
      </div>
    </div>
  );
};
export default CertificateScreen;
