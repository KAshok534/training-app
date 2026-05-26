/**
 * AssessmentScreen — editorial-botanical redesign
 *
 * 25-question MCQ assessment with the same typographic language as the auth
 * screens (Fraunces display + DM Sans body, parchment background).
 *
 * Phases:
 *   loading    → spinner with italic note
 *   quiz       → one question per page; immediate per-question feedback
 *   submitting → italic "Recording your responses…"
 *   result     → giant Fraunces numeral + reward card if ≥90%
 *   error      → editorial error with retry link
 *
 * Grading rules (CLAUDE.md §24):
 *   < 60%   → Fail (retake allowed)
 *   60–89%  → Pass
 *   ≥ 90%   → Pass + Free Internship / Academic Project Report reward
 */
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useEnrollment } from '../hooks/useEnrollment';
import ParchmentBackdrop from '../components/ParchmentBackdrop';
import { DISPLAY, BODY } from '../components/AuthShell';
import { PrimaryButton, InlineLink, Divider } from '../components/AuthForm';
import type { CourseModule, Question } from '../types';

interface Props {
  moduleData: CourseModule;
  onBack: () => void;
  onRetake: () => void;
}

type Phase = 'loading' | 'quiz' | 'submitting' | 'result' | 'error';

interface AnswerRecord {
  question_id: number;
  selected_index: number;
  correct: boolean;
}

// ─── Roman numeral helper (max XXV for 25 questions) ─────────────────────────
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

// ─── Tone helpers for the result screen ──────────────────────────────────────
const resultTone = (pct: number) => {
  if (pct >= 90) return {
    eyebrow: '— Outstanding',
    headline: 'You scored',
    italicAccent: 'beautifully.',
    note: "You've earned one of our institutional rewards. See below.",
    color: 'var(--leaf)',
  };
  if (pct >= 60) return {
    eyebrow: '— Module complete',
    headline: 'Well',
    italicAccent: 'done.',
    note: 'The module is now marked complete. Continue your journey.',
    color: 'var(--forest)',
  };
  return {
    eyebrow: '— Almost there',
    headline: 'Not quite',
    italicAccent: 'this time.',
    note: 'Sixty percent unlocks the module. Review the slides and try again.',
    color: 'var(--red)',
  };
};

const AssessmentScreen: React.FC<Props> = ({ moduleData, onBack, onRetake }) => {
  const { user }       = useAuth();
  const { enrollment } = useEnrollment();

  const [phase, setPhase]         = useState<Phase>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent]     = useState(0);
  const [selected, setSelected]   = useState<number | null>(null);
  const [answers, setAnswers]     = useState<AnswerRecord[]>([]);
  const [scorePct, setScorePct]   = useState(0);
  const [correct, setCorrect]     = useState(0);
  const [errMsg, setErrMsg]       = useState('');

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('id, order_index, question_text, options, correct_index, topic_tag')
        .eq('module_id', moduleData.id)
        .order('order_index');

      if (error || !data || data.length === 0) {
        setErrMsg('Could not load questions for this module.');
        setPhase('error');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: Question[] = data.map((q: any) => ({
        id:           q.id,
        orderIndex:   q.order_index,
        questionText: q.question_text,
        options:      Array.isArray(q.options) ? q.options : (q.options as string[]),
        correctIndex: q.correct_index,
        topicTag:     q.topic_tag ?? '',
      }));

      setQuestions(mapped);
      setPhase('quiz');
    };
    load();
  }, [moduleData.id]);

  const totalQ = questions.length;
  const q      = questions[current];

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
  };

  const handleNext = () => {
    if (selected === null || !q) return;
    const record: AnswerRecord = {
      question_id:    q.id,
      selected_index: selected,
      correct:        selected === q.correctIndex,
    };
    const newAnswers = [...answers, record];
    setAnswers(newAnswers);
    setSelected(null);

    if (current + 1 < totalQ) {
      setCurrent(current + 1);
    } else {
      submit(newAnswers);
    }
  };

  const submit = async (finalAnswers: AnswerRecord[]) => {
    setPhase('submitting');
    if (!user) { setPhase('error'); return; }

    const correctCount = finalAnswers.filter(a => a.correct).length;
    const pct          = Math.round((correctCount / totalQ) * 100);
    const passed       = pct >= 60;
    const reward       = pct >= 90;

    await supabase.from('assessment_attempts').insert({
      user_id:         user.id,
      module_id:       moduleData.id,
      registration_id: enrollment?.registrationId ?? null,
      score_pct:       pct,
      total_questions: totalQ,
      correct_count:   correctCount,
      answers:         finalAnswers,
      passed,
      reward_earned:   reward,
    });

    // Aggregate per-topic scores for the Performance dashboard
    const topicMap: Record<string, { correct: number; total: number }> = {};
    questions.forEach((ques, i) => {
      const tag = ques.topicTag || 'general';
      if (!topicMap[tag]) topicMap[tag] = { correct: 0, total: 0 };
      topicMap[tag].total++;
      if (finalAnswers[i]?.correct) topicMap[tag].correct++;
    });

    const topicUpserts = Object.entries(topicMap).map(([tag, s]) => ({
      user_id:   user.id,
      module_id: moduleData.id,
      topic_tag: tag,
      score_pct: Math.round((s.correct / s.total) * 100),
      correct:   s.correct,
      total:     s.total,
      updated_at: new Date().toISOString(),
    }));

    await supabase.from('student_topic_scores')
      .upsert(topicUpserts, { onConflict: 'user_id,module_id,topic_tag' });

    if (passed) {
      await supabase.from('user_progress').upsert(
        { user_id: user.id, module_id: moduleData.id, status: 'completed', completed_at: new Date().toISOString() },
        { onConflict: 'user_id,module_id' },
      );
    }

    setCorrect(correctCount);
    setScorePct(pct);
    setPhase('result');
  };

  // ─── LOADING ─────────────────────────────────────────────────────────────
  if (phase === 'loading' || phase === 'submitting') {
    return (
      <ParchmentBackdrop decorations="grain-only">
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 20,
        }}>
          <div style={{
            width: 32, height: 32,
            border: '2px solid var(--sand)',
            borderTopColor: 'var(--forest)',
            borderRadius: '50%',
            animation: 'spin 0.9s linear infinite',
          }}/>
          <div style={{
            fontFamily: DISPLAY,
            fontStyle: 'italic',
            fontSize: 15,
            color: 'var(--moss)',
            letterSpacing: '0.01em',
          }}>
            {phase === 'loading' ? 'Preparing your questions…' : 'Recording your responses…'}
          </div>
        </div>
      </ParchmentBackdrop>
    );
  }

  // ─── ERROR ───────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <ParchmentBackdrop decorations="full">
        <div style={{
          height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 30px',
          maxWidth: 460, margin: '0 auto',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: BODY,
            fontSize: 10, fontWeight: 600,
            color: 'var(--moss)',
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            marginBottom: 18,
          }}>— Something went wrong</div>

          <h1 style={{
            fontFamily: DISPLAY,
            fontSize: 'clamp(38px, 11vw, 56px)',
            color: 'var(--forest)', fontWeight: 400,
            lineHeight: 0.96,
            letterSpacing: '-0.02em',
            margin: 0, marginBottom: 18,
          }}>
            We hit{' '}<br/>
            <em style={{ fontStyle: 'italic', color: 'var(--moss)' }}>a snag.</em>
          </h1>

          <p style={{
            fontFamily: DISPLAY,
            fontStyle: 'italic',
            fontSize: 15,
            color: 'var(--charcoal)',
            opacity: 0.7,
            lineHeight: 1.55,
            margin: 0,
            marginBottom: 32,
            maxWidth: 320,
          }}>
            {errMsg}
          </p>

          <div style={{ width: '100%', maxWidth: 320 }}>
            <PrimaryButton onClick={onBack} label="Back to Learning" arrow="↩"/>
          </div>
        </div>
      </ParchmentBackdrop>
    );
  }

  // ─── RESULT ──────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const tone = resultTone(scorePct);
    const passed = scorePct >= 60;
    const reward = scorePct >= 90;

    return (
      <ParchmentBackdrop decorations="full">
        <div style={{
          height: '100%',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}>
          <div style={{
            maxWidth: 460,
            margin: '0 auto',
            padding: 'calc(40px + var(--safe-top)) 30px calc(40px + var(--safe-bottom))',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
          }}>
            {/* Eyebrow */}
            <div style={{
              fontFamily: BODY,
              fontSize: 10, fontWeight: 600,
              color: 'var(--moss)',
              letterSpacing: '0.34em',
              textTransform: 'uppercase',
              marginBottom: 18,
              animation: 'fadeUpSoft 0.6s ease 0.05s both',
            }}>
              {tone.eyebrow}
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: DISPLAY,
              fontSize: 'clamp(46px, 13vw, 70px)',
              color: 'var(--forest)',
              fontWeight: 400,
              lineHeight: 0.96,
              letterSpacing: '-0.022em',
              margin: 0, marginBottom: 14,
              fontVariationSettings: '"opsz" 144, "SOFT" 80',
              animation: 'fadeUpSoft 0.7s ease 0.15s both',
            }}>
              {tone.headline}<br/>
              <em style={{ fontStyle: 'italic', color: 'var(--moss)', fontWeight: 400 }}>
                {tone.italicAccent}
              </em>
            </h1>

            {/* The score numeral as a design element */}
            <div style={{
              fontFamily: DISPLAY,
              fontSize: 'clamp(120px, 36vw, 180px)',
              color: tone.color,
              fontStyle: 'italic',
              fontWeight: 400,
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              margin: '20px 0 4px',
              fontVariationSettings: '"opsz" 144, "SOFT" 100',
              animation: 'fadeUpSoft 0.8s ease 0.3s both',
            }}>
              {scorePct}<span style={{ fontSize: '0.5em', verticalAlign: 'super', marginLeft: 4 }}>%</span>
            </div>

            <p style={{
              fontFamily: BODY,
              fontSize: 13,
              color: 'var(--moss)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              margin: 0, marginBottom: 28,
              animation: 'fadeUpSoft 0.7s ease 0.4s both',
            }}>
              {correct} of {totalQ} correct
            </p>

            {/* Editorial subhead */}
            <p style={{
              fontFamily: DISPLAY,
              fontStyle: 'italic',
              fontSize: 17,
              color: 'var(--charcoal)',
              opacity: 0.78,
              lineHeight: 1.5,
              margin: 0, marginBottom: 32,
              maxWidth: 380,
              animation: 'fadeUpSoft 0.7s ease 0.5s both',
            }}>
              {tone.note}
            </p>

            {/* Reward card — only for 90%+ */}
            {reward && (
              <div style={{
                position: 'relative',
                padding: '24px 22px 22px',
                marginBottom: 32,
                background: 'rgba(201,168,76,0.06)',
                border: '1px solid rgba(201,168,76,0.32)',
                animation: 'fadeUpSoft 0.7s ease 0.6s both',
              }}>
                <div style={{
                  position: 'absolute', top: -1, left: -1, right: -1,
                  height: 3,
                  background: 'var(--gold)',
                }}/>
                <div style={{
                  fontFamily: BODY,
                  fontSize: 9, fontWeight: 700,
                  color: 'var(--gold)',
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}>
                  ✦  Institutional Reward
                </div>

                <div style={{
                  fontFamily: DISPLAY,
                  fontSize: 18,
                  fontStyle: 'italic',
                  color: 'var(--forest)',
                  fontWeight: 500,
                  lineHeight: 1.4,
                  marginBottom: 14,
                }}>
                  Your performance qualifies you for one of the following from AIWMR:
                </div>

                <ul style={{
                  listStyle: 'none',
                  padding: 0, margin: 0,
                  fontFamily: DISPLAY,
                  fontSize: 15,
                  color: 'var(--charcoal)',
                  opacity: 0.82,
                  lineHeight: 1.7,
                }}>
                  <li style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: 'var(--gold)' }}>✦</span>
                    <span>A free internship placement</span>
                  </li>
                  <li style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: 'var(--gold)' }}>✦</span>
                    <span>A free academic project report</span>
                  </li>
                </ul>

                <div style={{
                  marginTop: 16, paddingTop: 14,
                  borderTop: '1px solid rgba(201,168,76,0.25)',
                  fontFamily: BODY,
                  fontSize: 12,
                  color: '#888',
                  lineHeight: 1.55,
                }}>
                  Contact <span style={{ color: 'var(--forest)', fontWeight: 600 }}>director@aiwmr.org</span> to claim your reward.
                </div>
              </div>
            )}

            <Divider delay={0.65}/>

            {/* Score detail rows */}
            <div style={{
              marginBottom: 32,
              animation: 'fadeUpSoft 0.7s ease 0.7s both',
            }}>
              {[
                ['Score',           `${scorePct}%`,             tone.color],
                ['Correct answers', `${correct} of ${totalQ}`,  'var(--charcoal)'],
                ['Status',          passed ? 'Passed' : 'Did not pass', passed ? 'var(--leaf)' : 'var(--red)'],
                ['Threshold',       '60% to pass · 90% for reward', '#888'],
              ].map(([label, value, color], i, arr) => (
                <div key={label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  padding: '12px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(26,58,42,0.1)' : 'none',
                }}>
                  <span style={{
                    fontFamily: BODY,
                    fontSize: 10, fontWeight: 600,
                    color: 'var(--moss)',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                  }}>{label}</span>
                  <span style={{
                    fontFamily: DISPLAY,
                    fontSize: 16,
                    fontStyle: i === 3 ? 'italic' : 'normal',
                    color: color as string,
                    fontWeight: 500,
                  }}>{value}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ animation: 'fadeUpSoft 0.7s ease 0.85s both' }}>
              {passed ? (
                <PrimaryButton onClick={onBack} label="Return to Learning" arrow="↩"/>
              ) : (
                <>
                  <PrimaryButton onClick={onRetake} label="Retake Assessment" arrow="↻"/>
                  <div style={{ textAlign: 'center', marginTop: 22 }}>
                    <InlineLink onClick={onBack}>
                      <span style={{ fontFamily: DISPLAY, fontStyle: 'italic' }}>↩</span>{' '}back to learning
                    </InlineLink>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </ParchmentBackdrop>
    );
  }

  // ─── QUIZ ────────────────────────────────────────────────────────────────
  if (!q) return null;

  const progressPct = Math.round(((current + (selected !== null ? 1 : 0)) / totalQ) * 100);

  return (
    <ParchmentBackdrop decorations="grain-only">
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Top bar — minimal, doesn't disrupt focus */}
        <div style={{
          padding: 'calc(14px + var(--safe-top)) 24px 14px',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
            maxWidth: 480, margin: '0 auto 10px',
          }}>
            <button onClick={onBack}
              style={{
                fontFamily: DISPLAY,
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--moss)',
                background: 'none', border: 'none',
                padding: 0, cursor: 'pointer',
                textDecoration: 'underline',
                textDecorationStyle: 'dotted',
                textUnderlineOffset: '4px',
              }}>
              ✕ exit
            </button>
            <div style={{
              fontFamily: BODY,
              fontSize: 10, fontWeight: 600,
              color: 'var(--moss)',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
            }}>
              {toRoman(current + 1)} <span style={{ opacity: 0.4 }}>of</span> {toRoman(totalQ)}
            </div>
            <div style={{
              fontFamily: BODY,
              fontSize: 10, fontWeight: 600,
              color: 'var(--moss)',
              letterSpacing: '0.16em',
              opacity: 0.7,
            }}>
              {progressPct}%
            </div>
          </div>
          {/* Progress rule */}
          <div style={{
            maxWidth: 480, margin: '0 auto',
            background: 'rgba(26,58,42,0.12)',
            height: 1,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0,
              height: 1,
              background: 'var(--forest)',
              width: `${progressPct}%`,
              transition: 'width 0.4s ease',
            }}/>
          </div>
        </div>

        {/* Scrollable question area */}
        <div key={current} style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 24px',
          WebkitOverflowScrolling: 'touch',
        }}>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            {/* Topic tag — small caps eyebrow */}
            {q.topicTag && (
              <div style={{
                fontFamily: BODY,
                fontSize: 10, fontWeight: 600,
                color: 'var(--moss)',
                letterSpacing: '0.34em',
                textTransform: 'uppercase',
                marginBottom: 14,
                marginTop: 8,
                opacity: 0.85,
                animation: 'fadeUpSoft 0.45s ease 0s both',
              }}>
                — {q.topicTag}
              </div>
            )}

            {/* Question text — Fraunces, comfortable reading size */}
            <h2 style={{
              fontFamily: DISPLAY,
              fontSize: 'clamp(22px, 5.5vw, 28px)',
              fontWeight: 400,
              color: 'var(--forest)',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
              margin: 0, marginBottom: 28,
              animation: 'fadeUpSoft 0.5s ease 0.05s both',
            }}>
              <span style={{
                fontStyle: 'italic',
                color: 'var(--moss)',
                marginRight: 10,
              }}>
                {toRoman(current + 1)}.
              </span>
              {q.questionText}
            </h2>

            {/* Options as exam answers — lowercase letters, italic */}
            <OptionList
              options={q.options}
              correctIndex={q.correctIndex}
              selected={selected}
              onSelect={handleSelect}
            />

            {/* Feedback note */}
            {selected !== null && (
              <div style={{
                marginTop: 22,
                paddingTop: 16,
                borderTop: '1px solid rgba(26,58,42,0.1)',
                fontFamily: DISPLAY,
                fontStyle: 'italic',
                fontSize: 15,
                lineHeight: 1.5,
                color: selected === q.correctIndex ? 'var(--forest)' : 'var(--red)',
                animation: 'fadeUpSoft 0.35s ease',
              }}>
                {selected === q.correctIndex ? (
                  <>
                    <span style={{ color: 'var(--leaf)', marginRight: 6 }}>✓</span>
                    Correct.
                  </>
                ) : (
                  <>
                    <span style={{ marginRight: 6 }}>✗</span>
                    The correct response is{' '}
                    <span style={{ fontWeight: 600 }}>
                      ({'abcd'[q.correctIndex]})
                    </span>.
                  </>
                )}
              </div>
            )}

            <div style={{ height: 24 }}/>
          </div>
        </div>

        {/* Bottom CTA bar */}
        <div style={{
          flexShrink: 0,
          padding: '16px 24px calc(16px + var(--safe-bottom))',
        }}>
          <div style={{
            maxWidth: 480, margin: '0 auto',
            opacity: selected === null ? 0.35 : 1,
            transition: 'opacity 0.25s ease',
            pointerEvents: selected === null ? 'none' : 'auto',
          }}>
            <PrimaryButton
              onClick={handleNext}
              label={current + 1 < totalQ ? 'Next Question' : 'Submit Assessment'}
              arrow="→"
            />
          </div>
        </div>
      </div>
    </ParchmentBackdrop>
  );
};

// ─── Option list as an exam answer block ─────────────────────────────────────

interface OptionListProps {
  options: string[];
  correctIndex: number;
  selected: number | null;
  onSelect: (idx: number) => void;
}

const OptionList: React.FC<OptionListProps> = ({ options, correctIndex, selected, onSelect }) => {
  const letters = useMemo(() => ['a', 'b', 'c', 'd', 'e', 'f'], []);
  const revealed = selected !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {options.map((opt, idx) => {
        const isSelected = selected === idx;
        const isCorrect  = idx === correctIndex;
        const isWrong    = revealed && isSelected && !isCorrect;

        // Color logic
        let textColor   = 'var(--charcoal)';
        let letterColor = 'var(--moss)';
        let underline   = 'transparent';
        let icon: string | null = null;

        if (revealed) {
          if (isCorrect) {
            textColor   = 'var(--forest)';
            letterColor = 'var(--leaf)';
            underline   = 'var(--leaf)';
            icon        = '✓';
          } else if (isWrong) {
            textColor   = 'var(--red)';
            letterColor = 'var(--red)';
            underline   = 'var(--red)';
            icon        = '✗';
          } else {
            textColor   = 'rgba(44,44,44,0.45)';
            letterColor = 'rgba(74,124,89,0.4)';
          }
        } else if (isSelected) {
          textColor   = 'var(--forest)';
          letterColor = 'var(--forest)';
          underline   = 'var(--forest)';
        }

        return (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(idx)}
            disabled={revealed}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              padding: '16px 4px',
              background: 'transparent',
              border: 'none',
              borderTop: idx === 0 ? '1px solid rgba(26,58,42,0.12)' : 'none',
              borderBottom: '1px solid rgba(26,58,42,0.12)',
              textAlign: 'left',
              cursor: revealed ? 'default' : 'pointer',
              width: '100%',
              transition: 'all 0.2s ease',
              animation: `fadeUpSoft 0.4s ease ${0.1 + idx * 0.06}s both`,
            }}
          >
            {/* Letter prefix */}
            <span style={{
              fontFamily: DISPLAY,
              fontStyle: 'italic',
              fontSize: 19,
              color: letterColor,
              fontWeight: 500,
              minWidth: 24,
              lineHeight: 1.4,
              transition: 'color 0.2s ease',
            }}>
              {letters[idx]}.
            </span>

            {/* Option text */}
            <span style={{
              flex: 1,
              fontFamily: DISPLAY,
              fontSize: 16,
              fontWeight: 400,
              color: textColor,
              lineHeight: 1.5,
              letterSpacing: '-0.005em',
              borderBottom: `1.5px solid ${underline}`,
              paddingBottom: 2,
              transition: 'all 0.2s ease',
              textAlign: 'left',
            }}>
              {opt}
            </span>

            {/* Icon (revealed only) */}
            {icon && (
              <span style={{
                fontFamily: DISPLAY,
                fontSize: 18,
                color: isCorrect ? 'var(--leaf)' : 'var(--red)',
                fontWeight: 600,
                marginTop: -2,
                animation: 'fadeUpSoft 0.3s ease',
              }}>
                {icon}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default AssessmentScreen;
