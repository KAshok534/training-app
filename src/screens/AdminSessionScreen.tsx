import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { Card, Spinner } from '../components/UI';
import Icon from '../components/Icon';

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
  // Avoid confusable characters: 0/O, 1/I/L
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
  const [tick, setTick]                     = useState(0); // for countdown refresh
  const [loading, setLoading]               = useState(true);
  const [copyMsg, setCopyMsg]               = useState('');

  const today = new Date().toISOString().split('T')[0];

  // ── Refresh countdown every 30s ──────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // ── Fetch courses ─────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('courses').select('id, title, icon').order('id')
      .then(({ data }) => { if (data) setCourses(data); setLoading(false); });
  }, []);

  // ── Fetch batches when course changes ─────────────────────────────────────
  useEffect(() => {
    if (!selectedCourse) { setBatches([]); setSelectedBatch(''); return; }
    supabase.from('batches').select('id, label, time_slot').eq('course_id', selectedCourse)
      .then(({ data }) => { if (data) setBatches(data); });
  }, [selectedCourse]);

  // ── Fetch today's live sessions ───────────────────────────────────────────
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

      // Keep displaySession in sync
      if (displaySession) {
        const updated = mapped.find(s => s.id === displaySession.id);
        if (!updated) setDisplaySession(null);
      }
    }
  }, [today, displaySession]);

  useEffect(() => { fetchSessions(); }, [fetchSessions, tick]);

  // ── Generate new session ──────────────────────────────────────────────────
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

  // ── Revoke session ────────────────────────────────────────────────────────
  const handleRevoke = async (id: string) => {
    await supabase
      .from('session_qr_codes')
      .update({ expires_at: new Date().toISOString() })
      .eq('id', id);
    if (displaySession?.id === id) setDisplaySession(null);
    fetchSessions();
  };

  // ── Copy code to clipboard ────────────────────────────────────────────────
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopyMsg('Copied!');
      setTimeout(() => setCopyMsg(''), 2000);
    });
  };

  const sel: React.CSSProperties = {
    width:'100%', padding:'12px 14px', borderRadius:12,
    border:'1.5px solid var(--sand)', background:'var(--white)',
    fontSize:14, fontFamily:"'DM Sans', sans-serif", outline:'none', color:'var(--charcoal)',
  };

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ background:'var(--forest)', padding:'20px 20px 24px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:10, padding:'8px 10px', cursor:'pointer' }}>
            <Icon name="back" size={18} color="white"/>
          </button>
          <div>
            <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:22, fontWeight:900 }}>Session Manager</div>
            <div style={{ color:'var(--sage)', fontSize:12, marginTop:2 }}>Generate QR codes for live sessions</div>
          </div>
        </div>
      </div>

      <div style={{ padding:'16px' }}>

        {/* ── Active sessions today ── */}
        {liveSessions.length > 0 && (
          <Card style={{ padding:18, marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Today's Sessions</div>
            {liveSessions.map(s => {
              const expired = new Date(s.expires_at) <= new Date();
              return (
                <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:12, marginBottom:12, borderBottom:'1px solid var(--sand)' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.course_title}</div>
                    <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>{s.batch_label}</div>
                    <div style={{ fontSize:12, marginTop:4 }}>
                      <span style={{ fontFamily:'monospace', fontWeight:700, fontSize:15, color:'var(--forest)', letterSpacing:3 }}>{s.qr_code}</span>
                      <span style={{ marginLeft:8, fontSize:11, color: expired ? 'var(--red)' : 'var(--leaf)', fontWeight:600 }}>
                        {expired ? 'Expired' : timeLeft(s.expires_at)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button onClick={() => setDisplaySession(s)}
                      style={{ padding:'7px 10px', background:'var(--forest)', color:'white', border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
                      Show QR
                    </button>
                    {!expired && (
                      <button onClick={() => handleRevoke(s.id)}
                        style={{ padding:'7px 10px', background:'rgba(192,57,43,0.1)', color:'var(--red)', border:'1px solid rgba(192,57,43,0.2)', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
                        End
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        {/* ── QR Display ── */}
        {displaySession && (() => {
          const expired = new Date(displaySession.expires_at) <= new Date();
          return (
            <Card style={{ padding:24, marginBottom:16, textAlign:'center', border:'2px solid var(--leaf)' }}>
              <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>{displaySession.course_title} · {displaySession.batch_label}</div>
              <div style={{ fontSize:11, color: expired ? 'var(--red)' : 'var(--leaf)', fontWeight:700, marginBottom:16 }}>
                {expired ? '⛔ Session Expired' : `⏱ ${timeLeft(displaySession.expires_at)}`}
              </div>

              {/* QR Code */}
              <div style={{ display:'inline-block', padding:16, background:'white', borderRadius:16, boxShadow:'0 4px 20px rgba(0,0,0,0.1)', marginBottom:20, opacity: expired ? 0.4 : 1 }}>
                <QRCodeSVG value={displaySession.qr_code} size={200} fgColor="var(--forest)"/>
              </div>

              {/* Text code */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:'#aaa', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.1em' }}>Or enter this code</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
                  <span style={{ fontFamily:'monospace', fontSize:32, fontWeight:900, letterSpacing:8, color:'var(--forest)' }}>
                    {displaySession.qr_code}
                  </span>
                  <button onClick={() => copyCode(displaySession.qr_code)}
                    style={{ padding:'6px 12px', background:'var(--mist)', border:'1px solid var(--sand)', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, color:'var(--charcoal)', fontFamily:"'DM Sans', sans-serif" }}>
                    {copyMsg || 'Copy'}
                  </button>
                </div>
              </div>

              <div style={{ fontSize:12, color:'#aaa' }}>
                Share this QR or code during the live session. Students scan it to mark attendance.
              </div>
              <button onClick={() => setDisplaySession(null)}
                style={{ marginTop:14, padding:'8px 20px', background:'var(--sand)', border:'none', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:"'DM Sans', sans-serif" }}>
                Close
              </button>
            </Card>
          );
        })()}

        {/* ── Generate new session ── */}
        <Card style={{ padding:20 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Generate New Session QR</div>

          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:20 }}>
              <Spinner size={24} color="var(--forest)"/>
            </div>
          ) : (
            <>
              {/* Course selector */}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--moss)', textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:6 }}>Course</label>
                <select style={sel} value={selectedCourse} onChange={e => setSelectedCourse(Number(e.target.value) || '')}>
                  <option value="">Select a course...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.title}</option>
                  ))}
                </select>
              </div>

              {/* Batch selector */}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--moss)', textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:6 }}>Batch</label>
                <select style={sel} value={selectedBatch} onChange={e => setSelectedBatch(Number(e.target.value) || '')} disabled={!selectedCourse}>
                  <option value="">{selectedCourse ? 'Select batch...' : 'Select course first'}</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.label} · {b.time_slot}</option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--moss)', textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:8 }}>Session Duration</label>
                <div style={{ display:'flex', gap:8 }}>
                  {DURATIONS.map(d => (
                    <button key={d.hours} onClick={() => setDuration(d.hours)}
                      style={{ flex:1, padding:'10px 4px', border:`1.5px solid ${duration === d.hours ? 'var(--forest)' : 'var(--sand)'}`, borderRadius:10, background: duration === d.hours ? 'var(--forest)' : 'var(--white)', color: duration === d.hours ? 'white' : 'var(--charcoal)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!selectedCourse || !selectedBatch || generating}
                style={{ width:'100%', padding:'14px', background: (!selectedCourse || !selectedBatch) ? 'var(--sage)' : 'var(--forest)', color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor: (!selectedCourse || !selectedBatch) ? 'not-allowed' : 'pointer', fontFamily:"'DM Sans', sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}
              >
                {generating ? <Spinner size={18} color="white"/> : '🔐 Generate Session QR'}
              </button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
export default AdminSessionScreen;
