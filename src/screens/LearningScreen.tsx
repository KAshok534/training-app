import React, { useState } from 'react';
import { MODULES_DATA } from '../data';
import { ProgressBar, Card } from '../components/UI';
import Icon from '../components/Icon';
import type { CourseModule } from '../types';

const LearningScreen: React.FC = () => {
  const [activeId, setActiveId] = useState<number|null>(null);

  const statusBg = (s: CourseModule['status']) =>
    s==='completed'?'var(--leaf)': s==='in-progress'?'var(--amber)':'var(--sand)';

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ background:'var(--forest)', padding:'20px 20px 24px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:24, fontWeight:900 }}>My Learning</div>
        <div style={{ color:'var(--sage)', fontSize:13, marginTop:2 }}>Environment & Waste Management</div>
        <div style={{ marginTop:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ color:'var(--sage)', fontSize:12 }}>Module 3 of 25 · 35% complete</span>
            <span style={{ color:'var(--leaf)', fontSize:12, fontWeight:700 }}>35%</span>
          </div>
          <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:10, height:8 }}>
            <div style={{ width:'35%', height:'100%', background:'var(--leaf)', borderRadius:10 }}/>
          </div>
        </div>
      </div>

      <div style={{ padding:'16px' }}>
        {/* Mini stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
          {[['3/25','Modules'],['87%','Attendance'],['2 days','Next live']].map(([v,l])=>(
            <Card key={l} style={{ padding:'12px 10px', textAlign:'center' }}>
              <div style={{ fontWeight:700, fontSize:16, color:'var(--forest)' }}>{v}</div>
              <div style={{ fontSize:11, color:'#999', marginTop:3 }}>{l}</div>
            </Card>
          ))}
        </div>

        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:700, marginBottom:14 }}>Course Modules</div>

        {MODULES_DATA.map((m,i)=>(
          <div key={m.id} onClick={()=>!m.locked&&setActiveId(p=>p===m.id?null:m.id)}
            style={{ background: m.locked?'rgba(255,255,255,0.6)':'var(--white)', borderRadius:16, marginBottom:10, padding:'16px', cursor:m.locked?'not-allowed':'pointer', opacity:m.locked?0.65:1, boxShadow:activeId===m.id?'0 4px 20px rgba(26,58,42,0.15)':'0 2px 8px rgba(0,0,0,0.05)', border:activeId===m.id?'2px solid var(--leaf)':'2px solid transparent', transition:'all 0.25s', animation:`fadeUp 0.35s ease ${i*0.06}s both` }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:statusBg(m.status), display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {m.status==='completed'   && <Icon name="check" size={18} color="white"/>}
                {m.status==='in-progress' && <Icon name={m.type==='video'?'video':'file'} size={18} color="white"/>}
                {m.status==='locked'      && <Icon name="lock" size={16} color="#bbb"/>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14, color:m.locked?'#aaa':'var(--charcoal)', lineHeight:1.3 }}>{m.title}</div>
                <div style={{ display:'flex', gap:8, marginTop:4 }}>
                  <span style={{ fontSize:12, color:'#bbb' }}>{m.type==='video'?'📹 Video':'📄 PDF'}</span>
                  <span style={{ fontSize:12, color:'#bbb', display:'flex', alignItems:'center', gap:2 }}><Icon name="clock" size={11} color="#ccc"/> {m.duration}</span>
                </div>
              </div>
              {!m.locked && <Icon name={activeId===m.id?'close':'play'} size={28} color={m.status==='in-progress'?'var(--amber)':'var(--sage)'}/>}
            </div>
            {activeId===m.id && (
              <div style={{ marginTop:14, padding:14, background:'var(--mist)', borderRadius:12, animation:'fadeUp 0.2s ease' }}>
                <div style={{ fontSize:13, color:'#555', lineHeight:1.7, marginBottom:12 }}>
                  {m.description ?? 'This module covers core concepts with real-world case studies and practical examples.'}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button style={{ flex:1, padding:'10px', background:'var(--forest)', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
                    ▶ {m.videoUrl||m.pdfUrl ? 'Open' : 'Start'} Module
                  </button>
                  <button style={{ padding:'10px 14px', background:'var(--sand)', border:'none', borderRadius:10, cursor:'pointer' }}>
                    <Icon name="download" size={16} color="var(--charcoal)"/>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default LearningScreen;
