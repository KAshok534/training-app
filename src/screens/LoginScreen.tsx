import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import AuthShell, { DISPLAY } from '../components/AuthShell';
import {
  Eyebrow, Headline, Subhead, Divider,
  Field, PasswordField, PrimaryButton, InlineLink, ErrorBar, BottomCTA, Sidenote,
} from '../components/AuthForm';

interface Props { onShowRegister: () => void; }

const LoginScreen: React.FC<Props> = ({ onShowRegister }) => {
  const { signIn, isDemo } = useAuth();

  // Login state
  const [email, setEmail]               = useState(isDemo ? 'student@example.com' : '');
  const [password, setPassword]         = useState(isDemo ? 'password123' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  // Forgot password state
  const [forgotMode, setForgotMode]       = useState(false);
  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent]       = useState(false);
  const [forgotError, setForgotError]     = useState('');

  const [focused, setFocused] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true); setError('');
    const err = await signIn(email, password);
    if (err) {
      if (err.toLowerCase().includes('email not confirmed'))
        setError('Please verify your email first. Check your inbox for the verification link.');
      else if (err.toLowerCase().includes('invalid login'))
        setError('Incorrect email or password. Please try again.');
      else
        setError(err);
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setForgotError('');
    if (!forgotEmail.trim()) { setForgotError('Please enter your email address.'); return; }
    setForgotLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: window.location.origin,
    });
    setForgotLoading(false);
    if (err) setForgotError(err.message);
    else     setForgotSent(true);
  };

  const mode: 'login' | 'forgot' | 'sent' =
    forgotMode ? (forgotSent ? 'sent' : 'forgot') : 'login';

  return (
    <AuthShell>
      <div key={mode} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

        <Eyebrow text={
          mode === 'login'  ? '— Member access' :
          mode === 'forgot' ? '— Account recovery' :
                              '— Link dispatched'
        }/>

        <Headline
          primary={
            mode === 'login'  ? 'Welcome' :
            mode === 'forgot' ? 'Reset your' :
                                'Check'
          }
          italicAccent={
            mode === 'login'  ? 'back.' :
            mode === 'forgot' ? 'password.' :
                                'your inbox.'
          }
        />

        <Subhead>
          {mode === 'login'  && <>Continue cultivating expertise in waste management & environmental stewardship.</>}
          {mode === 'forgot' && <>Enter your registered email and we'll send a secure recovery link.</>}
          {mode === 'sent'   && (
            <>A recovery link was sent to{' '}
              <span style={{ color: 'var(--forest)', fontStyle: 'normal', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                {forgotEmail}
              </span>. Follow it to choose a new password.
            </>
          )}
        </Subhead>

        <Divider/>

        {/* ── SENT mode ── */}
        {mode === 'sent' && (
          <div style={{ animation: 'fadeUpSoft 0.6s ease 0.45s both' }}>
            <PrimaryButton
              onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail(''); }}
              label="Return to Sign In"
              arrow="↩"
            />
          </div>
        )}

        {/* ── FORGOT mode ── */}
        {mode === 'forgot' && (
          <>
            {forgotError && <ErrorBar text={forgotError}/>}

            <Field
              id="forgot-email"
              label="Email Address"
              type="email"
              value={forgotEmail}
              onChange={setForgotEmail}
              focused={focused}
              setFocused={setFocused}
              autoComplete="email"
              delay={0.45}
            />

            <div style={{ animation: 'fadeUpSoft 0.6s ease 0.6s both', marginTop: 8 }}>
              <PrimaryButton
                onClick={handleForgot}
                loading={forgotLoading}
                label="Send Recovery Link"
              />
            </div>

            <div style={{ textAlign: 'center', marginTop: 26, animation: 'fadeUpSoft 0.6s ease 0.7s both' }}>
              <InlineLink onClick={() => { setForgotMode(false); setForgotError(''); }}>
                <span style={{ fontFamily: DISPLAY, fontStyle: 'italic' }}>↩</span>{' '}back to sign in
              </InlineLink>
            </div>
          </>
        )}

        {/* ── LOGIN mode ── */}
        {mode === 'login' && (
          <>
            {error && <ErrorBar text={error}/>}

            <Field
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              focused={focused}
              setFocused={setFocused}
              autoComplete="email"
              delay={0.45}
            />

            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              focused={focused}
              setFocused={setFocused}
              show={showPassword}
              toggleShow={() => setShowPassword(p => !p)}
              autoComplete="current-password"
              delay={0.52}
            />

            <div style={{
              textAlign: 'right',
              marginTop: -8,
              marginBottom: 38,
              animation: 'fadeUpSoft 0.6s ease 0.58s both',
            }}>
              <InlineLink onClick={() => { setForgotMode(true); setForgotEmail(email); setError(''); }}>
                Forgot your password?
              </InlineLink>
            </div>

            <div style={{ animation: 'fadeUpSoft 0.6s ease 0.65s both' }}>
              <PrimaryButton onClick={handleLogin} loading={loading} label="Sign In"/>
            </div>

            <BottomCTA
              eyebrow="New to AIWMR"
              label="Create your account"
              onClick={onShowRegister}
            />

            {isDemo && (
              <Sidenote title="❋ Demo Mode">
                Credentials pre-filled. Connect Supabase in{' '}
                <code style={{ fontFamily: 'ui-monospace, "JetBrains Mono", monospace', fontSize: 11 }}>.env</code>
                {' '}to enable real auth.
              </Sidenote>
            )}
          </>
        )}
      </div>
    </AuthShell>
  );
};

export default LoginScreen;
