import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClientShell } from "@/components/ClientShell";
import { AssignedWorkouts } from "@/components/AssignedWorkouts";
import { useCloud } from "@/components/CloudProvider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  getDemoSession,
  useDemoStore,
  pendingDemoInvitations,
  respondDemoInvitation,
  pendingDemoAssignments,
  demoAdminMessagesFor,
} from "@/lib/demo";
import { listAccountMessages } from "@/lib/account-messages.functions";
import { useServerFn } from "@tanstack/react-start";
import { seo } from "@/lib/seo";
import { toast } from "sonner";
export const Route = createFileRoute("/member/notifications")({
  head: () =>
    seo(
      "Client notifications",
      "Your trainer invitations and workout assignments with Save, Delete, Accept and Decline actions.",
    ),
  component: Notifications,
});
/** Fictional trainer invitation shown in demo sessions only. Accepting it grants no real gym access. */
const DEMO_TRAINER_INVITATION = {
  id: "demo-trainer-invitation",
  gym_name: "IronWorks Demo Gym (fictional)",
  role: "Trainee",
  full_name: "Coach Demo",
  created_at: "2026-10-20T00:00:00Z",
  expires_at: "2026-12-31T00:00:00Z",
};

function Notifications() {
  const c = useCloud();
  const [demoInviteDone, setDemoInviteDone] = useState<"" | "accepted" | "declined">("");
  const all = useDemoStore((s) => s.invitations);
  const assignments = useDemoStore((s) => s.assignments);
  const [cloudRows, setCloudRows] = useState<
    Database["public"]["Tables"]["staff_invitations"]["Row"][]
  >([]);
  const [busy, setBusy] = useState("");
  const demo = getDemoSession();
  const rows = demo ? pendingDemoInvitations(c.profile?.email ?? "", all) : cloudRows;
  const fetchMessages = useServerFn(listAccountMessages);
  const demoMessages = useDemoStore((s) => s.adminMessages);
  const [cloudMessages, setCloudMessages] = useState<{ id: string; body: string; created_at: string }[]>([]);
  const messages = demo
    ? (demoMessages ?? []).filter((m) => m.to === (c.profile?.id ?? "")).map((m) => ({ id: m.id, body: m.body, created_at: m.createdAt }))
    : cloudMessages;
  useEffect(() => {
    if (demo || !c.profile) return;
    let cancelled = false;
    fetchMessages()
      .then((data) => { if (!cancelled) setCloudMessages(data); })
      .catch(() => { if (!cancelled) setCloudMessages([]); });
    return () => { cancelled = true; };
  }, [c.profile?.id, demo]);
  async function load() {
    if (demo || !c.profile) return;
    const { data, error } = await supabase.rpc('my_staff_invitations');
    if (error) toast.error(error.message);
    else setCloudRows((data ?? []) as unknown as Database['public']['Tables']['staff_invitations']['Row'][]);
  }
  useEffect(() => {
    setCloudRows([]);
    void load();
  }, [c.profile?.id]);
  return (
    <ClientShell title="Notifications">
      {messages.length > 0 && (
        <section className="border-b pb-5">
          <h2 className="text-lg font-semibold">Messages from GYVORA Administration</h2>
          <ul className="mt-3 space-y-3">
            {messages.map((m) => (
              <li key={m.id} className="rounded-md border bg-card p-4">
                <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">From GYVORA Administration · {new Date(m.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <AssignedWorkouts />
      {demo && !demoInviteDone && (
        <section className="border-b pb-5">
          <h2 className="text-lg font-semibold">{DEMO_TRAINER_INVITATION.gym_name}</h2>
          <p className="mt-2">Invited as {DEMO_TRAINER_INVITATION.role}</p>
          <p className="text-sm text-muted-foreground">
            {DEMO_TRAINER_INVITATION.full_name} · Demo invitation — accepting it does not grant access to any real gym.
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => { setDemoInviteDone("accepted"); toast.success("Demo invitation accepted (no real gym access granted)"); }}>Accept</Button>
            <Button variant="outline" onClick={() => { setDemoInviteDone("declined"); toast.success("Demo invitation declined"); }}>Reject</Button>
          </div>
        </section>
      )}
      <div className="space-y-5">
        {rows.map((i) => (
          <section key={i.id} className="border-b pb-5">
            <h2 className="text-lg font-semibold">
              {"gym_name" in i
                ? String(i.gym_name ?? "Gym")
                : (c.gyms.find((g) => g.id === i.gym_id)?.name ?? "Gym")}
            </h2>
            <p className="mt-2">Invited as {i.role}</p>
            <p className="text-sm text-muted-foreground">
              {i.full_name} · {new Date(i.created_at).toLocaleDateString()} · Expires{" "}
              {new Date(i.expires_at).toLocaleDateString()}
            </p>
            <div className="mt-4 flex gap-2">
              {[true, false].map((accept) => (
                <Button
                  key={String(accept)}
                  disabled={busy === i.id}
                  variant={accept ? "default" : "outline"}
                  onClick={async () => {
                    setBusy(i.id);
                    try {
                      if (demo) respondDemoInvitation(i.id, accept);
                      else {
                        const { error } = await supabase.rpc("respond_invitation", {
                          invitation_id: i.id,
                          accept,
                        });
                        if (error) throw error;
                      }
                      await load();
                      await c.refresh();
                      toast.success(accept ? "Invitation accepted" : "Invitation declined");
                    } catch (e) {
                      toast.error(String(e));
                    } finally {
                      setBusy("");
                    }
                  }}
                >
                  {accept ? "Accept" : "Decline"}
                </Button>
              ))}
            </div>
          </section>
        ))}
      </div>
      {!rows.length && !pendingDemoAssignments(c.profile?.id ?? "", assignments).length && (
        <p className="text-muted-foreground">No pending notifications.</p>
      )}
    </ClientShell>
  );
}
