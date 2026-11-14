"use client";

import { useRef } from "react";
import { ArrowRight, CalendarDays, Check, ChevronRight, CircleAlert, Droplets, Leaf, MousePointer2, Sprout } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getCrop } from "@/lib/data/crops";
import { planSeasonBar, planSeasonPeriod } from "@/lib/data/plan-calendar";
import type { SeasonId, SimulationResult } from "@/lib/types";
import { CropIcon, StatusBadge, SuitBadge } from "@/components/common";
import { Badge, Card, cn } from "@/components/ui/primitives";

export function PlanCalendar({ results, selectedYear, selectedSeason, onSelectYear, onSelectSeason, areaHa }: {
  results: SimulationResult[]; selectedYear: number; selectedSeason: SeasonId;
  onSelectYear: (year: number) => void;
  onSelectSeason: (year: number, season: SeasonId) => void;
  areaHa: number;
}) {
  const { L, lang, num, crop, cropShort, month, season, t } = useI18n();
  const details = useRef<HTMLDivElement>(null);
  const year = results.find(r => r.year === selectedYear) ?? results[0];
  const current = year.seasons.find(s => s.season === selectedSeason) ?? year.seasons[0];
  const plant = getCrop(current.cropId);
  const growing = !!plant && plant.id !== "fallow" && current.durationDays > 0;
  const dates = growing ? planSeasonPeriod(current) : null;
  const date = (d: Date) => d.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const distinct = [...new Set(results.flatMap(r => r.seasons.map(s => s.cropId)))].map(getCrop).filter(c => c && c.id !== "fallow");
  const select = (y: number, s: SeasonId) => {
    onSelectSeason(y, s);
    if (window.matchMedia("(max-width: 1279px)").matches) {
      requestAnimationFrame(() => details.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
    }
  };

  return <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,1fr)]">
    <Card className="min-w-0 overflow-hidden rounded-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-gradient-to-br from-[#f1f6e9] to-white p-5 md:p-6">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-lime-ink"><CalendarDays className="h-4 w-4" aria-hidden />{L("Your rotation at a glance", "Toàn cảnh luân canh")}</p>
          <h2 className="text-xl font-bold text-forest md:text-2xl">{L("Your calendar, year by year", "Lịch canh tác theo năm")}</h2>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-2"><MousePointer2 className="h-3.5 w-3.5 shrink-0" aria-hidden />{L("Select a crop bar to see dates, water and reminders.", "Bấm vào một vụ để xem lịch, nước tưới và lưu ý.")}</p>
        </div>
        <Badge tone="outline">{results[0].year} <ArrowRight className="mx-1 h-3 w-3" aria-hidden /> {results.at(-1)!.year}</Badge>
      </div>
      <div className="overflow-x-auto p-3 pb-4 md:p-5" role="region" aria-label={L("Scrollable rotation calendar", "Lịch luân canh có thể cuộn ngang")} tabIndex={0}>
        <div className="min-w-[650px]">
          <div className="ml-[68px] grid grid-cols-14 gap-0 text-center text-[10px] font-semibold text-ink-3">
            <span className="col-span-2 rounded-t-lg bg-sand-2 py-1">{L("Previous year", "Năm trước")}</span>
            <span className="col-span-12 py-1">{L("Calendar year shown in each row", "Năm tương ứng với từng hàng")}</span>
          </div>
          <div className="mb-2 ml-[68px] grid grid-cols-14 text-center text-[11px] font-semibold text-ink-2">
            {[11,12,1,2,3,4,5,6,7,8,9,10,11,12].map((m,i) => <span key={i} className={cn("border-l border-line py-2", i < 2 && "bg-sand text-ink-3")}>{month(m)}</span>)}
          </div>
          {results.map(row => { const overlapping = row.seasons.some(s => s.overlap); const height = overlapping ? 160 : 68; return <div key={row.year} style={{ minHeight: height }} className={cn("relative mb-2 flex items-center rounded-2xl border transition-colors", row.year === year.year ? "border-lime/60 bg-lime-soft/65" : "border-transparent bg-sand/55")}>
            <button onClick={() => onSelectYear(row.year)} aria-label={L(`Select plan year ${row.year}`, `Chọn năm kế hoạch ${row.year}`)} aria-pressed={row.year === year.year}
              style={{ height: height - 2 }} className={cn("sticky left-0 z-10 flex w-[68px] shrink-0 flex-col items-center justify-center rounded-l-2xl text-sm font-bold tabular transition-colors", row.year === year.year ? "bg-forest text-white" : "bg-sand text-ink-2 hover:bg-sand-2")}>
              {row.year}<span className={cn("mt-0.5 text-[9px] font-medium", row.year === year.year ? "text-white/70" : "text-ink-3")}>{row.isBaselineYear ? L("Starting year", "Năm gốc") : row.year === year.year ? L("Selected", "Đang xem") : ""}</span>
            </button>
            <div style={{ height: height - 2 }} className="relative flex-1 bg-[linear-gradient(to_right,#dfe5dc_1px,transparent_1px)] bg-[length:calc(100%/14)_100%]">
              {row.seasons.map((s, index) => {
                const c = getCrop(s.cropId), position = planSeasonBar(s, row.year);
                if (!c || c.id === "fallow" || !position) return null;
                const active = row.year === year.year && current.season === s.season;
                return <button key={s.slotId} onClick={() => select(row.year,s.season)} aria-pressed={active}
                  aria-label={`${row.year} · ${season(s.season)} · ${crop(s.cropId)}`}
                  title={`${season(s.season)} · ${crop(s.cropId)} · ${s.durationDays} ${L("days", "ngày")}`}
                  className={cn("absolute top-2.5 flex h-11 items-center gap-1.5 overflow-hidden rounded-xl border px-2 text-left text-xs font-bold text-ink transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:z-20", active ? "z-10 ring-2 ring-forest ring-offset-2" : "", s.overlap && "outline outline-2 outline-risk")}
                  style={{ left: `${position.left}%`, top: overlapping ? 8 + index * 48 : 10, width: `calc(${position.width}% - 5px)`, backgroundColor: active ? "white" : `${c.color}25`, borderColor: `${c.color}85`, borderLeftWidth: 4 }}>
                  {position.clippedStart && <span aria-hidden>‹</span>}
                  <CropIcon cropId={s.cropId} size={24} />
                  <span className="min-w-0"><span className="block truncate">{cropShort(c.id)}</span><span className="block truncate text-[9px] font-medium text-ink-2">{season(s.season)}</span></span>
                  {active && <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-forest" aria-hidden />}
                  {position.clippedEnd && <span aria-hidden>›</span>}
                  {s.overlap && <CircleAlert className="h-3.5 w-3.5 shrink-0 text-risk-ink" aria-label={L("Overlapping dates", "Lịch chồng lấn")} />}
                </button>;
              })}
            </div>
          </div>; })}
        </div>
      </div>
      <div className="border-t border-line px-5 py-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2">{distinct.map(c => c && <span key={c.id} className="flex items-center gap-1.5 text-xs font-medium text-ink-2"><CropIcon cropId={c.id} size={22} />{crop(c.id)}</span>)}</div>
        <p className="mt-3 text-xs leading-relaxed text-ink-3">{L("Crop year: December of the previous year to November. The extra edge months show crops crossing that boundary. Blank areas have no planted crop; use the season buttons to inspect fallow seasons.", "Năm vụ: từ tháng 12 năm trước đến tháng 11. Hai đầu lịch mở rộng để thấy vụ giao năm. Vùng trống không có cây; có thể chọn từng vụ ở bảng chi tiết để xem đất nghỉ.")}</p>
      </div>
    </Card>

    <div ref={details} id={`plan-season-${current.season}`} tabIndex={-1} className="min-w-0 scroll-mt-24 space-y-4 outline-none xl:sticky xl:top-24">
      <Card className="overflow-hidden rounded-3xl">
        <div className="border-b border-line p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-ink-2"><Sprout className="h-4 w-4 text-lime-ink" aria-hidden />{L("Season details", "Chi tiết mùa vụ")} · {year.year}</p>
          <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-sand p-1" role="group" aria-label={L("Select a season", "Chọn mùa vụ")}>
            {year.seasons.map(s => <button key={s.slotId} onClick={() => onSelectSeason(year.year,s.season)} aria-pressed={current.season === s.season}
              className={cn("min-h-11 rounded-xl px-1 py-2 text-xs font-semibold transition-colors", current.season === s.season ? "bg-white text-forest shadow-sm" : "text-ink-2 hover:bg-white/60")}>{season(s.season)}</button>)}
          </div>
          <div className="mt-5 flex items-center gap-3" aria-live="polite">
            <CropIcon cropId={current.cropId} size={52} />
            <div className="min-w-0"><h3 className="text-2xl font-bold leading-tight text-forest">{crop(current.cropId)}</h3><p className="mt-1 text-xs text-ink-2">{season(current.season)} · {year.year}</p></div>
          </div>
          {growing && <div className="mt-3"><SuitBadge cls={current.suitability.cls} /></div>}
        </div>
        <div className="space-y-4 p-5">
          {dates ? <>
            <div className="grid grid-cols-[20px_1fr] gap-x-3 text-sm">
              <div className="flex flex-col items-center pt-1" aria-hidden><span className="h-2.5 w-2.5 rounded-full bg-lime" /><span className="my-1 h-7 w-px bg-line" /><span className="h-2.5 w-2.5 rounded-full bg-earth" /></div>
              <div><p className="text-[11px] text-ink-3">{L("Planned planting", "Dự kiến gieo trồng")}</p><p className="font-semibold">{date(dates.start)}</p><p className="mt-3 text-[11px] text-ink-3">{plant?.category === "green_manure" ? L("Planned season end", "Dự kiến kết thúc vụ") : L("Estimated harvest", "Dự kiến thu hoạch")}</p><p className="font-semibold">{date(dates.end)}</p></div>
            </div>
            <p className="text-xs text-ink-2">{num(current.durationDays)} {L("growing days · confirm dates locally", "ngày sinh trưởng · cần xác nhận lịch tại ruộng")}</p>
          </> : <p className="rounded-xl bg-sand p-3 text-sm text-ink-2">{L("No planted crop in this season. Planting and harvest dates are not assigned.", "Vụ này chưa bố trí cây trồng, không có lịch gieo và thu hoạch.")}</p>}
          <div className="rounded-2xl bg-water-soft/70 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-water-ink"><Droplets className="h-4 w-4" aria-hidden />{L("Estimated irrigation · this season", "Nước tưới ước tính · vụ này")}</p>
            <p className="mt-2 text-3xl font-extrabold text-forest tabular">{num(current.irrigation.median*10*areaHa)} <span className="text-base font-medium">m³</span></p>
            <p className="mt-1 text-xs text-ink-2">{L(`For the whole ${num(areaHa,2)} ha field`, `Cho cả ruộng ${num(areaHa,2)} ha`)}</p>
            {growing && <p className="mt-2 text-[11px] leading-relaxed text-ink-2">{L("Historical-weather range", "Khoảng theo thời tiết lịch sử")}: {num(current.irrigation.p10*10*areaHa)}–{num(current.irrigation.p90*10*areaHa)} m³</p>}
          </div>
          {current.overlap && <p className="flex items-start gap-2 rounded-xl bg-risk-soft p-3 text-xs leading-relaxed text-risk-ink"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{L("Dates overlap another crop. Adjust the sequence before using this plan.", "Lịch đang chồng lấn với cây khác. Cần chỉnh chuỗi cây trồng trước khi dùng kế hoạch.")}</p>}
          {current.risks.length > 0 && <div className="rounded-xl border border-amber/30 bg-amber-soft/65 p-3 text-xs text-amber-ink"><p className="mb-2 flex items-center gap-1.5 font-bold"><CircleAlert className="h-4 w-4" aria-hidden />{L("Before you plant", "Lưu ý trước khi gieo")}</p><ul className="space-y-1.5">{current.risks.map(r => <li key={r} className="flex items-start gap-1.5"><ChevronRight className="mt-0.5 h-3 w-3 shrink-0" aria-hidden /><span>{t(r)}</span></li>)}</ul></div>}
          {growing && <div><p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-forest"><Leaf className="h-4 w-4" aria-hidden />{L("Crop notes", "Thông tin cây trồng")}</p><p className="text-sm leading-relaxed text-ink-2">{plant.agronomicProperties.note[lang]}</p></div>}
          <p className="border-t border-line pt-3 text-xs leading-relaxed text-ink-3">{L("Confirm planting dates, seed availability and water supply with your local adviser.", "Xác nhận lịch gieo, nguồn giống và nguồn nước với người tư vấn tại địa phương.")}</p>
          <StatusBadge status={year.dataStatus.waterDemand} withTip={false} />
        </div>
      </Card>
    </div>
  </div>;
}
