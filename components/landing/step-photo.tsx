"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { Expand, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Keep the supplied images intact and let readers inspect the portrait diagram. */
export function StepPhoto({ src, alt, title, imageClass, contain }: {
  src: string; alt: string; title: string; imageClass: string; contain: boolean;
}) {
  const { L } = useI18n();
  return <Dialog.Root>
    <Dialog.Trigger asChild>
      <button type="button" aria-label={L(`Enlarge image: ${title}`, `Phóng to ảnh: ${title}`)}
        className={`relative block aspect-[4/3] w-full overflow-hidden rounded-[19px] ${contain ? "bg-[#ece5ce]" : "bg-sand-2"}`}>
        <Image src={src} alt={alt} fill sizes="(min-width: 1520px) 330px, (min-width: 1280px) 23vw, (min-width: 640px) 46vw, 92vw"
          className={`${imageClass} transition-transform duration-700 ${contain ? "" : "motion-safe:group-hover:scale-[1.035]"}`} />
        <span aria-hidden className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-space-950/60 text-white shadow-sm backdrop-blur-sm transition-colors group-hover:bg-space-950/85">
          <Expand className="h-4 w-4" />
        </span>
      </button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[90] bg-space-950/85 backdrop-blur-sm animate-fade-in" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-[91] w-[min(94vw,1100px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/15 bg-space-900 text-white shadow-[var(--shadow-float)] focus:outline-none">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
          <div className="min-w-0">
            <Dialog.Title className="text-sm font-semibold">{title}</Dialog.Title>
            <Dialog.Description className="sr-only">{L("Full image. Press Escape or Close to return to the steps.", "Ảnh đầy đủ. Nhấn Escape hoặc Đóng để quay lại các bước.")}</Dialog.Description>
          </div>
          <Dialog.Close aria-label={L("Close image", "Đóng ảnh")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10"><X className="h-5 w-5" aria-hidden /></Dialog.Close>
        </div>
        <div className="relative h-[min(72svh,780px)]">
          <Image src={src} alt={alt} fill sizes="(min-width: 1170px) 1100px, 94vw" className="object-contain" />
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
