import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/UI';
import EnrollmentGate from '../components/EnrollmentGate';
import Icon from '../components/Icon';
import { useEnrollment } from '../hooks/useEnrollment';
import { useAuth } from '../context/AuthContext';
import type { CourseModule } from '../types';

interface Props { onNavigate: (screen: string, data?: unknown) => void; }

interface AttemptSummary {
  scorePct: number;
  passed: boolean;
  reward: boolean;
  attemptedAt: string;
}

const LearningScreen: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { loading: enrollLoading, enrollment } = useEnrollment();
  const [modules, setModules]           = useState<CourseModule[]>([]);
  const [scores, setScores]             = useState<Record<number, AttemptSummary>>({});
  const [dataLoading, setDataLoading]   = useState(true);
  const [activeId, setActiveId]         = useState<number | null>(null);
  const [attendanceCount, setAttendanceCount] = useState(0);

  useEffect(() => {
    if (!enrollment) return;

    const fetchData = async () => {
      const [modsRes, progressRes, attendRes, attemptsRes] = await Promise.all([
        supabase.from('modules')
          .select('*')
          .eq('course_id', enrollment.courseId)
          .order('order_index'),
        supabase.from('user_progress')
          .select('module_id, status')
          .eq('user_id', user!.id),
        supabase.from('attendance')
          .select('id', { count: 'exact' })
          .eq('registration_id', enrollment.registrationId),
        // Latest attempt per module for this user
        supabase.from('assessment_attempts')
          .select('module_id, score_pct, passed, reward_earned, attempted_at')
          .eq('user_id', user!.id)
          .order('attempted_at', { ascending: false }),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const progressMap: Record<number, string> = {};
      (progressRes.data ?? []).forEach((p: any) => { progressMap[p.module_id] = p.status; });

      // Keep only the most recent attempt per module
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scoreMap: Record<number, AttemptSummary> = {};
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
          slideCount:   m.slide_count    ?? undefined,
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

  const statusBg = (s: CourseModule['status']) =>
    s === 'completed' ? 'var(--leaf)' : s === 'in-progress' ? 'var(--amber)' : 'var(--sand)';

  const scoreColor = (pct: number) =>
    pct >= 90 ? 'var(--leaf)' : pct >= 60 ? 'var(--forest)' : 'var(--red)';

  return (
    <EnrollmentGate
      loading={enrollLoading}
      enrolled={!!enrollment}
      icon="📚"
      title="My Learning"
      message="You need to enroll in a course and complete payment to access learning modules."
      onBrowse={() => onNavigate('courses')}
    >
      <div className="screen">
        {/* Sticky header */}
        <div style={{ background:'var(--forest)', padding:'20px 20px 24px', position:'sticky', top:0, zIndex:10 }}>
          <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:24, fontWeight:900 }}>My Learning</div>
          <div style={{ color:'var(--sage)', fontSize:13, marginTop:2 }}>{enrollment?.courseTitle}</div>
          {!dataLoading && (
            <div style={{ marginTop:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ color:'var(--sage)', fontSize:12 }}>Module {completed} of {total} · {progress}% complete</span>
                <span style={{ color:'var(--leaf)', fontSize:12, fontWeight:700 }}>{progress}%</span>
              </div>
              <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:10, height:8 }}>
                <div style={{ width:`${progress}%`, height:'100%', background:'var(--leaf)', borderRadius:10, transition:'width 0.5s ease' }}/>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding:'16px' }}>
          {/* Mini stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
            {[
              [`${completed}/${total}`, 'Modules'],
              [String(attendanceCount), 'Sessions'],
              [enrollment?.batchTime ? enrollment.batchTime.split('–')[0].trim() : '—', 'Next Live'],
            ].map(([v, l]) => (
              <Card key={l} style={{ padding:'12px 10px', textAlign:'center' }}>
                <div style={{ fontWeight:700, fontSize:15, color:'var(--forest)', lineHeight:1.2 }}>{v}</div>
                <div style={{ fontSize:11, color:'#999', marginTop:3 }}>{l}</div>
              </Card>
            ))}
          </div>

          <div style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:700, marginBottom:14 }}>Course Modules</div>

          {dataLoading ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'#aaa' }}>Loading modules...</div>
          ) : modules.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'#aaa' }}>No modules available yet.</div>
          ) : modules.map((m, i) => {
            const attempt = scores[m.id];
            return (
              <div key={m.id}
                onClick={() => !m.locked && setActiveId(p => p === m.id ? null : m.id)}
                style={{ background: m.locked ? 'rgba(255,255,255,0.6)' : 'var(--white)', borderRadius:16, marginBottom:10, padding:'16px', cursor:m.locked ? 'not-allowed' : 'pointer', opacity:m.locked ? 0.65 : 1, boxShadow:activeId === m.id ? '0 4px 20px rgba(26,58,42,0.15)' : '0 2px 8px rgba(0,0,0,0.05)', border:activeId === m.id ? '2px solid var(--leaf)' : '2px solid transparent', transition:'all 0.25s', animation:`fadeUp 0.35s ease ${i * 0.06}s both` }}>

                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  {/* Status icon */}
                  <div style={{ width:44, height:44, borderRadius:12, background:statusBg(m.status), display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {m.status === 'completed'   && <Icon name="check" size={18} color="white"/>}
                    {m.status === 'in-progress' && <Icon name={m.type === 'video' ? 'video' : m.type === 'slideshow' ? 'play' : 'file'} size={18} color="white"/>}
                    {m.status === 'locked'      && <Icon name="lock" size={16} color="#bbb"/>}
                  </div>

                  {/* Title + meta */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:14, color:m.locked ? '#aaa' : 'var(--charcoal)', lineHeight:1.3 }}>{m.title}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4, alignItems:'center' }}>
                      <span style={{ fontSize:12, color:'#bbb' }}>
                        {m.type === 'video' ? '📹 Video' : m.type === 'slideshow' ? '🖼️ Slideshow' : '📄 PDF'}
                      </span>
                      <span style={{ fontSize:12, color:'#bbb', display:'flex', alignItems:'center', gap:2 }}>
                        <Icon name="clock" size={11} color="#ccc"/> {m.duration}
                      </span>
                      {/* Score badge — shown whenever there's a past attempt */}
                      {attempt && (
                        <span style={{ fontSize:11, fontWeight:700, color: scoreColor(attempt.scorePct), background: attempt.scorePct >= 60 ? 'rgba(106,173,120,0.12)' : 'rgba(192,57,43,0.08)', borderRadius:6, padding:'2px 7px', border:`1px solid ${attempt.scorePct >= 60 ? 'rgba(106,173,120,0.3)' : 'rgba(192,57,43,0.2)'}` }}>
                          {attempt.scorePct}% {attempt.passed ? '✓' : '✗'}
                          {attempt.reward ? ' 🏆' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {!m.locked && <Icon name={activeId === m.id ? 'close' : 'play'} size={28} color={m.status === 'in-progress' ? 'var(--amber)' : 'var(--sage)'}/>}
                </div>

                {/* Expanded panel */}
                {activeId === m.id && (
                  <div style={{ marginTop:14, padding:14, background:'var(--mist)', borderRadius:12, animation:'fadeUp 0.2s ease' }}>

                    {/* Last score card — only shown when attempt exists */}
                    {attempt && (
                      <div style={{ background:'white', borderRadius:10, padding:'12px 14px', marginBottom:12, border:`1px solid ${attempt.passed ? 'rgba(106,173,120,0.3)' : 'rgba(192,57,43,0.2)'}` }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div>
                            <div style={{ fontSize:11, color:'#999', fontFamily:"'DM Sans', sans-serif", marginBottom:2 }}>Last Assessment Score</div>
                            <div style={{ fontSize:22, fontWeight:900, color:scoreColor(attempt.scorePct), fontFamily:"'DM Sans', sans-serif", lineHeight:1 }}>
                              {attempt.scorePct}%
                              <span style={{ fontSize:13, fontWeight:400, color:'#999', marginLeft:6 }}>
                                {attempt.passed ? '— Passed ✅' : '— Failed ❌'}
                              </span>
                            </div>
                            {attempt.reward && (
                              <div style={{ fontSize:12, color:'var(--forest)', fontWeight:600, marginTop:4 }}>
                                🏆 Free Internship / Project Report earned!
                              </div>
                            )}
                          </div>
                          {/* Circular score ring */}
                          <div style={{ width:52, height:52, borderRadius:'50%', background: attempt.passed ? 'var(--forest)' : 'var(--red)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <span style={{ color:'white', fontSize:14, fontWeight:900, fontFamily:"'DM Sans', sans-serif" }}>{attempt.scorePct}%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize:13, color:'#555', lineHeight:1.7, marginBottom:12 }}>
                      {m.description ?? 'This module covers core concepts with real-world case studies and practical examples.'}
                    </div>

                    <div style={{ display:'flex', gap:8 }}>
                      <button
                        onClick={e => { e.stopPropagation(); onNavigate('moduleViewer', m as unknown); }}
                        style={{ flex:1, padding:'10px', background:'var(--forest)', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}
                      >
                        {m.type === 'slideshow' ? '🖼️ Open Slideshow' : m.videoUrl || m.pdfUrl ? '▶ Open Module' : '▶ Start Module'}
                      </button>
                      {/* Retake shortcut for failed attempts */}
                      {attempt && !attempt.passed && (
                        <button
                          onClick={e => { e.stopPropagation(); onNavigate('assessment', m as unknown); }}
                          style={{ padding:'10px 14px', background:'rgba(192,57,43,0.1)', color:'var(--red)', border:'1px solid rgba(192,57,43,0.3)', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif", whiteSpace:'nowrap' }}
                        >
                          🔄 Retake
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </EnrollmentGate>
  );
};
export default LearningScreen;
