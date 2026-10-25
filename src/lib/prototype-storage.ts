import { readPreviewSession } from './preview-session';

const values = new Map<string, string>();
const memory: Storage = {
  get length() { return values.size; },
  clear: () => values.clear(),
  getItem: key => values.get(key) ?? null,
  key: index => [...values.keys()][index] ?? null,
  removeItem: key => { values.delete(key); },
  setItem: (key, value) => { values.set(key, value); },
};
// Existing demo helpers use a separate ephemeral store during visual review.
export function prototypeStorage(): Storage {
  return readPreviewSession() ? memory : localStorage;
}
export function clearPrototypeStorage() { memory.clear(); }