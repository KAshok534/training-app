import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Badge, ProgressBar, Card, Spinner } from '../components/UI';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import type { Course } from '../types';

interface Props { onNavigate:(screen:string, data?:unknown)=>void; }

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning 🌅';
  if (h < 17) return 'Good Afternoon ☀️';
  if (h < 21) return 'Good Evening 🌇';
  return 'Good Night 🌙';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCourse(row: any): Course {
  return {
    id: row.id, title: row.title, subtitle: row.subtitle,
    duration: row.duration, fee: row.fee_inr, feeUsd: row.fee_usd,
    hours: row.hours, seats: row.seats, filled: row.filled,
    mode: row.mode, startDate: row.start_date, badge: row.badge,
    modules: row.module_count, trainer: row.trainer, category: row.category,
    color: row.color, icon: row.icon, topics: row.topics ?? [],
  };
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

interface AdminStats {
  totalStudents: number;
  paidEnrollments: number;
  totalRevenue: number;
  recentRegistrations: { name: string; course: string; status: string; date: string }[];
}

const AdminHome: React.FC<{ onNavigate:(s:string)=>void; signOut:()=>void }> = ({ onNavigate, signOut }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [studentsRes, regsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'trainee'),
        supabase.from('registrations')
          .select('payment_status, created_at, profiles(name), courses(title, fee_inr)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const regs: any[] = regsRes.data ?? [];
      const paid = regs.filter(r => r.payment_status === 'paid');
      const revenue = paid.reduce((sum, r) => sum + (r.courses?.fee_inr ?? 0), 0);

      setStats({
        totalStudents:        studentsRes.count ?? 0,
        paidEnrollments:      paid.length,
        totalRevenue:         revenue,
        recentRegistrations:  regs.map(r => ({
          name:   r.profiles?.name ?? '—',
          course: r.courses?.title  ?? '—',
          status: r.payment_status,
          date:   new Date(r.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' }),
        })),
      });
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ background:'var(--forest)', padding:'24px 20px 72px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-50, right:-50, width:200, height:200, borderRadius:'50%', background:'rgba(106,173,120,0.08)' }}/>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative' }}>
          <div>
            <div style={{ color:'var(--sage)', fontSize:13 }}>{getGreeting()}</div>
            <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:22, fontWeight:700, marginTop:4 }}>Admin Dashboard</div>
            <div style={{ color:'var(--sage)', fontSize:12, marginTop:2 }}>AIWMR Training Academy</div>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <button onClick={signOut} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:10, padding:'7px 10px', cursor:'pointer' }}>
              <Icon name="logout" size={18} color="var(--sage)"/>
            </button>
          </div>
        </div>
      </div>

      <div style={{ margin:'-52px 16px 0', position:'relative', zIndex:2 }}>
        {loading ? (
          <Card style={{ padding:40, display:'flex', justifyContent:'center' }}>
            <Spinner size={28} color="var(--forest)"/>
          </Card>
        ) : (
          <>
            {/* Stats grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16, animation:'fadeUp 0.4s ease' }}>
              {[
                ['👩‍🎓', 'Total Students',    String(stats?.totalStudents ?? 0),    'var(--pine)'],
                ['✅',   'Paid Enrollments', String(stats?.paidEnrollments ?? 0),  'var(--leaf)'],
                ['💰',   'Total Revenue',    `₹${(stats?.totalRevenue ?? 0).toLocaleString()}`, 'var(--earth)'],
                ['📚',   'Active Courses',   '15',                                  'var(--moss)'],
              ].map(([ic, label, val, color]) => (
                <Card key={label} style={{ padding:16, textAlign:'center', boxShadow:'0 4px 16px rgba(26,58,42,0.1)' }}>
                  <div style={{ fontSize:26, marginBottom:6 }}>{ic}</div>
                  <div style={{ fontWeight:700, fontSize:20, color }}>{val}</div>
                  <div style={{ fontSize:11, color:'#999', marginTop:2 }}>{label}</div>
                </Card>
              ))}
            </div>

            {/* Recent registrations */}
            <Card style={{ padding:18, marginBottom:16, animation:'fadeUp 0.4s ease 0.06s both' }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Recent Registrations</div>
              {(stats?.recentRegistrations.length ?? 0) === 0 ? (
                <div style={{ fontSize:13, color:'#aaa', textAlign:'center', padding:'12px 0' }}>No registrations yet</div>
              ) : stats?.recentRegistrations.map((r, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:12, marginBottom:12, borderBottom: i < (stats.recentRegistrations.length-1) ? '1px solid var(--sand)' : 'none' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'var(--forest)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:13, fontWeight:700, flexShrink:0 }}>
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{r.name}</div>
                    <div style={{ fontSize:11, color:'#aaa', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.course}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color: r.status === 'paid' ? 'var(--leaf)' : 'var(--amber)', textTransform:'capitalize' }}>{r.status}</div>
                    <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>{r.date}</div>
                  </div>
                </div>
              ))}
            </Card>

            {/* Quick actions */}
            <Card style={{ padding:18, animation:'fadeUp 0.4s ease 0.1s both' }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Quick Actions</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  ['📋', 'All Courses',    'courses'],
                  ['🔐', 'Session QR',    'adminSession'],
                  ['👥', 'Attendance',    'attendance'],
                  ['🏆', 'Certificates',  'certificates'],
                ].map(([ic, label, screen]) => (
                  <button key={label} onClick={() => onNavigate(screen)}
                    style={{ padding:'14px 10px', background:'var(--mist)', border:'1px solid var(--sand)', borderRadius:12, cursor:'pointer', fontSize:13, fontWeight:600, color:'var(--charcoal)', fontFamily:"'DM Sans', sans-serif", display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:22 }}>{ic}</span>{label}
                  </button>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Student Not Enrolled ─────────────────────────────────────────────────────

const NotEnrolledHome: React.FC<{ name: string; courses: Course[]; onNavigate:(s:string,d?:unknown)=>void; signOut:()=>void }> = ({ name, courses, onNavigate, signOut }) => (
  <div className="screen">
    <div style={{ background:'var(--forest)', padding:'24px 20px 72px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-50, right:-50, width:200, height:200, borderRadius:'50%', background:'rgba(106,173,120,0.08)' }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative' }}>
        <div>
          <div style={{ color:'var(--sage)', fontSize:13 }}>{getGreeting()}</div>
          <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:22, fontWeight:700, marginTop:4 }}>{name}</div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ position:'relative', cursor:'pointer' }}>
            <Icon name="bell" size={22} color="var(--sage)"/>
          </div>
          <button onClick={signOut} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:10, padding:'7px 10px', cursor:'pointer' }}>
            <Icon name="logout" size={18} color="var(--sage)"/>
          </button>
        </div>
      </div>
    </div>

    <div style={{ margin:'-52px 16px 0', position:'relative', zIndex:2, animation:'fadeUp 0.4s ease' }}>
      {/* Not enrolled card */}
      <Card style={{ padding:24, textAlign:'center', boxShadow:'0 8px 32px rgba(26,58,42,0.18)', marginBottom:16 }}>
        <div style={{ fontSize:52, marginBottom:12 }}>🎓</div>
        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:700, marginBottom:8 }}>Start Your Learning Journey</div>
        <div style={{ fontSize:14, color:'#888', lineHeight:1.6, marginBottom:20 }}>
          You haven't enrolled in any course yet. Explore our ISO certified programs and get started today.
        </div>
        <button onClick={() => onNavigate('courses')}
          style={{ width:'100%', padding:'14px', background:'var(--forest)', color:'white', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
          Browse Courses →
        </button>
      </Card>

      {/* Course previews */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:700 }}>Explore Courses</div>
        <span onClick={() => onNavigate('courses')} style={{ fontSize:13, color:'var(--pine)', fontWeight:700, cursor:'pointer' }}>See all →</span>
      </div>
      {courses.slice(0, 2).map(c => (
        <Card key={c.id} onClick={() => onNavigate('courseDetail', c)} style={{ marginBottom:12, display:'flex', alignItems:'center', gap:14, padding:16 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:`${c.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>{c.icon}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:4, lineHeight:1.3 }}>{c.title}</div>
            <div style={{ display:'flex', gap:8 }}>
              <Badge text={c.mode} color={c.color} bg={`${c.color}15`}/>
              <span style={{ fontSize:12, color:'#888', display:'flex', alignItems:'center', gap:3 }}><Icon name="clock" size={12} color="#bbb"/> {c.hours}</span>
            </div>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontWeight:700, color:'var(--forest)', fontSize:15 }}>₹{c.fee.toLocaleString()}</div>
            <div style={{ fontSize:11, color:'#999', marginTop:2 }}>{c.seats - c.filled} seats</div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// ─── Student Enrolled ─────────────────────────────────────────────────────────

interface EnrollmentData {
  course: Course;
  regId: string;
  completedModules: number;
  totalModules: number;
  attendanceCount: number;
  batchLabel: string;
  batchTime: string;
}

const EnrolledHome: React.FC<{ name:string; enrollment: EnrollmentData; courses: Course[]; onNavigate:(s:string,d?:unknown)=>void; signOut:()=>void }> = ({ name, enrollment, courses, onNavigate, signOut }) => {
  const { course, completedModules, totalModules, attendanceCount, batchTime } = enrollment;
  const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div className="screen">
      <div style={{ background:'var(--forest)', padding:'24px 20px 72px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-50, right:-50, width:200, height:200, borderRadius:'50%', background:'rgba(106,173,120,0.08)' }}/>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative' }}>
          <div>
            <div style={{ color:'var(--sage)', fontSize:13 }}>{getGreeting()}</div>
            <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:22, fontWeight:700, marginTop:4 }}>{name}</div>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <div style={{ position:'relative', cursor:'pointer' }}>
              <Icon name="bell" size={22} color="var(--sage)"/>
              <div style={{ position:'absolute', top:-2, right:-2, width:8, height:8, background:'var(--amber)', borderRadius:'50%', border:'2px solid var(--forest)' }}/>
            </div>
            <button onClick={signOut} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:10, padding:'7px 10px', cursor:'pointer' }}>
              <Icon name="logout" size={18} color="var(--sage)"/>
            </button>
          </div>
        </div>
      </div>

      {/* Active course card */}
      <div style={{ margin:'-52px 16px 0', position:'relative', zIndex:2, animation:'fadeUp 0.4s ease' }}>
        <Card style={{ padding:20, boxShadow:'0 8px 32px rgba(26,58,42,0.18)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div>
              <Badge text="In Progress"/>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:18, fontWeight:700, marginTop:8, lineHeight:1.2 }}>{course.title}</div>
            </div>
            <div style={{ fontSize:40 }}>{course.icon}</div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, color:'#888' }}>Module {completedModules} of {totalModules}</span>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--pine)' }}>{progress}%</span>
          </div>
          <ProgressBar value={progress} max={100}/>
          <button onClick={() => onNavigate('learning')} style={{ width:'100%', marginTop:16, padding:'12px', background:'var(--forest)', color:'white', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
            Continue Learning →
          </button>
        </Card>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, margin:'16px 16px 0', animation:'fadeUp 0.4s ease 0.06s both' }}>
        <Card style={{ padding:16, textAlign:'center' }}>
          <div style={{ fontSize:28, marginBottom:6 }}>📅</div>
          <div style={{ fontWeight:700, fontSize:22, color:'var(--pine)' }}>{attendanceCount}</div>
          <div style={{ fontSize:12, color:'#999', marginTop:2 }}>Sessions Attended</div>
        </Card>
        <Card style={{ padding:16, textAlign:'center' }}>
          <div style={{ fontSize:28, marginBottom:6 }}>📚</div>
          <div style={{ fontWeight:700, fontSize:22, color:'var(--earth)' }}>{completedModules}/{totalModules}</div>
          <div style={{ fontSize:12, color:'#999', marginTop:2 }}>Modules Done</div>
        </Card>
        {batchTime && (
          <Card style={{ padding:16, gridColumn:'1 / -1', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ fontSize:32 }}>📡</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, color:'var(--amber)' }}>Next Live Session</div>
              <div style={{ fontSize:12, color:'#999', marginTop:2 }}>{batchTime}</div>
            </div>
            <button onClick={() => onNavigate('attendance')} style={{ padding:'8px 16px', background:'var(--amber)', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif", whiteSpace:'nowrap' }}>
              Attend
            </button>
          </Card>
        )}
      </div>

      {/* Explore more */}
      <div style={{ margin:'24px 16px 0', animation:'fadeUp 0.4s ease 0.1s both' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:700 }}>Explore More</div>
          <span onClick={() => onNavigate('courses')} style={{ fontSize:13, color:'var(--pine)', fontWeight:700, cursor:'pointer' }}>See all →</span>
        </div>
        {courses.filter(c => c.id !== course.id).slice(0, 2).map(c => (
          <Card key={c.id} onClick={() => onNavigate('courseDetail', c)} style={{ marginBottom:12, display:'flex', alignItems:'center', gap:14, padding:16 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:`${c.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>{c.icon}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:4, lineHeight:1.3 }}>{c.title}</div>
              <div style={{ display:'flex', gap:8 }}>
                <Badge text={c.mode} color={c.color} bg={`${c.color}15`}/>
                <span style={{ fontSize:12, color:'#888', display:'flex', alignItems:'center', gap:3 }}><Icon name="clock" size={12} color="#bbb"/> {c.hours}</span>
              </div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontWeight:700, color:'var(--forest)', fontSize:15 }}>₹{c.fee.toLocaleString()}</div>
              <div style={{ fontSize:11, color:'#999', marginTop:2 }}>{c.seats - c.filled} seats</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── Main HomeScreen ──────────────────────────────────────────────────────────

const HomeScreen: React.FC<Props> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();
  const [loading, setLoading]         = useState(true);
  const [courses, setCourses]         = useState<Course[]>([]);
  const [enrollment, setEnrollment]   = useState<EnrollmentData | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Always fetch courses for explore section
      const { data: courseData } = await supabase
        .from('courses').select('*').eq('is_published', true).order('id').limit(5);
      if (courseData) setCourses(courseData.map(mapCourse));

      // Admin doesn't need enrollment data
      if (user.role === 'admin') { setLoading(false); return; }

      // Check if student is enrolled
      const { data: reg } = await supabase
        .from('registrations')
        .select('id, registration_id, access_granted, courses(*), batches(label, time_slot)')
        .eq('user_id', user.id)
        .eq('access_granted', true)
        .limit(1)
        .single();

      if (!reg) { setLoading(false); return; }

      const course = mapCourse(reg.courses);

      // Fetch progress and attendance in parallel
      const [progressRes, attendanceRes, totalModsRes] = await Promise.all([
        supabase.from('user_progress')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'completed'),
        supabase.from('attendance')
          .select('id', { count: 'exact' })
          .eq('registration_id', reg.id),
        supabase.from('modules')
          .select('id', { count: 'exact' })
          .eq('course_id', course.id),
      ]);

      setEnrollment({
        course,
        regId:            reg.registration_id,
        completedModules: progressRes.data?.length ?? 0,
        totalModules:     totalModsRes.count ?? course.modules,
        attendanceCount:  attendanceRes.count ?? 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        batchLabel:       (reg.batches as any)?.label     ?? '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        batchTime:        (reg.batches as any)?.time_slot ?? '',
      });

      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) return (
    <div style={{ position:'fixed', inset:0, background:'var(--cream)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Spinner size={32} color="var(--forest)"/>
    </div>
  );

  // 1. Admin
  if (user?.role === 'admin')
    return <AdminHome onNavigate={onNavigate} signOut={signOut}/>;

  // 2. Student enrolled
  if (enrollment)
    return <EnrolledHome name={user?.name ?? ''} enrollment={enrollment} courses={courses} onNavigate={onNavigate} signOut={signOut}/>;

  // 3. Student not enrolled
  return <NotEnrolledHome name={user?.name ?? ''} courses={courses} onNavigate={onNavigate} signOut={signOut}/>;
};

export default HomeScreen;
