import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Badge, ProgressBar, Card } from '../components/UI';
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

const HomeScreen: React.FC<Props> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const progress = 35;

  useEffect(() => {
    supabase.from('courses').select('*').eq('is_published', true)
      .order('id', { ascending: true }).limit(2)
      .then(({ data }) => { if (data) setCourses(data.map(mapCourse)); });
  }, []);

  const displayName = user?.role === 'admin' ? 'Admin' : (user?.name ?? 'Welcome');

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ background:'var(--forest)', padding:'24px 20px 72px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-50, right:-50, width:200, height:200, borderRadius:'50%', background:'rgba(106,173,120,0.08)' }}/>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative' }}>
          <div>
            <div style={{ color:'var(--sage)', fontSize:13 }}>{getGreeting()}</div>
            <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:22, fontWeight:700, marginTop:4 }}>
              {displayName}
            </div>
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
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:18, fontWeight:700, marginTop:8, lineHeight:1.2 }}>
                Environment &<br/>Waste Management
              </div>
            </div>
            <div style={{ fontSize:40 }}>🌿</div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, color:'#888' }}>Module 3 of 25</span>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--pine)' }}>{progress}%</span>
          </div>
          <ProgressBar value={progress} max={100}/>
          <button onClick={()=>onNavigate('learning')} style={{ width:'100%', marginTop:16, padding:'12px', background:'var(--forest)', color:'white', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
            Continue Learning →
          </button>
        </Card>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, margin:'16px 16px 0', animation:'fadeUp 0.4s ease 0.06s both' }}>
        <Card style={{ padding:16, textAlign:'center' }}>
          <div style={{ fontSize:28, marginBottom:6 }}>✅</div>
          <div style={{ fontWeight:700, fontSize:22, color:'var(--pine)' }}>87%</div>
          <div style={{ fontSize:12, color:'#999', marginTop:2 }}>Attendance</div>
        </Card>
        <Card style={{ padding:16, textAlign:'center' }}>
          <div style={{ fontSize:28, marginBottom:6 }}>📋</div>
          <div style={{ fontWeight:700, fontSize:22, color:'var(--earth)' }}>3/4</div>
          <div style={{ fontSize:12, color:'#999', marginTop:2 }}>Assignments</div>
        </Card>
        <Card style={{ padding:16, gridColumn:'1 / -1', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ fontSize:32 }}>📡</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, color:'var(--amber)' }}>Live Session Tomorrow</div>
            <div style={{ fontSize:12, color:'#999', marginTop:2 }}>7:00 PM – 9:00 PM</div>
          </div>
          <button onClick={()=>onNavigate('attendance')} style={{ padding:'8px 16px', background:'var(--amber)', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif", whiteSpace:'nowrap' }}>
            Join
          </button>
        </Card>
      </div>

      {/* Explore courses */}
      <div style={{ margin:'24px 16px 0', animation:'fadeUp 0.4s ease 0.1s both' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:700 }}>Explore Courses</div>
          <span onClick={()=>onNavigate('courses')} style={{ fontSize:13, color:'var(--pine)', fontWeight:700, cursor:'pointer' }}>See all →</span>
        </div>
        {courses.slice(0,2).map(c=>(
          <Card key={c.id} onClick={()=>onNavigate('courseDetail',c)} style={{ marginBottom:12, display:'flex', alignItems:'center', gap:14, padding:16 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:`${c.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>{c.icon}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:4, lineHeight:1.3 }}>{c.title}</div>
              <div style={{ display:'flex', gap:8 }}>
                <Badge text={c.mode} color={c.color} bg={`${c.color}15`}/>
                <span style={{ fontSize:12, color:'#888', display:'flex', alignItems:'center', gap:3 }}><Icon name="clock" size={12} color="#bbb"/> {c.duration}</span>
              </div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontWeight:700, color:'var(--forest)', fontSize:15 }}>₹{c.fee.toLocaleString()}</div>
              <div style={{ fontSize:11, color:'#999', marginTop:2 }}>{c.seats-c.filled} seats</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
export default HomeScreen;
