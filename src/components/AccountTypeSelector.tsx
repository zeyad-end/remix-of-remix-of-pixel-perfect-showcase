import { Building2, User, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PreviewAccountType } from '@/lib/preview-session';

export function AccountTypeSelector({ value, onChange, dashboard = false }: { value: PreviewAccountType; onChange: (value: PreviewAccountType) => void; dashboard?: boolean }) {
  const options = [['gym', 'Gym Account', Building2], ['individual', 'Client / Individual', User], ...(dashboard ? [['dashboard', 'Dashboard', LayoutDashboard] as const] : [])] as const;
  return <div className={cn('grid gap-1 rounded-lg border bg-card p-1', dashboard ? 'grid-cols-3' : 'grid-cols-2')} role="group" aria-label="Account type">
    {options.map(([key, label, Icon]) => <Button key={key} type="button" variant="ghost" aria-pressed={value === key} onClick={() => onChange(key)} className={cn('h-16 min-w-0 flex-col gap-1 rounded-md px-1 text-xs font-medium transition-colors', value === key ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}><Icon className="h-4 w-4 shrink-0"/><span className="whitespace-normal text-center leading-tight">{label}</span></Button>)}
  </div>;
}