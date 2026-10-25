import { generateId } from './utils';

export type PreviewAccountType = 'gym' | 'individual' | 'dashboard';
export type PreviewSession = { id: string; type: PreviewAccountType; name: string };
const key = 'gyvora-isolated-preview-session';

export function previewEnabled(developmentBuild: boolean, runtimeMode?: string) {
  return developmentBuild && runtimeMode !== 'production';
}

export function createPreviewSession(type: string, name: string, identifier: string, password: string, enabled: boolean): PreviewSession {
  if (!enabled) throw new Error('Preview login is unavailable.');
  if (!['gym', 'individual', 'dashboard'].includes(type)) throw new Error('Choose a prototype account type.');
  if (![name, identifier, password].every(value => value.trim())) throw new Error('Enter your name, email or phone, and password.');
  return { id: `preview-${generateId()}`, type: type as PreviewAccountType, name: 'Prototype reviewer' };
}

export function readPreviewSession(): PreviewSession | null {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    return value?.id?.startsWith('preview-') && ['gym', 'individual', 'dashboard'].includes(value.type) && typeof value.name === 'string' ? value : null;
  } catch { return null; }
}

export function savePreviewSession(session: PreviewSession | null) {
  if (session && import.meta.env.DEV) sessionStorage.setItem(key, JSON.stringify(session));
  else sessionStorage.removeItem(key);
}

export type PreviewChallenge = { contact: string; channel: 'email' | 'phone'; expiresAt: number };
export function verifyPreviewSignup(challenge: PreviewChallenge | null, contact: string, code: string, enabled: boolean, now = Date.now()) {
  if (!enabled) throw new Error('Preview verification is unavailable.');
  if (!challenge || challenge.expiresAt <= now || challenge.contact !== contact.trim()) throw new Error('Send a new code for this contact.');
  if (!code.trim()) throw new Error('Enter the verification code.');
  return { preview: true as const };
}