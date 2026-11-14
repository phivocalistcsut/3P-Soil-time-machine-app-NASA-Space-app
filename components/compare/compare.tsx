"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Award, BarChart3, ChevronDown, FileSearch, LayoutGrid, RotateCcw, Scale, Table2, TrendingDown, TrendingUp, AlertTriangle, CircleHelp } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { useEngine, useScenarios } from "@/lib/hooks";
import { buildCalendar, buildEvidence } from "@/lib/engine/insights";
import { EvidencePanel } from "@/components/insights";
import { PageHeader, SectionPanel, SectionTabs, Strip, useSection } from "@/components/ui/sections";
import { SEASON_ORDER } from "@/lib/data/crops";
import type { CriterionId, RotationScenario, SimulationResult } from "@/lib/types";
import { SoilCarbon } from "@/components/sim/soil-carbon";
import { AXIS, ChartFrame, ChartTooltip, GRID } from "@/components/charts";
import { ClimateNotice, DataChips, CropIcon, NoFarmState, scenarioColor, StatusBadge, StressBadge, SuitBadge } from "@/components/common";
import { Badge, Button, Card, CardHeader, Skeleton, buttonClass, cn } from "@/components/ui/primitives";
import { InfoTip, Slider } from "@/components/ui/overlays";

const CRITERIA: CriterionId[] = ["soil", "water", "drought", "income", "inputs", "climate"];
const DASHES = ["", "6 3", "2 3"];

type Row = {
  id: string;
  label: string;
  better: "higher" | "lower";
  value: (r: SimulationResult) => number | null;
  fmt: (v: number, r: SimulationResult) => React.ReactNode;
};

export function Compare() {
  const { L, t, num, crop, cropShort, season } = useI18n();
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
  const [shown, setShown] = useState<CriterionId[]>(CRITERIA);
  const [openDetail, setOpenDetail] = useState<string | null>(null);
  const [section, setSection] = useSection("compare", ["cards", "weights", "charts", "table", "evidence", "why"], "cards");
  const [evidenceId, setEvidenceId] = useState<string | null>(null);

  const chosen: RotationScenario[] = useMemo(() => {
    const ids = compareIds.filter((id) => scenarios.some((s) => s.id === id));
    const list = (ids.length ? ids : scenarios.slice(0, 3).map((s) => s.id)).map((id) => scenarios.find((s) => s.id === id)!);
    return list.slice(0, 3);
  }, [compareIds, scenarios]);

  if (!farm) return <NoFarmState />;
  if (!climate.data && !modelLoading) return <ClimateNotice climate={climate} />;
  if (!output) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-10 w-72" />
        <ClimateNotice climate={climate} />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  const years = output.years;
  const year = Math.min(Math.max(selectedYear, years[0]), years[years.length - 1]);
  const ti = years.indexOf(year);
  const res = (s: RotationScenario) => output.results[s.id]?.years[ti];
  const hasOverlap = (s: RotationScenario) => res(s)?.seasons.some((season) => season.overlap) ?? false;
  const ranked = chosen.filter((s) => !hasOverlap(s)).sort((a, b) => (res(b)?.overallScore ?? 0) - (res(a)?.overallScore ?? 0));
  const top = ranked[0];
  const selected = chosen.find((s) => s.id === activeId) ?? top ?? chosen[0];
  const openPlan = (id: string) => {
    setActive(id);
    router.push("/planner#calendar");
  };
  const wSum = CRITERIA.reduce((s, k) => s + (res(chosen[0])?.criteriaScores[k] === null ? 0 : weights[k]), 0);
  const idx = (s: RotationScenario) => scenarios.findIndex((x) => x.id === s.id);

  const rows: Row[] = [
    { id: "water", label: L("Irrigation demand (mm/yr)", "Nhu cầu tưới (mm/năm)"), better: "lower", value: (r) => r.waterDemand.median, fmt: (v, r) => `${num(v)} (${num(r.waterDemand.p10)}–${num(r.waterDemand.p90)})` },
    { id: "stress", label: L("Water stress exposure", "Mức thiếu nước"), better: "lower", value: (r) => r.waterRisk.level, fmt: (_v, r) => <StressBadge level={r.waterRisk.level} /> },
    { id: "soil", label: `${t("rothc.title")} (t C/ha)`, better: "higher", value: (r) => r.soilImprovementPotential?.socTCHa ?? null, fmt: (_v, r) => <SoilCarbon result={r} compact /> },
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

  const barData = shown.map((k) => {
    const row: Record<string, string | number | null> = { name: t(`crit.${k}.short`) };
    chosen.forEach((s) => (row[s.id] = res(s)?.criteriaScores[k] ?? null));
    return row;
  });
  const lineData = years.map((y, i) => {
    const row: Record<string, number> = { year: y };
    chosen.forEach((s) => (row[s.id] = output.results[s.id]?.years[i]?.overallScore ?? 0));
    row.ref = output.reference.years[i].overallScore;
    return row;
  });

  const tradeoffs = (s: RotationScenario) => {
    const r = res(s)!;
    const b = output.reference.years[ti];
    const out: { good: boolean; text: string }[] = [];
    const dW = r.waterDemand.median - b.waterDemand.median;
    if (Math.abs(dW) > 15) out.push({ good: dW < 0, text: L(`${dW < 0 ? "Uses" : "Needs"} ${num(Math.abs(dW))} mm ${dW < 0 ? "less" : "more"} irrigation than current practice`, `${dW < 0 ? "Tiết kiệm" : "Cần thêm"} ${num(Math.abs(dW))} mm nước tưới so với hiện tại`) });
    const dS = r.soilImprovementPotential && b.soilImprovementPotential ? r.soilImprovementPotential.socTCHa - b.soilImprovementPotential.socTCHa : 0;
    if (Math.abs(dS) >= 0.005) out.push({ good: dS > 0, text: t("rothc.tradeoff", { delta: (dS > 0 ? "+" : "−") + num(Math.abs(dS), 2) }) });
    const dN = r.nitrogenNeed - b.nitrogenNeed;
    if (Math.abs(dN) > 5) out.push({ good: dN < 0, text: L(`${num(Math.abs(dN))} kg/ha ${dN < 0 ? "less" : "more"} fertiliser N`, `${dN < 0 ? "Bớt" : "Thêm"} ${num(Math.abs(dN))} kg/ha phân đạm`) });
    const dC = r.cropSuitability.score - b.cropSuitability.score;
    if (Math.abs(dC) > 3) out.push({ good: dC > 0, text: L(`Climate fit ${dC > 0 ? "+" : "−"}${num(Math.abs(dC))} points (${dC < 0 ? "upland crops face tougher conditions" : "better matched crops"})`, `Phù hợp khí hậu ${dC > 0 ? "+" : "−"}${num(Math.abs(dC))} điểm (${dC < 0 ? "cây màu gặp điều kiện khó hơn" : "cây trồng phù hợp hơn"})`) });
    const riceSeasons = r.seasons.filter((x) => x.cropId === "rice").length;
    const refRice = b.seasons.filter((x) => x.cropId === "rice").length;
    if (riceSeasons < refRice) out.push({ good: false, text: L(`${refRice - riceSeasons} fewer rice season(s) this year — check markets for the replacement crop`, `Ít hơn ${refRice - riceSeasons} vụ lúa năm nay — cần xem thị trường cho cây thay thế`) });
    return out;
  };

  const risks = (s: RotationScenario) => {
    const set = new Map<string, string[]>();
    res(s)?.seasons.forEach((se) => se.risks.forEach((k) => set.set(k, [...(set.get(k) ?? []), season(se.season)])));
    return [...set.entries()];
  };

  const evidenceFor = chosen.find((s) => s.id === evidenceId) ?? top ?? chosen[0];
  const evRes = evidenceFor ? res(evidenceFor) : undefined;
  const evCal = evRes && modelClimate ? buildCalendar({ result: evRes, farm, climate: modelClimate, assumption, custom: customClimate, extremes: daily.data }) : null;
  const evidence =
    evidenceFor && evRes && evCal && modelClimate
      ? buildEvidence({ scenario: evidenceFor, result: evRes, reference: output.reference.years[ti], farm, climate: modelClimate, extremes: daily.data, ndvi: ndvi.data, calendar: evCal, hasEconomics: !!evRes.economics })
      : null;
  const tabs = [
    { id: "cards", icon: LayoutGrid, label: L("Plans side by side", "Đặt cạnh nhau"), hint: L("Score, crops, tradeoffs", "Điểm, cây trồng, đánh đổi"), tone: "amber" as const },
    { id: "weights", icon: Scale, label: L("Your priorities", "Ưu tiên của bạn"), hint: L("Change weights, see ranking", "Đổi trọng số, xem thứ hạng"), tone: "earth" as const },
    { id: "charts", icon: BarChart3, label: L("Charts", "Biểu đồ"), hint: L("Scores by topic and year", "Điểm theo tiêu chí và năm"), tone: "blue" as const },
    { id: "table", icon: Table2, label: L("Detailed table", "Bảng chi tiết"), hint: L("Best ✓ and weakest !", "Tốt nhất ✓, yếu nhất !"), tone: "teal" as const },
    { id: "evidence", icon: FileSearch, label: L("Evidence & questions", "Bằng chứng & câu hỏi"), hint: L("What to check locally", "Cần hỏi gì ở địa phương"), tone: "violet" as const },
    { id: "why", icon: CircleHelp, label: L("Why the top plan?", "Vì sao đứng đầu?"), hint: L("Benefits, tradeoffs, risks", "Lợi ích, đánh đổi, rủi ro"), tone: "green" as const },
  ];

  const toggleScenario = (id: string) => {
    const ids = chosen.map((s) => s.id);
    if (ids.includes(id)) {
      if (ids.length > 1) setCompareIds(ids.filter((x) => x !== id));
    }
    else setCompareIds([...ids, id].slice(-3));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        image="earth-limb"
        icon={Scale}
        eyebrow={L("Compare plans", "So sánh cách trồng")}
        title={L("Same field, different plans", "Cùng thửa ruộng, nhiều cách trồng")}
        desc={L(`Up to three plans for ${farm.name}, with the same weather and assumptions.`, `Tối đa ba cách trồng cho ${farm.name}, cùng thời tiết và giả định.`)}
        actions={
          <button
            className={buttonClass("primary", "lg")}
            onClick={() => selected && openPlan(selected.id)}
            disabled={!selected}
          >
            {L("Open selected plan", "Mở kế hoạch đã chọn")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        }
        meta={<DataChips climate={climate} usesImerg={usesImerg} />}
      />
      <ClimateNotice climate={climate} />

      {/* controls */}
      <Card className="p-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-2">{L("Comparison year", "Năm so sánh")}</p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={L("Comparison year", "Năm so sánh")}>
            {years.map((y, i) => (
              <button
                key={y}
                role="radio"
                aria-checked={y === year}
                onClick={() => setYear(y)}
                className={cn("h-9 rounded-full border px-3.5 text-sm font-semibold tabular", y === year ? "border-space-900 bg-space-900 text-white" : "border-line bg-white hover:border-lime")}
              >
                {y}
                {i === 0 && <span className="ml-1 text-[10px] font-medium opacity-80">{L("today", "nay")}</span>}
              </button>
            ))}
          </div>
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-2">{L("Scenarios (max 3)", "Kịch bản (tối đa 3)")}</p>
          <div className="flex flex-wrap gap-1.5">
            {scenarios.map((s, i) => {
              const on = chosen.some((c) => c.id === s.id);
              return (
                <button key={s.id} aria-pressed={on} onClick={() => toggleScenario(s.id)} className={cn("flex h-9 items-center gap-2 rounded-full border px-3 text-sm", on ? "border-lime-ink bg-lime-soft font-semibold" : "border-line bg-white text-ink-2")}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: scenarioColor(s, i) }} aria-hidden />
                  {s.name}
                </button>
              );
            })}
          </div>
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-2">{L("Metrics shown in charts", "Chỉ số hiển thị trên biểu đồ")}</p>
          <div className="flex flex-wrap gap-1.5">
            {CRITERIA.map((k) => (
              <label key={k} className={cn("flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs", shown.includes(k) ? "border-lime-ink bg-white font-semibold" : "border-line text-ink-3")}>
                <input type="checkbox" className="h-3.5 w-3.5 accent-lime-ink" checked={shown.includes(k)} onChange={() => setShown((x) => (x.includes(k) ? x.filter((y) => y !== k) : CRITERIA.filter((c) => [...x, k].includes(c))))} />
                {t(`crit.${k}.short`)}
              </label>
            ))}
          </div>
        </div>
      </Card>

      <SectionTabs tabs={tabs} value={section} onChange={setSection} label={L("Comparison topics", "Chủ đề so sánh")} />

      <SectionPanel id="cards" active={section === "cards"}>
      {/* scenario cards */}
      {/* current practice: the baseline every plan is measured against */}
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-dashed border-ink-3/50 bg-white px-5 py-4">
        <div className="min-w-0">
          <p className="eyebrow text-ink-2">{L("Current practice", "Cách đang trồng")}</p>
          <p className="mt-1 text-sm font-semibold">{output.reference.years[ti].seasons.map((s) => crop(s.cropId)).join(" · ")}</p>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="text-xs text-ink-2">{L("Irrigation", "Tưới")}</dt>
            <dd className="font-display font-bold tabular">{num(output.reference.years[ti].waterDemand.median)} mm</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-2">{L("Score", "Điểm")}</dt>
            <dd className="font-display font-bold tabular">{num(output.reference.years[ti].overallScore)} / 100</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-2">{t("rothc.title")}</dt>
            <dd className="font-display font-bold tabular">
              {output.reference.years[ti].soilImprovementPotential ? `${num(output.reference.years[ti].soilImprovementPotential!.socTCHa, 2)} t C/ha` : t("status.unavailable")}
            </dd>
          </div>
        </dl>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {chosen.map((s) => {
          const r = res(s);
          if (!r) return null;
          const color = scenarioColor(s, idx(s));
          const isTop = s.id === top?.id && chosen.length > 1;
          return (
            <Card key={s.id} className={cn("flex flex-col overflow-hidden", isTop && "border-lime ring-2 ring-lime")}>
              <div className="h-1.5" style={{ background: color }} aria-hidden />
              <div className="flex items-start justify-between gap-2 px-5 pt-4">
                <div>
                  <h2 className="text-base font-bold">{s.name}</h2>
                  {hasOverlap(s) && <p className="mt-1 text-xs font-semibold text-risk-ink">{L("Crops overlap. Adjust planting dates before comparing this plan.", "Các vụ chồng lấn. Chỉnh tháng gieo trước khi so sánh phương án này.")}</p>}
                  {s.id === activeId && <Badge tone="green" className="mr-1 mt-1">{L("Selected plan", "Cách trồng đang chọn")}</Badge>}
                  {drafts[s.id] && <Badge tone="amber" className="mt-1">{L("Unsaved preview", "Bản xem trước chưa lưu")}</Badge>}
                  {isTop && (
                    <Badge tone="dark" className="mt-1">
                      <Award className="h-3 w-3" aria-hidden />
                      {L("Highest score with your weights", "Điểm cao nhất theo trọng số của bạn")}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-display text-3xl font-extrabold tabular" style={{ color }}>
                    {num(r.overallScore)}
                  </p>
                  <p className="text-[10px] text-ink-3">/100 · {year}</p>
                </div>
              </div>
              {/* crop calendar */}
              <div className="mx-5 mt-3 rounded-xl border border-line p-2">
                {Array.from({ length: s.cycleYears }, (_, yi) => (
                  <div key={yi} className="flex items-center gap-1.5 py-0.5">
                    <span className="w-12 text-[10px] font-semibold text-ink-3">{L(`Yr ${yi + 1}`, `Năm ${yi + 1}`)}</span>
                    {SEASON_ORDER.map((se) => {
                      const id = s.seasonalCropSequence.find((x) => x.yearIndex === yi && x.season === se)?.cropId ?? null;
                      return (
                        <span key={se} className="flex flex-1 items-center gap-1 truncate rounded-md bg-sand px-1.5 py-1 text-[10.5px] font-medium" title={`${season(se)}: ${crop(id)}`}>
                          <CropIcon cropId={id} size={16} className="rounded" />
                          <span className="truncate">{cropShort(id)}</span>
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
              <dl className="mx-5 mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-water-soft p-2">
                  <dt className="text-water-ink">{L("Irrigation", "Tưới")}</dt>
                  <dd className="font-display text-lg font-bold tabular">
                    {num(r.waterDemand.median)} <span className="text-[10px] font-medium">mm</span>
                  </dd>
                </div>
                <div className="rounded-lg bg-sand p-2">
                  <dt className="mb-1 text-ink-2">{L("Climate fit", "Phù hợp khí hậu")}</dt>
                  <dd>
                    <SuitBadge cls={r.cropSuitability.cls} /> <span className="font-semibold tabular">{num(r.cropSuitability.score)}</span>
                  </dd>
                </div>
                <div className="rounded-lg bg-sand p-2">
                  <dt className="mb-1 text-ink-2">{L("Water stress", "Thiếu nước")}</dt>
                  <dd>
                    <StressBadge level={r.waterRisk.level} />
                  </dd>
                </div>
                <div className="col-span-3 rounded-lg bg-lime-soft p-2">
                  <dt className="mb-1 text-lime-ink">{t("rothc.title")}</dt>
                  <dd>
                    <SoilCarbon result={r} compact notes={false} />
                  </dd>
                </div>
              </dl>
              <div className="mx-5 mt-3">
                <p className="text-xs font-semibold">{L("Main tradeoffs vs current practice", "Đánh đổi chính so với hiện tại")}</p>
                <ul className="mt-1 space-y-1">
                  {tradeoffs(s).length === 0 && <li className="text-xs text-ink-2">{L("Same as current practice in this year.", "Giống canh tác hiện tại trong năm này.")}</li>}
                  {tradeoffs(s).map((x, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs">
                      {x.good ? <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-leaf-ink" aria-hidden /> : <TrendingDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-risk-ink" aria-hidden />}
                      <span>
                        <span className="sr-only">{x.good ? L("Benefit: ", "Lợi ích: ") : L("Cost: ", "Bất lợi: ")}</span>
                        {x.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mx-5 mt-3">
                <p className="text-xs font-semibold">{L("Key risks", "Rủi ro chính")}</p>
                <ul className="mt-1 space-y-1">
                  {risks(s).length === 0 && <li className="text-xs text-ink-2">{L("No specific risk flags under these assumptions.", "Không có cảnh báo rủi ro cụ thể theo giả định này.")}</li>}
                  {risks(s).map(([k, ss]) => (
                    <li key={k} className="flex items-start gap-1.5 text-xs">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-ink" aria-hidden />
                      {t(k)} <span className="text-ink-3">({[...new Set(ss)].join(", ")})</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto px-5 pb-4 pt-3">
                <Button className="mb-2 w-full" variant="secondary" onClick={() => openPlan(s.id)}>
                  {L("Plan this rotation", "Lập lịch cho cách trồng này")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
                <button
                  onClick={() => setOpenDetail(openDetail === s.id ? null : s.id)}
                  aria-expanded={openDetail === s.id}
                  className="flex w-full items-center justify-between rounded-lg bg-sand px-3 py-2 text-xs font-semibold hover:bg-sand-2"
                >
                  {L("How the score is built", "Điểm được tính thế nào")}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", openDetail === s.id && "rotate-180")} aria-hidden />
                </button>
                {openDetail === s.id && (
                  <table className="mt-2 w-full text-[11px] tabular animate-fade-in">
                    <thead>
                      <tr className="text-left text-ink-3">
                        <th className="py-1 font-medium">{L("Criterion", "Tiêu chí")}</th>
                        <th className="py-1 text-right font-medium">{L("Score", "Điểm")}</th>
                        <th className="py-1 text-right font-medium">{L("Weight", "Trọng số")}</th>
                        <th className="py-1 text-right font-medium">{L("Points", "Đóng góp")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CRITERIA.map((k) => {
                        const sc = r.criteriaScores[k];
                        return (
                          <tr key={k} className="border-t border-line">
                            <td className="py-1">{t(`crit.${k}.short`)}</td>
                            <td className="py-1 text-right">{sc === null ? "—" : num(sc)}</td>
                            <td className="py-1 text-right">{sc === null || wSum === 0 ? "—" : `${num((weights[k] / wSum) * 100)}%`}</td>
                            <td className="py-1 text-right font-semibold">{sc === null ? "—" : num(r.contributions[k], 1)}</td>
                          </tr>
                        );
                      })}
                      <tr className="border-t-2 border-ink/20 font-bold">
                        <td className="py-1">{L("Total", "Tổng")}</td>
                        <td />
                        <td />
                        <td className="py-1 text-right">{num(r.overallScore, 1)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-2">
        {t("rothc.title")}: {t("rothc.depthSource")}. {t("rothc.compactLimit")}
      </p>
      </SectionPanel>

      <SectionPanel id="weights" active={section === "weights"}>
        <Strip tone="amber" icon={Scale} title={L("What matters most to you?", "Bạn coi trọng điều gì nhất?")} desc={L("Move a slider and the ranking updates at once", "Kéo thanh trượt, thứ hạng cập nhật ngay")} />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Scale className="h-4 w-4 text-forest" aria-hidden />
              {L("Your priority weights", "Trọng số ưu tiên của bạn")}
              <InfoTip>
                {L(
                  "Weighted sum: score = Σ(weight × criterion score) ÷ Σ weights. Criteria without data (e.g. income without prices) are excluded and the rest re-normalised.",
                  "Tổng có trọng số: điểm = Σ(trọng số × điểm tiêu chí) ÷ Σ trọng số. Tiêu chí thiếu dữ liệu (vd. thu nhập khi chưa có giá) bị loại và phần còn lại được chuẩn hóa lại.",
                )}
              </InfoTip>
            </p>
            <Button variant="ghost" size="sm" onClick={resetWeights}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              {L("Reset", "Đặt lại")}
            </Button>
          </div>
          <div className="mt-3 space-y-2.5">
            {CRITERIA.map((k) => {
              const excluded = res(chosen[0])?.criteriaScores[k] === null;
              const pct = !excluded && wSum > 0 ? (weights[k] / wSum) * 100 : 0;
              return (
                <div key={k} className={cn("grid grid-cols-[1fr_120px_56px] items-center gap-3", excluded && "opacity-60")}>
                  <span className="text-xs font-medium">
                    {t(`crit.${k}`)}
                    {excluded && <span className="block text-[10px] font-normal text-ink-3">{L("no data — not scored", "thiếu dữ liệu — không chấm")}</span>}
                  </span>
                  <Slider value={weights[k]} min={0} max={5} onValueChange={(v) => setWeight(k, v)} label={t(`crit.${k}`)} valueText={`${weights[k]} / 5`} />
                  <span className="text-right text-xs tabular">
                    <strong>{weights[k]}</strong>/5 · {num(pct)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
          <div className="space-y-2">
            {ranked.map((s, i) => {
              const r = res(s);
              if (!r) return null;
              return (
                <div key={s.id} className={cn("flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-line", i === 0 && "ring-2 ring-[#B7791F]")}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full font-display text-base font-extrabold text-white" style={{ background: scenarioColor(s, idx(s)) }}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{s.name}</p>
                    <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-sand-2" aria-hidden>
                      {CRITERIA.map((k) => (
                        <span key={k} className="h-full" style={{ width: `${r.contributions[k]}%`, background: scenarioColor(s, idx(s)), opacity: 0.35 + 0.1 * CRITERIA.indexOf(k) }} />
                      ))}
                    </div>
                  </div>
                  <span className="font-display text-xl font-extrabold tabular">{num(r.overallScore)}</span>
                </div>
              );
            })}
            <p className="px-1 text-[11px] text-ink-2">
              {L("Highest score under your weights only — not a guaranteed best choice.", "Điểm cao nhất chỉ theo trọng số của bạn — không phải lựa chọn tốt nhất được bảo đảm.")}
            </p>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel id="charts" active={section === "charts"}>
      {/* charts */}
      <div className="space-y-4">
        <Card>
          <CardHeader title={L("Criterion scores", "Điểm theo tiêu chí")} subtitle={L(`0–100, higher is better · ${year}`, `0–100, càng cao càng tốt · ${year}`)} actions={<StatusBadge status={output.climateStatus} withTip={false} />} />
          <div className="px-4 pb-4 pt-3">
            <ChartFrame
              height={260}
              summary={L("Grouped bars: each criterion score for each compared scenario.", "Cột nhóm: điểm từng tiêu chí của các kịch bản so sánh.")}
              table={{ head: [L("Criterion", "Tiêu chí"), ...chosen.map((s) => s.name)], rows: barData.map((d) => [d.name as string, ...chosen.map((s) => (d[s.id] === null ? "—" : num(d[s.id] as number)))]) }}
            >
              <BarChart data={barData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }} barGap={2} barCategoryGap="22%">
                <CartesianGrid {...GRID} />
                <XAxis dataKey="name" {...AXIS} interval={0} tick={{ ...AXIS.tick, fontSize: 10.5 }} />
                <YAxis {...AXIS} domain={[0, 100]} width={44} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F2F4EF" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconSize={9} />
                {chosen.map((s) => (
                  <Bar key={s.id} dataKey={s.id} name={s.name} fill={scenarioColor(s, idx(s))} radius={[4, 4, 0, 0]} maxBarSize={22} animationDuration={300} />
                ))}
              </BarChart>
            </ChartFrame>
          </div>
        </Card>
        <Card>
          <CardHeader title={L("Weighted score over time", "Điểm tổng hợp theo thời gian")} subtitle={L("Recomputed instantly when you change weights", "Tính lại ngay khi bạn đổi trọng số")} actions={<StatusBadge status={output.climateStatus} withTip={false} />} />
          <div className="px-4 pb-4 pt-3">
            <ChartFrame
              height={260}
              summary={L("Lines: weighted score per year for each scenario and current practice.", "Đường: điểm tổng hợp mỗi năm của từng kịch bản và canh tác hiện tại.")}
              table={{ head: [L("Year", "Năm"), L("Current practice", "Hiện tại"), ...chosen.map((s) => s.name)], rows: lineData.map((d) => [d.year, num(d.ref), ...chosen.map((s) => num(d[s.id]))]) }}
            >
              <LineChart data={lineData} margin={{ top: 10, right: 12, left: -14, bottom: 0 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="year" {...AXIS} />
                <YAxis {...AXIS} domain={[0, 100]} width={44} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconSize={9} />
                <ReferenceLine x={year} stroke="#174D3A" strokeDasharray="3 3" />
                <Line dataKey="ref" name={L("Current practice", "Canh tác hiện tại")} stroke="#86938c" strokeDasharray="2 4" strokeWidth={2} dot={false} />
                {chosen.map((s, i) => (
                  <Line key={s.id} dataKey={s.id} name={s.name} stroke={scenarioColor(s, idx(s))} strokeWidth={2.5} strokeDasharray={DASHES[i]} dot={{ r: 3.5 }} animationDuration={300} />
                ))}
              </LineChart>
            </ChartFrame>
          </div>
        </Card>
      </div>
      </SectionPanel>

      <SectionPanel id="table" active={section === "table"}>
      {/* table */}
      <Card className="overflow-hidden">
        <CardHeader title={L("Scenario comparison table", "Bảng so sánh kịch bản")} subtitle={L(`${year} · ✓ strongest, ! weakest among the compared scenarios`, `${year} · ✓ tốt nhất, ! yếu nhất trong các kịch bản so sánh`)} />
        <div className="overflow-x-auto px-2 pb-3 pt-2">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left">
                <th scope="col" className="px-3 py-2 text-xs font-semibold text-ink-2">
                  {L("Metric", "Chỉ số")}
                </th>
                {chosen.map((s) => (
                  <th key={s.id} scope="col" className="px-3 py-2 text-xs font-semibold">
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
                  <tr key={row.id} className="border-t border-line">
                    <th scope="row" className="px-3 py-2.5 text-left text-xs font-medium text-ink-2">
                      {row.label}
                    </th>
                    {chosen.map((s, i) => {
                      const r = res(s)!;
                      const v = row.value(r);
                      return (
                        <td key={s.id} className={cn("px-3 py-2.5 tabular", ex.best === i && "bg-mint/40", ex.worst === i && "bg-risk-soft/40")}>
                          <span className="flex items-center gap-1.5">
                            {v === null ? <span className="text-ink-3">{t("status.unavailable")}</span> : row.fmt(v, r)}
                            {ex.best === i && (
                              <span className="rounded bg-leaf-ink px-1 text-[10px] font-bold text-white" title={L("Strongest", "Tốt nhất")}>
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
      </Card>
      </SectionPanel>

      <SectionPanel id="evidence" active={section === "evidence"}>
        <Strip tone="violet" icon={FileSearch} title={L("Evidence & questions for each plan", "Bằng chứng & câu hỏi cho từng cách trồng")} desc={L("Pick a plan to see what supports it and what to check locally", "Chọn một cách trồng để xem điều gì ủng hộ nó và cần kiểm tra gì ở địa phương")} />
        <div className="mb-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label={L("Plan", "Cách trồng")}>
          {chosen.map((s) => (
            <button key={s.id} role="radio" aria-checked={evidenceFor?.id === s.id} onClick={() => setEvidenceId(s.id)} className={cn("flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold", evidenceFor?.id === s.id ? "border-transparent bg-[#6A4C93] text-white" : "border-line bg-white")}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: scenarioColor(s, idx(s)) }} aria-hidden />
              {s.name}
            </button>
          ))}
        </div>
        {evidence ? <EvidencePanel evidence={evidence} title={`${evidenceFor?.name} · ${farm.name}`} /> : <Skeleton className="h-64" />}
      </SectionPanel>

      <SectionPanel id="why" active={section === "why"}>
      {/* why this scenario */}
      {top && res(top) && (
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <CircleHelp className="h-5 w-5 text-forest" aria-hidden />
            {L(`Why “${top.name}” scores highest here`, `Vì sao “${top.name}” có điểm cao nhất`)}
          </h2>
          <p className="mt-1 text-sm text-ink-2">
            {L(
              "It ranks first only under your current weights, the selected year and climate assumption. It is not a guaranteed optimal or scientifically validated solution.",
              "Kịch bản này chỉ đứng đầu theo trọng số hiện tại, năm và giả định khí hậu đã chọn. Đây không phải giải pháp tối ưu được bảo đảm hay đã được kiểm chứng khoa học.",
            )}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm font-semibold text-leaf-ink">{L("Benefits", "Lợi ích")}</p>
              <ul className="mt-1.5 space-y-1 text-xs">
                {tradeoffs(top)
                  .filter((x) => x.good)
                  .map((x, i) => (
                    <li key={i}>• {x.text}</li>
                  ))}
                {CRITERIA.filter((k) => (res(top)!.contributions[k] ?? 0) > 0)
                  .sort((a, b) => res(top)!.contributions[b] - res(top)!.contributions[a])
                  .slice(0, 2)
                  .map((k) => (
                    <li key={k}>• {L(`Biggest score contributor: ${t(`crit.${k}`)} (${num(res(top)!.contributions[k], 1)} pts)`, `Đóng góp điểm lớn: ${t(`crit.${k}`)} (${num(res(top)!.contributions[k], 1)} điểm)`)}</li>
                  ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-risk-ink">{L("Tradeoffs", "Đánh đổi")}</p>
              <ul className="mt-1.5 space-y-1 text-xs">
                {tradeoffs(top).filter((x) => !x.good).length === 0 && <li className="text-ink-2">{L("No major tradeoff flagged vs current practice.", "Không có đánh đổi lớn so với hiện tại.")}</li>}
                {tradeoffs(top)
                  .filter((x) => !x.good)
                  .map((x, i) => (
                    <li key={i}>• {x.text}</li>
                  ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-ink">{L("Risks", "Rủi ro")}</p>
              <ul className="mt-1.5 space-y-1 text-xs">
                {risks(top).length === 0 && <li className="text-ink-2">{L("No specific risk flags.", "Không có cảnh báo cụ thể.")}</li>}
                {risks(top).map(([k, ss]) => (
                  <li key={k}>
                    • {t(k)} ({[...new Set(ss)].join(", ")})
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{L("Data uncertainty", "Độ bất định dữ liệu")}</p>
              <ul className="mt-1.5 space-y-1 text-xs text-ink-2">
                <li>• {L(`Climate: ${climate.data?.source ?? ""}, ${climate.data?.resolution ?? ""}.`, `Khí hậu: ${climate.data?.source ?? ""}, ${climate.data?.resolution ?? ""}.`)}</li>
                <li>• {L(`Soil inputs: ${farm.soilSources.soilType.source}.`, `Đầu vào đất: ${farm.soilSources.soilType.source}.`)}</li>
                <li>• {t("rothc.limit")}</li>
                {res(top)!.criteriaScores.income === null && <li>• {L("Income not scored — no local economic data.", "Chưa chấm thu nhập — thiếu số liệu kinh tế.")}</li>}
              </ul>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              className={buttonClass("primary")}
              onClick={() => openPlan(top.id)}
            >
              {L("Build My Rotation Plan", "Lập kế hoạch luân canh")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <Link href="/simulator" className={buttonClass("outline")}>
              {L("Back to the simulator", "Về trang Mô phỏng")}
            </Link>
          </div>
        </Card>
      )}
      </SectionPanel>
      <p className="text-xs text-ink-3">{L("Scores use the same engine results as every other view.", "Điểm dùng cùng kết quả mô hình với mọi màn hình khác.")}</p>
    </div>
  );
}
