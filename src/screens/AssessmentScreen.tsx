/**
 * AssessmentScreen
 *
 * 25-question MCQ assessment for a module.
 * Grading rules (CLAUDE.md Section 24):
 *   < 60%   → Fail   — retake allowed
 *   60–89%  → Pass
 *   ≥ 90%   → Pass + Free Internship / Academic Project reward
 *
 * On pass: updates user_progress → 'completed'
 * Always: inserts assessment_attempts row + student_topic_scores upsert
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useEnrollment } from '../hooks/useEnrollment';
import type { CourseModule, Question } from '../types';

interface Props {
  moduleData: CourseModule;
  onBack: () => void;      // back to learning
  onRetake: () => void;    // restart assessment (same module)
}

type Phase = 'loading' | 'quiz' | 'submitting' | 'result' | 'error';

interface AnswerRecord {
  question_id: number;
  selected_index: number;
  correct: boolean;
}

const AssessmentScreen: React.FC<Props> = ({ moduleData, onBack, onRetake }) => {
  const { user }       = useAuth();
  const { enrollment } = useEnrollment();

  const [phase, setPhase]         = useState<Phase>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent]     = useState(0);       // 0-based question index
  const [selected, setSelected]   = useState<number | null>(null); // option index for current Q
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
        setErrMsg('Could not load questions. Please try again.');
        setPhase('error');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: Question[] = data.map((q: any) => ({
        id:           q.id,
        orderIndex:   q.order_index,
        questionText: q.question_text,
        // options stored as jsonb — parse if string, use directly if array
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
    if (selected !== null) return; // already answered
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

    // 1. Insert assessment_attempts
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

    // 2. Upsert student_topic_scores (grouped by topic_tag)
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

    // 3. Mark module completed if passed
    if (passed && user) {
      await supabase.from('user_progress').upsert(
        { user_id: user.id, module_id: moduleData.id, status: 'completed', completed_at: new Date().toISOString() },
        { onConflict: 'user_id,module_id' }
      );
    }

    setCorrect(correctCount);
    setScorePct(pct);
    setPhase('result');
  };

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (phase === 'loading' || phase === 'submitting') {
    return (
      <div style={{ position:'fixed', inset:0, background:'var(--cream)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:50, gap:16 }}>
        <div style={{ width:36, height:36, border:'3px solid var(--sand)', borderTopColor:'var(--forest)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
        <div style={{ color:'var(--moss)', fontSize:14, fontFamily:"'DM Sans', sans-serif" }}>
          {phase === 'loading' ? 'Loading questions…' : 'Submitting assessment…'}
        </div>
      </div>
    );
  }

  // ── ERROR ─────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div style={{ position:'fixed', inset:0, background:'var(--cream)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:50, padding:32, gap:20 }}>
        <div style={{ fontSize:48 }}>⚠️</div>
        <div style={{ fontSize:16, color:'var(--charcoal)', fontFamily:"'DM Sans', sans-serif", textAlign:'center' }}>{errMsg}</div>
        <button onClick={onBack} style={{ padding:'14px 32px', background:'var(--forest)', color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, fontFamily:"'DM Sans', sans-serif", cursor:'pointer' }}>
          Back to Learning
        </button>
      </div>
    );
  }

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const passed = scorePct >= 60;
    const reward = scorePct >= 90;

    return (
      <div style={{ position:'fixed', inset:0, background:'var(--cream)', overflowY:'auto', zIndex:50 }}>
        <div style={{ maxWidth:480, margin:'0 auto', padding:'40px 24px 60px' }}>

          {/* Score circle */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ width:120, height:120, borderRadius:'50%', margin:'0 auto 20px', background: passed ? 'var(--forest)' : 'var(--red)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxShadow:`0 8px 32px ${passed ? 'rgba(26,58,42,0.3)' : 'rgba(192,57,43,0.3)'}` }}>
              <div style={{ color:'white', fontSize:30, fontWeight:900, fontFamily:"'DM Sans', sans-serif", lineHeight:1 }}>{scorePct}%</div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:11, marginTop:2 }}>{correct}/{totalQ} correct</div>
            </div>
            <div style={{ fontFamily:"'Playfair Display', serif", fontSize:26, fontWeight:900, color:'var(--forest)' }}>
              {passed ? 'Well Done! 🎉' : 'Keep Trying! 💪'}
            </div>
            <div style={{ color:'#888', fontSize:14, marginTop:6, fontFamily:"'DM Sans', sans-serif" }}>
              {passed ? 'You passed this assessment.' : 'You need 60% to pass. Review and retake.'}
            </div>
          </div>

          {/* Reward banner for 90%+ */}
          {reward && (
            <div style={{ background:'linear-gradient(135deg, var(--forest), var(--pine))', borderRadius:18, padding:'20px 22px', marginBottom:20, textAlign:'center', boxShadow:'0 4px 20px rgba(26,58,42,0.25)' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🏆</div>
              <div style={{ color:'white', fontFamily:"'Playfair Display', serif", fontSize:18, fontWeight:700, marginBottom:6 }}>
                Outstanding Achievement!
              </div>
              <div style={{ color:'rgba(255,255,255,0.85)', fontSize:13, lineHeight:1.6, fontFamily:"'DM Sans', sans-serif" }}>
                You scored <strong>90% or above</strong>. You qualify for a{' '}
                <strong>Free Internship</strong> or a{' '}
                <strong>Free Academic Project Report</strong> from AIWMR Institute.
              </div>
              <div style={{ marginTop:12, color:'var(--sage)', fontSize:12, fontFamily:"'DM Sans', sans-serif" }}>
                Contact director@aiwmr.org to claim your reward.
              </div>
            </div>
          )}

          {/* Score breakdown */}
          <div style={{ background:'white', borderRadius:16, padding:'18px 20px', marginBottom:16, border:'1px solid var(--sand)' }}>
            <div style={{ fontFamily:"'DM Sans', sans-serif", fontWeight:700, fontSize:14, color:'var(--forest)', marginBottom:12 }}>Score Breakdown</div>
            {[
              { label:'Score', value:`${scorePct}%`, color: scorePct>=90?'var(--leaf)': scorePct>=60?'var(--forest)':'var(--red)' },
              { label:'Correct Answers', value:`${correct} / ${totalQ}`, color:'var(--charcoal)' },
              { label:'Status', value: passed ? '✅ Passed' : '❌ Failed', color: passed?'var(--leaf)':'var(--red)' },
            ].map(row => (
              <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--mist)' }}>
                <span style={{ fontSize:13, color:'#888', fontFamily:"'DM Sans', sans-serif" }}>{row.label}</span>
                <span style={{ fontSize:14, fontWeight:700, color:row.color, fontFamily:"'DM Sans', sans-serif" }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {!passed && (
              <button onClick={onRetake} style={{ padding:'16px', background:'var(--forest)', color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, fontFamily:"'DM Sans', sans-serif", cursor:'pointer' }}>
                🔄 Retake Assessment
              </button>
            )}
            <button onClick={onBack} style={{ padding:'16px', background: passed ? 'var(--forest)' : 'rgba(0,0,0,0.06)', color: passed ? 'white' : 'var(--charcoal)', border:'none', borderRadius:14, fontSize:15, fontWeight:700, fontFamily:"'DM Sans', sans-serif", cursor:'pointer' }}>
              {passed ? '📚 Back to My Learning' : 'Back to Learning'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ ──────────────────────────────────────────────────────────────────
  if (!q) return null;

  const progressPct = Math.round((current / totalQ) * 100);

  return (
    <div style={{ position:'fixed', inset:0, background:'var(--cream)', display:'flex', flexDirection:'column', zIndex:50 }}>

      {/* Header */}
      <div style={{ background:'var(--forest)', padding:'14px 20px', paddingTop:`max(14px, env(safe-area-inset-top))`, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <button onClick={onBack} style={{ background:'rgba(255,255,255,0.12)', border:'none', color:'white', padding:'6px 14px', borderRadius:8, fontSize:13, fontFamily:"'DM Sans', sans-serif", cursor:'pointer' }}>
            ✕ Exit
          </button>
          <div style={{ color:'white', fontSize:13, fontWeight:700, fontFamily:"'DM Sans', sans-serif" }}>
            Question {current + 1} / {totalQ}
          </div>
          <div style={{ color:'var(--sage)', fontSize:12, fontFamily:"'DM Sans', sans-serif" }}>
            {progressPct}%
          </div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:6, height:6 }}>
          <div style={{ height:'100%', background:'var(--leaf)', borderRadius:6, width:`${progressPct}%`, transition:'width 0.3s ease' }}/>
        </div>
      </div>

      {/* Question + options */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 20px 8px' }}>

        {/* Question number + text */}
        <div style={{ background:'white', borderRadius:16, padding:'20px', marginBottom:16, border:'1px solid var(--sand)', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--moss)', letterSpacing:'0.5px', marginBottom:10, fontFamily:"'DM Sans', sans-serif", textTransform:'uppercase' }}>
            Q{current + 1} of {totalQ}
          </div>
          <div style={{ fontSize:16, fontWeight:600, color:'var(--charcoal)', lineHeight:1.6, fontFamily:"'DM Sans', sans-serif" }}>
            {q.questionText}
          </div>
        </div>

        {/* Options */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {q.options.map((opt, idx) => {
            const isSelected = selected === idx;
            const isCorrect  = idx === q.correctIndex;
            const revealed   = selected !== null;

            let bg     = 'white';
            let border = '2px solid var(--sand)';
            let color  = 'var(--charcoal)';

            if (revealed) {
              if (isCorrect) {
                bg = '#e8f5e9'; border = '2px solid var(--leaf)'; color = 'var(--forest)';
              } else if (isSelected && !isCorrect) {
                bg = '#fdecea'; border = '2px solid var(--red)'; color = 'var(--red)';
              }
            } else if (isSelected) {
              bg = 'var(--mist)'; border = '2px solid var(--forest)'; color = 'var(--forest)';
            }

            const label = ['A','B','C','D'][idx];

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                style={{ background:bg, border, borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:14, cursor: revealed ? 'default' : 'pointer', transition:'all 0.2s', textAlign:'left' }}
              >
                <div style={{ width:30, height:30, borderRadius:8, background: revealed && isCorrect ? 'var(--leaf)' : revealed && isSelected ? 'var(--red)' : 'var(--mist)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:13, fontWeight:800, color: (revealed && (isCorrect || isSelected)) ? 'white' : 'var(--moss)', fontFamily:"'DM Sans', sans-serif" }}>
                    {revealed && isCorrect ? '✓' : revealed && isSelected ? '✗' : label}
                  </span>
                </div>
                <span style={{ fontSize:14, color, fontFamily:"'DM Sans', sans-serif", lineHeight:1.4, fontWeight: revealed && isCorrect ? 600 : 400 }}>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Feedback hint after answering */}
        {selected !== null && (
          <div style={{ marginTop:14, padding:'12px 16px', borderRadius:12, background: selected === q.correctIndex ? '#e8f5e9' : '#fdecea', border:`1px solid ${selected === q.correctIndex ? 'var(--leaf)' : 'var(--red)'}`, animation:'fadeUp 0.2s ease' }}>
            <div style={{ fontSize:13, fontWeight:700, color: selected === q.correctIndex ? 'var(--forest)' : 'var(--red)', fontFamily:"'DM Sans', sans-serif" }}>
              {selected === q.correctIndex ? '✅ Correct!' : `❌ Incorrect — correct answer: ${['A','B','C','D'][q.correctIndex]}`}
            </div>
          </div>
        )}

        <div style={{ height:20 }}/>
      </div>

      {/* Next / Submit button */}
      <div style={{ flexShrink:0, padding:'14px 20px', paddingBottom:`max(14px, env(safe-area-inset-bottom))`, background:'var(--cream)', borderTop:'1px solid var(--sand)' }}>
        <button
          onClick={handleNext}
          disabled={selected === null}
          style={{ width:'100%', padding:'16px', background: selected === null ? 'var(--sand)' : 'var(--forest)', color: selected === null ? '#bbb' : 'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, fontFamily:"'DM Sans', sans-serif", cursor: selected === null ? 'default' : 'pointer', transition:'all 0.2s' }}
        >
          {current + 1 < totalQ ? 'Next Question →' : '🎯 Submit Assessment'}
        </button>
      </div>
    </div>
  );
};

export default AssessmentScreen;
