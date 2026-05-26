/**
 * HomeScreen — editorial dashboard with three states.
 *
 * 1. Admin → stats + recent registrations + quick actions
 * 2. Enrolled student → active course + performance shortcut + stats + explore
 * 3. Not-enrolled student → "Begin your journey" CTA + featured courses
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ParchmentBackdrop from '../components/ParchmentBackdrop';
import { DISPLAY, BODY } from '../components/AuthShell';
import { PrimaryButton } from '../components/AuthForm';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import type { Course } from '../types';

interface Props { onNavigate: (screen: string, data?: unknown) => void; }

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function firstName(full: string): string {
  return full.split(' ')[0] || full;
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

// ─── Shared editorial top bar ────────────────────────────────────────────────

interface TopBarProps {
  eyebrow: string;
  greeting: string;
  name: string;
  onSignOut: () => void;
}
const TopBar: React.FC<TopBarProps> = ({ eyebrow, greeting, name, onSignOut }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    animation: 'fadeUpSoft 0.5s ease 0s both',
  }}>
    <div>
      <div style={{
        fontFamily: BODY,
        fontSize: 10, fontWeight: 600,
        color: 'var(--moss)',
        letterSpacing: '0.34em',
        textTransform: 'uppercase',
        marginBottom: 8,
      }}>
        — {eyebrow}
      </div>
      <div style={{
        fontFamily: DISPLAY,
        fontStyle: 'italic',
        fontSize: 17,
        color: 'var(--moss)',
        opacity: 0.85,
        lineHeight: 1.3,
        marginBottom: 4,
      }}>
        {greeting},
      </div>
      <div style={{
        fontFamily: DISPLAY,
        fontSize: 'clamp(34px, 9vw, 48px)',
        color: 'var(--forest)',
        fontWeight: 400,
        lineHeight: 1.0,
        letterSpacing: '-0.022em',
      }}>
        {firstName(name)}<span style={{ color: 'var(--moss)', fontStyle: 'italic' }}>.</span>
      </div>
    </div>
    <button
      onClick={onSignOut}
      style={{
        fontFamily: DISPLAY,
        fontStyle: 'italic',
        fontSize: 13,
        color: 'var(--moss)',
        background: 'rgba(255,255,255,0.5)',
        border: '1px solid rgba(26,58,42,0.12)',
        padding: '7px 12px',
        borderRadius: 2,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
      }}
    >
      <Icon name="logout" size={13} color="var(--moss)"/>
      <span>sign out</span>
    </button>
  </div>
);

// ─── Decorative rule ─────────────────────────────────────────────────────────
const Rule: React.FC = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28,
    animation: 'fadeUpSoft 0.5s ease 0.3s both',
  }}>
    <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
    <span style={{ fontFamily: DISPLAY, fontSize: 13, color: 'var(--moss)', opacity: 0.7 }}>✦</span>
    <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
  </div>
);

// ─── Section header ──────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ text: string; action?: { label: string; onTap: () => void } }> = ({ text, action }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
    <span style={{
      fontFamily: BODY,
      fontSize: 10, fontWeight: 700,
      color: 'var(--forest)',
      letterSpacing: '0.36em',
      textTransform: 'uppercase',
    }}>{text}</span>
    <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
    {action && (
      <button onClick={action.onTap} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        fontFamily: DISPLAY,
        fontStyle: 'italic',
        fontSize: 13,
        color: 'var(--moss)',
        textDecoration: 'underline',
        textDecorationStyle: 'dotted',
        textUnderlineOffset: '3px',
      }}>{action.label}</button>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN HOME
// ═══════════════════════════════════════════════════════════════════════════

interface AdminStats {
  totalStudents: number;
  paidEnrollments: number;
  totalRevenue: number;
  recentRegistrations: { name: string; course: string; status: string; date: string }[];
}

const AdminHome: React.FC<{ onNavigate: (s: string) => void; signOut: () => void }> = ({ onNavigate, signOut }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [studentsRes, regsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'trainee'),
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
        totalStudents: studentsRes.count ?? 0,
        paidEnrollments: paid.length,
        totalRevenue: revenue,
        recentRegistrations: regs.map(r => ({
          name:   r.profiles?.name ?? '—',
          course: r.courses?.title ?? '—',
          status: r.payment_status,
          date:   new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        })),
      });
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <ParchmentBackdrop decorations="full">
      <div className="screen" style={{ position: 'absolute', inset: 0 }}>
        <div style={{
          maxWidth: 540, margin: '0 auto',
          padding: 'calc(28px + var(--safe-top)) 28px 40px',
        }}>
          <TopBar eyebrow="Admin Dashboard" greeting="Welcome back" name="AIWMR" onSignOut={signOut}/>

          <p style={{
            fontFamily: DISPLAY,
            fontStyle: 'italic',
            fontSize: 15,
            color: 'var(--charcoal)',
            opacity: 0.65,
            margin: '0 0 28px',
            animation: 'fadeUpSoft 0.5s ease 0.2s both',
          }}>
            Manage students, sessions, certificates and rewards.
          </p>

          <Rule/>

          {loading ? (
            <div style={{
              fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
              color: 'var(--moss)', textAlign: 'center', padding: '40px 0',
            }}>
              Loading academy statistics…
            </div>
          ) : (
            <>
              {/* Stats block 2×2 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                rowGap: 22, columnGap: 24,
                marginBottom: 40,
                animation: 'fadeUpSoft 0.6s ease 0.35s both',
              }}>
                <StatBlock eyebrow="Trainees" figure={String(stats?.totalStudents ?? 0)} caption="registered to date"/>
                <StatBlock eyebrow="Enrolled" figure={String(stats?.paidEnrollments ?? 0)} caption="paid this period"/>
                <StatBlock eyebrow="Revenue"  figure={`₹${(stats?.totalRevenue ?? 0).toLocaleString()}`} caption="from confirmed payments"/>
                <StatBlock eyebrow="Programs" figure="15" caption="ISO-certified courses"/>
              </div>

              {/* Recent registrations */}
              <section style={{ marginBottom: 40, animation: 'fadeUpSoft 0.6s ease 0.45s both' }}>
                <SectionHeader text="Recent Registrations"/>
                {(stats?.recentRegistrations.length ?? 0) === 0 ? (
                  <p style={{
                    fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
                    color: 'var(--charcoal)', opacity: 0.5, margin: 0,
                  }}>No registrations yet.</p>
                ) : stats?.recentRegistrations.map((r, i, arr) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    padding: '12px 0',
                    borderTop: i === 0 ? '1px solid rgba(26,58,42,0.15)' : 'none',
                    borderBottom: '1px solid rgba(26,58,42,0.15)',
                  }}>
                    <span style={{
                      fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
                      color: 'var(--moss)', minWidth: 28, opacity: 0.85,
                    }}>{toRoman(i + 1).toLowerCase()}.</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: DISPLAY, fontSize: 15, color: 'var(--charcoal)', lineHeight: 1.3 }}>
                        {r.name}
                      </div>
                      <div style={{
                        fontFamily: BODY, fontSize: 10, color: 'var(--moss)',
                        letterSpacing: '0.18em', textTransform: 'uppercase',
                        marginTop: 4, opacity: 0.8,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {r.course}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 13,
                        color: r.status === 'paid' ? 'var(--leaf)' : 'var(--amber)',
                        textTransform: 'lowercase',
                      }}>{r.status}</div>
                      <div style={{
                        fontFamily: BODY, fontSize: 10, color: 'var(--moss)',
                        letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 3, opacity: 0.7,
                      }}>{r.date}</div>
                    </div>
                    {/* suppress unused arr lint */}
                    {arr.length}
                  </div>
                ))}
              </section>

              {/* Quick actions */}
              <section style={{ animation: 'fadeUpSoft 0.6s ease 0.55s both' }}>
                <SectionHeader text="Quick Actions"/>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}>
                  {([
                    ['All Courses', 'courses'],
                    ['Sessions',    'adminSession'],
                    ['Students',    'adminStudents'],
                    ['Rewards',     'adminRewards'],
                  ] as [string, string][]).map(([label, route]) => (
                    <button key={route} onClick={() => onNavigate(route)}
                      style={{
                        padding: '16px 14px',
                        background: 'rgba(255,255,255,0.5)',
                        border: '1px solid rgba(26,58,42,0.15)',
                        borderRadius: 2,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'border-color 0.2s ease',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--forest)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(26,58,42,0.15)'; }}>
                      <div style={{
                        fontFamily: DISPLAY,
                        fontStyle: 'italic',
                        fontSize: 17,
                        color: 'var(--forest)',
                        fontWeight: 500,
                      }}>{label}</div>
                      <div style={{
                        fontFamily: BODY,
                        fontSize: 9, fontWeight: 600,
                        color: 'var(--moss)',
                        letterSpacing: '0.28em',
                        textTransform: 'uppercase',
                        marginTop: 4,
                        opacity: 0.7,
                      }}>
                        open →
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </ParchmentBackdrop>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STUDENT — NOT ENROLLED
// ═══════════════════════════════════════════════════════════════════════════

const NotEnrolledHome: React.FC<{ name: string; courses: Course[]; onNavigate: (s: string, d?: unknown) => void; signOut: () => void }> = ({
  name, courses, onNavigate, signOut,
}) => (
  <ParchmentBackdrop decorations="full">
    <div className="screen" style={{ position: 'absolute', inset: 0 }}>
      <div style={{
        maxWidth: 540, margin: '0 auto',
        padding: 'calc(28px + var(--safe-top)) 28px 40px',
      }}>
        <TopBar eyebrow={getGreeting()} greeting="Welcome" name={name || 'Friend'} onSignOut={signOut}/>

        <p style={{
          fontFamily: DISPLAY,
          fontStyle: 'italic',
          fontSize: 17,
          color: 'var(--charcoal)',
          opacity: 0.72,
          lineHeight: 1.5,
          margin: '0 0 28px',
          maxWidth: 380,
          animation: 'fadeUpSoft 0.5s ease 0.2s both',
        }}>
          You haven't enrolled in a program yet. Explore our ISO-certified courses to begin.
        </p>

        <div style={{ marginBottom: 32, animation: 'fadeUpSoft 0.6s ease 0.3s both' }}>
          <PrimaryButton onClick={() => onNavigate('courses')} label="Browse Courses" arrow="→"/>
        </div>

        <Rule/>

        <SectionHeader text="Featured Programs" action={{ label: 'see all', onTap: () => onNavigate('courses') }}/>

        {courses.slice(0, 2).map((c, i) => (
          <CompactCourseRow key={c.id} course={c} index={i + 1} isFirst={i === 0} onTap={() => onNavigate('courseDetail', c)}/>
        ))}
      </div>
    </div>
  </ParchmentBackdrop>
);

// ═══════════════════════════════════════════════════════════════════════════
// STUDENT — ENROLLED
// ═══════════════════════════════════════════════════════════════════════════

interface EnrollmentData {
  course: Course;
  regId: string;
  completedModules: number;
  totalModules: number;
  attendanceCount: number;
  batchLabel: string;
  batchTime: string;
}

const EnrolledHome: React.FC<{
  name: string;
  enrollment: EnrollmentData;
  courses: Course[];
  onNavigate: (s: string, d?: unknown) => void;
  signOut: () => void;
}> = ({ name, enrollment, courses, onNavigate, signOut }) => {
  const { course, completedModules, totalModules, attendanceCount, batchTime } = enrollment;
  const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <ParchmentBackdrop decorations="full">
      <div className="screen" style={{ position: 'absolute', inset: 0 }}>
        <div style={{
          maxWidth: 540, margin: '0 auto',
          padding: 'calc(28px + var(--safe-top)) 28px 40px',
        }}>
          <TopBar eyebrow={getGreeting()} greeting="Welcome back" name={name} onSignOut={signOut}/>

          {/* ── Active course card ── */}
          <div style={{
            position: 'relative',
            padding: '22px 22px 20px',
            marginBottom: 24,
            background: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(26,58,42,0.15)',
            animation: 'fadeUpSoft 0.6s ease 0.2s both',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: BODY,
                  fontSize: 9, fontWeight: 700,
                  color: course.color,
                  letterSpacing: '0.34em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}>
                  ✦ In Progress
                </div>
                <h2 style={{
                  fontFamily: DISPLAY,
                  fontSize: 22,
                  color: 'var(--forest)',
                  fontWeight: 400,
                  lineHeight: 1.2,
                  letterSpacing: '-0.012em',
                  margin: 0,
                }}>
                  {course.title}<span style={{ color: 'var(--moss)', fontStyle: 'italic' }}>.</span>
                </h2>
              </div>
              <div style={{ fontSize: 34, opacity: 0.7, flexShrink: 0 }}>{course.icon}</div>
            </div>

            {/* Progress */}
            <div style={{ marginTop: 18 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 6,
              }}>
                <span style={{
                  fontFamily: BODY,
                  fontSize: 10, fontWeight: 600,
                  color: 'var(--moss)',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                }}>
                  Module {completedModules} of {totalModules}
                </span>
                <span style={{
                  fontFamily: DISPLAY,
                  fontStyle: 'italic',
                  fontSize: 18,
                  color: 'var(--forest)',
                  fontWeight: 500,
                }}>
                  {progress}%
                </span>
              </div>
              <div style={{
                background: 'rgba(26,58,42,0.1)',
                height: 3,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0,
                  height: 3,
                  background: 'var(--leaf)',
                  width: `${progress}%`,
                  transition: 'width 0.6s ease',
                }}/>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <PrimaryButton onClick={() => onNavigate('learning')} label="Continue Learning"/>
            </div>
          </div>

          {/* ── Performance shortcut ── */}
          <button
            onClick={() => onNavigate('performance')}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid rgba(26,58,42,0.15)',
              padding: '16px 18px',
              marginBottom: 16,
              cursor: 'pointer',
              borderRadius: 2,
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              animation: 'fadeUpSoft 0.6s ease 0.28s both',
              transition: 'border-color 0.2s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--forest)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(26,58,42,0.15)'; }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: BODY,
                fontSize: 9, fontWeight: 700,
                color: 'var(--moss)',
                letterSpacing: '0.34em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}>
                — Performance
              </div>
              <div style={{
                fontFamily: DISPLAY,
                fontStyle: 'italic',
                fontSize: 16,
                color: 'var(--forest)',
                fontWeight: 500,
              }}>
                Your scores, topics & rewards
              </div>
            </div>
            <span style={{
              fontFamily: DISPLAY,
              fontStyle: 'italic',
              fontSize: 20,
              color: 'var(--moss)',
            }}>→</span>
          </button>

          {/* ── Mini stats ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            rowGap: 22, columnGap: 24,
            marginBottom: 32,
            animation: 'fadeUpSoft 0.6s ease 0.35s both',
          }}>
            <StatBlock eyebrow="Sessions Attended" figure={String(attendanceCount)} caption="live classes"/>
            <StatBlock eyebrow="Modules Complete"  figure={`${completedModules}/${totalModules}`} caption={`${progress}% of course`}/>
            {batchTime && (
              <div style={{
                gridColumn: '1 / -1',
                paddingTop: 14,
                borderTop: '1px solid var(--amber)',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 14,
              }}>
                <div>
                  <div style={{
                    fontFamily: BODY,
                    fontSize: 9, fontWeight: 700,
                    color: 'var(--amber)',
                    letterSpacing: '0.34em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}>
                    ✦ Next Live Session
                  </div>
                  <div style={{
                    fontFamily: DISPLAY,
                    fontStyle: 'italic',
                    fontSize: 17,
                    color: 'var(--forest)',
                    fontWeight: 500,
                  }}>
                    {batchTime}
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('attendance')}
                  style={{
                    fontFamily: DISPLAY,
                    fontStyle: 'italic',
                    fontSize: 14,
                    color: 'var(--amber)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textDecorationStyle: 'dotted',
                    textUnderlineOffset: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  attend →
                </button>
              </div>
            )}
          </div>

          <Rule/>

          {/* ── Explore more ── */}
          <SectionHeader text="Explore More" action={{ label: 'see all', onTap: () => onNavigate('courses') }}/>

          {courses.filter(c => c.id !== course.id).slice(0, 2).map((c, i) => (
            <CompactCourseRow key={c.id} course={c} index={i + 1} isFirst={i === 0} onTap={() => onNavigate('courseDetail', c)}/>
          ))}
        </div>
      </div>
    </ParchmentBackdrop>
  );
};

// ─── Shared sub-components ───────────────────────────────────────────────────

interface StatBlockProps { eyebrow: string; figure: string; caption: string; }
const StatBlock: React.FC<StatBlockProps> = ({ eyebrow, figure, caption }) => (
  <div style={{
    paddingTop: 14,
    borderTop: '1px solid rgba(26,58,42,0.2)',
  }}>
    <div style={{
      fontFamily: BODY,
      fontSize: 9, fontWeight: 700,
      color: 'var(--moss)',
      letterSpacing: '0.32em',
      textTransform: 'uppercase',
      marginBottom: 6,
    }}>{eyebrow}</div>
    <div style={{
      fontFamily: DISPLAY,
      fontSize: 26,
      fontWeight: 400,
      color: 'var(--forest)',
      lineHeight: 1.05,
      letterSpacing: '-0.018em',
    }}>{figure}</div>
    <div style={{
      fontFamily: DISPLAY,
      fontStyle: 'italic',
      fontSize: 12,
      color: 'var(--charcoal)',
      opacity: 0.55,
      marginTop: 4,
      lineHeight: 1.3,
    }}>{caption}</div>
  </div>
);

interface CompactCourseRowProps {
  course: Course;
  index: number;
  isFirst: boolean;
  onTap: () => void;
}
const CompactCourseRow: React.FC<CompactCourseRowProps> = ({ course, index, isFirst, onTap }) => (
  <div
    onClick={onTap}
    role="button"
    tabIndex={0}
    onKeyDown={e => { if (e.key === 'Enter') onTap(); }}
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      padding: '18px 0',
      borderTop: isFirst ? '1px solid rgba(26,58,42,0.18)' : 'none',
      borderBottom: '1px solid rgba(26,58,42,0.18)',
      cursor: 'pointer',
      animation: `fadeUpSoft 0.5s ease ${0.5 + index * 0.06}s both`,
    }}
  >
    <span style={{
      fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 16,
      color: course.color, opacity: 0.85, minWidth: 28, lineHeight: 1.4,
    }}>{toRoman(index).toLowerCase()}.</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontFamily: BODY, fontSize: 9, fontWeight: 700,
        color: course.color, letterSpacing: '0.32em',
        textTransform: 'uppercase', marginBottom: 6,
      }}>{course.category}</div>
      <div style={{
        fontFamily: DISPLAY, fontSize: 17,
        color: 'var(--forest)', fontWeight: 400,
        lineHeight: 1.25, letterSpacing: '-0.01em',
        marginBottom: 6,
      }}>{course.title}<span style={{ color: 'var(--moss)', fontStyle: 'italic' }}>.</span></div>
      <div style={{
        fontFamily: BODY, fontSize: 10, fontWeight: 600,
        color: 'var(--moss)', letterSpacing: '0.22em',
        textTransform: 'uppercase',
      }}>
        {course.hours} · {course.mode}
      </div>
    </div>
    <div style={{ flexShrink: 0, textAlign: 'right' }}>
      <div style={{
        fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 18,
        color: 'var(--forest)', fontWeight: 500, letterSpacing: '-0.012em',
      }}>
        ₹{course.fee.toLocaleString()}
      </div>
      <div style={{
        fontFamily: BODY, fontSize: 10, fontWeight: 600,
        color: 'var(--moss)', letterSpacing: '0.18em',
        textTransform: 'uppercase', marginTop: 2, opacity: 0.7,
      }}>
        {course.seats - course.filled} seats
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Main router
// ═══════════════════════════════════════════════════════════════════════════

const HomeScreen: React.FC<Props> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();
  const [loading, setLoading]       = useState(true);
  const [courses, setCourses]       = useState<Course[]>([]);
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: courseData } = await supabase
        .from('courses').select('*').eq('is_published', true).order('id').limit(5);
      if (courseData) setCourses(courseData.map(mapCourse));

      if (user.role === 'admin') { setLoading(false); return; }

      const { data: reg } = await supabase
        .from('registrations')
        .select('id, registration_id, access_granted, courses(*), batches(label, time_slot)')
        .eq('user_id', user.id)
        .eq('access_granted', true)
        .limit(1)
        .single();

      if (!reg) { setLoading(false); return; }

      const course = mapCourse(reg.courses);

      const [progressRes, attendanceRes, totalModsRes] = await Promise.all([
        supabase.from('user_progress').select('status').eq('user_id', user.id).eq('status', 'completed'),
        supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('registration_id', reg.id),
        supabase.from('modules').select('id', { count: 'exact', head: true }).eq('course_id', course.id),
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

  if (loading) {
    return (
      <ParchmentBackdrop decorations="full">
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 15,
          color: 'var(--moss)',
        }}>
          Loading your academy…
        </div>
      </ParchmentBackdrop>
    );
  }

  if (user?.role === 'admin')
    return <AdminHome onNavigate={onNavigate} signOut={signOut}/>;

  if (enrollment)
    return <EnrolledHome name={user?.name ?? ''} enrollment={enrollment} courses={courses} onNavigate={onNavigate} signOut={signOut}/>;

  return <NotEnrolledHome name={user?.name ?? ''} courses={courses} onNavigate={onNavigate} signOut={signOut}/>;
};

export default HomeScreen;
