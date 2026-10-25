import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { MessageCircle, Clock } from 'lucide-react';
import { useCloud } from '@/components/CloudProvider';
import { supabase } from '@/integrations/supabase/client';
import { requestSubscription } from '@/lib/cloud.functions';
import { startOwnerTrial } from '@/lib/owner-gate.functions';
import { getDemoSessionInfo, getDemoAccount, updateDemoAccount, submitDemoGymRequest, useDemoStore, whatsappLink } from '@/lib/demo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, PageHeader } from '@/components/kit';
import { seo } from '@/lib/seo';
import { readPreviewSession } from '@/lib/preview-session';
import { PrototypeSubscriptionRequest } from '@/components/PrototypeSubscriptionRequest';

export const Route = createFileRoute('/subscription-request')({
  head: () => seo('Gym subscription request', 'Choose a Monthly or Annual GYVORA subscription and request administrator approval.'),
  component: Request,
});

const OPTIONS = [
  { value: 'Monthly Plan', label: 'Monthly Subscription', hint: 'Billed every month — flexible, cancel any time.' },
  { value: 'Annual Plan', label: 'Annual Subscription', hint: 'One yearly agreement for the full twelve months.' },
] as const;
const SENT = 'Your request has been sent and is waiting for approval from an administrator.';

function Request() {
  return readPreviewSession()?.type === 'gym' ? <PrototypeSubscriptionRequest/> : <ExistingRequest/>;
}
function ExistingRequest() {
  const c = useCloud();
  const navigate = useNavigate();
  const router = useRouter();
  const submit = useServerFn(requestSubscription);
  const startTrial = useServerFn(startOwnerTrial);
  const whatsapp = useDemoStore((s) => s.platformWhatsapp);
  const [cloudWhatsapp,setCloudWhatsapp]=useState('');
  const requests = useDemoStore((s) => s.requests);
  const [cloudReq, setCloudReq] = useState<{ status: string; plan: string; gym: string; date: string } | null>(null);
  const [plan, setPlan] = useState('');
  const [gymName, setGymName] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const demo = getDemoSessionInfo();
  const demoAcc = getDemoAccount();
  const isDemoOwner = demo?.kind === 'owner';
  const demoReq = isDemoOwner ? requests.find((r) => r.email === demo?.email && r.submittedAt) ?? null : null;
  const req = demoReq ? { status: demoReq.status, plan: demoReq.plan, gym: demoReq.gymName, date: demoReq.requestDate } : cloudReq;
  const status = req?.status ?? '';

  useEffect(() => {
    setGymName((n) => n || demoAcc?.name || '');
    if (!isDemoOwner && c.profile)
      void supabase.from('owner_requests').select('*').eq('user_id', c.profile.id).maybeSingle()
        .then(({ data }) => { const d = data as Record<string, unknown> | null; setCloudReq(d ? { status: String(d['status'] ?? ''), plan: String(d['plan'] ?? ''), gym: String(d['gym_name'] ?? d['name'] ?? ''), date: String(d['created_at'] ?? '').slice(0, 10) } : null); });
  }, [c.profile?.id]);
  useEffect(()=>{if(!isDemoOwner&&c.profile)void supabase.from('platform_settings').select('whatsapp').eq('id',true).maybeSingle().then(({data})=>setCloudWhatsapp(data?.whatsapp??''));},[c.profile?.id,isDemoOwner]);

  async function onSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!plan) return setError('Select Monthly or Annual Subscription before sending.');
    if (!gymName.trim()) return setError('Enter your gym name.');
    setBusy(true);
    setError('');
    try {
      if (isDemoOwner) {
        submitDemoGymRequest(gymName, plan); // returns the existing pending request instead of duplicating
        if (demoAcc) updateDemoAccount(demoAcc.email, { requestPending: true });
      } else {
        await submit({ data: { name: gymName, plan: plan as 'Monthly Plan' | 'Annual Plan' } });
        setCloudReq({ status: 'Pending', plan, gym: gymName, date: new Date().toISOString().slice(0, 10) });
      }
      setConfirmOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  async function onSkip() {
    setBusy(true);
    setError('');
    try {
      if (demoAcc) updateDemoAccount(demoAcc.email, { skipped: true, trialStartedAt:demoAcc.trialStartedAt??new Date().toISOString() });
      else await startTrial({}); // server records the one-hour trial start; refresh/re-login cannot restart it
      setConfirmOpen(false);
      await c.refresh();
      await navigate({ to: '/dashboard' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the trial. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function onCancel() {
    if (window.history.length > 1) router.history.back();
    else void navigate({ to: '/' });
  }

  const planLabel = (p: string) => OPTIONS.find((o) => o.value === p)?.label ?? p;
  const waText = `Hello, I'm ${demoAcc?.name || demo?.name || 'a gym owner'} (${gymName || req?.gym || 'my gym'}). I have a question about my ${planLabel(plan || req?.plan || '') || 'subscription'} request.`;
  const contact = (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
      {(isDemoOwner?whatsapp:cloudWhatsapp) ? (
        <span>Questions about your request? <a className="text-primary" href={whatsappLink((isDemoOwner?whatsapp:cloudWhatsapp)??'', waText)} target="_blank" rel="noopener noreferrer">Contact us on WhatsApp.</a></span>
      ) : (
        <span>Questions about your request? WhatsApp contact isn't set yet — the platform administrator can add the number in Platform Settings.</span>
      )}
    </p>
  );
  const showStatus = status && !confirmOpen && !(status === 'Approved');

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      {status === 'Approved' && !confirmOpen ? (
        <div className="space-y-4">
          <PageHeader title="Gym subscription" />
          <p role="status">Your gym subscription is approved.</p>
          <Button asChild><Link to="/dashboard">Open your gym</Link></Button>
        </div>
      ) : showStatus ? (
        <div className="space-y-5">
          <PageHeader title={status === 'Rejected' ? 'Request rejected' : 'Pending Approval'} />
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-medium"><Clock className="h-4 w-4 text-primary" />Status: {status}</div>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Gym</dt><dd>{req?.gym || '—'}</dd>
              <dt className="text-muted-foreground">Plan</dt><dd>{planLabel(req?.plan ?? '')}</dd>
              <dt className="text-muted-foreground">Submitted</dt><dd>{req?.date || '—'}</dd>
            </dl>
          </div>
          <p role="status" className="text-sm text-muted-foreground">
            {status === 'Rejected'
              ? 'Your subscription request was rejected, so the Gym Owner dashboard is unavailable. Contact the administrator.'
              : 'We received your request. The Gym Owner dashboard is unavailable while approval is pending — you’ll get access on your next sign-in once an administrator approves it.'}
          </p>
          {status === 'Pending' && (
            <div className="space-y-2">
              <Button type="button" variant="secondary" disabled={busy} onClick={() => void onSkip()}>{busy ? 'Starting…' : 'Skip — start a 1-hour trial'}</Button>
              <p className="text-xs text-muted-foreground">The trial gives one hour of dashboard access while your request waits for approval. It starts once and cannot be restarted.</p>
            </div>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {contact}
          <Button type="button" variant="outline" onClick={() => void c.logout()}>Sign Out</Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={onSend} noValidate>
          <PageHeader title="Choose a subscription" />
          <Field label="Gym name"><Input value={gymName} onChange={(e) => setGymName(e.target.value)} maxLength={100} /></Field>
          <fieldset className="space-y-3" role="radiogroup">
            <legend className="mb-2 text-sm">Choose a subscription</legend>
            {OPTIONS.map((o) => (
              <label key={o.value} className="flex cursor-pointer items-start gap-3 rounded-md border p-4 has-checked:border-primary has-checked:bg-secondary">
                <input type="radio" name="plan" value={o.value} checked={plan === o.value} onChange={() => { setPlan(o.value); setError(''); }} className="mt-1" />
                <span><span className="block font-medium">{o.label}</span><span className="block text-sm text-muted-foreground">{o.hint}</span></span>
              </label>
            ))}
          </fieldset>
          {contact}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={busy} className="flex-1">{busy ? 'Sending…' : 'Send Request'}</Button>
          </div>
        </form>
      )}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request sent</DialogTitle>
            <DialogDescription>{SENT}</DialogDescription>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">{isDemoOwner?'Local demo trial — saved in this browser, not a server-authorized account.':'Skip starts a one-hour trial of the Gym Owner dashboard.'} Your request stays Pending — it is not approved or paid.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Done</Button>
            <Button disabled={busy} onClick={() => void onSkip()}>Skip — Start 1-Hour Trial</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
