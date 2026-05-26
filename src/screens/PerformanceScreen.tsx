/**
 * PerformanceScreen — editorial student performance dashboard.
 *
 * Overall score numeral, 2×2 stat block, per-module scores with Roman numerals,
 * topic mastery bars, and certificate eligibility section. All wrapped in
 * the parchment backdrop with Fraunces display type.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import EnrollmentGate from '../components/EnrollmentGate';
import ParchmentBackdrop from '../components/ParchmentBackdrop';
import { DISPLAY, BODY } from '../components/AuthShell';
import { PrimaryButton, InlineLink } from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';
import { useEnrollment } from '../hooks/useEnrollment';

interface Props { onNavigate: (screen: string, data?: unknown) => void; }

interface ModuleScore {
  moduleId:     number;
  title:        string;
  scorePct:     number;
  passed:       boolean;
  reward:       boolean;
  attemptCount: number;
  status:       'locked' | 'in-progress' | 'completed';
}

interface TopicScore { topic: string; scorePct: number; }

// ─── Roman numerals (max XX for 20 modules — enough for any course) ──────────
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

const PerformanceScreen: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { loading: enrollLoading, enrollment } = useEnrollment();

  const [loading, setLoading]                 = useState(true);
  const [modules, setModules]                 = useState<ModuleScore[]>([]);
  const [topics, setTopics]                   = useState<TopicScore[]>([]);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [scheduledCount, setScheduledCount]   = useState(0);
  const [cert, setCert]                       = useState<{ id: string; issuedAt: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!enrollment || !user) return;
    setLoading(true);

    const today = new Date().toISOString().slice(0, 10);

    const [modsRes, progressRes, attemptsRes, topicsRes, attendRes, scheduledRes, certRes] = await Promise.all([
      supabase.from('modules').select('id, title, order_index').eq('course_id', enrollment.courseId).order('order_index'),
      supabase.from('user_progress').select('module_id, status').eq('user_id', user.id),
      supabase.from('assessment_attempts').select('module_id, score_pct, passed, reward_earned, attempted_at').eq('user_id', user.id).order('attempted_at', { ascending: false }),
      supabase.from('student_topic_scores').select('topic_tag, score_pct').eq('user_id', user.id),
      supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('registration_id', enrollment.registrationId),
      supabase.from('session_qr_codes').select('id', { count: 'exact', head: true }).eq('course_id', enrollment.courseId).lte('session_date', today),
      supabase.from('certificates').select('cert_id, issued_at').eq('registration_id', enrollment.registrationId).maybeSingle(),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const progressMap: Record<number, string> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (progressRes.data ?? []).forEach((p: any) => { progressMap[p.module_id] = p.status; });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latestPer: Record<number, any> = {};
    const countPer: Record<number, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (attemptsRes.data ?? []).forEach((a: any) => {
      countPer[a.module_id] = (countPer[a.module_id] ?? 0) + 1;
      if (!latestPer[a.module_id]) latestPer[a.module_id] = a;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moduleScores: ModuleScore[] = (modsRes.data ?? []).map((m: any) => {
      const att = latestPer[m.id];
      return {
        moduleId:     m.id,
        title:        m.title,
        scorePct:     att ? Math.round(att.score_pct) : 0,
        passed:       att?.passed ?? false,
        reward:       att?.reward_earned ?? false,
        attemptCount: countPer[m.id] ?? 0,
        status:       (progressMap[m.id] ?? 'locked') as ModuleScore['status'],
      };
    });
    setModules(moduleScores);

    const tMap: Record<string, number[]> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (topicsRes.data ?? []).forEach((t: any) => {
      if (!t.topic_tag) return;
      if (!tMap[t.topic_tag]) tMap[t.topic_tag] = [];
      tMap[t.topic_tag].push(t.score_pct);
    });
    const topicScores: TopicScore[] = Object.entries(tMap)
      .map(([topic, scores]) => ({
        topic,
        scorePct: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }))
      .sort((a, b) => b.scorePct - a.scorePct);
    setTopics(topicScores);

    setAttendanceCount(attendRes.count ?? 0);
    setScheduledCount(scheduledRes.count ?? 0);
    setCert(certRes.data
      ? { id: certRes.data.cert_id, issuedAt: certRes.data.issued_at }
      : null);
    setLoading(false);
  }, [enrollment, user]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Derived metrics ─────────────────────────────────────────────────────
  const completedModules = modules.filter(m => m.status === 'completed').length;
  const totalModules     = modules.length;
  const modulesAttempted = modules.filter(m => m.attemptCount > 0);
  const avgScore         = modulesAttempted.length > 0
    ? Math.round(modulesAttempted.reduce((s, m) => s + m.scorePct, 0) / modulesAttempted.length)
    : null;
  const rewardsCount     = modules.filter(m => m.reward).length;
  const attendancePct    = scheduledCount > 0 ? Math.round((attendanceCount / scheduledCount) * 100) : null;
  const progressPct      = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  const scoreColor = (pct: number) => pct >= 90 ? 'var(--leaf)' : pct >= 60 ? 'var(--forest)' : 'var(--red)';
  const topicColor = (pct: number) => pct >= 80 ? 'var(--leaf)' : pct >= 60 ? 'var(--amber)' : 'var(--red)';

  // ─── Headline/subhead tone keyed to avg score ────────────────────────────
  const tone = (() => {
    if (avgScore === null) return {
      headline: 'Your',
      italicAccent: 'journey begins.',
      note: 'Take your first module assessment to populate your performance record.',
    };
    if (avgScore >= 90) return {
      headline: 'Exceptional',
      italicAccent: 'progress.',
      note: "You're earning institutional rewards. Keep this momentum.",
    };
    if (avgScore >= 60) return {
      headline: 'Steady',
      italicAccent: 'progress.',
      note: 'You\'re passing every module. Push above 90% to earn special rewards.',
    };
    return {
      headline: 'Building',
      italicAccent: 'foundations.',
      note: 'Review the topics flagged below in red — they need attention.',
    };
  })();

  return (
    <EnrollmentGate
      loading={enrollLoading}
      enrolled={!!enrollment}
      icon="📊"
      title="My Performance"
      message="Enroll in a course to track your performance and rewards."
      onBrowse={() => onNavigate('courses')}
    >
      <ParchmentBackdrop decorations="full">
        <div className="screen" style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            maxWidth: 480, margin: '0 auto',
            padding: 'calc(24px + var(--safe-top)) 28px calc(40px + var(--safe-bottom))',
          }}>

            {/* ── Top bar (minimal back button) ── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 28,
              animation: 'fadeUpSoft 0.5s ease 0s both',
            }}>
              <button onClick={() => onNavigate('home')}
                style={{
                  fontFamily: DISPLAY,
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--moss)',
                  background: 'rgba(255,255,255,0.4)',
                  border: '1px solid rgba(26,58,42,0.12)',
                  padding: '6px 14px',
                  borderRadius: 2,
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                ↩ home
              </button>
            </div>

            {/* ── Eyebrow ── */}
            <div style={{
              fontFamily: BODY,
              fontSize: 10, fontWeight: 600,
              color: 'var(--moss)',
              letterSpacing: '0.34em',
              textTransform: 'uppercase',
              marginBottom: 14,
              animation: 'fadeUpSoft 0.5s ease 0.05s both',
            }}>
              — Performance
            </div>

            {/* ── Headline ── */}
            <h1 style={{
              fontFamily: DISPLAY,
              fontSize: 'clamp(42px, 12vw, 64px)',
              color: 'var(--forest)',
              fontWeight: 400,
              lineHeight: 0.96,
              letterSpacing: '-0.022em',
              margin: 0, marginBottom: 12,
              fontVariationSettings: '"opsz" 144, "SOFT" 80',
              animation: 'fadeUpSoft 0.6s ease 0.12s both',
            }}>
              {tone.headline}<br/>
              <em style={{ fontStyle: 'italic', color: 'var(--moss)', fontWeight: 400 }}>{tone.italicAccent}</em>
            </h1>

            {/* Course title */}
            <p style={{
              fontFamily: DISPLAY,
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--charcoal)',
              opacity: 0.55,
              margin: 0, marginBottom: 28,
              animation: 'fadeUpSoft 0.5s ease 0.2s both',
            }}>
              {enrollment?.courseTitle}
            </p>

            {/* Decorative rule */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32,
              animation: 'fadeUpSoft 0.5s ease 0.28s both',
            }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
              <span style={{ fontFamily: DISPLAY, fontSize: 13, color: 'var(--moss)', opacity: 0.7 }}>✦</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
            </div>

            {loading ? (
              <LoadingNote/>
            ) : (
              <>
                {/* ── HERO: Overall score numeral ── */}
                <section style={{ marginBottom: 40, animation: 'fadeUpSoft 0.6s ease 0.35s both' }}>
                  <div style={{
                    fontFamily: BODY,
                    fontSize: 9, fontWeight: 700,
                    color: 'var(--moss)',
                    letterSpacing: '0.4em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}>
                    Overall Score
                  </div>

                  <div style={{
                    fontFamily: DISPLAY,
                    fontSize: 'clamp(96px, 32vw, 156px)',
                    color: avgScore !== null ? scoreColor(avgScore) : 'rgba(26,58,42,0.25)',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    lineHeight: 0.9,
                    letterSpacing: '-0.04em',
                    fontVariationSettings: '"opsz" 144, "SOFT" 100',
                  }}>
                    {avgScore !== null ? avgScore : '—'}
                    {avgScore !== null && <span style={{ fontSize: '0.5em', verticalAlign: 'super', marginLeft: 4 }}>%</span>}
                  </div>

                  <div style={{
                    fontFamily: BODY,
                    fontSize: 11,
                    color: 'var(--moss)',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    marginTop: 6, marginBottom: 14,
                  }}>
                    {modulesAttempted.length} of {totalModules} modules attempted
                  </div>

                  <p style={{
                    fontFamily: DISPLAY,
                    fontStyle: 'italic',
                    fontSize: 16,
                    color: 'var(--charcoal)',
                    opacity: 0.72,
                    lineHeight: 1.5,
                    margin: 0,
                    maxWidth: 380,
                  }}>
                    {tone.note}
                  </p>
                </section>

                {/* ── Stat block 2×2 — magazine-style ── */}
                <section style={{
                  marginBottom: 40,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  rowGap: 22, columnGap: 24,
                  animation: 'fadeUpSoft 0.6s ease 0.45s both',
                }}>
                  <StatBlock
                    eyebrow="Modules Completed"
                    figure={`${completedModules} / ${totalModules}`}
                    caption={`${progressPct}% of course`}
                  />
                  <StatBlock
                    eyebrow="Attendance"
                    figure={attendancePct !== null ? `${attendancePct}%` : '—'}
                    caption={scheduledCount > 0 ? `${attendanceCount} of ${scheduledCount} sessions` : 'no sessions yet'}
                  />
                  <StatBlock
                    eyebrow="Assessments Taken"
                    figure={String(modulesAttempted.length)}
                    caption={avgScore !== null ? `avg ${avgScore}%` : 'none yet'}
                  />
                  <StatBlock
                    eyebrow="Rewards Earned"
                    figure={rewardsCount > 0 ? `${rewardsCount} ✦` : '—'}
                    caption={rewardsCount > 0 ? 'internship or project' : '90%+ unlocks reward'}
                    gold={rewardsCount > 0}
                  />
                </section>

                {/* ── Module Scores ── */}
                {modules.length > 0 && (
                  <section style={{ marginBottom: 40, animation: 'fadeUpSoft 0.6s ease 0.55s both' }}>
                    <SectionHeader text="Module Scores"/>
                    {modules.map((m, i) => (
                      <ModuleRow
                        key={m.moduleId}
                        index={i}
                        title={m.title}
                        scorePct={m.scorePct}
                        passed={m.passed}
                        reward={m.reward}
                        attemptCount={m.attemptCount}
                        scoreColor={scoreColor}
                        onRetake={() => onNavigate('learning')}
                      />
                    ))}
                  </section>
                )}

                {/* ── Topic Mastery ── */}
                {topics.length > 0 && (
                  <section style={{ marginBottom: 40, animation: 'fadeUpSoft 0.6s ease 0.65s both' }}>
                    <SectionHeader text="Topic Mastery"/>
                    <p style={{
                      fontFamily: DISPLAY,
                      fontStyle: 'italic',
                      fontSize: 13,
                      color: 'var(--charcoal)',
                      opacity: 0.6,
                      lineHeight: 1.5,
                      margin: '0 0 20px',
                    }}>
                      Strongest topics at the top.{' '}
                      <span style={{ color: 'var(--leaf)', fontWeight: 600, fontStyle: 'normal', fontFamily: BODY, fontSize: 11, letterSpacing: '0.1em' }}>GREEN</span> ≥80% ·{' '}
                      <span style={{ color: 'var(--amber)', fontWeight: 600, fontStyle: 'normal', fontFamily: BODY, fontSize: 11, letterSpacing: '0.1em' }}>AMBER</span> 60-79% ·{' '}
                      <span style={{ color: 'var(--red)', fontWeight: 600, fontStyle: 'normal', fontFamily: BODY, fontSize: 11, letterSpacing: '0.1em' }}>RED</span> needs review.
                    </p>
                    {topics.map((t, i) => (
                      <div key={t.topic} style={{
                        marginBottom: i === topics.length - 1 ? 0 : 18,
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          marginBottom: 8,
                        }}>
                          <span style={{
                            fontFamily: DISPLAY,
                            fontStyle: 'italic',
                            fontSize: 15,
                            color: 'var(--charcoal)',
                            opacity: 0.85,
                          }}>{t.topic}</span>
                          <span style={{
                            fontFamily: DISPLAY,
                            fontSize: 17,
                            color: topicColor(t.scorePct),
                            fontWeight: 500,
                          }}>{t.scorePct}%</span>
                        </div>
                        <div style={{
                          background: 'rgba(26,58,42,0.08)',
                          height: 3,
                          position: 'relative',
                        }}>
                          <div style={{
                            position: 'absolute', left: 0, top: 0,
                            height: 3,
                            background: topicColor(t.scorePct),
                            width: `${t.scorePct}%`,
                            transition: 'width 0.8s ease',
                          }}/>
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                {/* ── Certificate ── */}
                <section style={{ marginBottom: 24, animation: 'fadeUpSoft 0.6s ease 0.75s both' }}>
                  <SectionHeader text="Certificate"/>
                  {cert ? (
                    <CertIssuedCard
                      certId={cert.id}
                      issuedAt={cert.issuedAt}
                      onView={() => onNavigate('certificates')}
                    />
                  ) : (
                    <CertPendingCard
                      progressPct={progressPct}
                      remaining={totalModules - completedModules}
                    />
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </ParchmentBackdrop>
    </EnrollmentGate>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const LoadingNote: React.FC = () => (
  <div style={{
    fontFamily: DISPLAY,
    fontStyle: 'italic',
    fontSize: 15,
    color: 'var(--moss)',
    textAlign: 'center',
    padding: '40px 0',
  }}>
    Loading your performance record…
  </div>
);

const SectionHeader: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
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

interface StatBlockProps {
  eyebrow: string;
  figure: string;
  caption: string;
  gold?: boolean;
}
const StatBlock: React.FC<StatBlockProps> = ({ eyebrow, figure, caption, gold }) => (
  <div style={{
    paddingTop: 14,
    borderTop: `1px solid ${gold ? 'var(--gold)' : 'rgba(26,58,42,0.2)'}`,
  }}>
    <div style={{
      fontFamily: BODY,
      fontSize: 9, fontWeight: 700,
      color: gold ? 'var(--gold)' : 'var(--moss)',
      letterSpacing: '0.34em',
      textTransform: 'uppercase',
      marginBottom: 6,
    }}>
      {eyebrow}
    </div>
    <div style={{
      fontFamily: DISPLAY,
      fontSize: 28,
      fontWeight: 400,
      color: gold ? 'var(--gold)' : 'var(--forest)',
      lineHeight: 1.05,
      letterSpacing: '-0.02em',
    }}>
      {figure}
    </div>
    <div style={{
      fontFamily: DISPLAY,
      fontStyle: 'italic',
      fontSize: 12,
      color: 'var(--charcoal)',
      opacity: 0.55,
      marginTop: 4,
      lineHeight: 1.3,
    }}>
      {caption}
    </div>
  </div>
);

interface ModuleRowProps {
  index: number;
  title: string;
  scorePct: number;
  passed: boolean;
  reward: boolean;
  attemptCount: number;
  scoreColor: (pct: number) => string;
  onRetake: () => void;
}
const ModuleRow: React.FC<ModuleRowProps> = ({
  index, title, scorePct, passed, reward, attemptCount, scoreColor, onRetake,
}) => {
  const attempted = attemptCount > 0;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 18,
      padding: '14px 0',
      borderTop: index === 0 ? '1px solid rgba(26,58,42,0.15)' : 'none',
      borderBottom: '1px solid rgba(26,58,42,0.15)',
    }}>
      {/* Roman numeral */}
      <span style={{
        fontFamily: DISPLAY,
        fontStyle: 'italic',
        fontSize: 18,
        color: 'var(--moss)',
        minWidth: 38,
        opacity: 0.85,
        lineHeight: 1.4,
      }}>
        {toRoman(index + 1)}.
      </span>

      {/* Title + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: DISPLAY,
          fontSize: 16,
          color: 'var(--charcoal)',
          lineHeight: 1.3,
          opacity: attempted ? 1 : 0.55,
        }}>
          {title}
        </div>
        <div style={{
          fontFamily: BODY,
          fontSize: 10,
          color: 'var(--moss)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          marginTop: 4,
          opacity: 0.78,
        }}>
          {attempted ? (
            <>
              {attemptCount} attempt{attemptCount === 1 ? '' : 's'}{' '}·{' '}
              <span style={{ color: passed ? 'var(--leaf)' : 'var(--red)' }}>
                {passed ? 'Passed' : 'Did not pass'}
              </span>
              {reward && <> · <span style={{ color: 'var(--gold)' }}>✦ reward</span></>}
            </>
          ) : 'Not attempted'}
        </div>
        {attempted && !passed && (
          <div style={{ marginTop: 6 }}>
            <InlineLink onClick={onRetake}>
              <span style={{ fontFamily: DISPLAY, fontStyle: 'italic' }}>↻</span>{' '}retake
            </InlineLink>
          </div>
        )}
      </div>

      {/* Score */}
      <div style={{
        fontFamily: DISPLAY,
        fontStyle: 'italic',
        fontSize: 22,
        color: attempted ? scoreColor(scorePct) : 'rgba(26,58,42,0.25)',
        fontWeight: 500,
        flexShrink: 0,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
      }}>
        {attempted ? `${scorePct}%` : '—'}
      </div>
    </div>
  );
};

interface CertIssuedCardProps { certId: string; issuedAt: string; onView: () => void; }
const CertIssuedCard: React.FC<CertIssuedCardProps> = ({ certId, issuedAt, onView }) => (
  <div style={{
    position: 'relative',
    padding: '22px 22px 20px',
    background: 'rgba(201,168,76,0.06)',
    border: '1px solid rgba(201,168,76,0.32)',
  }}>
    <div style={{
      position: 'absolute', top: -1, left: -1, right: -1, height: 3,
      background: 'var(--gold)',
    }}/>
    <div style={{
      fontFamily: BODY,
      fontSize: 9, fontWeight: 700,
      color: 'var(--gold)',
      letterSpacing: '0.4em',
      textTransform: 'uppercase',
      marginBottom: 10,
    }}>
      ✦ Awarded
    </div>
    <div style={{
      fontFamily: DISPLAY,
      fontStyle: 'italic',
      fontSize: 22,
      color: 'var(--forest)',
      fontWeight: 500,
      marginBottom: 6,
    }}>
      Certificate issued
    </div>
    <div style={{
      fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
      fontSize: 12,
      color: 'var(--moss)',
      marginBottom: 4,
    }}>
      {certId}
    </div>
    <div style={{
      fontFamily: DISPLAY,
      fontStyle: 'italic',
      fontSize: 13,
      color: 'var(--charcoal)',
      opacity: 0.6,
      marginBottom: 18,
    }}>
      Issued {new Date(issuedAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
    </div>
    <PrimaryButton onClick={onView} label="View Certificate" arrow="→"/>
  </div>
);

interface CertPendingCardProps { progressPct: number; remaining: number; }
const CertPendingCard: React.FC<CertPendingCardProps> = ({ progressPct, remaining }) => (
  <div style={{
    padding: '22px 20px',
    background: 'rgba(45,90,61,0.04)',
    borderLeft: '2px solid var(--moss)',
  }}>
    <div style={{
      fontFamily: BODY,
      fontSize: 9, fontWeight: 700,
      color: 'var(--moss)',
      letterSpacing: '0.4em',
      textTransform: 'uppercase',
      marginBottom: 10,
    }}>
      In progress
    </div>
    <div style={{
      fontFamily: DISPLAY,
      fontStyle: 'italic',
      fontSize: 20,
      color: 'var(--forest)',
      fontWeight: 500,
      lineHeight: 1.3,
      marginBottom: 14,
    }}>
      {remaining > 0
        ? <>Complete <span style={{ fontStyle: 'normal', fontFamily: BODY, fontWeight: 700 }}>{remaining}</span> more module{remaining === 1 ? '' : 's'} to earn your certificate.</>
        : 'Course complete — certificate pending issuance by AIWMR.'}
    </div>
    <div style={{
      background: 'rgba(26,58,42,0.1)',
      height: 3,
      position: 'relative',
      marginBottom: 6,
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0,
        height: 3,
        background: 'var(--leaf)',
        width: `${progressPct}%`,
        transition: 'width 0.6s ease',
      }}/>
    </div>
    <div style={{
      fontFamily: BODY,
      fontSize: 10, fontWeight: 600,
      color: 'var(--moss)',
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
    }}>
      {progressPct}% complete
    </div>
  </div>
);

export default PerformanceScreen;
