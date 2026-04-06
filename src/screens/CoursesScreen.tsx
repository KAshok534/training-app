import React, { useState } from 'react';
import { COURSES } from '../data';
import { Badge, ProgressBar, Card } from '../components/UI';
import type { Course, CourseMode } from '../types';

type Filter = 'All' | CourseMode;
interface Props { onNavigate:(screen:string, data?:unknown)=>void; }

const CoursesScreen: React.FC<Props> = ({ onNavigate }) => {
  const [filter, setFilter] = useState<Filter>('All');
  const filtered: Course[] = filter==='All' ? COURSES : COURSES.filter(c=>c.mode===filter);

  return (
    <div className="screen">
      {/* Sticky header */}
      <div style={{ background:'var(--forest)', padding:'20px 20px 24px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:26, fontWeight:900 }}>Training Programs</div>
        <div style={{ color:'var(--sage)', fontSize:13, marginTop:2 }}>ISO Certified Courses · AIWMR</div>
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          {(['All','Online','Hybrid'] as Filter[]).map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{ padding:'7px 18px', borderRadius:20, border:'none', cursor:'pointer', background: filter===f?'var(--leaf)':'rgba(255,255,255,0.1)', color: filter===f?'var(--forest)':'var(--sage)', fontSize:13, fontWeight: filter===f?700:400, fontFamily:"'DM Sans', sans-serif", transition:'all 0.2s' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Course cards */}
      <div style={{ padding:'16px' }}>
        {filtered.map((c,i)=>(
          <Card key={c.id} onClick={()=>onNavigate('courseDetail',c)} style={{ marginBottom:16, animation:`fadeUp 0.35s ease ${i*0.07}s both` }}>
            {/* Card hero */}
            <div style={{ background:c.color, padding:'20px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.07)' }}/>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <Badge text={c.badge} color="white" bg="rgba(255,255,255,0.2)"/>
                  <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:20, fontWeight:700, marginTop:10, lineHeight:1.2 }}>{c.title}</div>
                  <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, marginTop:4 }}>{c.subtitle}</div>
                </div>
                <div style={{ fontSize:44 }}>{c.icon}</div>
              </div>
            </div>
            {/* Card body */}
            <div style={{ padding:'16px 20px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16, textAlign:'center' }}>
                {([['Duration',c.duration],['Hours',c.hours],['Mode',c.mode]] as [string,string][]).map(([l,v])=>(
                  <div key={l}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{v}</div>
                    <div style={{ fontSize:11, color:'#999', marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontFamily:"'Playfair Display', serif", fontSize:24, fontWeight:900, color:'var(--forest)' }}>₹{c.fee.toLocaleString()}</div>
                  <div style={{ fontSize:11, color:'#999' }}>or ${c.feeUsd} USD · {c.seats-c.filled} seats left</div>
                </div>
                <div style={{ width:110 }}>
                  <ProgressBar value={c.filled} max={c.seats}/>
                  <div style={{ fontSize:11, color:'#999', marginTop:4, textAlign:'right' }}>{Math.round((c.filled/c.seats)*100)}% filled</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
export default CoursesScreen;
