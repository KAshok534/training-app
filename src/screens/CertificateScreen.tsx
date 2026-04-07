import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Icon from '../components/Icon';
import EnrollmentGate from '../components/EnrollmentGate';
import { useEnrollment } from '../hooks/useEnrollment';
import { useAuth } from '../context/AuthContext';

interface Props { onNavigate: (screen: string) => void; }

interface Certificate {
  certId: string;
  issuedAt: string;
  pdfUrl: string | null;
}

const CertificateScreen: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { loading: enrollLoading, enrollment } = useEnrollment();
  const [cert, setCert]             = useState<Certificate | null>(null);
  const [certLoading, setCertLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded]   = useState(false);

  useEffect(() => {
    if (!enrollment) return;

    supabase
      .from('certificates')
      .select('cert_id, issued_at, pdf_url')
      .eq('registration_id', enrollment.registrationId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCert({
            certId:   data.cert_id,
            issuedAt: new Date(data.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
            pdfUrl:   data.pdf_url,
          });
        }
        setCertLoading(false);
      });
  }, [enrollment]);

  const certName   = user?.name   ?? 'Student';
  const certCourse = enrollment?.courseTitle ?? 'AIWMR Certification Course';

  const handleDownload = () => {
    if (!cert) return;
    setDownloading(true);

    // If we have a real PDF URL, open it
    if (cert.pdfUrl) {
      window.open(cert.pdfUrl, '_blank');
      setTimeout(() => { setDownloading(false); setDownloaded(true); }, 800);
      return;
    }

    // Fallback: generate printable HTML
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
      <div class="meta">Issued: ${cert.issuedAt} &nbsp;|&nbsp; Cert ID: ${cert.certId}</div>
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
    if (!cert) return;
    const shareData = {
      title: 'AIWMR Certificate',
      text: `${certName} has earned a certificate in ${certCourse}. Cert ID: ${cert.certId}`,
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
    <EnrollmentGate
      loading={enrollLoading}
      enrolled={!!enrollment}
      icon="🏆"
      title="Certificates"
      message="You need to enroll in a course and complete payment to earn certificates."
      onBrowse={() => onNavigate('courses')}
    >
      <div className="screen">
        <div style={{ background:'var(--forest)', padding:'20px 20px 24px', position:'sticky', top:0, zIndex:10 }}>
          <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:24, fontWeight:900 }}>Certificates</div>
          <div style={{ color:'var(--sage)', fontSize:13, marginTop:2 }}>Your earned credentials · {enrollment?.courseTitle}</div>
        </div>

        <div style={{ padding:'16px' }}>
          {certLoading ? (
            <div style={{ textAlign:'center', padding:'60px 0', color:'#aaa' }}>Loading...</div>
          ) : cert ? (
            <>
              {/* Certificate card */}
              <div style={{ background:'linear-gradient(135deg, var(--forest) 0%, var(--pine) 60%, #1e4d30 100%)', borderRadius:24, padding:28, marginBottom:16, position:'relative', overflow:'hidden', boxShadow:'0 12px 40px rgba(26,58,42,0.4)' }}>
                <div style={{ position:'absolute', top:-30, right:-30, width:150, height:150, borderRadius:'50%', border:'2px solid rgba(201,168,76,0.15)' }}/>
                <div style={{ textAlign:'center', position:'relative' }}>
                  <div style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:16 }}>✦ Certificate of Completion ✦</div>
                  <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginBottom:6 }}>This is to certify that</div>
                  <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:26, fontWeight:900, marginBottom:6 }}>{certName}</div>
                  <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginBottom:12 }}>has successfully completed</div>
                  <div style={{ fontFamily:"'Playfair Display', serif", color:'var(--gold)', fontSize:16, fontWeight:700, lineHeight:1.3, marginBottom:20 }}>
                    {certCourse}
                  </div>
                  <div style={{ display:'flex', justifyContent:'center', gap:20, marginBottom:20 }}>
                    {[['Issued', cert.issuedAt], ['Cert ID', cert.certId]].map(([l, v], i) => (
                      <React.Fragment key={l}>
                        {i > 0 && <div style={{ width:1, background:'rgba(255,255,255,0.1)' }}/>}
                        <div style={{ textAlign:'center' }}>
                          <div style={{ color:'var(--sage)', fontSize:11 }}>{l}</div>
                          <div style={{ color:'white', fontSize:13, fontWeight:600 }}>{v}</div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                  {/* QR pattern */}
                  <div style={{ display:'inline-block', padding:8, background:'white', borderRadius:8 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, width:70 }}>
                      {Array.from({ length:49 }, (_, i) => (
                        <div key={i} style={{ width:'100%', aspectRatio:'1', background:(i * 13 + 7) % 3 !== 0 ? '#1a3a2a' : 'transparent' }}/>
                      ))}
                    </div>
                  </div>
                  <div style={{ color:'rgba(255,255,255,0.35)', fontSize:10, marginTop:6 }}>Scan to verify</div>
                </div>
              </div>

              <button
                onClick={handleDownload}
                style={{ width:'100%', padding:'16px', background:downloaded?'var(--leaf)':'var(--forest)', color:'white', border:'none', borderRadius:16, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif", marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'background 0.3s' }}
              >
                {downloading
                  ? <div style={{ width:20, height:20, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                  : downloaded
                    ? <><Icon name="check" size={18} color="white"/><span>Downloaded!</span></>
                    : <><Icon name="download" size={18} color="white"/><span>Download Certificate (PDF)</span></>}
              </button>

              <button
                onClick={handleShare}
                style={{ width:'100%', padding:'14px', background:'var(--sand)', color:'var(--charcoal)', border:'none', borderRadius:16, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif", marginBottom:24 }}
              >
                🔗 Share Certificate
              </button>
            </>
          ) : (
            /* No certificate yet */
            <div style={{ textAlign:'center', padding:'40px 24px', animation:'fadeUp 0.4s ease' }}>
              <div style={{ fontSize:72, marginBottom:20 }}>🎓</div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:22, fontWeight:700, color:'var(--forest)', marginBottom:12 }}>
                Keep Going!
              </div>
              <div style={{ fontSize:14, color:'#888', lineHeight:1.7, marginBottom:32, maxWidth:280, margin:'0 auto 32px' }}>
                Complete all course modules to earn your certificate of completion.
              </div>
              <button
                onClick={() => onNavigate('learning')}
                style={{ padding:'14px 32px', background:'var(--forest)', color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}
              >
                Continue Learning →
              </button>
            </div>
          )}
        </div>
      </div>
    </EnrollmentGate>
  );
};
export default CertificateScreen;
