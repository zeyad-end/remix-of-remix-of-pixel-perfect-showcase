/** Preview behavior is not authentication and never grants Cloud privileges. */
export function isPreviewHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  const staticSuffix = ['.lovable.app', '.gpt-eng.com', '.gptengineer.run'].some(suffix => host.endsWith(suffix));
  const firstLabel = host.split('.')[0] ?? '';
  if (staticSuffix && /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(firstLabel)) return true;
  if (staticSuffix && /^project--[a-z0-9-]+-dev$/.test(firstLabel)) return true;
  return host.endsWith('.lovableproject.com') || host.endsWith('.lovableproject-dev.com');
}

export function prototypePreviewEnabled() {
  return import.meta.env.DEV || (typeof window !== 'undefined' && isPreviewHost(window.location.hostname));
}