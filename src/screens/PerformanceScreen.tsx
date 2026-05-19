import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Card, Spinner } from '../components/UI';
import Icon from '../components/Icon';
import EnrollmentGate from '../components/EnrollmentGate';
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
      supabase.from('modules')
        .select('id, title, order_index')
        .eq('course_id', enrollment.courseId)
        .order('order_index'),
      supabase.from('user_progress')
        .select('module_id, status')
        .eq('user_id', user.id),
      supabase.from('assessment_attempts')
        .select('module_id, score_pct, passed, reward_earned, attempted_at')
        .eq('user_id', user.id)
        .order('attempted_at', { ascending: false }),
      supabase.from('student_topic_scores')
        .select('topic_tag, score_pct')
        .eq('user_id', user.id),
      supabase.from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('registration_id', enrollment.registrationId),
      supabase.from('session_qr_codes')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', enrollment.courseId)
        .lte('session_date', today),
      supabase.from('certificates')
        .select('cert_id, issued_at')
        .eq('registration_id', enrollment.registrationId)
        .maybeSingle(),
    ]);

    // Map module_id → status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const progressMap: Record<number, string> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (progressRes.data ?? []).forEach((p: any) => { progressMap[p.module_id] = p.status; });

    // Latest attempt + attempt counts per module
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

    // Group topic scores by tag (average if multiple)
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

  // Derived metrics
  const completedModules    = modules.filter(m => m.status === 'completed').length;
  const totalModules        = modules.length;
  const modulesAttempted    = modules.filter(m => m.attemptCount > 0);
  const avgScore            = modulesAttempted.length > 0
    ? Math.round(modulesAttempted.reduce((s, m) => s + m.scorePct, 0) / modulesAttempted.length)
    : null;
  const rewardsCount        = modules.filter(m => m.reward).length;
  const attendancePct       = scheduledCount > 0 ? Math.round((attendanceCount / scheduledCount) * 100) : null;
  const progressPct         = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  const scoreColor = (pct: number) => pct >= 90 ? 'var(--leaf)' : pct >= 60 ? 'var(--forest)' : 'var(--red)';
  const topicColor = (pct: number) => pct >= 80 ? 'var(--leaf)' : pct >= 60 ? 'var(--amber)' : 'var(--red)';

  return (
    <EnrollmentGate
      loading={enrollLoading}
      enrolled={!!enrollment}
      icon="📊"
      title="My Performance"
      message="Enroll in a course to track your performance and rewards."
      onBrowse={() => onNavigate('courses')}
    >
      <div className="screen">
        {/* Sticky header */}
        <div style={{ background:'var(--forest)', padding:'20px 20px 24px', position:'sticky', top:0, zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => onNavigate('home')}
              style={{ background:'rgba(255,255,255,0.12)', border:'none', borderRadius:10, padding:'8px', cursor:'pointer', display:'flex' }}>
              <Icon name="back" size={18} color="white"/>
            </button>
            <div>
              <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:20, fontWeight:900 }}>My Performance</div>
              <div style={{ color:'var(--sage)', fontSize:12, marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:260 }}>{enrollment?.courseTitle}</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
            <Spinner size={32} color="var(--forest)"/>
          </div>
        ) : (
          <div style={{ padding:'16px' }}>
            {/* Hero — overall score ring */}
            <Card style={{ padding:24, textAlign:'center', marginBottom:14, animation:'fadeUp 0.3s ease' }}>
              <div style={{ fontSize:11, color:'#999', fontWeight:700, letterSpacing:0.8, marginBottom:8 }}>OVERALL SCORE</div>
              <div style={{ position:'relative', display:'inline-block', marginBottom:6 }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="60" fill="none" stroke="var(--sand)" strokeWidth="12"/>
                  {avgScore !== null && (
                    <circle cx="70" cy="70" r="60" fill="none"
                      stroke={scoreColor(avgScore)} strokeWidth="12"
                      strokeDasharray={`${(avgScore / 100) * 377} 377`}
                      strokeLinecap="round"
                      transform="rotate(-90 70 70)"
                      style={{ transition:'stroke-dasharray 0.8s ease' }}/>
                  )}
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ fontSize:38, fontWeight:900, color: avgScore !== null ? scoreColor(avgScore) : '#bbb', lineHeight:1, fontFamily:"'DM Sans', sans-serif" }}>
                    {avgScore !== null ? `${avgScore}%` : '—'}
                  </div>
                  <div style={{ fontSize:11, color:'#999', marginTop:4 }}>
                    {modulesAttempted.length > 0 ? `${modulesAttempted.length} module${modulesAttempted.length === 1 ? '' : 's'}` : 'No attempts yet'}
                  </div>
                </div>
              </div>
              {avgScore === null && (
                <div style={{ fontSize:13, color:'#888', maxWidth:260, margin:'8px auto 0' }}>
                  Complete a module assessment to see your score.
                </div>
              )}
              {avgScore !== null && avgScore >= 90 && (
                <div style={{ fontSize:13, color:'var(--leaf)', fontWeight:700, marginTop:6 }}>
                  🏆 Outstanding! You're earning special rewards.
                </div>
              )}
              {avgScore !== null && avgScore < 60 && (
                <div style={{ fontSize:13, color:'var(--red)', fontWeight:600, marginTop:6 }}>
                  Focus on the weak topics below to improve.
                </div>
              )}
            </Card>

            {/* Stats grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              {[
                ['📚', `${completedModules}/${totalModules}`, 'Modules Completed', `${progressPct}%`],
                ['📅', attendancePct !== null ? `${attendancePct}%` : '—', 'Attendance', scheduledCount > 0 ? `${attendanceCount}/${scheduledCount} sessions` : 'No sessions yet'],
                ['📝', String(modulesAttempted.length), 'Assessments Taken', avgScore !== null ? `Avg ${avgScore}%` : 'None yet'],
                ['🏆', String(rewardsCount), 'Rewards Earned', rewardsCount > 0 ? 'Internship / Project!' : '90%+ unlocks reward'],
              ].map(([ic, val, label, sub], i) => (
                <Card key={i} style={{ padding:14, textAlign:'center' }}>
                  <div style={{ fontSize:22, marginBottom:4 }}>{ic}</div>
                  <div style={{ fontSize:20, fontWeight:900, color:'var(--forest)', lineHeight:1.1 }}>{val}</div>
                  <div style={{ fontSize:11, color:'#999', marginTop:3 }}>{label}</div>
                  <div style={{ fontSize:10, color:'#aaa', marginTop:1 }}>{sub}</div>
                </Card>
              ))}
            </div>

            {/* Module scores */}
            <div style={{ fontFamily:"'Playfair Display', serif", fontSize:18, fontWeight:700, margin:'18px 0 10px' }}>Module Scores</div>
            {modules.length === 0 ? (
              <Card style={{ padding:20, textAlign:'center', color:'#aaa', fontSize:13 }}>No modules yet.</Card>
            ) : modules.map((m, i) => (
              <Card key={m.moduleId} style={{ padding:14, marginBottom:8, animation:`fadeUp 0.3s ease ${i * 0.04}s both` }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{
                    width:46, height:46, borderRadius:12,
                    background: m.attemptCount > 0 ? (m.passed ? 'var(--leaf)' : 'var(--red)') : 'var(--sand)',
                    color: m.attemptCount > 0 ? 'white' : '#aaa',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:13, fontWeight:900, flexShrink:0,
                    fontFamily:"'DM Sans', sans-serif",
                  }}>
                    {m.attemptCount > 0 ? `${m.scorePct}%` : '—'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:'var(--charcoal)', lineHeight:1.3 }}>{m.title}</div>
                    <div style={{ fontSize:11, color:'#999', marginTop:3, display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                      {m.attemptCount === 0
                        ? <span>Not attempted</span>
                        : <>
                            <span>{m.attemptCount} attempt{m.attemptCount === 1 ? '' : 's'}</span>
                            <span style={{ color:'#ddd' }}>·</span>
                            <span style={{ color: m.passed ? 'var(--leaf)' : 'var(--red)', fontWeight:700 }}>
                              {m.passed ? 'Passed ✓' : 'Failed'}
                            </span>
                            {m.reward && <span>· 🏆</span>}
                          </>
                      }
                    </div>
                  </div>
                  {m.attemptCount > 0 && !m.passed && (
                    <button onClick={() => onNavigate('learning')}
                      style={{ padding:'6px 12px', background:'rgba(192,57,43,0.1)', color:'var(--red)', border:'1px solid rgba(192,57,43,0.3)', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif", whiteSpace:'nowrap' }}>
                      🔄 Retake
                    </button>
                  )}
                </div>
              </Card>
            ))}

            {/* Topic mastery */}
            {topics.length > 0 && (
              <>
                <div style={{ fontFamily:"'Playfair Display', serif", fontSize:18, fontWeight:700, margin:'18px 0 10px' }}>Topic Mastery</div>
                <Card style={{ padding:16 }}>
                  <div style={{ fontSize:11, color:'#999', marginBottom:12, lineHeight:1.5 }}>
                    Based on your assessment answers.{' '}
                    <span style={{ color:'var(--leaf)', fontWeight:700 }}>Green</span> = strong (80%+),{' '}
                    <span style={{ color:'var(--amber)', fontWeight:700 }}>amber</span> = moderate,{' '}
                    <span style={{ color:'var(--red)', fontWeight:700 }}>red</span> = needs review.
                  </div>
                  {topics.map((t, i) => (
                    <div key={t.topic} style={{ marginBottom: i === topics.length - 1 ? 0 : 12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:12, color:'var(--charcoal)', fontWeight:600 }}>{t.topic}</span>
                        <span style={{ fontSize:12, fontWeight:700, color: topicColor(t.scorePct) }}>{t.scorePct}%</span>
                      </div>
                      <div style={{ background:'var(--sand)', borderRadius:6, height:8, overflow:'hidden' }}>
                        <div style={{ width:`${t.scorePct}%`, background: topicColor(t.scorePct), height:'100%', borderRadius:6, transition:'width 0.6s ease' }}/>
                      </div>
                    </div>
                  ))}
                </Card>
              </>
            )}

            {/* Certificate */}
            <div style={{ fontFamily:"'Playfair Display', serif", fontSize:18, fontWeight:700, margin:'18px 0 10px' }}>Certificate</div>
            <Card style={{ padding:16 }}>
              {cert ? (
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ fontSize:40 }}>🏆</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:'var(--forest)' }}>Certificate Issued</div>
                    <div style={{ fontSize:11, color:'#999', marginTop:2, fontFamily:'monospace' }}>{cert.id}</div>
                    <div style={{ fontSize:11, color:'#aaa', marginTop:1 }}>
                      Issued {new Date(cert.issuedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    </div>
                  </div>
                  <button onClick={() => onNavigate('certificates')}
                    style={{ padding:'8px 14px', background:'var(--forest)', color:'white', border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif", whiteSpace:'nowrap' }}>
                    View
                  </button>
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'8px 0' }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>🎯</div>
                  <div style={{ fontWeight:700, fontSize:14, color:'var(--charcoal)', marginBottom:4 }}>
                    {progressPct < 100
                      ? `${totalModules - completedModules} more module${(totalModules - completedModules) === 1 ? '' : 's'} to complete`
                      : 'Course complete — certificate pending issuance'}
                  </div>
                  <div style={{ fontSize:12, color:'#999', maxWidth:280, margin:'0 auto', lineHeight:1.5 }}>
                    Complete every module and pass its assessment to earn your certificate.
                  </div>
                  <div style={{ background:'var(--sand)', borderRadius:6, height:8, marginTop:14, overflow:'hidden' }}>
                    <div style={{ width:`${progressPct}%`, background:'var(--leaf)', height:'100%', borderRadius:6, transition:'width 0.6s ease' }}/>
                  </div>
                  <div style={{ fontSize:11, color:'#999', marginTop:6 }}>{progressPct}% complete</div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </EnrollmentGate>
  );
};

export default PerformanceScreen;
