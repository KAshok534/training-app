import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { supabase } from '../lib/supabase';
import { Card, Spinner } from '../components/UI';
import EnrollmentGate from '../components/EnrollmentGate';
import Icon from '../components/Icon';
import { useEnrollment } from '../hooks/useEnrollment';

interface Props { onNavigate: (screen: string) => void; }

type ScanState  = 'idle' | 'success' | 'already' | 'invalid' | 'error';
type InputMode  = 'camera' | 'code';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AttendanceScreen: React.FC<Props> = ({ onNavigate }) => {
  const { loading: enrollLoading, enrollment } = useEnrollment();

  const [inputMode, setInputMode]           = useState<InputMode>('camera');
  const [scanState, setScanState]           = useState<ScanState>('idle');
  const [manualCode, setManualCode]         = useState('');
  const [codeError, setCodeError]           = useState('');
  const [submitting, setSubmitting]         = useState(false);
  const [attendedDates, setAttendedDates]   = useState<Set<string>>(new Set());
  const [scheduledDates, setScheduledDates] = useState<Set<string>>(new Set());
  const [dataLoading, setDataLoading]       = useState(true);
  const alreadyScanned                      = useRef(false); // prevent QR double-fire

  const now      = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Calendar navigation
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  // ── Fetch attendance + scheduled sessions ─────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!enrollment) return;
    const [attendRes, scheduledRes] = await Promise.all([
      supabase.from('attendance').select('session_date').eq('registration_id', enrollment.registrationId),
      supabase.from('session_qr_codes').select('session_date').eq('course_id', enrollment.courseId),
    ]);
    if (attendRes.data)   setAttendedDates(new Set(attendRes.data.map((a: { session_date: string }) => a.session_date)));
    if (scheduledRes.data) setScheduledDates(new Set(scheduledRes.data.map((q: { session_date: string }) => q.session_date)));
    setDataLoading(false);
  }, [enrollment]);

  useEffect(() => {
    if (!enrollment) return;
    fetchData();
  }, [enrollment, fetchData]);

  // ── Core: validate code + mark attendance ─────────────────────────────────
  const markAttendance = useCallback(async (code: string) => {
    if (!enrollment) return;
    const trimmed = code.trim().toUpperCase();

    // 1. Validate against session_qr_codes
    const { data: session, error: sessionError } = await supabase
      .from('session_qr_codes')
      .select('id, session_date, expires_at, course_id')
      .eq('qr_code', trimmed)
      .single();

    if (sessionError || !session) { setScanState('invalid'); return; }

    // 2. Check expiry
    if (new Date(session.expires_at) <= new Date()) { setScanState('invalid'); return; }

    // 3. Check if already marked today (client-side)
    if (attendedDates.has(session.session_date)) { setScanState('already'); return; }

    // 4. Insert attendance
    const { error } = await supabase.from('attendance').insert({
      registration_id: enrollment.registrationId,
      session_date:    session.session_date,
    });

    if (!error) {
      setScanState('success');
      await fetchData();
    } else if (error.code === '23505') {
      setScanState('already');
      await fetchData();
    } else {
      setScanState('error');
    }
  }, [enrollment, attendedDates, fetchData]);

  // ── Camera QR handler ─────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleQrResult = useCallback((detectedCodes: { rawValue: string }[]) => {
    const result = detectedCodes?.[0];
    if (!result || alreadyScanned.current) return;
    const text = result.rawValue;
    if (!text) return;
    alreadyScanned.current = true;
    markAttendance(text);
  }, [markAttendance]);

  // Reset scanner lock when going back to idle
  useEffect(() => {
    if (scanState === 'idle') alreadyScanned.current = false;
  }, [scanState]);

  // ── Manual code submit ────────────────────────────────────────────────────
  const handleCodeSubmit = async () => {
    setCodeError('');
    if (manualCode.trim().length < 6) { setCodeError('Please enter the 6-character session code.'); return; }
    setSubmitting(true);
    await markAttendance(manualCode);
    setSubmitting(false);
  };

  const resetToIdle = () => {
    setScanState('idle');
    setManualCode('');
    setCodeError('');
    alreadyScanned.current = false;
  };

  // ── Calendar ──────────────────────────────────────────────────────────────
  type CellStatus = 'present' | 'absent' | 'no-session' | 'today' | 'future' | 'empty';

  const buildCalendar = () => {
    const firstWeekday = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth  = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: { day: number; status: CellStatus }[] = [];

    for (let i = 0; i < firstWeekday; i++) cells.push({ day: 0, status: 'empty' });

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isPast  = dateStr < todayStr;

      let status: CellStatus;
      if (isToday)                                          status = 'today';
      else if (!isPast)                                     status = 'future';
      else if (attendedDates.has(dateStr))                  status = 'present';
      else if (scheduledDates.has(dateStr))                 status = 'absent';
      else                                                  status = 'no-session';

      cells.push({ day: d, status });
    }
    return cells;
  };

  const isCurrentMonth = calYear === now.getFullYear() && calMonth === now.getMonth();
  const monthLabel     = new Date(calYear, calMonth, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const goPrev = () => { if (calMonth === 0) { setCalYear(y=>y-1); setCalMonth(11); } else setCalMonth(m=>m-1); };
  const goNext = () => { if (isCurrentMonth) return; if (calMonth === 11) { setCalYear(y=>y+1); setCalMonth(0); } else setCalMonth(m=>m+1); };

  const cellBg: Record<CellStatus, string> = {
    present:      'var(--leaf)',
    absent:       'rgba(192,57,43,0.2)',
    'no-session': 'var(--mist)',
    today:        'var(--amber)',
    future:       'var(--sand)',
    empty:        'transparent',
  };
  const cellFg: Record<CellStatus, string> = {
    present:      'white',
    absent:       'var(--red)',
    'no-session': '#ccc',
    today:        'white',
    future:       '#bbb',
    empty:        'transparent',
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const attended      = attendedDates.size;
  const pastScheduled = [...scheduledDates].filter(d => d <= todayStr).length;
  const missed        = [...scheduledDates].filter(d => d < todayStr && !attendedDates.has(d)).length;
  const pct           = pastScheduled > 0 ? Math.round((attended / pastScheduled) * 100) : null;

  return (
    <EnrollmentGate
      loading={enrollLoading}
      enrolled={!!enrollment}
      icon="📅"
      title="Attendance"
      message="You need to enroll in a course and complete payment to mark and view your attendance."
      onBrowse={() => onNavigate('courses')}
    >
      <div className="screen">
        {/* Header */}
        <div style={{ background:'var(--forest)', padding:'20px 20px 24px', position:'sticky', top:0, zIndex:10 }}>
          <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:24, fontWeight:900 }}>Attendance</div>
          <div style={{ color:'var(--sage)', fontSize:13, marginTop:2 }}>QR Check-in · {enrollment?.courseTitle}</div>
        </div>

        <div style={{ padding:'16px' }}>

          {/* ── Result overlays ── */}
          {scanState === 'success' && (
            <div style={{ textAlign:'center', animation:'fadeUp 0.4s ease', marginBottom:16 }}>
              <div style={{ fontSize:72, marginBottom:12 }}>✅</div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:26, fontWeight:900, color:'var(--forest)', marginBottom:4 }}>Marked!</div>
              <div style={{ color:'#888', fontSize:13, marginBottom:20 }}>
                {now.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })} · {now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
              </div>
              <Card style={{ padding:18, marginBottom:20 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[['Sessions', String(attended)], ['Rate', pct !== null ? `${pct}%` : '—'], ['Missed', String(missed)], ['Status', pct !== null && pct >= 75 ? '✅ Good' : '⚠️ Low']].map(([l, v]) => (
                    <div key={l} style={{ textAlign:'center', padding:12, background:'var(--mist)', borderRadius:12 }}>
                      <div style={{ fontWeight:700, fontSize:15, color:'var(--forest)' }}>{v}</div>
                      <div style={{ fontSize:11, color:'#999', marginTop:3 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </Card>
              <button onClick={resetToIdle} style={{ padding:'12px 32px', background:'var(--forest)', color:'white', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>Done</button>
            </div>
          )}

          {scanState === 'already' && (
            <div style={{ textAlign:'center', animation:'fadeUp 0.4s ease', marginBottom:16 }}>
              <div style={{ fontSize:72, marginBottom:12 }}>📋</div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:22, fontWeight:900, color:'var(--forest)', marginBottom:8 }}>Already Marked</div>
              <div style={{ color:'#888', fontSize:14, marginBottom:24, maxWidth:260, margin:'0 auto 24px' }}>Your attendance for this session has already been recorded.</div>
              <button onClick={resetToIdle} style={{ padding:'12px 32px', background:'var(--forest)', color:'white', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>OK</button>
            </div>
          )}

          {scanState === 'invalid' && (
            <div style={{ textAlign:'center', animation:'fadeUp 0.4s ease', marginBottom:16 }}>
              <div style={{ fontSize:72, marginBottom:12 }}>⛔</div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:22, fontWeight:900, color:'var(--red)', marginBottom:8 }}>Invalid Code</div>
              <div style={{ color:'#888', fontSize:14, marginBottom:24 }}>This code is invalid or has expired. Ask your trainer for the current session code.</div>
              <button onClick={resetToIdle} style={{ padding:'12px 32px', background:'var(--forest)', color:'white', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>Try Again</button>
            </div>
          )}

          {scanState === 'error' && (
            <div style={{ textAlign:'center', animation:'fadeUp 0.4s ease', marginBottom:16 }}>
              <div style={{ fontSize:72, marginBottom:12 }}>❌</div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:22, fontWeight:900, color:'var(--red)', marginBottom:8 }}>Something went wrong</div>
              <div style={{ color:'#888', fontSize:14, marginBottom:24 }}>Please try again or contact support.</div>
              <button onClick={resetToIdle} style={{ padding:'12px 32px', background:'var(--forest)', color:'white', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>Try Again</button>
            </div>
          )}

          {/* ── Main scanner UI ── */}
          {scanState === 'idle' && (
            <>
              {/* Mode tabs */}
              <div style={{ display:'flex', background:'var(--mist)', borderRadius:12, padding:4, marginBottom:16 }}>
                {(['camera', 'code'] as InputMode[]).map(mode => (
                  <button key={mode} onClick={() => setInputMode(mode)}
                    style={{ flex:1, padding:'10px', border:'none', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:"'DM Sans', sans-serif", background: inputMode === mode ? 'white' : 'transparent', color: inputMode === mode ? 'var(--forest)' : '#aaa', boxShadow: inputMode === mode ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition:'all 0.2s' }}>
                    {mode === 'camera' ? '📷 Scan QR' : '✏️ Enter Code'}
                  </button>
                ))}
              </div>

              {/* ── Camera mode ── */}
              {inputMode === 'camera' && (
                <Card style={{ padding:0, overflow:'hidden', marginBottom:16 }}>
                  <div style={{ position:'relative' }}>
                    {/* Camera viewfinder */}
                    <div style={{ position:'relative', background:'#111', minHeight:260 }}>
                      <Scanner
                        onScan={handleQrResult}
                        constraints={{ facingMode: 'environment' }}
                        styles={{ container: { width:'100%' }, video: { width:'100%', borderRadius:0 } }}
                        sound={false}
                      />
                      {/* Corner overlay */}
                      <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
                        {([
                          { top:20, left:20,   borderRadius:'10px 0 0 0', borderRight:'none', borderBottom:'none' },
                          { top:20, right:20,  borderRadius:'0 10px 0 0', borderLeft:'none',  borderBottom:'none' },
                          { bottom:20, left:20,  borderRadius:'0 0 0 10px', borderRight:'none', borderTop:'none' },
                          { bottom:20, right:20, borderRadius:'0 0 10px 0', borderLeft:'none',  borderTop:'none' },
                        ] as React.CSSProperties[]).map((st, i) => (
                          <div key={i} style={{ position:'absolute', width:30, height:30, border:'3px solid var(--leaf)', ...st }}/>
                        ))}
                      </div>
                    </div>
                    <div style={{ padding:'12px 16px', textAlign:'center', fontSize:13, color:'#888' }}>
                      Point your camera at the session QR code
                    </div>
                  </div>
                </Card>
              )}

              {/* ── Manual code mode ── */}
              {inputMode === 'code' && (
                <Card style={{ padding:24, marginBottom:16, textAlign:'center' }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>🔐</div>
                  <div style={{ fontSize:14, color:'#555', marginBottom:20, lineHeight:1.6 }}>
                    Ask your trainer for the <strong>6-character session code</strong> displayed during the live class
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="A3K9P2"
                    value={manualCode}
                    onChange={e => { setManualCode(e.target.value.toUpperCase()); setCodeError(''); }}
                    style={{ width:'100%', padding:'16px', textAlign:'center', fontSize:28, fontFamily:'monospace', fontWeight:900, letterSpacing:12, borderRadius:14, border:`2px solid ${codeError ? 'var(--red)' : 'var(--sand)'}`, background:'var(--white)', outline:'none', color:'var(--forest)', boxSizing:'border-box' }}
                  />
                  {codeError && <div style={{ color:'var(--red)', fontSize:13, marginTop:8 }}>{codeError}</div>}
                  <button
                    onClick={handleCodeSubmit}
                    disabled={submitting || manualCode.trim().length < 6}
                    style={{ width:'100%', marginTop:16, padding:'14px', background: manualCode.trim().length < 6 ? 'var(--sage)' : 'var(--forest)', color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor: manualCode.trim().length < 6 ? 'not-allowed' : 'pointer', fontFamily:"'DM Sans', sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    {submitting ? <Spinner size={18} color="white"/> : '✅ Mark Attendance'}
                  </button>
                </Card>
              )}

              {/* ── Stats ── */}
              {dataLoading ? (
                <Card style={{ padding:32, display:'flex', justifyContent:'center' }}>
                  <Spinner size={24} color="var(--forest)"/>
                </Card>
              ) : (
                <>
                  <Card style={{ padding:16, marginBottom:16, display:'flex', justifyContent:'space-around', textAlign:'center' }}>
                    {[
                      [String(attended),                            'Attended'],
                      [pct !== null ? `${pct}%` : '—',            'Rate'],
                      [String(missed),                             'Missed'],
                      [String(pastScheduled),                      'Scheduled'],
                    ].map(([v, l]) => (
                      <div key={l}>
                        <div style={{ fontWeight:700, fontSize:18, color:'var(--forest)' }}>{v}</div>
                        <div style={{ fontSize:10, color:'#999', marginTop:2 }}>{l}</div>
                      </div>
                    ))}
                  </Card>

                  {/* Monthly Calendar */}
                  <Card style={{ padding:20 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                      <button onClick={goPrev} style={{ background:'var(--mist)', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer' }}>
                        <Icon name="back" size={16} color="var(--charcoal)"/>
                      </button>
                      <div style={{ fontWeight:700, fontSize:14 }}>{monthLabel}</div>
                      <button onClick={goNext} disabled={isCurrentMonth} style={{ background: isCurrentMonth ? 'transparent' : 'var(--mist)', border:'none', borderRadius:8, padding:'6px 10px', cursor: isCurrentMonth ? 'default' : 'pointer', opacity: isCurrentMonth ? 0.2 : 1 }}>
                        <Icon name="arrow" size={16} color="var(--charcoal)"/>
                      </button>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
                      {DAY_LABELS.map(d => (
                        <div key={d} style={{ textAlign:'center', fontSize:9, color:'#bbb', fontWeight:600, paddingBottom:4 }}>{d}</div>
                      ))}
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
                      {buildCalendar().map((cell, i) => (
                        <div key={i} style={{ aspectRatio:'1', borderRadius:8, background:cellBg[cell.status], display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight: cell.status === 'today' ? 700 : 400, color:cellFg[cell.status], border: cell.status === 'today' ? '2px solid var(--earth)' : 'none' }}>
                          {cell.status !== 'empty' ? cell.day : ''}
                        </div>
                      ))}
                    </div>

                    {/* Legend */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:14 }}>
                      {[['var(--leaf)','Present'],['rgba(192,57,43,0.2)','Missed'],['var(--amber)','Today'],['var(--mist)','No session'],['var(--sand)','Upcoming']].map(([c,l]) => (
                        <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <div style={{ width:10, height:10, borderRadius:3, background:c, flexShrink:0 }}/>
                          <span style={{ fontSize:10, color:'#888' }}>{l}</span>
                        </div>
                      ))}
                    </div>

                    {pct !== null && pct < 75 && pastScheduled > 0 && (
                      <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(212,148,58,0.1)', borderRadius:10, border:'1px solid rgba(212,148,58,0.3)', fontSize:12, color:'var(--earth)' }}>
                        ⚠️ Attendance below 75%. Please attend upcoming sessions.
                      </div>
                    )}

                    {pastScheduled === 0 && (
                      <div style={{ marginTop:14, padding:'10px 14px', background:'var(--mist)', borderRadius:10, fontSize:12, color:'#aaa', textAlign:'center' }}>
                        No sessions scheduled yet. Check back after your batch starts.
                      </div>
                    )}
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </EnrollmentGate>
  );
};
export default AttendanceScreen;
