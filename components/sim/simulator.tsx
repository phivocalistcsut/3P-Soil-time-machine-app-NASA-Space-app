"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Info,
  Leaf,
  BarChart3,
  CalendarClock,
  CalendarRange,
  CloudDrizzle,
  CloudRain,
  Copy,
  Droplets,
  FileSearch,
  Gauge,
  Layers,
  Lightbulb,
  ListChecks,
  Map as MapIcon,
  Pencil,
  Save,
  ShieldAlert,
  Sprout,
  Sun,
  ThermometerSun,
  Trash2,
  TrendingUp,
  Undo2,
  Scale,
  SlidersHorizontal,
} from "lucide-react";
import { useI18n, climateValues } from "@/lib/i18n";
import { useApp, type MapMetric } from "@/lib/store";
import { useEngine, useScenarios } from "@/lib/hooks";
import { screenCrops } from "@/lib/engine/simulate";
import { buildCalendar, buildEvidence } from "@/lib/engine/insights";
import { newId, polygonAreaHa } from "@/lib/data/demo";
import { SEASON_ORDER } from "@/lib/data/crops";
import type { OverlayId } from "@/lib/data/layers";
import type {
  ClimateAssumption,
  CustomClimate,
  RotationScenario,
  SeasonResult,
  SimulationResult,
} from "@/lib/types";
import { CUSTOM_CLIMATE_LIMITS } from "@/lib/engine/climate";
import { FarmMap } from "@/components/map/farm-map";
import { LayerPanel, LayerTimeBar, MapLegend } from "@/components/map/layer-panel";
import {
  ClimateNotice,
  CropIcon,
  DataChips,
  NoFarmState,
  scenarioColor,
  StatusBadge,
  StressBadge,
} from "@/components/common";
import { EvidencePanel, RiskCalendar } from "@/components/insights";
import {
  Badge,
  Button,
  Card,
  Input,
  Skeleton,
  buttonClass,
  cn,
} from "@/components/ui/primitives";
import {
  InfoTip,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
  toast,
} from "@/components/ui/overlays";
import {
  PageHeader,
  SectionPanel,
  SectionTabs,
  Strip,
} from "@/components/ui/sections";
import { RiskStrip, VisualState, mainRisks } from "@/components/overview/field-info";
import { CountUp, DoneChip, GlanceCard, PLAN_PHOTO, ScoreCompare, StepHeader, Takeaways, TrendSpark, type SimStep, type Takeaway } from "./sim-steps";
import { TimelineSlider, RotationGantt } from "./timeline";
import { RotationBuilder, type ScreenResult } from "./rotation-builder";
import { OutcomePanel } from "./outcomes";
import { SoilProfile } from "./soil-profile";
import { useWhyReasons, WhyPanel } from "./why-panel";
import { MonthlyWaterChart, TrendCharts } from "./sim-charts";

const SOIL_COLORS = ["#D97167", "#E4A84C", "#A3ADA8", "#66AD79", "#287043"];
const STRESS_COLORS = ["#66AD79", "#E4A84C", "#D97167", "#A63F33"];
const readHash = () => (typeof window === "undefined" ? "" : window.location.hash.replace("#", ""));
const SECTIONS = [
  "results",
  "why",
  "calendar",
  "evidence",
  "map",
  "charts",
  "edit",
];

function squareAround(
  lon: number,
  lat: number,
  areaHa: number,
): [number, number][] {
  const side = Math.sqrt(Math.max(areaHa, 0.1) * 10000);
  const dLat = side / 2 / 110540;
  const dLon = side / 2 / (111320 * Math.cos((lat * Math.PI) / 180));
  return [
    [lon - dLon, lat + dLat],
    [lon + dLon, lat + dLat],
    [lon + dLon, lat - dLat],
    [lon - dLon, lat - dLat],
  ];
}

function fieldStatus(metric: MapMetric, r: SimulationResult) {
  if (metric === "stress")
    return {
      color: STRESS_COLORS[r.waterRisk.level],
      key: `stress.${r.waterRisk.level}`,
    };
  if (metric === "suitability") {
    const c = r.cropSuitability.cls;
    return {
      color: c === "good" ? "#66AD79" : c === "fair" ? "#E4A84C" : "#D97167",
      key: `suit.${c}`,
    };
  }
  return {
    color: r.soilImprovementPotential ? SOIL_COLORS[r.soilImprovementPotential.level - 1] : "#A3ADA8",
    key: r.soilImprovementPotential ? `soil.${r.soilImprovementPotential.level}` : "status.unavailable",
  };
}

export function Simulator() {
  const { L, t, crop, num, season, signed, month, lang } = useI18n();
  const farm = useApp((s) => s.farm);
  const scenarios = useScenarios();
  const activeId = useApp((s) => s.activeScenarioId);
  const setActive = useApp((s) => s.setActiveScenario);
  const upsert = useApp((s) => s.upsertScenario);
  const remove = useApp((s) => s.removeScenario);
  const selectedYear = useApp((s) => s.selectedYear);
  const setYear = useApp((s) => s.setYear);
  const assumption = useApp((s) => s.climateAssumption);
  const setClimate = useApp((s) => s.setClimate);
  const customClimate = useApp((s) => s.customClimate);
  const setCustomClimate = useApp((s) => s.setCustomClimate);
  const mapMetric = useApp((s) => s.mapMetric);
  const setMapMetric = useApp((s) => s.setMapMetric);
  const compareIds = useApp((s) => s.compareIds);
  const setCompareIds = useApp((s) => s.setCompareIds);

  const drafts = useApp((s) => s.scenarioDrafts);
  const setDraft = useApp((s) => s.setScenarioDraft);
  const discardDraft = useApp((s) => s.discardScenarioDraft);
  const [overlays, setOverlays] = useState<OverlayId[]>([]);
  // step-by-step picker; deep links such as /simulator#calendar go straight to the results
  const [step, setStep] = useState<SimStep>(() => (SECTIONS.includes(readHash()) ? 4 : 1));
  const [doneOnce, setDoneOnce] = useState(() => SECTIONS.includes(readHash()));
  const [full, setFull] = useState(() => SECTIONS.includes(readHash()));
  const [section, setSection] = useState(() => (SECTIONS.includes(readHash()) ? readHash() : "results"));
  const setHash = (h: string | null) => {
    try {
      window.history.replaceState(null, "", h ? `#${h}` : window.location.pathname);
    } catch {
      /* ignore */
    }
  };
  const advance = (n: 1 | 2 | 3) => {
    const next: SimStep = doneOnce || n === 3 ? 4 : ((n + 1) as SimStep);
    if (next === 4) setDoneOnce(true);
    setStep(next);
    window.setTimeout(() => document.getElementById("sim-picker")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  };
  const toggleFull = () => {
    setFull(!full);
    setHash(!full ? section : null);
  };
  const openSection = (id: string) => {
    setSection(id);
    setHash(id);
  };
  useEffect(() => {
    const follow = () => {
      const h = readHash();
      if (SECTIONS.includes(h)) {
        setStep(4);
        setDoneOnce(true);
        setFull(true);
        setSection(h);
      }
    };
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, []);
  useEffect(() => {
    if (!full || step !== 4) return;
    const id = window.setTimeout(() => document.getElementById("sim-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    return () => window.clearTimeout(id);
  }, [full, step]);
  const { output, climate, modelClimate, modelLoading, extremes, settings, ndvi, usesImerg } = useEngine();

  const scenario = scenarios.find((s) => s.id === activeId) ?? scenarios[0];
  const draft = scenario ? drafts[scenario.id] : undefined;

  const screen: ScreenResult | null = useMemo(
    () =>
      farm && modelClimate ? screenCrops(farm, modelClimate, settings) : null,
    [farm, modelClimate, settings],
  );

  const years = output?.years ?? [];
  const year = Math.min(
    Math.max(selectedYear, years[0] ?? selectedYear),
    years[years.length - 1] ?? selectedYear,
  );
  const ti = Math.max(0, years.indexOf(year));
  const sim = scenario && output ? output.results[scenario.id] : null;
  const result = sim?.years[ti] ?? null;
  const refResult = output?.reference.years[ti] ?? null;
  const prev = ti > 0 ? (sim?.years[ti - 1] ?? null) : null;
  const baseClim = scenario && output?.baselineClimate[scenario.id]?.years[ti];

  const reasons = useWhyReasons({
    result,
    previous: prev,
    reference: refResult,
    baselineClimate: baseClim ?? null,
    assumption,
    farm,
  });

  const calendar = useMemo(
    () =>
      farm && modelClimate && result
        ? buildCalendar({
            result,
            farm,
            climate: modelClimate,
            assumption,
            custom: customClimate,
            extremes: extremes.data,
          })
        : null,
    [farm, modelClimate, result, assumption, customClimate, extremes.data],
  );
  const evidence = useMemo(
    () =>
      farm && modelClimate && result && refResult && scenario && calendar
        ? buildEvidence({
            scenario,
            result,
            reference: refResult,
            farm,
            climate: modelClimate,
            extremes: extremes.data,
            ndvi: ndvi.data,
            calendar,
            hasEconomics: !!result.economics,
          })
        : null,
    [
      farm,
      modelClimate,
      result,
      refResult,
      scenario,
      calendar,
      extremes.data,
      ndvi.data,
    ],
  );

  const resultsBySlot = useMemo(() => {
    const map: Record<string, SeasonResult> = {};
    if (!sim || !scenario) return map;
    for (let yi = 0; yi < scenario.cycleYears; yi++)
      sim.years[yi + 1]?.seasons.forEach((s) => (map[s.slotId] = s));
    if (result && !result.isBaselineYear) {
      result.seasons.forEach((s) => (map[s.slotId] = s));
    }
    return map;
  }, [sim, scenario, result]);

  if (!farm) return <NoFarmState />;
  if (!climate.data && !modelLoading) return <ClimateNotice climate={climate} />;
  if (!output || !scenario || !result || !refResult || !screen) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-28 rounded-3xl" />
        <ClimateNotice climate={climate} />
        <Skeleton className="h-40" />
        <Skeleton className="h-80" />
        <p className="text-center text-sm text-ink-2">
          {L(
            "Loading NASA POWER climate and running the scenario engine…",
            "Đang tải khí hậu NASA POWER và chạy mô hình…",
          )}
        </p>
      </div>
    );
  }

  const color = scenarioColor(scenario, scenarios.indexOf(scenario));
  const boundary =
    farm.boundary ?? squareAround(farm.longitude, farm.latitude, farm.areaHa);
  const fs = fieldStatus(mapMetric, result);
  const legendItems =
    mapMetric === "stress"
      ? STRESS_COLORS.map((c, i) => ({ color: c, key: `stress.${i}` }))
      : mapMetric === "suitability"
        ? [
            { color: "#66AD79", key: "suit.good" },
            { color: "#E4A84C", key: "suit.fair" },
            { color: "#D97167", key: "suit.poor" },
          ]
        : SOIL_COLORS.map((c, i) => ({ color: c, key: `soil.${i + 1}` }));
  const areaNote = farm.boundary
    ? `${num(polygonAreaHa(farm.boundary), 2)} ha`
    : L(
        "approximate footprint (no boundary drawn)",
        "phạm vi gần đúng (chưa vẽ ranh giới)",
      );
  const shortCrop = (id: string | null) => crop(id).replace(/\s*\(.*\)$/, "");

  const save = () => {
    if (!draft?.name.trim()) return;
    upsert(scenario);
    toast.success(L(`Saved “${scenario.name}”`, `Đã lưu “${scenario.name}”`));
  };
  const duplicate = () => {
    const copy: RotationScenario = {
      ...scenario,
      id: newId("scenario"),
      name: L(
        `${scenario.name.replace(/^[A-Z] · /, "")} (copy)`,
        `${scenario.name.replace(/^[A-Z] · /, "")} (bản sao)`,
      ),
      kind: "custom",
      seasonalCropSequence: scenario.seasonalCropSequence.map((s) => ({
        ...s,
        id: newId("slot"),
      })),
      createdAt: new Date().toISOString(),
    };
    upsert(copy);
    setActive(copy.id);
    if (compareIds.length < 3) setCompareIds([...compareIds, copy.id]);
    setStep(4);
    setDoneOnce(true);
    setFull(true);
    setSection("edit");
    setHash("edit");
    toast.success(
      L(
        "Copy created — change the crops below",
        "Đã tạo bản sao — hãy đổi cây ở bên dưới",
      ),
    );
  };
  const del = () => {
    if (scenarios.length <= 1) return;
    remove(scenario.id);
    toast.info(L("Plan deleted", "Đã xóa cách trồng"));
  };

  const kindText: Record<RotationScenario["kind"], string> = {
    conventional: L(
      "Keep planting the way you do now. Every other plan is compared with this one.",
      "Giữ nguyên cách đang trồng. Mọi cách trồng khác đều so với cách này.",
    ),
    fit: L(
      "Keeps your main rice season and swaps the thirstiest other season for the upland crop that fits this field best.",
      "Giữ vụ lúa chính, đổi vụ tốn nước nhất còn lại sang cây màu hợp với ruộng này nhất.",
    ),
    water: L(
      "Grows the upland crop that needs the least water, and rests the field in the flood season every other year.",
      "Trồng cây màu cần ít nước nhất, và cứ hai năm cho ruộng nghỉ vụ mùa lũ một lần.",
    ),
    soil: L(
      "Adds a bean crop every year and a green-manure crop in the flood season every other year to rebuild the soil.",
      "Thêm cây họ đậu mỗi năm và cây phân xanh vào mùa lũ hai năm một lần để bồi lại đất.",
    ),
    custom: L(
      "Your own plan. Change the crops in the “Change the crops” section.",
      "Cách trồng của bạn. Đổi cây ở mục “Chỉnh cách trồng”.",
    ),
  };

  const climates: { id: ClimateAssumption; icon: typeof Sun }[] = [
    { id: "baseline", icon: CloudRain },
    { id: "drier", icon: Sun },
    { id: "wetter", icon: CloudDrizzle },
    { id: "warmer", icon: ThermometerSun },
  ];
  const dWater = result.waterDemand.median - refResult.waterDemand.median;
  const soilNow = result.soilImprovementPotential;
  const seasonToCheck = result.waterRisk.worstSeason
    ?? result.seasons.find((s) => s.risks.includes("risk.dryYear"))?.season;
  const plannerHref = seasonToCheck ? `/planner#plan-season-${seasonToCheck}` : "/planner#calendar";
  const includeInComparison = () => {
    if (!compareIds.includes(scenario.id)) {
      setCompareIds([scenario.id, ...compareIds].slice(0, 3));
    }
  };

  const dScore = result.overallScore - refResult.overallScore;
  const scoreSeries = sim!.years.map((y) => y.overallScore);
  const dTrend = scoreSeries[scoreSeries.length - 1] - scoreSeries[0];
  const climateIcon = climates.find((c) => c.id === assumption)?.icon ?? SlidersHorizontal;
  const chips = [
    { n: 1, icon: Sprout, image: PLAN_PHOTO[scenario.kind], label: L("Planting plan", "Cách trồng"), value: scenario.name, onEdit: () => setStep(1) },
    { n: 2, icon: CalendarRange, label: L("Year", "Năm"), value: `${year}${result.isBaselineYear ? ` · ${L("today", "hiện tại")}` : ""}`, onEdit: () => setStep(2) },
    { n: 3, icon: climateIcon, label: L("Weather", "Thời tiết"), value: t(`clim.${assumption}`), onEdit: () => setStep(3) },
  ];
  const planPhoto = PLAN_PHOTO[scenario.kind];
  // plain-language summary of what changes vs. today (the model's full reasons stay in "Why it changes")
  const takeaways: Takeaway[] = [];
  if (result.isBaselineYear) {
    takeaways.push({ icon: Info, tone: "neutral", title: L("This is today", "Đây là năm hiện tại"), detail: L("Every plan starts the same; pick a later year to see changes.", "Mọi cách trồng giống nhau; chọn năm sau để thấy khác biệt.") });
  } else {
    const swaps = SEASON_ORDER.map((se) => ({
      se,
      from: refResult.seasons.find((x) => x.season === se)?.cropId ?? null,
      to: result.seasons.find((x) => x.season === se)?.cropId ?? null,
    })).filter((x) => x.from !== x.to);
    takeaways.push(
      swaps.length
        ? { icon: Sprout, tone: "neutral", title: L(`Different crop in ${swaps.length} season${swaps.length > 1 ? "s" : ""}`, `Đổi cây ở ${swaps.length} vụ`), detail: swaps.map((x) => `${season(x.se)}: ${shortCrop(x.from)} → ${shortCrop(x.to)}`).join(" · ") }
        : { icon: Sprout, tone: "neutral", title: L("Same crops as today", "Giữ nguyên cây trồng"), detail: L("Only the weather or year differs", "Chỉ khác thời tiết hoặc năm") },
    );
    takeaways.push(
      Math.abs(dWater) < 5
        ? { icon: Droplets, tone: "neutral", title: L("About the same water", "Nước tưới gần như không đổi"), detail: `${num(result.waterDemand.median)} ${L("mm/year", "mm/năm")}` }
        : { icon: Droplets, tone: dWater < 0 ? "positive" : "negative", title: dWater < 0 ? L("Less irrigation water", "Tốn ít nước tưới hơn") : L("More irrigation water", "Tốn nhiều nước tưới hơn"), detail: L(`${num(Math.abs(dWater))} mm/year ${dWater < 0 ? "less" : "more"}`, `${dWater < 0 ? "ít" : "nhiều"} hơn ${num(Math.abs(dWater))} mm mỗi năm`) },
    );
    const dRisk = result.waterRisk.level - refResult.waterRisk.level;
    if (dRisk !== 0)
      takeaways.push({ icon: ShieldAlert, tone: dRisk < 0 ? "positive" : "negative", title: dRisk < 0 ? L("Less risk of running short", "Ít lo thiếu nước hơn") : L("More risk of running short", "Dễ thiếu nước hơn"), detail: `${t(`stress.${refResult.waterRisk.level}`)} → ${t(`stress.${result.waterRisk.level}`)}` });
    const refSoc = refResult.soilImprovementPotential?.socTCHa;
    if (soilNow && refSoc !== undefined && Math.abs(soilNow.socTCHa - refSoc) >= 0.05) {
      const dSoc = soilNow.socTCHa - refSoc;
      takeaways.push({ icon: Leaf, tone: dSoc > 0 ? "positive" : "negative", title: dSoc > 0 ? L("Soil holds more carbon", "Đất giàu carbon hơn") : L("Soil loses some carbon", "Đất mất bớt carbon"), detail: L(`${signed(dSoc, 2)} t C/ha vs today`, `${signed(dSoc, 2)} t C/ha so với hiện tại`) });
    }
  }
  const fullTabs = [
    { id: "results", icon: Gauge, label: L("All indicators", "Tất cả chỉ số"), tone: "blue" as const },
    { id: "why", icon: Lightbulb, label: L("Why it changes", "Vì sao thay đổi"), tone: "green" as const },
    { id: "calendar", icon: CalendarClock, label: L("12-month calendar", "Lịch 12 tháng"), tone: "amber" as const },
    { id: "charts", icon: BarChart3, label: L("Charts", "Biểu đồ"), tone: "earth" as const },
    { id: "map", icon: MapIcon, label: L("Field map", "Bản đồ ruộng"), tone: "teal" as const },
    { id: "evidence", icon: FileSearch, label: L("Evidence & questions", "Bằng chứng & câu hỏi"), tone: "violet" as const },
    { id: "edit", icon: Pencil, label: L("Change the crops", "Chỉnh cách trồng"), tone: "leaf" as const, badge: draft ? "•" : undefined },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        image="space-horizon"
        icon={TrendingUp}
        eyebrow={L("5-year simulator", "Mô phỏng 5 năm")}
        title={L(
          "If you change what you plant, how could your field change?",
          "Nếu đổi cách trồng, ruộng có thể thay đổi ra sao?",
        )}
        desc={L(
          "Three quick steps: plan → year → weather.",
          "Ba bước nhanh: cách trồng → năm → thời tiết.",
        )}
        actions={
          <Link
            href="/compare#cards"
            onClick={includeInComparison}
            className={buttonClass("primary", "lg")}
          >
            <Scale className="h-4 w-4" aria-hidden />
            {L("Compare plans", "So sánh cách trồng")}
          </Link>
        }
        meta={<DataChips climate={climate} usesImerg={usesImerg} />}
      />
      <ClimateNotice climate={climate} />

      {/* STEP PICKER: one big step at a time; finished steps shrink to chips */}
      <div id="sim-picker" className="scroll-mt-24">
      {step < 4 ? (
        <div className={cn("grid gap-4", step > 1 && "lg:grid-cols-[260px_minmax(0,1fr)]")}>
          {step > 1 && (
            <div className="space-y-2.5">
              {chips.filter((c) => c.n < step).map((c, i) => (
                <DoneChip key={c.n} {...c} delay={i * 80} />
              ))}
            </div>
          )}
          <section key={step} className="anim-rise rounded-3xl border border-line bg-white p-4 shadow-[var(--shadow-card)] md:p-6" aria-live="polite">
            {step === 1 && (
              <>
                <StepHeader
                  n={1}
                  title={L("Choose a planting plan", "Chọn cách trồng")}
                  right={
                    <span className="flex gap-1.5">
                      <Button variant="outline" size="sm" onClick={duplicate}>
                        <Copy className="h-3.5 w-3.5" aria-hidden />
                        {L("Make my own", "Tạo cách trồng riêng")}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={del} disabled={scenarios.length <= 1} aria-label={L("Delete the selected plan", "Xóa cách trồng đang chọn")}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    </span>
                  }
                />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label={L("Planting plans", "Các cách trồng")}>
                  {scenarios.map((s, i) => {
                    const active = s.id === scenario.id;
                    const yr = output.results[s.id]?.years[ti];
                    const c = scenarioColor(s, i);
                    return (
                      <button
                        key={s.id}
                        role="radio"
                        aria-checked={active}
                        onClick={() => {
                          setActive(s.id);
                          advance(1);
                        }}
                        style={{ ...(active ? { borderColor: c } : {}), animationDelay: `${i * 90}ms` }}
                        className={cn(
                          "anim-rise lift group flex flex-col overflow-hidden rounded-3xl border-2 bg-white text-left hover:-translate-y-1 hover:shadow-[var(--shadow-float)]",
                          active ? "shadow-[var(--shadow-float)]" : "border-line",
                        )}
                      >
                        <div className="relative isolate overflow-hidden bg-space-900 px-4 pb-4 pt-5 text-white">
                          <div aria-hidden className="absolute inset-0 -z-10">
                            <Image src={`/images/${PLAN_PHOTO[s.kind]}`} alt="" fill sizes="(min-width: 1280px) 420px, 100vw" className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-space-950/90 via-space-950/60 to-space-950/25" />
                          </div>
                          <div aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: c }} />
                          <div className="flex items-start justify-between gap-2">
                            <span className="title-caps text-lg font-extrabold leading-tight">{s.name}</span>
                            {yr && (
                              <span className="shrink-0 rounded-full px-2.5 py-1 font-display text-sm font-extrabold tabular text-white" style={{ background: c }}>
                                {num(yr.overallScore)}
                              </span>
                            )}
                          </div>
                          <div className="mt-10 space-y-1.5">
                            {Array.from({ length: s.cycleYears }, (_, yi) => (
                              <div key={yi} className="flex items-center gap-1.5">
                                {SEASON_ORDER.map((se) => {
                                  const id = s.seasonalCropSequence.find((x) => x.yearIndex === yi && x.season === se)?.cropId ?? null;
                                  return (
                                    <span key={se} className="flex flex-1 items-center gap-1.5 truncate rounded-lg bg-space-950/50 px-1.5 py-1 text-[11px] font-semibold backdrop-blur-sm" title={crop(id)}>
                                      <CropIcon cropId={id} size={18} className="rounded" />
                                      <span className="truncate">{shortCrop(id)}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-1 items-end justify-between gap-2 p-4">
                          <p className="line-clamp-2 text-xs leading-snug text-ink-2">{kindText[s.kind]}</p>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand text-ink-2 transition-colors group-hover:bg-lime group-hover:text-space-900">
                            <ArrowRight className="h-4 w-4" aria-hidden />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <StepHeader n={2} title={L("Choose a year", "Chọn năm")} />
                <TimelineSlider years={years} results={sim!.years} value={year} onChange={setYear} climate={modelClimate} usesImerg={usesImerg} color={color} />
                <div className="mt-4 flex justify-end">
                  <Button size="lg" onClick={() => advance(2)}>
                    {L(`Continue with ${year}`, `Tiếp tục với năm ${year}`)}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <StepHeader
                  n={3}
                  title={L("Choose the weather", "Chọn thời tiết")}
                  right={
                    <InfoTip>
                      {L(
                        "Simple, transparent changes applied to 10 years of real NASA POWER weather to test how sensitive each plan is. They are not NASA forecasts.",
                        "Các điều chỉnh đơn giản, minh bạch áp lên 10 năm thời tiết thật của NASA POWER để thử độ nhạy của mỗi cách trồng. Đây không phải dự báo của NASA.",
                      )}
                    </InfoTip>
                  }
                />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label={L("Weather", "Thời tiết")}>
                  {climates.map((c, ci) => {
                    const on = assumption === c.id;
                    return (
                      <button
                        key={c.id}
                        role="radio"
                        aria-checked={on}
                        onClick={() => {
                          setClimate(c.id);
                          advance(3);
                        }}
                        style={{ animationDelay: `${ci * 80}ms` }}
                        className={cn(
                          "anim-rise lift group relative isolate flex flex-col items-start overflow-hidden rounded-3xl border p-4 text-left hover:-translate-y-1",
                          on ? "border-space-900 bg-space-900 text-white shadow-[var(--shadow-float)]" : "border-line bg-white hover:border-lime hover:shadow-[var(--shadow-float)]",
                        )}
                      >
                        {on && <div aria-hidden className="absolute inset-0 -z-10 bg-stars opacity-40" />}
                        <span className={cn("flex h-12 w-12 items-center justify-center rounded-full", on ? "border border-lime/50 text-lime-bright" : "bg-sand text-ink-2 group-hover:bg-lime-soft group-hover:text-lime-ink")}>
                          <c.icon className="h-6 w-6" aria-hidden />
                        </span>
                        <span className="mt-3 text-base font-bold">{t(`clim.${c.id}`)}</span>
                        <span className={cn("mt-0.5 text-xs leading-snug", on ? "text-white/75" : "text-ink-2")}>{t(`clim.${c.id}.def`)}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3">
                  <CustomClimateCard active={assumption === "custom"} value={customClimate} onSelect={() => setClimate("custom")} onChange={setCustomClimate} />
                </div>
                <div className="mt-4 flex justify-end">
                  <Button size="lg" onClick={() => advance(3)}>
                    {L("See the result", "Xem kết quả")}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </>
            )}
          </section>
        </div>
      ) : (
        /* SUMMARY of the three choices */
        <div className="grid gap-3 md:grid-cols-3">
          {chips.map((c, i) => (
            <DoneChip key={c.n} {...c} wide delay={i * 90} />
          ))}
        </div>
      )}
      </div>

      {step === 4 && (
        <>
      {/* READOUT: the chosen plan's photo, key numbers on glass tiles */}
      <section
        aria-label={L("Result at a glance", "Kết quả tóm tắt")}
        style={{ animationDelay: "120ms" }}
        className="anim-rise relative isolate overflow-hidden rounded-3xl bg-space-900 p-4 text-white shadow-[var(--shadow-float)] md:p-7"
      >
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image key={planPhoto} src={`/images/${planPhoto}`} alt="" fill sizes="(min-width: 1440px) 1380px, 100vw" className="anim-ken-burns object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-space-950/95 via-space-950/70 to-space-950/35 md:bg-gradient-to-r md:from-space-950/90 md:via-space-950/60 md:to-space-950/20" />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow text-lime-bright">
              {L("Result", "Kết quả")} · {year}
            </p>
            <h2 className="title-caps mt-2 text-2xl font-extrabold leading-tight md:text-[34px]">{scenario.name}</h2>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-white/75">
              {t(`clim.${assumption}`)}
              {draft && <Badge tone="amber">{L("Unsaved preview", "Bản xem trước chưa lưu")}</Badge>}
              {result.isBaselineYear && <span className="text-xs text-white/60">({L("today — same for every plan", "hiện tại — mọi cách trồng như nhau")})</span>}
            </p>
          </div>
          <StatusBadge status={output.climateStatus} />
        </div>
        <dl className="mt-7 grid grid-cols-2 gap-2.5 lg:grid-cols-5">
          {[
            {
              icon: Gauge,
              iconCls: "text-lime-bright",
              label: L("Overall score", "Điểm tổng hợp"),
              value: (
                <span className="text-4xl text-lime-bright">
                  <CountUp value={result.overallScore} format={(v) => num(v)} />
                  <span className="ml-1 text-xs font-semibold text-white/60">/100</span>
                </span>
              ),
              note: L(`today: ${num(refResult.overallScore)}`, `hiện tại: ${num(refResult.overallScore)}`),
            },
            {
              icon: Droplets,
              iconCls: "text-[#7dbbe6]",
              label: L("Irrigation water", "Nước tưới"),
              value: (
                <>
                  <CountUp value={result.waterDemand.median} format={(v) => num(v)} />
                  <span className="ml-1 text-xs font-semibold text-white/60">{L("mm/year", "mm/năm")}</span>
                </>
              ),
              note:
                Math.abs(dWater) < 5
                  ? L("same as today", "như hiện tại")
                  : L(`${dWater < 0 ? "−" : "+"}${num(Math.abs(dWater))} mm vs today`, `${dWater < 0 ? "ít hơn" : "nhiều hơn"} ${num(Math.abs(dWater))} mm so với hiện tại`),
            },
            {
              icon: Droplets,
              iconCls: "text-[#7dbbe6]",
              label: L(`Water for ${num(farm.areaHa, 2)} ha`, `Nước cho ${num(farm.areaHa, 2)} ha`),
              value: (
                <>
                  <CountUp value={result.waterDemand.m3PerHa * farm.areaHa} format={(v) => num(v)} />
                  <span className="ml-1 text-xs font-semibold text-white/60">m³</span>
                </>
              ),
              note: t(`status.${result.dataStatus.waterDemand}`),
            },
            {
              icon: ShieldAlert,
              iconCls: "text-amber",
              label: L("Water shortage risk", "Nguy cơ thiếu nước"),
              value: <StressBadge level={result.waterRisk.level} />,
              note: L(`today: ${t(`stress.${refResult.waterRisk.level}`)}`, `hiện tại: ${t(`stress.${refResult.waterRisk.level}`)}`),
            },
            {
              icon: Sprout,
              iconCls: "text-lime-bright",
              label: L("Soil carbon", "Carbon đất"),
              value: soilNow ? (
                <>
                  <CountUp value={soilNow.socTCHa} format={(v) => num(v, 2)} />
                  <span className="ml-1 text-xs font-semibold text-white/60">t C/ha</span>
                </>
              ) : (
                "—"
              ),
              note: soilNow
                ? refResult.soilImprovementPotential
                  ? `${t("rothc.vsCurrent", { delta: signed(soilNow.socTCHa - refResult.soilImprovementPotential.socTCHa, 2) })} · RothC`
                  : `${t("status.estimated")} (RothC)`
                : t("status.unavailable"),
            },
          ].map((m, i) => (
            <div
              key={m.label}
              style={{ animationDelay: `${300 + i * 90}ms` }}
              className={cn("anim-rise rounded-2xl border border-white/15 bg-space-950/45 p-3.5 backdrop-blur-md", i === 4 && "col-span-2 lg:col-span-1")}
            >
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/65">
                <m.icon className={cn("h-3.5 w-3.5", m.iconCls)} aria-hidden />
                {m.label}
              </dt>
              <dd className="mt-2 font-display text-2xl font-extrabold tabular">{m.value}</dd>
              <dd className="mt-0.5 text-[11px] text-white/65">{m.note}</dd>
            </div>
          ))}
        </dl>
        {seasonToCheck && (
          <div style={{ animationDelay: "800ms" }} className="anim-rise mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber/40 bg-space-950/50 px-4 py-3 backdrop-blur-md">
            <p className="flex items-center gap-2 text-sm">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber" aria-hidden />
              {L(`Check water supply for ${season(seasonToCheck)}`, `Kiểm tra nguồn nước cho vụ ${season(seasonToCheck)}`)}
            </p>
            <Link href={plannerHref} className={buttonClass("primary", "sm")}>
              {L("See this season", "Xem lịch vụ này")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}
      </section>

      {/* EVERYTHING AT A GLANCE: no tabs, nothing to click */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <GlanceCard
          icon={Gauge}
          title={L("Compared with today", "So với hiện tại")}
          value={<CountUp value={dScore} format={(v) => `${v >= 0 ? "+" : "−"}${num(Math.abs(v))}`} />}
          unit={L("points", "điểm")}
          note={L("Overall score from 8 indicators", "Điểm tổng hợp từ 8 chỉ số")}
          visual={<ScoreCompare score={result.overallScore} today={refResult.overallScore} color={color} />}
          image="plan-water.webp"
          delay={350}
        />
        <GlanceCard
          icon={TrendingUp}
          title={L("Year by year", "Qua từng năm")}
          value={<CountUp value={dTrend} format={(v) => `${v >= 0 ? "+" : "−"}${num(Math.abs(v))}`} />}
          unit={L(`points ${years[0]}→${years[years.length - 1]}`, `điểm ${years[0]}→${years[years.length - 1]}`)}
          note={L(`Score in each year; ${year} highlighted`, `Điểm từng năm; năm ${year} được đánh dấu`)}
          visual={<TrendSpark values={scoreSeries} years={years} selected={ti} color={color} today={refResult.overallScore} />}
          delay={460}
        />
        <GlanceCard
          icon={CalendarClock}
          title={L("Riskiest months", "Tháng nhiều rủi ro nhất")}
          value={calendar && calendar.worstMonths.length ? <span className="text-[24px]">{calendar.worstMonths.slice(0, 3).map((m) => month(m)).join(" · ")}</span> : "—"}
          note={
            calendar
              ? `${mainRisks(calendar).slice(0, 2).map((r) => r.name[lang]).join(", ") || L("No high risk", "Không có rủi ro cao")}${calendar.bareMonths.length ? ` · ${L(`${calendar.bareMonths.length} bare months`, `${calendar.bareMonths.length} tháng ruộng trống`)}` : ""}`
              : undefined
          }
          visual={calendar ? <RiskStrip calendar={calendar} /> : <VisualState loading />}
          image="card-harvest.webp"
          delay={570}
          className="md:col-span-2 xl:col-span-1"
        />
      </div>

      <section style={{ animationDelay: "680ms" }} className="anim-rise rounded-3xl border border-line bg-white p-4 shadow-[var(--shadow-card)] md:p-6">
        <h3 className="mb-4 flex items-center gap-2 font-display text-[11px] font-extrabold uppercase tracking-[0.18em] text-lime-ink">
          <Lightbulb className="h-3.5 w-3.5" aria-hidden />
          {L("What changes vs. today", "Thay đổi so với hiện tại")}
        </h3>
        <Takeaways
          items={takeaways}
          onMore={() => {
            setFull(true);
            openSection("why");
          }}
        />
      </section>

      {/* ONE way into the full information */}
      <button
        type="button"
        onClick={toggleFull}
        aria-expanded={full}
        aria-controls="sim-detail"
        style={{ animationDelay: "820ms" }}
        className="anim-rise lift group relative isolate flex w-full items-center gap-4 overflow-hidden rounded-3xl px-5 py-6 text-left text-white shadow-[var(--shadow-card)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)] md:px-8 md:py-7"
      >
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image src="/images/plan-soil.webp" alt="" fill sizes="(min-width: 1440px) 1380px, 100vw" className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-space-950/95 via-space-950/75 to-space-950/30" />
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-lime/50 bg-space-950/40 text-lime-bright md:h-14 md:w-14">
          <Layers className="h-6 w-6" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="title-caps block text-lg font-extrabold md:text-2xl">{full ? L("Hide full information", "Ẩn thông tin đầy đủ") : L("See the full information", "Xem đầy đủ thông tin")}</span>
          <span className="mt-1 block text-xs text-white/75 md:text-sm">
            {L("All indicators · 12-month calendar · charts · field map · evidence · change the crops", "Tất cả chỉ số · lịch 12 tháng · biểu đồ · bản đồ · bằng chứng · chỉnh cách trồng")}
          </span>
        </span>
        <ChevronDown className={cn("h-6 w-6 shrink-0 transition-transform duration-500", full && "rotate-180")} aria-hidden />
      </button>

      {full && (
      <section id="sim-detail" className="anim-rise scroll-mt-24 space-y-4 rounded-3xl border border-line bg-sand-2/40 p-3 md:p-5">
        <SectionTabs tabs={fullTabs} value={section} onChange={openSection} label={L("Full information", "Thông tin đầy đủ")} />
      <SectionPanel id="results" active={section === "results"}>
        <Strip
          tone="blue"
          icon={Gauge}
          title={L("All results for this year", "Tất cả kết quả của năm này")}
          desc={L(
            "Each card compares with how you plant today",
            "Mỗi thẻ so với cách đang trồng hiện nay",
          )}
        />
        <OutcomePanel result={result} reference={refResult} />
      </SectionPanel>

      <SectionPanel id="why" active={section === "why"}>
        <Strip
          tone="green"
          icon={Lightbulb}
          title={L("Why did this change?", "Vì sao thay đổi?")}
          desc={L(
            `${scenario.name} vs today · ${year}`,
            `${scenario.name} so với hiện tại · ${year}`,
          )}
        />
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="p-4">
            <WhyPanel reasons={reasons} />
          </Card>
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {L(
                  "What the soil could look like",
                  "Đất có thể trông như thế nào",
                )}
              </h3>
              <StatusBadge status="illustrative" withTip={false} />
            </div>
            <SoilProfile result={result} />
          </Card>
        </div>
      </SectionPanel>

      <SectionPanel id="calendar" active={section === "calendar"}>
        <Strip
          tone="amber"
          icon={CalendarClock}
          title={L(
            "When is the field bare or at risk?",
            "Khi nào ruộng trống hoặc gặp rủi ro?",
          )}
          desc={L(
            `${scenario.name} · crop year ${year}`,
            `${scenario.name} · năm mùa vụ ${year}`,
          )}
        />
        {calendar ? (
          <Card className="p-4">
            <RiskCalendar calendar={calendar} />
          </Card>
        ) : (
          <Skeleton className="h-64" />
        )}
        <Card className="mt-4 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
            <CalendarRange className="h-4 w-4 text-earth-ink" aria-hidden />
            {L(
              "Planting to harvest, all years",
              "Từ gieo đến thu hoạch, các năm",
            )}
          </h3>
          <RotationGantt
            results={sim!.years}
            selectedYear={year}
            onSelect={setYear}
          />
        </Card>
      </SectionPanel>

      <SectionPanel id="evidence" active={section === "evidence"}>
        <Strip
          tone="violet"
          icon={FileSearch}
          title={L(
            "Evidence, gaps and questions for local experts",
            "Bằng chứng, chỗ còn thiếu và câu hỏi cho chuyên gia",
          )}
          desc={L(
            "What supports this plan, what we don't know, and what to check before planting",
            "Điều gì ủng hộ cách trồng này, điều gì còn chưa biết, và cần kiểm tra gì trước khi gieo",
          )}
        />
        {evidence ? (
          <EvidencePanel
            evidence={evidence}
            title={`${scenario.name} · ${farm.name}`}
          />
        ) : (
          <Skeleton className="h-64" />
        )}
      </SectionPanel>

      <SectionPanel id="map" active={section === "map"}>
        <Strip
          tone="teal"
          icon={MapIcon}
          title={L(
            "Your field, coloured by the result",
            "Ruộng được tô màu theo kết quả",
          )}
          desc={L(
            "Real satellite image; only the colour changes with the plan and year",
            "Ảnh vệ tinh thật; chỉ màu tô thay đổi theo cách trồng và năm",
          )}
        />
        <Card className="overflow-hidden">
          <div className="relative h-[340px] md:h-[440px]">
            <FarmMap
              center={[farm.longitude, farm.latitude]}
              zoom={15.3}
              basemap="satellite"
              overlays={overlays}
              boundary={boundary}
              fieldFill={{ color: fs.color, opacity: 0.58 }}
              fitToBoundary
              className="absolute inset-0"
              ariaLabel={L(
                "Farm map with modeled field status",
                "Bản đồ trang trại với trạng thái ruộng mô phỏng",
              )}
            />
            <div className="absolute left-3 top-3 flex max-w-[calc(100%-70px)] flex-wrap gap-1.5">
              <div
                role="radiogroup"
                aria-label={L("Field colour shows", "Màu ruộng thể hiện")}
                className="inline-flex rounded-xl border border-line bg-white p-0.5 shadow-sm"
              >
                {(
                  [
                    ["stress", L("Water shortage", "Thiếu nước")],
                    ["suitability", L("Climate fit", "Phù hợp")],
                    ["soil", L("Soil outlook", "Đất")],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    role="radio"
                    aria-checked={mapMetric === id}
                    onClick={() => setMapMetric(id)}
                    className={cn(
                      "h-8 rounded-[10px] px-2.5 text-xs font-medium",
                      mapMetric === id
                        ? "bg-[#23786F] text-white"
                        : "text-ink-2 hover:text-ink",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <PopoverRoot>
                <PopoverTrigger className="flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-2.5 text-xs font-medium shadow-sm">
                  <Layers className="h-3.5 w-3.5" aria-hidden />
                  {L("NASA layers", "Lớp NASA")}
                  {overlays.length > 0 && (
                    <Badge tone="blue">{overlays.length}</Badge>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-[290px]" align="start">
                  <LayerPanel
                    overlays={overlays}
                    onToggle={(id) =>
                      setOverlays((o) =>
                        o.includes(id) ? o.filter((x) => x !== id) : [...o, id],
                      )
                    }
                    showBoundary
                    onToggleBoundary={() => {}}
                    hasBoundary={false}
                    compact
                  />
                  <p className="mt-2 text-[11px] text-ink-2">
                    {L(
                      "NASA layers show regional conditions on the dates in the legend.",
                      "Các lớp NASA thể hiện điều kiện trong vùng vào ngày ghi ở chú giải.",
                    )}
                  </p>
                </PopoverContent>
              </PopoverRoot>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line px-4 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#1C6159]">
              <MapIcon className="h-3 w-3" aria-hidden />
              {L("Simulation year", "Năm mô phỏng")} · {year}
            </p>
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <span
                className="h-3 w-3 rounded"
                style={{ background: fs.color }}
                aria-hidden
              />
              {t(fs.key)}
            </p>
            <div
              className="flex flex-wrap gap-x-2.5 gap-y-1 text-[10.5px] text-ink-2"
              aria-label={L("Legend", "Chú giải")}
            >
              {legendItems.map((it) => (
                <span key={it.key} className="inline-flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ background: it.color }}
                    aria-hidden
                  />
                  {t(it.key)}
                </span>
              ))}
            </div>
            <p className="w-full text-[10px] leading-snug text-ink-3">
              {L(
                "Field color shows the simulation result over the 2023 satellite basemap.",
                "Màu trên ruộng thể hiện kết quả mô phỏng trên nền ảnh vệ tinh năm 2023.",
              )}{" "}
              · {areaNote}
            </p>
          </div>
          <div className="grid items-start gap-2 border-t border-line p-3 sm:grid-cols-2">
            <LayerTimeBar overlays={overlays} onEnable={() => setOverlays(["smap"])} />
            <MapLegend overlays={overlays} />
          </div>
        </Card>
      </SectionPanel>

      <SectionPanel id="charts" active={section === "charts"}>
        <Strip
          tone="earth"
          icon={BarChart3}
          title={L("Charts", "Biểu đồ")}
          desc={L(
            "All plans year by year, and this year month by month",
            "Mọi cách trồng theo năm, và năm này theo tháng",
          )}
          right={<StatusBadge status={output.climateStatus} withTip={false} />}
        />
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="mb-2 text-sm font-bold">
              {L("Year by year", "Theo từng năm")}
            </h3>
            <TrendCharts
              scenarios={scenarios.map((s) =>
                s.id === scenario.id ? scenario : s,
              )}
              results={output.results}
              reference={output.reference}
              activeId={scenario.id}
              years={years}
              selectedYear={year}
            />
          </Card>
          <Card className="p-4">
            <h3 className="mb-2 text-sm font-bold">
              {L(
                `Irrigation by month in ${year}`,
                `Nước tưới theo tháng năm ${year}`,
              )}
            </h3>
            <MonthlyWaterChart
              monthly={result.monthlyIrrigation}
              refMonthly={refResult.monthlyIrrigation}
              color={color}
              name={scenario.name}
            />
          </Card>
        </div>
      </SectionPanel>

      <SectionPanel id="edit" active={section === "edit"}>
        <Strip
          tone="leaf"
          icon={Pencil}
          title={L("Change the crops", "Chỉnh cách trồng")}
          desc={L(
            "Tap a card to pick another crop or planting month; drag cards to swap seasons",
            "Bấm vào thẻ để chọn cây hoặc tháng gieo khác; kéo thẻ để đổi vụ",
          )}
        />
        <Card>
          <div className="flex flex-col gap-3 border-b border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: color }}
                aria-hidden
              />
              <label className="sr-only" htmlFor="scn-name">
                {L("Plan name", "Tên cách trồng")}
              </label>
              <Input
                id="scn-name"
                value={draft?.name ?? scenario.name}
                onChange={(e) =>
                  setDraft({ ...scenario, name: e.target.value })
                }
                className="h-10 max-w-sm font-semibold"
              />
              {draft && (
                <Badge tone="amber">{L("Unsaved changes", "Chưa lưu")}</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => discardDraft(scenario.id)}
                disabled={!draft}
              >
                <Undo2 className="h-4 w-4" aria-hidden />
                {L("Discard", "Hủy thay đổi")}
              </Button>
              <Button variant="outline" size="sm" onClick={duplicate}>
                <Copy className="h-4 w-4" aria-hidden />
                {L("Duplicate", "Nhân bản")}
              </Button>
              <Button size="sm" onClick={save} disabled={!draft?.name.trim()}>
                <Save className="h-4 w-4" aria-hidden />
                {L("Save plan", "Lưu cách trồng")}
              </Button>
            </div>
          </div>
          <div className="px-5 py-4">
            <RotationBuilder
              scenario={scenario}
              onChange={(s) => setDraft({ ...s, name: draft?.name ?? s.name })}
              screen={screen}
              resultsBySlot={resultsBySlot}
            />
            <p className="mt-3 text-xs text-ink-2">
              {L(
                "Every result updates as you edit. The fit score in the crop menu comes from this field's soil, season and climate.",
                "Mọi kết quả cập nhật ngay khi sửa. Điểm phù hợp trong danh sách cây dựa trên đất, mùa vụ và khí hậu của ruộng này.",
              )}
            </p>
          </div>
        </Card>
      </SectionPanel>

      </section>
      )}

      <Card style={{ animationDelay: "900ms" }} className="anim-rise relative isolate flex flex-col gap-3 overflow-hidden border-transparent bg-space-900 p-5 text-white md:flex-row md:items-center md:justify-between">
        <div aria-hidden className="absolute inset-0 -z-10 bg-stars opacity-40" />
        <div>
          <p className="eyebrow text-lime-bright">
            {L("Next step", "Bước tiếp theo")}
          </p>
          <p className="mt-0.5 text-lg font-bold">
            {L(
              `Put all plans side by side for ${year}`,
              `Đặt các cách trồng cạnh nhau cho năm ${year}`,
            )}
          </p>
          <p className="text-sm text-white/85">
            {L(
              "Weigh them by what matters most to you.",
              "Cân nhắc theo điều bạn coi trọng nhất.",
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/compare#cards"
            onClick={includeInComparison}
            className={buttonClass("primary", "lg")}
          >
            {L("Compare plans", "So sánh cách trồng")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/planner#calendar"
            className={buttonClass("glass", "lg")}
          >
            <ListChecks className="h-4 w-4" aria-hidden />
            {L("Make a season plan", "Lập kế hoạch mùa vụ")}
          </Link>
        </div>
      </Card>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * U12 · continuous climate test: rain ±% and warming in °C, applied to every
 * month of the real NASA POWER record. A sensitivity test, never a forecast.
 * ------------------------------------------------------------------------- */
function CustomClimateCard({
  active,
  value,
  onSelect,
  onChange,
}: {
  active: boolean;
  value: CustomClimate;
  onSelect: () => void;
  onChange: (c: Partial<CustomClimate>) => void;
}) {
  const { L, t, lang } = useI18n();
  const v = climateValues(lang, value);
  const lim = CUSTOM_CLIMATE_LIMITS;
  const rainTone =
    value.rainPct < 0
      ? "text-amber-ink"
      : value.rainPct > 0
        ? "text-water-ink"
        : "text-ink-2";
  return (
    <div
      className={cn(
        "col-span-2 rounded-xl border p-3 transition-colors",
        active
          ? "border-lime-ink bg-lime-soft ring-1 ring-lime-ink"
          : "border-dashed border-line hover:border-lime",
      )}
    >
      <button
        role="radio"
        aria-checked={active}
        onClick={onSelect}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-lime-ink" aria-hidden />
          {t("clim.custom")}
          <span className="rounded-full bg-lime px-1.5 text-[10px] font-bold text-space-900">
            {L("NEW", "MỚI")}
          </span>
        </span>
        <span className="text-xs font-bold tabular text-ink-2">
          {v.rain} · {v.temp}
        </span>
      </button>
      <p className="mt-0.5 text-[11px] leading-snug text-ink-2">
        {L(
          "Drag to test any rain change and warming you worry about.",
          "Kéo để thử bất kỳ mức mưa và nắng nóng nào bạn lo ngại.",
        )}
      </p>
      <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1">
              <CloudRain className="h-3.5 w-3.5 text-water-ink" aria-hidden />
              {L("Rainfall", "Lượng mưa")}
            </span>
            <output className={cn("tabular", rainTone)}>{v.rain}</output>
          </span>
          <input
            type="range"
            min={lim.rainPct.min}
            max={lim.rainPct.max}
            step={lim.rainPct.step}
            value={value.rainPct}
            onChange={(e) => onChange({ rainPct: Number(e.target.value) })}
            className="mt-1 w-full accent-lime-ink"
            aria-label={L(
              "Rainfall change in percent",
              "Thay đổi lượng mưa theo phần trăm",
            )}
          />
          <span className="flex justify-between text-[10px] text-ink-3">
            <span>
              {L("drier", "khô hơn")} {lim.rainPct.min}%
            </span>
            <span>
              +{lim.rainPct.max}% {L("wetter", "ẩm hơn")}
            </span>
          </span>
        </label>
        <label className="block">
          <span className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1">
              <ThermometerSun
                className="h-3.5 w-3.5 text-risk-ink"
                aria-hidden
              />
              {L("Warming", "Nóng thêm")}
            </span>
            <output
              className={cn(
                "tabular",
                value.deltaT > 0 ? "text-risk-ink" : "text-ink-2",
              )}
            >
              {v.temp}
            </output>
          </span>
          <input
            type="range"
            min={lim.deltaT.min}
            max={lim.deltaT.max}
            step={lim.deltaT.step}
            value={value.deltaT}
            onChange={(e) => onChange({ deltaT: Number(e.target.value) })}
            className="mt-1 w-full accent-[#B5524A]"
            aria-label={L(
              "Warming in degrees Celsius",
              "Mức nóng thêm theo độ C",
            )}
          />
          <span className="flex justify-between text-[10px] text-ink-3">
            <span>+{lim.deltaT.min} °C</span>
            <span>+{lim.deltaT.max} °C</span>
          </span>
        </label>
      </div>
    </div>
  );
}
