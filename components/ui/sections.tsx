"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "./primitives";
import { HeaderArt } from "@/components/illustrations";

/* ---------------------------------------------------------------------------
 * Colour tones: each part of the app has its own colour so farmers can find
 * their way by colour AND by icon + label (never colour alone).
 * ------------------------------------------------------------------------- */
export type Tone = "green" | "leaf" | "blue" | "earth" | "amber" | "violet" | "rose" | "teal";

export const TONES: Record<Tone, { solid: string; soft: string; ink: string; band: string; ring: string }> = {
  green: { solid: "bg-forest", soft: "bg-mint", ink: "text-forest", band: "from-forest-deep via-forest to-[#2F7A50]", ring: "ring-forest" },
  leaf: { solid: "bg-[#3F8F5A]", soft: "bg-[#E2F3E6]", ink: "text-[#2F6E45]", band: "from-[#2F6E45] via-[#3F8F5A] to-[#66AD79]", ring: "ring-[#3F8F5A]" },
  blue: { solid: "bg-[#2F6F9C]", soft: "bg-water-soft", ink: "text-water-ink", band: "from-[#1F4F72] via-[#2F6F9C] to-[#4A94C7]", ring: "ring-[#2F6F9C]" },
  teal: { solid: "bg-[#23786F]", soft: "bg-[#DDF1EE]", ink: "text-[#1C6159]", band: "from-[#174D48] via-[#23786F] to-[#3E9C8F]", ring: "ring-[#23786F]" },
  earth: { solid: "bg-[#8A5E33]", soft: "bg-[#F3E9DC]", ink: "text-earth-ink", band: "from-[#6E4A26] via-[#8A5E33] to-[#B8864F]", ring: "ring-[#8A5E33]" },
  amber: { solid: "bg-[#B7791F]", soft: "bg-amber-soft", ink: "text-amber-ink", band: "from-[#8A5A10] via-[#B7791F] to-[#E4A84C]", ring: "ring-[#B7791F]" },
  violet: { solid: "bg-[#6A4C93]", soft: "bg-[#EFE7F6]", ink: "text-[#5B3F86]", band: "from-[#4A3370] via-[#6A4C93] to-[#8E6CB8]", ring: "ring-[#6A4C93]" },
  rose: { solid: "bg-[#B5524A]", soft: "bg-risk-soft", ink: "text-risk-ink", band: "from-[#8A3A33] via-[#B5524A] to-[#D97167]", ring: "ring-[#B5524A]" },
};

/* ------------------------------- page header ------------------------------ */

export function PageHeader({
  tone = "green",
  icon: Icon,
  eyebrow,
  title,
  desc,
  actions,
  children,
}: {
  tone?: Tone;
  icon: LucideIcon;
  eyebrow?: string;
  title: React.ReactNode;
  desc?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn("relative overflow-hidden rounded-3xl bg-gradient-to-br px-5 py-5 text-white shadow-[var(--shadow-card)] md:px-7 md:py-6 print:bg-none print:text-ink", TONES[tone].band)}>
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 no-print" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/5 no-print" />
      <HeaderArt className="pointer-events-none absolute bottom-0 right-0 hidden h-[140px] w-[360px] sm:block no-print" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-contours-light opacity-70 no-print" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <div>
            {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75">{eyebrow}</p>}
            <h1 className="text-[22px] font-bold leading-tight md:text-[27px]">{title}</h1>
            {desc && <p className="mt-1 max-w-2xl text-sm text-white/85">{desc}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2 no-print">{actions}</div>}
      </div>
      {children && <div className="relative mt-4">{children}</div>}
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

/** Big, colourful category tiles: one tap opens one topic at a time. */
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
  return (
    <div className={cn("-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 no-print", className)}>
      <div role="tablist" aria-label={label} className="flex gap-2 md:grid md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
        {tabs.map((t) => {
          const active = t.id === value;
          const tone = TONES[t.tone];
          return (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={active}
              aria-controls={`panel-${t.id}`}
              onClick={() => onChange(t.id)}
              className={cn(
                "group flex min-h-[64px] min-w-[150px] items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-all duration-200",
                active ? cn(tone.solid, "border-transparent text-white shadow-[var(--shadow-float)]") : "border-line bg-white text-ink hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]",
              )}
            >
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", active ? "bg-white/20 text-white" : cn(tone.soft, tone.ink))}>
                <t.icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[13.5px] font-semibold leading-tight">
                  {t.label}
                  {t.badge && (
                    <span className={cn("rounded-full px-1.5 text-[10px] font-bold", active ? "bg-white/25 text-white" : cn(tone.soft, tone.ink))}>{t.badge}</span>
                  )}
                </span>
                {t.hint && <span className={cn("mt-0.5 block text-[11px] leading-snug", active ? "text-white/85" : "text-ink-2")}>{t.hint}</span>}
              </span>
            </button>
          );
        })}
      </div>
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

/** Coloured strip heading inside a section. */
export function Strip({ tone, icon: Icon, title, desc, right }: { tone: Tone; icon: LucideIcon; title: string; desc?: string; right?: React.ReactNode }) {
  return (
    <div className={cn("mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3", TONES[tone].soft)}>
      <div className="flex items-start gap-2.5">
        <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white", TONES[tone].solid)}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className={cn("text-[15px] font-bold", TONES[tone].ink)}>{title}</h2>
          {desc && <p className="text-xs text-ink-2">{desc}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

/** Big, friendly number tile for the "at a glance" strips. */
export function StatTile({ tone, icon: Icon, label, value, unit, note }: { tone: Tone; icon: LucideIcon; label: string; value: React.ReactNode; unit?: string; note?: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl p-3.5", TONES[tone].soft)}>
      <p className={cn("flex items-center gap-1.5 text-xs font-semibold", TONES[tone].ink)}>
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </p>
      <div className="mt-1 font-display text-2xl font-extrabold leading-tight text-ink tabular value-transition">
        {value}
        {unit && <span className="ml-1 text-xs font-semibold text-ink-2">{unit}</span>}
      </div>
      {note && <div className="mt-0.5 text-[11px] leading-snug text-ink-2">{note}</div>}
    </div>
  );
}
