import { readPreviewSession } from './preview-session';

export const SAMPLE_GYM_ID = 'GYVORA-G-123';
export const SAMPLE_CLIENT_ID = 'GYVORA-C-456';
export type SampleRequest = {id: string; gymName: string; plan: 'Monthly Plan' | 'Annual Plan'; requestDate: string; status: 'Pending'; skipped: boolean; trialStartedAt?: number; trialExpiresAt?: number};
const key = 'gyvora-fictional-subscription-scenario';
const scopedKey = 'gyvora-fictional-subscription-contacts';
export const PROTOTYPE_TRIAL_MS = 60 * 60 * 1000;
function currentScope() { const session = readPreviewSession(); return session?.type === 'gym' ? session.scenarioKey : undefined; }
function readRegistry(): Record<string, SampleRequest> {
  try { return JSON.parse(sessionStorage.getItem(scopedKey) ?? '{}'); } catch { return {}; }
}
export function makeSampleRequest(gymName: string, plan: string, skipped: boolean, date: string): SampleRequest {
  if (!gymName.trim()) throw new Error('Enter your gym name.');
  if (plan !== 'Monthly Plan' && plan !== 'Annual Plan') throw new Error('Select Monthly or Annual Subscription.');
  return {id:'prototype-subscription-request',gymName:gymName.trim().slice(0,100),plan,requestDate:date,status:'Pending',skipped};
}
export function readSampleRequest(scope = currentScope()): SampleRequest | null {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;
  try {
    const row = scope ? readRegistry()[scope] : JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (!row || row.id !== 'prototype-subscription-request' || typeof row.gymName !== 'string' || !['Monthly Plan','Annual Plan'].includes(row.plan) || row.status !== 'Pending') return null;
    return row as SampleRequest;
  } catch {return null;}
}
export function saveSampleRequest(request: SampleRequest, scope = currentScope()) {
  if (!import.meta.env.DEV) throw new Error('Prototype scenario unavailable.');
  if (scope) sessionStorage.setItem(scopedKey, JSON.stringify({...readRegistry(), [scope]:request}));
  sessionStorage.setItem(key,JSON.stringify(request));
}
export function resetSampleRequest(scope = currentScope()) {
  if (typeof window === 'undefined') return;
  if (scope) { const registry = readRegistry(); delete registry[scope]; sessionStorage.setItem(scopedKey, JSON.stringify(registry)); }
  else sessionStorage.removeItem(scopedKey);
  sessionStorage.removeItem(key);
}
export function prototypeTrialActive(request: SampleRequest | null, now = Date.now()) {
  return !!request?.trialStartedAt && typeof request.trialExpiresAt === 'number' && now < request.trialExpiresAt;
}
export function startSampleTrial(request: SampleRequest, now = Date.now()): SampleRequest {
  if (request.trialExpiresAt !== undefined) {
    if (!prototypeTrialActive(request, now)) throw new Error('Your trial period has ended. Your request is awaiting administrator approval.');
    return request;
  }
  return {...request, skipped:true, trialStartedAt:now, trialExpiresAt:now + PROTOTYPE_TRIAL_MS};
}
export function sampleEntryStep(request: SampleRequest | null): 0 | 2 { return request ? 2 : 0; }