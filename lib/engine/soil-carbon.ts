import { CROP_MAP, getCrop } from "../data/crops";
import type { FarmProfile, ScenarioSimulation, SeasonResult, SimulationResult } from "../types";
import type { PreparedClimate } from "./climate";
import { runRothC, spinUp, totalCarbon, type RothCMonth, type RothCPools, type RothCSoil } from "./rothc";

/** 4 per 1000 is an aspirational reference, not a validated field-level target.
 * https://4p1000.org/decouvrir/ — other level boundaries are app presentation choices.
 */
export const SOIL_C_TARGET_PCT_YEAR = 0.4;

export function soilCarbonRating(rate: number): { level: 1 | 2 | 3 | 4 | 5; score: number } {
  const level = rate >= 0.4 ? 5 : rate >= 0.1 ? 4 : rate > -0.1 ? 3 : rate >= -0.4 ? 2 : 1;
  return { level, score: Math.max(0, Math.min(100, 50 + rate / SOIL_C_TARGET_PCT_YEAR * 50)) };
}

/** Reuse the engine's crop-year cover (Dec…Nov) and evaluated season dates.
 * `cyclic` wraps harvests for the repeating current-practice spin-up cycle only.
 * Two simultaneous residue inputs are mixed by DPM/RPM carbon mass, not mean ratios.
 */
export function rothCMonths(
  result: Pick<SimulationResult, "year" | "monthlyCover">,
  climate: PreparedClimate,
  seasons: SeasonResult[],
  paddyField: boolean,
  cyclic = false,
): RothCMonth[] {
  const startMonth = result.year * 12 - 1;
  const dpm = Array<number>(12).fill(0);
  const rpm = Array<number>(12).fill(0);
  for (const season of seasons) {
    const crop = getCrop(season.cropId);
    if (!crop || crop.id === "fallow") continue;
    const harvest = new Date(Date.UTC(season.year, season.startOffset - 1, 1) + (season.durationDays - 1) * 86400000);
    let index = harvest.getUTCFullYear() * 12 + harvest.getUTCMonth() - startMonth;
    if (cyclic) index = ((index % 12) + 12) % 12;
    if (index < 0 || index >= 12) continue;
    const { residueCTHa: carbon, dpmRpm } = crop.rothc;
    dpm[index] += carbon * dpmRpm / (1 + dpmRpm);
    rpm[index] += carbon / (1 + dpmRpm);
  }
  return Array.from({ length: 12 }, (_, i) => {
    const absolute = startMonth + i;
    const month = absolute % 12 + 1;
    const year = Math.floor(absolute / 12);
    const weather = climate.climatology[month - 1];
    const crop = getCrop(result.monthlyCover[i]);
    const vegetated = !!crop && crop.id !== "fallow";
    return {
      tempC: weather.t2m, rainMm: weather.precipMm,
      panEvapMm: weather.et0Day * new Date(Date.UTC(year, month, 0)).getUTCDate() / 0.75,
      vegetated,
      waterRegime: vegetated && crop.flooded ? "paddyFlooded" : paddyField ? "paddyDrained" : "upland",
      plantC: dpm[i] + rpm[i], dpmRpm: rpm[i] > 0 ? dpm[i] / rpm[i] : CROP_MAP.fallow.rothc.dpmRpm,
      fymC: 0, // No farmer FYM field exists: never invent manure input.
    };
  });
}

type SoilCarbonSetup = {
  soil: RothCSoil; pools: RothCPools; tsmd: number; initialC: number;
  annualPlantC: number; referencePlantC: number;
} | { reason: string };

export function initializeSoilCarbon(farm: FarmProfile, baseline: PreparedClimate, current: SimulationResult): SoilCarbonSetup {
  const { clayPercent, socStockTCHa } = farm;
  if (clayPercent == null || socStockTCHa == null || !Number.isFinite(clayPercent) ||
      !Number.isFinite(socStockTCHa) || clayPercent < 0 || clayPercent > 100 || socStockTCHa <= 0) return { reason: "rothc.missing" };
  if (baseline.climatology.length !== 12 || baseline.climatology.some((m) =>
    ![m.t2m, m.precipMm, m.et0Day].every(Number.isFinite) || !baseline.dataset.months.some((r) => r.month === m.month))) return { reason: "rothc.climateMissing" };
  const paddy = Object.values(farm.cropHistory.typicalPattern).some((id) => getCrop(id)?.flooded);
  const year = rothCMonths(current, baseline, current.seasons, paddy, true);
  const referencePlantC = year.reduce((sum, m) => sum + m.plantC, 0);
  if (referencePlantC <= 0) return { reason: "rothc.noInput" };
  const soil = { clayPercent, socStockTCHa, depthCm: 30 };
  const spun = spinUp(soil, year);
  return { soil, ...spun, initialC: totalCarbon(spun.pools), referencePlantC };
}

/** Baseline is the initial stock; each subsequent Dec…Nov cycle advances one year.
 * Share the baseline-climate inverse spin-up across every scenario and climate comparison.
 */
export function applySoilCarbon(simulation: ScenarioSimulation, climate: PreparedClimate, setup: SoilCarbonSetup): ScenarioSimulation {
  const seasons = simulation.years.flatMap((y) => y.seasons);
  let paddyField = simulation.years[0].seasons.some((s) => getCrop(s.cropId)?.flooded);
  let pools = "pools" in setup ? setup.pools : null;
  let tsmd = "tsmd" in setup ? setup.tsmd : 0;
  return { ...simulation, years: simulation.years.map((result, i) => {
    if ("reason" in setup) return { ...result, soilImprovementPotential: null, soilCarbonInputs: null,
      criteriaScores: { ...result.criteriaScores, soil: null },
      metricSources: { ...result.metricSources, soilImprovementPotential: setup.reason },
      assumptions: [...result.assumptions, setup.reason],
      dataStatus: { ...result.dataStatus, soilImprovementPotential: "unavailable" } };
    paddyField ||= result.seasons.some((s) => getCrop(s.cropId)?.flooded);
    const months = rothCMonths(result, climate, i === 0 ? result.seasons : seasons, paddyField, i === 0);
    let socTCHa = setup.initialC;
    if (i > 0) {
      const last = runRothC(setup.soil, pools!, months, tsmd).at(-1)!;
      pools = last.pools; tsmd = last.tsmd; socTCHa = last.totalC;
    }
    const deltaTCHa = socTCHa - setup.initialC;
    const deltaPctPerYear = i === 0 ? 0 : deltaTCHa / setup.initialC * 100 / i;
    const rating = soilCarbonRating(deltaPctPerYear);
    return { ...result,
      soilImprovementPotential: { socTCHa, deltaTCHa, deltaPctPerYear, ...rating },
      soilCarbonInputs: { equilibriumPlantC: setup.annualPlantC, referencePlantC: setup.referencePlantC,
        inputRatio: setup.referencePlantC / setup.annualPlantC,
        annualPlantC: months.reduce((sum, m) => sum + m.plantC, 0),
        vegetatedMonths: months.filter((m) => m.vegetated).length,
        floodedMonths: months.filter((m) => m.waterRegime === "paddyFlooded").length },
      criteriaScores: { ...result.criteriaScores, soil: 0.7 * rating.score + 0.3 * result.rotationDiversity.score },
      assumptions: [...result.assumptions, "asm.rothc", "asm.rothcGap"],
      dataStatus: { ...result.dataStatus, soilImprovementPotential: "estimated" },
    };
  }) };
}
