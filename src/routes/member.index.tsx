import { createFileRoute, Link } from "@tanstack/react-router";
import { useCloud } from "@/components/CloudProvider";
import { useClientGyms } from "@/lib/client-portal";
import { ClientGymCard } from "@/components/ClientGymCard";
import { useDemoStore } from "@/lib/demo";
import { AssignedWorkouts } from "@/components/AssignedWorkouts";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/mock";
import { toast } from "sonner";
import {
  QrCode,
  CalendarCheck,
  ClipboardList,
  Bell,
  Star,
  Plus,
  LogOut,
} from "lucide-react";
import { Avatar, StatusPill } from "@/components/kit";
import { seo } from "@/lib/seo";
import { AppBrand } from '@/components/AppBrand';

export const Route = createFileRoute("/member/")({
  head: () => seo("My account", "Your membership status, QR code and training at a glance."),
  component: MemberHome,
});

const actions = [
  { label: "My QR", icon: QrCode, to: "/member/qr" },
  { label: "Attendance History", icon: CalendarCheck, to: "/member/attendance" },
  { label: "Workout Program", icon: ClipboardList, to: "/member/workouts" },
  { label: "Join a Gym", icon: Plus, to: "/member/join" },
] as const;

function MemberHome() {
  const c = useCloud();
  const p = useClientGyms();
  const roles = useDemoStore((s) => s.staffRoles);
  const membership = p.memberships.find(
    (m) => m.status !== "Expired" && m.expiry >= new Date().toLocaleDateString("en-CA"),
  );
  const remaining = membership
    ? Math.max(0, Math.ceil((new Date(membership.expiry).getTime() - Date.now()) / 86400000))
    : 0;
  return (
    <div className="mx-auto min-h-screen max-w-md px-5 py-8">
      <AppBrand className="mb-6" />
      <div className="flex items-center justify-between">
        <Link to="/member/settings" className="flex items-center gap-3">
          <Avatar initials={initials(c.profile?.full_name ?? "")} />
          <div>
            <div className="text-xs text-muted-foreground">Good evening</div>
            <div className="font-display font-semibold">{c.profile?.full_name}</div>
          </div>
        </Link>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="icon">
            <Link to="/member/notifications" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Sign out"
            onClick={() => void c.logout()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-6">
        <AssignedWorkouts />
      </div>

      <div className="panel mt-6 p-6">
        <div className="flex items-center justify-between">
          <span className="eyebrow">{membership?.plan ?? "No membership"}</span>
          <StatusPill status={membership?.status ?? "Not linked"} />
        </div>
        <div className="mt-6 flex items-end gap-2">
          <span className="font-display text-5xl font-semibold text-primary">{remaining}</span>
          <span className="pb-2 text-sm text-muted-foreground">days remaining</span>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-1/2 rounded-full bg-primary" />
        </div>
        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          <span>{membership?.gym ?? "No membership gym"}</span>
          <span>{membership ? `Expires ${membership.expiry}` : ""}</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {actions.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="panel flex flex-col gap-6 p-4 transition-colors hover:border-primary/40"
          >
            <a.icon className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{a.label}</span>
          </Link>
        ))}
      </div>
      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">My Joined Gyms</h2>
        {p.joined.map((g) => (
          <ClientGymCard
            key={g.id}
            gym={g}
            actions={
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${p.links.find((l) => l.gymId === g.id)?.favorite ? "Unfavorite" : "Favorite"} ${g.name}`}
                  onClick={() => void p.change(g.id, "favorite")}
                >
                  <Star
                    className={
                      p.links.find((l) => l.gymId === g.id)?.favorite
                        ? "h-5 w-5 fill-primary text-primary"
                        : "h-5 w-5"
                    }
                  />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Leave ${g.name}? You can rejoin later if the gym adds or approves you again.`))
                      void p.change(g.id, "leave").then(() => toast.success(`You left ${g.name}`)).catch((e) => toast.error(e instanceof Error ? e.message : String(e)));
                  }}
                >
                  Leave Gym
                </Button>
              </div>
            }
          />
        ))}
        {!p.joined.length && <p className="text-sm text-muted-foreground">No joined gyms yet.</p>}
        {!!c.gyms.length&&c.role!=='Client'&&<h2 className="pt-4 text-xl font-semibold">Gym Roles</h2>}
        {c.gyms
          .filter(
            (g) =>
              roles.some((r) => r.userId === c.profile?.id && r.gymId === g.id) ||
              (!p.joined.some((j) => j.id === g.id) && c.role !== "Client"),
          )
          .map((g) => (
            <ClientGymCard
              key={g.id}
              gym={
                p.directory.find((x) => x.id === g.id) ?? {
                  id: g.id,
                  name: g.name,
                  image: "",
                  location: "",
                  description: "",
                }
              }
              actions={
                <p className="text-sm text-primary">
                  {roles.find((r) => r.userId === c.profile?.id && r.gymId === g.id)?.role ??
                    c.role}
                </p>
              }
            />
          ))}
      </section>
    </div>
  );
}
