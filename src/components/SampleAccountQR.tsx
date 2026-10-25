import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { SAMPLE_CLIENT_ID, SAMPLE_GYM_ID } from '@/lib/prototype-scenario';

export function SampleAccountQR({kind}: {kind: 'gym' | 'client'}) {
  const id = kind === 'gym' ? SAMPLE_GYM_ID : SAMPLE_CLIENT_ID;
  const ref = useRef<HTMLDivElement>(null);
  const [expanded,setExpanded] = useState(false);
  function download() {
    const svg = ref.current?.querySelector('svg');
    if (!svg) return;
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
    const link = document.createElement('a');link.href=url;link.download=`sample-${id}-qr.svg`;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function share() {
    const text = `Fictional prototype sample ID: ${id}. Not unique, permanent or linked to a real account.`;
    try {if (navigator.share) await navigator.share({title:'GYVORA sample QR',text});else {await navigator.clipboard.writeText(text);toast.success('Sample ID copied');}}
    catch(e) {if(e instanceof Error && e.name==='AbortError')return;toast.error('Sharing unavailable; use Download.');}
  }
  return <section aria-label={`${kind === 'gym' ? 'Gym' : 'Client'} sample ID and QR`} className="border-y py-5">
    <div className="flex flex-wrap items-center gap-5">
      <div ref={ref} className="w-fit shrink-0 rounded-lg bg-foreground p-3"><QRCodeSVG value={`GYVORA-PROTOTYPE-SAMPLE:${id}`} size={expanded ? 220 : 112} marginSize={4} bgColor="transparent" fgColor="currentColor" className="text-background" title={`Fictional sample QR for ${id}`} /></div>
      <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">Sample {kind === 'gym' ? 'Gym' : 'Client'} ID</p><p className="mt-1 break-all text-lg font-semibold text-primary">{id}</p><p className="mt-2 max-w-md text-xs text-muted-foreground">Fictional sample ID and QR — not unique, permanent or linked to a real account.</p><div className="mt-4 flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={()=>setExpanded(v=>!v)}><QrCode className="h-4 w-4"/>{expanded ? 'Reduce QR' : 'View QR'}</Button><Button type="button" variant="outline" size="sm" onClick={()=>void share()}><Share2 className="h-4 w-4"/>Share</Button><Button type="button" variant="outline" size="sm" onClick={download}><Download className="h-4 w-4"/>Download</Button></div></div>
    </div>
  </section>;
}