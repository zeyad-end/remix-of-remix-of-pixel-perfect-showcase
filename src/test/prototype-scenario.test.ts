import { afterEach, describe, expect, it } from 'vitest';
import { makeSampleRequest, readSampleRequest, resetSampleRequest, saveSampleRequest, SAMPLE_CLIENT_ID, SAMPLE_GYM_ID } from '@/lib/prototype-scenario';
import { createPreviewSession, savePreviewSession } from '@/lib/preview-session';
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
});