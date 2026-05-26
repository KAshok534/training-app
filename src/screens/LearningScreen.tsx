/**
 * LearningScreen — editorial module list.
 *
 * Roman-numeral entries with course progress, latest assessment score, and
 * expandable detail panel with Open / Retake CTAs.
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import EnrollmentGate from '../components/EnrollmentGate';
import ParchmentBackdrop from '../components/ParchmentBackdrop';
import { DISPLAY, BODY } from '../components/AuthShell';
import { PrimaryButton, InlineLink } from '../components/AuthForm';
import { useEnrollment } from '../hooks/useEnrollment';
import { useAuth } from '../context/AuthContext';
import type { CourseModule } from '../types';

interface Props { onNavigate: (screen: string, data?: unknown) => void; }

interface AttemptSummary {
  scorePct:    number;
  passed:      boolean;
  reward:      boolean;
  attemptedAt: string;
}

const toRoman = (n: number): string => {
  const map: [number, string][] = [
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let result = ''; let num = n;
  for (const [val, sym] of map) {
    while (num >= val) { result += sym; num -= val; }
  }
  return result;
};

const LearningScreen: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { loading: enrollLoading, enrollment } = useEnrollment();

  const [modules, setModules]                 = useState<CourseModule[]>([]);
  const [scores, setScores]                   = useState<Record<number, AttemptSummary>>({});
  const [dataLoading, setDataLoading]         = useState(true);
  const [activeId, setActiveId]               = useState<number | null>(null);
  const [attendanceCount, setAttendanceCount] = useState(0);

  useEffect(() => {
    if (!enrollment) return;

    const fetchData = async () => {
      const [modsRes, progressRes, attendRes, attemptsRes] = await Promise.all([
        supabase.from('modules').select('*').eq('course_id', enrollment.courseId).order('order_index'),
        supabase.from('user_progress').select('module_id, status').eq('user_id', user!.id),
        supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('registration_id', enrollment.registrationId),
        supabase.from('assessment_attempts')
          .select('module_id, score_pct, passed, reward_earned, attempted_at')
          .eq('user_id', user!.id)
          .order('attempted_at', { ascending: false }),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const progressMap: Record<number, string> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (progressRes.data ?? []).forEach((p: any) => { progressMap[p.module_id] = p.status; });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scoreMap: Record<number, AttemptSummary> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (attemptsRes.data ?? []).forEach((a: any) => {
        if (!scoreMap[a.module_id]) {
          scoreMap[a.module_id] = {
            scorePct:    Math.round(a.score_pct),
            passed:      a.passed,
            reward:      a.reward_earned,
            attemptedAt: a.attempted_at,
          };
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: CourseModule[] = (modsRes.data ?? []).map((m: any) => {
        const hasContent = !!(m.slide_base_url || m.video_url || m.pdf_url);
        const status = progressMap[m.id] ?? (hasContent ? 'in-progress' : 'locked');
        return {
          id:           m.id,
          title:        m.title,
          type:         m.type,
          duration:     m.duration_label ?? `${m.duration_mins} min`,
          status:       status as CourseModule['status'],
          locked:       status === 'locked',
          description:  m.description,
          videoUrl:     m.video_url,
          pdfUrl:       m.pdf_url,
          slideCount:   m.slide_count ?? undefined,
          slideBaseUrl: m.slide_base_url ?? undefined,
        };
      });

      setModules(mapped);
      setScores(scoreMap);
      setAttendanceCount(attendRes.count ?? 0);
      setDataLoading(false);
    };

    fetchData();
  }, [enrollment, user]);

  const completed = modules.filter(m => m.status === 'completed').length;
  const total     = modules.length;
  const progress  = total > 0 ? Math.round((completed / total) * 100) : 0;

  const scoreColor = (pct: number) =>
    pct >= 90 ? 'var(--leaf)' : pct >= 60 ? 'var(--forest)' : 'var(--red)';

  const typeLabel = (t: CourseModule['type']): string => {
    if (t === 'video')     return 'Video';
    if (t === 'slideshow') return 'Slideshow';
    if (t === 'pdf')       return 'Reading';
    if (t === 'quiz')      return 'Quiz';
    return 'Assignment';
  };

  return (
    <EnrollmentGate
      loading={enrollLoading}
      enrolled={!!enrollment}
      icon="📚"
      title="My Learning"
      message="Enroll in a course and complete payment to access the learning modules."
      onBrowse={() => onNavigate('courses')}
    >
      <ParchmentBackdrop decorations="full">
        <div className="screen" style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            maxWidth: 540, margin: '0 auto',
            padding: 'calc(28px + var(--safe-top)) 28px 40px',
          }}>

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
              — My Learning
            </div>

            <h1 style={{
              fontFamily: DISPLAY,
              fontSize: 'clamp(34px, 9vw, 50px)',
              color: 'var(--forest)',
              fontWeight: 400,
              lineHeight: 1.0,
              letterSpacing: '-0.022em',
              margin: 0, marginBottom: 14,
              fontVariationSettings: '"opsz" 144, "SOFT" 80',
              animation: 'fadeUpSoft 0.6s ease 0.1s both',
            }}>
              Your<br/>
              <em style={{ fontStyle: 'italic', color: 'var(--moss)', fontWeight: 400 }}>curriculum.</em>
            </h1>

            <p style={{
              fontFamily: DISPLAY,
              fontStyle: 'italic',
              fontSize: 15,
              color: 'var(--charcoal)',
              opacity: 0.65,
              margin: 0, marginBottom: 28,
              animation: 'fadeUpSoft 0.5s ease 0.18s both',
            }}>
              {enrollment?.courseTitle}
            </p>

            {/* ── Progress rule ── */}
            {!dataLoading && total > 0 && (
              <div style={{ marginBottom: 28, animation: 'fadeUpSoft 0.5s ease 0.24s both' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 8,
                }}>
                  <span style={{
                    fontFamily: BODY,
                    fontSize: 10, fontWeight: 600,
                    color: 'var(--moss)',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                  }}>
                    Module {completed} of {total}
                  </span>
                  <span style={{
                    fontFamily: DISPLAY,
                    fontStyle: 'italic',
                    fontSize: 18,
                    color: 'var(--forest)',
                    fontWeight: 500,
                  }}>
                    {progress}%
                  </span>
                </div>
                <div style={{
                  background: 'rgba(26,58,42,0.1)',
                  height: 2,
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0,
                    height: 2,
                    background: 'var(--leaf)',
                    width: `${progress}%`,
                    transition: 'width 0.7s ease',
                  }}/>
                </div>
              </div>
            )}

            {/* ── Mini stats ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              rowGap: 20, columnGap: 18,
              marginBottom: 36,
              animation: 'fadeUpSoft 0.5s ease 0.32s both',
            }}>
              <Stat eyebrow="Modules"   figure={`${completed}/${total}`}/>
              <Stat eyebrow="Sessions"  figure={String(attendanceCount)}/>
              <Stat eyebrow="Next Live" figure={enrollment?.batchTime ? enrollment.batchTime.split('–')[0].trim() : '—'}/>
            </div>

            {/* ── Section header ── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
              animation: 'fadeUpSoft 0.5s ease 0.4s both',
            }}>
              <span style={{
                fontFamily: BODY,
                fontSize: 10, fontWeight: 700,
                color: 'var(--forest)',
                letterSpacing: '0.36em',
                textTransform: 'uppercase',
              }}>Course Modules</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
            </div>

            {/* ── Modules list ── */}
            {dataLoading ? (
              <div style={{
                fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
                color: 'var(--moss)', textAlign: 'center', padding: '40px 0',
              }}>
                Loading your modules…
              </div>
            ) : modules.length === 0 ? (
              <div style={{
                fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 15,
                color: 'var(--charcoal)', opacity: 0.6, textAlign: 'center', padding: '40px 0',
              }}>
                No modules have been published for this course yet.
              </div>
            ) : modules.map((m, i) => {
              const attempt = scores[m.id];
              const isOpen  = activeId === m.id;
              const isLocked = m.locked;
              const roman    = toRoman(i + 1).toLowerCase();

              return (
                <div
                  key={m.id}
                  onClick={() => !isLocked && setActiveId(p => p === m.id ? null : m.id)}
                  style={{
                    padding: '18px 0',
                    borderTop: i === 0 ? '1px solid rgba(26,58,42,0.18)' : 'none',
                    borderBottom: '1px solid rgba(26,58,42,0.18)',
                    cursor: isLocked ? 'default' : 'pointer',
                    opacity: isLocked ? 0.55 : 1,
                    animation: `fadeUpSoft 0.5s ease ${0.45 + i * 0.04}s both`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    {/* Roman numeral */}
                    <span style={{
                      fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 17,
                      color: m.status === 'completed' ? 'var(--leaf)' : 'var(--moss)',
                      minWidth: 30, lineHeight: 1.4, opacity: 0.9, flexShrink: 0,
                    }}>{roman}.</span>

                    {/* Body */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: DISPLAY,
                        fontSize: 16,
                        color: 'var(--forest)',
                        fontWeight: 400,
                        lineHeight: 1.3,
                        marginBottom: 6,
                      }}>
                        {m.title}
                      </div>
                      <div style={{
                        fontFamily: BODY,
                        fontSize: 10, fontWeight: 600,
                        color: 'var(--moss)',
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 10,
                        alignItems: 'center',
                      }}>
                        <span>{typeLabel(m.type)}</span>
                        <span style={{ opacity: 0.4 }}>·</span>
                        <span>{m.duration}</span>
                        {isLocked && <>
                          <span style={{ opacity: 0.4 }}>·</span>
                          <span style={{ color: '#999' }}>Locked</span>
                        </>}
                        {m.status === 'completed' && <>
                          <span style={{ opacity: 0.4 }}>·</span>
                          <span style={{ color: 'var(--leaf)' }}>✓ Completed</span>
                        </>}
                      </div>
                    </div>

                    {/* Score badge */}
                    {attempt && (
                      <div style={{
                        textAlign: 'right',
                        flexShrink: 0,
                      }}>
                        <div style={{
                          fontFamily: DISPLAY,
                          fontStyle: 'italic',
                          fontSize: 18,
                          color: scoreColor(attempt.scorePct),
                          fontWeight: 500,
                          letterSpacing: '-0.015em',
                        }}>
                          {attempt.scorePct}%
                        </div>
                        <div style={{
                          fontFamily: BODY,
                          fontSize: 9, fontWeight: 600,
                          color: attempt.passed ? 'var(--leaf)' : 'var(--red)',
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          marginTop: 2,
                        }}>
                          {attempt.passed ? 'Passed' : 'Failed'}
                          {attempt.reward && ' · 🏆'}
                        </div>
                      </div>
                    )}

                    {/* Open indicator */}
                    {!isLocked && !attempt && (
                      <span style={{
                        fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 20,
                        color: 'var(--moss)', flexShrink: 0, lineHeight: 1.2,
                        transform: isOpen ? 'rotate(90deg)' : 'none',
                        transition: 'transform 0.25s ease',
                      }}>{isOpen ? '×' : '→'}</span>
                    )}
                  </div>

                  {/* Expanded panel */}
                  {isOpen && (
                    <div style={{
                      marginTop: 18,
                      paddingTop: 16,
                      borderTop: '1px dashed rgba(26,58,42,0.18)',
                      animation: 'fadeUpSoft 0.3s ease both',
                    }}>
                      {/* Last score panel — only if attempt exists */}
                      {attempt && (
                        <div style={{
                          position: 'relative',
                          padding: '16px 18px 14px',
                          marginBottom: 18,
                          background: attempt.passed ? 'rgba(106,173,120,0.06)' : 'rgba(192,57,43,0.04)',
                          borderLeft: `2px solid ${attempt.passed ? 'var(--leaf)' : 'var(--red)'}`,
                        }}>
                          <div style={{
                            fontFamily: BODY,
                            fontSize: 9, fontWeight: 700,
                            color: attempt.passed ? 'var(--leaf)' : 'var(--red)',
                            letterSpacing: '0.36em',
                            textTransform: 'uppercase',
                            marginBottom: 8,
                          }}>
                            Last attempt
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'space-between',
                            gap: 12,
                          }}>
                            <div>
                              <span style={{
                                fontFamily: DISPLAY,
                                fontStyle: 'italic',
                                fontSize: 28,
                                color: scoreColor(attempt.scorePct),
                                fontWeight: 500,
                                letterSpacing: '-0.02em',
                              }}>
                                {attempt.scorePct}%
                              </span>
                              <span style={{
                                fontFamily: DISPLAY,
                                fontStyle: 'italic',
                                fontSize: 14,
                                color: 'var(--charcoal)',
                                opacity: 0.65,
                                marginLeft: 10,
                              }}>
                                — {attempt.passed ? 'Passed' : 'Did not pass'}
                              </span>
                            </div>
                          </div>
                          {attempt.reward && (
                            <div style={{
                              fontFamily: DISPLAY,
                              fontStyle: 'italic',
                              fontSize: 13,
                              color: 'var(--gold)',
                              marginTop: 6,
                            }}>
                              🏆 Free internship / project report earned.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {m.description && (
                        <p style={{
                          fontFamily: DISPLAY,
                          fontStyle: 'italic',
                          fontSize: 14,
                          color: 'var(--charcoal)',
                          opacity: 0.72,
                          lineHeight: 1.55,
                          margin: '0 0 18px',
                        }}>
                          {m.description}
                        </p>
                      )}

                      {/* CTAs */}
                      <div onClick={e => e.stopPropagation()}>
                        <PrimaryButton
                          onClick={() => onNavigate('moduleViewer', m as unknown)}
                          label={
                            m.type === 'slideshow' ? 'Open Slideshow' :
                            m.videoUrl || m.pdfUrl ? 'Open Module'    :
                                                     'Start Module'
                          }
                          arrow="→"
                        />
                        {attempt && !attempt.passed && (
                          <div style={{ textAlign: 'center', marginTop: 16 }}>
                            <InlineLink onClick={() => onNavigate('assessment', m as unknown)}>
                              <span style={{ fontFamily: DISPLAY, fontStyle: 'italic' }}>↻</span>{' '}retake assessment
                            </InlineLink>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </ParchmentBackdrop>
    </EnrollmentGate>
  );
};

// ─── Stat sub-component ──────────────────────────────────────────────────────

const Stat: React.FC<{ eyebrow: string; figure: string }> = ({ eyebrow, figure }) => (
  <div style={{
    paddingTop: 12,
    borderTop: '1px solid rgba(26,58,42,0.2)',
  }}>
    <div style={{
      fontFamily: BODY,
      fontSize: 9, fontWeight: 700,
      color: 'var(--moss)',
      letterSpacing: '0.3em',
      textTransform: 'uppercase',
      marginBottom: 6,
    }}>{eyebrow}</div>
    <div style={{
      fontFamily: DISPLAY,
      fontSize: 20,
      fontWeight: 400,
      color: 'var(--forest)',
      lineHeight: 1.1,
      letterSpacing: '-0.015em',
    }}>{figure}</div>
  </div>
);

export default LearningScreen;
