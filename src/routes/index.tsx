import { createFileRoute, Link, useNavigate, useHydrated, useRouter } from "@tanstack/react-router";
import { useCloud } from "@/components/CloudProvider";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { seo } from "@/lib/seo";
import { createPreviewSession, savePreviewSession, type PreviewAccountType } from '@/lib/preview-session';
import { AccountTypeSelector } from '@/components/AccountTypeSelector';
import { resetPrototypeData } from "@/lib/demo";
import { clearPrototypeStorage } from '@/lib/prototype-storage';
import cover from "@/assets/gyvora-login-hero.jpg.asset.json";
import { AppBrand } from '@/components/AppBrand';
import { SocialSignIn } from "@/components/SocialSignIn";

export const Route = createFileRoute("/")({
  head: () => ({meta: [...seo("Login prototype", "Review GYVORA Gym, Client and Administrator designs with simulated login and no real account access.").meta, {property:"og:image",content:cover.url},{name:"twitter:image",content:cover.url}]}),
  validateSearch: (search: Record<string, unknown>): { created?: boolean } => ({created: search["created"] === true || search["created"] === "true"}),
  component: Login,
});

/** Decorative WhatsApp glyph. Visual label only: no link, no button, no click action. */
function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true" focusable="false">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}


function Login() {
  const [destination, setDestination] = useState<PreviewAccountType>("gym");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const navigate = useNavigate();
  const cloud = useCloud();
  const hydrated = useHydrated();
  const router = useRouter();
  const { created } = Route.useSearch();

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);setError('');
    try {
      if (import.meta.env.DEV) {
        const session = createPreviewSession(destination,name,email,password,true);
        await router.options.context.queryClient.cancelQueries();
        router.options.context.queryClient.clear();
        clearPrototypeStorage(); resetPrototypeData();
        savePreviewSession(session);
        await cloud.refresh();
        setName(''); setEmail(''); setPassword('');
        await navigate({to:destination === 'dashboard' ? '/super-admin' : destination === 'gym' ? '/subscription-request' : '/member'});
        return;
      }
      throw new Error('Prototype only — no real account or verification is created. Dashboard navigation is available in development preview.');
    }catch(e){setError(e instanceof Error?e.message:'Could not sign in.');}
    finally{setBusy(false);}
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src={cover.url} alt="Gym training racks and weight plates" className="absolute inset-0 h-full w-full object-cover" width={675} height={1200} />
        <div className="hero-overlay absolute inset-0" />
        <div className="absolute bottom-12 left-12 right-12">
          <span className="eyebrow">Gym OS</span>
          <h2 className="mt-3 max-w-md text-4xl font-semibold leading-tight">Run your club like a high‑performance athlete.</h2>
          <p className="mt-3 max-w-md text-muted-foreground">Members, attendance, sessions, trainers and finance — one premium workspace.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <AppBrand large className="mb-8" />
          <h1 className="text-3xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
          <p role="status" className="mt-3 text-sm text-muted-foreground">Prototype only — no real account or verification is created</p>
          {created && <p className="mt-3 text-sm text-success">Prototype account-creation flow completed.</p>}

          <div className="mt-8"><AccountTypeSelector value={destination} onChange={setDestination} dashboard/></div>

          <form className="mt-6 space-y-4" onSubmit={signIn} noValidate>
            <div className="space-y-2"><Label htmlFor="demo-name">Name</Label><Input id="demo-name" name="name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" className="h-11 bg-card" /></div>
            <div className="space-y-2">
              <Label htmlFor="demo-email">Email or phone</Label>
              <Input id="demo-email" name="identifier" type="text" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" placeholder="Email or phone with country code" className="h-11 bg-card" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-password">Password</Label>
              <Input id="demo-password" name="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" type="password" placeholder="••••••••" className="h-11 bg-card" />
            </div>
            <Link to="/forgot-password" className="block text-xs text-primary hover:underline">Forgot password?</Link>
            <div className="flex items-center gap-2"><Checkbox id="demo-remember" checked={remember} onCheckedChange={value => setRemember(value === true)} /><Label htmlFor="demo-remember" className="text-sm font-normal">Remember Me</Label></div>
            {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy || !hydrated} className="h-11 w-full">{busy?'Opening prototype…':'Login'}</Button>
          </form>
          <SocialSignIn prototype />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here? <Link to="/register" className="text-primary hover:underline">Create account</Link>
          </p>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border bg-secondary text-primary">
              <WhatsAppGlyph />
            </span>
            Contact Us
          </p>

        </div>
      </div>
    </div>
  );
}
