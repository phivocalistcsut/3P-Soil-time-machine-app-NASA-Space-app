"use client";

import * as Popover from "@radix-ui/react-popover";
import * as Dialog from "@radix-ui/react-dialog";
import * as RSlider from "@radix-ui/react-slider";
import * as RSwitch from "@radix-ui/react-switch";
import { Info, X, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import * as React from "react";
import { create } from "zustand";
import { cn } from "./primitives";

/* --------------------------------- InfoTip --------------------------------- */
/** Tap/click/focus help bubble (works on touch devices, unlike hover tooltips). */
export function InfoTip({ children, label = "More information", className }: { children: React.ReactNode; label?: string; className?: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={label}
        className={cn("inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-sand-2 hover:text-ink", className)}
        onClick={(e) => e.stopPropagation()}
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          collisionPadding={12}
          className="z-[80] max-w-[300px] rounded-xl border border-line bg-white p-3 text-xs leading-relaxed text-ink shadow-[var(--shadow-float)] animate-fade-in"
        >
          {children}
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export const PopoverRoot = Popover.Root;
export const PopoverTrigger = Popover.Trigger;
export function PopoverContent({ className, children, ...p }: Popover.PopoverContentProps) {
  return (
    <Popover.Portal>
      <Popover.Content
        sideOffset={6}
        collisionPadding={12}
        className={cn("z-[80] rounded-2xl border border-line bg-white p-3 shadow-[var(--shadow-float)] animate-fade-in", className)}
        {...p}
      >
        {children}
      </Popover.Content>
    </Popover.Portal>
  );
}

/* ---------------------------------- Sheet ---------------------------------- */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  side = "bottom",
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  side?: "bottom" | "right";
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-forest-deep/30 backdrop-blur-[1px] animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed z-[71] flex flex-col bg-white shadow-[var(--shadow-float)] animate-fade-in focus:outline-none",
            side === "bottom" && "inset-x-0 bottom-0 max-h-[88vh] rounded-t-3xl",
            side === "right" && "inset-y-0 right-0 w-full max-w-md",
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <Dialog.Title className="text-base font-semibold text-ink">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-xs text-ink-2">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="rounded-full p-2 text-ink-2 hover:bg-sand-2" aria-label="Close">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* --------------------------------- Slider ---------------------------------- */
export function Slider({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  label,
  valueText,
  className,
  trackClassName,
  rangeClassName,
  thumbClassName,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (v: number) => void;
  label: string;
  valueText?: string;
  className?: string;
  trackClassName?: string;
  rangeClassName?: string;
  thumbClassName?: string;
}) {
  return (
    <RSlider.Root
      className={cn("relative flex h-6 w-full touch-none select-none items-center", className)}
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onValueChange(v[0])}
    >
      <RSlider.Track className={cn("relative h-1.5 grow overflow-hidden rounded-full bg-sand-2", trackClassName)}>
        <RSlider.Range className={cn("absolute h-full rounded-full bg-forest", rangeClassName)} />
      </RSlider.Track>
      <RSlider.Thumb
        aria-label={label}
        aria-valuetext={valueText}
        className={cn(
          "block h-5 w-5 rounded-full border-2 border-forest bg-white shadow transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-water",
          thumbClassName,
        )}
      />
    </RSlider.Root>
  );
}

/* --------------------------------- Switch ---------------------------------- */
export function Switch({ checked, onCheckedChange, label, id }: { checked: boolean; onCheckedChange: (v: boolean) => void; label: string; id?: string }) {
  return (
    <RSwitch.Root
      id={id}
      aria-label={label}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="relative h-6 w-11 shrink-0 rounded-full bg-[#cfd5cc] transition-colors data-[state=checked]:bg-forest"
    >
      <RSwitch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
    </RSwitch.Root>
  );
}

/* ---------------------------------- Toasts --------------------------------- */
type Toast = { id: number; tone: "success" | "error" | "info"; text: string };
const useToasts = create<{ toasts: Toast[]; push: (t: Omit<Toast, "id">) => void; dismiss: (id: number) => void }>((set) => ({
  toasts: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 3800);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (text: string) => useToasts.getState().push({ tone: "success", text }),
  error: (text: string) => useToasts.getState().push({ tone: "error", text }),
  info: (text: string) => useToasts.getState().push({ tone: "info", text }),
};

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-6 no-print">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-[var(--shadow-float)] animate-fade-in"
        >
          {t.tone === "success" && <CheckCircle2 className="h-4 w-4 shrink-0 text-leaf-ink" aria-hidden />}
          {t.tone === "error" && <XCircle className="h-4 w-4 shrink-0 text-risk-ink" aria-hidden />}
          {t.tone === "info" && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-ink" aria-hidden />}
          <span>{t.text}</span>
          <button className="ml-1 rounded p-1 text-ink-3 hover:text-ink" onClick={() => dismiss(t.id)} aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
