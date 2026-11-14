"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { Check, Pencil, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { RotationScenario } from "@/lib/types";
import { cn } from "@/components/ui/primitives";

/* ---------------------------------------------------------------------------
 * Simulator step-by-step picker: one big step at a time; finished steps shrink
 * into small chips on the left; after all three, a summary bar appears.
 * ------------------------------------------------------------------------- */

export type SimStep = 1 | 2 | 3 | 4;

/** Photo for each kind of plan (files in /public/images, credits in CREDITS.md). */
export const PLAN_PHOTO: Record<RotationScenario["kind"], string> = {
  conventional: "card-harvest.webp",
  fit: "plan-fit.webp",
  water: "plan-water.webp",
  soil: "plan-soil.webp",
  custom: "card-harvest.webp",
};

/** Animated number: eases from the previous value to the new one. */
export function CountUp({ value, format, duration = 900 }: { value: number; format: (v: number) => string; duration?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const first = useRef(true);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const start = first.current ? 0 : from.current;
    first.current = false;
    if (reduce || start === value) {
      from.current = value;
      setShown(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setShown(start + (value - start) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, duration]);
  return <>{format(shown)}</>;
}

/** Header of the big step panel: number, title and progress dots. */
export function StepHeader({ n, title, right }: { n: 1 | 2 | 3; title: string; right?: React.ReactNode }) {
  const { L } = useI18n();
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-space-900 font-display text-lg font-extrabold text-lime-bright">{n}</span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-3">{L(`Step ${n} of 3`, `Bước ${n}/3`)}</p>
          <h2 className="title-caps text-xl font-extrabold leading-tight md:text-2xl">{title}</h2>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex gap-1.5" aria-hidden>
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn("h-1.5 rounded-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]", i === n ? "w-8 bg-lime" : i < n ? "w-4 bg-lime/50" : "w-4 bg-line")}
            />
          ))}
        </span>
        {right}
      </div>
    </div>
  );
}

/** A finished step, shrunk to a chip. Pass `image` to show a photo thumbnail. */
export function DoneChip({
  n,
  icon: Icon,
  image,
  label,
  value,
  onEdit,
  wide,
  delay = 0,
}: {
  n: number;
  icon: LucideIcon;
  image?: string;
  label: string;
  value: React.ReactNode;
  onEdit: () => void;
  wide?: boolean;
  delay?: number;
}) {
  const { L } = useI18n();
  return (
    <button
      type="button"
      onClick={onEdit}
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        "lift group flex w-full items-center gap-3 rounded-2xl border border-line bg-white text-left shadow-[var(--shadow-card)] hover:-translate-y-0.5 hover:border-lime hover:shadow-[var(--shadow-float)]",
        wide ? "anim-rise px-4 py-3.5" : "anim-slide px-3 py-3",
      )}
      aria-label={L(`Change step ${n}: ${label}`, `Đổi bước ${n}: ${label}`)}
    >
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lime-soft text-lime-ink">
        {image ? (
          <span className="absolute inset-0 overflow-hidden rounded-full">
            <Image src={`/images/${image}`} alt="" fill sizes="44px" className="object-cover" />
          </span>
        ) : (
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        )}
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-lime text-space-900 ring-2 ring-white">
          <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-3">{label}</span>
        <span className={cn("block font-display text-[15px] font-bold leading-snug text-ink", wide ? "truncate" : "line-clamp-2")}>{value}</span>
      </span>
      <span className="flex h-8 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-semibold text-ink-2 transition-colors group-hover:bg-lime-soft group-hover:text-lime-ink">
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">{L("Change", "Đổi")}</span>
      </span>
    </button>
  );
}

/** Non-clickable summary card: dark visual on top (optionally over a photo), then one number. */
export function GlanceCard({
  icon: Icon,
  title,
  value,
  unit,
  note,
  visual,
  image,
  delay = 0,
  className,
}: {
  icon: LucideIcon;
  title: string;
  value: React.ReactNode;
  unit?: string;
  note?: React.ReactNode;
  visual: React.ReactNode;
  image?: string;
  delay?: number;
  className?: string;
}) {
  return (
    <article style={{ animationDelay: `${delay}ms` }} className={cn("anim-rise flex flex-col rounded-3xl border border-line bg-white p-3 shadow-[var(--shadow-card)]", className)}>
      <div className="relative isolate h-44 overflow-hidden rounded-2xl bg-space-900 text-white md:h-48">
        {image ? (
          <div aria-hidden className="absolute inset-0 -z-10">
            <Image src={`/images/${image}`} alt="" fill sizes="(min-width: 1280px) 400px, 100vw" className="anim-ken-burns object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-space-950/90 via-space-950/65 to-space-950/40" />
          </div>
        ) : (
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_100%_0%,rgba(141,198,63,0.16),transparent_60%)]" />
        )}
        {visual}
      </div>
      <div className="px-2 pb-1 pt-4">
        <p className="flex items-center gap-1.5 font-display text-[11px] font-extrabold uppercase tracking-[0.18em] text-lime-ink">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {title}
        </p>
        <p className="mt-1.5 font-display text-[28px] font-extrabold leading-tight text-ink tabular">
          {value}
          {unit && <span className="ml-1 text-xs font-semibold text-ink-2">{unit}</span>}
        </p>
        {note && <p className="mt-0.5 text-xs text-ink-2">{note}</p>}
      </div>
    </article>
  );
}

/* ------------------------------- card visuals ------------------------------ */

/** This plan vs. today, as two bars out of 100 that grow in. */
export function ScoreCompare({ score, today, color }: { score: number; today: number; color: string }) {
  const { L, num } = useI18n();
  const row = (label: string, v: number, fill: string, strong: boolean, delay: number) => (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
        <span className={strong ? "font-semibold text-white" : "text-white/60"}>{label}</span>
        <span className={cn("font-display font-extrabold tabular", strong ? "text-xl text-white" : "text-sm text-white/70")}>
          <CountUp value={v} format={(x) => num(x)} />
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          key={`${label}-${Math.round(v)}`}
          className="anim-grow-x h-full rounded-full transition-[width] duration-700"
          style={{ width: `${Math.max(2, Math.min(100, v))}%`, background: fill, animationDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
  return (
    <div className="flex h-full flex-col justify-center gap-5 px-5">
      {row(L("This plan", "Cách trồng này"), score, color, true, 150)}
      {row(L("Today", "Hiện tại"), today, "rgba(255,255,255,0.4)", false, 350)}
    </div>
  );
}

/** Smooth path through points (Catmull-Rom → cubic Bézier). */
function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Overall score year by year: smooth line, soft fill, a dashed "today" line, the chosen year highlighted. */
export function TrendSpark({ values, years, selected, color, today }: { values: number[]; years: number[]; selected: number; color: string; today?: number }) {
  const { L, num } = useI18n();
  const gid = useId().replace(/:/g, "");
  if (values.length < 2) return null;
  const W = 300;
  const H = 150;
  const top = 30;
  const bottom = 118;
  const all = today === undefined ? values : [...values, today];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const pad = Math.max((hi - lo) * 0.25, 4);
  const min = lo - pad;
  const max = hi + pad;
  const x = (i: number) => 22 + (i / (values.length - 1)) * (W - 44);
  const y = (v: number) => bottom - ((v - min) / (max - min)) * (bottom - top);
  const pts = values.map((v, i) => [x(i), y(v)] as [number, number]);
  const line = smoothPath(pts);
  const sig = values.map((v) => Math.round(v)).join("-");
  const sx = x(selected);
  const sy = y(values[selected]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`fill-${gid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.5" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* today reference */}
      {today !== undefined && (
        <g className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <line x1={14} x2={W - 14} y1={y(today)} y2={y(today)} stroke="rgba(255,255,255,0.35)" strokeDasharray="3 4" />
          <text x={W - 14} y={y(today) - 5} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.6)">
            {L("today", "hiện tại")} {num(today)}
          </text>
        </g>
      )}
      {/* selected-year guide */}
      <line x1={sx} x2={sx} y1={sy} y2={bottom + 4} stroke="#a8dc5c" strokeOpacity="0.5" strokeDasharray="2 3" className="transition-all duration-500" />
      <g key={`a${sig}`} className="animate-fade-in" style={{ animationDelay: "600ms" }}>
        <path d={`${line} L${x(values.length - 1)},${bottom + 4} L${x(0)},${bottom + 4} Z`} fill={`url(#fill-${gid})`} />
      </g>
      <path key={`l${sig}`} d={line} pathLength={1} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" className="anim-draw" />
      {values.map((v, i) => {
        const on = i === selected;
        return (
          <g key={i} className="animate-fade-in" style={{ animationDelay: `${400 + i * 120}ms` }}>
            {on ? (
              <>
                <rect x={x(i) - 17} y={y(v) - 25} width={34} height={17} rx={8.5} fill="#a8dc5c" />
                <text x={x(i)} y={y(v) - 13} textAnchor="middle" fontSize="10.5" fontWeight={800} fill="#0a121c">
                  {num(v)}
                </text>
                <circle cx={x(i)} cy={y(v)} r={6} fill="#a8dc5c" stroke="#0a121c" strokeWidth={2.5} />
              </>
            ) : (
              <>
                <text x={x(i)} y={y(v) - 9} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.65)">
                  {num(v)}
                </text>
                <circle cx={x(i)} cy={y(v)} r={3.5} fill="#0a121c" stroke={color} strokeWidth={2} />
              </>
            )}
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill={on ? "#a8dc5c" : "rgba(255,255,255,0.5)"} fontWeight={on ? 800 : 500}>
              {years[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export interface Takeaway {
  icon: LucideIcon;
  tone: "positive" | "negative" | "neutral";
  title: string;
  detail: string;
}

/** Plain-language summary of what changes vs. today (one short line each). */
export function Takeaways({ items, onMore }: { items: Takeaway[]; onMore: () => void }) {
  const { L } = useI18n();
  const tone = {
    positive: { chip: "bg-lime-soft text-lime-ink", arrow: "text-lime-ink" },
    negative: { chip: "bg-risk-soft text-risk-ink", arrow: "text-risk-ink" },
    neutral: { chip: "bg-white text-ink-2", arrow: "text-ink-3" },
  };
  return (
    <div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((it, i) => (
          <li key={it.title} style={{ animationDelay: `${780 + i * 100}ms` }} className="anim-rise flex items-center gap-3 rounded-2xl bg-sand/80 p-3.5">
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", tone[it.tone].chip)}>
              <it.icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold leading-tight text-ink">{it.title}</span>
              <span className="mt-0.5 block text-xs text-ink-2">{it.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onMore} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-ink-2 underline-offset-2 hover:text-lime-ink hover:underline">
        {L("Detailed explanation", "Xem giải thích chi tiết")} →
      </button>
    </div>
  );
}
