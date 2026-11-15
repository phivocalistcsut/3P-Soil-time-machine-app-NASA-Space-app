"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useState } from "react";
import { Expand, X, ZoomIn, ZoomOut } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/components/ui/primitives";

/** Keep the supplied images intact and let readers inspect the portrait diagram. */
export function StepPhoto({ src, alt, title, imageClass, contain, previewClassName, sizes, zoomable = false }: {
  src: string; alt: string; title: string; imageClass: string; contain: boolean;
  previewClassName?: string; sizes?: string;
  zoomable?: boolean;
}) {
  const { L } = useI18n();
  const [zoom,setZoom] = useState(1);
  return <Dialog.Root onOpenChange={() => setZoom(1)}>
    <Dialog.Trigger asChild>
      <button type="button" aria-label={L(`Enlarge image: ${title}`, `Phóng to ảnh: ${title}`)}
        className={cn("relative block aspect-[4/3] w-full overflow-hidden rounded-[19px]", contain ? "bg-[#ece5ce]" : "bg-sand-2", previewClassName)}>
        <Image src={src} alt={alt} fill sizes={sizes ?? "(min-width: 1520px) 330px, (min-width: 1280px) 23vw, (min-width: 640px) 46vw, 92vw"}
          className={`${imageClass} transition-transform duration-700 ${contain ? "" : "motion-safe:group-hover:scale-[1.035]"}`} />
        <span aria-hidden className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-space-950/60 text-white shadow-sm backdrop-blur-sm transition-colors group-hover:bg-space-950/85">
          <Expand className="h-4 w-4" />
        </span>
      </button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[90] bg-space-950/85 backdrop-blur-sm animate-fade-in" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-[91] flex max-h-[94svh] w-[min(94vw,1100px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-white/15 bg-space-900 text-white shadow-[var(--shadow-float)] focus:outline-none">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
          <div className="min-w-0">
            <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
            <Dialog.Description className="sr-only">{zoomable ? L("Use the zoom buttons to enlarge, then scroll the image. Press Escape or Close to return.","Dùng nút phóng to, rồi cuộn ảnh để xem chi tiết. Nhấn Escape hoặc Đóng để quay lại.") : L("Full image. Press Escape or Close to return to the steps.", "Ảnh đầy đủ. Nhấn Escape hoặc Đóng để quay lại các bước.")}</Dialog.Description>
          </div>
          {zoomable && <div className="ml-auto flex shrink-0 items-center gap-1"><button type="button" disabled={zoom===1} onClick={()=>setZoom(z=>Math.max(1,z-1))} aria-label={L("Zoom out","Thu nhỏ ảnh")} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-40"><ZoomOut className="h-5 w-5" aria-hidden /></button><span className="text-sm tabular" aria-live="polite">{zoom*100}%</span><button type="button" disabled={zoom===3} onClick={()=>setZoom(z=>Math.min(3,z+1))} aria-label={L("Zoom in","Phóng to ảnh")} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-40"><ZoomIn className="h-5 w-5" aria-hidden /></button></div>}
          <Dialog.Close aria-label={L("Close image", "Đóng ảnh")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10"><X className="h-5 w-5" aria-hidden /></Dialog.Close>
        </div>
        {zoomable && <p className="shrink-0 border-b border-white/10 px-4 py-2 text-sm leading-relaxed text-white/85">{L("Zoom in to read the labels. Scroll the enlarged image to see other parts.","Phóng to để đọc chữ. Cuộn ảnh để xem các phần khác.")}</p>}
        {zoom === 1 ? <div className="relative h-[min(72svh,780px)] min-h-0"><Image src={src} alt={alt} fill sizes="(min-width: 1170px) 1100px, 94vw" className="object-contain" /></div> : <div className="h-[min(72svh,780px)] min-h-0 overflow-auto overscroll-contain" tabIndex={0} aria-label={L("Scrollable enlarged image","Ảnh phóng to có thể cuộn")}><div className="relative aspect-[16/10]" style={{width:`${zoom*100}%`}}><Image src={src} alt={alt} fill sizes="3300px" className="object-contain" /></div></div>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
