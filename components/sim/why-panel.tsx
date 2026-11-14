"use client";

import { ArrowDownRight, ArrowUpRight, CloudSun, Droplets, Info, Leaf, Shuffle, AlertTriangle, Sprout } from "lucide-react";
import { climateValues, useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { getCrop, SEASON_ORDER } from "@/lib/data/crops";
import type { ClimateAssumption, FarmProfile, SimulationResult } from "@/lib/types";
import { cn } from "@/components/ui/primitives";

type Tone = "positive" | "negative" | "neutral";
interface Reason {
  icon: typeof Info;
  tone: Tone;
  text: string;
}

export function useWhyReasons({
  result,
  previous,
  reference,
  baselineClimate,
  assumption,
  farm,
}: {
  result: SimulationResult | null;
  previous: SimulationResult | null;
  reference: SimulationResult | null;
  baselineClimate: SimulationResult | null;
  assumption: ClimateAssumption;
  farm: FarmProfile | null;
}): Reason[] {
  const { t, crop, season, num, signed, factorText, lang } = useI18n();
  const custom = useApp((s) => s.customClimate);
  const reasons: Reason[] = [];
  if (!result || !reference || !farm) return reasons;

  if (result.isBaselineYear) {
    reasons.push({
      icon: Info,
      tone: "neutral",
      text: t("why.baselineYear", { pattern: SEASON_ORDER.map((s) => crop(farm.cropHistory.typicalPattern[s])).join(" → ") }),
    });
  } else {
    let anySwap = false;
    result.seasons.forEach((s, i) => {
      const r = reference.seasons[i];
      if (!r || s.cropId === r.cropId) return;
      anySwap = true;
      const delta = s.irrigation.median - r.irrigation.median;
      const fromFlood = getCrop(r.cropId)?.flooded;
      const toFlood = getCrop(s.cropId)?.flooded;
      reasons.push({
        icon: Droplets,
        tone: delta < -10 ? "positive" : delta > 10 ? "negative" : "neutral",
        text: t(fromFlood && !toFlood ? "why.swapFlood" : "why.swap", {
          season: season(s.season),
          from: crop(r.cropId),
          to: crop(s.cropId),
          delta: signed(delta),
        }),
      });
    });
    if (!anySwap) reasons.push({ icon: Info, tone: "neutral", text: t("why.same") });
  }

  if (assumption !== "baseline" && baselineClimate) {
    const delta = result.waterDemand.median - baselineClimate.waterDemand.median;
    reasons.push({
      icon: CloudSun,
      tone: delta > 10 ? "negative" : delta < -10 ? "positive" : "neutral",
      text: t("why.climate", { assumption: t(`clim.${assumption}`), def: t(`clim.${assumption}.def`, climateValues(lang, custom)), delta: signed(delta) }),
    });
  }

  const soil = result.soilImprovementPotential;
  if (previous) {
    const legumes = result.seasons.filter((s) => getCrop(s.cropId)?.agronomicProperties.nFixing && getCrop(s.cropId)?.category !== "green_manure").length;
    const green = result.seasons.filter((s) => getCrop(s.cropId)?.category === "green_manure").length;
    let riceRun = 0;
    result.seasons.forEach((s, i) => {
      const prevCrop = i === 0 ? previous.seasons[2]?.cropId : result.seasons[i - 1].cropId;
      if (getCrop(s.cropId)?.flooded && getCrop(prevCrop)?.flooded) riceRun++;
    });
    const dIdx = soil.index - previous.soilImprovementPotential.index;
    if (soil.level > previous.soilImprovementPotential.level || dIdx > 0.08)
      reasons.push({
        icon: Sprout,
        tone: "positive",
        text: t("why.soilUp", { from: t(`soil.${previous.soilImprovementPotential.level}`), to: t(`soil.${soil.level}`), legumes, green }),
      });
    else if (soil.level < previous.soilImprovementPotential.level || dIdx < -0.08)
      reasons.push({
        icon: Leaf,
        tone: "negative",
        text: t("why.soilDown", { from: t(`soil.${previous.soilImprovementPotential.level}`), to: t(`soil.${soil.level}`), rice: riceRun }),
      });
    else reasons.push({ icon: Leaf, tone: soil.level <= 2 ? "negative" : "neutral", text: t("why.soilSame", { level: t(`soil.${soil.level}`) }) });
  }

  const div = result.rotationDiversity;
  reasons.push({
    icon: Shuffle,
    tone: div.cls === "high" ? "positive" : div.cls === "low" ? "negative" : "neutral",
    text: t("why.diversity", { n: div.distinctCrops, f: div.families, h: num(div.shannon, 2) }),
  });

  const worst = result.seasons
    .filter((s) => s.cropId && s.cropId !== "fallow" && s.suitability.limiting)
    .sort((a, b) => a.suitability.score - b.suitability.score)[0];
  if (worst) {
    const f = worst.suitability.factors.find((x) => x.id === worst.suitability.limiting)!;
    reasons.push({
      icon: AlertTriangle,
      tone: "negative",
      text: t("why.limit", { crop: crop(worst.cropId), season: season(worst.season), factor: t(`factor.${f.id}.name`).toLowerCase(), detail: factorText(f) }),
    });
  }

  const stressed = result.seasons.filter((s) => s.stressLevel >= 2).sort((a, b) => b.stressLevel - a.stressLevel)[0];
  if (stressed)
    reasons.push({
      icon: Droplets,
      tone: "negative",
      text: t("why.stress", { season: season(stressed.season), mm: num(stressed.irrigation.median), cap: num(stressed.capacityMm) }),
    });

  if (!result.isBaselineYear && Math.abs(result.nitrogenNeed - reference.nitrogenNeed) > 5)
    reasons.push({
      icon: result.nitrogenNeed < reference.nitrogenNeed ? ArrowDownRight : ArrowUpRight,
      tone: result.nitrogenNeed < reference.nitrogenNeed ? "positive" : "negative",
      text: t("why.nitrogen", { n: num(result.nitrogenNeed), ref: num(reference.nitrogenNeed) }),
    });

  return reasons;
}

export function WhyPanel({ reasons }: { reasons: Reason[] }) {
  const { L, t } = useI18n();
  return (
    <div>
      <ul className="space-y-2" aria-live="polite">
        {reasons.map((r, i) => (
          <li key={i} className="flex items-start gap-2.5 rounded-xl bg-sand px-3 py-2.5 text-sm leading-snug animate-fade-in">
            <span
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg",
                r.tone === "positive" ? "bg-mint text-leaf-ink" : r.tone === "negative" ? "bg-risk-soft text-risk-ink" : "bg-white text-ink-2",
              )}
            >
              <r.icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span>
              <span className="sr-only">{r.tone === "positive" ? L("Benefit: ", "Lợi ích: ") : r.tone === "negative" ? L("Concern: ", "Lưu ý: ") : ""}</span>
              {r.text}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs italic text-ink-2">{t("why.caveat")}</p>
    </div>
  );
}
