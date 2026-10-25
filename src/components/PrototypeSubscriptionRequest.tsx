import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { RotateCcw } from 'lucide-react';
import { useCloud } from './CloudProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Field, PageHeader, StatusPill } from './kit';
import { makeSampleRequest, readSampleRequest, resetSampleRequest, saveSampleRequest, type SampleRequest } from '@/lib/prototype-scenario';
import { localDate } from '@/lib/gym-period';

export function PrototypeSubscriptionRequest() {
  const c=useCloud();const navigate=useNavigate();
  const [request,setRequest]=useState<SampleRequest | null>(readSampleRequest);
  const [name,setName]=useState(request?.gymName ?? '');
  const [plan,setPlan]=useState(request?.plan ?? '');
  const [error,setError]=useState('');
  async function send(skipped: boolean) {
    try {
      const row=makeSampleRequest(skipped ? name.trim() || 'Sample Gym' : name,skipped ? plan || 'Monthly Plan' : plan,skipped,localDate());
      saveSampleRequest(row);setRequest(row);setError('');await c.refresh();
      if(skipped) await navigate({to:'/dashboard'});
    } catch(e){setError(e instanceof Error?e.message:'Could not open the prototype.');}
  }
  function reset() {resetSampleRequest();setRequest(null);setName('');setPlan('');setError('');void c.refresh();}
  return <div className="mx-auto max-w-lg px-6 py-12"><PageHeader title={request ? 'Sample pending request' : 'Choose a subscription'}/><p className="mb-6 text-sm text-muted-foreground">Fictional prototype only — no account, database request or real approval is created.</p>
    {request ? <section className="space-y-5"><StatusPill status="Pending"/><dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-sm"><dt>Gym</dt><dd className="break-words">{request.gymName}</dd><dt>Plan</dt><dd>{request.plan === 'Monthly Plan' ? 'Monthly Subscription' : 'Annual Subscription'}</dd><dt>Date</dt><dd>{request.requestDate}</dd></dl><p className="text-sm text-muted-foreground">This fictional request is also shown in the administrator prototype. Dashboard access here does not approve it.</p><div className="flex flex-wrap gap-2"><Button asChild><Link to="/dashboard">Continue to Gym Dashboard</Link></Button><Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4"/>Reset flow</Button></div></section> : <form className="space-y-5" onSubmit={e=>{e.preventDefault();void send(false);}} noValidate><Field label="Gym name"><Input aria-label="Gym name" value={name} maxLength={100} onChange={e=>setName(e.target.value)}/></Field><fieldset className="space-y-3"><legend className="mb-2 text-sm">Subscription</legend>{[['Monthly Plan','Monthly Subscription'],['Annual Plan','Annual Subscription']].map(([value,label])=><label key={value} className="flex cursor-pointer items-center gap-3 rounded-md border p-4 has-checked:border-primary has-checked:bg-secondary"><input type="radio" name="plan" value={value} checked={plan===value} onChange={()=>setPlan(value ?? '')}/><span>{label}</span></label>)}</fieldset>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex gap-3"><Button type="submit" className="flex-1">Send Request</Button><Button type="button" variant="outline" className="flex-1" onClick={()=>void send(true)}>Skip</Button></div><p className="text-xs text-muted-foreground">Skip opens the dashboard with a fictional pending example; an empty selection uses Sample Gym / Monthly.</p></form>}
  </div>;
}