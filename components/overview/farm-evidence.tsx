"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS, ChartFrame, ChartTooltip, GRID } from "@/components/charts";
import { StatusBadge } from "@/components/common";
import { Card } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n";
import type { ClimateState, RemoteState } from "@/lib/hooks";
import type { DailyExtremes, NdviSeries } from "@/lib/types";
import { IMERG_SOURCE, MODIS_SOURCE, POWER_SOURCE, SMAP_SOURCE, type EnvironmentalSeries, type Evidence } from "@/lib/data/evidence";

export function EvidenceList({ climate, daily, ndvi, imerg, smap, usesImerg }: {
  climate: ClimateState;
  daily: RemoteState<DailyExtremes>;
  ndvi: RemoteState<NdviSeries>;
  imerg: RemoteState<EnvironmentalSeries>;
  smap: RemoteState<EnvironmentalSeries>;
  usesImerg: boolean;
}) {
  const { L, num } = useI18n();
  const rows: { label: string; state: { loading: boolean; fallbackReason: string | null; data: { evidence?: Evidence; cached: boolean } | null }; source: string; role: string }[] = [
    { label: "NASA POWER · MERRA-2 & CERES", state: climate, source: POWER_SOURCE + "monthly/",
      role: usesImerg ? L("Temperature, humidity, wind and sunshine used in the model", "Mô hình dùng nhiệt độ, độ ẩm, gió và bức xạ") : L("Main climate inputs, including rainfall", "Đầu vào khí hậu chính, gồm lượng mưa") },
    { label: "NASA POWER · " + L("daily weather", "thời tiết ngày"), state: daily, source: POWER_SOURCE + "daily/",
      role: L("Heat, frost and heavy-rain context; heavy rain informs the bare-soil proxy", "Bối cảnh nóng, rét và mưa lớn; mưa lớn dùng để tính chỉ số đất trống") },
    { label: "GPM IMERG", state: imerg, source: IMERG_SOURCE,
      role: usesImerg ? L("Rainfall used in the model", "Mô hình dùng lượng mưa này") : L("Rainfall reference. The model uses POWER rainfall until IMERG covers the full climate history.", "Mưa tham chiếu. Mô hình dùng mưa POWER đến khi IMERG đủ thời gian.") },
    { label: "SMAP Level 4", state: smap, source: SMAP_SOURCE,
      role: L("Satellite-informed soil moisture estimates. Seasonal drainage warning when coverage is sufficient.", "Ước tính ẩm đất từ mô hình kết hợp vệ tinh. Cảnh báo thoát nước theo mùa khi đủ dữ liệu.") },
    { label: "MODIS MOD13Q1.061", state: ndvi, source: MODIS_SOURCE,
      role: L("Historical greenness context for field checks", "Tham chiếu độ xanh lịch sử để kiểm tra ngoài ruộng") },
  ];
  return (
    <Card className="p-4 sm:p-5">
      <h2 className="text-base font-bold">{L("Your farm’s data sources", "Nguồn dữ liệu của ruộng")}</h2>
      <p className="mb-2 mt-1 text-sm text-ink-2">{L("The map pin samples a regional grid. A drawn boundary marks the farm and sets its area. Satellite overlays are imagery.", "Ghim lấy mẫu theo ô lưới vùng. Ranh giới đánh dấu ruộng và tính diện tích. Các lớp phủ là ảnh vệ tinh.")}</p>
      {rows.map(({ label, state, source, role }) => (
        <details key={label} className="border-t border-line py-2.5">
          <summary className="cursor-pointer py-1.5 text-sm font-semibold">
            {label} <span className="ml-1 text-xs font-normal text-ink-2">· {state.loading ? L("Loading", "Đang tải") :
              !state.data ? L("Unavailable", "Chưa có") : state.data.cached ? L("Cached", "Bản lưu") : L("Fetched", "Đã tải")}</span>
          </summary>
          <p className="mt-1 text-xs text-ink-2">{role}</p>
          {state.fallbackReason === "rate_limited" && <p className="mt-1 text-xs text-amber-ink">{L("The upstream service is busy. Try again shortly.", "Nguồn dữ liệu đang quá tải. Hãy thử lại sau.")}</p>}
          {state.data?.evidence && (() => {
            const e = state.data.evidence;
            return (
              <dl className="mt-2 grid gap-x-3 gap-y-1 text-xs sm:grid-cols-[max-content_1fr]">
                <dt className="font-semibold">{L("Product", "Sản phẩm")}</dt><dd>{e.productId}</dd>
                <dt className="font-semibold">{L("Period", "Giai đoạn")}</dt><dd>{e.period.join(" → ")}</dd>
                <dt className="font-semibold">{L("Scale", "Độ phân giải")}</dt><dd>{e.resolution}</dd>
                <dt className="font-semibold">{L("Location sampled", "Vị trí lấy mẫu")}</dt><dd>{(e.sampledCoordinates ?? e.geometry.coordinates).slice().reverse().map((v) => num(v, 5)).join(", ")}</dd>
                <dt className="font-semibold">{L("Retrieved", "Ngày tải")}</dt><dd>{e.retrievedAt.slice(0, 10)}</dd>
                <dt className="font-semibold">{L("Quality", "Chất lượng")}</dt><dd>{e.quality}</dd>
              </dl>
            );
          })()}
          <a href={source} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-forest underline">{L("Official product details", "Chi tiết sản phẩm chính thức")}</a>
        </details>
      ))}
    </Card>
  );
}

export function WaterEvidence({ series, kind }: { series: RemoteState<EnvironmentalSeries>; kind: "rain" | "soil" }) {
  const { L, num } = useI18n();
  const isRain = kind === "rain";
  const title = isRain ? L("Monthly rain from GPM IMERG", "Mưa tháng từ GPM IMERG") : L("Regional soil moisture from SMAP", "Độ ẩm đất theo vùng từ SMAP");
  const unit = isRain ? "mm" : "m³/m³";
  const labels = [isRain ? L("Rain", "Mưa") : L("Surface (0–5 cm)", "Mặt đất (0–5 cm)"), L("Root zone (0–100 cm)", "Vùng rễ (0–100 cm)")];
  const byMonth = new Map<string, { date: string; a: number | null; b: number | null }>();
  for (const o of series.data?.observations ?? []) {
    const date = o.period[0].slice(0, 7);
    const values = byMonth.get(date) ?? { date, a: null, b: null };
    if (o.variable === "root_zone_soil_moisture") values.b = o.value;
    else values.a = o.value;
    byMonth.set(date, values);
  }
  const points = [...byMonth.values()];
  const fmt = (v: number | null) => v === null ? "—" : num(v, isRain ? 0 : 2);
  return (
    <Card className="p-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold">{title}</h3>
        {!series.loading && <StatusBadge status={series.data?.status ?? "unavailable"} />}
      </div>
      <p className="mb-2 text-xs text-ink-2">{isRain
        ? L("Regional rain totals. Months with missing days appear as gaps.", "Tổng mưa theo vùng. Tháng thiếu số liệu ngày sẽ để trống.")
        : L("Water volume per unit of soil in the surrounding grid cell. Check your field before changing irrigation.", "Thể tích nước trên một đơn vị đất trong ô lưới vùng. Kiểm tra ruộng trước khi đổi lịch tưới.")}</p>
      {series.loading ? <p role="status" className="py-5 text-sm text-ink-2">{L("Loading historical data…", "Đang tải dữ liệu lịch sử…")}</p> :
        !series.data ? <p className="py-3 text-sm text-ink-2">{L("This dataset is unavailable for the selected location and period.", "Chưa có bộ dữ liệu này cho vị trí và giai đoạn đã chọn.")}</p> : (
          <ChartFrame summary={title} table={{ head: [L("Month", "Tháng"), `${labels[0]} (${unit})`, ...(isRain ? [] : [`${labels[1]} (${unit})`])],
            rows: points.map((d) => [d.date, fmt(d.a), ...(isRain ? [] : [fmt(d.b)])]) }}>
            <ComposedChart data={points} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="date" minTickGap={30} {...AXIS} />
              <YAxis {...AXIS} width={48} domain={isRain ? [0, "auto"] : [0, 0.9]} />
              <Tooltip content={<ChartTooltip unit={unit} digits={isRain ? 0 : 2} />} />
              {isRain ? <Bar dataKey="a" name={labels[0]} fill="#4A94C7" maxBarSize={14} /> : (
                <>
                  <Legend />
                  <Line dataKey="a" name={labels[0]} stroke="#4A94C7" dot={false} strokeWidth={2} />
                  <Line dataKey="b" name={labels[1]} stroke="#2F7A50" dot={false} strokeWidth={2} />
                </>
              )}
            </ComposedChart>
          </ChartFrame>
        )}
    </Card>
  );
}
