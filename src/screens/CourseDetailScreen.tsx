import React, { useState } from 'react';
import { BATCHES, PAYMENT_METHODS } from '../data';
import { Badge, Btn, Card, Spinner } from '../components/UI';
import Icon from '../components/Icon';
import type { Course, RegistrationForm } from '../types';

type Tab = 'overview'|'curriculum'|'trainer';
type Step = 1|2|3;

interface Props { course: Course; onBack:()=>void; onNavigate:(s:string)=>void; }

const CourseDetailScreen: React.FC<Props> = ({ course, onBack, onNavigate }) => {
  const [tab, setTab]           = useState<Tab>('overview');
  const [showReg, setShowReg]   = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [step, setStep]         = useState<Step>(1);
  const [paying, setPaying]     = useState(false);
  const [form, setForm]         = useState<RegistrationForm>({ name:'', email:'', phone:'', org:'', designation:'' });

  const upd = (k: keyof RegistrationForm, v: string) => setForm(p=>({...p,[k]:v}));

  const handlePay = () => {
    setPaying(true);
    // 🔧 REPLACE WITH REAL RAZORPAY:
    // import { openRazorpay } from '../lib/razorpay';
    // const orderId = await createOrderViaEdgeFunction(course.fee * 118);
    // openRazorpay({ orderId, amount: course.fee*118, courseName: course.title,
    //   name: form.name, email: form.email, phone: form.phone,
    //   onSuccess: async (resp) => {
    //     await supabase.from('registrations').insert({ ... });
    //     setEnrolled(true); setShowReg(false);
    //   }
    // });
    setTimeout(()=>{ setPaying(false); setShowReg(false); setEnrolled(true); }, 1600);
  };

  const inp: React.CSSProperties = { width:'100%', padding:'13px 14px', borderRadius:12, border:'1.5px solid var(--sand)', background:'var(--white)', fontSize:14, fontFamily:"'DM Sans', sans-serif", outline:'none' };
  const lbl: React.CSSProperties = { fontSize:11, fontWeight:700, color:'var(--moss)', textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:6 };
  const gst = Math.round(course.fee*0.18);

  return (
    <div className="screen" style={{ paddingBottom: enrolled?120:80 }}>
      {/* Hero */}
      <div style={{ background:course.color, padding:'20px 20px 24px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', bottom:-30, right:-30, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.07)' }}/>
        <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.15)', border:'none', borderRadius:10, padding:'8px 12px', cursor:'pointer', marginBottom:16 }}>
          <Icon name="back" size={16} color="white"/>
          <span style={{ color:'white', fontSize:13, fontFamily:"'DM Sans', sans-serif" }}>Back</span>
        </button>
        <div style={{ fontSize:52 }}>{course.icon}</div>
        <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:24, fontWeight:900, marginTop:12, lineHeight:1.2 }}>{course.title}</div>
        <div style={{ color:'rgba(255,255,255,0.7)', fontSize:14, marginTop:6 }}>{course.subtitle} · {course.duration}</div>
        <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap' }}>
          <Badge text={course.badge} color="white" bg="rgba(255,255,255,0.2)"/>
          <Badge text={course.mode}  color="white" bg="rgba(255,255,255,0.15)"/>
        </div>
      </div>

      {/* Enrolled banner */}
      {enrolled && (
        <div style={{ margin:'12px 16px', padding:16, background:'rgba(106,173,120,0.12)', borderRadius:14, border:'1.5px solid var(--leaf)', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:28 }}>✅</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, color:'var(--pine)' }}>Successfully Enrolled!</div>
            <div style={{ fontSize:12, color:'#777', marginTop:2 }}>Reg ID: AIWMR-2026-0042 · Check email for QR pass</div>
          </div>
          <button onClick={()=>onNavigate('learning')} style={{ padding:'8px 14px', background:'var(--forest)', color:'white', border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>Start →</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', background:'var(--white)', borderBottom:'1.5px solid var(--sand)', position:'sticky', top:0, zIndex:5 }}>
        {(['overview','curriculum','trainer'] as Tab[]).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:'14px 0', border:'none', background:'none', cursor:'pointer', fontSize:13, fontWeight:tab===t?700:400, color:tab===t?'var(--forest)':'#999', borderBottom:tab===t?`2.5px solid ${course.color}`:'2.5px solid transparent', fontFamily:"'DM Sans', sans-serif", textTransform:'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding:'16px' }}>
        {tab==='overview' && (
          <div style={{ animation:'fadeUp 0.3s ease' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              {[['💰','Fee',`₹${course.fee.toLocaleString()}`],['👥','Seats Left',`${course.seats-course.filled}/${course.seats}`],['📅','Starts',course.startDate],['📚','Modules',`${course.modules} topics`]].map(([ic,l,v])=>(
                <Card key={l as string} style={{ padding:14 }}>
                  <div style={{ fontSize:20, marginBottom:6 }}>{ic}</div>
                  <div style={{ fontWeight:700, fontSize:15 }}>{v}</div>
                  <div style={{ fontSize:11, color:'#999', marginTop:2 }}>{l}</div>
                </Card>
              ))}
            </div>
            <Card style={{ padding:18, marginBottom:12 }}>
              <div style={{ fontWeight:700, marginBottom:8 }}>Course Objectives</div>
              <div style={{ fontSize:14, color:'#555', lineHeight:1.7 }}>Provide basic, general and advanced knowledge about waste management and environmental pollution. Intended for students, professionals, employees and graduates who want to excel in their careers and maximize their capabilities.</div>
            </Card>
            <Card style={{ padding:18, background:'rgba(45,90,61,0.04)', border:'1px dashed var(--sage)' }}>
              <div style={{ fontWeight:700, marginBottom:10 }}>🎓 Who Can Attend</div>
              {['Students & Academic Staff','Industry Consultants & NGOs','Corporate & Government Officials','Environmental Service Providers','Anyone passionate about sustainability'].map(w=>(
                <div key={w} style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
                  <Icon name="check" size={16} color="var(--leaf)"/>
                  <span style={{ fontSize:13, color:'#555' }}>{w}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab==='curriculum' && (
          <div style={{ animation:'fadeUp 0.3s ease' }}>
            <div style={{ fontSize:13, color:'#888', marginBottom:14 }}>{course.topics.length} topics</div>
            {course.topics.map((t,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 14px', background:'var(--white)', borderRadius:12, marginBottom:8, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ width:28, height:28, borderRadius:8, background:`${course.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:course.color, flexShrink:0 }}>{i+1}</div>
                <div style={{ fontSize:13, flex:1, lineHeight:1.4 }}>{t}</div>
                <Icon name="file" size={14} color="#ddd"/>
              </div>
            ))}
          </div>
        )}

        {tab==='trainer' && (
          <div style={{ animation:'fadeUp 0.3s ease' }}>
            <Card style={{ padding:24, textAlign:'center' }}>
              <div style={{ width:80, height:80, borderRadius:'50%', background:course.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, margin:'0 auto 16px' }}>👨‍🏫</div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:22, fontWeight:700 }}>Dr. Sushanth Gade</div>
              <div style={{ color:'var(--moss)', fontSize:13, marginTop:4 }}>Dr (hc), MSc, REnvP, IOSH</div>
              <div style={{ color:'#888', fontSize:12, marginTop:2 }}>Certified True Advisor, US GBCI</div>
              <div style={{ display:'flex', justifyContent:'center', gap:2, marginTop:10 }}>
                {[1,2,3,4,5].map(i=><Icon key={i} name="star" size={16} color="var(--amber)"/>)}
              </div>
              <div style={{ marginTop:18, padding:16, background:'var(--mist)', borderRadius:14, textAlign:'left' }}>
                <div style={{ fontSize:13, color:'#555', lineHeight:1.7 }}>Founder & Course Coordinator at Ashrita Institute for Waste Management & Research Pvt Ltd, Hyderabad. Expert in environmental management, waste systems and sustainability governance.</div>
              </div>
              <div style={{ marginTop:14, fontSize:13, color:'#888' }}>📞 +91 9676975725 · 📧 director@aiwmr.org</div>
            </Card>
          </div>
        )}
      </div>

      {/* Register CTA */}
      {!enrolled && !showReg && (
        <div style={{ position:'fixed', bottom:'var(--safe-bottom, 0px)', left:0, right:0, padding:'12px 16px 16px', background:'rgba(247,243,236,0.95)', backdropFilter:'blur(8px)', borderTop:'1px solid var(--sand)', zIndex:100 }}>
          <Btn onClick={()=>setShowReg(true)} style={{ background:course.color, boxShadow:`0 6px 20px ${course.color}44` }}>
            Register Now · ₹{course.fee.toLocaleString()}
          </Btn>
        </div>
      )}

      {/* Registration bottom sheet */}
      {showReg && (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', flexDirection:'column' }}>
          <div onClick={()=>{setShowReg(false);setStep(1);}} style={{ flex:1, background:'rgba(0,0,0,0.5)' }}/>
          <div style={{ background:'var(--cream)', borderRadius:'24px 24px 0 0', padding:'24px 20px 40px', maxHeight:'85vh', overflowY:'auto', animation:'slideUp 0.35s cubic-bezier(0.34, 1.2, 0.64, 1)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:22, fontWeight:900 }}>
                {step===1?'Your Details':step===2?'Choose Batch':'Payment'}
              </div>
              <button onClick={()=>{setShowReg(false);setStep(1);}} style={{ background:'var(--sand)', border:'none', borderRadius:8, padding:'8px 10px', cursor:'pointer' }}>
                <Icon name="close" size={16} color="var(--charcoal)"/>
              </button>
            </div>
            {/* Step progress */}
            <div style={{ display:'flex', gap:6, marginBottom:24 }}>
              {[1,2,3].map(s=><div key={s} style={{ flex:1, height:4, borderRadius:2, background:s<=step?course.color:'var(--sand)', transition:'background 0.3s' }}/>)}
            </div>

            {step===1 && (
              <div>
                {([['Full Name','name','text','Your full name'],['Email','email','email','email@example.com'],['Phone','phone','tel','+91 XXXXX XXXXX'],['Organization','org','text','Company / Institution'],['Designation','designation','text','Your role / title']] as [string, keyof RegistrationForm, string, string][]).map(([l,k,t,p])=>(
                  <div key={k} style={{ marginBottom:16 }}>
                    <label style={{ ...{fontSize:11,fontWeight:700,color:'var(--moss)',textTransform:'uppercase' as const,letterSpacing:'0.08em',display:'block',marginBottom:6} }}>{l}</label>
                    <input type={t} placeholder={p} value={form[k]} onChange={e=>upd(k,e.target.value)} style={inp}/>
                  </div>
                ))}
                <Btn onClick={()=>setStep(2)} style={{ marginTop:8, background:course.color }}>Next: Select Batch →</Btn>
              </div>
            )}

            {step===2 && (
              <div>
                <div style={{ fontSize:14, color:'#888', marginBottom:16 }}>Select your preferred batch</div>
                {BATCHES.map(b=>(
                  <Card key={b.id} onClick={()=>setStep(3)} style={{ padding:16, marginBottom:12, border:'1.5px solid var(--sand)', cursor:'pointer' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15 }}>{b.label}</div>
                        <div style={{ color:'#888', fontSize:13, marginTop:4 }}>📅 {b.date}</div>
                        <div style={{ color:'#888', fontSize:13, marginTop:2 }}>🕐 {b.time}</div>
                      </div>
                      <Badge text={`${b.seats} seats`} color={b.seats<=3?'var(--red)':'var(--pine)'} bg={b.seats<=3?'rgba(192,57,43,0.1)':'rgba(45,90,61,0.1)'}/>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {step===3 && (
              <div>
                <Card style={{ padding:16, marginBottom:20 }}>
                  <div style={{ fontWeight:700, marginBottom:10 }}>{course.title}</div>
                  {[['Course Fee',`₹${course.fee.toLocaleString()}`],['GST (18%)',`₹${gst.toLocaleString()}`]].map(([l,v])=>(
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:14, color:'#888' }}>{l}</span>
                      <span style={{ fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ borderTop:'1px solid var(--sand)', marginTop:10, paddingTop:10, display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontWeight:700 }}>Total</span>
                    <span style={{ fontWeight:700, fontSize:18, color:'var(--forest)' }}>₹{(course.fee+gst).toLocaleString()}</span>
                  </div>
                </Card>
                <div style={{ fontSize:12, fontWeight:700, color:'#888', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>Pay Via</div>
                {PAYMENT_METHODS.map(m=>(
                  <button key={m.id} onClick={handlePay} disabled={paying} style={{ width:'100%', padding:'14px 16px', background:'var(--white)', border:'1.5px solid var(--sand)', borderRadius:12, marginBottom:10, fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans', sans-serif", textAlign:'left', display:'flex', alignItems:'center', gap:10 }}>
                    {paying ? <Spinner size={16} color="var(--forest)"/> : <span>{m.icon}</span>}
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default CourseDetailScreen;
