/**
 * AdminStudentsScreen — editorial admin view of all registrations.
 *
 * Lists every registration with profile + course info. Filter by
 * All / Pending / Granted, search by name/email/course/reg-code,
 * toggle access_granted, and issue certificate.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import ParchmentBackdrop from '../components/ParchmentBackdrop';
import { DISPLAY, BODY } from '../components/AuthShell';
import { InlineLink } from '../components/AuthForm';

interface Props { onBack: () => void; }

interface StudentReg {
  id:            string;
  regCode:       string;
  paymentStatus: string;
  accessGranted: boolean;
  createdAt:     string;
  paymentId:     string | null;
  name:          string;
  email:         string;
  phone:         string;
  courseTitle:   string;
  courseIcon:    string;
  certId:        string | null;
}

type FilterTab = 'all' | 'pending' | 'granted';

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

const AdminStudentsScreen: React.FC<Props> = ({ onBack }) => {
  const [students, setStudents] = useState<StudentReg[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<FilterTab>('all');
  const [toggling, setToggling] = useState<string | null>(null);
  const [issuing, setIssuing]   = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    const [regsRes, certsRes] = await Promise.all([
      supabase.from('registrations')
        .select('id, registration_id, payment_status, access_granted, created_at, payment_id, profiles(name, email, phone), courses(title, icon)')
        .order('created_at', { ascending: false }),
      supabase.from('certificates').select('registration_id, cert_id'),
    ]);

    const certMap: Record<string, string> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (certsRes.data ?? []).forEach((c: any) => { certMap[c.registration_id] = c.cert_id; });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setStudents((regsRes.data ?? []).map((r: any) => ({
      id:            r.id,
      regCode:       r.registration_id ?? '—',
      paymentStatus: r.payment_status,
      accessGranted: r.access_granted,
      createdAt:     r.created_at,
      paymentId:     r.payment_id ?? null,
      name:          r.profiles?.name  ?? '—',
      email:         r.profiles?.email ?? '—',
      phone:         r.profiles?.phone ?? '—',
      courseTitle:   r.courses?.title  ?? '—',
      courseIcon:    r.courses?.icon   ?? '📚',
      certId:        certMap[r.id] ?? null,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const toggleAccess = async (s: StudentReg) => {
    setToggling(s.id);
    const next = !s.accessGranted;
    const { error } = await supabase
      .from('registrations')
      .update({ access_granted: next })
      .eq('id', s.id);
    if (!error) {
      setStudents(prev => prev.map(r => r.id === s.id ? { ...r, accessGranted: next } : r));
    }
    setToggling(null);
  };

  const issueCertificate = async (s: StudentReg) => {
    if (!confirm(`Issue certificate to ${s.name} for ${s.courseTitle}?\n\nThis cannot be undone from the app.`)) return;
    setIssuing(s.id);
    const { data, error } = await supabase
      .from('certificates')
      .insert({ registration_id: s.id })
      .select('cert_id')
      .single();
    if (!error && data) {
      setStudents(prev => prev.map(r => r.id === s.id ? { ...r, certId: data.cert_id } : r));
      alert(`✅ Certificate issued: ${data.cert_id}`);
    } else {
      alert(`Failed to issue certificate: ${error?.message ?? 'unknown error'}`);
    }
    setIssuing(null);
  };

  const filtered = students.filter(s => {
    if (filter === 'granted' && !s.accessGranted) return false;
    if (filter === 'pending' &&  s.accessGranted) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) &&
          !s.email.toLowerCase().includes(q) &&
          !s.courseTitle.toLowerCase().includes(q) &&
          !s.regCode.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const pendingCount = students.filter(s => !s.accessGranted).length;
  const grantedCount = students.length - pendingCount;

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
            <button onClick={loadStudents}
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
            fontSize: 10, fontWeight: 600,
            color: 'var(--moss)',
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            marginBottom: 14,
            animation: 'fadeUpSoft 0.5s ease 0.05s both',
          }}>
            — Students
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
            All<br/>
            <em style={{ fontStyle: 'italic', color: 'var(--moss)', fontWeight: 400 }}>registrations.</em>
          </h1>

          <p style={{
            fontFamily: DISPLAY, fontStyle: 'italic',
            fontSize: 15, color: 'var(--charcoal)', opacity: 0.65,
            margin: 0, marginBottom: 24,
            animation: 'fadeUpSoft 0.5s ease 0.18s both',
          }}>
            {students.length} total
            {pendingCount > 0 && <> · <span style={{ color: 'var(--amber)' }}>{pendingCount} pending review</span></>}
          </p>

          {/* Search */}
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
              placeholder="name, email, course, or reg code…"
              style={{
                width: '100%',
                padding: '10px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: searchFocused ? '1.5px solid var(--forest)' : '1px solid rgba(26,58,42,0.18)',
                outline: 'none',
                fontFamily: BODY, fontSize: 15,
                color: 'var(--charcoal)',
                transition: 'border-color 0.25s ease',
              }}
            />
          </div>

          {/* Filter chips */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 16,
            marginBottom: 24,
            flexWrap: 'wrap',
            animation: 'fadeUpSoft 0.5s ease 0.3s both',
          }}>
            {([
              ['all',     'all',     students.length],
              ['pending', 'pending', pendingCount],
              ['granted', 'granted', grantedCount],
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

          {/* Decorative rule */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12,
            animation: 'fadeUpSoft 0.5s ease 0.36s both',
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
            <span style={{ fontFamily: DISPLAY, fontSize: 13, color: 'var(--moss)', opacity: 0.7 }}>✦</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
          </div>

          {/* List */}
          {loading ? (
            <div style={{
              fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
              color: 'var(--moss)', textAlign: 'center', padding: '40px 0',
            }}>
              Loading registrations…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 15,
              color: 'var(--charcoal)', opacity: 0.6,
              textAlign: 'center', padding: '40px 0',
            }}>
              {search ? 'No registrations match your search.' : 'No registrations yet.'}
            </div>
          ) : filtered.map((s, i) => (
            <StudentEntry
              key={s.id}
              student={s}
              index={i + 1}
              isFirst={i === 0}
              toggling={toggling === s.id}
              issuing={issuing === s.id}
              onToggle={() => toggleAccess(s)}
              onIssueCert={() => issueCertificate(s)}
            />
          ))}
        </div>
      </div>
    </ParchmentBackdrop>
  );
};

// ─── Single student entry ────────────────────────────────────────────────────

interface StudentEntryProps {
  student:       StudentReg;
  index:         number;
  isFirst:       boolean;
  toggling:      boolean;
  issuing:       boolean;
  onToggle:      () => void;
  onIssueCert:   () => void;
}

const StudentEntry: React.FC<StudentEntryProps> = ({
  student: s, index, isFirst, toggling, issuing, onToggle, onIssueCert,
}) => {
  const [expanded, setExpanded] = useState(false);
  const roman = toRoman(index).toLowerCase();
  const dateStr = new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });

  return (
    <div style={{
      borderTop: isFirst ? '1px solid rgba(26,58,42,0.18)' : 'none',
      borderBottom: '1px solid rgba(26,58,42,0.18)',
      animation: `fadeUpSoft 0.4s ease ${0.4 + index * 0.03}s both`,
    }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
          padding: '16px 0',
          cursor: 'pointer',
        }}
      >
        <span style={{
          fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 15,
          color: s.accessGranted ? 'var(--leaf)' : 'var(--moss)',
          minWidth: 30, opacity: 0.85, flexShrink: 0,
        }}>{roman}.</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: DISPLAY, fontSize: 16,
            color: 'var(--forest)', fontWeight: 400, lineHeight: 1.3,
            marginBottom: 4,
          }}>
            {s.name}
          </div>
          <div style={{
            fontFamily: BODY, fontSize: 11,
            color: 'var(--moss)', opacity: 0.85,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {s.email}
          </div>
          <div style={{
            fontFamily: BODY, fontSize: 9, fontWeight: 600,
            color: 'var(--moss)', letterSpacing: '0.22em',
            textTransform: 'uppercase', marginTop: 8,
          }}>
            {s.courseIcon} {s.courseTitle.length > 32 ? s.courseTitle.slice(0, 32) + '…' : s.courseTitle}
          </div>
          <div style={{
            fontFamily: BODY, fontSize: 9, fontWeight: 600,
            color: 'var(--moss)', letterSpacing: '0.22em',
            textTransform: 'uppercase', marginTop: 6, opacity: 0.7,
          }}>
            <span style={{ fontFamily: 'ui-monospace, "JetBrains Mono", monospace', letterSpacing: '0.08em' }}>{s.regCode}</span>
            {' · '}
            <span style={{ color: s.paymentStatus === 'paid' ? 'var(--leaf)' : 'var(--amber)' }}>{s.paymentStatus}</span>
            {' · '}{dateStr}
          </div>
        </div>

        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{
            fontFamily: DISPLAY,
            fontStyle: 'italic',
            fontSize: 14,
            color: s.accessGranted ? 'var(--leaf)' : 'var(--amber)',
          }}>
            {s.accessGranted ? '✓ access' : '— pending'}
          </div>
          {s.certId && (
            <div style={{
              fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 12,
              color: 'var(--gold)', marginTop: 4,
            }}>
              ✦ cert issued
            </div>
          )}
          <div style={{
            fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 13,
            color: 'var(--moss)', marginTop: 6, opacity: 0.7,
          }}>
            {expanded ? '×' : '→'}
          </div>
        </div>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div onClick={e => e.stopPropagation()} style={{
          paddingBottom: 20,
          animation: 'fadeUpSoft 0.3s ease both',
        }}>
          {s.phone && s.phone !== '—' && (
            <div style={{
              fontFamily: BODY, fontSize: 11, color: 'var(--moss)',
              letterSpacing: '0.18em', textTransform: 'uppercase',
              marginBottom: 14,
            }}>
              {s.phone}
            </div>
          )}

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
            <button
              onClick={onToggle}
              disabled={toggling}
              style={{
                fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
                color: s.accessGranted ? 'var(--red)' : 'var(--forest)',
                background: 'none', border: 'none', padding: 0,
                cursor: toggling ? 'not-allowed' : 'pointer',
                textDecoration: 'underline', textDecorationStyle: 'dotted',
                textUnderlineOffset: '4px',
                opacity: toggling ? 0.5 : 1,
              }}>
              {toggling ? '…' : s.accessGranted ? '⛔ revoke access' : '✓ grant access'}
            </button>

            {s.accessGranted && !s.certId && (
              <button
                onClick={onIssueCert}
                disabled={issuing}
                style={{
                  fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 14,
                  color: 'var(--gold)',
                  background: 'none', border: 'none', padding: 0,
                  cursor: issuing ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline', textDecorationStyle: 'dotted',
                  textUnderlineOffset: '4px',
                  opacity: issuing ? 0.5 : 1,
                }}>
                {issuing ? '…' : '✦ issue certificate'}
              </button>
            )}

            {s.certId && (
              <span style={{
                fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
                fontSize: 11,
                color: 'var(--gold)',
              }}>
                {s.certId}
              </span>
            )}
          </div>

          <InlineLink onClick={() => setExpanded(false)}>
            close
          </InlineLink>
        </div>
      )}
    </div>
  );
};

export default AdminStudentsScreen;
