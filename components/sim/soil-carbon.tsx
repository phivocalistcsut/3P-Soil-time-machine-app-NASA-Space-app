"use client";

import { useI18n } from "@/lib/i18n";
import type { SimulationResult } from "@/lib/types";
import { SoilMeter, StatusBadge } from "@/components/common";

/**
 * One presentation of the RothC result across simulator, comparison, planner and landing.
 * With a `reference` (current practice), the headline is the difference between plans: absolute
 * SOC has low confidence (modelled soil, estimated residues), while the gap between plans run on the
 * same soil and climate is the more robust signal for a farmer's decision.
 */
export function SoilCarbon({ result, reference, compact = false, details = false, badge = true, notes = true }: {
  result: SimulationResult; reference?: SimulationResult | null; compact?: boolean; details?: boolean; badge?: boolean;
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
  const ref = reference && reference !== result ? reference.soilImprovementPotential : null;
  const vsRef = ref ? soil.socTCHa - ref.socTCHa : null;
  const allDecline = soil.deltaTCHa < 0 && (!ref || ref.deltaTCHa < 0);
  return <div className="space-y-1.5">
    {vsRef !== null && (
      <p className={`${compact ? "text-sm" : "text-base"} font-bold tabular ${vsRef > 0.005 ? "text-leaf-ink" : vsRef < -0.005 ? "text-risk-ink" : "text-ink-2"}`}>
        {Math.abs(vsRef) <= 0.005 ? t("rothc.sameAsCurrent") : t("rothc.vsCurrent", { delta: signed(vsRef, 2) })}
      </p>
    )}
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
    {details && allDecline && <p className="text-xs leading-relaxed text-ink-2">{t("rothc.allDecline")}</p>}
    {details && inputs && <details className="rounded-lg bg-sand p-2 text-xs leading-relaxed text-ink-2">
      <summary className="cursor-pointer font-semibold text-ink">{t("rothc.whyDecline")}</summary>
      <p className="mt-1">{t("rothc.whyDeclinePlain", { ratio: num(inputs.inputRatio * 100, 0) })}</p>
      <p className="mt-1 text-[11px] text-ink-3">{t("rothc.inputGap", { equilibrium: num(inputs.equilibriumPlantC, 2),
        residues: num(inputs.referencePlantC, 2), ratio: num(inputs.inputRatio * 100, 1) })}</p>
      <p className="mt-1">{t("rothc.gapAction")}</p>
    </details>}
  </div>;
}
