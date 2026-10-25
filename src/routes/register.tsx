import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/kit';
import { seo } from '@/lib/seo';
import { AccountTypeSelector } from '@/components/AccountTypeSelector';
import { verifyPreviewSignup, type PreviewChallenge } from '@/lib/preview-session';
import { AppBrand } from '@/components/AppBrand';

export const Route = createFileRoute('/register')({
  head: () => seo('Create account prototype', 'Review the simulated GYVORA Gym and Client account-creation flow. No accounts or codes are created.'),
  component: Register,
});
function Register() {
  const [error, setError] = useState('');
  const [accountType, setAccountType] = useState<'gym' | 'individual'>('gym');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<PreviewChallenge | null>(null);
  const [verified, setVerified] = useState(false);
  const [success, setSuccess] = useState(false);
  function changed() {setChallenge(null);setVerified(false);setCode('');setError('');}
  function send(channel: 'email' | 'phone') {
    const contact = (channel === 'email' ? email : phone).trim();
    if (!contact) {setError('Enter an email or phone number.');return;}
    setChallenge({channel,contact,expiresAt:Date.now()+600000});setVerified(false);setCode('');setError('');
  }
  function verify() {
    try {verifyPreviewSignup(challenge,challenge?.channel === 'email' ? email : phone,code,true);setVerified(true);setError('');}
    catch(e) {setError(e instanceof Error ? e.message : 'Enter a sample code.');}
  }
  return <div className="flex min-h-screen items-center justify-center px-6 py-12"><div className="w-full max-w-lg">
    <AppBrand large className="mb-8"/>
    <h1 className="text-2xl font-semibold">Create your account</h1>
    <p role="status" className="mt-3 text-sm text-muted-foreground">Prototype only — no real account or verification is created</p>
    {success ? <div className="mt-8 space-y-4"><h2 className="text-xl font-semibold">Prototype signup complete</h2><p className="text-sm text-muted-foreground">No account was created. No entered details were saved.</p><Button asChild><Link to="/">Back to login</Link></Button></div> :
    <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={e => {e.preventDefault();if(!email.trim()&&!phone.trim()){setError('Enter at least one contact method.');return;}if(!verified){setError('Send a simulated code and select Verify first.');return;}e.currentTarget.reset();setEmail('');setPhone('');setCode('');setChallenge(null);setSuccess(true);}}>
      <div className="sm:col-span-2"><AccountTypeSelector value={accountType} onChange={value => {if(value==='dashboard')return;setAccountType(value);changed();}}/></div>
      <Field label="Full Name" className="sm:col-span-2"><Input name="full_name" required maxLength={100} autoComplete="off"/></Field>
      <Field label="Email" className="sm:col-span-2"><div className="flex gap-2"><Input name="email" type="email" value={email} onChange={e => {setEmail(e.target.value);changed();}} autoComplete="off"/><Button type="button" variant="outline" aria-label="Send code to email" onClick={() => send('email')}>Send Code</Button></div></Field>
      <Field label="Phone Number" className="sm:col-span-2"><div className="flex gap-2"><Input name="phone" type="tel" value={phone} onChange={e => {setPhone(e.target.value);changed();}} autoComplete="off"/><Button type="button" variant="outline" aria-label="Send code to phone" onClick={() => send('phone')}>Send Code</Button></div></Field>
      {challenge && <><p className="text-sm text-muted-foreground sm:col-span-2">Simulated verification — no email or SMS sent. Enter any non-empty sample code.</p><Field label="Verification code" className="sm:col-span-2"><div className="flex gap-2"><Input value={code} onChange={e => {setCode(e.target.value);setVerified(false);}} autoComplete="off"/><Button type="button" variant="outline" onClick={verify}>Verify</Button></div></Field></>}
      {verified && <p role="status" className="text-sm text-success sm:col-span-2">Sample code accepted — verification simulated.</p>}
      <Field label="Password" className="sm:col-span-2"><Input name="password" type="password" required minLength={8} maxLength={128} autoComplete="off"/></Field>
      {accountType === 'individual' && <><Field label="Date of birth"><Input name="dob" type="date"/></Field><Field label="Gender"><select name="gender" className="h-10 w-full rounded-md border bg-card px-3"><option value="">Not specified</option><option>Male</option><option>Female</option></select></Field></>}
      {error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <Button type="submit" className="sm:col-span-2">Create Account</Button>
      <p className="text-sm text-muted-foreground sm:col-span-2">Already have an account? <Link to="/" className="text-primary">Sign in</Link></p>
    </form>}
  </div></div>;
}
