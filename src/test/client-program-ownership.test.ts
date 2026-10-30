import { beforeEach, describe, expect, it, vi } from 'vitest';
import { savePreviewSession } from '@/lib/preview-session';
import { saveDemoProgram, changeDemoProgram, getDemoState, setDemoSession } from '@/lib/demo';
import { personalGymCopy } from '@/lib/workout-sources';
import { savePersonalProgram, saveGymProgram, changePersonalProgram, programSaveError } from '@/lib/client-programs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const workout = { id: 'source-program', name: 'Strength', trainer: '', notes: '', exercises: [{ name: 'Squat', sets: 3, reps: '10' }] };
function clientMock(error: { message: string } | null = null) {
  const query = { insert: vi.fn(), update: vi.fn(), delete: vi.fn(), eq: vi.fn(), select: vi.fn(), single: vi.fn().mockResolvedValue({ data: { id: 'saved' }, error }) };
  for (const name of ['insert', 'update', 'delete', 'eq', 'select'] as const) query[name].mockReturnValue(query);
  const client = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'authenticated-client' } }, error: null }) }, from: vi.fn().mockReturnValue(query) };
  return { query, client: client as unknown as SupabaseClient<Database>, from: client.from };
}
describe('personal workout ownership', () => {
  beforeEach(() => { sessionStorage.clear(); localStorage.clear(); setDemoSession(null); });
  it('uses the exact signed-in preview profile for create, edit and delete', () => {
    savePreviewSession({ id: 'preview-individual-owner', type: 'individual', name: 'Owner', scenarioKey: 'fictional-owner' });
    saveDemoProgram('preview-individual-owner', workout);
    const row = getDemoState().programs.find(p => p.user_id === 'preview-individual-owner');
    if (!row) throw new Error('Program missing');
    saveDemoProgram('preview-individual-owner', { ...workout, name: 'Edited' }, row.id);
    expect(getDemoState().programs.find(p => p.id === row.id)?.definition.name).toBe('Edited');
    changeDemoProgram(row.id, null);
    expect(getDemoState().programs.some(p => p.id === row.id)).toBe(false);
  });
  it('keeps gym copies independent and denies another preview client mutations', () => {
    savePreviewSession({ id: 'preview-individual-copy', type: 'individual', name: 'Owner' });
    saveDemoProgram('preview-individual-copy', personalGymCopy(workout, 'gym-source'));
    const row = getDemoState().programs.find(p => p.user_id === 'preview-individual-copy');
    if (!row) throw new Error('Copy missing');
    expect(row.definition).toMatchObject({ sourceGymId: 'gym-source', sourceWorkoutId: 'source-program' });
    saveDemoProgram('preview-individual-copy', { ...row.definition, name: 'Personal' }, row.id);
    expect(workout.name).toBe('Strength');
    savePreviewSession({ id: 'preview-individual-other', type: 'individual', name: 'Other' });
    expect(() => changeDemoProgram(row.id, null)).toThrow('Program unavailable');
    expect(() => saveDemoProgram('preview-individual-copy', workout)).toThrow('Your own programs only');
  });
  it('derives new Cloud program owner from provider auth and uses the personal table', async () => {
    const { client, query, from } = clientMock();
    await savePersonalProgram(workout, undefined, client);
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'authenticated-client' }));
    expect(from).toHaveBeenCalledWith('client_programs');
  });
  it('saves gym programs as separate personal copies with both source keys', async () => {
    const { client, query, from } = clientMock();
    await saveGymProgram(workout, 'gym-source', client);
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'authenticated-client', source_gym_id: 'gym-source', source_workout_id: 'source-program' }));
    expect(query.insert.mock.calls[0]?.[0].definition.id).not.toBe(workout.id);
    expect(from.mock.calls.every(call => call[0] === 'client_programs')).toBe(true);
    expect(workout.name).toBe('Strength');
  });
  it('scopes Cloud edits and deletes to the authenticated user and surfaces failed readback', async () => {
    const { client, query } = clientMock();
    await savePersonalProgram(workout, 'saved', client);
    await changePersonalProgram('saved', null, client);
    expect(query.eq).toHaveBeenCalledWith('user_id', 'authenticated-client');
    const failing = clientMock({ message: 'Database unavailable' });
    await expect(saveGymProgram(workout, 'gym-source', failing.client)).rejects.toThrow('Database unavailable');
    expect(programSaveError({ message: 'Add at least one exercise' })).toBe('Add at least one exercise');
  });
});