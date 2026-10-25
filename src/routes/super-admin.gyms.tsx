import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { PageHeader, DataTable, td } from '@/components/kit';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useDemoStore, setGymStatus, deleteGym, getDemoSession, sendDemoAdminMessage, type ApprovedGym } from '@/lib/demo';
import { CloudGyms } from '@/components/CloudGyms';
import { seo } from '@/lib/seo';
import { gymPrices } from '@/lib/platform-subscriptions';
import { egp } from '@/lib/mock';
import { StickyNote, MessageSquare } from 'lucide-react';
import { PlatformGymEdit } from '@/components/PlatformGymEdit';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/super-admin/gyms')({
   head: () => seo('Approved gyms', 'Manage approved gyms, freeze access or move gyms to reversible deletion.'),
  component: Gyms,
});

function Gyms() {
  return getDemoSession()?<DemoGyms/>:<CloudGyms/>;
}

function DemoGyms() {
  const gyms = useDemoStore((s) => s.gyms).filter(g=>!g.deletedAt);
  const [editing, setEditing] = useState<ApprovedGym | null>(null);
  const [noteGymId,setNoteGymId]=useState<string|null>(null);
  const [freezing,setFreezing]=useState<ApprovedGym|null>(null);
  const [freezeNote,setFreezeNote]=useState('');
  const [deleting,setDeleting]=useState<ApprovedGym|null>(null);
  const [deletionNote,setDeletionNote]=useState('');
  const [messaging,setMessaging]=useState<ApprovedGym|null>(null);
  const [messageBody,setMessageBody]=useState('');
  const noteGym=gyms.find(g=>g.id===noteGymId&&g.notes?.trim());

  return (
    <div>
      <PageHeader title="Approved Gyms" subtitle={`Total approved gyms: ${gyms.length} · fictional demo data.`} />
      <DataTable head={['#', 'Gym Name', 'Actions', 'Status', 'Phone', 'Email', 'Plan', 'Monthly price', 'Annual price', 'Start', 'End', 'Notes']}>
        {gyms.map((g, index) => (
          <tr key={g.id}>
            <td className={td}>{index + 1}</td>
            <td className={td}>{g.name}</td>
            <td className={`${td} min-w-[260px]`}>
              <div className="flex flex-nowrap gap-2">
                <Button size="icon" variant="ghost" aria-label={`Message ${g.name} owner`} title="Message gym owner" onClick={()=>{setMessaging(g);setMessageBody('');}}><MessageSquare className="h-4 w-4"/></Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(g)}>Edit</Button>
                {g.status === 'Active' ? (
                  <Button size="sm" variant="secondary" onClick={() => {setFreezing(g);setFreezeNote('');}}>Freeze</Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => {if(window.confirm(`Unfreeze ${g.name}?`)){setGymStatus(g.id, 'Active');toast.success(`${g.name} reactivated (demo).`);}}}>Unfreeze</Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => {setDeleting(g);setDeletionNote('');}}>Delete</Button>
              </div>
            </td>
            <td className={td}><span className={g.status==='Active'?'text-success':'text-muted-foreground'}>{g.status}</span></td>
            <td className={td}>{g.phone}</td>
            <td className={`${td} max-w-48 break-words`}>{g.email.startsWith('fictional-') ? 'Fictional owner' : g.email}</td>
            <td className={td}>{g.plan}</td>
            <td className={td}>{egp(gymPrices(g).monthlyPrice)}</td>
            <td className={td}>{egp(gymPrices(g).annualPrice)}</td>
            <td className={td}>{g.start}</td>
            <td className={td}>{g.end}</td>
            <td className={td}>{g.notes?.trim()?<Button variant="ghost" size="icon" aria-label={`Notes for ${g.name}`} title={`Notes for ${g.name}`} onClick={()=>setNoteGymId(g.id)}><StickyNote className="h-4 w-4"/></Button>:'—'}</td>
          </tr>
        ))}
      </DataTable>
      {!gyms.length && <p className="py-6 text-muted-foreground">No approved gyms yet. Approve a request to add one.</p>}

      {editing&&<PlatformGymEdit key={editing.id} gym={editing} onClose={()=>setEditing(null)}/>}
      <Dialog open={!!deleting} onOpenChange={open=>{if(!open)setDeleting(null);}}><DialogContent><DialogHeader><DialogTitle>Delete {deleting?.name}</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Suspend this gym until it is restored. Owner sign-in, memberships and gym data are retained.</p><label className="text-sm">Notes / Reason<Textarea className="mt-2" rows={4} maxLength={1000} value={deletionNote} onChange={e=>setDeletionNote(e.target.value)}/></label><DialogFooter><Button variant="outline" onClick={()=>setDeleting(null)}>Cancel</Button><Button variant="destructive" onClick={()=>{if(!deleting)return;try{deleteGym(deleting.id,deletionNote);setDeleting(null);toast.success('Gym moved to Deleted Gyms.');}catch(e){toast.error(e instanceof Error?e.message:'Could not delete gym.');}}}>Confirm delete</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={!!messaging} onOpenChange={open=>{if(!open)setMessaging(null);}}><DialogContent><DialogHeader><DialogTitle>Message {messaging?.name} owner</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Demo only: the message appears in the gym owner's Notifications on this browser and remains after refresh.</p><label className="block text-sm">Message<Textarea className="mt-2" rows={4} maxLength={2000} value={messageBody} onChange={e=>setMessageBody(e.target.value)}/></label><DialogFooter><Button variant="outline" onClick={()=>setMessaging(null)}>Cancel</Button><Button disabled={!messageBody.trim()} onClick={()=>{if(!messaging)return;try{sendDemoAdminMessage(messaging.email,messageBody);toast.success('Message sent (demo).');setMessaging(null);}catch(e){toast.error(e instanceof Error?e.message:'Could not send message');}}}>Send message</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={!!freezing} onOpenChange={open=>{if(!open)setFreezing(null);}}><DialogContent><DialogHeader><DialogTitle>Freeze {freezing?.name}</DialogTitle></DialogHeader><label className="text-sm">Notes (optional)<Textarea className="mt-2" rows={4} maxLength={1000} value={freezeNote} onChange={e=>setFreezeNote(e.target.value)}/></label><DialogFooter><Button variant="outline" onClick={()=>setFreezing(null)}>Cancel</Button><Button variant="destructive" onClick={()=>{if(!freezing)return;setGymStatus(freezing.id,'Frozen',freezeNote);toast.success(`${freezing.name} frozen (demo).`);setFreezing(null);}}>Freeze account</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={!!noteGym} onOpenChange={open=>{if(!open)setNoteGymId(null);}}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Notes · {noteGym?.name}</DialogTitle></DialogHeader><p className="whitespace-pre-wrap break-words text-sm">{noteGym?.notes}</p></DialogContent></Dialog>
    </div>
  );
}
