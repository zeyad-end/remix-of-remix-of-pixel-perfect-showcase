import { afterEach, describe, expect, it } from 'vitest';
import { makeSampleRequest, prototypeTrialActive, readSampleRequest, resetSampleRequest, sampleEntryStep, saveSampleRequest, startSampleTrial, SAMPLE_CLIENT_ID, SAMPLE_GYM_ID } from '@/lib/prototype-scenario';
import { createPreviewSession, prototypeContactKey, savePreviewSession } from '@/lib/preview-session';
import { getDemoState, resetPrototypeData } from '@/lib/demo';

afterEach(()=>{resetSampleRequest();savePreviewSession(null);resetPrototypeData();localStorage.clear();});
describe('fictional subscription and ID review',()=>{
  it('uses three-digit sample IDs for the correct account types',()=>{
    expect(SAMPLE_GYM_ID).toBe('GYVORA-G-123');expect(SAMPLE_CLIENT_ID).toBe('GYVORA-C-456');
  });
  for(const plan of ['Monthly Plan','Annual Plan']) it(`keeps ${plan} Pending across prototype account switches without real storage`,()=>{
    const row=makeSampleRequest('Fictional Review Gym',plan,false,'2026-10-25');
    localStorage.setItem('ironhaus-demo-data-v1','unchanged');
    saveSampleRequest(row);savePreviewSession(createPreviewSession('dashboard','sample','sample','sample',true));resetPrototypeData();
    expect(getDemoState().requests.filter(r=>r.id===row.id)).toHaveLength(1);
    expect(getDemoState().requests.find(r=>r.id===row.id)).toMatchObject({gymName:'Fictional Review Gym',plan,requestDate:'2026-10-25',status:'Pending'});
    expect(localStorage.getItem('ironhaus-demo-data-v1')).toBe('unchanged');
  });
  it('Skip demonstrates Pending, never approval, and reset removes the example',()=>{
    saveSampleRequest(makeSampleRequest('Sample Gym','Monthly Plan',true,'2026-10-25'));
    expect(readSampleRequest()).toMatchObject({skipped:true,status:'Pending'});
    resetSampleRequest();expect(readSampleRequest()).toBeNull();
  });
  it('requires gym name and one of the two plans when sending',()=>{
    expect(()=>makeSampleRequest(' ','Monthly Plan',false,'2026-10-25')).toThrow();
    expect(()=>makeSampleRequest('Gym','VIP',false,'2026-10-25')).toThrow();
  });
  it('starts new phone numbers at selection and returning pending numbers at pending approval', async () => {
    const first = await prototypeContactKey('+20 100 000 0123');
    const same = await prototypeContactKey(' +201000000123 ');
    const other = await prototypeContactKey('+201000000124');
    expect(same).toBe(first);
    savePreviewSession({...createPreviewSession('gym','Fictional','phone','password',true),scenarioKey:first});
    expect(sampleEntryStep(readSampleRequest())).toBe(0);
    saveSampleRequest(makeSampleRequest('Fictional Phone Gym','Annual Plan',false,'2026-10-25'));
    savePreviewSession({...createPreviewSession('gym','Fictional','phone','password',true),scenarioKey:other});
    expect(readSampleRequest()).toBeNull();
    expect(sampleEntryStep(readSampleRequest())).toBe(0);
    savePreviewSession({...createPreviewSession('gym','Fictional','phone','password',true),scenarioKey:same});
    expect(sampleEntryStep(readSampleRequest())).toBe(2);
    expect(readSampleRequest()?.plan).toBe('Annual Plan');
    resetSampleRequest();
  });
  it('Skip saves exactly one hour and returning access never restarts the timer', () => {
    const started = startSampleTrial(makeSampleRequest('Trial Gym','Monthly Plan',false,'2026-10-25'),1000);
    expect(started.trialStartedAt).toBe(1000);
    expect(started.trialExpiresAt).toBe(3601000);
    expect(started.status).toBe('Pending');
    saveSampleRequest(started);
    const returning = readSampleRequest();
    if (!returning) throw new Error('Missing saved trial');
    expect(startSampleTrial(returning,2000).trialExpiresAt).toBe(3601000);
    expect(prototypeTrialActive(returning,3600999)).toBe(true);
    expect(prototypeTrialActive(returning,3601000)).toBe(false);
    expect(() => startSampleTrial(returning,3601000)).toThrow('Your trial period has ended');
    expect(sampleEntryStep(returning)).toBe(2);
  });
});