import React, { useState, useEffect } from 'react';
import { BATCHES } from '../data';
import { Badge, Btn, Card, Spinner } from '../components/UI';
import Icon from '../components/Icon';
import { useEnrollment } from '../hooks/useEnrollment';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { openRazorpay, isRazorpayConfigured } from '../lib/razorpay';
import type { Course, Batch, RegistrationForm } from '../types';

type Tab  = 'overview' | 'curriculum' | 'trainer';
type Step = 1 | 2 | 3;

interface Props { course: Course; onBack: () => void; onNavigate: (s: string) => void; }

const PREVIEW_COUNT = 3;

const CourseDetailScreen: React.FC<Props> = ({ course, onBack, onNavigate }) => {
  const { user }       = useAuth();
  const { enrollment } = useEnrollment();
  const alreadyEnrolled = enrollment?.courseId === course.id;

  // ── UI state ───────────────────────────────────────────────────────────────
  const [tab, setTab]             = useState<Tab>('overview');
  const [showReg, setShowReg]     = useState(false);
  const [step, setStep]           = useState<Step>(1);
  const [justEnrolled, setJustEnrolled] = useState(false);
  const [regCode, setRegCode]     = useState('');

  // ── Payment state ──────────────────────────────────────────────────────────
  const [paying, setPaying]       = useState(false);
  const [payError, setPayError]   = useState<string | null>(null);

  // ── Batch state ────────────────────────────────────────────────────────────
  const [liveBatches, setLiveBatches]       = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  // ── Registration form — pre-filled from logged-in user ─────────────────────
  const [form, setForm] = useState<RegistrationForm>({
    name:        user?.name         ?? '',
    email:       user?.email        ?? '',
    phone:       user?.phone        ?? '',
    org:         user?.organization ?? '',
    designation: user?.designation  ?? '',
  });

  // ── Fetch batches from Supabase when user reaches step 2 ──────────────────
  useEffect(() => {
    if (step !== 2) return;
    setBatchesLoading(true);
    supabase
      .from('batches')
      .select('id, label, date, time_slot, seats')
      .eq('course_id', course.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any[] | null }) => {
        const mapped: Batch[] = (data ?? []).map(b => ({
          id:    b.id    as number,
          label: b.label as string,
          date:  (b.date      as string) ?? 'TBD',
          time:  (b.time_slot as string) ?? 'TBD',
          seats: (b.seats     as number) ?? 0,
        }));
        // Fall back to mock data if Supabase returns nothing
        setLiveBatches(mapped.length > 0 ? mapped : BATCHES);
        setBatchesLoading(false);
      });
  }, [step, course.id]);

  const enrolled = alreadyEnrolled || justEnrolled;
  const displayRegCode = justEnrolled ? regCode : (enrollment?.regCode ?? '');
  const gst = Math.round(course.fee * 0.18);

  const upd = (k: keyof RegistrationForm, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const closeSheet = () => { setShowReg(false); setStep(1); setPayError(null); };

  // ── Payment handler ────────────────────────────────────────────────────────
  const handlePay = async () => {
    setPaying(true);
    setPayError(null);

    // 1. Create Razorpay order via Supabase Edge Function (keeps Key Secret off the browser)
    const { data: order, error: orderError } = await supabase.functions.invoke(
      'create-razorpay-order',
      { body: { amount: (course.fee + gst) * 100 } }, // ₹ → paise
    );

    if (orderError || !order?.id) {
      setPayError('Could not initiate payment. Please try again.');
      setPaying(false);
      return;
    }

    // 2. Open Razorpay checkout modal
    openRazorpay({
      orderId:    order.id    as string,
      amount:     order.amount as number,
      courseName: course.title,
      name:       form.name,
      email:      form.email,
      phone:      form.phone,

      onSuccess: async (response) => {
        // 3. Save registration — access_granted:true unlocks Learning/Attendance/Certs immediately
        const { data: reg, error: regError } = await supabase
          .from('registrations')
          .insert({
            user_id:            user!.id,
            course_id:          course.id,
            batch_id:           selectedBatchId,
            payment_status:     'paid',
            payment_id:         response.razorpay_payment_id,
            razorpay_order_id:  response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            access_granted:     true,
          })
          .select('registration_id')
          .single();

        if (!regError && reg) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setRegCode((reg as any).registration_id as string);
          setJustEnrolled(true);
          closeSheet();
        } else {
          // Payment captured but DB write failed — student must contact admin
          setPayError(
            'Payment captured but registration failed. ' +
            'Please contact director@aiwmr.org with your payment ID: ' +
            response.razorpay_payment_id,
          );
        }
        setPaying(false);
      },

      onDismiss: () => setPaying(false),
    });
  };

  // ── Shared input style ─────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', padding: '13px 14px', borderRadius: 12,
    border: '1.5px solid var(--sand)', background: 'var(--white)',
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="screen" style={{ paddingBottom: enrolled ? 120 : 80 }}>

      {/* ── Hero ── */}
      <div style={{ background: course.color, padding: '20px 20px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}/>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', marginBottom: 16 }}>
          <Icon name="back" size={16} color="white"/>
          <span style={{ color: 'white', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Back</span>
        </button>
        <div style={{ fontSize: 52 }}>{course.icon}</div>
        <div style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontSize: 24, fontWeight: 900, marginTop: 12, lineHeight: 1.2 }}>{course.title}</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 6 }}>{course.subtitle} · {course.duration}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <Badge text={course.badge} color="white" bg="rgba(255,255,255,0.2)"/>
          <Badge text={course.mode}  color="white" bg="rgba(255,255,255,0.15)"/>
        </div>
      </div>

      {/* ── Enrolled success banner ── */}
      {enrolled && (
        <div style={{ margin: '12px 16px', padding: 16, background: 'rgba(106,173,120,0.12)', borderRadius: 14, border: '1.5px solid var(--leaf)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>✅</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--pine)' }}>Successfully Enrolled!</div>
            <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>
              Reg ID: {displayRegCode || '...'} · Check email for confirmation
            </div>
          </div>
          <button
            onClick={() => onNavigate('learning')}
            style={{ padding: '8px 14px', background: 'var(--forest)', color: 'white', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            Start →
          </button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', background: 'var(--white)', borderBottom: '1.5px solid var(--sand)', position: 'sticky', top: 0, zIndex: 5 }}>
        {(['overview', 'curriculum', 'trainer'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '14px 0', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 700 : 400, color: tab === t ? 'var(--forest)' : '#999', borderBottom: tab === t ? `2.5px solid ${course.color}` : '2.5px solid transparent', fontFamily: "'DM Sans', sans-serif", textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding: '16px' }}>

        {/* Overview */}
        {tab === 'overview' && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {([
                ['💰', 'Fee (INR)', `₹${course.fee.toLocaleString()}`],
                ['💵', 'Fee (USD)', `$${course.feeUsd}`],
                ['⏱️', 'Hours',    course.hours],
                ['👥', 'Seats Left', `${course.seats - course.filled}/${course.seats}`],
                ['📅', 'Starts',   course.startDate],
                ['📚', 'Modules',  `${course.modules}`],
              ] as [string, string, string][]).map(([ic, l, v]) => (
                <Card key={l} style={{ padding: 14 }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{ic}</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{v}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{l}</div>
                </Card>
              ))}
            </div>
            <Card style={{ padding: 18, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Course Objectives</div>
              <div style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>
                Provide basic, general and advanced knowledge about waste management and environmental pollution. Intended for students, professionals, employees and graduates who want to excel in their careers and maximize their capabilities.
              </div>
            </Card>
            <Card style={{ padding: 18, background: 'rgba(45,90,61,0.04)', border: '1px dashed var(--sage)' }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>🎓 Who Can Attend</div>
              {[
                'Students & Academic Staff',
                'Industry Consultants & NGOs',
                'Corporate & Government Officials',
                'Environmental Service Providers',
                'Anyone passionate about sustainability',
              ].map(w => (
                <div key={w} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <Icon name="check" size={16} color="var(--leaf)"/>
                  <span style={{ fontSize: 13, color: '#555' }}>{w}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* Curriculum */}
        {tab === 'curriculum' && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>{course.topics.length} topics</div>

            {/* Always show first PREVIEW_COUNT topics; enrolled sees all */}
            {course.topics.slice(0, enrolled ? course.topics.length : PREVIEW_COUNT).map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', background: 'var(--white)', borderRadius: 12, marginBottom: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${course.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: course.color, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ fontSize: 13, flex: 1, lineHeight: 1.4 }}>{t}</div>
                <Icon name="file" size={14} color="#ddd"/>
              </div>
            ))}

            {/* Lock overlay for non-enrolled */}
            {!enrolled && course.topics.length > PREVIEW_COUNT && (
              <div style={{ marginTop: 8, borderRadius: 16, overflow: 'hidden', border: '1.5px dashed var(--sage)' }}>
                {course.topics.slice(PREVIEW_COUNT, PREVIEW_COUNT + 3).map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', background: 'var(--white)', filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none', marginBottom: 1 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${course.color}18`, flexShrink: 0 }}/>
                    <div style={{ fontSize: 13, flex: 1, lineHeight: 1.4 }}>{t}</div>
                  </div>
                ))}
                <div style={{ background: 'linear-gradient(to bottom, rgba(247,243,236,0.5), rgba(247,243,236,0.98))', padding: '24px 20px', textAlign: 'center', marginTop: -40, position: 'relative' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--forest)', marginBottom: 6 }}>
                    {course.topics.length - PREVIEW_COUNT} more topics
                  </div>
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 1.5 }}>
                    Enroll in this course to unlock the full curriculum
                  </div>
                  <button
                    onClick={() => setShowReg(true)}
                    style={{ padding: '11px 28px', background: course.color, color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Enroll Now · ₹{course.fee.toLocaleString()}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trainer */}
        {tab === 'trainer' && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <Card style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: course.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 16px' }}>👨‍🏫</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>Dr. Sushanth Gade</div>
              <div style={{ color: 'var(--moss)', fontSize: 13, marginTop: 4 }}>Dr (hc), MSc, REnvP, IOSH</div>
              <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>Certified True Advisor, US GBCI</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 10 }}>
                {[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={16} color="var(--amber)"/>)}
              </div>
              <div style={{ marginTop: 18, padding: 16, background: 'var(--mist)', borderRadius: 14, textAlign: 'left' }}>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7 }}>
                  Founder & Course Coordinator at Ashrita Institute for Waste Management & Research Pvt Ltd, Hyderabad. Expert in environmental management, waste systems and sustainability governance.
                </div>
              </div>
              <div style={{ marginTop: 14, fontSize: 13, color: '#888' }}>📞 +91 9676975725 · 📧 director@aiwmr.org</div>
            </Card>
          </div>
        )}
      </div>

      {/* ── Bottom CTA (fixed) ── */}
      {!enrolled && !showReg && (
        <div style={{ position: 'fixed', bottom: 'var(--safe-bottom, 0px)', left: 0, right: 0, padding: '12px 16px 16px', background: 'rgba(247,243,236,0.95)', backdropFilter: 'blur(8px)', borderTop: '1px solid var(--sand)', zIndex: 100 }}>
          <Btn onClick={() => setShowReg(true)} style={{ background: course.color, boxShadow: `0 6px 20px ${course.color}44` }}>
            Register Now · ₹{course.fee.toLocaleString()}
          </Btn>
        </div>
      )}

      {/* ── Registration bottom sheet ── */}
      {showReg && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column' }}>
          {/* Backdrop */}
          <div onClick={closeSheet} style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }}/>

          <div style={{ background: 'var(--cream)', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', maxHeight: '85vh', overflowY: 'auto', animation: 'slideUp 0.35s cubic-bezier(0.34, 1.2, 0.64, 1)' }}>

            {/* Sheet header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900 }}>
                {step === 1 ? 'Your Details' : step === 2 ? 'Choose Batch' : 'Payment'}
              </div>
              <button onClick={closeSheet} style={{ background: 'var(--sand)', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}>
                <Icon name="close" size={16} color="var(--charcoal)"/>
              </button>
            </div>

            {/* Step progress bar */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
              {([1, 2, 3] as Step[]).map(s => (
                <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? course.color : 'var(--sand)', transition: 'background 0.3s' }}/>
              ))}
            </div>

            {/* ── Step 1: Personal Details ── */}
            {step === 1 && (
              <div>
                {([
                  ['Full Name',    'name',        'text',  'Your full name'],
                  ['Email',        'email',       'email', 'email@example.com'],
                  ['Phone',        'phone',       'tel',   '+91 XXXXX XXXXX'],
                  ['Organization', 'org',         'text',  'Company / Institution'],
                  ['Designation',  'designation', 'text',  'Your role / title'],
                ] as [string, keyof RegistrationForm, string, string][]).map(([l, k, t, p]) => (
                  <div key={k} style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--moss)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{l}</label>
                    <input type={t} placeholder={p} value={form[k]} onChange={e => upd(k, e.target.value)} style={inp}/>
                  </div>
                ))}
                <Btn onClick={() => setStep(2)} style={{ marginTop: 8, background: course.color }}>
                  Next: Select Batch →
                </Btn>
              </div>
            )}

            {/* ── Step 2: Batch Selection ── */}
            {step === 2 && (
              <div>
                <div style={{ fontSize: 14, color: '#888', marginBottom: 16 }}>Select your preferred batch</div>
                {batchesLoading ? (
                  <div style={{ textAlign: 'center', padding: 32 }}>
                    <Spinner size={28} color="var(--forest)"/>
                  </div>
                ) : liveBatches.map(b => (
                  <Card
                    key={b.id}
                    onClick={() => { setSelectedBatchId(b.id); setStep(3); }}
                    style={{ padding: 16, marginBottom: 12, border: '1.5px solid var(--sand)', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{b.label}</div>
                        <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>📅 {b.date}</div>
                        <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>🕐 {b.time}</div>
                      </div>
                      <Badge
                        text={`${b.seats} seats`}
                        color={b.seats <= 3 ? 'var(--red)' : 'var(--pine)'}
                        bg={b.seats <= 3 ? 'rgba(192,57,43,0.1)' : 'rgba(45,90,61,0.1)'}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* ── Step 3: Payment ── */}
            {step === 3 && (
              <div>
                {/* Order summary */}
                <Card style={{ padding: 16, marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>{course.title}</div>
                  {[
                    ['Course Fee', `₹${course.fee.toLocaleString()}`],
                    ['GST (18%)',  `₹${gst.toLocaleString()}`],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, color: '#888' }}>{l}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--sand)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700 }}>Total</span>
                    <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--forest)' }}>
                      ₹{(course.fee + gst).toLocaleString()}
                    </span>
                  </div>
                </Card>

                {/* Error message */}
                {payError && (
                  <div style={{ padding: 12, background: 'rgba(192,57,43,0.08)', borderRadius: 10, marginBottom: 16, fontSize: 13, color: 'var(--red)', lineHeight: 1.5, textAlign: 'center' }}>
                    {payError}
                  </div>
                )}

                {/* Razorpay button OR contact-admin fallback */}
                {isRazorpayConfigured ? (
                  <>
                    <Btn
                      loading={paying}
                      onClick={handlePay}
                      style={{ background: course.color, boxShadow: `0 6px 20px ${course.color}44` }}
                    >
                      Pay ₹{(course.fee + gst).toLocaleString()} Securely
                    </Btn>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
                      <span style={{ fontSize: 11, color: '#bbb' }}>🔒 Secured by Razorpay · 256-bit SSL</span>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: 20, background: 'var(--mist)', borderRadius: 14, textAlign: 'center', border: '1px dashed var(--sage)' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>🏛️</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Complete Enrollment via Bank Transfer</div>
                    <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 12 }}>
                      Online payment is being set up.<br/>
                      Please contact us to complete your enrollment.
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--forest)', lineHeight: 1.8 }}>
                      📧 director@aiwmr.org<br/>
                      📞 +91 9676975725
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetailScreen;
