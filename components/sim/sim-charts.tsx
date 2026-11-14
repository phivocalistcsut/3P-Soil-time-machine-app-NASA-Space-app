"use client";

import { useState } from "react";
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "@/lib/i18n";
import type { RotationScenario, ScenarioSimulation } from "@/lib/types";
import { AXIS, ChartFrame, ChartTooltip, GRID } from "@/components/charts";
import { scenarioColor } from "@/components/common";
import { cn } from "@/components/ui/primitives";

const DASHES = ["", "6 3", "2 3", "8 3 2 3"];

export function TrendCharts({
  scenarios,
  results,
  reference,
  activeId,
  years,
  selectedYear,
}: {
  scenarios: RotationScenario[];
  results: Record<string, ScenarioSimulation>;
  reference: ScenarioSimulation;
  activeId: string;
  years: number[];
  selectedYear: number;
}) {
  const { L, t, num } = useI18n();
  const [metric, setMetric] = useState<"water" | "soil" | "diversity">("water");
  const shown = scenarios.slice(0, 4);
  const data = years.map((y, i) => {
    const row: Record<string, number | [number, number] | string | null> = { year: y };
    row.ref = metric === "water" ? reference.years[i].waterDemand.median : metric === "soil" ? reference.years[i].soilImprovementPotential?.socTCHa ?? null : reference.years[i].rotationDiversity.shannon;
    shown.forEach((s) => {
      const r = results[s.id]?.years[i];
      if (!r) return;
      row[s.id] = metric === "water" ? r.waterDemand.median : metric === "soil" ? r.soilImprovementPotential?.socTCHa ?? null : r.rotationDiversity.shannon;
      if (s.id === activeId && metric === "water") row._band = [r.waterDemand.p10, r.waterDemand.p90];
    });
    return row;
  });
  const fmt = (v: unknown) => typeof v === "number" && Number.isFinite(v) ? num(v, metric === "water" ? 0 : 2) : "—";
  const unit = metric === "water" ? "mm" : metric === "soil" ? "t C/ha" : "";
  const tabs = [
    ["water", L("Irrigation demand", "Nhu cầu tưới")],
    ["soil", `${t("rothc.title")} (t C/ha)`],
    ["diversity", L("Rotation diversity", "Đa dạng luân canh")],
  ] as const;

  return (
    <div>
      <div role="tablist" aria-label={L("Trend metric", "Chỉ số xu hướng")} className="mb-3 inline-flex rounded-lg bg-sand-2 p-0.5 text-xs font-medium">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={metric === id} onClick={() => setMetric(id)} className={cn("rounded-md px-3 py-1.5", metric === id ? "bg-white text-ink shadow-sm" : "text-ink-2")}>
            {label}
          </button>
        ))}
      </div>
      <ChartFrame
        height={250}
        summary={L(`Trend of ${tabs.find((x) => x[0] === metric)![1]} by year for each scenario and current practice.`, `Xu hướng ${tabs.find((x) => x[0] === metric)![1]} theo năm cho từng kịch bản và canh tác hiện tại.`)}
        table={{
          head: [L("Year", "Năm"), L("Current practice", "Hiện tại"), ...shown.map((s) => s.name)],
          rows: data.map((d) => [
            d.year as number,
            fmt(d.ref),
            ...shown.map((s) => fmt(d[s.id])),
          ]),
        }}
      >
        <ComposedChart data={data} margin={{ top: 10, right: 12, left: metric === "soil" ? 18 : -6, bottom: 0 }}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="year" {...AXIS} />
          <YAxis
            {...AXIS}
            width={metric === "soil" ? 74 : 48}
            domain={metric === "soil" ? ["auto", "auto"] : [0, "auto"]}
            tickFormatter={(v) => fmt(v)}
          />
          <Tooltip content={<ChartTooltip unit={unit} digits={metric === "water" ? 0 : 2} />} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconSize={9} />
          <ReferenceLine x={selectedYear} stroke="#174D3A" strokeDasharray="3 3" label={{ value: String(selectedYear), position: "top", fill: "#174D3A", fontSize: 11 }} />
          {metric === "water" && <Area dataKey="_band" stroke="none" fill={scenarioColor(scenarios.find((s) => s.id === activeId))} fillOpacity={0.12} legendType="none" isAnimationActive={false} name="_band" />}
          <Line dataKey="ref" name={L("Current practice", "Canh tác hiện tại")} stroke="#86938c" strokeWidth={2} strokeDasharray="2 4" dot={false} type="linear" />
          {shown.map((s, i) => (
            <Line
              key={s.id}
              dataKey={s.id}
              name={s.name}
              stroke={scenarioColor(s, i)}
              strokeWidth={s.id === activeId ? 3 : 2}
              strokeDasharray={DASHES[i % DASHES.length]}
              dot={{ r: s.id === activeId ? 4 : 3 }}
              type="linear"
              animationDuration={300}
            />
          ))}
        </ComposedChart>
      </ChartFrame>
      {metric === "soil" && <p className="mt-2 text-[11px] text-ink-3">{t("rothc.depthSource")} · {t("status.estimated")}. {t("rothc.limit")}</p>}
      {metric === "water" && (
        <p className="mt-1 text-[11px] text-ink-3">
          {L("Shaded band: 10–90% range across historical weather years for the selected scenario.", "Vùng tô: khoảng 10–90% theo các năm thời tiết lịch sử cho kịch bản đang chọn.")} {t("status.estimated")}.
        </p>
      )}
    </div>
  );
}

export function MonthlyWaterChart({ monthly, refMonthly, color, name }: { monthly: number[]; refMonthly: number[]; color: string; name: string }) {
  const { L, month, num } = useI18n();
  const months = [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const data = months.map((m, i) => ({ name: `${month(m)}${i === 0 || i === 13 ? "*" : ""}`, s: monthly[i] ?? 0, r: refMonthly[i] ?? 0 }));
  return (
    <ChartFrame
      height={210}
      summary={L("Monthly irrigation need in the selected year: scenario vs current practice.", "Nhu cầu tưới theo tháng trong năm đã chọn: kịch bản so với hiện tại.")}
      table={{ head: [L("Month", "Tháng"), name, L("Current practice", "Hiện tại")], rows: data.map((d) => [d.name, num(d.s), num(d.r)]) }}
    >
      <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }} barGap={2}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="name" {...AXIS} interval={0} tick={{ ...AXIS.tick, fontSize: 10 }} />
        <YAxis {...AXIS} width={44} />
        <Tooltip content={<ChartTooltip unit="mm" />} cursor={{ fill: "#F2F4EF" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconSize={9} />
        <Bar dataKey="r" name={L("Current practice", "Canh tác hiện tại")} fill="#C9CFC6" radius={[4, 4, 0, 0]} maxBarSize={16} />
        <Bar dataKey="s" name={name} fill={color} radius={[4, 4, 0, 0]} maxBarSize={16} animationDuration={300} />
      </BarChart>
    </ChartFrame>
  );
}
