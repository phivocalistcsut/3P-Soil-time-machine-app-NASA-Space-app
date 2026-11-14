"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, ArrowUp, ChevronDown, FileSearch, Plus, Scale, Table2, TrendingDown, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { useEngine, useScenarios } from "@/lib/hooks";
import { buildCalendar, buildEvidence } from "@/lib/engine/insights";
import { EvidencePanel } from "@/components/insights";
import { PageHeader } from "@/components/ui/sections";
import type { CriterionId, RotationScenario, SimulationResult } from "@/lib/types";
import { SoilCarbon } from "@/components/sim/soil-carbon";
import { PLAN_PHOTO } from "@/components/sim/sim-steps";
import { ClimateNotice, DataChips, NoFarmState, scenarioColor, StressBadge, SuitBadge } from "@/components/common";
import { Skeleton, buttonClass, cn } from "@/components/ui/primitives";
import { CRITERIA, CRIT_ICON, Chapter, ChapterDots, Podium, PriorityTiles, RaceLanes, Reveal, type LanePlan, type PodiumPlan } from "./compare-chapters";

type Row = {
  id: string;
  label: string;
  better: "higher" | "lower";
  value: (r: SimulationResult) => number | null;
  fmt: (v: number, r: SimulationResult) => React.ReactNode;
};

/** old tab ids (links from other pages) → chapter / detail */
const LEGACY: Record<string, { chapter: string; deep?: "table" | "evidence" }> = {
  cards: { chapter: "ch-podium" },
  why: { chapter: "ch-podium" },
  charts: { chapter: "ch-race" },
  weights: { chapter: "ch-priorities" },
  table: { chapter: "ch-detail", deep: "table" },
  evidence: { chapter: "ch-detail", deep: "evidence" },
};

export function Compare() {
  const { L, t, num } = useI18n();
  const router = useRouter();
  const farm = useApp((s) => s.farm);
  const scenarios = useScenarios();
  const drafts = useApp((s) => s.scenarioDrafts);
  const activeId = useApp((s) => s.activeScenarioId);
  const compareIds = useApp((s) => s.compareIds);
  const setCompareIds = useApp((s) => s.setCompareIds);
  const weights = useApp((s) => s.weights);
  const setWeight = useApp((s) => s.setWeight);
  const resetWeights = useApp((s) => s.resetWeights);
  const selectedYear = useApp((s) => s.selectedYear);
  const setYear = useApp((s) => s.setYear);
  const setActive = useApp((s) => s.setActiveScenario);
  const { output, climate, modelClimate, modelLoading, extremes: daily, ndvi, usesImerg } = useEngine();
  const assumption = useApp((s) => s.climateAssumption);
  const customClimate = useApp((s) => s.customClimate);
  const [deep, setDeep] = useState<"table" | "evidence" | null>(null);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [stuck, setStuck] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const chosen: RotationScenario[] = useMemo(() => {
    const ids = compareIds.filter((id) => scenarios.some((s) => s.id === id));
    const list = (ids.length ? ids : scenarios.slice(0, 3).map((s) => s.id)).map((id) => scenarios.find((s) => s.id === id)!);
    return list.slice(0, 3);
  }, [compareIds, scenarios]);

  // the choice bar shrinks into a thin strip once the page scrolls past it
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { rootMargin: "-64px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [output]);

  // old links (/compare#table, #evidence, #weights …) jump to the matching chapter —
  // once when the page opens (not again every time the results are recomputed),
  // and whenever the hash itself changes
  const ready = !!output;
  const jumped = useRef(false);
  useEffect(() => {
    if (!ready) return;
    const go = () => {
      const hit = LEGACY[window.location.hash.replace("#", "")];
      if (!hit) return;
      if (hit.deep) setDeep(hit.deep);
      window.setTimeout(() => document.getElementById(hit.chapter)?.scrollIntoView({ behavior: "smooth", block: "start" }), 800);
    };
    if (!jumped.current) {
      jumped.current = true;
      go();
      // drop the hash so later re-renders or reloads don't pull the page back
      window.setTimeout(() => window.history.replaceState(null, "", window.location.pathname), 900);
    }
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, [ready]);

  if (!farm) return <NoFarmState />;
  if (!climate.data && !modelLoading) return <ClimateNotice climate={climate} />;
  if (!output) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-10 w-72" />
        <ClimateNotice climate={climate} />
        <Skeleton className="h-[480px] rounded-[2rem]" />
      </div>
    );
  }

  const years = output.years;
  const year = Math.min(Math.max(selectedYear, years[0]), years[years.length - 1]);
  const ti = years.indexOf(year);
  const reference = output.reference.years[ti];
  const res = (s: RotationScenario) => output.results[s.id]?.years[ti];
  const hasOverlap = (s: RotationScenario) => res(s)?.seasons.some((season) => season.overlap) ?? false;
  const ranked = chosen.filter((s) => !hasOverlap(s) && res(s)).sort((a, b) => (res(b)?.overallScore ?? 0) - (res(a)?.overallScore ?? 0));
  const overlapping = chosen.filter((s) => hasOverlap(s));
  const top = ranked[0];
  const selected = chosen.find((s) => s.id === activeId) ?? top ?? chosen[0];
  const openPlan = (id: string) => {
    setActive(id);
    router.push("/planner#calendar");
  };
  const idx = (s: RotationScenario) => scenarios.findIndex((x) => x.id === s.id);
  const excluded = (k: CriterionId) => res(chosen[0])?.criteriaScores[k] === null;
  const letter = (s: RotationScenario, i: number) => s.name.match(/^([A-Z0-9]+) ·/)?.[1] ?? String(i + 1);

  const toggleScenario = (id: string) => {
    const ids = chosen.map((s) => s.id);
    if (ids.includes(id)) {
      if (ids.length > 1) setCompareIds(ids.filter((x) => x !== id));
    } else setCompareIds([...ids, id].slice(-3));
  };

  /* ---------- chapter 1: podium + why the winner ---------- */
  const podium: PodiumPlan[] = ranked.map((s) => ({ scenario: s, result: res(s)!, color: scenarioColor(s, idx(s)), draft: !!drafts[s.id] }));

  const raw = (r: SimulationResult): Record<CriterionId, string> => ({
    soil: r.soilImprovementPotential ? `${L("soil carbon", "carbon đất")} ${num(r.soilImprovementPotential.socTCHa, 2)} t C/ha` : "—",
    water: `${num(r.waterDemand.median)} ${L("mm/year", "mm/năm")}`,
    drought: t(`stress.${r.waterRisk.level}`),
    income: r.economics ? `${num(r.economics.grossMargin, 1)} ${L("M VND/ha", "tr đ/ha")}` : L("no prices yet", "chưa có giá"),
    inputs: `${num(r.nitrogenNeed)} kg N/ha`,
    climate: `${num(r.cropSuitability.score)}/100`,
  });
  const bestTitle: Record<CriterionId, string> = {
    soil: L("Richest soil carbon", "Đất giàu carbon nhất"),
    water: L("Least irrigation water", "Ít nước tưới nhất"),
    drought: L("Lowest drought exposure", "Ít rủi ro hạn nhất"),
    income: L("Best income", "Thu nhập tốt nhất"),
    inputs: L("Lowest fertiliser need", "Ít phân đạm nhất"),
    climate: L("Best climate fit", "Hợp khí hậu nhất"),
  };
  const worstTitle: Record<CriterionId, string> = {
    soil: L("Weakest on soil carbon", "Yếu nhất về carbon đất"),
    water: L("Needs the most water", "Tốn nước nhất"),
    drought: L("Most drought exposure", "Dễ gặp hạn nhất"),
    income: L("Lowest income", "Thu nhập thấp nhất"),
    inputs: L("Needs the most fertiliser", "Tốn phân đạm nhất"),
    climate: L("Weakest climate fit", "Kém hợp khí hậu nhất"),
  };
  const why: { good: boolean; title: string; detail: string; k: CriterionId }[] = [];
  if (top && ranked.length > 1) {
    const tr = res(top)!;
    const margins = CRITERIA.map((k) => {
      const mine = tr.criteriaScores[k];
      const others = ranked.filter((s) => s.id !== top.id).map((s) => res(s)!.criteriaScores[k]).filter((v): v is number => v !== null);
      if (mine === null || !others.length) return { k, best: -Infinity, worst: -Infinity };
      return { k, best: mine - Math.max(...others), worst: Math.min(...others) - mine };
    });
    margins
      .filter((m) => m.best > 0.5)
      .sort((a, b) => weights[b.k] * b.best - weights[a.k] * a.best)
      .slice(0, 2)
      .forEach((m) => why.push({ good: true, k: m.k, title: bestTitle[m.k], detail: raw(tr)[m.k] }));
    const weak = margins.filter((m) => m.worst > 0.5).sort((a, b) => b.worst - a.worst)[0];
    if (weak) why.push({ good: false, k: weak.k, title: worstTitle[weak.k], detail: raw(tr)[weak.k] });
  }

  /* ---------- chapter 3: lanes ---------- */
  const lanes: LanePlan[] = chosen
    .filter((s) => res(s))
    .map((s, i) => ({ id: s.id, name: s.name, letter: letter(s, i), color: scenarioColor(s, idx(s)), scores: res(s)!.criteriaScores, raw: raw(res(s)!) }));

  /* ---------- chapter 4: table + evidence (same content as before) ---------- */
  const rows: Row[] = [
    { id: "water", label: L("Irrigation demand (mm/yr)", "Nhu cầu tưới (mm/năm)"), better: "lower", value: (r) => r.waterDemand.median, fmt: (v, r) => `${num(v)} (${num(r.waterDemand.p10)}–${num(r.waterDemand.p90)})` },
    { id: "stress", label: L("Water stress exposure", "Mức thiếu nước"), better: "lower", value: (r) => r.waterRisk.level, fmt: (_v, r) => <StressBadge level={r.waterRisk.level} /> },
    { id: "soil", label: `${t("rothc.title")} (t C/ha)`, better: "higher", value: (r) => r.soilImprovementPotential?.socTCHa ?? null, fmt: (_v, r) => <SoilCarbon result={r} reference={reference} compact /> },
    { id: "div", label: L("Rotation diversity (H′)", "Đa dạng luân canh (H′)"), better: "higher", value: (r) => r.rotationDiversity.shannon, fmt: (v) => num(v, 2) },
    { id: "suit", label: L("Climate suitability (0–100)", "Phù hợp khí hậu (0–100)"), better: "higher", value: (r) => r.cropSuitability.score, fmt: (v, r) => (
      <span className="inline-flex items-center gap-1.5">
        {num(v)} <SuitBadge cls={r.cropSuitability.cls} />
      </span>
    ) },
    { id: "n", label: L("Fertiliser N need (kg/ha/yr)", "Nhu cầu đạm (kg/ha/năm)"), better: "lower", value: (r) => r.nitrogenNeed, fmt: (v) => num(v) },
    { id: "gm", label: L("Gross margin (M VND/ha/yr)", "Lãi gộp (tr. đ/ha/năm)"), better: "higher", value: (r) => r.economics?.grossMargin ?? null, fmt: (v) => num(v, 1) },
    { id: "bare", label: L("Bare months under rain", "Số tháng đất trống"), better: "lower", value: (r) => r.bareSoil.index, fmt: (_v, r) => L(`${r.bareSoil.months} months`, `${r.bareSoil.months} tháng`) },
    { id: "pest", label: L("Pest-cycle breaks (3 yrs)", "Số lần cắt vòng sâu bệnh (3 năm)"), better: "higher", value: (r) => r.pestBreak.breaks, fmt: (v, r) => `${num(v)}/${r.pestBreak.transitions}` },
    { id: "score", label: L("Weighted score (0–100)", "Điểm tổng hợp (0–100)"), better: "higher", value: (r) => r.overallScore, fmt: (v) => <strong>{num(v)}</strong> },
  ];
  const extremes = (row: Row) => {
    const vals = chosen.map((s) => (res(s) ? row.value(res(s)!) : null));
    const valid = vals.filter((v): v is number => v !== null);
    if (valid.length < 2 || Math.max(...valid) - Math.min(...valid) < 1e-6) return { best: -1, worst: -1 };
    const pick = (fn: (a: number, b: number) => boolean) => vals.reduce<number>((bi, v, i) => (v !== null && (bi === -1 || fn(v, vals[bi]!)) ? i : bi), -1);
    const hi = pick((a, b) => a > b);
    const lo = pick((a, b) => a < b);
    return row.better === "higher" ? { best: hi, worst: lo } : { best: lo, worst: hi };
  };
  const evidenceFor = chosen.find((s) => s.id === evidenceId) ?? top ?? chosen[0];
  const evRes = evidenceFor ? res(evidenceFor) : undefined;
  const evCal = evRes && modelClimate ? buildCalendar({ result: evRes, farm, climate: modelClimate, assumption, custom: customClimate, extremes: daily.data }) : null;
  const evidence =
    evidenceFor && evRes && evCal && modelClimate
      ? buildEvidence({ scenario: evidenceFor, result: evRes, reference, farm, climate: modelClimate, extremes: daily.data, ndvi: ndvi.data, calendar: evCal, hasEconomics: !!evRes.economics })
      : null;

  const chapters = [
    { id: "ch-podium", label: L("Best fit", "Hợp nhất") },
    { id: "ch-priorities", label: L("Priorities", "Ưu tiên") },
    { id: "ch-race", label: L("Strengths", "Điểm mạnh, yếu") },
    { id: "ch-detail", label: L("Details", "Xem kỹ") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        image="earth-limb"
        icon={Scale}
        eyebrow={L("Compare plans", "So sánh cách trồng")}
        title={L("Same field, different plans", "Cùng thửa ruộng, nhiều cách trồng")}
        desc={L(`Up to three plans for ${farm.name}, same weather and assumptions.`, `Tối đa ba cách trồng cho ${farm.name}, cùng thời tiết và giả định.`)}
        actions={
          <button className={buttonClass("primary", "lg")} onClick={() => selected && openPlan(selected.id)} disabled={!selected}>
            {L("Open selected plan", "Mở kế hoạch đã chọn")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        }
        meta={<DataChips climate={climate} usesImerg={usesImerg} />}
      />
      <ClimateNotice climate={climate} />
      <ChapterDots chapters={chapters} />

      {/* CHOICE BAR: year + plans; sticks under the header as a thin strip */}
      <div ref={sentinel} aria-hidden className="h-0" />
      <div
        className={cn(
          "sticky top-16 z-30 -mx-1 rounded-2xl border bg-white/90 backdrop-blur-md transition-all duration-500 no-print",
          stuck ? "border-line px-3 py-2 shadow-[var(--shadow-float)]" : "border-line px-4 py-3.5 shadow-[var(--shadow-card)]",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className={cn("text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3 transition-all", stuck && "hidden sm:inline")}>{L("Year", "Năm")}</span>
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1" role="radiogroup" aria-label={L("Comparison year", "Năm so sánh")}>
              {years.map((y, i) => (
                <button
                  key={y}
                  role="radio"
                  aria-checked={y === year}
                  onClick={() => setYear(y)}
                  className={cn(
                    "shrink-0 rounded-full border font-semibold tabular transition-all duration-300",
                    stuck ? "h-8 px-2.5 text-xs" : "h-9 px-3.5 text-sm",
                    y === year ? "border-space-900 bg-space-900 text-white" : "border-line bg-white hover:border-lime",
                  )}
                >
                  {y}
                  {i === 0 && <span className="ml-1 text-[10px] font-medium opacity-80">{L("today", "nay")}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <span className={cn("text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3", stuck && "hidden sm:inline")}>{L("Plans", "Cách trồng")}</span>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1">
              {scenarios.map((s, i) => {
                const on = chosen.some((c) => c.id === s.id);
                return (
                  <button
                    key={s.id}
                    aria-pressed={on}
                    onClick={() => toggleScenario(s.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-full border pr-3 text-sm transition-all duration-300",
                      stuck ? "h-8 pl-0.5 text-xs" : "h-9 pl-1",
                      on ? "border-space-900 bg-space-900 font-semibold text-white" : "border-line bg-white text-ink-2 hover:border-lime",
                    )}
                  >
                    <span className={cn("relative overflow-hidden rounded-full ring-2", stuck ? "h-7 w-7" : "h-7 w-7")} style={{ ["--tw-ring-color" as string]: scenarioColor(s, i) }}>
                      <Image src={`/images/${PLAN_PHOTO[s.kind]}`} alt="" fill sizes="28px" className={cn("object-cover transition-all", !on && "grayscale")} />
                    </span>
                    {stuck ? letter(s, i) : s.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CHAPTER 1: which plan fits best? */}
      <Chapter id="ch-podium" n={1} dark title={L("Which plan fits best?", "Cách nào hợp nhất?")}>
        {podium.length === 0 ? (
          <p className="text-sm text-white/70">{L("No plan can be ranked yet.", "Chưa có cách trồng nào để xếp hạng.")}</p>
        ) : (
          <Reveal delay={120}>
            <Podium plans={podium} reference={reference} />
          </Reveal>
        )}
        {chosen.length < 2 && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" aria-hidden />
            {L("Add a plan to compare in the bar above", "Thêm cách trồng để so sánh ở thanh chọn phía trên")}
          </p>
        )}
        {overlapping.length > 0 && (
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-risk/15 px-4 py-3 text-sm text-white">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#f0a49c]" aria-hidden />
            {L(
              `${overlapping.map((s) => s.name).join(", ")}: crops overlap — adjust planting dates before ranking.`,
              `${overlapping.map((s) => s.name).join(", ")}: các vụ chồng lấn — chỉnh tháng gieo trước khi xếp hạng.`,
            )}
          </p>
        )}

        {top && (
          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <Reveal delay={200}>
              <p className="text-sm font-semibold text-white/80">
                {L(`Why ${top.name} comes first`, `Vì sao ${top.name} đứng đầu`)}
              </p>
              {why.length > 0 ? (
                <ul className="mt-3 grid gap-2.5 sm:grid-cols-3">
                  {why.map((w, i) => {
                    const Icon = CRIT_ICON[w.k];
                    return (
                      <li key={w.title} style={{ animationDelay: `${300 + i * 100}ms` }} className="anim-rise flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-3 backdrop-blur">
                        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", w.good ? "bg-lime/20 text-lime-bright" : "bg-risk/25 text-[#f0a49c]")}>
                          <Icon className="h-[18px] w-[18px]" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 text-sm font-bold leading-tight">
                            {w.good ? <TrendingUp className="h-3.5 w-3.5 text-lime-bright" aria-hidden /> : <TrendingDown className="h-3.5 w-3.5 text-[#f0a49c]" aria-hidden />}
                            {w.title}
                          </span>
                          <span className="block text-xs text-white/65">{w.detail}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-white/65">{L("Most balanced under your priorities.", "Cân bằng nhất theo ưu tiên của bạn.")}</p>
              )}
              <p className="mt-3 text-[11px] text-white/55">
                {L("First under your priorities, year and weather — not the only right answer.", "Đứng đầu theo ưu tiên, năm và thời tiết bạn chọn — không phải lựa chọn duy nhất đúng.")}
              </p>
            </Reveal>
            <Reveal delay={350} className="flex flex-col items-start gap-2 lg:items-end">
              <button className={buttonClass("primary", "lg")} onClick={() => openPlan(top.id)}>
                {L(`Plan ${top.name}`, `Lập lịch cho ${top.name}`)}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              <span className="flex flex-wrap gap-x-3 text-xs text-white/60">
                {ranked.slice(1).map((s) => (
                  <button key={s.id} type="button" onClick={() => openPlan(s.id)} className="underline-offset-2 hover:text-white hover:underline">
                    {L(`or plan ${s.name}`, `hoặc lập lịch ${s.name}`)}
                  </button>
                ))}
              </span>
            </Reveal>
          </div>
        )}
      </Chapter>

      {/* CHAPTER 2: what matters to you? */}
      <Chapter
        id="ch-priorities"
        n={2}
        title={L("What matters to you?", "Bạn coi trọng điều gì?")}
        right={
          <Reveal delay={150} className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-ink-2">{L("Ranking now", "Thứ hạng hiện tại")}:</span>
            {ranked.map((s, i) => (
              <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-sand px-2.5 py-1 font-semibold transition-all duration-500">
                <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-extrabold text-white" style={{ background: scenarioColor(s, idx(s)) }}>
                  {i + 1}
                </span>
                {s.name}
              </span>
            ))}
          </Reveal>
        }
      >
        <PriorityTiles
          weights={weights}
          excluded={excluded}
          onChange={setWeight}
          onReset={resetWeights}
          done={
            <button
              type="button"
              onClick={() => document.getElementById("ch-podium")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className={buttonClass("dark", "lg", "group")}
            >
              <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden />
              {L("See the new ranking", "Xem thứ hạng mới")}
              {top && <span className="rounded-full bg-lime px-2 py-0.5 text-xs font-bold text-space-900">1 · {top.name}</span>}
            </button>
          }
        />
      </Chapter>

      {/* CHAPTER 3: where is each plan strong or weak? */}
      <Chapter id="ch-race" n={3} dark title={L("Strengths and weaknesses of each plan", "Điểm mạnh, điểm yếu của từng cách trồng")}>
        <RaceLanes plans={lanes} today={reference.criteriaScores} weights={weights} />
      </Chapter>

      {/* CHAPTER 4: look closer */}
      <Chapter id="ch-detail" n={4} title={L("Want a closer look?", "Muốn xem kỹ?")}>
        <div className="grid gap-3 md:grid-cols-2">
          {(
            [
              { id: "table", icon: Table2, title: L("Detailed table", "Bảng chi tiết"), hint: L("10 measures side by side · ✓ best, ! weakest", "10 chỉ số cạnh nhau · ✓ tốt nhất, ! yếu nhất") },
              { id: "evidence", icon: FileSearch, title: L("Evidence & questions", "Bằng chứng & câu hỏi"), hint: L("What supports each plan, what to check locally", "Điều gì ủng hộ từng cách, cần hỏi gì ở địa phương") },
            ] as const
          ).map((c, i) => {
            const on = deep === c.id;
            return (
              <Reveal key={c.id} delay={i * 100}>
                <button
                  type="button"
                  onClick={() => setDeep(on ? null : c.id)}
                  aria-expanded={on}
                  className={cn(
                    "lift group flex w-full items-center gap-4 rounded-3xl border p-5 text-left hover:-translate-y-0.5 md:p-6",
                    on ? "border-space-900 bg-space-900 text-white shadow-[var(--shadow-float)]" : "border-line bg-sand/60 hover:border-lime hover:bg-white hover:shadow-[var(--shadow-float)]",
                  )}
                >
                  <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-full", on ? "border border-lime/50 text-lime-bright" : "bg-space-900 text-lime-bright")}>
                    <c.icon className="h-6 w-6" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="title-caps block text-lg font-extrabold md:text-xl">{c.title}</span>
                    <span className={cn("mt-0.5 block text-xs", on ? "text-white/70" : "text-ink-2")}>{c.hint}</span>
                  </span>
                  <ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform duration-500", on && "rotate-180")} aria-hidden />
                </button>
              </Reveal>
            );
          })}
        </div>

        {deep === "table" && (
          <div className="anim-rise mt-5 rounded-3xl border border-line bg-white">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-4">
              <h3 className="text-base font-bold">{L("Scenario comparison table", "Bảng so sánh kịch bản")}</h3>
              <p className="flex items-center gap-3 text-xs text-ink-2">
                {year}
                <span className="inline-flex items-center gap-1">
                  <span className="rounded bg-lime-ink px-1 text-[10px] font-bold text-white">✓</span> {L("strongest", "tốt nhất")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="rounded bg-risk-ink px-1 text-[10px] font-bold text-white">!</span> {L("weakest", "yếu nhất")}
                </span>
              </p>
            </div>
            <div className="overflow-x-auto px-2 pb-3 pt-2 md:overflow-visible">
              <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="text-left">
                    <th scope="col" className="sticky left-0 z-20 bg-white px-3 py-2.5 text-xs font-semibold text-ink-2 md:top-[8.25rem]">
                      {L("Metric", "Chỉ số")}
                    </th>
                    {chosen.map((s) => (
                      <th key={s.id} scope="col" className="z-10 bg-white px-3 py-2.5 text-xs font-semibold md:sticky md:top-[8.25rem]">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: scenarioColor(s, idx(s)) }} aria-hidden />
                          {s.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const ex = extremes(row);
                    return (
                      <tr key={row.id} className="group">
                        <th scope="row" className="sticky left-0 z-10 border-t border-line bg-white px-3 py-3 text-left text-xs font-medium text-ink-2 group-hover:bg-sand">
                          {row.label}
                        </th>
                        {chosen.map((s, i) => {
                          const r = res(s)!;
                          const v = row.value(r);
                          return (
                            <td
                              key={s.id}
                              className={cn(
                                "border-t border-line px-3 py-3 tabular transition-colors group-hover:bg-sand/60",
                                ex.best === i && "bg-lime-soft group-hover:bg-lime-soft",
                                ex.worst === i && "bg-risk-soft/70 group-hover:bg-risk-soft",
                              )}
                            >
                              <span className="flex items-center gap-1.5">
                                {v === null ? <span className="text-ink-3">{t("status.unavailable")}</span> : row.fmt(v, r)}
                                {ex.best === i && (
                                  <span className="rounded bg-lime-ink px-1 text-[10px] font-bold text-white" title={L("Strongest", "Tốt nhất")}>
                                    ✓ <span className="sr-only">{L("strongest", "tốt nhất")}</span>
                                  </span>
                                )}
                                {ex.worst === i && (
                                  <span className="rounded bg-risk-ink px-1 text-[10px] font-bold text-white" title={L("Weakest", "Yếu nhất")}>
                                    ! <span className="sr-only">{L("weakest", "yếu nhất")}</span>
                                  </span>
                                )}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="px-5 pb-4 text-[11px] leading-relaxed text-ink-2">
              {t("rothc.title")}: {t("rothc.depthSource")}. {t("rothc.compactLimit")}
            </p>
          </div>
        )}

        {deep === "evidence" && (
          <div className="anim-rise mt-5">
            <div className="mb-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label={L("Plan", "Cách trồng")}>
              {chosen.map((s) => (
                <button
                  key={s.id}
                  role="radio"
                  aria-checked={evidenceFor?.id === s.id}
                  onClick={() => setEvidenceId(s.id)}
                  className={cn("flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors", evidenceFor?.id === s.id ? "border-transparent bg-space-900 text-white" : "border-line bg-white hover:border-lime")}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: scenarioColor(s, idx(s)) }} aria-hidden />
                  {s.name}
                </button>
              ))}
            </div>
            {evidence ? <EvidencePanel evidence={evidence} title={`${evidenceFor?.name} · ${farm.name}`} /> : <Skeleton className="h-64" />}
          </div>
        )}
      </Chapter>

      <p className="text-xs text-ink-3">
        {L("Scores use the same engine results as every other view.", "Điểm dùng cùng kết quả mô hình với mọi màn hình khác.")}{" "}
        <Link href="/simulator" className="font-semibold underline-offset-2 hover:underline">
          {L("Back to the simulator", "Về trang Mô phỏng")}
        </Link>
      </p>
    </div>
  );
}
