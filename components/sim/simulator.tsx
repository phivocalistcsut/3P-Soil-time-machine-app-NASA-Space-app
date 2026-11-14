"use client";

import { SoilCarbon } from "./soil-carbon";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
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
  ModelRainSource,
  CropIcon,
  FarmDemoNotice,
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
  StatTile,
  Strip,
  useSection,
} from "@/components/ui/sections";
import { TimelineSlider, RotationGantt } from "./timeline";
import { RotationBuilder, type ScreenResult } from "./rotation-builder";
import { OutcomePanel } from "./outcomes";
import { SoilProfile } from "./soil-profile";
import { useWhyReasons, WhyPanel } from "./why-panel";
import { MonthlyWaterChart, TrendCharts } from "./sim-charts";

const SOIL_COLORS = ["#D97167", "#E4A84C", "#A3ADA8", "#66AD79", "#287043"];
const STRESS_COLORS = ["#66AD79", "#E4A84C", "#D97167", "#A63F33"];
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
  const { L, t, crop, num, season } = useI18n();
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
  const [section, setSection] = useSection("simulator", SECTIONS, "results");
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
    setSection("edit");
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
    water: L(
      "Swap some flooded-rice seasons for upland crops that suit this field and need less water.",
      "Thay một số vụ lúa ngập bằng cây màu hợp với ruộng này và cần ít nước hơn.",
    ),
    soil: L(
      "Add bean crops and a green-manure crop to rest the soil and break continuous flooding.",
      "Thêm vụ cây họ đậu và cây phân xanh để đất được nghỉ, không ngập liên tục.",
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
  const seasonToCheck = result.waterRisk.worstSeason
    ?? result.seasons.find((s) => s.risks.includes("risk.dryYear"))?.season;
  const plannerHref = seasonToCheck ? `/planner#plan-season-${seasonToCheck}` : "/planner#calendar";
  const includeInComparison = () => {
    if (!compareIds.includes(scenario.id)) {
      setCompareIds([scenario.id, ...compareIds].slice(0, 3));
    }
  };

  const tabs = [
    {
      id: "results",
      icon: Gauge,
      label: L("All results", "Tất cả kết quả"),
      hint: L("8 indicators vs today", "8 chỉ số so với hiện tại"),
      tone: "blue" as const,
    },
    {
      id: "why",
      icon: Lightbulb,
      label: L("Why it changes", "Vì sao thay đổi?"),
      hint: L("Plain-language reasons", "Lý do bằng lời dễ hiểu"),
      tone: "green" as const,
    },
    {
      id: "calendar",
      icon: CalendarClock,
      label: L("12-month calendar", "Lịch 12 tháng"),
      hint: L("Bare & risky months", "Tháng trống, tháng rủi ro"),
      tone: "amber" as const,
    },
    {
      id: "evidence",
      icon: FileSearch,
      label: L("Evidence & questions", "Bằng chứng & câu hỏi"),
      hint: L("What to check locally", "Cần hỏi gì ở địa phương"),
      tone: "violet" as const,
    },
    {
      id: "map",
      icon: MapIcon,
      label: L("Field map", "Bản đồ ruộng"),
      hint: L("Field coloured by result", "Ruộng tô màu theo kết quả"),
      tone: "teal" as const,
    },
    {
      id: "charts",
      icon: BarChart3,
      label: L("Charts", "Biểu đồ"),
      hint: L("Year by year, month by month", "Theo năm, theo tháng"),
      tone: "earth" as const,
    },
    {
      id: "edit",
      icon: Pencil,
      label: L("Change the crops", "Chỉnh cách trồng"),
      hint: L("Swap crops & months", "Đổi cây, đổi tháng gieo"),
      tone: "leaf" as const,
      badge: draft ? "•" : undefined,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        tone="blue"
        icon={TrendingUp}
        eyebrow={L("5-year simulator", "Mô phỏng 5 năm")}
        title={L(
          "If you change what you plant, how could your field change?",
          "Nếu đổi cách trồng, ruộng có thể thay đổi ra sao?",
        )}
        desc={L(
          "Three simple steps: choose a plan, choose a year, choose the weather. Then open any topic below.",
          "Ba bước đơn giản: chọn cách trồng, chọn năm, chọn thời tiết. Sau đó mở chủ đề muốn xem bên dưới.",
        )}
        actions={
          <Link
            href="/compare#cards"
            onClick={includeInComparison}
            className={buttonClass(
              "primary",
              "md",
              "bg-white text-[#1F4F72] hover:bg-water-soft",
            )}
          >
            <Scale className="h-4 w-4" aria-hidden />
            {L("Compare plans", "So sánh cách trồng")}
          </Link>
        }
      />
      <FarmDemoNotice />
      <ClimateNotice climate={climate} />
      <ModelRainSource usesImerg={usesImerg} />

      {/* STEP 1 — plan */}
      <Card className="p-4 md:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2F6F9C] text-sm font-extrabold text-white">
              1
            </span>
            {L("Choose a planting plan", "Chọn cách trồng")}
          </h2>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={duplicate}>
              <Copy className="h-3.5 w-3.5" aria-hidden />
              {L("Make my own from this", "Tạo cách trồng riêng")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={del}
              disabled={scenarios.length <= 1}
              aria-label={L("Delete this plan", "Xóa cách trồng này")}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
        </div>
        <div
          className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-[repeat(auto-fit,minmax(230px,1fr))]"
          role="radiogroup"
          aria-label={L("Planting plans", "Các cách trồng")}
        >
          {scenarios.map((s, i) => {
            const active = s.id === scenario.id;
            const yr = output.results[s.id]?.years[ti];
            const c = scenarioColor(s, i);
            return (
              <button
                key={s.id}
                role="radio"
                aria-checked={active}
                onClick={() => setActive(s.id)}
                className={cn(
                  "min-w-[230px] overflow-hidden rounded-2xl border-2 bg-white text-left transition-all",
                  active
                    ? "shadow-[var(--shadow-float)]"
                    : "border-line hover:-translate-y-0.5",
                )}
                style={active ? { borderColor: c } : undefined}
              >
                <div className="h-2" style={{ background: c }} aria-hidden />
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold">{s.name}</span>
                    {yr && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white tabular"
                        style={{ background: c }}
                      >
                        {num(yr.overallScore)}/100
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    {Array.from({ length: s.cycleYears }, (_, yi) => (
                      <div key={yi} className="flex items-center gap-1">
                        {SEASON_ORDER.map((se) => {
                          const id =
                            s.seasonalCropSequence.find(
                              (x) => x.yearIndex === yi && x.season === se,
                            )?.cropId ?? null;
                          return (
                            <span
                              key={se}
                              className="flex flex-1 items-center gap-1 truncate rounded-md bg-sand px-1 py-0.5 text-[10.5px] font-medium"
                              title={crop(id)}
                            >
                              <CropIcon
                                cropId={id}
                                size={14}
                                className="rounded"
                              />
                              <span className="truncate">{shortCrop(id)}</span>
                            </span>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  {active && (
                    <p className="mt-2 text-[11.5px] leading-snug text-ink-2">
                      {kindText[s.kind]}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* STEP 2 + 3 — year & weather */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-base font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2F6F9C] text-sm font-extrabold text-white">
              2
            </span>
            {L("Choose a year", "Chọn năm")}
          </h2>
          <TimelineSlider
            years={years}
            results={sim!.years}
            value={year}
            onChange={setYear}
            climate={modelClimate}
            usesImerg={usesImerg}
            color={color}
          />
          <Card className="mt-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold">{L(`Water to plan for in ${year}`, `Nước tưới cần chuẩn bị năm ${year}`)}</h3>
              <StatusBadge status={result.dataStatus.waterDemand} withTip={false} />
            </div>
            <p className="mt-1 font-display text-2xl font-extrabold tabular">
              {num(result.waterDemand.m3PerHa * farm.areaHa)} <span className="text-sm">m³</span>
            </p>
            <p className="text-xs text-ink-2">{L(`Across your ${num(farm.areaHa, 2)} ha field`, `Cho toàn bộ ${num(farm.areaHa, 2)} ha ruộng`)}</p>
            {seasonToCheck && (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-ink" aria-hidden />
                {L(`Check water supply for ${season(seasonToCheck)}`, `Kiểm tra nguồn nước cho vụ ${season(seasonToCheck)}`)}
                <StressBadge level={result.waterRisk.level} />
              </p>
            )}
            <Link href={plannerHref} className={buttonClass("secondary", "md", "mt-3")}>
              {seasonToCheck ? L("See this season", "Xem lịch vụ này") : L("Open season calendar", "Mở lịch mùa vụ")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Card>
        </div>
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-base font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2F6F9C] text-sm font-extrabold text-white">
              3
            </span>
            {L("Choose the weather", "Chọn thời tiết")}
            <InfoTip>
              {L(
                "Simple, transparent changes applied to 10 years of real NASA POWER weather to test how sensitive each plan is. They are not NASA forecasts.",
                "Các điều chỉnh đơn giản, minh bạch áp lên 10 năm thời tiết thật của NASA POWER để thử độ nhạy của mỗi cách trồng. Đây không phải dự báo của NASA.",
              )}
            </InfoTip>
          </h2>
          <div
            className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-white p-3"
            role="radiogroup"
            aria-label={L("Weather", "Thời tiết")}
          >
            {climates.map((c) => (
              <button
                key={c.id}
                role="radio"
                aria-checked={assumption === c.id}
                onClick={() => setClimate(c.id)}
                className={cn(
                  "rounded-xl border p-2.5 text-left transition-colors",
                  assumption === c.id
                    ? "border-transparent bg-[#2F6F9C] text-white"
                    : "border-line hover:border-water",
                )}
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <c.icon className="h-4 w-4" aria-hidden />
                  {t(`clim.${c.id}`)}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-[11px] leading-snug",
                    assumption === c.id ? "text-white/85" : "text-ink-2",
                  )}
                >
                  {t(`clim.${c.id}.def`)}
                </span>
              </button>
            ))}
            <CustomClimateCard
              active={assumption === "custom"}
              value={customClimate}
              onSelect={() => setClimate("custom")}
              onChange={setCustomClimate}
            />
          </div>
        </div>
      </div>

      {/* HEADLINE RESULT */}
      <div className="rounded-3xl border border-line bg-white/80 p-4 backdrop-blur">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold">
            <span
              className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle"
              style={{ background: color }}
              aria-hidden
            />
            {scenario.name} · {year}
            {draft && <Badge tone="amber" className="ml-2">{L("Unsaved preview", "Bản xem trước chưa lưu")}</Badge>}
            {result.isBaselineYear && (
              <span className="ml-2 text-xs font-medium text-ink-2">
                (
                {L(
                  "today — same for every plan",
                  "hiện tại — mọi cách trồng như nhau",
                )}
                )
              </span>
            )}
          </p>
          <StatusBadge status={output.climateStatus} />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            tone="blue"
            icon={Droplets}
            label={L("Irrigation water", "Nước tưới")}
            value={num(result.waterDemand.median)}
            unit={L("mm/year", "mm/năm")}
            note={
              Math.abs(dWater) < 5
                ? L("same as today", "như hiện tại")
                : L(
                    `${dWater < 0 ? "−" : "+"}${num(Math.abs(dWater))} mm vs today`,
                    `${dWater < 0 ? "ít hơn" : "nhiều hơn"} ${num(Math.abs(dWater))} mm so với hiện tại`,
                  )
            }
          />
          <StatTile
            tone="amber"
            icon={ShieldAlert}
            label={L("Water shortage risk", "Nguy cơ thiếu nước")}
            value={<StressBadge level={result.waterRisk.level} />}
            note={L(
              `today: ${t(`stress.${refResult.waterRisk.level}`)}`,
              `hiện tại: ${t(`stress.${refResult.waterRisk.level}`)}`,
            )}
          />
          <StatTile
            tone="green"
            icon={Sprout}
            label={t("rothc.title")}
            value={<SoilCarbon result={result} compact />}
            note={t("rothc.limit")}
          />
          <StatTile
            tone="violet"
            icon={Gauge}
            label={L("Overall score", "Điểm tổng hợp")}
            value={num(result.overallScore)}
            unit="/100"
            note={L(
              `today: ${num(refResult.overallScore)}`,
              `hiện tại: ${num(refResult.overallScore)}`,
            )}
          />
        </div>
      </div>

      <SectionTabs
        tabs={tabs}
        value={section}
        onChange={setSection}
        label={L("Result topics", "Chủ đề kết quả")}
      />

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

      <Card className="flex flex-col gap-3 bg-gradient-to-r from-[#1F4F72] to-[#2F6F9C] p-5 text-white md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/75">
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
            className={buttonClass(
              "primary",
              "md",
              "bg-white text-[#1F4F72] hover:bg-water-soft",
            )}
          >
            {L("Compare plans", "So sánh cách trồng")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/planner#calendar"
            className={buttonClass(
              "outline",
              "md",
              "border-white/40 bg-transparent text-white hover:bg-white/10",
            )}
          >
            <ListChecks className="h-4 w-4" aria-hidden />
            {L("Make a season plan", "Lập kế hoạch mùa vụ")}
          </Link>
        </div>
      </Card>
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
          ? "border-[#2F6F9C] bg-gradient-to-br from-water-soft to-white ring-1 ring-[#2F6F9C]"
          : "border-dashed border-line hover:border-water",
      )}
    >
      <button
        role="radio"
        aria-checked={active}
        onClick={onSelect}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-[#2F6F9C]" aria-hidden />
          {t("clim.custom")}
          <span className="rounded-full bg-[#2F6F9C] px-1.5 text-[10px] font-bold text-white">
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
            className="mt-1 w-full accent-[#2F6F9C]"
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
