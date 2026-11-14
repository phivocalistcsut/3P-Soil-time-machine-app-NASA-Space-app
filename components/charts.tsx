"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  ErrorBar,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
} from "recharts";
import { Table2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/components/ui/primitives";

export const AXIS = { stroke: "#C9CFC6", tick: { fill: "#5d6d65", fontSize: 11 }, tickLine: false };
export const GRID = { stroke: "#EEF0EB", vertical: false };

/* ------------------------------ chart frame ------------------------------ */

export function ChartFrame({
  summary,
  table,
  children,
  height = 220,
  className,
}: {
  summary: string;
  table: { head: string[]; rows: (string | number)[][] };
  children: React.ReactNode;
  height?: number;
  className?: string;
}) {
  const { L } = useI18n();
  const [showTable, setShowTable] = useState(false);
  return (
    <div className={className}>
      {showTable ? (
        <div className="max-h-[260px] overflow-auto rounded-xl border border-line">
          <table className="w-full text-left text-xs tabular">
            <caption className="sr-only">{summary}</caption>
            <thead className="sticky top-0 bg-sand">
              <tr>
                {table.head.map((h) => (
                  <th key={h} scope="col" className="px-2.5 py-2 font-semibold text-ink-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-t border-line">
                  {r.map((c, j) => (
                    <td key={j} className="px-2.5 py-1.5">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div role="img" aria-label={summary} style={{ height }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      )}
      <button
        onClick={() => setShowTable((v) => !v)}
        className="mt-1.5 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] font-medium text-ink-2 hover:text-forest"
        aria-pressed={showTable}
      >
        <Table2 className="h-3 w-3" aria-hidden />
        {showTable ? L("Show chart", "Xem biểu đồ") : L("View data table", "Xem bảng số liệu")}
      </button>
    </div>
  );
}

type TipPayload = { name?: string; value?: number | [number, number]; color?: string; dataKey?: string | number; payload?: Record<string, unknown> };

export function ChartTooltip({
  active,
  payload,
  label,
  unit,
  digits = 0,
  labelFormatter,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string | number;
  unit?: string;
  digits?: number;
  labelFormatter?: (l: string | number | undefined) => string;
}) {
  const { num } = useI18n();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-[var(--shadow-float)]">
      <p className="mb-1 font-semibold text-ink">{labelFormatter ? labelFormatter(label) : label}</p>
      {payload
        .filter((p) => p.value !== undefined && p.value !== null && !String(p.dataKey).startsWith("_"))
        .map((p, i) => (
          <p key={i} className="flex items-center gap-2 text-ink-2">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} aria-hidden />
            <span className="flex-1">{p.name}</span>
            <span className="font-semibold text-ink tabular">
              {Array.isArray(p.value) ? `${num(p.value[0], digits)}–${num(p.value[1], digits)}` : num(p.value as number, digits)}
              {unit ? ` ${unit}` : ""}
            </span>
          </p>
        ))}
    </div>
  );
}

/* ----------------------------- overview charts ---------------------------- */

export interface MonthClimate {
  month: number;
  precip: number;
  precipP10: number;
  precipP90: number;
  et0: number;
  t2m: number;
  tmax: number;
  tmin: number;
  gwetTop: number | null;
  gwetRoot: number | null;
}

export function PrecipChart({ months }: { months: MonthClimate[] }) {
  const { L, month, num } = useI18n();
  const data = months.map((m) => ({
    name: month(m.month),
    precip: m.precip,
    err: [m.precip - m.precipP10, m.precipP90 - m.precip] as [number, number],
    et0: m.et0,
  }));
  return (
    <ChartFrame
      summary={L(
        "Monthly rainfall (bars, NASA POWER) with 10–90% range across years, and estimated reference evapotranspiration (line).",
        "Lượng mưa theo tháng (cột, NASA POWER) kèm khoảng 10–90% giữa các năm và bốc thoát hơi tham chiếu ước tính (đường).",
      )}
      table={{
        head: [L("Month", "Tháng"), L("Rain mm", "Mưa mm"), "P10", "P90", "ET0 mm"],
        rows: months.map((m) => [month(m.month), num(m.precip), num(m.precipP10), num(m.precipP90), num(m.et0)]),
      }}
    >
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="name" {...AXIS} />
        <YAxis {...AXIS} width={44} unit="" />
        <Tooltip content={<ChartTooltip unit="mm" />} cursor={{ fill: "#F2F4EF" }} />
        <Legend wrapperStyle={{ fontSize: 11, color: "#5d6d65" }} iconSize={9} />
        <Bar dataKey="precip" name={L("Rainfall (observed)", "Mưa (quan trắc)")} fill="#4A94C7" radius={[4, 4, 0, 0]} maxBarSize={22}>
          <ErrorBar dataKey="err" width={3} strokeWidth={1.2} stroke="#24628d" direction="y" />
        </Bar>
        <Line dataKey="et0" name={L("ET0 (estimated)", "ET0 (ước tính)")} stroke="#B57B38" strokeWidth={2} dot={{ r: 3 }} type="monotone" />
      </ComposedChart>
    </ChartFrame>
  );
}

export function TemperatureChart({ months, annual }: { months: MonthClimate[]; annual: { year: number; t2m: number; complete: boolean }[] }) {
  const { L, month, num } = useI18n();
  const [view, setView] = useState<"season" | "years">("season");
  return (
    <div>
      <div role="tablist" className="mb-2 inline-flex rounded-lg bg-sand-2 p-0.5 text-[11px] font-medium">
        {(
          [
            ["season", L("Seasonal cycle", "Chu kỳ trong năm")],
            ["years", L("Year by year", "Theo từng năm")],
          ] as const
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)} className={cn("rounded-md px-2.5 py-1", view === id ? "bg-white text-ink shadow-sm" : "text-ink-2")}>
            {label}
          </button>
        ))}
      </div>
      {view === "season" ? (
        <ChartFrame
          summary={L("Monthly mean, approximate mean daily maximum and minimum air temperature (NASA POWER).", "Nhiệt độ trung bình, cao nhất và thấp nhất trung bình ngày theo tháng (NASA POWER).")}
          table={{
            head: [L("Month", "Tháng"), "Tmin °C", "Tmean °C", "Tmax °C"],
            rows: months.map((m) => [month(m.month), num(m.tmin, 1), num(m.t2m, 1), num(m.tmax, 1)]),
          }}
        >
          <LineChart data={months.map((m) => ({ name: month(m.month), tmax: m.tmax, t2m: m.t2m, tmin: m.tmin }))} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="name" {...AXIS} />
            <YAxis {...AXIS} width={44} domain={[(min: number) => Math.floor(min - 1), (max: number) => Math.ceil(max + 1)]} allowDecimals={false} tickFormatter={(v) => num(v, 0)} />
            <Tooltip content={<ChartTooltip unit="°C" digits={1} />} />
            <Legend wrapperStyle={{ fontSize: 11 }} iconSize={9} />
            <Line dataKey="tmax" name={L("Mean daily max", "Cao nhất TB")} stroke="#D97167" strokeWidth={2} dot={false} type="monotone" />
            <Line dataKey="t2m" name={L("Mean", "Trung bình")} stroke="#21312B" strokeWidth={2} dot={false} type="monotone" />
            <Line dataKey="tmin" name={L("Mean daily min", "Thấp nhất TB")} stroke="#4A94C7" strokeWidth={2} dot={false} type="monotone" />
          </LineChart>
        </ChartFrame>
      ) : (
        <ChartFrame
          summary={L("Annual mean air temperature by year (NASA POWER).", "Nhiệt độ trung bình năm theo từng năm (NASA POWER).")}
          table={{ head: [L("Year", "Năm"), "Tmean °C"], rows: annual.map((a) => [a.year, num(a.t2m, 2)]) }}
        >
          <LineChart data={annual.filter((a) => a.complete)} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="year" {...AXIS} />
            <YAxis {...AXIS} width={44} domain={["dataMin - 0.3", "dataMax + 0.3"]} tickFormatter={(v) => num(v, 1)} />
            <Tooltip content={<ChartTooltip unit="°C" digits={2} />} />
            <Line dataKey="t2m" name={L("Annual mean", "Trung bình năm")} stroke="#21312B" strokeWidth={2} dot={{ r: 3.5 }} />
          </LineChart>
        </ChartFrame>
      )}
    </div>
  );
}

export function SoilWetnessChart({ months }: { months: MonthClimate[] }) {
  const { L, month, num } = useI18n();
  const data = months.map((m) => ({
    name: month(m.month),
    top: m.gwetTop === null ? null : m.gwetTop * 100,
    root: m.gwetRoot === null ? null : m.gwetRoot * 100,
  }));
  return (
    <ChartFrame
      summary={L("Monthly surface and root-zone soil wetness (0–100%), NASA POWER / MERRA-2.", "Độ ẩm đất bề mặt và vùng rễ theo tháng (0–100%), NASA POWER / MERRA-2.")}
      table={{
        head: [L("Month", "Tháng"), L("Surface %", "Bề mặt %"), L("Root zone %", "Vùng rễ %")],
        rows: data.map((d) => [d.name, d.top === null ? "—" : num(d.top), d.root === null ? "—" : num(d.root)]),
      }}
    >
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="name" {...AXIS} />
        <YAxis {...AXIS} width={44} domain={[0, 100]} unit="%" />
        <Tooltip content={<ChartTooltip unit="%" />} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconSize={9} />
        <Area dataKey="root" name={L("Root zone wetness", "Độ ẩm vùng rễ")} stroke="#24628d" fill="#4A94C7" fillOpacity={0.18} strokeWidth={2} type="monotone" />
        <Line dataKey="top" name={L("Surface wetness", "Độ ẩm bề mặt")} stroke="#4A94C7" strokeWidth={2} strokeDasharray="5 3" dot={false} type="monotone" />
      </ComposedChart>
    </ChartFrame>
  );
}

export { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Area };
