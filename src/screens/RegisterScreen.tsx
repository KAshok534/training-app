import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import AuthShell, { DISPLAY, BODY } from '../components/AuthShell';
import {
  Eyebrow, Headline, Subhead, Divider, SectionLabel,
  Field, PasswordField, PrimaryButton, ErrorBar, BottomCTA,
} from '../components/AuthForm';

interface Props { onShowLogin: () => void; }

interface Form {
  name: string; email: string; phone: string;
  organization: string; designation: string;
  password: string; confirm: string;
}

const EMPTY: Form = { name:'', email:'', phone:'', organization:'', designation:'', password:'', confirm:'' };

const RegisterScreen: React.FC<Props> = ({ onShowLogin }) => {
  const [form, setForm]                 = useState<Form>(EMPTY);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused]           = useState<string | null>(null);

  const upd = (k: keyof Form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleRegister = async () => {
    setError('');

    if (!form.name.trim())                return setError('Full name is required.');
    if (!form.email.trim())               return setError('Email is required.');
    if (!form.phone.trim())               return setError('Phone number is required.');
    if (form.password.length < 6)         return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm)   return setError('Passwords do not match.');

    setLoading(true);

    // 1. Create auth user — name & phone go into raw_user_meta_data
    //    The handle_new_user trigger auto-creates the profiles row
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

  const mode: 'form' | 'sent' = success ? 'sent' : 'form';

  return (
    <AuthShell>
      <div key={mode} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

        <Eyebrow text={mode === 'form' ? '— Begin enrollment' : '— Verification pending'}/>

        <Headline
          primary={mode === 'form' ? 'Begin your' : 'Almost'}
          italicAccent={mode === 'form' ? 'journey.' : 'there.'}
        />

        <Subhead>
          {mode === 'form'
            ? <>Join Asia's leading institute for waste management & environmental research.</>
            : <>We've sent a verification link to{' '}
                <span style={{ color: 'var(--forest)', fontStyle: 'normal', fontWeight: 600, fontFamily: BODY }}>
                  {form.email}
                </span>. Open it to activate your account.
              </>
          }
        </Subhead>

        <Divider/>

        {/* ── VERIFY YOUR EMAIL state ── */}
        {mode === 'sent' && (
          <>
            <div style={{
              marginBottom: 32,
              animation: 'fadeUpSoft 0.6s ease 0.45s both',
            }}>
              <div style={{
                fontFamily: BODY,
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--moss)',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}>
                Next steps
              </div>
              <ol style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontFamily: DISPLAY,
                fontStyle: 'italic',
                fontSize: 16,
                color: 'var(--charcoal)',
                opacity: 0.78,
                lineHeight: 1.7,
              }}>
                <li style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
                  <span style={{ color: 'var(--moss)', fontWeight: 500, minWidth: 14 }}>i.</span>
                  <span>Open the email inbox of <span style={{ fontStyle: 'normal', fontFamily: BODY, fontWeight: 600, color: 'var(--forest)' }}>{form.email}</span></span>
                </li>
                <li style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
                  <span style={{ color: 'var(--moss)', fontWeight: 500, minWidth: 14 }}>ii.</span>
                  <span>Click the verification link from AIWMR</span>
                </li>
                <li style={{ display: 'flex', gap: 14 }}>
                  <span style={{ color: 'var(--moss)', fontWeight: 500, minWidth: 14 }}>iii.</span>
                  <span>Return here to sign in</span>
                </li>
              </ol>
            </div>

            <div style={{ animation: 'fadeUpSoft 0.6s ease 0.55s both' }}>
              <PrimaryButton onClick={onShowLogin} label="Go to Sign In" arrow="↩"/>
            </div>

            <div style={{
              textAlign: 'center',
              marginTop: 24,
              fontFamily: DISPLAY,
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--moss)',
              opacity: 0.7,
              animation: 'fadeUpSoft 0.6s ease 0.7s both',
            }}>
              Didn't receive it? Check your spam folder.
            </div>
          </>
        )}

        {/* ── FORM state ── */}
        {mode === 'form' && (
          <>
            {error && <ErrorBar text={error}/>}

            <Field
              id="name"
              label="Full Name"
              value={form.name}
              onChange={v => upd('name', v)}
              focused={focused}
              setFocused={setFocused}
              autoComplete="name"
              required
              delay={0.42}
            />
            <Field
              id="email"
              label="Email Address"
              type="email"
              value={form.email}
              onChange={v => upd('email', v)}
              focused={focused}
              setFocused={setFocused}
              autoComplete="email"
              required
              delay={0.48}
            />
            <Field
              id="phone"
              label="Phone Number"
              type="tel"
              value={form.phone}
              onChange={v => upd('phone', v)}
              focused={focused}
              setFocused={setFocused}
              autoComplete="tel"
              placeholder="+91 XXXXX XXXXX"
              required
              delay={0.54}
            />

            <SectionLabel text="Optional" delay={0.6}/>

            <Field
              id="organization"
              label="Organization"
              value={form.organization}
              onChange={v => upd('organization', v)}
              focused={focused}
              setFocused={setFocused}
              placeholder="Company or institution"
              delay={0.64}
            />
            <Field
              id="designation"
              label="Designation"
              value={form.designation}
              onChange={v => upd('designation', v)}
              focused={focused}
              setFocused={setFocused}
              placeholder="Your role or title"
              delay={0.7}
            />

            <SectionLabel text="Choose a password" delay={0.76}/>

            <PasswordField
              id="password"
              label="Password"
              value={form.password}
              onChange={v => upd('password', v)}
              focused={focused}
              setFocused={setFocused}
              show={showPassword}
              toggleShow={() => setShowPassword(p => !p)}
              autoComplete="new-password"
              placeholder="Minimum 6 characters"
              delay={0.8}
            />
            <PasswordField
              id="confirm"
              label="Confirm Password"
              value={form.confirm}
              onChange={v => upd('confirm', v)}
              focused={focused}
              setFocused={setFocused}
              show={showPassword}
              toggleShow={() => setShowPassword(p => !p)}
              autoComplete="new-password"
              placeholder="Re-enter password"
              delay={0.84}
            />

            <div style={{ marginTop: 14, animation: 'fadeUpSoft 0.6s ease 0.9s both' }}>
              <PrimaryButton onClick={handleRegister} loading={loading} label="Create Account"/>
            </div>

            <BottomCTA
              eyebrow="Already enrolled"
              label="Sign in instead"
              onClick={onShowLogin}
              delay={1.0}
            />
          </>
        )}
      </div>
    </AuthShell>
  );
};

export default RegisterScreen;
