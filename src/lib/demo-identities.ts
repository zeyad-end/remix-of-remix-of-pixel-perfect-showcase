import { prototypeStorage } from './prototype-storage';
import { generateId } from './utils';
import { isGyvoraId } from './gyvora-id';

const storageKey = 'gyvora-demo-permanent-identities-v1';
type Entry = { kind: 'G' | 'C'; localId: string; key: string; id?: string; version?: number; aliases?: string[] };
type Registry = { installation: string; entries: Entry[] };
function read(): Registry {
  const raw = prototypeStorage().getItem(storageKey);
  if (raw) return JSON.parse(raw) as Registry;
  const registry = { installation: generateId(), entries: [] };
  prototypeStorage().setItem(storageKey, JSON.stringify(registry));
  return registry;
}
export function ensureDemoIdentity(kind: Entry['kind'], localId: string): string | undefined {
  const registry = read();
  const found = registry.entries.find(e => e.kind === kind && e.localId === localId);
  if (found) return found.id;
  registry.entries.push({ kind, localId, key: generateId() });
  prototypeStorage().setItem(storageKey, JSON.stringify(registry));
  return undefined;
}
export function demoIdentity(kind: Entry['kind'], localId: string): string | undefined {
  return read().entries.find(e => e.kind === kind && e.localId === localId)?.id;
}
export function demoIdentityMatches(kind: Entry['kind'], localId: string, id: string): boolean {
  const entry = read().entries.find(e => e.kind === kind && e.localId === localId);
  return entry?.id?.toLowerCase() === id.toLowerCase() || (entry?.aliases ?? []).some(alias => alias.toLowerCase() === id.toLowerCase());
}
export async function syncDemoIdentities(reserve: (input: { data: { installation: string; identities: { kind: 'G' | 'C'; key: string }[] } }) => Promise<{kind:'G'|'C';key:string;id:string}[]>) {
  const registry = read();
  const pending = registry.entries.filter(e => !e.id || e.version !== 2);
  for (let offset = 0; offset < pending.length; offset += 200) {
    const rows = await reserve({ data: { installation: registry.installation, identities: pending.slice(offset, offset + 200).map(({kind,key}) => ({kind,key})) } });
    const current = read();
    for (const row of rows) {
      const entry = current.entries.find(e => e.kind === row.kind && e.key === row.key);
      if (!entry || !isGyvoraId(row.id) || !row.id.startsWith(`GYVORA-${entry.kind}-`)) throw new Error('Invalid permanent identity');
      if (entry.id && entry.id !== row.id) {
        if (entry.version === 2) throw new Error('Permanent identity cannot change');
        entry.aliases = [...new Set([...(entry.aliases ?? []), entry.id])];
      }
      entry.id = row.id;
      entry.version = 2;
    }
    prototypeStorage().setItem(storageKey, JSON.stringify(current));
  }
}