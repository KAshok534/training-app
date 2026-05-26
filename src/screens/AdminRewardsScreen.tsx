/**
 * AdminRewardsScreen — editorial list of 90%+ achievers eligible for
 * institutional rewards (free internship / project report).
 *
 * Tap a row to expand and see Email / Call / WhatsApp quick-contact links
 * with a pre-filled message from Dr. Sushanth.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import ParchmentBackdrop from '../components/ParchmentBackdrop';
import { DISPLAY, BODY } from '../components/AuthShell';
import { InlineLink } from '../components/AuthForm';

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
}

type FilterTab = 'all' | 'week' | 'month';

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

const AdminRewardsScreen: React.FC<Props> = ({ onBack }) => {
  const [rows, setRows]         = useState<RewardRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<FilterTab>('all');
  const [search, setSearch]     = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('assessment_attempts')
      .select(`
        id, score_pct, attempted_at,
        profiles(name, email, phone),
        modules(title, courses(title))
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

  const weekCount  = rows.filter(r => now - new Date(r.attemptedAt).getTime() <= WEEK_MS).length;
  const monthCount = rows.filter(r => now - new Date(r.attemptedAt).getTime() <= MONTH_MS).length;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });

  return (
    <ParchmentBackdrop decorations="full">
      <div className="screen" style={{ position: 'absolute', inset: 0 }}>
        <div style={{
          maxWidth: 580, margin: '0 auto',
          padding: 'calc(24px + var(--safe-top)) 28px 40px',
        }}>

          {/* Top bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 28, animation: 'fadeUpSoft 0.5s ease 0s both',
          }}>
            <button onClick={onBack}
              style={{
                fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
                color: 'var(--moss)',
                background: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(26,58,42,0.12)',
                padding: '6px 14px', borderRadius: 2, cursor: 'pointer',
              }}>↩ admin</button>
            <button onClick={load}
              style={{
                fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 13,
                color: 'var(--moss)', background: 'none', border: 'none',
                padding: 0, cursor: 'pointer',
                textDecoration: 'underline', textDecorationStyle: 'dotted',
                textUnderlineOffset: '4px',
              }}>refresh</button>
          </div>

          <div style={{
            fontFamily: BODY,
            fontSize: 10, fontWeight: 700,
            color: 'var(--gold)',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            marginBottom: 14,
            animation: 'fadeUpSoft 0.5s ease 0.05s both',
          }}>
            ✦ Rewards
          </div>

          <h1 style={{
            fontFamily: DISPLAY,
            fontSize: 'clamp(34px, 9vw, 50px)',
            color: 'var(--forest)',
            fontWeight: 400,
            lineHeight: 0.96,
            letterSpacing: '-0.022em',
            margin: 0, marginBottom: 14,
            animation: 'fadeUpSoft 0.6s ease 0.1s both',
          }}>
            Outstanding<br/>
            <em style={{ fontStyle: 'italic', color: 'var(--moss)', fontWeight: 400 }}>achievers.</em>
          </h1>

          <p style={{
            fontFamily: DISPLAY, fontStyle: 'italic',
            fontSize: 15, color: 'var(--charcoal)', opacity: 0.65,
            margin: 0, marginBottom: 24,
            animation: 'fadeUpSoft 0.5s ease 0.18s both',
          }}>
            {rows.length} student{rows.length === 1 ? '' : 's'} earned 90%+ on a module assessment. Reach out to confirm their reward preference.
          </p>

          {/* Search */}
          {rows.length > 0 && (
            <div style={{
              marginBottom: 24,
              animation: 'fadeUpSoft 0.5s ease 0.24s both',
            }}>
              <label style={{
                fontFamily: BODY,
                fontSize: 10, fontWeight: 600,
                color: 'var(--moss)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 6,
              }}>Search</label>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="student, course, or module…"
                style={{
                  width: '100%', padding: '10px 0',
                  background: 'transparent', border: 'none',
                  borderBottom: searchFocused ? '1.5px solid var(--forest)' : '1px solid rgba(26,58,42,0.18)',
                  outline: 'none',
                  fontFamily: BODY, fontSize: 15,
                  color: 'var(--charcoal)',
                  transition: 'border-color 0.25s ease',
                }}
              />
            </div>
          )}

          {/* Filters */}
          {rows.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 18,
              marginBottom: 28, flexWrap: 'wrap',
              animation: 'fadeUpSoft 0.5s ease 0.3s both',
            }}>
              {([
                ['all',   'all time',  rows.length],
                ['month', 'this month', monthCount],
                ['week',  'this week',  weekCount],
              ] as [FilterTab, string, number][]).map(([f, label, count]) => {
                const active = filter === f;
                return (
                  <button key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      fontFamily: active ? DISPLAY : BODY,
                      fontSize: active ? 16 : 11,
                      fontStyle: active ? 'italic' : 'normal',
                      fontWeight: active ? 500 : 600,
                      color: active ? 'var(--forest)' : 'rgba(26,58,42,0.5)',
                      letterSpacing: active ? 0 : '0.22em',
                      textTransform: active ? 'none' : 'uppercase',
                      borderBottom: active ? '1.5px solid var(--moss)' : '1.5px solid transparent',
                      paddingBottom: 2,
                      transition: 'all 0.2s ease',
                    }}>
                    {active ? label : label.toUpperCase()} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Gold rule */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18,
            animation: 'fadeUpSoft 0.5s ease 0.36s both',
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.3)' }}/>
            <span style={{ fontFamily: DISPLAY, fontSize: 13, color: 'var(--gold)' }}>✦</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.3)' }}/>
          </div>

          {/* List */}
          {loading ? (
            <div style={{
              fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
              color: 'var(--moss)', textAlign: 'center', padding: '40px 0',
            }}>
              Loading reward recipients…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 15,
              color: 'var(--charcoal)', opacity: 0.6,
              textAlign: 'center', padding: '40px 0',
            }}>
              {search ? 'No rewards match your search.' : 'No reward winners yet — students who score 90%+ will appear here.'}
            </div>
          ) : filtered.map((r, i) => {
            const isOpen = expanded === r.attemptId;
            return (
              <div key={r.attemptId} style={{
                borderTop: i === 0 ? '1px solid rgba(201,168,76,0.3)' : 'none',
                borderBottom: '1px solid rgba(201,168,76,0.3)',
                animation: `fadeUpSoft 0.4s ease ${0.4 + i * 0.04}s both`,
              }}>
                <div
                  onClick={() => setExpanded(isOpen ? null : r.attemptId)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    padding: '18px 0',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{
                    fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 16,
                    color: 'var(--gold)', minWidth: 30, opacity: 0.9, flexShrink: 0,
                  }}>{toRoman(i + 1).toLowerCase()}.</span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: DISPLAY, fontSize: 17,
                      color: 'var(--forest)', fontWeight: 400, lineHeight: 1.3,
                      marginBottom: 4,
                    }}>
                      {r.studentName}
                    </div>
                    <div style={{
                      fontFamily: BODY, fontSize: 11,
                      color: 'var(--moss)', opacity: 0.85,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {r.studentEmail}
                    </div>
                    <div style={{
                      fontFamily: BODY, fontSize: 9, fontWeight: 600,
                      color: 'var(--moss)', letterSpacing: '0.22em',
                      textTransform: 'uppercase', marginTop: 8,
                    }}>
                      {r.moduleTitle}
                    </div>
                    <div style={{
                      fontFamily: BODY, fontSize: 9, fontWeight: 600,
                      color: 'var(--moss)', letterSpacing: '0.22em',
                      textTransform: 'uppercase', marginTop: 4, opacity: 0.7,
                    }}>
                      {r.courseTitle} · earned {formatDate(r.attemptedAt)}
                    </div>
                  </div>

                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{
                      fontFamily: DISPLAY,
                      fontStyle: 'italic',
                      fontSize: 26,
                      color: 'var(--gold)',
                      fontWeight: 500,
                      letterSpacing: '-0.015em',
                      lineHeight: 1.05,
                    }}>
                      {r.scorePct}%
                    </div>
                    <div style={{
                      fontFamily: BODY, fontSize: 9, fontWeight: 700,
                      color: 'var(--gold)',
                      letterSpacing: '0.32em',
                      textTransform: 'uppercase',
                      marginTop: 4,
                    }}>
                      ✦ reward
                    </div>
                  </div>
                </div>

                {/* Expanded — contact actions */}
                {isOpen && (
                  <div onClick={e => e.stopPropagation()} style={{
                    paddingBottom: 22,
                    animation: 'fadeUpSoft 0.3s ease both',
                  }}>
                    <div style={{
                      fontFamily: DISPLAY,
                      fontStyle: 'italic',
                      fontSize: 14,
                      color: 'var(--charcoal)',
                      opacity: 0.7,
                      lineHeight: 1.55,
                      marginBottom: 14,
                    }}>
                      Reach out with a pre-filled congratulatory message.
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, marginBottom: 14 }}>
                      {r.studentEmail && (
                        <a
                          href={`mailto:${r.studentEmail}?subject=${encodeURIComponent(`🏆 Your reward from AIWMR — ${r.moduleTitle}`)}&body=${encodeURIComponent(`Dear ${r.studentName},\n\nCongratulations on scoring ${r.scorePct}% in "${r.moduleTitle}".\n\nYou've earned a free Internship or Project Report from AIWMR. Please reply to confirm which you'd like to claim.\n\nBest regards,\nDr. Sushanth Gade\nAIWMR Training Academy`)}`}
                          style={{
                            fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
                            color: 'var(--forest)',
                            textDecoration: 'underline',
                            textDecorationStyle: 'dotted',
                            textUnderlineOffset: '4px',
                          }}>
                          ✉ email
                        </a>
                      )}
                      {r.studentPhone && (
                        <a
                          href={`tel:${r.studentPhone.replace(/\s/g, '')}`}
                          style={{
                            fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
                            color: 'var(--moss)',
                            textDecoration: 'underline',
                            textDecorationStyle: 'dotted',
                            textUnderlineOffset: '4px',
                          }}>
                          ☎ call
                        </a>
                      )}
                      {r.studentPhone && (
                        <a
                          href={`https://wa.me/${r.studentPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${r.studentName.split(' ')[0]}, congrats on your ${r.scorePct}% score! Please confirm your reward preference.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
                            color: '#25D366',
                            textDecoration: 'underline',
                            textDecorationStyle: 'dotted',
                            textUnderlineOffset: '4px',
                          }}>
                          ✦ whatsapp
                        </a>
                      )}
                    </div>

                    <InlineLink onClick={() => setExpanded(null)}>close</InlineLink>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ParchmentBackdrop>
  );
};

export default AdminRewardsScreen;
