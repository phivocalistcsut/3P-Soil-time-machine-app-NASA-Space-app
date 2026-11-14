"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "./primitives";

/* ---------------------------------------------------------------------------
 * Topic tones: a soft tint + ink per topic, used for small icon chips so
 * farmers can find their way by colour AND by icon + label (never colour alone).
 * Large surfaces stay neutral; the single brand accent is lime.
 * ------------------------------------------------------------------------- */
export type Tone = "green" | "leaf" | "blue" | "earth" | "amber" | "violet" | "rose" | "teal";

export const TONES: Record<Tone, { solid: string; soft: string; ink: string }> = {
  green: { solid: "bg-forest", soft: "bg-lime-soft", ink: "text-lime-ink" },
  leaf: { solid: "bg-[#5E9A2A]", soft: "bg-lime-soft", ink: "text-lime-ink" },
  blue: { solid: "bg-[#2F6F9C]", soft: "bg-water-soft", ink: "text-water-ink" },
  teal: { solid: "bg-[#23786F]", soft: "bg-[#E2F2EF]", ink: "text-[#1C6159]" },
  earth: { solid: "bg-[#8A5E33]", soft: "bg-[#F4EBDF]", ink: "text-earth-ink" },
  amber: { solid: "bg-[#B7791F]", soft: "bg-amber-soft", ink: "text-amber-ink" },
  violet: { solid: "bg-[#6A4C93]", soft: "bg-[#F0E9F7]", ink: "text-[#5B3F86]" },
  rose: { solid: "bg-[#B5524A]", soft: "bg-risk-soft", ink: "text-risk-ink" },
};

/* ------------------------------- page header ------------------------------ */

/** NASA photographs in /public/images (credits in /public/images/CREDITS.md). */
export type BandImage = "earth-limb" | "orbital-sunrise" | "mekong-delta" | "night-coast" | "space-horizon";

/** Dark photo band at the top of every app page: Earth seen from orbit. */
export function PageHeader({
  image = "earth-limb",
  icon: Icon,
  eyebrow,
  title,
  desc,
  actions,
  meta,
  children,
}: {
  image?: BandImage;
  icon: LucideIcon;
  eyebrow?: string;
  title: React.ReactNode;
  desc?: React.ReactNode;
  actions?: React.ReactNode;
  /** small status chips (data sources, demo flag) shown under the title */
  meta?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="relative isolate overflow-hidden rounded-3xl bg-space-900 px-5 py-6 text-white shadow-[var(--shadow-float)] md:px-8 md:py-8 print:bg-none print:px-0 print:text-ink print:shadow-none">
      <div aria-hidden className="absolute inset-0 -z-10 no-print">
        <Image src={`/images/${image}.webp`} alt="" fill sizes="(min-width: 1440px) 1380px, 100vw" className="object-cover opacity-80" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-space-950/95 via-space-950/80 to-space-950/45 md:bg-gradient-to-r md:from-space-950/95 md:via-space-950/75 md:to-space-950/30" />
        <div className="absolute inset-0 bg-stars opacity-50" />
      </div>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-lime/50 bg-space-950/40 text-lime-bright sm:flex no-print">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow text-lime-bright print:text-lime-ink">{eyebrow}</p>}
            <h1 className="title-caps mt-1.5 text-[24px] font-extrabold leading-[1.1] md:text-[34px]">{title}</h1>
            {desc && <p className="mt-2 max-w-2xl text-sm text-white/80 md:text-[15px] print:text-ink-2">{desc}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2 no-print">{actions}</div>}
      </div>
      {meta && <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4 no-print">{meta}</div>}
      {children && <div className="mt-5">{children}</div>}
    </header>
  );
}

/* ------------------------------- section tabs ------------------------------ */

export interface SectionTab {
  id: string;
  icon: LucideIcon;
  label: string;
  hint?: string;
  tone: Tone;
  badge?: string;
}

/** Remembers the open section per page (URL hash first, then this browser). */
export function useSection(storageKey: string, ids: string[], fallback: string) {
  // pages using this render only after client hydration (AppShell), so window is available
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return fallback;
    const hash = window.location.hash.replace("#", "");
    if (ids.includes(hash)) return hash;
    try {
      const saved = localStorage.getItem(`stm-section-${storageKey}`);
      if (saved && ids.includes(saved)) return saved;
    } catch {
      /* storage unavailable */
    }
    return fallback;
  });
  // follow in-app links such as /simulator#calendar while the page is open
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      if (ids.includes(h)) setValue(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [ids]);
  const change = (id: string) => {
    setValue(id);
    try {
      localStorage.setItem(`stm-section-${storageKey}`, id);
      window.history.replaceState(null, "", `#${id}`);
    } catch {
      /* ignore */
    }
  };
  return [value, change] as const;
}

/** Compact topic tabs: one tap opens one topic at a time; the active topic's hint is shown below. */
export function SectionTabs({
  tabs,
  value,
  onChange,
  label,
  className,
}: {
  tabs: SectionTab[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}) {
  const active = tabs.find((t) => t.id === value);
  return (
    <div className={cn("no-print", className)}>
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div role="tablist" aria-label={label} className="flex w-max gap-1 rounded-full border border-line bg-white p-1 shadow-[var(--shadow-card)] md:w-auto md:flex-wrap">
          {tabs.map((t) => {
            const on = t.id === value;
            return (
              <button
                key={t.id}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={on}
                aria-controls={`panel-${t.id}`}
                aria-describedby={on && t.hint ? `tab-hint-${t.id}` : undefined}
                onClick={() => onChange(t.id)}
                className={cn(
                  "flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[13.5px] font-semibold transition-colors",
                  on ? "bg-space-900 text-white" : "text-ink-2 hover:bg-sand hover:text-ink",
                )}
              >
                <t.icon className={cn("h-4 w-4", on ? "text-lime-bright" : TONES[t.tone].ink)} aria-hidden />
                {t.label}
                {t.badge && <span className={cn("rounded-full px-1.5 text-[10px] font-bold", on ? "bg-lime text-space-900" : "bg-lime-soft text-lime-ink")}>{t.badge}</span>}
              </button>
            );
          })}
        </div>
      </div>
      {active?.hint && (
        <p id={`tab-hint-${active.id}`} className="mt-2 px-1 text-xs text-ink-2">
          {active.hint}
        </p>
      )}
    </div>
  );
}

export function SectionPanel({ id, active, children, keepMounted, className }: { id: string; active: boolean; children: React.ReactNode; keepMounted?: boolean; className?: string }) {
  if (!active && !keepMounted) return null;
  return (
    <section role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} className={cn(active ? "animate-fade-in" : "hidden print:block", className)}>
      {children}
    </section>
  );
}

/** Section heading inside a topic panel. */
export function Strip({ tone, icon: Icon, title, desc, right }: { tone: Tone; icon: LucideIcon; title: string; desc?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", TONES[tone].soft, TONES[tone].ink)}>
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-bold leading-tight text-ink">{title}</h2>
          {desc && <p className="mt-0.5 text-xs text-ink-2">{desc}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

/** Big, friendly number tile for the "at a glance" strips. */
export function StatTile({ tone, icon: Icon, label, value, unit, note }: { tone: Tone; icon: LucideIcon; label: string; value: React.ReactNode; unit?: string; note?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-card)]">
      <p className="flex items-center gap-2 text-xs font-semibold text-ink-2">
        <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", TONES[tone].soft, TONES[tone].ink)}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        {label}
      </p>
      <div className="mt-2 font-display text-2xl font-extrabold leading-tight text-ink tabular value-transition">
        {value}
        {unit && <span className="ml-1 text-xs font-semibold text-ink-2">{unit}</span>}
      </div>
      {note && <div className="mt-0.5 text-[11px] leading-snug text-ink-2">{note}</div>}
    </div>
  );
}
