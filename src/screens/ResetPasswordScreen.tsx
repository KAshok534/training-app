/**
 * ResetPasswordScreen
 *
 * Shown when the user arrives via a Supabase password-recovery email link.
 * The link sets a short-lived session — we just need to call updateUser().
 * After success: clears recovery mode, returns to login screen.
 */
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Btn } from '../components/UI';

const ResetPasswordScreen: React.FC = () => {
  const { clearRecovery } = useAuth();
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [done, setDone]           = useState(false);

  const inp: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 14,
    border: '1.5px solid var(--sand)', background: 'var(--white)',
    fontSize: 15, color: 'var(--charcoal)', outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
  };
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: 'var(--moss)',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    display: 'block', marginBottom: 8,
  };

  const handleReset = async () => {
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setDone(true);
      // Sign out the recovery session so user goes back to login cleanly
      await supabase.auth.signOut();
      setTimeout(() => clearRecovery(), 2500);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--forest)', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <div style={{ flex: '0 0 32%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 32px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 60%, rgba(106,173,120,0.2) 0%, transparent 65%)' }}/>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔐</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: 'white', fontWeight: 900, lineHeight: 1.1 }}>
            Set New<br/>Password
          </div>
          <div style={{ color: 'var(--sage)', fontSize: 14, marginTop: 8 }}>AIWMR Training Academy</div>
        </div>
      </div>

      {/* Form card */}
      <div style={{ flex: 1, background: 'var(--cream)', borderRadius: '28px 28px 0 0', padding: '36px 28px 40px', overflowY: 'auto', animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {done ? (
          <div style={{ textAlign: 'center', paddingTop: 20 }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: 'var(--forest)', marginBottom: 10 }}>
              Password Updated!
            </div>
            <div style={{ fontSize: 14, color: '#888', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
              Your password has been changed successfully.<br/>Taking you back to login…
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#666', marginBottom: 28, lineHeight: 1.6 }}>
              Choose a strong new password for your AIWMR account.
            </div>

            {error && (
              <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: 'var(--red)', fontFamily: "'DM Sans', sans-serif" }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>New Password</label>
              <input
                style={inp} type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={lbl}>Confirm Password</label>
              <input
                style={inp} type="password" value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your new password"
                autoComplete="new-password"
              />
            </div>

            <Btn loading={loading} onClick={handleReset}>
              <span>Update Password</span>
            </Btn>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
