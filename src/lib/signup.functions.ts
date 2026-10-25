import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { registrationSchema } from './registration';

const contactSchema = z.object({ channel: z.enum(['email', 'phone']), contact: z.string().trim().min(1).max(255) });
const providerSetupRequired = 'Account creation requires a verified email sender and an SMS verification provider, with server-side code delivery and verification configured.';

// Adapter boundary: install real provider send/verify here before enabling account creation.
// Mock preview codes must never reach privileged account creation, even through direct RPC.
export const sendSignupCode = createServerFn({ method: 'POST' }).inputValidator(input => contactSchema.parse(input)).handler(async (): Promise<{token:string;channel:'email'|'phone';contact:string;message:string}> => {
  throw new Error(providerSetupRequired);
});

export const createVerifiedAccount = createServerFn({ method: 'POST' }).inputValidator(input => z.object({
  account: registrationSchema,
  token: z.string().regex(/^[a-f0-9]{64}$/),
  code: z.string().trim().min(1).max(128),
  photo: z.string().max(1100000).default(''),
}).parse(input)).handler(async ({ data }) => {
  void data;
  throw new Error(providerSetupRequired);
});