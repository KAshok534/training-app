import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Card, Spinner } from '../components/UI';
import Icon from '../components/Icon';

interface Props { onBack: () => void; }

interface StudentReg {
  id:            string;   // registrations.id (UUID)
  regCode:       string;   // AIWMR-2026-0001
  paymentStatus: string;
  accessGranted: boolean;
  createdAt:     string;
  paymentId:     string | null;
  name:          string;
  email:         string;
  phone:         string;
  courseTitle:   string;
  courseIcon:    string;
  certId:        string | null;   // null if no cert issued yet
}

type FilterTab = 'all' | 'pending' | 'granted';

const AdminStudentsScreen: React.FC<Props> = ({ onBack }) => {
  const [students, setStudents] = useState<StudentReg[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<FilterTab>('all');
  const [toggling, setToggling] = useState<string | null>(null);
  const [issuing, setIssuing]   = useState<string | null>(null);
  const [search, setSearch]     = useState('');

  const loadStudents = useCallback(async () => {
    setLoading(true);
    const [regsRes, certsRes] = await Promise.all([
      supabase.from('registrations')
        .select('id, registration_id, payment_status, access_granted, created_at, payment_id, profiles(name, email, phone), courses(title, icon)')
        .order('created_at', { ascending: false }),
      supabase.from('certificates')
        .select('registration_id, cert_id'),
    ]);

    // Build lookup: registration_id → cert_id
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
    if (filter === 'granted' && !s.accessGranted)  return false;
    if (filter === 'pending' &&  s.accessGranted)  return false;
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

  return (
    <div className="screen">
      {/* Sticky header */}
      <div style={{ background:'var(--forest)', padding:'20px 20px 16px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <button onClick={onBack}
            style={{ background:'rgba(255,255,255,0.12)', border:'none', borderRadius:10, padding:'8px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name="back" size={18} color="white"/>
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:20, fontWeight:900, lineHeight:1.2 }}>Students</div>
            <div style={{ color:'var(--sage)', fontSize:12, marginTop:1 }}>
              {students.length} registrations
              {pendingCount > 0 && <span style={{ color:'var(--amber)', fontWeight:700 }}> · {pendingCount} pending</span>}
            </div>
          </div>
          <button onClick={loadStudents}
            style={{ background:'rgba(255,255,255,0.12)', border:'none', borderRadius:10, padding:'8px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name="arrow" size={16} color="var(--sage)"/>
          </button>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email, course, reg code…"
          style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'none', background:'rgba(255,255,255,0.12)', color:'white', fontSize:13, fontFamily:"'DM Sans', sans-serif", outline:'none', boxSizing:'border-box' }}
        />
      </div>

      <div style={{ padding:'12px 16px' }}>
        {/* Filter tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {([
            ['all',     'All',          null],
            ['pending', '🔒 Pending',   students.filter(s => !s.accessGranted).length],
            ['granted', '✅ Granted',   students.filter(s =>  s.accessGranted).length],
          ] as [FilterTab, string, number | null][]).map(([f, label, count]) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ flex:1, padding:'9px 4px', borderRadius:10, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:"'DM Sans', sans-serif",
                background: filter === f ? 'var(--forest)' : 'var(--sand)',
                color: filter === f ? 'white' : 'var(--charcoal)' }}>
              {label}{count !== null ? ` (${count})` : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
            <Spinner size={32} color="var(--forest)"/>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#aaa', fontSize:14 }}>
            {search ? 'No students match your search.' : 'No registrations yet.'}
          </div>
        ) : filtered.map((s, i) => (
          <Card key={s.id} style={{ padding:'14px 16px', marginBottom:10, animation:`fadeUp 0.3s ease ${i * 0.04}s both` }}>
            {/* Top row: avatar + info */}
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:12, background: s.accessGranted ? 'var(--forest)' : 'var(--sand)', display:'flex', alignItems:'center', justifyContent:'center', color: s.accessGranted ? 'white' : '#aaa', fontSize:17, fontWeight:700, flexShrink:0, border: s.accessGranted ? 'none' : '2px solid #ddd' }}>
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'var(--charcoal)', lineHeight:1.2 }}>{s.name}</div>
                <div style={{ fontSize:12, color:'#888', marginTop:2 }}>{s.email}</div>
                {s.phone && s.phone !== '—' && (
                  <div style={{ fontSize:12, color:'#aaa', marginTop:1 }}>{s.phone}</div>
                )}
                {/* Course */}
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:6 }}>
                  <span style={{ fontSize:14 }}>{s.courseIcon}</span>
                  <span style={{ fontSize:12, color:'var(--charcoal)', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.courseTitle}</span>
                </div>
                {/* Badges */}
                <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap', alignItems:'center' }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6,
                    background: s.paymentStatus === 'paid' ? 'rgba(106,173,120,0.15)' : 'rgba(212,148,58,0.15)',
                    color: s.paymentStatus === 'paid' ? 'var(--leaf)' : 'var(--amber)' }}>
                    {s.paymentStatus === 'paid' ? '💳 Paid' : `⏳ ${s.paymentStatus}`}
                  </span>
                  <span style={{ fontSize:11, color:'#bbb', fontFamily:'monospace' }}>{s.regCode}</span>
                  <span style={{ fontSize:11, color:'#bbb' }}>
                    {new Date(s.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Access toggle row */}
            <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--sand)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color: s.accessGranted ? 'var(--leaf)' : '#999' }}>
                  {s.accessGranted ? '✅ Access Granted' : '🔒 Access Pending'}
                </div>
                <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>
                  {s.accessGranted
                    ? 'Can access learning, attendance & certificates'
                    : 'Grant after confirming payment'}
                </div>
              </div>
              <button
                onClick={() => toggleAccess(s)}
                disabled={toggling === s.id}
                style={{
                  flexShrink: 0,
                  padding:'8px 16px', borderRadius:10, border:'none',
                  cursor: toggling === s.id ? 'not-allowed' : 'pointer',
                  fontSize:12, fontWeight:700, fontFamily:"'DM Sans', sans-serif",
                  opacity: toggling === s.id ? 0.6 : 1,
                  background: s.accessGranted ? 'rgba(192,57,43,0.1)' : 'var(--forest)',
                  color: s.accessGranted ? 'var(--red)' : 'white',
                  transition:'all 0.2s',
                }}>
                {toggling === s.id ? '…' : s.accessGranted ? 'Revoke' : 'Grant Access'}
              </button>
            </div>

            {/* Certificate row — only when access granted */}
            {s.accessGranted && (
              <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--sand)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color: s.certId ? 'var(--gold)' : '#999' }}>
                    {s.certId ? '🏆 Certificate Issued' : '📜 No Certificate Yet'}
                  </div>
                  <div style={{ fontSize:11, color:'#bbb', marginTop:2, fontFamily: s.certId ? 'monospace' : 'inherit' }}>
                    {s.certId ?? 'Issue when course is completed'}
                  </div>
                </div>
                {!s.certId && (
                  <button
                    onClick={() => issueCertificate(s)}
                    disabled={issuing === s.id}
                    style={{
                      flexShrink: 0,
                      padding:'8px 16px', borderRadius:10, border:'none',
                      cursor: issuing === s.id ? 'not-allowed' : 'pointer',
                      fontSize:12, fontWeight:700, fontFamily:"'DM Sans', sans-serif",
                      opacity: issuing === s.id ? 0.6 : 1,
                      background:'var(--gold)', color:'white',
                      transition:'all 0.2s',
                    }}>
                    {issuing === s.id ? '…' : 'Issue Cert'}
                  </button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminStudentsScreen;
