"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  Droplets,
  FlaskConical,
  Leaf,
  Minus,
  Mountain,
  RotateCcw,
  ShieldAlert,
  Sprout,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { CriterionId, RotationScenario, SimulationResult } from "@/lib/types";
import { SEASON_ORDER } from "@/lib/data/crops";
import { CropIcon } from "@/components/common";
import { CountUp, PLAN_PHOTO } from "@/components/sim/sim-steps";
import { cn } from "@/components/ui/primitives";

/* ---------------------------------------------------------------------------
 * Compare page as a scrolling story: four chapters, each answering one question.
 * ------------------------------------------------------------------------- */

export const CRITERIA: CriterionId[] = ["soil", "water", "drought", "income", "inputs", "climate"];
export const CRIT_ICON: Record<CriterionId, LucideIcon> = { soil: Leaf, water: Droplets, drought: Sun, income: Coins, inputs: FlaskConical, climate: Mountain };

/** Becomes true once the element scrolls into view (stays true). */
export function useInView<T extends Element>(margin = "-10% 0px") {
  const ref = useRef<T>(null);
  // without IntersectionObserver (old browsers) everything is simply shown
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, margin]);
  return [ref, seen] as const;
}

/** Fades content up the first time it scrolls into view. */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} style={{ animationDelay: `${delay}ms` }} className={cn(seen ? "anim-rise" : "opacity-0", className)}>
      {children}
    </div>
  );
}

/** One chapter of the story: dark (space) or light surface, eyebrow + big title. */
export function Chapter({
  id,
  n,
  title,
  dark,
  children,
  right,
}: {
  id: string;
  n: number;
  title: string;
  dark?: boolean;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const { L } = useI18n();
  return (
    <section
      id={id}
      data-chapter={n}
      aria-labelledby={`${id}-title`}
      className={cn(
        "relative isolate scroll-mt-36 overflow-hidden rounded-[2rem] p-5 md:p-9",
        dark ? "bg-space-900 text-white shadow-[var(--shadow-float)]" : "border border-line bg-white shadow-[var(--shadow-card)]",
      )}
    >
      {dark && (
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-stars opacity-50" />
          <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_85%_0%,rgba(141,198,63,0.14),transparent_60%)]" />
        </div>
      )}
      <Reveal className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={cn("eyebrow", dark ? "text-lime-bright" : "text-lime-ink")}>{L(`Chapter ${n}`, `Chương ${n}`)}</p>
          <h2 id={`${id}-title`} className="title-caps mt-2 text-2xl font-extrabold leading-tight md:text-[38px]">
            {title}
          </h2>
        </div>
        {right}
      </Reveal>
      {children}
    </section>
  );
}

/** Floating dots on the right (desktop) showing and jumping between chapters. */
export function ChapterDots({ chapters }: { chapters: { id: string; label: string }[] }) {
  const [active, setActive] = useState(chapters[0]?.id);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) setActive(vis.target.id);
      },
      { threshold: [0.2, 0.4, 0.6], rootMargin: "-20% 0px -40% 0px" },
    );
    chapters.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [chapters]);
  return (
    <nav aria-label="Chapters" className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 xl:flex no-print">
      {chapters.map((c, i) => {
        const on = c.id === active;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => document.getElementById(c.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="group flex items-center justify-end gap-2"
            aria-current={on ? "step" : undefined}
          >
            <span className={cn("rounded-full bg-space-900/90 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100", on && "opacity-100")}>
              {i + 1} · {c.label}
            </span>
            <span className={cn("block rounded-full transition-all duration-500", on ? "h-3 w-3 bg-lime ring-4 ring-lime/25" : "h-2 w-2 bg-ink-3/60 group-hover:bg-ink-2")} />
          </button>
        );
      })}
    </nav>
  );
}

/* --------------------------------- podium --------------------------------- */

export interface PodiumPlan {
  scenario: RotationScenario;
  result: SimulationResult;
  color: string;
  draft?: boolean;
}

function Delta({ icon: Icon, label, value, good }: { icon: LucideIcon; label: string; value: string; good: boolean | null }) {
  const Arrow = good === null ? Minus : good ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="min-w-0 rounded-xl bg-sand/80 px-2 py-1.5" title={label}>
      <p className="flex items-center gap-1 text-[10px] font-semibold text-ink-3">
        <Icon className="h-3 w-3" aria-hidden />
        <span className="truncate">{label}</span>
      </p>
      <p className={cn("mt-0.5 flex items-center gap-0.5 truncate text-[12px] font-bold", good === null ? "text-ink-2" : good ? "text-lime-ink" : "text-risk-ink")}>
        <Arrow className="h-3 w-3 shrink-0" aria-hidden />
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

/** One plan on the podium: photo, rank, score, crops and three deltas vs today. */
function PodiumCard({ plan, rank, reference, compact }: { plan: PodiumPlan; rank: number; reference: SimulationResult; compact?: boolean }) {
  const { L, num, t, signed, crop } = useI18n();
  const { scenario: s, result: r, color } = plan;
  const dScore = r.overallScore - reference.overallScore;
  const dWater = r.waterDemand.median - reference.waterDemand.median;
  const dRisk = r.waterRisk.level - reference.waterRisk.level;
  const soc = r.soilImprovementPotential?.socTCHa;
  const refSoc = reference.soilImprovementPotential?.socTCHa;
  const dSoc = soc !== undefined && refSoc !== undefined ? soc - refSoc : null;
  return (
    <article className={cn("overflow-hidden rounded-3xl border-2 bg-white text-ink shadow-[var(--shadow-float)]", rank === 1 ? "border-lime" : "border-transparent")}>
      <div className={cn("relative isolate overflow-hidden text-white", compact ? "h-28" : "h-36")}>
        <Image src={`/images/${PLAN_PHOTO[s.kind]}`} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-space-950/90 via-space-950/50 to-space-950/10" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />
        <span
          className={cn(
            "absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full font-display text-base font-extrabold",
            rank === 1 ? "bg-lime text-space-900" : "bg-space-950/70 text-white ring-1 ring-white/30 backdrop-blur",
          )}
        >
          {rank}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-space-950/60 px-2 py-0.5 text-[11px] font-bold backdrop-blur">
          {dScore >= 0 ? "+" : "−"}
          {num(Math.abs(dScore))} {L("vs today", "so với hiện tại")}
        </span>
        <div className="absolute inset-x-3 bottom-2.5 flex items-end justify-between gap-2">
          <h3 className={cn("title-caps font-extrabold leading-tight", compact ? "text-sm" : "text-lg")}>{s.name}</h3>
          <p className={cn("font-display font-extrabold tabular leading-none", compact ? "text-2xl" : "text-4xl")} style={{ color: rank === 1 ? "#a8dc5c" : "white" }}>
            <CountUp value={r.overallScore} format={(v) => num(v)} />
          </p>
        </div>
      </div>
      <div className="space-y-2.5 p-3">
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: s.cycleYears }, (_, yi) =>
            SEASON_ORDER.map((se) => {
              const id = s.seasonalCropSequence.find((x) => x.yearIndex === yi && x.season === se)?.cropId ?? null;
              return (
                <span key={`${yi}-${se}`} className="rounded-md bg-sand p-0.5" title={crop(id)}>
                  <CropIcon cropId={id} size={compact ? 16 : 20} className="rounded" />
                </span>
              );
            }),
          )}
          {plan.draft && <span className="ml-auto self-center rounded-full bg-amber-soft px-2 text-[10px] font-semibold text-amber-ink">{L("unsaved", "chưa lưu")}</span>}
        </div>
        <div className={cn("grid gap-1.5", compact ? "grid-cols-1" : "grid-cols-3")}>
          <Delta
            icon={Droplets}
            label={L("Irrigation", "Nước tưới")}
            value={Math.abs(dWater) < 5 ? L("same", "như cũ") : `${dWater < 0 ? "−" : "+"}${num(Math.abs(dWater))} mm`}
            good={Math.abs(dWater) < 5 ? null : dWater < 0}
          />
          <Delta icon={ShieldAlert} label={L("Shortage", "Thiếu nước")} value={t(`stress.${r.waterRisk.level}`)} good={dRisk === 0 ? null : dRisk < 0} />
          <Delta
            icon={Sprout}
            label={L("Soil carbon", "Carbon đất")}
            value={dSoc === null ? "—" : `${signed(dSoc, 2)} t`}
            good={dSoc === null || Math.abs(dSoc) < 0.05 ? null : dSoc > 0}
          />
        </div>
      </div>
    </article>
  );
}

/**
 * Podium: plans stand on pedestals whose height follows their score; a dashed
 * line marks today's score. Rank changes slide the cards to their new place.
 */
export function Podium({ plans, reference }: { plans: PodiumPlan[]; reference: SimulationResult }) {
  const { L, num } = useI18n();
  const n = plans.length;
  // slot order on screen: 2nd · 1st · 3rd
  const slotOf = (rank: number) => (n === 3 ? [1, 0, 2][rank] : rank);
  const ped = (score: number) => 36 + Math.max(0, score) * 1.7;
  const CARD = 300;
  const maxPed = Math.max(...plans.map((p) => ped(p.result.overallScore)), ped(reference.overallScore));
  const height = CARD + maxPed + 12;
  const width = 100 / Math.max(n, 1);
  const todayY = ped(reference.overallScore);
  return (
    <>
      {/* desktop: real podium with sliding cards */}
      <div className="relative hidden md:block" style={{ height }}>
        <div className="pointer-events-none absolute inset-x-0 z-[5] border-t-2 border-dashed border-white/40" style={{ bottom: todayY }} aria-hidden>
          <span className="absolute -top-3 right-0 rounded-full bg-space-950/80 px-2.5 py-0.5 text-[11px] font-semibold text-white/80">
            {L("Today", "Hiện tại")}: {num(reference.overallScore)} {L("pts", "điểm")}
          </span>
        </div>
        {plans.map((p, rank) => {
          const slot = slotOf(rank);
          const h = ped(p.result.overallScore);
          return (
            <div
              key={p.scenario.id}
              className="absolute bottom-0 z-10 px-2.5 transition-[left,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ left: `${slot * width}%`, width: `${width}%`, ...(n === 1 ? { left: "33.33%", width: "33.33%" } : {}) }}
            >
              <div className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ transform: `translateY(-${h + 10}px)` }}>
                <PodiumCard plan={p} rank={rank + 1} reference={reference} />
              </div>
              <div
                className="absolute inset-x-2.5 bottom-0 flex items-start justify-center rounded-t-2xl pt-3 font-display text-3xl font-extrabold text-white/90 transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ height: h, background: `linear-gradient(to bottom, ${p.color}, ${p.color}55)` }}
                aria-hidden
              >
                {rank + 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* phone: winner big, the others side by side */}
      <div className="space-y-3 md:hidden">
        {plans[0] && <PodiumCard plan={plans[0]} rank={1} reference={reference} />}
        {n > 1 && (
          <div className="grid grid-cols-2 gap-3">
            {plans.slice(1).map((p, i) => (
              <PodiumCard key={p.scenario.id} plan={p} rank={i + 2} reference={reference} compact />
            ))}
          </div>
        )}
        <p className="text-center text-[11px] text-white/60">
          {L("Today", "Hiện tại")}: {num(reference.overallScore)} {L("pts", "điểm")}
        </p>
      </div>
    </>
  );
}

/* ------------------------------ priority tiles ----------------------------- */

const LEVEL_VALUE = [1, 3, 5] as const;
export const levelOf = (w: number) => (w <= 2 ? 0 : w === 3 ? 1 : 2);

export function PriorityTiles({
  weights,
  excluded,
  onChange,
  onReset,
  done,
}: {
  weights: Record<CriterionId, number>;
  excluded: (k: CriterionId) => boolean;
  onChange: (k: CriterionId, v: number) => void;
  onReset: () => void;
  /** action shown at the end of the tiles, e.g. "see the new ranking" */
  done?: React.ReactNode;
}) {
  const { L, t } = useI18n();
  const words = [L("A little", "Ít"), L("Some", "Vừa"), L("A lot", "Nhiều")];
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {CRITERIA.map((k, i) => {
          const Icon = CRIT_ICON[k];
          const lv = levelOf(weights[k]);
          const off = excluded(k);
          return (
            <Reveal key={k} delay={i * 70} className="h-full">
              <div
                className={cn(
                  "flex h-full flex-col items-start rounded-3xl border p-4 transition-colors duration-500 md:p-5",
                  off && "opacity-50",
                  lv === 2 ? "border-lime bg-lime text-space-900 shadow-[var(--shadow-float)]" : lv === 1 ? "border-lime/50 bg-lime-soft" : "border-line bg-white",
                )}
              >
                <span className={cn("flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-500", lv === 2 ? "bg-space-900 text-lime-bright" : lv === 1 ? "bg-white text-lime-ink" : "bg-sand text-ink-2")}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="mt-3 text-base font-bold leading-tight">{t(`crit.${k}.short`)}</span>
                <span className={cn("mt-0.5 text-[11.5px] leading-snug", lv === 2 ? "text-space-900/70" : "text-ink-2")}>{off ? L("no data yet", "chưa có dữ liệu") : t(`crit.${k}`)}</span>
                {/* one tap = exact level */}
                <div
                  role="radiogroup"
                  aria-label={t(`crit.${k}`)}
                  className={cn("mt-auto grid w-full grid-cols-3 gap-1 rounded-full p-1 pt-1", lv === 2 ? "bg-space-900/15" : "bg-sand-2")}
                  style={{ marginTop: "0.9rem" }}
                >
                  {words.map((w, j) => {
                    const on = j === lv;
                    return (
                      <button
                        key={w}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        disabled={off}
                        onClick={() => onChange(k, LEVEL_VALUE[j])}
                        className={cn(
                          "h-8 rounded-full text-xs font-bold transition-all duration-300 disabled:cursor-not-allowed",
                          on ? (lv === 2 ? "bg-space-900 text-lime-bright shadow-sm" : "bg-white text-ink shadow-sm") : lv === 2 ? "text-space-900/70 hover:bg-space-900/10" : "text-ink-2 hover:bg-white/70",
                        )}
                      >
                        {w}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onReset} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2 hover:text-ink">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          {L("Back to my farm's priorities", "Về ưu tiên ban đầu của ruộng")}
        </button>
        {done}
      </div>
    </div>
  );
}

/* ------------------------------- race lanes ------------------------------- */

export interface LanePlan {
  id: string;
  name: string;
  letter: string;
  color: string;
  scores: Record<CriterionId, number | null>;
  raw: Record<CriterionId, string>;
}

export function RaceLanes({ plans, today, weights }: { plans: LanePlan[]; today: Record<CriterionId, number | null>; weights: Record<CriterionId, number> }) {
  const { L, t, num } = useI18n();
  const [tip, setTip] = useState<string | null>(null);
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className="space-y-5">
      {CRITERIA.map((k, li) => {
        const Icon = CRIT_ICON[k];
        const lv = levelOf(weights[k]);
        const scored = plans.filter((p) => p.scores[k] !== null);
        const leader = scored.length ? scored.reduce((a, b) => ((b.scores[k] ?? 0) > (a.scores[k] ?? 0) ? b : a)) : null;
        const tie = leader && scored.filter((p) => Math.abs((p.scores[k] ?? 0) - (leader.scores[k] ?? 0)) < 0.5).length > 1;
        return (
          <div key={k} className={cn("grid items-center gap-x-4 gap-y-2 transition-opacity duration-500 md:grid-cols-[150px_minmax(0,1fr)_130px]", lv === 0 && "opacity-60")}>
            <p className="flex items-center gap-2 text-sm font-bold">
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", lv === 2 ? "bg-lime text-space-900" : "bg-white/10 text-white")}>
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              {t(`crit.${k}.short`)}
              {lv === 2 && <span className="rounded-full bg-lime/20 px-1.5 text-[10px] font-bold text-lime-bright">{L("a lot", "Nhiều")}</span>}
            </p>
            <div className="relative h-10">
              <div className={cn("absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full bg-white/10", lv === 2 ? "h-2.5" : "h-1.5")}>
                <div className="h-full w-full rounded-full bg-gradient-to-r from-white/0 via-white/10 to-lime/30" />
              </div>
              {today[k] !== null && (
                <div className="absolute top-0 h-full w-0.5 -translate-x-1/2 bg-white/50" style={{ left: `${today[k]}%` }} title={L("today", "hiện tại")}>
                  {li === 0 && <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-white/60">{L("today", "hiện tại")}</span>}
                </div>
              )}
              {plans.map((p, pi) => {
                const v = p.scores[k];
                if (v === null) return null;
                const key = `${k}-${p.id}`;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setTip(tip === key ? null : key)}
                    onMouseEnter={() => setTip(key)}
                    onMouseLeave={() => setTip((x) => (x === key ? null : x))}
                    className="absolute top-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full font-display text-[11px] font-extrabold text-white shadow-[0_0_0_3px_rgba(10,18,28,0.9)] transition-[left] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-lime"
                    style={{ left: seen ? `${v}%` : "0%", background: p.color, marginTop: (pi - (plans.length - 1) / 2) * 7 - 14, transitionDelay: `${li * 80 + pi * 60}ms`, zIndex: tip === key ? 20 : 10 }}
                    aria-label={`${p.name}: ${num(v)}/100 · ${p.raw[k]}`}
                  >
                    {p.letter}
                    {tip === key && (
                      <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-white px-2.5 py-1.5 text-left font-sans text-[11px] font-semibold text-ink shadow-[var(--shadow-float)]">
                        {p.name}
                        <span className="block font-normal text-ink-2">
                          {num(v)}/100 · {p.raw[k]}
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-white/70 md:text-right">
              {!leader ? (
                L("no data", "chưa có dữ liệu")
              ) : tie ? (
                L("tied", "ngang nhau")
              ) : (
                <>
                  <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: leader.color }} aria-hidden />
                  <span className="font-semibold text-white">{leader.name}</span> {L("leads", "dẫn đầu")}
                </>
              )}
            </p>
          </div>
        );
      })}
      <p className="pt-1 text-[11px] text-white/55">
        {L("0–100 for every topic, right is better. Tap a dot for the real value.", "Thang 0–100 cho mọi tiêu chí, càng về phải càng tốt. Chạm vào chấm để xem số đo thật.")}
      </p>
    </div>
  );
}
