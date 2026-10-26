import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Link } from '@tanstack/react-router';
import { Check, CheckCheck, X, Bell } from 'lucide-react';
import { useCloud } from './CloudProvider';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { selectCls } from './kit';
import { getDemoSession, getDemoAccount, demoAdminMessagesFor } from '@/lib/demo';
import { localDate } from '@/lib/gym-period';
import { demoGymNotices, changeDemoNotices } from '@/lib/gym-notifications-demo';
import { getGymNotices, changeGymNotices } from '@/lib/gym-notifications.functions';
import { listAccountMessages, markAccountMessagesRead } from '@/lib/account-messages.functions';
import { toast } from 'sonner';
const pages = ['/members', '/attendance', '/sessions', '/finance', '/staff', '/products'] as const;
export function GymNotifications() {
 const c = useCloud(); const get = useServerFn(getGymNotices); const change = useServerFn(changeGymNotices); const markRead = useServerFn(markAccountMessagesRead); const demo = !!getDemoSession();
 const [open, setOpen] = useState(false); const [category, setCategory] = useState('All'); const [busy, setBusy] = useState(false);
 const { data = [], error, isPending, refetch } = useQuery({ queryKey: ['gym-notifications', c.gymId, c.profile?.id, demo], enabled: c.role === 'Owner' && !!c.gymId, queryFn: async () => {
   const notices = demo ? demoGymNotices(c.gymId) : await get({ data: { gymId: c.gymId, day: localDate() } });
   const messages = demo
     ? demoAdminMessagesFor(getDemoAccount()?.email ?? '').map(m => ({ id: m.id, body: m.body, created_at: m.createdAt, read_at: null as string | null }))
     : await listAccountMessages();
   const adminNotices = messages.map(m => ({ id: `admin-${m.id}`, type: 'Admin message', description: `From GYVORA Administration: ${m.body}`, page: '', createdAt: m.created_at, read: demo ? false : !!m.read_at, dismissed: false }));
   return [...adminNotices, ...notices];
 }, refetchInterval: 15000 });
 useEffect(() => { const refresh = () => { void refetch(); }; window.addEventListener('ironhaus-gym-events', refresh); return () => window.removeEventListener('ironhaus-gym-events', refresh); }, [refetch]);
 const visible = data.filter(e => !e.dismissed); const unread = visible.filter(e => !e.read).length;
 async function update(ids: string[], dismiss = false) { const adminIds = ids.filter(id => id.startsWith('admin-')).map(id => id.slice(6)); ids = ids.filter(id => !id.startsWith('admin-')); if (!ids.length && (demo || !adminIds.length)) return; setBusy(true); try { if (!demo && adminIds.length) await markRead({ data: { ids: adminIds } }); if (ids.length) if (demo) changeDemoNotices(c.gymId, ids, dismiss); else await change({ data: { gymId: c.gymId, ids, dismiss } }); await refetch(); } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not update notifications'); } finally { setBusy(false); } }
 if (c.role !== 'Owner') return null;
 return <><Button aria-label={unread ? `Notifications (${unread} unread)` : 'Notifications'} variant="outline" size="icon" className="relative shrink-0" onClick={() => { setOpen(true); void refetch(); }}><Bell className="h-4 w-4"/>{unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{unread > 99 ? '99+' : unread}</span>}</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Notifications</DialogTitle></DialogHeader><div className="flex flex-wrap items-center justify-between gap-3"><select aria-label="Notification category" className={`${selectCls} max-w-52`} value={category} onChange={e => setCategory(e.target.value)}>{['All','Unread','Membership','Membership expiration','Expense','Payment','Attendance','Session','Staff invitation','Product sale','Admin message'].map(value => <option key={value}>{value}</option>)}</select><Button variant="secondary" size="sm" disabled={busy || !unread} onClick={() => void update(visible.filter(e => !e.read).map(e => e.id))}><CheckCheck className="h-4 w-4"/>Mark All as Read</Button></div>{error ? <p role="alert" className="text-sm text-destructive">Could not load notifications.</p> : isPending ? <p className="text-sm text-muted-foreground">Loading notifications…</p> : <ul className="divide-y">{visible.filter(e => category === 'All' || (category === 'Unread' ? !e.read : e.type === category)).map(e => { const page = pages.find(page => page === e.page); return <li key={e.id} className="flex gap-3 py-4"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.read ? 'bg-muted' : 'bg-primary'}`}/><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-primary">{e.type}</p>{page ? <Link to={page} className="mt-1 block break-words text-sm" onClick={() => { void update([e.id]); setOpen(false); }}>{e.description}</Link> : <p className="text-sm">{e.description}</p>}<p className="mt-1 text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</p></div><div className="flex shrink-0 gap-1">{!e.read && <Button title="Mark as Read" aria-label={`Mark as Read: ${e.description}`} size="icon" variant="ghost" disabled={busy} onClick={() => void update([e.id])}><Check className="h-4 w-4"/></Button>}<Button title="Dismiss notification" aria-label={`Dismiss: ${e.description}`} size="icon" variant="ghost" disabled={busy} onClick={() => void update([e.id], true)}><X className="h-4 w-4"/></Button></div></li>; })}</ul>}{!isPending && !error && !visible.some(e => category === 'All' || (category === 'Unread' ? !e.read : e.type === category)) && <p className="py-8 text-center text-sm text-muted-foreground">No notifications{category === 'All' ? ' yet' : ' in this category'}.</p>}</DialogContent></Dialog></>;
}