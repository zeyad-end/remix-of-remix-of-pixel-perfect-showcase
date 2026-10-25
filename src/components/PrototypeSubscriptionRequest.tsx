import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, Check, CheckCheck, Clock3, Dumbbell, MessageCircle, RotateCcw } from 'lucide-react';
import { useCloud } from './CloudProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Field, StatusPill } from './kit';
import { makeSampleRequest, readSampleRequest, resetSampleRequest, saveSampleRequest, type SampleRequest } from '@/lib/prototype-scenario';
import { localDate } from '@/lib/gym-period';

const plans = [
  { value: 'Monthly Plan', label: 'Monthly subscription', detail: 'A flexible monthly subscription.' },
  { value: 'Annual Plan', label: 'Annual subscription', detail: 'One subscription for the full year.' },
] as const;
const steps = ['Subscription', 'Request sent', 'Pending approval'];

export function PrototypeSubscriptionRequest() {
  const c = useCloud();
  const navigate = useNavigate();
  const [request, setRequest] = useState<SampleRequest | null>(readSampleRequest);
  const [step, setStep] = useState(() => readSampleRequest() ? 2 : 0);
  const [name, setName] = useState(request?.gymName ?? 'Sample Gym');
  const [plan, setPlan] = useState(request?.plan ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    try {
      const row = makeSampleRequest(name, plan, false, localDate());
      saveSampleRequest(row); setRequest(row); setError(''); setStep(1);
      await c.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save the fictional request.'); }
    finally { setBusy(false); }
  }
  async function skip() {
    if (!request) return;
    setBusy(true);
    try {
      const row = { ...request, skipped: true };
      saveSampleRequest(row); setRequest(row); setError('');
      await c.refresh(); await navigate({ to: '/dashboard' });
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not open the prototype dashboard.'); }
    finally { setBusy(false); }
  }
  function reset() {
    resetSampleRequest(); setRequest(null); setName('Sample Gym'); setPlan(''); setStep(0); setError(''); void c.refresh();
  }

  return <main className="subscription-wizard flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
    <div className="w-full max-w-2xl">
      <nav aria-label="Subscription progress" className="mb-7">
        <ol className="grid grid-cols-3 gap-2 sm:gap-4">
          {steps.map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined} className={index <= step ? 'text-primary' : 'text-muted-foreground'}>
            <div className={`mb-3 h-1 rounded-full ${index <= step ? 'bg-primary' : 'bg-secondary'}`} />
            <div className="flex items-start gap-2 text-xs sm:text-sm"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${index <= step ? 'border-primary' : 'border-input'}`}>{index < step ? <Check className="h-3 w-3" /> : index + 1}</span><span>{label}</span></div>
          </li>)}
        </ol>
      </nav>
      <section className="overflow-hidden rounded-lg border bg-card" aria-label="Gym subscription request">
        <header className="flex items-center gap-3 border-b px-6 py-5 sm:px-8">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary"><Dumbbell className="h-5 w-5" /></span>
          <div className="min-w-0"><p className="break-words font-display font-semibold">{(step === 0 ? name : request?.gymName) || 'Sample Gym'}</p><p className="mt-1 text-xs text-muted-foreground">Gym Account</p></div>
        </header>

        {step === 0 ? <form onSubmit={e => { e.preventDefault(); void send(); }} noValidate>
          <div className="space-y-6 px-6 py-8 sm:px-8">
            <div><h1 className="text-2xl font-semibold tracking-normal">Choose your gym subscription</h1><p className="mt-2 text-sm text-muted-foreground">Select a plan to submit for administrator review.</p></div>
            <Field label="Gym name"><Input aria-label="Gym name" value={name} maxLength={100} onChange={e => setName(e.target.value)} className="h-11 bg-background" /></Field>
            <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="sr-only">Subscription plan</legend>
              {plans.map(p => <label key={p.value} className={`relative flex cursor-pointer flex-col gap-3 rounded-lg border p-5 transition-colors ${plan === p.value ? 'border-primary bg-primary/5' : 'border-input bg-background hover:border-primary/50'}`}>
                <div className="flex items-center justify-between gap-3"><span className="font-semibold">{p.label}</span><input aria-label={p.label} type="radio" name="plan" value={p.value} checked={plan === p.value} onChange={() => { setPlan(p.value); setError(''); }} className="h-4 w-4 shrink-0 accent-primary" /></div>
                <span className="text-sm leading-relaxed text-muted-foreground">{p.detail}</span>
              </label>)}
            </fieldset>
            <div className="flex items-start gap-3 border-t pt-5 text-sm leading-relaxed text-muted-foreground"><MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><p>Questions about your subscription? Contact us on WhatsApp.<span className="block text-xs">No WhatsApp number is saved for this fictional prototype.</span></p></div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </div>
          <footer className="flex justify-between gap-3 border-t bg-background/40 px-6 py-5 sm:px-8"><Button type="button" variant="outline" disabled={busy} onClick={() => void navigate({ to: '/' })}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send Request'}<ArrowRight /></Button></footer>
        </form> : <>
          <div className="px-6 py-9 sm:px-8">
            <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-full border ${step === 1 ? 'border-success/30 bg-success/10 text-success' : 'border-primary/30 bg-primary/10 text-primary'}`}>{step === 1 ? <CheckCheck className="h-7 w-7" /> : <Clock3 className="h-7 w-7" />}</div>
            <h1 className="text-2xl font-semibold tracking-normal">{step === 1 ? 'Request sent' : 'Subscription approval pending'}</h1>
            <p role="status" className="mt-3 text-sm leading-relaxed text-muted-foreground">{step === 1 ? 'Your fictional subscription request has been saved for the administrator preview.' : 'Your fictional request is awaiting administrator approval. No administrator approval has been granted.'}</p>
            {step === 1 ? <p className="mt-5 border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground">Skip grants prototype access only. It does not approve your request or mark it as paid. Your request remains Pending.</p> : <dl className="mt-6 space-y-4 border-y py-5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2"><dt className="text-muted-foreground">Request status</dt><dd><StatusPill status={request?.status ?? 'Pending'} /></dd></div>
              <div className="flex justify-between gap-4"><dt className="shrink-0 text-muted-foreground">Gym name</dt><dd className="break-words text-right">{request?.gymName}</dd></div>
              <div className="flex flex-wrap justify-between gap-2"><dt className="text-muted-foreground">Selected plan</dt><dd>{plans.find(p => p.value === request?.plan)?.label}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Submitted</dt><dd>{request?.requestDate}</dd></div>
            </dl>}
            {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
          </div>
          <footer className="flex flex-col gap-3 border-t bg-background/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            {step === 1 ? <><Button variant="outline" disabled={busy} onClick={() => setStep(2)}>Done</Button><Button disabled={busy} className="h-auto min-h-10 whitespace-normal py-2" onClick={() => void skip()}>Skip — Enter Demo Dashboard<ArrowRight /></Button></> : <Button variant="outline" onClick={() => { setStep(0); setError(''); }}><ArrowLeft />Back to subscription options</Button>}
          </footer>
        </>}
      </section>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><p>Prototype only — fictional data. No real account, request or payment.</p>{request && <Button variant="ghost" size="sm" onClick={reset}><RotateCcw />Reset flow</Button>}</div>
    </div>
  </main>;
}