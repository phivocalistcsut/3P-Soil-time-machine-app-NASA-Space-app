"use client";

import { FlaskConical, Satellite } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { ClimateDataset, SimulationResult } from "@/lib/types";
import { Slider } from "@/components/ui/overlays";
import { CropIcon } from "@/components/common";
import { cn } from "@/components/ui/primitives";
import { getCrop } from "@/lib/data/crops";

/** The prominent "time travel" control: observed record → today → modeled years. */
export function TimelineSlider({
  years,
  results,
  value,
  onChange,
  climate,
  color,
  usesImerg,
}: {
  years: number[];
  results: SimulationResult[];
  value: number;
  onChange: (y: number) => void;
  climate: ClimateDataset | null;
  color: string;
  usesImerg: boolean;
}) {
  const { L, crop } = useI18n();
  const start = years[0];
  const end = years[years.length - 1];
  const historical = climate && climate.status !== "illustrative";
  const sourceLabel = historical
    ? L("Past weather record", "Dữ liệu thời tiết quá khứ")
    : L("Example weather inputs", "Dữ liệu thời tiết minh họa");
  const SourceIcon = historical ? Satellite : FlaskConical;
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-2">{L("Simulation year", "Năm mô phỏng")}</p>
          <p className="font-display text-3xl font-extrabold leading-none text-forest tabular value-transition" aria-live="polite">
            {value}
            <span className="ml-2 align-middle text-sm font-semibold text-ink-2">
              {value === start ? L("Starting year · usual crops", "Năm gốc · cây thường trồng") : L(`Year ${value - start} of the plan`, `Năm thứ ${value - start} của cách trồng`)}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1", historical ? "bg-water-soft text-water-ink" : "bg-amber-soft text-amber-ink")}>
            <SourceIcon className="h-3 w-3" aria-hidden />
            {sourceLabel} {historical && climate ? `· NASA POWER${usesImerg ? " + IMERG" : ""} ${climate.period.join("–")}` : ""}
          </span>
        </div>
      </div>

      <div className="flex items-stretch gap-3">
        <div className="min-w-0 flex-1">
          <Slider
            value={value}
            min={start}
            max={end}
            onValueChange={onChange}
            label={L("Simulation year", "Năm mô phỏng")}
            valueText={String(value)}
            className="h-11"
            trackClassName="h-2.5 bg-[repeating-linear-gradient(90deg,#DDF0E2_0_10px,#eef6f0_10px_20px)]"
            rangeClassName="bg-forest"
            thumbClassName="h-7 w-7 border-[3px]"
          />
          <div className="mt-2 grid" style={{ gridTemplateColumns: `repeat(${years.length}, minmax(0,1fr))` }}>
            {years.map((y, i) => {
              const r = results[i];
              const active = y === value;
              return (
                <button
                  key={y}
                  onClick={() => onChange(y)}
                  aria-pressed={active}
                  aria-label={`${y}: ${r?.seasons.map((s) => crop(s.cropId)).join(", ")}`}
                  className={cn(
                    "flex min-h-11 flex-col items-center gap-1 rounded-xl px-0.5 py-1.5 transition-colors",
                    active ? "bg-mint/70" : "hover:bg-sand",
                  )}
                >
                  <span className={cn("text-xs font-bold tabular", active ? "text-forest" : "text-ink-2")}>{y}</span>
                  <span className="hidden gap-0.5 sm:flex">
                    {r?.seasons.map((s) => (
                      <span key={s.slotId} className="relative">
                        <CropIcon cropId={s.cropId} size={16} className="rounded-md" />
                        {s.overlap && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-risk" aria-hidden />}
                      </span>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-2 h-1 rounded-full" style={{ background: color, opacity: 0.85 }} aria-hidden />
    </div>
  );
}

/** Seasonal land-cover timeline: month-by-month crop bars for every year of the horizon. */
export function RotationGantt({ results, selectedYear, onSelect }: { results: SimulationResult[]; selectedYear: number; onSelect: (y: number) => void }) {
  const { L, month, crop, cropShort } = useI18n();
  const months = [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[64px_repeat(14,minmax(0,1fr))] text-[10px] font-medium text-ink-3">
          <span />
          {months.map((m, i) => (
            <span key={i} className={cn("border-l border-line pl-1", i === 2 && "border-ink-3")}>
              {month(m)}
            </span>
          ))}
        </div>
        {results.map((r) => (
          <button
            key={r.year}
            onClick={() => onSelect(r.year)}
            aria-pressed={r.year === selectedYear}
            className={cn(
              "relative mt-1 grid h-9 w-full grid-cols-[64px_repeat(14,minmax(0,1fr))] items-center rounded-lg text-left",
              r.year === selectedYear ? "bg-mint/60" : "hover:bg-sand",
            )}
          >
            <span className="pl-2 text-xs font-semibold tabular">
              {r.year}
              {r.isBaselineYear && <span className="block text-[9px] font-medium text-ink-3">{L("today", "hiện tại")}</span>}
            </span>
            {r.seasons.map((s) => {
              const c = getCrop(s.cropId);
              if (!c) return null;
              const startIdx = s.startOffset + 1; // Nov(prev) = 0
              const span = s.durationDays / 30.4;
              return (
                <span
                  key={s.slotId}
                  className={cn("absolute flex h-6 items-center gap-1 overflow-hidden rounded-md px-1.5 text-[10px] font-semibold text-white", s.overlap && "ring-2 ring-risk")}
                  style={{
                    left: `calc(64px + (100% - 64px) * ${startIdx / 14})`,
                    width: `calc((100% - 64px) * ${Math.min(span, 14 - startIdx) / 14} - 2px)`,
                    background: c.id === "fallow" ? "#A3ADA8" : c.color,
                  }}
                  title={`${crop(c.id)} · ${s.durationDays} ${L("days", "ngày")}`}
                >
                  <span className="truncate">{cropShort(c.id)}</span>
                </span>
              );
            })}
          </button>
        ))}
        <p className="mt-2 text-[10px] text-ink-3">
          {L("Crop year runs from December to November. Bars show planting to harvest; red outline = overlap with the next crop.", "Năm mùa vụ tính từ tháng 12 đến tháng 11. Thanh thể hiện từ gieo đến thu hoạch; viền đỏ = chồng lấn với vụ sau.")}
        </p>
      </div>
    </div>
  );
}
