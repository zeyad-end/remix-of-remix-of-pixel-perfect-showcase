import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Check, MessageCircle, RotateCcw } from 'lucide-react';
import { useCloud } from './CloudProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Field } from './kit';
import { makeSampleRequest, readSampleRequest, resetSampleRequest, saveSampleRequest, type SampleRequest } from '@/lib/prototype-scenario';
import { localDate } from '@/lib/gym-period';
import logo from '@/assets/gyvora-logo.png.asset.json';

const plans = [
  { value: 'Monthly Plan', label: 'Monthly Subscription', detail: 'Subscription renewed every month' },
  { value: 'Annual Plan', label: 'Annual Subscription', detail: 'Subscription renewed every year' },
] as const;
const steps = ['Plan selection', 'Request sent', 'Pending approval'];

export function PrototypeSubscriptionRequest() {
  const c = useCloud();
  const navigate = useNavigate();
  const [request, setRequest] = useState<SampleRequest | null>(readSampleRequest);
  const [step, setStep] = useState(() => readSampleRequest() ? 2 : 0);
  const [name, setName] = useState(request?.gymName ?? 'GYVORA');
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
    resetSampleRequest(); setRequest(null); setName('GYVORA'); setPlan(''); setStep(0); setError(''); void c.refresh();
  }

  return <main className="subscription-wizard min-h-screen bg-background px-4 py-6 sm:px-8">
    <div className="mx-auto w-full max-w-[780px]">
      <nav aria-label="Subscription progress" className="mb-3">
        <div className="mb-3 flex justify-between gap-3 text-xs"><span className="font-semibold">{step + 1} of 3 · {steps[step]}</span><span className="text-muted-foreground">{steps[step]}</span></div>
        <div role="progressbar" aria-label="Subscription steps" aria-valuemin={0} aria-valuemax={3} aria-valuenow={step + 1} className="h-1 overflow-hidden rounded-full bg-secondary"><div className={`h-full bg-primary transition-all motion-reduce:transition-none ${step === 0 ? 'w-1/3' : step === 1 ? 'w-2/3' : 'w-full'}`} /></div>
      </nav>
      <section className="overflow-hidden rounded-2xl border bg-card" aria-label="Gym subscription request">
        <header className="flex items-center justify-between gap-3 border-b px-5 py-3">
          <div className="flex min-w-0 items-center gap-2"><img src={logo.url} alt="GYVORA logo" width={28} height={28} className="h-7 w-7 shrink-0 rounded-lg object-contain" /><p className="min-w-0 break-words text-sm"><strong>GYVORA</strong><span className="text-muted-foreground"> · Gym Account</span></p></div>
        </header>
        <div className="mx-auto max-w-[616px] px-5 py-7 sm:px-0">
          {step === 0 ? <form onSubmit={e => { e.preventDefault(); void send(); }} noValidate>
            <h1 className="text-xl font-semibold tracking-normal">Choose your gym subscription</h1><p className="mt-1 text-sm text-muted-foreground">Select a plan to send your request to the administrator.</p>
            <div className="mt-4"><Field label="Gym name"><Input aria-label="Gym name" value={name} maxLength={100} onChange={e => setName(e.target.value)} className="h-9 bg-surface" /></Field></div>
            <fieldset className="mt-5 grid gap-3 sm:grid-cols-2"><legend className="sr-only">Subscription plan</legend>
              {plans.map(p => <label key={p.value} className={`relative cursor-pointer rounded-xl border bg-surface px-4 py-6 transition-colors ${plan === p.value ? 'border-primary' : 'border-input hover:border-primary/50'}`}>
                <input aria-label={p.label} type="radio" name="plan" value={p.value} checked={plan === p.value} onChange={() => { setPlan(p.value); setError(''); }} className="peer sr-only" />
                <span className="block text-sm font-semibold peer-focus-visible:outline peer-focus-visible:outline-primary">{p.label}</span><span className="mt-1 block text-xs text-muted-foreground">{p.detail}</span>
                {plan === p.value && <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />}
              </label>)}
            </fieldset>
            <p className="mt-3 text-xs font-semibold text-primary">{plan ? `${plans.find(p => p.value === plan)?.label} selected` : 'Choose a plan to continue'}</p>
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-surface px-4 py-3 text-xs text-muted-foreground"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-success/50 text-success"><MessageCircle className="h-3 w-3" /></span><p>Questions about your request? Contact us on WhatsApp.<span className="mt-1 block text-[11px]">No WhatsApp number is saved for this prototype.</span></p></div>
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
            <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="secondary" disabled={busy} className="h-10" onClick={() => void navigate({ to: '/' })}>Cancel</Button><Button type="submit" disabled={busy || !plan || !name.trim()} className="h-10">{busy ? 'Sending…' : 'Send Request'}</Button></div>
          </form> : step === 1 ? <div className="mx-auto my-2 max-w-[510px] rounded-2xl border bg-surface px-5 py-6 text-center sm:px-10">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success"><Check className="h-7 w-7" /></span>
            <h1 className="text-xl font-semibold tracking-normal">Request sent</h1>
            <p role="status" className="mt-2 text-sm leading-relaxed text-muted-foreground">Your request has been sent and is waiting for administrator approval.</p>
            <p className="mt-3 break-words text-xs text-muted-foreground">{request?.gymName} · {plans.find(p => p.value === request?.plan)?.label}</p>
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row"><Button variant="secondary" disabled={busy} className="h-10" onClick={() => setStep(2)}>Done</Button><Button disabled={busy} className="h-auto min-h-10 whitespace-normal py-2" onClick={() => void skip()}>Skip — Enter Dashboard</Button></div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Skip grants temporary prototype access only. It does not approve or mark the subscription as paid. The request remains Pending.</p>
          </div> : <div>
            <h1 className="text-xl font-semibold tracking-normal">Subscription approval pending</h1><p role="status" className="mt-1 text-sm text-muted-foreground">Your subscription request has been saved.</p>
            <div className="mt-6 rounded-xl border bg-surface p-4"><h2 className="text-sm font-semibold tracking-normal">Request status</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">An administrator will review your gym request. Dashboard access remains unavailable until approval unless the temporary prototype access from Skip is active.</p><span className="mt-2 inline-block rounded-full bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">Pending · Awaiting approval</span><p className="mt-3 break-words text-xs text-muted-foreground">{request?.gymName} · {plans.find(p => p.value === request?.plan)?.label} · {request?.requestDate}</p></div>
            <div className="mt-5 flex justify-end"><Button variant="secondary" className="h-auto min-h-10 whitespace-normal py-2" onClick={() => { setStep(0); setError(''); }}>Back to subscription options</Button></div>
          </div>}
          {step !== 0 && error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        </div>
        <footer className="flex items-center justify-between gap-3 border-t px-5 py-3 text-[11px] text-muted-foreground"><span>GYVORA · Gym subscription request</span><span className="shrink-0">Screen {step + 1} / 3</span></footer>
      </section>
      <nav aria-label="Wizard navigation" className="mt-3 flex items-center justify-between gap-2"><Button variant="secondary" size="sm" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}>Previous</Button><span className="text-center text-xs font-semibold">{steps[step]}</span><Button variant="secondary" size="sm" disabled={step === 2 || busy || (step === 0 && (!plan || !name.trim()))} onClick={() => step === 0 ? void send() : setStep(2)}>Next</Button></nav>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground"><p>Prototype only — fictional data. No real account, request or payment.</p>{request && <Button variant="ghost" size="sm" onClick={reset}><RotateCcw />Reset flow</Button>}</div>
    </div>
  </main>;
}
