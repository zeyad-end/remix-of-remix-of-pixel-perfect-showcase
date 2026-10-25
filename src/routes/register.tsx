import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/kit';
import { seo } from '@/lib/seo';
import { setDemoSession } from '@/lib/demo';
import { registrationSchema } from '@/lib/registration';
import { supabase } from '@/integrations/supabase/client';
import { AccountTypeSelector } from '@/components/AccountTypeSelector';
import { savePreviewSession, verifyPreviewSignup, type PreviewChallenge } from '@/lib/preview-session';
import { AppBrand } from '@/components/AppBrand';
import { createVerifiedAccount, sendSignupCode } from '@/lib/signup.functions';

export const Route = createFileRoute('/register')({
  head: () => seo('Create account', 'Create your persistent GYVORA gym owner or client account.'),
  component: Register,
});
function Register() {
  const navigate = useNavigate();
  const sendCode = useServerFn(sendSignupCode);
  const createAccount = useServerFn(createVerifiedAccount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [accountType, setAccountType] = useState<'gym' | 'individual'>('gym');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<Awaited<ReturnType<typeof sendCode>> | null>(null);
  const [notice, setNotice] = useState('');
  const [previewChallenge, setPreviewChallenge] = useState<PreviewChallenge | null>(null);
  async function send(channel: 'email' | 'phone') {
    setBusy(true); setError(''); setChallenge(null); setPreviewChallenge(null); setNotice(''); setCode('');
    try {
      if (import.meta.env.DEV) {
        const contact=(channel === 'email' ? email : phone).trim();
        if (!contact) throw new Error('Enter an email or phone number.');
        setPreviewChallenge({channel,contact,expiresAt:Date.now()+600000});
        setNotice('Preview verification: no email or SMS was sent. Enter any non-empty code. No real account will be created.');
        return;
      }
      const result = await sendCode({data:{channel,contact:channel === 'email' ? email : phone}});
      setChallenge(result); setNotice(result.message);
    } catch(err) { setError(err instanceof Error ? err.message : 'Could not send code.'); }
    finally { setBusy(false); }
  }
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError('');
    const d = new FormData(e.currentTarget);
    try {
      const account = registrationSchema.parse({...Object.fromEntries(d),account_type:accountType});
      if (import.meta.env.DEV) {
        verifyPreviewSignup(previewChallenge,previewChallenge?.channel === 'email' ? email : phone,code,true);
        savePreviewSession(null);
        setDemoSession(null);
        await supabase.auth.signOut({scope:'local'});
        setPreviewChallenge(null);
        await navigate({to:'/',search:{created:true}});
        return;
      }
      if (!challenge || !code.trim()) throw new Error('Send a code to your email or phone, then enter the code.');
      await createAccount({data:{account,token:challenge.token,code,photo:''}});
      setDemoSession(null);
      await supabase.auth.signOut();
      await navigate({to:'/', search:{created:true}});
    } catch(err) {
      setError(err instanceof z.ZodError ? (err.issues[0]?.message ?? 'Check the form') : err instanceof Error ? err.message : 'Registration failed');
    } finally { setBusy(false); }
  }
  function changed() { setChallenge(null); setPreviewChallenge(null); setCode(''); setNotice(''); }
  return <div className="flex min-h-screen items-center justify-center px-6 py-12"><div className="w-full max-w-lg">
    <AppBrand large className="mb-8"/>
    <h1 className="text-2xl font-semibold">Create your account</h1>
    <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
      <div className="sm:col-span-2"><AccountTypeSelector value={accountType} onChange={value => {setAccountType(value);setError('');changed();}}/></div>
      <Field label="Full Name" className="sm:col-span-2"><Input name="full_name" required maxLength={100} autoComplete="name"/></Field>
      <Field label="Email" className="sm:col-span-2"><div className="flex gap-2"><Input name="email" type="email" maxLength={255} value={email} onChange={e => {setEmail(e.target.value);changed();}}/><Button type="button" variant="outline" disabled={busy || !email.trim()} aria-label="Send code to email" onClick={() => void send('email')}>Send code</Button></div></Field>
      <Field label="Phone Number" className="sm:col-span-2"><div className="flex gap-2"><Input name="phone" type="tel" maxLength={30} placeholder="+20…" value={phone} onChange={e => {setPhone(e.target.value);changed();}}/><Button type="button" variant="outline" disabled={busy || !phone.trim()} aria-label="Send code to phone" onClick={() => void send('phone')}>Send code</Button></div></Field>
      {notice && <p role="status" className="text-sm text-muted-foreground sm:col-span-2">{notice}</p>}
      {(challenge || previewChallenge) && <Field label="Verification code" className="sm:col-span-2"><Input required value={code} onChange={e => setCode(e.target.value)} maxLength={128} autoComplete="one-time-code"/></Field>}
      <Field label="Password" className="sm:col-span-2"><Input name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password"/></Field>
      {accountType === 'individual' && <><Field label="Date of birth"><Input name="dob" type="date"/></Field><Field label="Gender"><select name="gender" className="h-10 w-full rounded-md border bg-card px-3"><option value="">Not specified</option><option>Male</option><option>Female</option></select></Field></>}
      {error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <Button type="submit" disabled={busy} className="sm:col-span-2">{busy ? 'Creating account…' : 'Create account'}</Button>
      <p className="text-sm text-muted-foreground sm:col-span-2">Already have an account? <Link to="/" className="text-primary">Sign in</Link></p>
    </form>
  </div></div>;
}
