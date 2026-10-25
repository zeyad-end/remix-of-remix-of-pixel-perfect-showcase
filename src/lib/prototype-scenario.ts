export const SAMPLE_GYM_ID = 'GYVORA-G-123';
export const SAMPLE_CLIENT_ID = 'GYVORA-C-456';
export type SampleRequest = {id: string; gymName: string; plan: 'Monthly Plan' | 'Annual Plan'; requestDate: string; status: 'Pending'; skipped: boolean};
const key = 'gyvora-fictional-subscription-scenario';
export function makeSampleRequest(gymName: string, plan: string, skipped: boolean, date: string): SampleRequest {
  if (!gymName.trim()) throw new Error('Enter your gym name.');
  if (plan !== 'Monthly Plan' && plan !== 'Annual Plan') throw new Error('Select Monthly or Annual Subscription.');
  return {id:'prototype-subscription-request',gymName:gymName.trim().slice(0,100),plan,requestDate:date,status:'Pending',skipped};
}
export function readSampleRequest(): SampleRequest | null {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;
  try {
    const row = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (!row || row.id !== 'prototype-subscription-request' || typeof row.gymName !== 'string' || !['Monthly Plan','Annual Plan'].includes(row.plan) || row.status !== 'Pending') return null;
    return row as SampleRequest;
  } catch {return null;}
}
export function saveSampleRequest(request: SampleRequest) {
  if (!import.meta.env.DEV) throw new Error('Prototype scenario unavailable.');
  sessionStorage.setItem(key,JSON.stringify(request));
}
export function resetSampleRequest() {if (typeof window !== 'undefined') sessionStorage.removeItem(key);}