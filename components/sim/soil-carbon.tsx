"use client";

import { useI18n } from "@/lib/i18n";
import type { SimulationResult } from "@/lib/types";
import { SoilMeter, StatusBadge } from "@/components/common";

/** One presentation of the RothC result across simulator, comparison, planner and landing. */
export function SoilCarbon({ result, compact = false, details = false, badge = true, notes = true }: {
  result: SimulationResult; compact?: boolean; details?: boolean; badge?: boolean;
  /** source/limitation footnotes; turn off when the page shows them once for several cards */
  notes?: boolean;
}) {
  const { t, num, signed } = useI18n();
  const soil = result.soilImprovementPotential;
  const inputs = result.soilCarbonInputs;
  if (!soil) return <div className="space-y-1 text-xs text-ink-2">
    {badge && <StatusBadge status="unavailable" withTip={false} />}
    <p>{t(result.metricSources.soilImprovementPotential)}</p>
  </div>;
  return <div className="space-y-1.5">
    <div className="flex flex-wrap items-center gap-2">
      <p className={`${compact ? "text-lg" : "text-2xl"} font-display font-bold tabular text-ink`}>
        {num(soil.socTCHa, 2)} <span className="text-xs font-medium">t C/ha</span>
      </p>
      {badge && <StatusBadge status="estimated" withTip={false} />}
    </div>
    <p className="text-[11px] text-ink-2 tabular">{t("rothc.change", {
      delta: signed(soil.deltaTCHa, 2), rate: signed(soil.deltaPctPerYear, 2),
    })}</p>
    <SoilMeter level={soil.level} compact={compact} />
    {notes && <p className="text-[10px] text-ink-3">{t("rothc.depthSource")}</p>}
    {notes && compact && <p className="text-[10px] leading-relaxed text-ink-2">{t("rothc.compactLimit")}</p>}
    {details && inputs && <div className="rounded-lg bg-sand p-2 text-xs leading-relaxed text-ink-2">
      <p className="font-semibold text-ink">{t("rothc.gapTitle")}</p>
      <p>{t("rothc.inputGap", { equilibrium: num(inputs.equilibriumPlantC, 2),
        residues: num(inputs.referencePlantC, 2), ratio: num(inputs.inputRatio * 100, 1) })}</p>
      <p className="mt-1">{t("rothc.gapAction")}</p>
    </div>}
  </div>;
}
