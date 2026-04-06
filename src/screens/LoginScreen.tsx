import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Btn } from '../components/UI';
import Icon from '../components/Icon';

interface Props { onShowRegister: () => void; }

const LoginScreen: React.FC<Props> = ({ onShowRegister }) => {
  const { signIn, isDemo } = useAuth();
  const [email, setEmail]     = useState(isDemo ? 'student@example.com' : '');
  const [password, setPassword] = useState(isDemo ? 'password123' : '');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleLogin = async () => {
    setLoading(true); setError('');
    const err = await signIn(email, password);
    if (err) {
      // Make Supabase's technical error messages friendlier
      if (err.toLowerCase().includes('email not confirmed'))
        setError('Please verify your email first. Check your inbox for the verification link.');
      else if (err.toLowerCase().includes('invalid login'))
        setError('Incorrect email or password. Please try again.');
      else
        setError(err);
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width:'100%', padding:'14px 16px', borderRadius:14, border:'1.5px solid var(--sand)',
    background:'var(--white)', fontSize:15, color:'var(--charcoal)', outline:'none',
    fontFamily:"'DM Sans', sans-serif",
  };
  const lbl: React.CSSProperties = {
    fontSize:11, fontWeight:700, color:'var(--moss)', textTransform:'uppercase',
    letterSpacing:'0.08em', display:'block', marginBottom:8,
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--forest)', display:'flex', flexDirection:'column' }}>
      {/* Hero top */}
      <div style={{ flex:'0 0 38%', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'0 32px 32px' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 20% 60%, rgba(106,173,120,0.2) 0%, transparent 65%)' }}/>
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🌿</div>
          <div style={{ fontFamily:"'Playfair Display', serif", fontSize:38, color:'white', fontWeight:900, lineHeight:1.1 }}>Welcome<br/>Back</div>
          <div style={{ color:'var(--sage)', fontSize:14, marginTop:10 }}>AIWMR Training Academy</div>
        </div>
      </div>

      {/* Form card */}
      <div style={{ flex:1, background:'var(--cream)', borderRadius:'28px 28px 0 0', padding:'36px 28px 40px', overflowY:'auto', animation:'slideUp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        {error && (
          <div style={{ background:'rgba(192,57,43,0.1)', border:'1px solid rgba(192,57,43,0.3)', borderRadius:12, padding:'12px 16px', marginBottom:20, fontSize:14, color:'var(--red)' }}>
            {error}
          </div>
        )}
        <div style={{ marginBottom:20 }}>
          <label style={lbl}>Email Address</label>
          <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/>
        </div>
        <div style={{ marginBottom:10 }}>
          <label style={lbl}>Password</label>
          <input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/>
        </div>
        <div style={{ textAlign:'right', marginBottom:28 }}>
          <span style={{ fontSize:13, color:'var(--moss)', cursor:'pointer', fontWeight:600 }}>Forgot password?</span>
        </div>
        <Btn loading={loading} onClick={handleLogin}>
          <span>Sign In</span>
          <Icon name="arrow" size={16} color="white"/>
        </Btn>
        <div style={{ textAlign:'center', marginTop:24, fontSize:14, color:'#888' }}>
          New to AIWMR?{' '}
          <span onClick={onShowRegister} style={{ color:'var(--pine)', fontWeight:700, cursor:'pointer' }}>Register here</span>
        </div>
        {isDemo && (
          <div style={{ marginTop:28, padding:16, background:'rgba(45,90,61,0.06)', borderRadius:14, border:'1px dashed var(--sage)' }}>
            <div style={{ fontSize:12, color:'var(--moss)', fontWeight:700, marginBottom:4 }}>🎯 Demo mode — credentials pre-filled</div>
            <div style={{ fontSize:12, color:'#888' }}>Connect Supabase in .env to enable real auth</div>
          </div>
        )}
      </div>
    </div>
  );
};
export default LoginScreen;
