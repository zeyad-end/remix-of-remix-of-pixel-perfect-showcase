import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCloud } from './CloudProvider';
import { prototypeTrialActive, readSampleRequest } from '@/lib/prototype-scenario';

export function PrototypeGymTrialBoundary({ children }: { children: ReactNode }) {
  const c = useCloud();
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now);
  const request = readSampleRequest();
  const active = prototypeTrialActive(request, now);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 1000);
    window.addEventListener('focus', tick);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', tick); };
  }, []);
  useEffect(() => {
    if (active) return;
    if (request?.trialExpiresAt !== undefined) void c.logout();
    else void navigate({ to:'/subscription-request', replace:true });
  }, [active, request?.trialExpiresAt]);
  if (!active) return <p role="status" className="p-8 text-muted-foreground">{request?.trialExpiresAt !== undefined ? 'Your trial period has ended. Returning to login…' : 'Opening subscription request…'}</p>;
  const seconds = Math.max(0, Math.ceil(((request?.trialExpiresAt ?? now) - now) / 1000));
  return <><p role="status" className="border-b bg-secondary px-4 py-2 text-center text-sm text-muted-foreground">Prototype trial · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} remaining · Request Pending</p>{children}</>;
}