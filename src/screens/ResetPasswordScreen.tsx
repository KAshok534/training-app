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
import AuthShell, { DISPLAY } from '../components/AuthShell';
import {
  Eyebrow, Headline, Subhead, Divider,
  PasswordField, PrimaryButton, ErrorBar,
} from '../components/AuthForm';

const ResetPasswordScreen: React.FC = () => {
  const { clearRecovery } = useAuth();
  const [password, setPassword]         = useState('');
  const [confirm, setConfirm]           = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [done, setDone]                 = useState(false);
  const [focused, setFocused]           = useState<string | null>(null);

  const handleReset = async () => {
    setError('');
    if (password.length < 8)   { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm)  { setError('Passwords do not match.'); return; }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setDone(true);
      // Sign out the recovery session so the user goes back to login cleanly
      await supabase.auth.signOut();
      setTimeout(() => clearRecovery(), 2500);
    }
  };

  const mode: 'form' | 'done' = done ? 'done' : 'form';

  return (
    <AuthShell>
      <div key={mode} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

        <Eyebrow text={mode === 'form' ? '— Final step' : '— Complete'}/>

        <Headline
          primary={mode === 'form' ? 'Choose a new' : 'Password'}
          italicAccent={mode === 'form' ? 'password.' : 'renewed.'}
        />

        <Subhead>
          {mode === 'form'
            ? <>Pick something memorable but secure. At least eight characters.</>
            : <>Your new password is active. Taking you back to sign in…</>
          }
        </Subhead>

        <Divider/>

        {/* ── DONE state ── */}
        {mode === 'done' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '18px 0',
            animation: 'fadeUpSoft 0.6s ease 0.45s both',
          }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: '50%',
              background: 'var(--forest)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: DISPLAY,
              fontStyle: 'italic',
              fontSize: 22,
              flexShrink: 0,
            }}>✓</div>
            <div style={{
              fontFamily: DISPLAY,
              fontStyle: 'italic',
              fontSize: 16,
              color: 'var(--charcoal)',
              opacity: 0.8,
              lineHeight: 1.5,
            }}>
              Updated successfully. You can close this tab or wait to be signed in.
            </div>
          </div>
        )}

        {/* ── FORM state ── */}
        {mode === 'form' && (
          <>
            {error && <ErrorBar text={error}/>}

            <PasswordField
              id="new-password"
              label="New Password"
              value={password}
              onChange={setPassword}
              focused={focused}
              setFocused={setFocused}
              show={showPassword}
              toggleShow={() => setShowPassword(p => !p)}
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              delay={0.45}
            />

            <PasswordField
              id="confirm-password"
              label="Confirm Password"
              value={confirm}
              onChange={setConfirm}
              focused={focused}
              setFocused={setFocused}
              show={showPassword}
              toggleShow={() => setShowPassword(p => !p)}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              delay={0.52}
            />

            <div style={{ marginTop: 18, animation: 'fadeUpSoft 0.6s ease 0.6s both' }}>
              <PrimaryButton onClick={handleReset} loading={loading} label="Update Password"/>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
};

export default ResetPasswordScreen;
