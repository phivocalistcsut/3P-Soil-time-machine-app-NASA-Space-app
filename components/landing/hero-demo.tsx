"use client";

import { useMemo, useState } from "react";
import { Droplets, FlaskConical, Sprout } from "lucide-react";
import { FarmMap } from "@/components/map/farm-map";
import { Slider } from "@/components/ui/overlays";
import { CropIcon } from "@/components/common";
import { ChartTooltip, AXIS, GRID } from "@/components/charts";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { SoilCarbon } from "@/components/sim/soil-carbon";
import { useI18n } from "@/lib/i18n";
import { createDemoFarm, buildDefaultScenarios, weightsFromPriorities } from "@/lib/data/demo";
import { getDemoSnapshot } from "@/lib/data/climate-datasets";
import { runEngine } from "@/lib/engine/simulate";
import { cn } from "@/components/ui/primitives";
import type { SimulationSettings } from "@/lib/types";

const SOIL_COLORS = ["#D97167", "#E4A84C", "#A3ADA8", "#66AD79", "#287043"];

/** Live mini-simulator on the landing page (demo farm + cached real NASA POWER data). */
export function HeroDemo() {
  const { L, num, cropShort, season } = useI18n();
  const startYear = new Date().getFullYear();
  const sim = useMemo(() => {
    const farm = createDemoFarm();
    const climate = getDemoSnapshot();
    const settings: SimulationSettings = {
      startYear,
      horizon: 5,
      climateAssumption: "baseline",
      weights: weightsFromPriorities(farm.farmerPriorities),
      economics: {},
    };
    const scenarios = buildDefaultScenarios(farm, climate, settings);
    const out = runEngine({ farm, scenarios, climate, settings });
    return { farm, scenarios, out };
  }, [startYear]);
  const [future, setFuture] = useState<"scenario-a" | "scenario-c">("scenario-c");
  const [year, setYear] = useState(startYear + 3);
  const ti = year - startYear;
  const res = sim.out.results[future].years[ti];
  const other = sim.out.results[future === "scenario-a" ? "scenario-c" : "scenario-a"].years[ti];
  const data = sim.out.years.map((y, i) => ({
    year: y,
    a: sim.out.results["scenario-a"].years[i].waterDemand.median,
    c: sim.out.results["scenario-c"].years[i].waterDemand.median,
  }));
  const level = res.soilImprovementPotential?.level;

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,.55)]">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-sand px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E8B4AE]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#F0D49E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#B7D9C0]" />
          <span className="ml-2 text-xs font-semibold text-ink">{L("5-year simulator", "Mô phỏng 5 năm")} · Thới Lai, Cần Thơ</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-ink">
          <FlaskConical className="h-3 w-3" aria-hidden /> {L("Illustrative demo", "Demo minh họa")}
        </span>
      </div>
      <div className="grid md:grid-cols-[1.35fr_1fr]">
        <div className="relative h-[260px] md:h-[380px]">
          <FarmMap
            center={[sim.farm.longitude, sim.farm.latitude]}
            zoom={15.6}
            basemap="satellite"
            boundary={sim.farm.boundary}
            fieldFill={{ color: level ? SOIL_COLORS[level - 1] : "#A3ADA8", opacity: 0.55 }}
            className="absolute inset-0"
            scrollZoom={false}
            attributionPosition="top-right"
            ariaLabel={L("Satellite map of the demo field", "Bản đồ vệ tinh ruộng mẫu")}
          />
          <div className="pointer-events-none absolute left-3 top-3 max-w-[70%] rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] shadow-sm">
            <p className="font-semibold text-ink">
              {L("Field tint = modeled soil outlook", "Màu ruộng = triển vọng đất (mô phỏng)")} · {year}
            </p>
            <p className="text-ink-3">{L("Imagery: Sentinel-2 cloudless 2023 (does not change)", "Ảnh: Sentinel-2 cloudless 2023 (không đổi)")}</p>
          </div>
          <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/95 p-3 shadow-[var(--shadow-float)] backdrop-blur">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-ink">{L("Drag to pick a year", "Kéo để chọn năm")}</span>
              <span className="font-display text-base font-bold text-forest tabular">{year}</span>
            </div>
            <Slider value={year} min={startYear} max={startYear + 5} onValueChange={setYear} label={L("Simulation year", "Năm mô phỏng")} valueText={String(year)} />
            <div className="mt-1 flex justify-between text-[10px] text-ink-3 tabular">
              {sim.out.years.map((y) => (
                <span key={y}>{y}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div role="group" aria-label={L("Choose a future", "Chọn tương lai")} className="grid grid-cols-2 gap-1.5 rounded-xl bg-sand-2 p-1">
            {(
              [
                ["scenario-a", L("Climate fit", "Hợp khí hậu"), "#B57B38"],
                ["scenario-c", L("Soil restoration", "Phục hồi đất"), "#287043"],
              ] as const
            ).map(([id, label, color]) => (
              <button
                key={id}
                aria-pressed={future === id}
                onClick={() => setFuture(id)}
                className={cn("flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors", future === id ? "bg-white text-ink shadow-sm" : "text-ink-2")}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {res.seasons.map((s) => (
              <div key={s.slotId} className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-line px-1 py-2 text-center">
                <CropIcon cropId={s.cropId} size={28} />
                <span className="line-clamp-1 text-[11px] font-semibold text-ink">{cropShort(s.cropId)}</span>
                <span className="text-[10px] text-ink-3">{season(s.season)}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-water-soft p-2.5">
              <p className="flex items-center gap-1 text-[11px] font-medium text-water-ink">
                <Droplets className="h-3.5 w-3.5" aria-hidden /> {L("Irrigation need", "Nhu cầu tưới")}
              </p>
              <p className="font-display text-xl font-bold text-ink tabular value-transition">
                {num(res.waterDemand.median, 0)} <span className="text-xs font-medium text-ink-2">mm/{L("yr", "năm")}</span>
              </p>
              <p className="text-[10px] text-ink-2">
                {L("vs other future", "so với tương lai kia")} {num(res.waterDemand.median - other.waterDemand.median, 0)} mm
              </p>
            </div>
            <div className="rounded-xl bg-mint/60 p-2.5">
              <p className="mb-1 flex items-center gap-1 text-[11px] font-medium text-leaf-ink">
                <Sprout className="h-3.5 w-3.5" aria-hidden /> {L("Soil outlook", "Triển vọng đất")}
              </p>
              <SoilCarbon result={res} compact />
            </div>
          </div>
          <div className="h-[110px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="year" {...AXIS} tick={{ ...AXIS.tick, fontSize: 10 }} />
                <YAxis {...AXIS} tick={{ ...AXIS.tick, fontSize: 10 }} width={42} />
                <Tooltip content={<ChartTooltip unit="mm" />} />
                <ReferenceLine x={year} stroke="#174D3A" strokeDasharray="3 3" />
                <Line dataKey="a" name={L("Climate fit", "Hợp khí hậu")} stroke="#B57B38" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line dataKey="c" name={L("Soil restoration", "Phục hồi đất")} stroke="#287043" strokeWidth={2} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] leading-snug text-ink-3">
            {L(
              "Estimated net irrigation (mm/yr) from NASA POWER 2016–2025 climate. Modeled scenario — not a prediction.",
              "Nhu cầu tưới ròng ước tính (mm/năm) từ khí hậu NASA POWER 2016–2025. Kịch bản mô phỏng — không phải dự báo.",
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
