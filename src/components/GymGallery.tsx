import { useEffect, useState } from "react";
import { imageUrl } from "@/lib/images";

/** Renders a saved gallery photo (storage path or URL); shows a skeleton while loading and hides on failure. */
export function GalleryImage({ path, className = "aspect-[4/3] w-full rounded-lg object-cover" }: { path: string; className?: string }) {
  const [state, setState] = useState<{ url: string; status: "loading" | "ready" | "failed" }>({ url: "", status: "loading" });
  useEffect(() => {
    let live = true;
    setState({ url: "", status: "loading" });
    imageUrl(path).then(url => live && setState({ url, status: url ? "ready" : "failed" })).catch(() => live && setState({ url: "", status: "failed" }));
    return () => { live = false; };
  }, [path]);
  if (state.status === "failed") return null;
  if (state.status === "loading") return <div className={`${className} animate-pulse bg-secondary`} aria-label="Loading photo" />;
  return <img src={state.url} alt="Gym gallery" loading="lazy" className={className} onError={() => setState({ url: "", status: "failed" })} />;
}
