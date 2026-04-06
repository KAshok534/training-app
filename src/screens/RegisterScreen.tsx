import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Btn } from '../components/UI';
import Icon from '../components/Icon';

interface Props { onShowLogin: () => void; }

interface Form {
  name: string; email: string; phone: string;
  organization: string; designation: string;
  password: string; confirm: string;
}

const EMPTY: Form = { name:'', email:'', phone:'', organization:'', designation:'', password:'', confirm:'' };

const RegisterScreen: React.FC<Props> = ({ onShowLogin }) => {
  const [form, setForm]     = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const upd = (k: keyof Form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleRegister = async () => {
    setError('');

    // Basic validation
    if (!form.name.trim())     return setError('Full name is required.');
    if (!form.email.trim())    return setError('Email is required.');
    if (!form.phone.trim())    return setError('Phone number is required.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');

    setLoading(true);

    // 1. Create auth user — name & phone go into raw_user_meta_data
    //    The fn_handle_new_user trigger auto-creates the profiles row
    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    form.email.trim(),
      password: form.password,
      options:  { data: { name: form.name.trim(), phone: form.phone.trim() } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // 2. If org / designation provided, update profile row
    if (data.user && (form.organization || form.designation)) {
      await supabase.from('profiles').update({
        organization: form.organization.trim() || null,
        designation:  form.designation.trim()  || null,
      }).eq('id', data.user.id);
    }

    setLoading(false);
    setSuccess(true);
  };

  const inp: React.CSSProperties = {
    width:'100%', padding:'14px 16px', borderRadius:14,
    border:'1.5px solid var(--sand)', background:'var(--white)',
    fontSize:15, color:'var(--charcoal)', outline:'none',
    fontFamily:"'DM Sans', sans-serif",
  };
  const lbl: React.CSSProperties = {
    fontSize:11, fontWeight:700, color:'var(--moss)',
    textTransform:'uppercase', letterSpacing:'0.08em',
    display:'block', marginBottom:8,
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--forest)', display:'flex', flexDirection:'column' }}>
      {/* Hero */}
      <div style={{ flex:'0 0 30%', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'0 32px 28px' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 40%, rgba(106,173,120,0.2) 0%, transparent 65%)' }}/>
        <button onClick={onShowLogin} style={{ position:'absolute', top:20, left:20, background:'rgba(255,255,255,0.1)', border:'none', borderRadius:10, padding:'8px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          <Icon name="back" size={16} color="white"/>
          <span style={{ color:'white', fontSize:13, fontFamily:"'DM Sans', sans-serif" }}>Login</span>
        </button>
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:44, marginBottom:12 }}>🎓</div>
          <div style={{ fontFamily:"'Playfair Display', serif", fontSize:32, color:'white', fontWeight:900, lineHeight:1.1 }}>Create<br/>Account</div>
          <div style={{ color:'var(--sage)', fontSize:13, marginTop:8 }}>AIWMR Training Academy</div>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex:1, background:'var(--cream)', borderRadius:'28px 28px 0 0', padding:'32px 28px 48px', overflowY:'auto', animation:'slideUp 0.4s cubic-bezier(0.34, 1.4, 0.64, 1)' }}>

        {success ? (
          <div style={{ textAlign:'center', paddingTop:20 }}>
            <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
            <div style={{ fontFamily:"'Playfair Display', serif", fontSize:24, fontWeight:900, color:'var(--forest)', marginBottom:10 }}>
              Registration Successful!
            </div>
            <div style={{ fontSize:14, color:'#888', lineHeight:1.6, marginBottom:28 }}>
              Your account has been created.<br/>You can now log in.
            </div>
            <Btn onClick={onShowLogin}>Go to Login</Btn>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ background:'rgba(192,57,43,0.1)', border:'1px solid rgba(192,57,43,0.3)', borderRadius:12, padding:'12px 16px', marginBottom:20, fontSize:14, color:'var(--red)' }}>
                {error}
              </div>
            )}

            {/* Required fields */}
            {([
              ['Full Name',    'name',  'text',     'Your full name'],
              ['Email',        'email', 'email',    'email@example.com'],
              ['Phone Number', 'phone', 'tel',      '+91 XXXXX XXXXX'],
            ] as [string, keyof Form, string, string][]).map(([l, k, t, p]) => (
              <div key={k} style={{ marginBottom:18 }}>
                <label style={lbl}>{l} <span style={{ color:'var(--red)' }}>*</span></label>
                <input style={inp} type={t} placeholder={p} value={form[k]}
                  onChange={e => upd(k, e.target.value)} autoComplete={t}/>
              </div>
            ))}

            {/* Optional fields */}
            <div style={{ marginBottom:6, marginTop:4 }}>
              <div style={{ fontSize:11, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>Optional</div>
              {([
                ['Organization', 'organization', 'text', 'Company / Institution'],
                ['Designation',  'designation',  'text', 'Your role / title'],
              ] as [string, keyof Form, string, string][]).map(([l, k, t, p]) => (
                <div key={k} style={{ marginBottom:18 }}>
                  <label style={lbl}>{l}</label>
                  <input style={inp} type={t} placeholder={p} value={form[k]}
                    onChange={e => upd(k, e.target.value)}/>
                </div>
              ))}
            </div>

            {/* Password */}
            <div style={{ marginBottom:18 }}>
              <label style={lbl}>Password <span style={{ color:'var(--red)' }}>*</span></label>
              <input style={inp} type="password" placeholder="Min. 6 characters" value={form.password}
                onChange={e => upd('password', e.target.value)} autoComplete="new-password"/>
            </div>
            <div style={{ marginBottom:28 }}>
              <label style={lbl}>Confirm Password <span style={{ color:'var(--red)' }}>*</span></label>
              <input style={inp} type="password" placeholder="Re-enter password" value={form.confirm}
                onChange={e => upd('confirm', e.target.value)} autoComplete="new-password"/>
            </div>

            <Btn loading={loading} onClick={handleRegister}>
              <span>Create Account</span>
              <Icon name="arrow" size={16} color="white"/>
            </Btn>

            <div style={{ textAlign:'center', marginTop:20, fontSize:14, color:'#888' }}>
              Already have an account?{' '}
              <span onClick={onShowLogin} style={{ color:'var(--pine)', fontWeight:700, cursor:'pointer' }}>
                Sign In
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default RegisterScreen;
