import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Card, Spinner } from '../components/UI';
import Icon from '../components/Icon';

interface Props { onBack: () => void; }

interface RewardRow {
  attemptId:    string;
  scorePct:     number;
  attemptedAt:  string;
  studentName:  string;
  studentEmail: string;
  studentPhone: string;
  moduleTitle:  string;
  courseTitle:  string;
  courseIcon:   string;
  courseColor:  string;
}

type FilterTab = 'all' | 'week' | 'month';

const AdminRewardsScreen: React.FC<Props> = ({ onBack }) => {
  const [rows, setRows]         = useState<RewardRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<FilterTab>('all');
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('assessment_attempts')
      .select(`
        id, score_pct, attempted_at,
        profiles(name, email, phone),
        modules(title, courses(title, icon, color))
      `)
      .eq('reward_earned', true)
      .order('attempted_at', { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setRows((data ?? []).map((r: any) => ({
      attemptId:    r.id,
      scorePct:     Math.round(r.score_pct),
      attemptedAt:  r.attempted_at,
      studentName:  r.profiles?.name  ?? '—',
      studentEmail: r.profiles?.email ?? '',
      studentPhone: r.profiles?.phone ?? '',
      moduleTitle:  r.modules?.title  ?? '—',
      courseTitle:  r.modules?.courses?.title ?? '—',
      courseIcon:   r.modules?.courses?.icon  ?? '📚',
      courseColor:  r.modules?.courses?.color ?? '#2d5a3d',
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = Date.now();
  const WEEK_MS  = 7  * 24 * 60 * 60 * 1000;
  const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

  const filtered = rows.filter(r => {
    const age = now - new Date(r.attemptedAt).getTime();
    if (filter === 'week'  && age > WEEK_MS)  return false;
    if (filter === 'month' && age > MONTH_MS) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.studentName.toLowerCase().includes(q) &&
          !r.studentEmail.toLowerCase().includes(q) &&
          !r.courseTitle.toLowerCase().includes(q) &&
          !r.moduleTitle.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' });
  };

  return (
    <div className="screen">
      {/* Sticky header */}
      <div style={{ background:'var(--forest)', padding:'20px 20px 16px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <button onClick={onBack}
            style={{ background:'rgba(255,255,255,0.12)', border:'none', borderRadius:10, padding:'8px', cursor:'pointer', display:'flex' }}>
            <Icon name="back" size={18} color="white"/>
          </button>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:20, fontWeight:900, lineHeight:1.2 }}>🏆 Rewards</div>
            <div style={{ color:'var(--sage)', fontSize:12, marginTop:1 }}>
              {rows.length} student{rows.length === 1 ? '' : 's'} earned 90%+
            </div>
          </div>
          <button onClick={load}
            style={{ background:'rgba(255,255,255,0.12)', border:'none', borderRadius:10, padding:'8px', cursor:'pointer', display:'flex' }}>
            <Icon name="arrow" size={16} color="var(--sage)"/>
          </button>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search student, course, or module…"
          style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'none', background:'rgba(255,255,255,0.12)', color:'white', fontSize:13, fontFamily:"'DM Sans', sans-serif", outline:'none', boxSizing:'border-box' }}
        />
      </div>

      <div style={{ padding:'12px 16px' }}>
        {/* Filter chips */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {([
            ['all',   'All Time',    rows.length],
            ['month', 'This Month',  rows.filter(r => now - new Date(r.attemptedAt).getTime() <= MONTH_MS).length],
            ['week',  'This Week',   rows.filter(r => now - new Date(r.attemptedAt).getTime() <= WEEK_MS).length],
          ] as [FilterTab, string, number][]).map(([f, label, count]) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ flex:1, padding:'9px 4px', borderRadius:10, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:"'DM Sans', sans-serif",
                background: filter === f ? 'var(--forest)' : 'var(--sand)',
                color: filter === f ? 'white' : 'var(--charcoal)' }}>
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Banner */}
        {rows.length > 0 && (
          <Card style={{ padding:'12px 14px', marginBottom:14, background:'rgba(106,173,120,0.08)', border:'1px solid rgba(106,173,120,0.25)' }}>
            <div style={{ fontSize:13, color:'var(--forest)', fontWeight:700, marginBottom:2 }}>
              🎯 Action: Contact these students
            </div>
            <div style={{ fontSize:11, color:'#666', lineHeight:1.5 }}>
              Each student here earned a Free Internship or Project Report reward. Reach out to confirm their preference.
            </div>
          </Card>
        )}

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
            <Spinner size={32} color="var(--forest)"/>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#aaa', fontSize:14 }}>
            {search ? 'No rewards match your search.' : 'No reward winners yet — students who score 90%+ will appear here.'}
          </div>
        ) : filtered.map((r, i) => {
          const isOpen = expanded === r.attemptId;
          return (
            <Card key={r.attemptId}
              onClick={() => setExpanded(isOpen ? null : r.attemptId)}
              style={{ padding:'14px 16px', marginBottom:10, cursor:'pointer',
                animation:`fadeUp 0.3s ease ${i * 0.04}s both`,
                border: isOpen ? '2px solid var(--leaf)' : '1px solid transparent' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                {/* Score badge */}
                <div style={{ width:48, height:48, borderRadius:14, background:'var(--leaf)', color:'white', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:"'DM Sans', sans-serif" }}>
                  <div style={{ fontSize:14, fontWeight:900, lineHeight:1 }}>{r.scorePct}%</div>
                  <div style={{ fontSize:9, marginTop:2 }}>🏆</div>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'var(--charcoal)', lineHeight:1.2 }}>{r.studentName}</div>
                  <div style={{ fontSize:11, color:'#888', marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.studentEmail}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:6 }}>
                    <span style={{ fontSize:13 }}>{r.courseIcon}</span>
                    <span style={{ fontSize:11, color:'var(--charcoal)', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.moduleTitle}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#bbb', marginTop:3 }}>
                    {r.courseTitle} · earned {formatDate(r.attemptedAt)}
                  </div>
                </div>
              </div>

              {/* Expanded — contact actions */}
              {isOpen && (
                <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--sand)', display:'flex', gap:8, animation:'fadeUp 0.2s ease' }}>
                  {r.studentEmail && (
                    <a href={`mailto:${r.studentEmail}?subject=${encodeURIComponent(`🏆 Your reward from AIWMR — ${r.moduleTitle}`)}&body=${encodeURIComponent(`Dear ${r.studentName},\n\nCongratulations on scoring ${r.scorePct}% in "${r.moduleTitle}"!\n\nYou've earned a free Internship or Project Report. Please reply to confirm which one you'd like to claim.\n\nBest regards,\nDr. Sushanth Gade\nAIWMR Training Academy`)}`}
                      onClick={e => e.stopPropagation()}
                      style={{ flex:1, padding:'10px', background:'var(--forest)', color:'white', borderRadius:10, fontSize:12, fontWeight:700, fontFamily:"'DM Sans', sans-serif", textAlign:'center', textDecoration:'none', display:'block' }}>
                      ✉️ Email
                    </a>
                  )}
                  {r.studentPhone && (
                    <a href={`tel:${r.studentPhone.replace(/\s/g, '')}`}
                      onClick={e => e.stopPropagation()}
                      style={{ flex:1, padding:'10px', background:'var(--moss)', color:'white', borderRadius:10, fontSize:12, fontWeight:700, fontFamily:"'DM Sans', sans-serif", textAlign:'center', textDecoration:'none', display:'block' }}>
                      📞 Call
                    </a>
                  )}
                  {r.studentPhone && (
                    <a href={`https://wa.me/${r.studentPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${r.studentName.split(' ')[0]}, congrats on your 90%+ score! Please confirm your reward preference.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ flex:1, padding:'10px', background:'#25D366', color:'white', borderRadius:10, fontSize:12, fontWeight:700, fontFamily:"'DM Sans', sans-serif", textAlign:'center', textDecoration:'none', display:'block' }}>
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminRewardsScreen;
