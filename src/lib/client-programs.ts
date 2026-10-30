import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Workout } from './store';
import { programSchema } from './validation';
import { personalGymCopy } from './workout-sources';

type Client = SupabaseClient<Database>;

export function programSaveError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return 'Could not save program. Please try again.';
}

async function ownerId(client: Client) {
  const { data, error } = await client.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Sign in to your Client account before managing programs.');
  return data.user.id;
}

export async function savePersonalProgram(definition: Workout, id?: string, client: Client = supabase) {
  const userId = await ownerId(client);
  const parsed = programSchema.parse(definition);
  // Retain source attribution independently of the editable personal definition.
  const value = { ...definition, ...parsed } as unknown as Json;
  const query = id
    ? client.from('client_programs').update({ definition: value, completion: [] }).eq('id', id).eq('user_id', userId)
    : client.from('client_programs').insert({ user_id: userId, definition: value });
  const { data, error } = await query.select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveGymProgram(workout: Workout, gymId: string, client: Client = supabase) {
  const userId = await ownerId(client);
  const copy = personalGymCopy(workout, gymId);
  programSchema.parse(copy);
  const { data, error } = await client.from('client_programs').insert({
    user_id: userId, definition: copy as unknown as Json,
    source_gym_id: gymId, source_workout_id: copy.sourceWorkoutId,
  }).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function changePersonalProgram(id: string, completion: number[] | null, client: Client = supabase) {
  const userId = await ownerId(client);
  const query = completion === null
    ? client.from('client_programs').delete()
    : client.from('client_programs').update({ completion });
  const { error } = await query.eq('id', id).eq('user_id', userId).select('id').single();
  if (error) throw new Error(error.message);
}