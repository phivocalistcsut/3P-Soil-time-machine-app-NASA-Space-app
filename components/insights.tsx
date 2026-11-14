"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceArea, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, ClipboardCopy, FileSearch, HelpCircle, Lightbulb, MessageCircleQuestion } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getCrop } from "@/lib/data/crops";
import { extremesClimatology, extremesByYear } from "@/lib/services/power-daily";
import { CROP_YEAR_MONTHS, type Evidence, type VulnerabilityCalendar } from "@/lib/engine/insights";
import type { DailyExtremes, NdviSeries } from "@/lib/types";
import { AXIS, ChartFrame, ChartTooltip, GRID } from "@/components/charts";
import { ConfidenceBadge, StatusBadge, Term } from "@/components/common";
import { InfoTip, toast } from "@/components/ui/overlays";
import { Button, cn } from "@/components/ui/primitives";

/* ------------------------- U1: 12-month risk calendar ------------------------ */

const LEVEL_BG = ["bg-[#E7F4EA]", "bg-[#FBEFD6]", "bg-[#F7D9B5]", "bg-[#F3C5BE]"];
const LEVEL_TEXT = ["text-[#2F6E45]", "text-[#8A5A10]", "text-[#8A4A10]", "text-[#A63F33]"];

export function RiskCalendar({ calendar, compact }: { calendar: VulnerabilityCalendar; compact?: boolean }) {
  const { L, lang, month, t } = useI18n();
  const levels = [L("OK", "Ổn"), L("Watch", "Chú ý"), L("High", "Cao"), L("Very high", "Rất cao")];
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3E9DC] px-3 py-1.5 text-xs font-semibold text-earth-ink">
          <span className="h-3 w-3 rounded-sm bg-[repeating-linear-gradient(45deg,#d9c3a2_0_3px,#f6eddf_3px_6px)]" aria-hidden />
          {calendar.bareMonths.length
            ? L(`${calendar.bareMonths.length} bare month(s): ${calendar.bareMonths.map((m) => month(m)).join(", ")}`, `${calendar.bareMonths.length} tháng đất trống: ${calendar.bareMonths.map((m) => month(m)).join(", ")}`)
            : L("No bare months", "Không có tháng đất trống")}
        </span>
        {calendar.worstMonths.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-risk-soft px-3 py-1.5 text-xs font-semibold text-risk-ink">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            {L("Most vulnerable", "Dễ tổn thương nhất")}: {calendar.worstMonths.map((m) => month(m)).join(", ")}
          </span>
        )}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[760px] border-separate border-spacing-0 text-[11px]">
          <caption className="sr-only">{L("Month-by-month vulnerability calendar", "Lịch rủi ro theo tháng")}</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-[150px] bg-sand px-3 py-2 text-left text-xs font-semibold text-ink-2">
                {L("Month", "Tháng")}
              </th>
              {CROP_YEAR_MONTHS.map((m, k) => (
                <th key={k} scope="col" className={cn("bg-sand px-1 py-2 text-center text-xs font-bold text-ink", calendar.worstMonths.includes(m) && "text-risk-ink")}>
                  {month(m)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calendar.rows.map((r) => (
              <tr key={r.id}>
                <th scope="row" className="sticky left-0 z-10 border-t border-line bg-white px-3 py-2 text-left align-middle">
                  <span className="flex items-center gap-1 text-[12px] font-semibold text-ink">
                    {r.name[lang]}
                    <InfoTip label={r.name[lang]}>
                      <p>{r.help[lang]}</p>
                      <p className="mt-1.5">
                        <StatusBadge status={r.status} withTip={false} />
                      </p>
                    </InfoTip>
                  </span>
                </th>
                {r.cells.map((c, k) => {
                  if (r.id === "cover") {
                    const crop = getCrop(c.cropId);
                    return (
                      <td key={k} className="border-l border-t border-line p-1">
                        <div
                          className={cn("flex h-11 flex-col items-center justify-center rounded-lg px-1 text-center font-semibold leading-tight", !crop && "bg-[repeating-linear-gradient(45deg,#e9d9bf_0_4px,#f8f1e5_4px_8px)] text-earth-ink")}
                          style={crop ? { background: `${crop.color}26`, color: "#21312B" } : undefined}
                          title={c.value[lang]}
                        >
                          {crop && <span className="mb-0.5 h-1.5 w-6 rounded-full" style={{ background: crop.color }} aria-hidden />}
                          <span className="line-clamp-2">{crop ? c.value[lang] : L("Bare", "Trống")}</span>
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td key={k} className="border-l border-t border-line p-1">
                      <div className={cn("flex h-11 flex-col items-center justify-center rounded-lg px-1 text-center leading-tight", LEVEL_BG[c.level], LEVEL_TEXT[c.level])} title={`${levels[c.level]} · ${c.value[lang]}`}>
                        <span className="flex items-center gap-0.5 font-bold">
                          {c.level >= 2 && <AlertTriangle className="h-3 w-3" aria-hidden />}
                          {levels[c.level]}
                        </span>
                        {!compact && <span className="line-clamp-1 text-[10px] opacity-90">{c.value[lang]}</span>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-ink-2">
        {L(
          "Crop year from December to November. Each cell shows the level in words, so the calendar also works without colour. Hover or tap a row name to see how it is computed.",
          "Năm mùa vụ tính từ tháng 12 đến tháng 11. Mỗi ô ghi mức độ bằng chữ nên vẫn đọc được khi không phân biệt màu. Bấm vào tên hàng để xem cách tính.",
        )}{" "}
        {t("status.estimated")}.
      </p>
    </div>
  );
}

/* ------------------------- U2: evidence · gaps · ask ------------------------ */

export function EvidencePanel({ evidence, title }: { evidence: Evidence; title?: string }) {
  const { L, lang } = useI18n();
  const [done, setDone] = useState<number[]>([]);
  const copy = async () => {
    const text = [title ?? "", ...evidence.askExpert.map((q, i) => `${i + 1}. ${q[lang]}`)].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(L("Questions copied — paste them into Zalo or a message", "Đã sao chép câu hỏi — dán vào Zalo hoặc tin nhắn"));
    } catch {
      toast.error(L("Could not copy on this device", "Không sao chép được trên thiết bị này"));
    }
  };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl bg-mint/70 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-forest">
          <Lightbulb className="h-4 w-4" aria-hidden />
          {L("Why this plan was suggested", "Vì sao có cách trồng này")}
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm leading-snug text-ink">
          {evidence.why.map((w, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forest" aria-hidden />
              {w[lang]}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl bg-water-soft/80 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-water-ink">
          <FileSearch className="h-4 w-4" aria-hidden />
          {L("Evidence behind the numbers", "Bằng chứng đằng sau con số")}
        </h3>
        <ul className="mt-2 divide-y divide-water/20">
          {evidence.evidence.map((e, i) => (
            <li key={i} className="py-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-[13px] font-semibold text-ink">{e.label[lang]}</span>
                <span className="flex items-center gap-2">
                  <StatusBadge status={e.status} withTip={false} />
                  <ConfidenceBadge level={e.confidence} />
                </span>
              </div>
              <p className="text-xs text-ink-2">
                {e.value[lang]} · {e.source[lang]}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl bg-amber-soft p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-amber-ink">
          <HelpCircle className="h-4 w-4" aria-hidden />
          {L("What we don't know yet", "Những gì còn chưa biết")}
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm leading-snug text-ink">
          {evidence.gaps.map((g, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" aria-hidden />
              {g[lang]}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl bg-[#EFE7F6] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#5B3F86]">
            <MessageCircleQuestion className="h-4 w-4" aria-hidden />
            {L("Ask your extension officer", "Nên hỏi cán bộ khuyến nông")}
          </h3>
          <Button variant="outline" size="sm" className="h-8 border-[#cdbbe2] bg-white/70" onClick={copy}>
            <ClipboardCopy className="h-3.5 w-3.5" aria-hidden />
            {L("Copy questions", "Sao chép câu hỏi")}
          </Button>
        </div>
        <ul className="mt-2 space-y-1.5">
          {evidence.askExpert.map((q, i) => {
            const checked = done.includes(i);
            return (
              <li key={i}>
                <label className="flex cursor-pointer gap-2.5 rounded-xl bg-white/70 px-3 py-2 text-sm leading-snug">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#6A4C93]"
                    checked={checked}
                    onChange={() => setDone((d) => (checked ? d.filter((x) => x !== i) : [...d, i]))}
                  />
                  <span className={cn(checked && "text-ink-3 line-through")}>{q[lang]}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-ink-2">
          <CheckCircle2 className="h-3 w-3" aria-hidden />
          {L("Tick questions once you have an answer. This tool supports — never replaces — local expertise.", "Đánh dấu khi đã có câu trả lời. Công cụ này hỗ trợ — không thay thế — chuyên môn địa phương.")}
        </p>
      </div>
    </div>
  );
}

/* --------------------------- U5: weather extremes --------------------------- */

export function ExtremesChart({ extremes }: { extremes: DailyExtremes }) {
  const { L, month, num } = useI18n();
  const clim = useMemo(() => extremesClimatology(extremes), [extremes]);
  const hasFrost = clim.some((c) => c.frostDays >= 0.1);
  const data = clim.map((c) => ({ name: month(c.month), heavy: c.heavyRainDays, hot: c.hotDays, frost: c.frostDays }));
  return (
    <ChartFrame
      height={250}
      summary={L(
        "Average number of heavy-rain days (≥ 50 mm) and hot days (≥ 35 °C) per month, NASA POWER daily data.",
        "Số ngày mưa lớn (≥ 50 mm) và ngày nắng nóng (≥ 35 °C) trung bình mỗi tháng, số liệu ngày NASA POWER.",
      )}
      table={{
        head: [L("Month", "Tháng"), L("Heavy-rain days", "Ngày mưa lớn"), L("Hot days", "Ngày nắng nóng"), ...(hasFrost ? [L("Frost days", "Ngày sương giá")] : [])],
        rows: data.map((d) => [d.name, num(d.heavy, 1), num(d.hot, 1), ...(hasFrost ? [num(d.frost, 1)] : [])]),
      }}
    >
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={2}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="name" {...AXIS} />
        <YAxis {...AXIS} width={40} allowDecimals={false} />
        <Tooltip content={<ChartTooltip unit={L("days", "ngày")} digits={1} />} cursor={{ fill: "#F2F4EF" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconSize={9} />
        <Bar dataKey="hot" name={L("Hot days ≥ 35 °C", "Ngày nóng ≥ 35 °C")} fill="#D97167" radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar dataKey="heavy" name={L("Heavy-rain days ≥ 50 mm", "Ngày mưa ≥ 50 mm")} fill="#4A94C7" radius={[4, 4, 0, 0]} maxBarSize={18} />
        {hasFrost && <Bar dataKey="frost" name={L("Frost days ≤ 0 °C", "Ngày sương giá ≤ 0 °C")} fill="#7D5BA6" radius={[4, 4, 0, 0]} maxBarSize={18} />}
      </BarChart>
    </ChartFrame>
  );
}

export function ExtremesByYear({ extremes }: { extremes: DailyExtremes }) {
  const { L, num } = useI18n();
  const data = useMemo(() => extremesByYear(extremes), [extremes]);
  return (
    <ChartFrame
      height={200}
      summary={L("Hot days and heavy-rain days per year.", "Số ngày nắng nóng và ngày mưa lớn mỗi năm.")}
      table={{ head: [L("Year", "Năm"), L("Hot days", "Ngày nắng nóng"), L("Heavy-rain days", "Ngày mưa lớn")], rows: data.map((d) => [d.year, num(d.hotDays), num(d.heavyRainDays)]) }}
    >
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="year" {...AXIS} />
        <YAxis {...AXIS} width={40} allowDecimals={false} />
        <Tooltip content={<ChartTooltip unit={L("days", "ngày")} />} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconSize={9} />
        <Line dataKey="hotDays" name={L("Hot days", "Ngày nắng nóng")} stroke="#D97167" strokeWidth={2.5} dot={{ r: 3 }} />
        <Line dataKey="heavyRainDays" name={L("Heavy-rain days", "Ngày mưa lớn")} stroke="#4A94C7" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 3 }} />
      </LineChart>
    </ChartFrame>
  );
}

/* ------------------------------ U4: NDVI series ------------------------------ */

export function NdviChart({ series }: { series: NdviSeries }) {
  const { L, lang, num } = useI18n();
  const data = series.points.map((p) => ({ date: p.date, label: `${p.date.slice(5, 7)}/${p.date.slice(2, 4)}`, ndvi: p.ndvi }));
  return (
    <ChartFrame
      height={270}
      summary={L(
        "Greenness (NDVI) of the field's 250 m pixel every 16 days from NASA MODIS. Low values mean bare or flooded land; high values mean dense green crops.",
        "Độ xanh (NDVI) của điểm ảnh 250 m quanh ruộng, 16 ngày một lần, từ NASA MODIS. Giá trị thấp là đất trống hoặc ngập nước; giá trị cao là cây xanh dày.",
      )}
      table={{ head: [L("Date", "Ngày"), "NDVI"], rows: data.map((d) => [d.date, d.ndvi === null ? "—" : num(d.ndvi, 2)]) }}
    >
      <LineChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <ReferenceArea y1={0} y2={0.3} fill="#E4A84C" fillOpacity={0.14} label={{ value: lang === "vi" ? "Ít xanh: đất trống / ngập nước" : "Low: bare or flooded", position: "insideBottomLeft", fill: "#8a5a10", fontSize: 10.5 }} />
        <ReferenceArea y1={0.6} y2={1} fill="#66AD79" fillOpacity={0.14} label={{ value: lang === "vi" ? "Rất xanh: cây phát triển mạnh" : "High: dense green crop", position: "insideTopLeft", fill: "#2f6e45", fontSize: 10.5 }} />
        <XAxis dataKey="label" {...AXIS} interval={5} tick={{ ...AXIS.tick, fontSize: 10.5 }} />
        <YAxis {...AXIS} width={40} domain={[0, 1]} ticks={[0, 0.3, 0.6, 1]} tickFormatter={(v) => num(v, 1)} />
        <Tooltip content={<ChartTooltip digits={2} labelFormatter={(l) => String(l)} />} />
        <Line dataKey="ndvi" name="NDVI" stroke="#2F7A50" strokeWidth={2.5} dot={{ r: 2.5 }} connectNulls={false} type="monotone" />
      </LineChart>
    </ChartFrame>
  );
}

/** Dates where greenness dropped below 0.4 — usually harvest, land preparation or flooding. */
export function ndviDips(series: NdviSeries) {
  return series.points.filter((p, i) => p.ndvi !== null && p.ndvi < 0.4 && (i === 0 || (series.points[i - 1].ndvi ?? 1) >= 0.4));
}

export function NdviTerm() {
  return <Term id="ndvi">NDVI</Term>;
}
