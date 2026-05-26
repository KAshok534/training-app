/**
 * CertificateScreen — editorial graduation moment.
 *
 * Two states:
 *   has-cert  → editorial certificate presentation + download/share CTAs
 *   no-cert   → "Keep going." encouragement + Continue Learning CTA
 *
 * The downloadable certificate is rendered as a print-friendly HTML page
 * styled in the same editorial language (cream parchment, Fraunces, gold rule).
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import EnrollmentGate from '../components/EnrollmentGate';
import ParchmentBackdrop from '../components/ParchmentBackdrop';
import { DISPLAY, BODY } from '../components/AuthShell';
import { PrimaryButton, InlineLink } from '../components/AuthForm';
import { useEnrollment } from '../hooks/useEnrollment';
import { useAuth } from '../context/AuthContext';

interface Props { onNavigate: (screen: string) => void; }

interface Certificate {
  certId:   string;
  issuedAt: string; // ISO
  pdfUrl:   string | null;
}

const CertificateScreen: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { loading: enrollLoading, enrollment } = useEnrollment();
  const [cert, setCert]               = useState<Certificate | null>(null);
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
            issuedAt: data.issued_at,
            pdfUrl:   data.pdf_url,
          });
        }
        setCertLoading(false);
      });
  }, [enrollment]);

  const studentName = user?.name ?? 'Student';
  const courseTitle = enrollment?.courseTitle ?? 'AIWMR Certification Course';
  const issuedDate  = cert ? new Date(cert.issuedAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : '';

  const handleDownload = () => {
    if (!cert) return;
    setDownloading(true);

    if (cert.pdfUrl) {
      window.open(cert.pdfUrl, '_blank');
      setTimeout(() => { setDownloading(false); setDownloaded(true); }, 800);
      return;
    }

    // Editorial print HTML — designed to feel like a real institutional certificate
    const html = `<!DOCTYPE html><html><head>
<title>AIWMR Certificate · ${cert.certId}</title>
<meta charset="UTF-8"/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Fraunces:ital,opsz,wght@0,9..144,400..600;1,9..144,400..600&display=swap"/>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f7f3ec; font-family: 'DM Sans', system-ui, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px; }
  .cert {
    position: relative;
    width: 100%;
    max-width: 1000px;
    aspect-ratio: 1.414 / 1;
    background: #f7f3ec;
    padding: 60px 80px;
    border: 1px solid rgba(26,58,42,0.2);
    box-shadow: 0 30px 80px rgba(26,58,42,0.18);
    overflow: hidden;
  }
  .cert::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 8px;
    background: linear-gradient(90deg, transparent, #c9a84c 30%, #c9a84c 70%, transparent);
  }
  .cert::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 8px;
    background: linear-gradient(90deg, transparent, #c9a84c 30%, #c9a84c 70%, transparent);
  }
  .topo { position: absolute; top: -120px; right: -100px; width: 380px; opacity: 0.08; pointer-events: none; }
  .leaf { position: absolute; bottom: -40px; left: -20px; width: 140px; opacity: 0.13; pointer-events: none; transform: rotate(-12deg); }
  .body { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .eyebrow { font-family: 'DM Sans'; font-size: 10px; font-weight: 700; color: #c9a84c; letter-spacing: 0.4em; text-transform: uppercase; margin-bottom: 32px; }
  .title { font-family: 'Fraunces', serif; font-size: 56px; font-weight: 400; color: #1a3a2a; line-height: 0.96; margin: 0 0 8px; letter-spacing: -0.022em; }
  .title em { font-style: italic; color: #4a7c59; }
  .lede { font-family: 'Fraunces', serif; font-style: italic; font-size: 18px; color: #2c2c2c; opacity: 0.7; margin: 0 0 36px; }
  .rule { display: flex; align-items: center; gap: 16px; width: 280px; margin: 0 auto 36px; }
  .rule hr { flex: 1; height: 1px; background: rgba(26,58,42,0.3); border: none; }
  .rule span { font-family: 'Fraunces', serif; font-size: 14px; color: #4a7c59; }
  .award-to { font-family: 'DM Sans'; font-size: 10px; font-weight: 600; color: #4a7c59; letter-spacing: 0.34em; text-transform: uppercase; margin-bottom: 14px; }
  .name { font-family: 'Fraunces', serif; font-style: italic; font-size: 56px; font-weight: 500; color: #1a3a2a; margin: 0 0 28px; letter-spacing: -0.02em; }
  .course-eyebrow { font-family: 'DM Sans'; font-size: 10px; font-weight: 600; color: #4a7c59; letter-spacing: 0.34em; text-transform: uppercase; margin-bottom: 12px; }
  .course { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 400; color: #1a3a2a; line-height: 1.3; margin: 0 0 40px; max-width: 700px; }
  .course em { font-style: italic; color: #4a7c59; }
  .meta-row { display: flex; justify-content: center; gap: 60px; margin-top: 20px; }
  .meta { text-align: center; }
  .meta .label { font-family: 'DM Sans'; font-size: 9px; font-weight: 700; color: #4a7c59; letter-spacing: 0.32em; text-transform: uppercase; margin-bottom: 6px; }
  .meta .value { font-family: 'DM Sans'; font-size: 14px; color: #1a3a2a; font-weight: 500; }
  .meta .value.mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; }
  .signature { position: absolute; bottom: 60px; right: 80px; text-align: right; }
  .signature .ink { font-family: 'Fraunces', serif; font-style: italic; font-size: 22px; color: #1a3a2a; margin-bottom: 4px; }
  .signature .ink-label { font-family: 'DM Sans'; font-size: 9px; font-weight: 600; color: #4a7c59; letter-spacing: 0.24em; text-transform: uppercase; }
  .footer-mark { position: absolute; bottom: 40px; left: 0; right: 0; text-align: center; font-family: 'Fraunces', serif; font-style: italic; font-size: 11px; color: #4a7c59; opacity: 0.6; }
</style>
</head><body>
<div class="cert">
  <svg class="topo" viewBox="0 0 400 400">
    <g fill="none" stroke="#1a3a2a" stroke-width="1.1">
      <ellipse cx="200" cy="200" rx="32" ry="42"/>
      <ellipse cx="200" cy="200" rx="58" ry="74"/>
      <ellipse cx="200" cy="200" rx="86" ry="108"/>
      <ellipse cx="200" cy="200" rx="116" ry="144"/>
      <ellipse cx="200" cy="200" rx="148" ry="182"/>
    </g>
  </svg>
  <svg class="leaf" viewBox="0 0 100 220">
    <g fill="none" stroke="#1a3a2a" stroke-width="1.2" stroke-linecap="round">
      <path d="M50,210 Q50,110 50,12"/>
      <path d="M50,188 Q30,176 14,154"/>
      <path d="M50,168 Q70,156 86,134"/>
      <path d="M50,146 Q30,134 16,112"/>
      <path d="M50,124 Q72,112 84,88"/>
      <path d="M50,102 Q30,90 18,68"/>
      <path d="M50,80 Q70,68 80,46"/>
    </g>
  </svg>
  <div class="body">
    <div class="eyebrow">✦ Certificate of Completion</div>
    <h1 class="title">AIWMR<br/><em>Training Academy.</em></h1>
    <p class="lede">Ashrita Institute for Waste Management &amp; Research</p>
    <div class="rule"><hr/><span>✦</span><hr/></div>
    <div class="award-to">— This is to certify that</div>
    <div class="name">${studentName}</div>
    <div class="course-eyebrow">has successfully completed</div>
    <div class="course">${courseTitle}<em>.</em></div>
    <div class="meta-row">
      <div class="meta">
        <div class="label">Issued</div>
        <div class="value">${issuedDate}</div>
      </div>
      <div class="meta">
        <div class="label">Certificate ID</div>
        <div class="value mono">${cert.certId}</div>
      </div>
    </div>
  </div>
  <div class="signature">
    <div class="ink">Dr. Sushanth Gade</div>
    <div class="ink-label">Director, AIWMR</div>
  </div>
  <div class="footer-mark">✦  Hyderabad · India</div>
</div>
<script>setTimeout(() => window.print(), 600);</script>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
    }
    setTimeout(() => { setDownloading(false); setDownloaded(true); }, 1500);
  };

  const handleShare = async () => {
    if (!cert) return;
    const shareData = {
      title: 'AIWMR Certificate',
      text:  `${studentName} has earned a certificate in ${courseTitle}. Cert ID: ${cert.certId}`,
      url:   window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* dismissed */ }
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      alert('Certificate details copied to clipboard.');
    }
  };

  return (
    <EnrollmentGate
      loading={enrollLoading}
      enrolled={!!enrollment}
      icon="🏆"
      title="Certificates"
      message="Enroll in a course and complete payment to earn certificates."
      onBrowse={() => onNavigate('courses')}
    >
      <ParchmentBackdrop decorations="full">
        <div className="screen" style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            maxWidth: 520, margin: '0 auto',
            padding: 'calc(28px + var(--safe-top)) 28px 40px',
          }}>

            {certLoading ? (
              <div style={{
                fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 15,
                color: 'var(--moss)', textAlign: 'center', padding: '80px 0',
              }}>
                Looking for your certificate…
              </div>
            ) : cert ? (
              <>
                {/* ── Eyebrow ── */}
                <div style={{
                  fontFamily: BODY,
                  fontSize: 10, fontWeight: 700,
                  color: 'var(--gold)',
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  marginBottom: 18,
                  animation: 'fadeUpSoft 0.5s ease 0s both',
                }}>
                  ✦ Awarded
                </div>

                {/* ── Headline ── */}
                <h1 style={{
                  fontFamily: DISPLAY,
                  fontSize: 'clamp(40px, 11vw, 60px)',
                  color: 'var(--forest)',
                  fontWeight: 400,
                  lineHeight: 0.96,
                  letterSpacing: '-0.022em',
                  margin: 0, marginBottom: 18,
                  fontVariationSettings: '"opsz" 144, "SOFT" 80',
                  animation: 'fadeUpSoft 0.6s ease 0.1s both',
                }}>
                  Your<br/>
                  <em style={{ fontStyle: 'italic', color: 'var(--moss)', fontWeight: 400 }}>certificate.</em>
                </h1>

                <p style={{
                  fontFamily: DISPLAY,
                  fontStyle: 'italic',
                  fontSize: 16,
                  color: 'var(--charcoal)',
                  opacity: 0.7,
                  lineHeight: 1.5,
                  margin: 0, marginBottom: 36,
                  animation: 'fadeUpSoft 0.5s ease 0.2s both',
                }}>
                  Congratulations on completing your AIWMR program.
                </p>

                {/* ── Gold rule ── */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32,
                  animation: 'fadeUpSoft 0.5s ease 0.25s both',
                }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--gold)' }}/>
                  <span style={{ fontFamily: DISPLAY, fontSize: 14, color: 'var(--gold)' }}>✦</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--gold)' }}/>
                </div>

                {/* ── Certificate display card ── */}
                <div style={{
                  position: 'relative',
                  padding: '32px 28px',
                  marginBottom: 28,
                  background: 'rgba(201,168,76,0.05)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  animation: 'fadeUpSoft 0.6s ease 0.3s both',
                }}>
                  {/* Top gold rule */}
                  <div style={{
                    position: 'absolute', top: -1, left: -1, right: -1,
                    height: 3, background: 'var(--gold)',
                  }}/>

                  <div style={{
                    fontFamily: BODY,
                    fontSize: 9, fontWeight: 700,
                    color: 'var(--moss)',
                    letterSpacing: '0.34em',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    marginBottom: 16,
                  }}>
                    — This is to certify that
                  </div>

                  <div style={{
                    fontFamily: DISPLAY,
                    fontStyle: 'italic',
                    fontSize: 'clamp(28px, 7vw, 40px)',
                    color: 'var(--forest)',
                    fontWeight: 500,
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    textAlign: 'center',
                    marginBottom: 14,
                  }}>
                    {studentName}
                  </div>

                  <div style={{
                    fontFamily: BODY,
                    fontSize: 9, fontWeight: 700,
                    color: 'var(--moss)',
                    letterSpacing: '0.34em',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    marginBottom: 12,
                  }}>
                    has successfully completed
                  </div>

                  <div style={{
                    fontFamily: DISPLAY,
                    fontSize: 18,
                    color: 'var(--forest)',
                    fontWeight: 400,
                    lineHeight: 1.35,
                    textAlign: 'center',
                    marginBottom: 28,
                  }}>
                    {courseTitle}
                    <span style={{ color: 'var(--moss)', fontStyle: 'italic' }}>.</span>
                  </div>

                  {/* Gold dotted divider */}
                  <div style={{
                    borderTop: '1px dashed rgba(201,168,76,0.4)',
                    margin: '0 -8px 20px',
                  }}/>

                  {/* Metadata row */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}>
                    <div>
                      <div style={{
                        fontFamily: BODY,
                        fontSize: 9, fontWeight: 700,
                        color: 'var(--moss)',
                        letterSpacing: '0.34em',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}>
                        Issued
                      </div>
                      <div style={{
                        fontFamily: DISPLAY,
                        fontStyle: 'italic',
                        fontSize: 14,
                        color: 'var(--forest)',
                        fontWeight: 500,
                      }}>
                        {issuedDate}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontFamily: BODY,
                        fontSize: 9, fontWeight: 700,
                        color: 'var(--moss)',
                        letterSpacing: '0.34em',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}>
                        Certificate ID
                      </div>
                      <div style={{
                        fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
                        fontSize: 12,
                        color: 'var(--forest)',
                      }}>
                        {cert.certId}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Actions ── */}
                <div style={{ animation: 'fadeUpSoft 0.6s ease 0.4s both' }}>
                  <PrimaryButton
                    onClick={handleDownload}
                    loading={downloading}
                    label={downloaded ? 'Downloaded ✓' : 'Download Certificate'}
                    arrow={downloaded ? '✓' : '↓'}
                  />
                  <div style={{ textAlign: 'center', marginTop: 18 }}>
                    <InlineLink onClick={handleShare}>
                      <span style={{ fontFamily: DISPLAY, fontStyle: 'italic' }}>✦</span>{' '}share certificate
                    </InlineLink>
                  </div>
                </div>
              </>
            ) : (
              /* ── No certificate yet ── */
              <>
                <div style={{
                  fontFamily: BODY,
                  fontSize: 10, fontWeight: 600,
                  color: 'var(--moss)',
                  letterSpacing: '0.34em',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                  animation: 'fadeUpSoft 0.5s ease 0s both',
                }}>
                  — Pending
                </div>

                <h1 style={{
                  fontFamily: DISPLAY,
                  fontSize: 'clamp(42px, 12vw, 62px)',
                  color: 'var(--forest)',
                  fontWeight: 400,
                  lineHeight: 0.96,
                  letterSpacing: '-0.022em',
                  margin: 0, marginBottom: 18,
                  animation: 'fadeUpSoft 0.6s ease 0.12s both',
                }}>
                  Keep<br/>
                  <em style={{ fontStyle: 'italic', color: 'var(--moss)', fontWeight: 400 }}>going.</em>
                </h1>

                <p style={{
                  fontFamily: DISPLAY,
                  fontStyle: 'italic',
                  fontSize: 16,
                  color: 'var(--charcoal)',
                  opacity: 0.72,
                  lineHeight: 1.55,
                  margin: 0, marginBottom: 36,
                  maxWidth: 360,
                  animation: 'fadeUpSoft 0.5s ease 0.22s both',
                }}>
                  Complete all course modules and pass their assessments to earn your AIWMR certificate.
                </p>

                <div style={{ animation: 'fadeUpSoft 0.6s ease 0.32s both' }}>
                  <PrimaryButton
                    onClick={() => onNavigate('learning')}
                    label="Continue Learning"
                    arrow="→"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </ParchmentBackdrop>
    </EnrollmentGate>
  );
};

export default CertificateScreen;
