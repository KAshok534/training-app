/**
 * AttendanceScreen — editorial QR attendance + monthly calendar.
 *
 * Two input modes (camera scan + manual 6-char code) with four result states:
 * success / already / invalid / error. Plus the monthly calendar grid with
 * present / missed / no-session / today / upcoming cell types.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { supabase } from '../lib/supabase';
import EnrollmentGate from '../components/EnrollmentGate';
import ParchmentBackdrop from '../components/ParchmentBackdrop';
import { DISPLAY, BODY } from '../components/AuthShell';
import { PrimaryButton } from '../components/AuthForm';
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
  const alreadyScanned                      = useRef(false);

  const now      = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  // ── Data fetch ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!enrollment) return;
    const [attendRes, scheduledRes] = await Promise.all([
      supabase.from('attendance').select('session_date').eq('registration_id', enrollment.registrationId),
      supabase.from('session_qr_codes').select('session_date').eq('course_id', enrollment.courseId),
    ]);
    if (attendRes.data)    setAttendedDates(new Set(attendRes.data.map((a: { session_date: string }) => a.session_date)));
    if (scheduledRes.data) setScheduledDates(new Set(scheduledRes.data.map((q: { session_date: string }) => q.session_date)));
    setDataLoading(false);
  }, [enrollment]);

  useEffect(() => { if (enrollment) fetchData(); }, [enrollment, fetchData]);

  // ── Mark attendance ───────────────────────────────────────────────────────
  const markAttendance = useCallback(async (code: string) => {
    if (!enrollment) return;
    const trimmed = code.trim().toUpperCase();

    const { data: session, error: sessionError } = await supabase
      .from('session_qr_codes')
      .select('id, session_date, expires_at, course_id')
      .eq('qr_code', trimmed)
      .single();

    if (sessionError || !session) { setScanState('invalid'); return; }
    if (new Date(session.expires_at) <= new Date()) { setScanState('invalid'); return; }
    if (attendedDates.has(session.session_date)) { setScanState('already'); return; }

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

  // ── QR result handler ────────────────────────────────────────────────────
  const handleQrResult = useCallback((detectedCodes: { rawValue: string }[]) => {
    const result = detectedCodes?.[0];
    if (!result || alreadyScanned.current) return;
    const text = result.rawValue;
    if (!text) return;
    alreadyScanned.current = true;
    markAttendance(text);
  }, [markAttendance]);

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
      if (isToday)                                                  status = 'today';
      else if (!isPast)                                             status = 'future';
      else if (attendedDates.has(dateStr))                          status = 'present';
      else if (scheduledDates.has(dateStr))                         status = 'absent';
      else                                                          status = 'no-session';

      cells.push({ day: d, status });
    }
    return cells;
  };

  const isCurrentMonth = calYear === now.getFullYear() && calMonth === now.getMonth();
  const monthLabel     = new Date(calYear, calMonth, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const goPrev = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const goNext = () => { if (isCurrentMonth) return; if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };

  const cellStyle: Record<CellStatus, React.CSSProperties> = {
    present:      { background: 'var(--leaf)',                color: 'white' },
    absent:       { background: 'rgba(192,57,43,0.15)',       color: 'var(--red)',   border: '1px solid rgba(192,57,43,0.3)' },
    'no-session': { background: 'transparent',                color: 'rgba(26,58,42,0.3)' },
    today:        { background: 'var(--amber)',               color: 'white', border: '2px solid var(--earth)' },
    future:       { background: 'transparent',                color: 'rgba(26,58,42,0.55)' },
    empty:        { background: 'transparent',                color: 'transparent' },
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
      message="Enroll in a course and complete payment to mark and view your attendance."
      onBrowse={() => onNavigate('courses')}
    >
      <ParchmentBackdrop decorations="full">
        <div className="screen" style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            maxWidth: 540, margin: '0 auto',
            padding: 'calc(28px + var(--safe-top)) 28px 40px',
          }}>

            {/* ── RESULT STATES ── */}
            {scanState !== 'idle' && (
              <ResultPanel state={scanState} now={now} stats={{ attended, pct, missed, pastScheduled }} onReset={resetToIdle}/>
            )}

            {scanState === 'idle' && (
              <>
                {/* ── Editorial header ── */}
                <div style={{
                  fontFamily: BODY,
                  fontSize: 10, fontWeight: 600,
                  color: 'var(--moss)',
                  letterSpacing: '0.34em',
                  textTransform: 'uppercase',
                  marginBottom: 14,
                  animation: 'fadeUpSoft 0.5s ease 0s both',
                }}>
                  — Attendance
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
                  Mark your<br/>
                  <em style={{ fontStyle: 'italic', color: 'var(--moss)', fontWeight: 400 }}>presence.</em>
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
                  Scan the session QR or enter the 6-character code.
                </p>

                {/* ── Mode tabs (editorial) ── */}
                <div style={{
                  display: 'flex',
                  gap: 4,
                  marginBottom: 24,
                  borderBottom: '1px solid rgba(26,58,42,0.12)',
                  animation: 'fadeUpSoft 0.5s ease 0.25s both',
                }}>
                  {(['camera', 'code'] as InputMode[]).map(mode => {
                    const active = inputMode === mode;
                    return (
                      <button key={mode}
                        onClick={() => setInputMode(mode)}
                        style={{
                          padding: '12px 16px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: active ? DISPLAY : BODY,
                          fontSize: active ? 15 : 11,
                          fontStyle: active ? 'italic' : 'normal',
                          fontWeight: active ? 500 : 600,
                          color: active ? 'var(--forest)' : 'rgba(26,58,42,0.45)',
                          letterSpacing: active ? '0.01em' : '0.22em',
                          textTransform: active ? 'none' : 'uppercase',
                          borderBottom: active ? '2px solid var(--forest)' : '2px solid transparent',
                          marginBottom: -1,
                          transition: 'all 0.2s ease',
                        }}>
                        {mode === 'camera' ? (active ? 'scan qr' : 'Scan QR') : (active ? 'enter code' : 'Enter Code')}
                      </button>
                    );
                  })}
                </div>

                {/* ── Camera mode ── */}
                {inputMode === 'camera' && (
                  <div style={{
                    position: 'relative',
                    marginBottom: 32,
                    animation: 'fadeUpSoft 0.5s ease 0.3s both',
                    background: '#0d1d15',
                    border: '1px solid rgba(26,58,42,0.18)',
                  }}>
                    <Scanner
                      onScan={handleQrResult}
                      constraints={{ facingMode: 'environment' }}
                      styles={{
                        container: { width: '100%' },
                        video: { width: '100%', display: 'block' },
                      }}
                      sound={false}
                    />
                    {/* Corner brackets */}
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                      {([
                        { top: 16, left: 16,   borderRight: 'none', borderBottom: 'none' },
                        { top: 16, right: 16,  borderLeft: 'none',  borderBottom: 'none' },
                        { bottom: 16, left: 16,  borderRight: 'none', borderTop: 'none' },
                        { bottom: 16, right: 16, borderLeft: 'none',  borderTop: 'none' },
                      ] as React.CSSProperties[]).map((st, i) => (
                        <div key={i} style={{
                          position: 'absolute',
                          width: 28, height: 28,
                          border: '2px solid var(--leaf)',
                          ...st,
                        }}/>
                      ))}
                    </div>
                    <div style={{
                      padding: '14px 18px',
                      fontFamily: DISPLAY,
                      fontStyle: 'italic',
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.7)',
                      textAlign: 'center',
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      Point your camera at the session QR code
                    </div>
                  </div>
                )}

                {/* ── Manual code mode ── */}
                {inputMode === 'code' && (
                  <div style={{
                    marginBottom: 32,
                    animation: 'fadeUpSoft 0.5s ease 0.3s both',
                  }}>
                    <div style={{
                      fontFamily: BODY,
                      fontSize: 10, fontWeight: 600,
                      color: 'var(--moss)',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      marginBottom: 10,
                    }}>
                      Six-character session code
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="K7NP3A"
                      value={manualCode}
                      onChange={e => { setManualCode(e.target.value.toUpperCase()); setCodeError(''); }}
                      style={{
                        width: '100%',
                        padding: '18px 0',
                        textAlign: 'center',
                        fontSize: 32,
                        fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
                        fontWeight: 500,
                        letterSpacing: '0.4em',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: codeError ? '1.5px solid var(--red)' : '1.5px solid rgba(26,58,42,0.25)',
                        outline: 'none',
                        color: 'var(--forest)',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.25s ease',
                      }}
                    />
                    {codeError && (
                      <div style={{
                        fontFamily: DISPLAY,
                        fontStyle: 'italic',
                        fontSize: 13,
                        color: 'var(--red)',
                        marginTop: 8,
                      }}>
                        {codeError}
                      </div>
                    )}
                    <div style={{ marginTop: 18 }}>
                      <PrimaryButton
                        onClick={handleCodeSubmit}
                        loading={submitting}
                        label="Mark Attendance"
                        arrow="✓"
                      />
                    </div>
                  </div>
                )}

                {/* ── Decorative rule ── */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28,
                  animation: 'fadeUpSoft 0.5s ease 0.4s both',
                }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
                  <span style={{ fontFamily: DISPLAY, fontSize: 13, color: 'var(--moss)', opacity: 0.7 }}>✦</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
                </div>

                {dataLoading ? (
                  <div style={{
                    fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
                    color: 'var(--moss)', textAlign: 'center', padding: '40px 0',
                  }}>
                    Loading attendance records…
                  </div>
                ) : (
                  <>
                    {/* ── Stats grid 2×2 ── */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      rowGap: 22, columnGap: 24,
                      marginBottom: 36,
                      animation: 'fadeUpSoft 0.5s ease 0.5s both',
                    }}>
                      <Stat eyebrow="Attended" figure={String(attended)}                       caption="sessions"/>
                      <Stat eyebrow="Rate"     figure={pct !== null ? `${pct}%` : '—'}         caption={pct !== null && pct >= 75 ? 'on track' : pct !== null ? 'below 75%' : 'no data yet'} accent={pct !== null && pct < 75 ? 'var(--amber)' : undefined}/>
                      <Stat eyebrow="Missed"   figure={String(missed)}                         caption={missed === 1 ? 'session' : 'sessions'}/>
                      <Stat eyebrow="Total"    figure={String(pastScheduled)}                  caption="past sessions"/>
                    </div>

                    {/* ── Calendar ── */}
                    <div style={{
                      animation: 'fadeUpSoft 0.5s ease 0.6s both',
                    }}>
                      {/* Section header */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 18,
                      }}>
                        <button onClick={goPrev}
                          style={{
                            fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 16,
                            color: 'var(--moss)', background: 'none', border: 'none',
                            padding: 0, cursor: 'pointer',
                          }}>
                          ‹
                        </button>
                        <span style={{
                          fontFamily: BODY,
                          fontSize: 10, fontWeight: 700,
                          color: 'var(--forest)',
                          letterSpacing: '0.36em',
                          textTransform: 'uppercase',
                          flex: 1,
                          textAlign: 'center',
                        }}>
                          {monthLabel}
                        </span>
                        <button onClick={goNext}
                          disabled={isCurrentMonth}
                          style={{
                            fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 16,
                            color: isCurrentMonth ? 'rgba(74,124,89,0.3)' : 'var(--moss)',
                            background: 'none', border: 'none',
                            padding: 0, cursor: isCurrentMonth ? 'default' : 'pointer',
                          }}>
                          ›
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
                        {DAY_LABELS.map(d => (
                          <div key={d} style={{
                            textAlign: 'center',
                            fontFamily: BODY,
                            fontSize: 9, fontWeight: 600,
                            color: 'var(--moss)',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            opacity: 0.65,
                            paddingBottom: 6,
                          }}>{d}</div>
                        ))}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
                        {buildCalendar().map((cell, i) => (
                          <div key={i} style={{
                            aspectRatio: '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: DISPLAY,
                            fontStyle: cell.status === 'today' ? 'italic' : 'normal',
                            fontSize: 13,
                            fontWeight: cell.status === 'today' ? 600 : 400,
                            ...cellStyle[cell.status],
                          }}>
                            {cell.status !== 'empty' ? cell.day : ''}
                          </div>
                        ))}
                      </div>

                      {/* Legend */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 14,
                        marginTop: 18,
                        fontFamily: BODY,
                        fontSize: 9, fontWeight: 600,
                        color: 'var(--moss)',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                      }}>
                        {([
                          ['var(--leaf)',                'Present'],
                          ['rgba(192,57,43,0.15)',       'Missed'],
                          ['var(--amber)',               'Today'],
                          ['rgba(26,58,42,0.08)',        'No session'],
                        ] as [string, string][]).map(([bg, label]) => (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 9, height: 9, background: bg, flexShrink: 0 }}/>
                            <span>{label}</span>
                          </div>
                        ))}
                      </div>

                      {pct !== null && pct < 75 && pastScheduled > 0 && (
                        <div style={{
                          marginTop: 18,
                          padding: '12px 14px',
                          background: 'rgba(212,148,58,0.08)',
                          borderLeft: '2px solid var(--amber)',
                          fontFamily: DISPLAY,
                          fontStyle: 'italic',
                          fontSize: 13,
                          color: 'var(--earth)',
                          lineHeight: 1.5,
                        }}>
                          Your attendance is below 75%. Please join the upcoming sessions.
                        </div>
                      )}

                      {pastScheduled === 0 && (
                        <div style={{
                          marginTop: 18,
                          fontFamily: DISPLAY,
                          fontStyle: 'italic',
                          fontSize: 13,
                          color: 'var(--charcoal)',
                          opacity: 0.55,
                          textAlign: 'center',
                          padding: 18,
                          border: '1px dashed rgba(26,58,42,0.15)',
                        }}>
                          No sessions scheduled yet. Check back after your batch begins.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </ParchmentBackdrop>
    </EnrollmentGate>
  );
};

// ─── Result panel (success / already / invalid / error) ──────────────────────

interface ResultPanelProps {
  state: Exclude<ScanState, 'idle'>;
  now: Date;
  stats: { attended: number; pct: number | null; missed: number; pastScheduled: number };
  onReset: () => void;
}

const ResultPanel: React.FC<ResultPanelProps> = ({ state, now, stats, onReset }) => {
  const config = {
    success: {
      eyebrow:  '— Recorded',
      headline: 'Attendance',
      accent:   'marked.',
      sub:      `${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
      cta:      'Done',
      color:    'var(--leaf)',
    },
    already: {
      eyebrow:  '— Duplicate',
      headline: 'Already',
      accent:   'recorded.',
      sub:      'Your attendance for this session has already been marked.',
      cta:      'OK',
      color:    'var(--moss)',
    },
    invalid: {
      eyebrow:  '— Not Recognised',
      headline: 'Invalid',
      accent:   'code.',
      sub:      'This code is invalid or has expired. Ask your trainer for the current session code.',
      cta:      'Try Again',
      color:    'var(--red)',
    },
    error: {
      eyebrow:  '— Error',
      headline: 'Something',
      accent:   'went wrong.',
      sub:      'Please try again, or contact support if it continues.',
      cta:      'Try Again',
      color:    'var(--red)',
    },
  }[state];

  return (
    <div key={state} style={{ animation: 'fadeUpSoft 0.4s ease both' }}>
      <div style={{
        fontFamily: BODY,
        fontSize: 10, fontWeight: 700,
        color: config.color,
        letterSpacing: '0.36em',
        textTransform: 'uppercase',
        marginBottom: 16,
      }}>
        {config.eyebrow}
      </div>

      <h1 style={{
        fontFamily: DISPLAY,
        fontSize: 'clamp(40px, 11vw, 58px)',
        color: 'var(--forest)',
        fontWeight: 400,
        lineHeight: 0.96,
        letterSpacing: '-0.022em',
        margin: 0, marginBottom: 18,
      }}>
        {config.headline}<br/>
        <em style={{ fontStyle: 'italic', color: config.color }}>{config.accent}</em>
      </h1>

      <p style={{
        fontFamily: DISPLAY,
        fontStyle: 'italic',
        fontSize: 16,
        color: 'var(--charcoal)',
        opacity: 0.7,
        lineHeight: 1.55,
        margin: '0 0 32px',
      }}>
        {config.sub}
      </p>

      {/* Quick stats — only on success */}
      {state === 'success' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          rowGap: 18, columnGap: 24,
          marginBottom: 32,
        }}>
          <Stat eyebrow="Total" figure={String(stats.attended)} caption="sessions attended"/>
          <Stat eyebrow="Rate"  figure={stats.pct !== null ? `${stats.pct}%` : '—'} caption={stats.pct !== null && stats.pct >= 75 ? 'on track' : 'building up'}/>
        </div>
      )}

      <PrimaryButton onClick={onReset} label={config.cta} arrow="→"/>
    </div>
  );
};

// ─── Stat sub-component ──────────────────────────────────────────────────────

const Stat: React.FC<{ eyebrow: string; figure: string; caption: string; accent?: string }> = ({ eyebrow, figure, caption, accent }) => (
  <div style={{
    paddingTop: 14,
    borderTop: `1px solid ${accent ?? 'rgba(26,58,42,0.2)'}`,
  }}>
    <div style={{
      fontFamily: BODY,
      fontSize: 9, fontWeight: 700,
      color: accent ?? 'var(--moss)',
      letterSpacing: '0.32em',
      textTransform: 'uppercase',
      marginBottom: 6,
    }}>{eyebrow}</div>
    <div style={{
      fontFamily: DISPLAY,
      fontSize: 24,
      fontWeight: 400,
      color: 'var(--forest)',
      lineHeight: 1.05,
      letterSpacing: '-0.018em',
    }}>{figure}</div>
    <div style={{
      fontFamily: DISPLAY,
      fontStyle: 'italic',
      fontSize: 12,
      color: 'var(--charcoal)',
      opacity: 0.55,
      marginTop: 4,
      lineHeight: 1.3,
    }}>{caption}</div>
  </div>
);

export default AttendanceScreen;
