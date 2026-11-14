"use client";

import { ArrowRight, CalendarDays, Check, ChevronDown, CircleAlert, Droplets, Leaf, ShieldCheck, Sprout } from "lucide-react";
import { CropIcon, StatusBadge } from "@/components/common";
import { SoilCarbon } from "@/components/sim/soil-carbon";
import { Button, Card, cn } from "@/components/ui/primitives";
import { getCrop } from "@/lib/data/crops";
import { planSeasonPeriod } from "@/lib/data/plan-calendar";
import { useI18n } from "@/lib/i18n";
import type { SeasonId, SimulationResult } from "@/lib/types";

type ShowSeason = (year: number, season: SeasonId) => void;

function WaterRisk({ level }: { level: 0 | 1 | 2 | 3 }) {
  const { L, t } = useI18n();
  const Icon = level === 0 ? ShieldCheck : CircleAlert;
  return <p className={cn("flex items-start gap-2 text-base font-semibold leading-relaxed", level === 0 ? "text-forest" : level === 1 ? "text-[#72450b]" : "text-[#92352a]")}>
    <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
    <span>{L("Water shortage risk", "Nguy cơ thiếu nước")}: {t(`stress.${level}`)}</span>
  </p>;
}

export function PlanSeasons({ result, cycleYears, areaHa, onShowSeason }: {
  result: SimulationResult; cycleYears: number; areaHa: number; onShowSeason: ShowSeason;
}) {
  const { L, t, lang, num, crop, season, month } = useI18n();
  const monthYear = (d: Date) => `${month(d.getUTCMonth() + 1)} ${d.getUTCFullYear()}`;
  const tolerance = (value: "high" | "moderate" | "low") => ({ high: L("High", "Cao"), moderate: L("Moderate", "Vừa"), low: L("Low", "Thấp") })[value];
  return <section className="space-y-5" aria-labelledby="plan-seasons-title">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 id="plan-seasons-title" className="text-2xl font-bold text-forest md:text-[28px]">{L(`Your three seasons in ${result.year}`, `Ba mùa vụ năm ${result.year}`)}</h2>
        <p className="mt-2 max-w-3xl text-base leading-relaxed text-ink">{result.isBaselineYear
          ? L("Starting year: the crops you currently grow.", "Năm gốc: các cây bạn đang trồng.")
          : L(`The ${cycleYears}-year rotation repeats across your plan. Change the year above to see each season.`, `Chu kỳ luân canh ${cycleYears} năm được lặp lại trong kế hoạch. Đổi năm ở phía trên để xem các mùa vụ.`)}</p></div>
      <StatusBadge status="estimated" withTip={false} className="px-3 py-1 text-sm" />
    </div>
    <div className="grid items-start gap-5 xl:grid-cols-3">
      {result.seasons.map((s, index) => {
        const c = getCrop(s.cropId);
        const growing = c && c.id !== "fallow" && s.durationDays > 0;
        const dates = growing ? planSeasonPeriod(s) : null;
        const SuitIcon = s.suitability.cls === "good" ? ShieldCheck : CircleAlert;
        const risks = [...s.risks];
        if (s.overlap && !risks.includes("planner.overlap")) risks.push("planner.overlap");
        return <Card key={s.slotId} className="overflow-hidden rounded-3xl border-[#cbd5cd]">
          <div className="border-b border-[#cbd5cd] bg-[#f4f7ef] p-5 md:p-6">
            <p className="flex items-center gap-2 text-lg font-bold text-forest"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-base text-white" aria-hidden>{index + 1}</span>{season(s.season)}</p>
            <div className="mt-4 flex items-center gap-3"><CropIcon cropId={s.cropId} size={52} /><h3 className="text-[26px] font-bold leading-tight text-ink">{crop(s.cropId)}</h3></div>
            {growing && <p className={cn("mt-3 flex items-center gap-2 text-base font-semibold", s.suitability.cls === "good" ? "text-forest" : "text-[#72450b]")}><SuitIcon className="h-5 w-5 shrink-0" aria-hidden />{t(`suit.${s.suitability.cls}`)}</p>}
          </div>
          <div className="space-y-5 p-5 text-base leading-relaxed text-ink md:p-6">
            <div className="flex items-start gap-3"><CalendarDays className="mt-1 h-6 w-6 shrink-0 text-forest" aria-hidden /><div><p className="font-bold">{L("Planned season", "Lịch dự kiến")}</p>{dates ? <><p className="mt-1 font-semibold">{monthYear(dates.start)} → {monthYear(dates.end)}</p><p>{num(s.durationDays)} {L("growing days", "ngày sinh trưởng")}</p></> : <p className="mt-1">{L("No planting scheduled for this season.", "Vụ này chưa bố trí cây trồng.")}</p>}</div></div>
            <div className="rounded-2xl border border-[#bad2e2] bg-[#edf5fb] p-4 text-[#173e59]">
              <p className="flex items-center gap-2 font-bold"><Droplets className="h-5 w-5 shrink-0" aria-hidden />{L("Irrigation for your field", "Nước tưới cho cả ruộng")}</p>
              <p className="mt-2 text-[32px] font-extrabold leading-tight tabular">{num(s.irrigation.median * 10 * areaHa)} <span className="text-lg font-semibold">m³ / {L("season", "vụ")}</span></p>
              <p className="mt-2">{num(areaHa, 2)} ha · {num(s.irrigation.median)} mm</p>
              {growing && <p className="mt-2 border-t border-[#bad2e2] pt-2">{L("Historical-weather range", "Khoảng theo thời tiết lịch sử")}:<br /><strong className="tabular">{num(s.irrigation.p10 * 10 * areaHa)}–{num(s.irrigation.p90 * 10 * areaHa)} m³</strong></p>}
            </div>
            {growing && <WaterRisk level={s.stressLevel} />}
            <div className={cn("rounded-2xl border p-4", risks.length ? "border-[#dcb56f] bg-[#fff6e6] text-[#623d0a]" : "border-[#c8d8c8] bg-[#f3f8ef] text-forest")}>
              <p className="mb-2 flex items-center gap-2 font-bold">{risks.length ? <CircleAlert className="h-5 w-5 shrink-0" aria-hidden /> : <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden />}{L("What to check", "Điều cần lưu ý")}</p>
              {risks.length ? <ul className="list-disc space-y-2 pl-5">{risks.map(r => <li key={r}>{r === "planner.overlap" ? L("Crop dates overlap. Adjust the planting schedule.", "Các vụ đang chồng lấn. Cần chỉnh lại lịch gieo.") : t(r)}</li>)}</ul> : <p>{L("No additional risks flagged by the model. Check actual field conditions before planting.", "Mô hình chưa ghi nhận rủi ro khác. Cần kiểm tra thực tế trước khi gieo.")}</p>}
            </div>
            {c && <div><p className="mb-2 flex items-center gap-2 font-bold text-forest"><Leaf className="h-5 w-5 shrink-0" aria-hidden />{L("About this crop", "Đặc điểm cây trồng")}</p><p>{c.agronomicProperties.note[lang]}</p></div>}
            {growing && <details className="group rounded-2xl border border-[#cbd5cd] bg-white">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 p-4 font-bold text-forest">{L("Soil, temperature & fertilizer", "Đất, nhiệt độ & phân bón")}<ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden /></summary>
              <dl className="space-y-3 border-t border-[#cbd5cd] p-4">
                <div><dt>{L("Suitable temperature", "Nhiệt độ phù hợp")}</dt><dd className="font-bold">{c.temperatureRange.optMin}–{c.temperatureRange.optMax} °C</dd></div>
                <div><dt>{L("Suitable soil pH", "pH đất phù hợp")}</dt><dd className="font-bold">{c.phRange.min}–{c.phRange.max}</dd></div>
                <div><dt>{L("Waterlogging tolerance", "Khả năng chịu ngập")}</dt><dd className="font-bold">{tolerance(c.waterloggingTolerance)}</dd></div>
                <div><dt>{L("Crop water requirement", "Nhu cầu nước của cây")}</dt><dd className="font-bold">{t(`water.${c.waterRequirement}`)}</dd></div>
                <div><dt>{L("Estimated nitrogen in this plan", "Lượng đạm ước tính trong kế hoạch")}</dt><dd className="font-bold">{num(s.nitrogenNet)} kg N/ha</dd><dd className="mt-1">{L("Typical crop requirement", "Nhu cầu thông thường của cây")}: {num(c.nitrogenNeed)} kg N/ha</dd></div>
              </dl>
            </details>}
            <Button variant="outline" className="min-h-12 h-auto w-full whitespace-normal rounded-xl border-[#9eafa3] px-3 py-3 text-base" onClick={() => onShowSeason(result.year,s.season)}>{L("See this season on the calendar", "Xem vụ này trên lịch")}<ArrowRight className="h-5 w-5 shrink-0" aria-hidden /></Button>
          </div>
        </Card>;
      })}
    </div>
    <p className="rounded-2xl border border-[#cbd5cd] bg-white p-4 text-base leading-relaxed text-ink">{L("Dates, water and nitrogen are model estimates. Confirm planting dates, seed and water supply with your local adviser.", "Lịch gieo, nước tưới và lượng đạm là ước tính từ mô hình. Cần xác nhận lịch, nguồn giống và nguồn nước với cán bộ khuyến nông.")}</p>
  </section>;
}

export function PlanYears({ results, selectedYear, areaHa, onShowYear }: {
  results: SimulationResult[]; selectedYear: number; areaHa: number; onShowYear: (year: number) => void;
}) {
  const { L, t, num, crop } = useI18n();
  const maxWater = Math.max(1,...results.map(y => y.waterDemand.median));
  return <section className="space-y-5" aria-labelledby="plan-years-title">
    <div><h2 id="plan-years-title" className="text-2xl font-bold text-forest md:text-[28px]">{L("Water and soil, year by year", "Theo dõi nước tưới và đất qua từng năm")}</h2><p className="mt-2 text-base leading-relaxed text-ink">{L("Compare irrigation for the whole field and estimated soil carbon. Every water bar uses the same scale.", "So sánh nước tưới cho cả ruộng và lượng carbon trong đất ước tính. Các thanh nước dùng chung một thang đo.")}</p></div>
    <div className="grid gap-5 lg:grid-cols-2">
      {results.map(y => <Card key={y.year} className={cn("overflow-hidden rounded-3xl border-[#cbd5cd]", y.year === selectedYear && "border-forest ring-2 ring-forest")}>
        <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b border-[#cbd5cd] px-5 py-4 md:px-6", y.year === selectedYear ? "bg-forest text-white" : "bg-[#f4f7ef] text-forest")}>
          <h3 className="flex items-center gap-3 text-2xl font-bold"><CalendarDays className="h-6 w-6" aria-hidden />{y.year}</h3>
          <div className="flex items-center gap-2 text-base font-semibold">{y.isBaselineYear && <span>{L("Starting year", "Năm gốc")}</span>}{y.year === selectedYear && <span className="inline-flex items-center gap-1.5"><Check className="h-5 w-5" aria-hidden />{L("Selected", "Đang xem")}</span>}</div>
        </div>
        <div className="space-y-5 p-5 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#bad2e2] bg-[#edf5fb] p-4 text-[#173e59]">
              <p className="flex items-center gap-2 text-base font-bold"><Droplets className="h-5 w-5 shrink-0" aria-hidden />{L("Irrigation · whole field", "Nước tưới · cả ruộng")}</p>
              <p className="mt-3 text-[30px] font-extrabold leading-tight tabular">{num(y.waterDemand.m3PerHa * areaHa)}</p><p className="text-base font-semibold">m³ / {L("year", "năm")}</p>
              <div className="my-3 h-3 overflow-hidden rounded-full bg-[#cfdfeb]" aria-hidden><div className="h-full rounded-full bg-[#25608c]" style={{width:`${y.waterDemand.median / maxWater * 100}%`}} /></div>
              <p className="text-base leading-relaxed">{L("Historical-weather range", "Khoảng theo thời tiết lịch sử")}:<br /><strong>{num(y.waterDemand.p10 * 10 * areaHa)}–{num(y.waterDemand.p90 * 10 * areaHa)} m³</strong></p>
              <p className="mt-2 text-base">{num(y.waterDemand.median)} mm / {L("year", "năm")}</p>
            </div>
            <div className="rounded-2xl border border-[#d8c9b3] bg-[#faf5ed] p-4 text-ink">
              <p className="mb-3 flex items-center gap-2 text-base font-bold text-[#60401c]"><Sprout className="h-5 w-5 shrink-0" aria-hidden />{L("Soil carbon", "Carbon trong đất")}</p>
              <div className="[&_p]:text-base [&_p]:leading-relaxed [&_p.font-display]:text-[30px] [&_p>span]:text-base"><SoilCarbon result={y} compact notes={false} badge={false} /></div>
              {y.soilImprovementPotential && <p className="mt-3 text-base font-semibold text-[#60401c]">{t(`soil.${y.soilImprovementPotential.level}`)}</p>}
            </div>
          </div>
          <WaterRisk level={y.waterRisk.level} />
          <div className="flex flex-wrap gap-3 border-t border-[#cbd5cd] pt-4">{y.seasons.map(s => <span key={s.slotId} className="inline-flex items-center gap-2 text-base font-semibold text-ink"><CropIcon cropId={s.cropId} size={28} />{crop(s.cropId)}</span>)}</div>
          <Button variant="outline" onClick={() => onShowYear(y.year)} className="min-h-12 h-auto w-full rounded-xl border-[#9eafa3] px-3 py-3 text-base">{L(`See the ${y.year} calendar`, `Xem lịch năm ${y.year}`)}<ArrowRight className="h-5 w-5 shrink-0" aria-hidden /></Button>
        </div>
      </Card>)}
    </div>
    <div className="rounded-2xl border border-[#d8c9b3] bg-[#faf5ed] p-5 text-base leading-relaxed text-ink"><p className="flex items-center gap-2 font-bold text-[#60401c]"><CircleAlert className="h-5 w-5 shrink-0" aria-hidden />{L("How to read these estimates", "Cách đọc các số liệu")}</p><p className="mt-2">{t("rothc.depthSource")}. {t("rothc.compactLimit")}</p><p className="mt-2">{L("Carbon changes are compared with the starting stock. A negative value means carbon loss; it does not mean the plan adds carbon to the soil. The water range reflects historical weather, not a guarantee for that year.", "Mức thay đổi carbon được so với trữ lượng đầu kỳ. Số âm nghĩa là carbon giảm. Khoảng nước tưới phản ánh thời tiết lịch sử, không phải mức nước chắc chắn của từng năm.")}</p></div>
  </section>;
}
