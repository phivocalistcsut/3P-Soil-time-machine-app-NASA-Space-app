"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Bug, ChevronDown, CloudRain, Coins, Droplets, Minus, ShieldAlert, Shuffle, Sprout, ThermometerSun } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { Confidence, DataStatus, SimulationResult } from "@/lib/types";
import { ConfidenceBadge, SoilMeter, StatusBadge, StressBadge, SuitBadge, Term } from "@/components/common";
import { Badge, Card, cn } from "@/components/ui/primitives";

function Delta({ value, better, unit, digits = 0, neutralBand = 0.5 }: { value: number; better: "lower" | "higher"; unit?: string; digits?: number; neutralBand?: number }) {
  const { L, num } = useI18n();
  if (!Number.isFinite(value) || Math.abs(value) < neutralBand)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-2">
        <Minus className="h-3 w-3" aria-hidden />
        {L("same as current practice", "như canh tác hiện tại")}
      </span>
    );
  const good = better === "lower" ? value < 0 : value > 0;
  const Icon = value > 0 ? ArrowUp : ArrowDown;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", good ? "text-leaf-ink" : "text-risk-ink")}>
      <Icon className="h-3 w-3" aria-hidden />
      {value > 0 ? "+" : "−"}
      {num(Math.abs(value), digits)}
      {unit ? ` ${unit}` : ""} {good ? L("(better)", "(tốt hơn)") : L("(worse)", "(kém hơn)")}
    </span>
  );
}

function Outcome({
  icon,
  title,
  status,
  confidence,
  children,
  baseline,
  delta,
  method,
  explanation,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  status: DataStatus;
  confidence: Confidence;
  children: React.ReactNode;
  baseline: React.ReactNode;
  delta: React.ReactNode;
  method: string;
  explanation: string;
  accent: string;
}) {
  const { L } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", accent)}>{icon}</span>
          <h3 className="text-[13px] font-semibold leading-tight">{title}</h3>
        </div>
        <StatusBadge status={status} withTip={false} />
      </div>
      <div className="mt-2.5 value-transition">{children}</div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line pt-2 text-xs">
        <span className="text-ink-2">
          {L("Current practice", "Hiện tại")}: <span className="font-semibold text-ink">{baseline}</span>
        </span>
        {delta}
      </div>
      <p className="mt-1.5 text-[11.5px] leading-snug text-ink-2">{explanation}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <ConfidenceBadge level={confidence} />
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-forest hover:underline">
          {L("Method", "Cách tính")}
          <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      </div>
      {open && <p className="mt-1.5 rounded-lg bg-sand px-2.5 py-2 text-[11px] leading-relaxed text-ink-2 animate-fade-in">{method}</p>}
    </Card>
  );
}

export function OutcomePanel({ result, reference }: { result: SimulationResult; reference: SimulationResult }) {
  const { L, t, num, season } = useI18n();
  const r = result;
  const b = reference;
  const wd = r.waterDemand;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Outcome
        icon={<Droplets className="h-4 w-4" aria-hidden />}
        accent="bg-water-soft text-water-ink"
        title={L("Estimated irrigation demand", "Nhu cầu tưới ước tính")}
        status={r.dataStatus.waterDemand}
        confidence={r.uncertainty.waterDemand}
        baseline={`${num(b.waterDemand.median)} mm`}
        delta={<Delta value={wd.median - b.waterDemand.median} better="lower" unit="mm" neutralBand={5} />}
        method={t(r.metricSources.waterDemand)}
        explanation={L(
          `Net irrigation for the year's crops. Range shows dry-to-wet years in the historical record.`,
          `Lượng tưới ròng cho các vụ trong năm. Khoảng giá trị thể hiện năm khô đến năm ẩm trong chuỗi lịch sử.`,
        )}
      >
        <p className="font-display text-2xl font-bold tabular">
          {num(wd.median)} <span className="text-sm font-medium text-ink-2">mm/{L("yr", "năm")}</span>
        </p>
        <p className="text-xs text-ink-2 tabular">
          ≈ {num(wd.m3PerHa)} m³/ha · {L("range", "khoảng")} {num(wd.p10)}–{num(wd.p90)} mm
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-2" aria-hidden>
          <div className="h-full rounded-full bg-water transition-all duration-300" style={{ width: `${Math.min(100, (wd.median / 1600) * 100)}%` }} />
        </div>
      </Outcome>

      <Outcome
        icon={<ShieldAlert className="h-4 w-4" aria-hidden />}
        accent="bg-amber-soft text-amber-ink"
        title={L("Water stress exposure", "Mức độ thiếu nước")}
        status={r.dataStatus.waterRisk}
        confidence={r.uncertainty.waterRisk}
        baseline={t(`stress.${b.waterRisk.level}`)}
        delta={<Delta value={r.waterRisk.level - b.waterRisk.level} better="lower" neutralBand={0.5} unit={L("level(s)", "bậc")} />}
        method={t(r.metricSources.waterRisk) + " " + t("asm.supply")}
        explanation={
          r.waterRisk.worstSeason
            ? L(`Tightest season: ${season(r.waterRisk.worstSeason)}.`, `Vụ căng thẳng nhất: ${season(r.waterRisk.worstSeason)}.`) +
              (r.waterRisk.dryYearExceeds ? " " + t("risk.dryYear") + "." : "")
            : L("Irrigation need stays well within the assumed supply.", "Nhu cầu tưới nằm trong khả năng cấp nước giả định.")
        }
      >
        <div className="flex items-center gap-2">
          <StressBadge level={r.waterRisk.level} />
          <span className="text-xs text-ink-2">
            {r.seasons
              .filter((s) => s.cropId && s.cropId !== "fallow")
              .map((s) => `${season(s.season)} ${Number.isFinite(s.stressRatio) ? num(s.stressRatio * 100) + "%" : "—"}`)
              .join(" · ")}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-ink-3">{L("% = irrigation need ÷ assumed seasonal supply", "% = nhu cầu tưới ÷ nguồn nước giả định mỗi vụ")}</p>
      </Outcome>

      <Outcome
        icon={<Sprout className="h-4 w-4" aria-hidden />}
        accent="bg-mint text-forest"
        title={L("Soil improvement potential", "Tiềm năng cải thiện đất")}
        status={r.dataStatus.soilImprovementPotential}
        confidence={r.uncertainty.soilImprovementPotential}
        baseline={t(`soil.${b.soilImprovementPotential.level}`)}
        delta={<Delta value={r.soilImprovementPotential.level - b.soilImprovementPotential.level} better="higher" neutralBand={0.5} unit={L("level(s)", "bậc")} />}
        method={t(r.metricSources.soilImprovementPotential) + " " + t("asm.soilMemory")}
        explanation={L(
          "Qualitative direction of change from rotation practices — not a soil-carbon number.",
          "Xu hướng thay đổi định tính theo tập quán luân canh — không phải con số carbon trong đất.",
        )}
      >
        <SoilMeter level={r.soilImprovementPotential.level} />
      </Outcome>

      <Outcome
        icon={<Shuffle className="h-4 w-4" aria-hidden />}
        accent="bg-[#EFE7F6] text-[#5B3F86]"
        title={L("Crop rotation diversity", "Đa dạng luân canh")}
        status={r.dataStatus.rotationDiversity}
        confidence={r.uncertainty.rotationDiversity}
        baseline={`H′ ${num(b.rotationDiversity.shannon, 2)}`}
        delta={<Delta value={r.rotationDiversity.shannon - b.rotationDiversity.shannon} better="higher" digits={2} neutralBand={0.01} />}
        method={t(r.metricSources.rotationDiversity)}
        explanation={L(
          `${r.rotationDiversity.distinctCrops} crops, ${r.rotationDiversity.families} families, ${r.rotationDiversity.legumeSeasons} legume seasons in the last 3 years.`,
          `${r.rotationDiversity.distinctCrops} loại cây, ${r.rotationDiversity.families} họ, ${r.rotationDiversity.legumeSeasons} vụ cây họ đậu trong 3 năm gần nhất.`,
        )}
      >
        <div className="flex items-center gap-2">
          <p className="font-display text-2xl font-bold tabular">H′ {num(r.rotationDiversity.shannon, 2)}</p>
          <Badge tone={r.rotationDiversity.cls === "high" ? "green" : r.rotationDiversity.cls === "moderate" ? "amber" : "red"}>{t(`div.${r.rotationDiversity.cls}`)}</Badge>
        </div>
      </Outcome>

      <Outcome
        icon={<ThermometerSun className="h-4 w-4" aria-hidden />}
        accent="bg-[#F3E9DC] text-earth-ink"
        title={L("Climate suitability", "Phù hợp khí hậu")}
        status={r.dataStatus.cropSuitability}
        confidence={r.uncertainty.cropSuitability}
        baseline={`${num(b.cropSuitability.score)}/100`}
        delta={<Delta value={r.cropSuitability.score - b.cropSuitability.score} better="higher" neutralBand={1} />}
        method={t(r.metricSources.cropSuitability)}
        explanation={L("Average crop–climate–soil compatibility of this year's crops.", "Mức tương thích trung bình giữa cây – khí hậu – đất của các vụ trong năm.")}
      >
        <div className="flex items-center gap-2">
          <p className="font-display text-2xl font-bold tabular">
            {num(r.cropSuitability.score)}
            <span className="text-sm font-medium text-ink-2">/100</span>
          </p>
          <SuitBadge cls={r.cropSuitability.cls} />
        </div>
      </Outcome>

      <Outcome
        icon={<Coins className="h-4 w-4" aria-hidden />}
        accent="bg-sand-2 text-ink-2"
        title={L("Economic outlook", "Triển vọng kinh tế")}
        status={r.dataStatus.economics}
        confidence={r.uncertainty.economics}
        baseline={b.economics ? `${num(b.economics.grossMargin, 1)} ${L("M VND/ha", "tr. đ/ha")}` : "—"}
        delta={r.economics && b.economics ? <Delta value={r.economics.grossMargin - b.economics.grossMargin} better="higher" digits={1} unit={L("M VND", "tr. đ")} /> : <span />}
        method={t(r.metricSources.economics)}
        explanation={
          r.economics
            ? L("Gross margin per hectare per year from the economic inputs in Settings.", "Lãi gộp mỗi ha mỗi năm theo số liệu kinh tế trong Cài đặt.")
            : L("Needs local yield, price and cost data for every crop in this year.", "Cần năng suất, giá và chi phí tại địa phương cho mọi cây trong năm này.")
        }
      >
        {r.economics ? (
          <p className="font-display text-2xl font-bold tabular">
            {num(r.economics.grossMargin, 1)} <span className="text-sm font-medium text-ink-2">{L("M VND/ha/yr", "tr. đ/ha/năm")}</span>
          </p>
        ) : (
          <Link href="/settings#economics" className="text-sm font-semibold text-forest underline-offset-2 hover:underline">
            {L("Add economic data →", "Thêm số liệu kinh tế →")}
          </Link>
        )}
      </Outcome>

      <Outcome
        icon={<CloudRain className="h-4 w-4" aria-hidden />}
        accent="bg-[#F3E9DC] text-earth-ink"
        title={L("Bare soil under rain", "Đất trống dưới mưa")}
        status="estimated"
        confidence="low"
        baseline={L(`${b.bareSoil.months} months`, `${b.bareSoil.months} tháng`)}
        delta={<Delta value={r.bareSoil.index - b.bareSoil.index} better="lower" digits={1} neutralBand={0.2} />}
        method={L(
          "Sum over the 12 months of the share without living crop cover × (monthly rain ÷ 100 + 0.5 × heavy-rain days). Below 2 low, below 5 moderate. Slope is not included yet.",
          "Cộng 12 tháng: phần không có cây che phủ × (mưa tháng ÷ 100 + 0,5 × số ngày mưa lớn). Dưới 2 là thấp, dưới 5 là vừa. Chưa tính độ dốc.",
        )}
        explanation={L("Bare wet soil loses nutrients, grows weeds and — on slopes — erodes.", "Đất trống bị mưa làm mất dinh dưỡng, mọc cỏ và — ở nơi dốc — bị xói mòn.")}
      >
        <div className="flex items-center gap-2">
          <p className="font-display text-2xl font-bold tabular">
            {r.bareSoil.months} <span className="text-sm font-medium text-ink-2">{L("bare months", "tháng trống")}</span>
          </p>
          <Badge tone={r.bareSoil.cls === "low" ? "green" : r.bareSoil.cls === "moderate" ? "amber" : "red"}>
            {r.bareSoil.cls === "low" ? L("Low exposure", "Ít rủi ro") : r.bareSoil.cls === "moderate" ? L("Moderate", "Vừa") : L("High exposure", "Rủi ro cao")}
          </Badge>
        </div>
        <p className="mt-1 text-[11px] text-ink-3">
          <Term id="bare-soil">{L("How is this measured?", "Đo thế nào?")}</Term>
        </p>
      </Outcome>

      <Outcome
        icon={<Bug className="h-4 w-4" aria-hidden />}
        accent="bg-risk-soft text-risk-ink"
        title={L("Pest & disease cycle break", "Cắt vòng đời sâu bệnh")}
        status="estimated"
        confidence="medium"
        baseline={L(`${b.pestBreak.breaks} changes`, `${b.pestBreak.breaks} lần đổi`)}
        delta={<Delta value={r.pestBreak.breaks - b.pestBreak.breaks} better="higher" neutralBand={0.5} />}
        method={L(
          "Counts how often the crop family changes between consecutive seasons over the last 3 years (fallow counts as a break). Share of changes below 20% low, below 50% moderate.",
          "Đếm số lần họ cây thay đổi giữa hai vụ liên tiếp trong 3 năm gần nhất (để đất nghỉ cũng tính là đổi). Tỷ lệ đổi dưới 20% là thấp, dưới 50% là vừa.",
        )}
        explanation={L(
          `Longest run of the same crop family: ${r.pestBreak.maxRun} seasons. Long runs keep a constant host for pests such as planthoppers.`,
          `Chuỗi dài nhất cùng một họ cây: ${r.pestBreak.maxRun} vụ. Chuỗi càng dài, sâu bệnh như rầy nâu càng có nguồn thức ăn liên tục.`,
        )}
      >
        <div className="flex items-center gap-2">
          <p className="font-display text-2xl font-bold tabular">
            {r.pestBreak.breaks}/{r.pestBreak.transitions} <span className="text-sm font-medium text-ink-2">{L("changes", "lần đổi")}</span>
          </p>
          <Badge tone={r.pestBreak.cls === "high" ? "green" : r.pestBreak.cls === "moderate" ? "amber" : "red"}>
            {r.pestBreak.cls === "high" ? L("Good break", "Cắt tốt") : r.pestBreak.cls === "moderate" ? L("Partial", "Một phần") : L("Little break", "Ít cắt")}
          </Badge>
        </div>
        <p className="mt-1 text-[11px] text-ink-3">
          <Term id="pest-break">{L("Why does it matter?", "Vì sao quan trọng?")}</Term>
        </p>
      </Outcome>
    </div>
  );
}
