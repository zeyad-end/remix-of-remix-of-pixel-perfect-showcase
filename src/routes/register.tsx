import { createFileRoute, Link, useHydrated, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/kit';
import { seo } from '@/lib/seo';
import { AccountTypeSelector } from '@/components/AccountTypeSelector';
import { AppleIcon, GoogleIcon } from '@/components/SocialSignIn';
import { verifyPreviewSignup, type PreviewChallenge } from '@/lib/preview-session';
import { AppBrand } from '@/components/AppBrand';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/register')({
  head: () => seo('Create account', 'Create a GYVORA Gym or Client account.'),
  component: Register,
});
function Register() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [accountType, setAccountType] = useState<'gym' | 'individual'>('gym');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<PreviewChallenge | null>(null);
  const [verified, setVerified] = useState(false);
  const [success, setSuccess] = useState(false);
  function prototypeSocial() {
    toast.info('Prototype only — social sign-up is not connected and no account is created.');
  }
  function changed() {setChallenge(null);setVerified(false);setCode('');setError('');}
  function send(channel: 'email' | 'phone') {
    const contact = (channel === 'email' ? email : phone).trim();
    if (!contact) {setError('Enter an email or phone number.');return;}
    setChallenge({channel,contact,expiresAt:Date.now()+600000});setVerified(false);setCode('');setError('');
  }
  function verify() {
    try {verifyPreviewSignup(challenge,challenge?.channel === 'email' ? email : phone,code,import.meta.env.DEV);setVerified(true);setError('');}
    catch(e) {setError(e instanceof Error ? e.message : 'Enter a sample code.');}
  }
  async function createAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fullName = String(new FormData(form).get('full_name') ?? '').trim();
    const password = String(new FormData(form).get('password') ?? '');
    if (!fullName) {setError('Enter your full name.');return;}
    if (!email.trim()) {setError('Enter an email address — it is your sign-in identifier.');return;}
    if (!verified) {setError('Send a simulated code and select Verify first.');return;}
    setBusy(true);setError('');
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName, phone: phone.trim(), account_type: accountType === 'gym' ? 'owner' : 'client' } },
      });
      if (signUpError) throw signUpError;
      await supabase.auth.signOut();
      form.reset();setEmail('');setPhone('');setCode('');setChallenge(null);setSuccess(true);
    } catch (err) {setError(err instanceof Error ? err.message : 'Could not create the account. Please try again.');}
    finally {setBusy(false);}
  }
  return <div className="flex min-h-screen items-center justify-center px-6 py-12"><div className="w-full max-w-lg">
    <AppBrand large className="mb-8"/>
    <h1 className="text-2xl font-semibold">Create your account</h1>
    <p role="status" className="mt-3 text-sm text-muted-foreground">Creates a real saved account. In this preview the code step is simulated — no email or SMS is sent.</p>
    {success ? <div className="mt-8 space-y-4"><h2 className="text-xl font-semibold">Account created</h2><p className="text-sm text-muted-foreground">Your account was saved. Sign in with your email and password.</p><Button onClick={() => void navigate({ to: '/', search: { created: true } })}>Back to login</Button></div> :
    <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={e => {void createAccount(e);}}>
      <div className="sm:col-span-2"><AccountTypeSelector value={accountType} onChange={value => {if(value==='dashboard')return;setAccountType(value);changed();}}/></div>
      <Field label="Full Name" className="sm:col-span-2"><Input name="full_name" required maxLength={100} autoComplete="off"/></Field>
      <Field label="Email" className="sm:col-span-2"><div className="flex gap-2"><Input name="email" type="email" value={email} onChange={e => {setEmail(e.target.value);changed();}} autoComplete="off"/><Button type="button" variant="outline" aria-label="Send code to email" onClick={() => send('email')}>Send Code</Button></div></Field>
      <Field label="Phone Number" className="sm:col-span-2"><div className="flex gap-2"><Input name="phone" type="tel" value={phone} onChange={e => {setPhone(e.target.value);changed();}} autoComplete="off"/><Button type="button" variant="outline" aria-label="Send code to phone" onClick={() => send('phone')}>Send Code</Button></div></Field>
      {challenge && <><p className="text-sm text-muted-foreground sm:col-span-2">Simulated verification — no email or SMS sent. Enter any non-empty sample code.</p><Field label="Verification code" className="sm:col-span-2"><div className="flex gap-2"><Input value={code} onChange={e => {setCode(e.target.value);setVerified(false);}} autoComplete="off"/><Button type="button" variant="outline" onClick={verify}>Verify</Button></div></Field></>}
      {verified && <p role="status" className="text-sm text-success sm:col-span-2">Sample code accepted — verification simulated.</p>}
      <Field label="Password" className="sm:col-span-2"><Input name="password" type="password" required minLength={8} maxLength={128} autoComplete="off"/></Field>
      {accountType === 'individual' && <><Field label="Date of birth"><Input name="dob" type="date"/></Field><Field label="Gender"><select name="gender" className="h-10 w-full rounded-md border bg-card px-3"><option value="">Not specified</option><option>Male</option><option>Female</option></select></Field></>}
      {error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <Button type="submit" disabled={!hydrated} className="sm:col-span-2">Create Account</Button>
      <div className="sm:col-span-2 grid gap-2">
        <div className="relative text-center text-xs text-muted-foreground"><span className="relative z-10 bg-background px-2">or continue with</span><span className="absolute inset-x-0 top-1/2 border-t" /></div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" className="h-11 gap-2 bg-card" aria-label="Sign up with Google" onClick={prototypeSocial}><GoogleIcon />Continue with Google</Button>
          <Button type="button" variant="outline" className="h-11 gap-2 bg-card" aria-label="Sign up with Apple" onClick={prototypeSocial}><AppleIcon />Continue with Apple</Button>
        </div>
        <p role="status" className="text-xs text-muted-foreground">Social sign-up buttons are visual only in this prototype — no provider connection, no account created.</p>
      </div>
      <p className="text-sm text-muted-foreground sm:col-span-2">Already have an account? <Link to="/" className="text-primary">Sign in</Link></p>
    </form>}
  </div></div>;
}
