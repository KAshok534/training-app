/**
 * AdminSessionScreen — editorial QR session manager for AIWMR admins.
 *
 * Generate session QR codes (6-char alphanumeric, no confusable chars),
 * display them on screen for students to scan, and manage today's active
 * sessions.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import ParchmentBackdrop from '../components/ParchmentBackdrop';
import { DISPLAY, BODY } from '../components/AuthShell';
import { PrimaryButton, InlineLink } from '../components/AuthForm';

interface Props { onBack: () => void; }

interface Course { id: number; title: string; icon: string; }
interface Batch  { id: number; label: string; time_slot: string; }
interface LiveSession {
  id: string; qr_code: string; expires_at: string;
  course_title: string; batch_label: string;
}

const DURATIONS = [
  { label: '1 hr',  hours: 1 },
  { label: '2 hrs', hours: 2 },
  { label: '3 hrs', hours: 3 },
  { label: '4 hrs', hours: 4 },
];

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

const AdminSessionScreen: React.FC<Props> = ({ onBack }) => {
  const [courses, setCourses]               = useState<Course[]>([]);
  const [batches, setBatches]               = useState<Batch[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | ''>('');
  const [selectedBatch, setSelectedBatch]   = useState<number | ''>('');
  const [duration, setDuration]             = useState(2);
  const [generating, setGenerating]         = useState(false);
  const [liveSessions, setLiveSessions]     = useState<LiveSession[]>([]);
  const [displaySession, setDisplaySession] = useState<LiveSession | null>(null);
  const [tick, setTick]                     = useState(0);
  const [loading, setLoading]               = useState(true);
  const [copied, setCopied]                 = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Tick every 30s for countdown refresh
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // Fetch courses
  useEffect(() => {
    supabase.from('courses').select('id, title, icon').order('id')
      .then(({ data }) => { if (data) setCourses(data); setLoading(false); });
  }, []);

  // Fetch batches when course changes
  useEffect(() => {
    if (!selectedCourse) { setBatches([]); setSelectedBatch(''); return; }
    supabase.from('batches').select('id, label, time_slot').eq('course_id', selectedCourse)
      .then(({ data }) => { if (data) setBatches(data); });
  }, [selectedCourse]);

  // Fetch today's live sessions
  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from('session_qr_codes')
      .select('id, qr_code, expires_at, courses(title), batches(label)')
      .eq('session_date', today)
      .order('created_at', { ascending: false });

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: LiveSession[] = data.map((s: any) => ({
        id:           s.id,
        qr_code:      s.qr_code,
        expires_at:   s.expires_at,
        course_title: s.courses?.title ?? '—',
        batch_label:  s.batches?.label ?? '—',
      }));
      setLiveSessions(mapped);

      if (displaySession) {
        const updated = mapped.find(s => s.id === displaySession.id);
        if (!updated) setDisplaySession(null);
      }
    }
  }, [today, displaySession]);

  useEffect(() => { fetchSessions(); }, [fetchSessions, tick]);

  const handleGenerate = async () => {
    if (!selectedCourse || !selectedBatch) return;
    setGenerating(true);

    const code      = generateCode();
    const expiresAt = new Date(Date.now() + duration * 3600 * 1000).toISOString();

    const { data, error } = await supabase
      .from('session_qr_codes')
      .insert({
        course_id:    selectedCourse,
        batch_id:     selectedBatch,
        session_date: today,
        qr_code:      code,
        expires_at:   expiresAt,
      })
      .select('id')
      .single();

    setGenerating(false);
    if (!error && data) {
      const newSession: LiveSession = {
        id: data.id, qr_code: code, expires_at: expiresAt,
        course_title: courses.find(c => c.id === selectedCourse)?.title ?? '—',
        batch_label:  batches.find(b => b.id === selectedBatch)?.label  ?? '—',
      };
      setDisplaySession(newSession);
      await fetchSessions();
    }
  };

  const handleRevoke = async (id: string) => {
    await supabase.from('session_qr_codes')
      .update({ expires_at: new Date().toISOString() })
      .eq('id', id);
    if (displaySession?.id === id) setDisplaySession(null);
    fetchSessions();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 0',
    border: 'none',
    borderBottom: '1.5px solid rgba(26,58,42,0.25)',
    background: 'transparent',
    fontSize: 15,
    fontFamily: DISPLAY,
    fontStyle: 'italic',
    color: 'var(--forest)',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%234a7c59' d='M0 0l5 6 5-6z'/></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right center',
    paddingRight: 20,
    cursor: 'pointer',
  };

  const fieldLabel: React.CSSProperties = {
    fontFamily: BODY,
    fontSize: 10, fontWeight: 600,
    color: 'var(--moss)',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: 6,
  };

  return (
    <ParchmentBackdrop decorations="full">
      <div className="screen" style={{ position: 'absolute', inset: 0 }}>
        <div style={{
          maxWidth: 540, margin: '0 auto',
          padding: 'calc(24px + var(--safe-top)) 28px 40px',
        }}>

          {/* ── Top bar ── */}
          <div style={{
            display: 'flex', alignItems: 'center', marginBottom: 28,
            animation: 'fadeUpSoft 0.5s ease 0s both',
          }}>
            <button onClick={onBack}
              style={{
                fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
                color: 'var(--moss)',
                background: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(26,58,42,0.12)',
                padding: '6px 14px', borderRadius: 2, cursor: 'pointer',
                letterSpacing: '0.04em',
              }}>↩ admin</button>
          </div>

          <div style={{
            fontFamily: BODY,
            fontSize: 10, fontWeight: 600,
            color: 'var(--moss)',
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            marginBottom: 14,
            animation: 'fadeUpSoft 0.5s ease 0.05s both',
          }}>
            — Session Manager
          </div>

          <h1 style={{
            fontFamily: DISPLAY,
            fontSize: 'clamp(34px, 9vw, 50px)',
            color: 'var(--forest)',
            fontWeight: 400,
            lineHeight: 0.96,
            letterSpacing: '-0.022em',
            margin: 0, marginBottom: 14,
            fontVariationSettings: '"opsz" 144, "SOFT" 80',
            animation: 'fadeUpSoft 0.6s ease 0.1s both',
          }}>
            Issue a<br/>
            <em style={{ fontStyle: 'italic', color: 'var(--moss)', fontWeight: 400 }}>session code.</em>
          </h1>

          <p style={{
            fontFamily: DISPLAY,
            fontStyle: 'italic',
            fontSize: 15,
            color: 'var(--charcoal)',
            opacity: 0.65,
            margin: 0, marginBottom: 32,
            animation: 'fadeUpSoft 0.5s ease 0.18s both',
          }}>
            Generate a QR code and 6-character text code that students can scan or type to mark attendance.
          </p>

          {/* ── QR Display (if active) ── */}
          {displaySession && (() => {
            const expired = new Date(displaySession.expires_at) <= new Date();
            return (
              <div style={{
                position: 'relative',
                padding: '24px 24px 22px',
                marginBottom: 28,
                background: 'rgba(106,173,120,0.06)',
                border: '1px solid rgba(106,173,120,0.35)',
                animation: 'fadeUpSoft 0.5s ease 0.25s both',
                textAlign: 'center',
              }}>
                <div style={{
                  position: 'absolute', top: -1, left: -1, right: -1, height: 3,
                  background: expired ? 'var(--red)' : 'var(--leaf)',
                }}/>

                <div style={{
                  fontFamily: BODY,
                  fontSize: 9, fontWeight: 700,
                  color: expired ? 'var(--red)' : 'var(--leaf)',
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}>
                  {expired ? '⛔ Expired' : '✦ Live'}
                </div>

                <div style={{
                  fontFamily: DISPLAY,
                  fontStyle: 'italic',
                  fontSize: 16,
                  color: 'var(--forest)',
                  fontWeight: 500,
                  marginBottom: 4,
                }}>
                  {displaySession.course_title}
                </div>
                <div style={{
                  fontFamily: BODY,
                  fontSize: 10, fontWeight: 600,
                  color: 'var(--moss)',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  marginBottom: 20,
                }}>
                  {displaySession.batch_label} · {expired ? 'expired' : timeLeft(displaySession.expires_at)}
                </div>

                {/* QR */}
                <div style={{
                  display: 'inline-block',
                  padding: 14,
                  background: 'white',
                  border: '1px solid rgba(26,58,42,0.12)',
                  marginBottom: 22,
                  opacity: expired ? 0.35 : 1,
                }}>
                  <QRCodeSVG value={displaySession.qr_code} size={180} fgColor="#1a3a2a"/>
                </div>

                {/* Text code */}
                <div style={{
                  fontFamily: BODY,
                  fontSize: 9, fontWeight: 700,
                  color: 'var(--moss)',
                  letterSpacing: '0.34em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}>
                  Or this code
                </div>
                <div style={{
                  fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
                  fontSize: 38, fontWeight: 500,
                  letterSpacing: '0.18em',
                  color: 'var(--forest)',
                  marginBottom: 14,
                }}>
                  {displaySession.qr_code}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 22 }}>
                  <button
                    onClick={() => copyCode(displaySession.qr_code)}
                    style={{
                      fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
                      color: 'var(--moss)', background: 'none', border: 'none',
                      padding: 0, cursor: 'pointer',
                      textDecoration: 'underline', textDecorationStyle: 'dotted',
                      textUnderlineOffset: '4px',
                    }}>
                    {copied ? '✓ copied' : '✦ copy code'}
                  </button>
                  <InlineLink onClick={() => setDisplaySession(null)}>
                    close
                  </InlineLink>
                </div>
              </div>
            );
          })()}

          {/* ── Today's sessions ── */}
          {liveSessions.length > 0 && !displaySession && (
            <div style={{ marginBottom: 36, animation: 'fadeUpSoft 0.5s ease 0.3s both' }}>
              <SectionHeader text="Today's Sessions"/>
              {liveSessions.map((s, i) => {
                const expired = new Date(s.expires_at) <= new Date();
                return (
                  <div key={s.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    padding: '16px 0',
                    borderTop: i === 0 ? '1px solid rgba(26,58,42,0.15)' : 'none',
                    borderBottom: '1px solid rgba(26,58,42,0.15)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: DISPLAY,
                        fontSize: 15,
                        color: 'var(--forest)',
                        fontWeight: 400,
                        lineHeight: 1.3,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {s.course_title}
                      </div>
                      <div style={{
                        fontFamily: BODY,
                        fontSize: 10, fontWeight: 600,
                        color: 'var(--moss)',
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        marginTop: 4,
                        opacity: 0.85,
                      }}>
                        {s.batch_label}
                      </div>
                      <div style={{
                        marginTop: 8,
                        display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap',
                      }}>
                        <span style={{
                          fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
                          fontSize: 16,
                          color: 'var(--forest)',
                          letterSpacing: '0.12em',
                          fontWeight: 500,
                        }}>{s.qr_code}</span>
                        <span style={{
                          fontFamily: DISPLAY,
                          fontStyle: 'italic',
                          fontSize: 12,
                          color: expired ? 'var(--red)' : 'var(--leaf)',
                        }}>
                          {expired ? 'expired' : timeLeft(s.expires_at)}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                      <button onClick={() => setDisplaySession(s)}
                        style={{
                          fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 13,
                          color: 'var(--forest)', background: 'none', border: 'none',
                          padding: 0, cursor: 'pointer',
                          textDecoration: 'underline', textDecorationStyle: 'dotted',
                          textUnderlineOffset: '4px',
                        }}>show qr</button>
                      {!expired && (
                        <button onClick={() => handleRevoke(s.id)}
                          style={{
                            fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 13,
                            color: 'var(--red)', background: 'none', border: 'none',
                            padding: 0, cursor: 'pointer',
                            textDecoration: 'underline', textDecorationStyle: 'dotted',
                            textUnderlineOffset: '4px',
                          }}>end session</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Decorative rule ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28,
            animation: 'fadeUpSoft 0.5s ease 0.35s both',
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
            <span style={{ fontFamily: DISPLAY, fontSize: 13, color: 'var(--moss)', opacity: 0.7 }}>✦</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
          </div>

          {/* ── Generate new ── */}
          <SectionHeader text="Generate a New Code"/>

          {loading ? (
            <div style={{
              fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
              color: 'var(--moss)', textAlign: 'center', padding: '40px 0',
            }}>
              Loading courses…
            </div>
          ) : (
            <div style={{ animation: 'fadeUpSoft 0.5s ease 0.42s both' }}>
              {/* Course */}
              <div style={{ marginBottom: 22 }}>
                <label style={fieldLabel}>Course</label>
                <select style={selectStyle} value={selectedCourse} onChange={e => setSelectedCourse(Number(e.target.value) || '')}>
                  <option value="">— select course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {/* Batch */}
              <div style={{ marginBottom: 22 }}>
                <label style={fieldLabel}>Batch</label>
                <select style={selectStyle} value={selectedBatch} onChange={e => setSelectedBatch(Number(e.target.value) || '')} disabled={!selectedCourse}>
                  <option value="">{selectedCourse ? '— select batch' : '— select course first'}</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.label} · {b.time_slot}</option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div style={{ marginBottom: 30 }}>
                <label style={fieldLabel}>Session Duration</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {DURATIONS.map(d => {
                    const active = duration === d.hours;
                    return (
                      <button key={d.hours}
                        onClick={() => setDuration(d.hours)}
                        style={{
                          flex: 1, padding: '11px 4px',
                          background: active ? 'var(--forest)' : 'transparent',
                          color:      active ? 'white'          : 'var(--moss)',
                          border:     active ? 'none'           : '1px solid rgba(26,58,42,0.2)',
                          fontFamily: BODY, fontSize: 11, fontWeight: 600,
                          letterSpacing: '0.18em', textTransform: 'uppercase',
                          cursor: 'pointer',
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                        }}>
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <PrimaryButton
                onClick={handleGenerate}
                loading={generating}
                label={!selectedCourse || !selectedBatch ? 'Select course & batch' : 'Generate Session Code'}
                arrow="✦"
              />
            </div>
          )}
        </div>
      </div>
    </ParchmentBackdrop>
  );
};

// ─── Section header ─────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18,
  }}>
    <span style={{
      fontFamily: BODY,
      fontSize: 10, fontWeight: 700,
      color: 'var(--forest)',
      letterSpacing: '0.36em',
      textTransform: 'uppercase',
    }}>{text}</span>
    <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
  </div>
);

export default AdminSessionScreen;
