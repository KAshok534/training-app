/**
 * CourseDetailScreen — editorial-botanical sales conversion screen.
 *
 * Three tabs (Overview · Curriculum · Trainer) wrapped in the parchment shell.
 * Curriculum is gated to the first 3 topics for non-enrolled visitors.
 * Bottom CTA opens a 3-step registration sheet (Details → Batch → Payment)
 * with Razorpay checkout and server-side signature verification.
 */
import React, { useState, useEffect } from 'react';
import { BATCHES } from '../data';
import { useEnrollment } from '../hooks/useEnrollment';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { openRazorpay, isRazorpayConfigured } from '../lib/razorpay';
import PreCourseInstructionsModal from '../components/PreCourseInstructionsModal';
import ParchmentBackdrop from '../components/ParchmentBackdrop';
import { DISPLAY, BODY } from '../components/AuthShell';
import { Field, PrimaryButton, InlineLink, ErrorBar } from '../components/AuthForm';
import type { Course, Batch, RegistrationForm } from '../types';

type Tab  = 'overview' | 'curriculum' | 'trainer';
type Step = 1 | 2 | 3;

interface Props { course: Course; onBack: () => void; onNavigate: (s: string) => void; }

const PREVIEW_COUNT = 3;

// Roman numerals for the step indicator + topic list
const toRoman = (n: number): string => {
  const map: [number, string][] = [
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let result = ''; let num = n;
  for (const [val, sym] of map) {
    while (num >= val) { result += sym; num -= val; }
  }
  return result;
};

const CourseDetailScreen: React.FC<Props> = ({ course, onBack, onNavigate }) => {
  const { user }       = useAuth();
  const { enrollment } = useEnrollment();
  const alreadyEnrolled = enrollment?.courseId === course.id;

  // UI state
  const [tab, setTab]                   = useState<Tab>('overview');
  const [showReg, setShowReg]           = useState(false);
  const [step, setStep]                 = useState<Step>(1);
  const [justEnrolled, setJustEnrolled] = useState(false);
  const [regCode, setRegCode]           = useState('');

  // Payment state
  const [paying, setPaying]             = useState(false);
  const [payError, setPayError]         = useState<string | null>(null);

  // Batch state
  const [liveBatches, setLiveBatches]         = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading]   = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  // Form state — pre-filled from logged-in user
  const [form, setForm] = useState<RegistrationForm>({
    name:        user?.name         ?? '',
    email:       user?.email        ?? '',
    phone:       user?.phone        ?? '',
    org:         user?.organization ?? '',
    designation: user?.designation  ?? '',
  });

  // Field-focus tracking for underlined inputs
  const [focused, setFocused] = useState<string | null>(null);

  // Fetch batches when user reaches step 2
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
        setLiveBatches(mapped.length > 0 ? mapped : BATCHES);
        setBatchesLoading(false);
      });
  }, [step, course.id]);

  const enrolled       = alreadyEnrolled || justEnrolled;
  const displayRegCode = justEnrolled ? regCode : (enrollment?.regCode ?? '');
  const gst            = Math.round(course.fee * 0.18);

  const upd = (k: keyof RegistrationForm, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const closeSheet = () => { setShowReg(false); setStep(1); setPayError(null); };

  const handlePay = async () => {
    setPaying(true);
    setPayError(null);

    const { data: order, error: orderError } = await supabase.functions.invoke(
      'create-razorpay-order',
      { body: { amount: (course.fee + gst) * 100 } },
    );

    if (orderError || !order?.id) {
      setPayError('Could not initiate payment. Please try again.');
      setPaying(false);
      return;
    }

    openRazorpay({
      orderId:    order.id    as string,
      amount:     order.amount as number,
      courseName: course.title,
      name:       form.name,
      email:      form.email,
      phone:      form.phone,

      onSuccess: async (response) => {
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
          'verify-razorpay-payment',
          {
            body: {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              course_id:           course.id,
              batch_id:            selectedBatchId,
            },
          },
        );

        if (!verifyError && verifyData?.registration_id) {
          setRegCode(verifyData.registration_id as string);
          setJustEnrolled(true);
          closeSheet();
        } else {
          const msg = verifyData?.error ?? verifyError?.message ?? 'verification failed';
          setPayError(
            `Payment captured but registration failed (${msg}). ` +
            'Please contact director@aiwmr.org with your payment ID: ' +
            response.razorpay_payment_id,
          );
        }
        setPaying(false);
      },

      onDismiss: () => setPaying(false),
    });
  };

  return (
    <ParchmentBackdrop decorations="full">
      <div className="screen" style={{
        position: 'absolute', inset: 0,
        paddingBottom: enrolled ? 24 : 96,
      }}>
        <div style={{
          maxWidth: 520, margin: '0 auto',
          padding: 'calc(20px + var(--safe-top)) 26px 40px',
        }}>

          {/* ── Top bar ── */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 28,
            animation: 'fadeUpSoft 0.5s ease 0s both',
          }}>
            <button onClick={onBack}
              style={{
                fontFamily: DISPLAY,
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--moss)',
                background: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(26,58,42,0.12)',
                padding: '6px 14px',
                borderRadius: 2,
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}>
              ↩ back
            </button>
            <div style={{
              fontFamily: BODY,
              fontSize: 9, fontWeight: 500,
              color: 'var(--moss)',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              textAlign: 'right',
              lineHeight: 1.5,
              opacity: 0.85,
            }}>
              AIWMR<br/>Training
            </div>
          </div>

          {/* ── Course identity block ── */}
          <div style={{ marginBottom: 32 }}>
            {/* Eyebrow — course category */}
            <div style={{
              fontFamily: BODY,
              fontSize: 10, fontWeight: 600,
              color: course.color,
              letterSpacing: '0.34em',
              textTransform: 'uppercase',
              marginBottom: 14,
              animation: 'fadeUpSoft 0.5s ease 0.05s both',
            }}>
              — {course.category}
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: DISPLAY,
              fontSize: 'clamp(30px, 8vw, 46px)',
              color: 'var(--forest)',
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: '-0.022em',
              margin: 0, marginBottom: 14,
              fontVariationSettings: '"opsz" 144, "SOFT" 80',
              animation: 'fadeUpSoft 0.6s ease 0.12s both',
            }}>
              {course.title}<span style={{ color: 'var(--moss)', fontStyle: 'italic' }}>.</span>
            </h1>

            {/* Subtitle */}
            <p style={{
              fontFamily: DISPLAY,
              fontStyle: 'italic',
              fontSize: 16,
              color: 'var(--charcoal)',
              opacity: 0.7,
              lineHeight: 1.5,
              margin: 0, marginBottom: 18,
              animation: 'fadeUpSoft 0.5s ease 0.2s both',
            }}>
              {course.subtitle} · {course.duration}
            </p>

            {/* Logo (if course has one) */}
            {course.logoUrl && (
              <div style={{
                textAlign: 'left',
                margin: '4px 0 18px',
                animation: 'fadeUpSoft 0.7s ease 0.3s both',
              }}>
                <img
                  src={course.logoUrl}
                  alt={course.title}
                  style={{ width: '60%', maxWidth: 220, height: 'auto', opacity: 0.92 }}
                />
              </div>
            )}

            {/* Tag chips */}
            <div style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              animation: 'fadeUpSoft 0.5s ease 0.3s both',
            }}>
              <Tag text={course.badge} color={course.color}/>
              <Tag text={course.mode} color="var(--moss)"/>
              <Tag text={course.hours} color="var(--moss)"/>
            </div>
          </div>

          {/* ── Decorative rule ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28,
            animation: 'fadeUpSoft 0.5s ease 0.4s both',
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
            <span style={{ fontFamily: DISPLAY, fontSize: 13, color: 'var(--moss)', opacity: 0.7 }}>✦</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
          </div>

          {/* ── Enrolled banner ── */}
          {enrolled && (
            <div style={{
              position: 'relative',
              padding: '20px 22px 18px',
              marginBottom: 28,
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.32)',
              animation: 'fadeUpSoft 0.5s ease 0.45s both',
            }}>
              <div style={{
                position: 'absolute', top: -1, left: -1, right: -1, height: 3,
                background: 'var(--gold)',
              }}/>
              <div style={{
                fontFamily: BODY,
                fontSize: 9, fontWeight: 700,
                color: 'var(--gold)',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>
                ✦ You're enrolled
              </div>
              <div style={{
                fontFamily: DISPLAY,
                fontStyle: 'italic',
                fontSize: 17,
                color: 'var(--forest)',
                fontWeight: 500,
                lineHeight: 1.3,
                marginBottom: 6,
              }}>
                Welcome to the academy.
              </div>
              {displayRegCode && (
                <div style={{
                  fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
                  fontSize: 11,
                  color: 'var(--moss)',
                  marginBottom: 14,
                }}>
                  {displayRegCode}
                </div>
              )}
              <PrimaryButton
                onClick={() => onNavigate('learning')}
                label="Begin Learning"
                arrow="→"
              />
            </div>
          )}

          {/* ── Tabs — editorial style ── */}
          <div style={{
            display: 'flex',
            gap: 6,
            marginBottom: 28,
            borderBottom: '1px solid rgba(26,58,42,0.12)',
            animation: 'fadeUpSoft 0.5s ease 0.5s both',
          }}>
            {(['overview', 'curriculum', 'trainer'] as Tab[]).map(t => {
              const active = tab === t;
              return (
                <button key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '12px 4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: active ? DISPLAY : BODY,
                    fontSize: active ? 15 : 11,
                    fontStyle: active ? 'italic' : 'normal',
                    fontWeight: active ? 500 : 600,
                    color: active ? 'var(--forest)' : 'rgba(26,58,42,0.45)',
                    letterSpacing: active ? '0.01em' : '0.22em',
                    textTransform: active ? 'none' : 'uppercase',
                    borderBottom: active ? `2px solid ${course.color}` : '2px solid transparent',
                    marginBottom: -1,
                    transition: 'all 0.2s ease',
                  }}>
                  {t}
                </button>
              );
            })}
          </div>

          {/* ── Tab content ── */}
          <div key={tab} style={{ animation: 'fadeUpSoft 0.4s ease both' }}>

            {/* OVERVIEW */}
            {tab === 'overview' && (
              <div>
                {/* At-a-glance stat block */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  rowGap: 22, columnGap: 24,
                  marginBottom: 36,
                }}>
                  <StatBlock eyebrow="Fee (INR)" figure={`₹${course.fee.toLocaleString()}`} caption={`+ ${gst.toLocaleString()} GST`}/>
                  <StatBlock eyebrow="Intl Fee"  figure={`$${course.feeUsd}`}                caption="for overseas students"/>
                  <StatBlock eyebrow="Hours"     figure={course.hours}                       caption="total commitment"/>
                  <StatBlock eyebrow="Seats"     figure={`${course.seats - course.filled} / ${course.seats}`} caption="remaining"/>
                  <StatBlock eyebrow="Starts"    figure={course.startDate}                   caption="next cohort"/>
                  <StatBlock eyebrow="Modules"   figure={String(course.modules)}             caption="across the program"/>
                </div>

                {/* Course Objectives */}
                <SectionHeader text="Course Objectives"/>
                <p style={{
                  fontFamily: DISPLAY,
                  fontSize: 16,
                  color: 'var(--charcoal)',
                  opacity: 0.8,
                  lineHeight: 1.65,
                  margin: '0 0 36px',
                  maxWidth: 460,
                }}>
                  Build <em style={{ color: 'var(--moss)' }}>basic, general & advanced</em> knowledge of waste management and environmental pollution. Designed for students, professionals, employees and graduates who want to excel in their careers and expand their capabilities in sustainability.
                </p>

                {/* Who Can Attend */}
                <SectionHeader text="Who Can Attend"/>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 24px',
                  fontFamily: DISPLAY,
                  fontSize: 15,
                  color: 'var(--charcoal)',
                  opacity: 0.82,
                  lineHeight: 1.7,
                }}>
                  {[
                    'Students & academic staff',
                    'Industry consultants & NGOs',
                    'Corporate & government officials',
                    'Environmental service providers',
                    'Anyone passionate about sustainability',
                  ].map(t => (
                    <li key={t} style={{ display: 'flex', gap: 14, marginBottom: 6 }}>
                      <span style={{ color: course.color, fontSize: 12 }}>✦</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CURRICULUM */}
            {tab === 'curriculum' && (
              <div>
                <SectionHeader text={`Curriculum · ${course.topics.length} topics`}/>

                <div style={{ marginBottom: enrolled ? 0 : 8 }}>
                  {course.topics
                    .slice(0, enrolled ? course.topics.length : PREVIEW_COUNT)
                    .map((t, i) => (
                      <TopicRow
                        key={i}
                        roman={toRoman(i + 1)}
                        text={t}
                        accent={course.color}
                        isFirst={i === 0}
                      />
                    ))}
                </div>

                {/* Locked overlay */}
                {!enrolled && course.topics.length > PREVIEW_COUNT && (
                  <div style={{
                    marginTop: 24,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {/* Blurred peek */}
                    <div style={{
                      filter: 'blur(5px)',
                      opacity: 0.6,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}>
                      {course.topics.slice(PREVIEW_COUNT, PREVIEW_COUNT + 3).map((t, i) => (
                        <TopicRow
                          key={i}
                          roman={toRoman(PREVIEW_COUNT + i + 1)}
                          text={t}
                          accent={course.color}
                          isFirst={false}
                        />
                      ))}
                    </div>

                    {/* Lock card */}
                    <div style={{
                      position: 'absolute',
                      top: '50%', left: 0, right: 0,
                      transform: 'translateY(-50%)',
                      background: 'rgba(247,243,236,0.96)',
                      backdropFilter: 'blur(6px)',
                      border: `1px solid ${course.color}33`,
                      borderTop: `3px solid ${course.color}`,
                      padding: '26px 22px 24px',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        fontFamily: BODY,
                        fontSize: 9, fontWeight: 700,
                        color: course.color,
                        letterSpacing: '0.4em',
                        textTransform: 'uppercase',
                        marginBottom: 8,
                      }}>
                        ✦ Locked
                      </div>
                      <div style={{
                        fontFamily: DISPLAY,
                        fontStyle: 'italic',
                        fontSize: 22,
                        color: 'var(--forest)',
                        fontWeight: 500,
                        lineHeight: 1.25,
                        marginBottom: 8,
                      }}>
                        {course.topics.length - PREVIEW_COUNT} more topics await.
                      </div>
                      <p style={{
                        fontFamily: DISPLAY,
                        fontStyle: 'italic',
                        fontSize: 14,
                        color: 'var(--charcoal)',
                        opacity: 0.7,
                        margin: '0 0 18px',
                        lineHeight: 1.5,
                      }}>
                        Enroll to unlock the full curriculum.
                      </p>
                      <PrimaryButton
                        onClick={() => setShowReg(true)}
                        label={`Enroll · ₹${course.fee.toLocaleString()}`}
                        arrow="→"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TRAINER */}
            {tab === 'trainer' && (
              <div>
                <SectionHeader text="Course Director"/>

                {/* Editorial trainer card */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  marginBottom: 24,
                }}>
                  {/* Name */}
                  <h2 style={{
                    fontFamily: DISPLAY,
                    fontSize: 28,
                    fontWeight: 400,
                    color: 'var(--forest)',
                    lineHeight: 1.1,
                    letterSpacing: '-0.01em',
                    margin: 0,
                  }}>
                    Dr. Sushanth <em style={{ color: 'var(--moss)', fontStyle: 'italic' }}>Gade</em>
                  </h2>

                  {/* Credentials in small caps */}
                  <div style={{
                    fontFamily: BODY,
                    fontSize: 10, fontWeight: 600,
                    color: 'var(--moss)',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    lineHeight: 1.6,
                  }}>
                    Dr (hc) · MSc · REnvP · IOSH<br/>
                    Certified True Advisor, US GBCI
                  </div>

                  {/* Bio — editorial italic */}
                  <p style={{
                    fontFamily: DISPLAY,
                    fontStyle: 'italic',
                    fontSize: 16,
                    color: 'var(--charcoal)',
                    opacity: 0.78,
                    lineHeight: 1.6,
                    margin: 0,
                  }}>
                    Founder &amp; Course Coordinator at Ashrita Institute for Waste Management &amp; Research, Hyderabad. Expert in environmental management, waste systems and sustainability governance.
                  </p>

                  {/* Contact block */}
                  <div style={{
                    marginTop: 6,
                    paddingTop: 18,
                    borderTop: '1px solid rgba(26,58,42,0.15)',
                  }}>
                    <div style={{
                      fontFamily: BODY,
                      fontSize: 9, fontWeight: 700,
                      color: 'var(--moss)',
                      letterSpacing: '0.34em',
                      textTransform: 'uppercase',
                      marginBottom: 10,
                    }}>
                      Direct contact
                    </div>
                    <div style={{
                      fontFamily: BODY,
                      fontSize: 14,
                      color: 'var(--forest)',
                      lineHeight: 1.8,
                    }}>
                      <a href="mailto:director@aiwmr.org" style={{ color: 'var(--forest)', textDecoration: 'none', borderBottom: '1px solid var(--moss)' }}>director@aiwmr.org</a><br/>
                      <a href="tel:+919676975725" style={{ color: 'var(--forest)', textDecoration: 'none', borderBottom: '1px solid var(--moss)' }}>+91 96769 75725</a>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Bottom CTA bar (fixed, only when not enrolled) ── */}
      {!enrolled && !showReg && (
        <div style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          padding: 'calc(14px) 20px calc(14px + var(--safe-bottom))',
          background: 'rgba(247,243,236,0.92)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(26,58,42,0.12)',
          zIndex: 100,
          animation: 'fadeUpSoft 0.5s ease 0.6s both',
        }}>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <PrimaryButton
              onClick={() => setShowReg(true)}
              label={`Enroll · ₹${course.fee.toLocaleString()}`}
              arrow="→"
            />
          </div>
        </div>
      )}

      {/* ── Registration sheet ── */}
      {showReg && (
        <RegSheet
          step={step}
          setStep={setStep}
          form={form}
          upd={upd}
          focused={focused}
          setFocused={setFocused}
          batches={liveBatches}
          batchesLoading={batchesLoading}
          onPickBatch={(id) => { setSelectedBatchId(id); setStep(3); }}
          course={course}
          gst={gst}
          paying={paying}
          payError={payError}
          onPay={handlePay}
          onClose={closeSheet}
        />
      )}

      {/* Pre-course instructions modal — one-time per user */}
      <PreCourseInstructionsModal userId={user?.id ?? 'guest'}/>
    </ParchmentBackdrop>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const Tag: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span style={{
    fontFamily: BODY,
    fontSize: 10, fontWeight: 600,
    color,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    padding: '5px 12px',
    background: 'rgba(255,255,255,0.5)',
    border: `1px solid ${color}33`,
    borderRadius: 2,
  }}>
    {text}
  </span>
);

const SectionHeader: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  }}>
    <span style={{
      fontFamily: BODY,
      fontSize: 10, fontWeight: 700,
      color: 'var(--forest)',
      letterSpacing: '0.36em',
      textTransform: 'uppercase',
    }}>{text}</span>
    <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
  </div>
);

interface StatBlockProps { eyebrow: string; figure: string; caption: string; }
const StatBlock: React.FC<StatBlockProps> = ({ eyebrow, figure, caption }) => (
  <div style={{
    paddingTop: 14,
    borderTop: '1px solid rgba(26,58,42,0.18)',
  }}>
    <div style={{
      fontFamily: BODY,
      fontSize: 9, fontWeight: 700,
      color: 'var(--moss)',
      letterSpacing: '0.32em',
      textTransform: 'uppercase',
      marginBottom: 6,
    }}>
      {eyebrow}
    </div>
    <div style={{
      fontFamily: DISPLAY,
      fontSize: 22,
      fontWeight: 400,
      color: 'var(--forest)',
      lineHeight: 1.05,
      letterSpacing: '-0.018em',
    }}>
      {figure}
    </div>
    <div style={{
      fontFamily: DISPLAY,
      fontStyle: 'italic',
      fontSize: 12,
      color: 'var(--charcoal)',
      opacity: 0.55,
      marginTop: 4,
      lineHeight: 1.3,
    }}>
      {caption}
    </div>
  </div>
);

interface TopicRowProps { roman: string; text: string; accent: string; isFirst: boolean; }
const TopicRow: React.FC<TopicRowProps> = ({ roman, text, accent, isFirst }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: 18,
    padding: '14px 0',
    borderTop: isFirst ? '1px solid rgba(26,58,42,0.15)' : 'none',
    borderBottom: '1px solid rgba(26,58,42,0.15)',
  }}>
    <span style={{
      fontFamily: DISPLAY,
      fontStyle: 'italic',
      fontSize: 16,
      color: accent,
      minWidth: 42,
      opacity: 0.85,
      lineHeight: 1.4,
    }}>
      {roman.toLowerCase()}.
    </span>
    <span style={{
      flex: 1,
      fontFamily: DISPLAY,
      fontSize: 15,
      color: 'var(--charcoal)',
      lineHeight: 1.4,
    }}>
      {text}
    </span>
  </div>
);

// ─── Registration sheet ──────────────────────────────────────────────────────

interface RegSheetProps {
  step: Step;
  setStep: (s: Step) => void;
  form: RegistrationForm;
  upd: (k: keyof RegistrationForm, v: string) => void;
  focused: string | null;
  setFocused: (s: string | null) => void;
  batches: Batch[];
  batchesLoading: boolean;
  onPickBatch: (id: number) => void;
  course: Course;
  gst: number;
  paying: boolean;
  payError: string | null;
  onPay: () => void;
  onClose: () => void;
}

const RegSheet: React.FC<RegSheetProps> = ({
  step, setStep, form, upd, focused, setFocused,
  batches, batchesLoading, onPickBatch,
  course, gst, paying, payError, onPay, onClose,
}) => {
  const stepLabel = step === 1 ? 'Your details.' : step === 2 ? 'Pick a batch.' : 'Confirm & pay.';
  const stepEyebrow = `STEP ${toRoman(step)} OF III`;
  const stepNote = step === 1
    ? 'We use these to issue your registration & certificate.'
    : step === 2
      ? 'Select the cohort that fits your schedule.'
      : 'Secured by Razorpay.';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(13,29,21,0.6)', backdropFilter: 'blur(4px)' }}/>

      <div style={{
        background: 'var(--cream)',
        padding: '28px 26px calc(36px + var(--safe-bottom))',
        maxHeight: '88vh',
        overflowY: 'auto',
        animation: 'slideUp 0.4s cubic-bezier(0.34, 1.2, 0.64, 1)',
        position: 'relative',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Drag handle */}
        <div aria-hidden style={{
          width: 40, height: 3,
          background: 'rgba(26,58,42,0.25)',
          borderRadius: 2,
          margin: '0 auto 22px',
        }}/>

        {/* Close button (top right) */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 22, right: 22,
            background: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(26,58,42,0.12)',
            borderRadius: 2,
            padding: '6px 10px',
            cursor: 'pointer',
            fontFamily: DISPLAY,
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--moss)',
          }}>
          ✕
        </button>

        {/* Eyebrow */}
        <div key={`eye-${step}`} style={{
          fontFamily: BODY,
          fontSize: 10, fontWeight: 600,
          color: course.color,
          letterSpacing: '0.34em',
          textTransform: 'uppercase',
          marginBottom: 12,
          animation: 'fadeUpSoft 0.4s ease both',
        }}>
          — {stepEyebrow}
        </div>

        {/* Headline */}
        <h2 key={`head-${step}`} style={{
          fontFamily: DISPLAY,
          fontSize: 'clamp(32px, 9vw, 44px)',
          color: 'var(--forest)',
          fontWeight: 400,
          lineHeight: 1.0,
          letterSpacing: '-0.022em',
          margin: 0, marginBottom: 14,
          animation: 'fadeUpSoft 0.5s ease 0.05s both',
        }}>
          <em style={{ fontStyle: 'italic', color: 'var(--moss)' }}>{stepLabel}</em>
        </h2>

        <p key={`note-${step}`} style={{
          fontFamily: DISPLAY,
          fontStyle: 'italic',
          fontSize: 14,
          color: 'var(--charcoal)',
          opacity: 0.65,
          margin: '0 0 22px',
          animation: 'fadeUpSoft 0.5s ease 0.12s both',
        }}>
          {stepNote}
        </p>

        {/* Progress rule */}
        <div style={{
          display: 'flex',
          gap: 6,
          marginBottom: 28,
          animation: 'fadeUpSoft 0.5s ease 0.15s both',
        }}>
          {([1, 2, 3] as Step[]).map(s => (
            <div key={s} style={{
              flex: 1,
              height: 2,
              background: s <= step ? course.color : 'rgba(26,58,42,0.15)',
              transition: 'background 0.3s',
            }}/>
          ))}
        </div>

        {/* ── STEP 1: Personal details ── */}
        {step === 1 && (
          <div key="step1">
            <Field id="reg-name"  label="Full Name"    value={form.name}  onChange={v => upd('name', v)}  focused={focused} setFocused={setFocused} autoComplete="name"  required delay={0.2}/>
            <Field id="reg-email" label="Email"        type="email" value={form.email} onChange={v => upd('email', v)} focused={focused} setFocused={setFocused} autoComplete="email" required delay={0.26}/>
            <Field id="reg-phone" label="Phone"        type="tel"   value={form.phone} onChange={v => upd('phone', v)} focused={focused} setFocused={setFocused} autoComplete="tel"   required delay={0.32}/>
            <Field id="reg-org"   label="Organization" value={form.org}         onChange={v => upd('org', v)}         focused={focused} setFocused={setFocused} placeholder="optional" delay={0.38}/>
            <Field id="reg-desig" label="Designation"  value={form.designation} onChange={v => upd('designation', v)} focused={focused} setFocused={setFocused} placeholder="optional" delay={0.44}/>

            <div style={{ marginTop: 18, animation: 'fadeUpSoft 0.5s ease 0.5s both' }}>
              <PrimaryButton onClick={() => setStep(2)} label="Continue to Batch"/>
            </div>
          </div>
        )}

        {/* ── STEP 2: Batch selection ── */}
        {step === 2 && (
          <div key="step2">
            {batchesLoading ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 0',
                fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
                color: 'var(--moss)',
              }}>
                Loading available cohorts…
              </div>
            ) : batches.length === 0 ? (
              <div style={{
                fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
                color: 'var(--charcoal)', opacity: 0.6,
              }}>
                No cohorts are open right now. Please contact the office.
              </div>
            ) : batches.map((b, i) => (
              <button
                key={b.id}
                onClick={() => onPickBatch(b.id)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(26,58,42,0.15)',
                  padding: '16px 18px',
                  marginBottom: 10,
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: 2,
                  animation: `fadeUpSoft 0.5s ease ${0.18 + i * 0.05}s both`,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = course.color; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(26,58,42,0.15)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: DISPLAY,
                      fontStyle: 'italic',
                      fontSize: 17,
                      color: 'var(--forest)',
                      fontWeight: 500,
                      lineHeight: 1.2,
                    }}>{b.label}</div>
                    <div style={{
                      fontFamily: BODY,
                      fontSize: 11,
                      color: 'var(--moss)',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      marginTop: 8,
                    }}>
                      {b.date} · {b.time}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: DISPLAY,
                    fontStyle: 'italic',
                    fontSize: 13,
                    color: b.seats <= 3 ? 'var(--red)' : 'var(--moss)',
                    whiteSpace: 'nowrap',
                  }}>
                    {b.seats} seats
                  </div>
                </div>
              </button>
            ))}

            <div style={{ textAlign: 'center', marginTop: 18 }}>
              <InlineLink onClick={() => setStep(1)}>
                <span style={{ fontFamily: DISPLAY, fontStyle: 'italic' }}>↩</span>{' '}back to details
              </InlineLink>
            </div>
          </div>
        )}

        {/* ── STEP 3: Payment ── */}
        {step === 3 && (
          <div key="step3">
            {/* Order summary */}
            <div style={{
              borderTop: '1px solid rgba(26,58,42,0.18)',
              animation: 'fadeUpSoft 0.5s ease 0.2s both',
            }}>
              {([
                ['Course Fee',        `₹${course.fee.toLocaleString()}`],
                ['GST (18%)',         `₹${gst.toLocaleString()}`],
              ] as [string, string][]).map(([l, v]) => (
                <div key={l} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  padding: '14px 0',
                  borderBottom: '1px solid rgba(26,58,42,0.12)',
                }}>
                  <span style={{
                    fontFamily: BODY,
                    fontSize: 10, fontWeight: 600,
                    color: 'var(--moss)',
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                  }}>{l}</span>
                  <span style={{
                    fontFamily: DISPLAY,
                    fontSize: 16,
                    color: 'var(--charcoal)',
                  }}>{v}</span>
                </div>
              ))}

              {/* Total */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                padding: '16px 0 4px',
              }}>
                <span style={{
                  fontFamily: BODY,
                  fontSize: 10, fontWeight: 700,
                  color: 'var(--forest)',
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                }}>Total</span>
                <span style={{
                  fontFamily: DISPLAY,
                  fontStyle: 'italic',
                  fontSize: 32,
                  color: 'var(--forest)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                }}>
                  ₹{(course.fee + gst).toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{ height: 24 }}/>

            {payError && <ErrorBar text={payError}/>}

            {isRazorpayConfigured ? (
              <>
                <div style={{ animation: 'fadeUpSoft 0.5s ease 0.3s both' }}>
                  <PrimaryButton
                    onClick={onPay}
                    loading={paying}
                    label={`Pay ₹${(course.fee + gst).toLocaleString()}`}
                  />
                </div>
                <div style={{
                  marginTop: 14,
                  textAlign: 'center',
                  fontFamily: DISPLAY,
                  fontStyle: 'italic',
                  fontSize: 12,
                  color: 'var(--moss)',
                  opacity: 0.65,
                  letterSpacing: '0.02em',
                  animation: 'fadeUpSoft 0.5s ease 0.4s both',
                }}>
                  ✦ Secured by Razorpay · 256-bit SSL
                </div>
              </>
            ) : (
              <div style={{
                padding: '20px 18px',
                background: 'rgba(45,90,61,0.04)',
                borderLeft: '2px solid var(--moss)',
              }}>
                <div style={{
                  fontFamily: BODY,
                  fontSize: 10, fontWeight: 700,
                  color: 'var(--moss)',
                  letterSpacing: '0.34em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}>
                  ✦ Bank transfer
                </div>
                <p style={{
                  fontFamily: DISPLAY,
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--charcoal)',
                  opacity: 0.78,
                  margin: '0 0 12px',
                  lineHeight: 1.55,
                }}>
                  Online payment is being set up. Please contact us to complete your enrollment manually.
                </p>
                <div style={{
                  fontFamily: BODY,
                  fontSize: 13,
                  color: 'var(--forest)',
                  fontWeight: 600,
                  lineHeight: 1.8,
                }}>
                  director@aiwmr.org<br/>+91 96769 75725
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 22 }}>
              <InlineLink onClick={() => setStep(2)}>
                <span style={{ fontFamily: DISPLAY, fontStyle: 'italic' }}>↩</span>{' '}back to batch
              </InlineLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailScreen;
