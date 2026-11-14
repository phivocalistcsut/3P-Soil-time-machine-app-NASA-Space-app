import type { EnvironmentalSeries } from "@/lib/data/evidence";
import { CROP_MAP, SEASONS, SEASON_ORDER, getCrop } from "@/lib/data/crops";
import type {
  ClimateDataset,
  Confidence,
  Crop,
  CriterionId,
  DataStatus,
  FarmProfile,
  FactorId,
  RotationScenario,
  ScenarioSimulation,
  SeasonId,
  SeasonResult,
  SeasonalCropSlot,
  SimulationResult,
  SimulationSettings,
  SoilTexture,
  SuitabilityFactor,
} from "@/lib/types";
import { smapWetMonths } from "./environment";
import { getMonth, prepareClimate, quantile, type PreparedClimate, climateAdjustment } from "./climate";
import { extremesClimatology } from "@/lib/services/power-daily";
import type { DailyExtremes } from "@/lib/types";

/* ============================================================================
 * Soil Time Machine — explainable scenario evaluation engine
 * Pure functions, JSON-serializable I/O (portable to a FastAPI service).
 * ========================================================================== */

export const ENGINE_VERSION = "0.4.0";

/** Paddy percolation + seepage (mm/day) and land-preparation water (mm) by texture. */
export const PERCOLATION_MM_DAY: Record<SoilTexture, number> = { clay: 1.5, silty_clay: 2, loam: 4, sandy_loam: 6, sand: 10 };
export const LAND_PREP_MM: Record<SoilTexture, number> = { clay: 150, silty_clay: 150, loam: 175, sandy_loam: 200, sand: 250 };
/** Assumed irrigation water that can be supplied per season (mm). */
export const SUPPLY_MM: Record<FarmProfile["waterAvailability"], number> = { abundant: 1000, moderate: 550, limited: 300 };
export const SOURCE_FACTOR: Record<FarmProfile["irrigationSource"], number> = { canal: 1, groundwater: 1, pond: 0.8, rainfed: 0 };
/** Soil memory: weight given to the current year when updating the soil indicator. */
export const SOIL_MEMORY_NEW = 0.4;
export const SOIL_LEVEL_THRESHOLDS = [-0.6, -0.2, 0.25, 0.6];
export const REF_IRRIGATION_MM = 1500;
export const REF_NITROGEN = 350;

/** crop-year month offset: crop year Y runs from Dec(Y-1) [offset 0] to Nov(Y) [offset 11]. */
export function monthOffset(season: SeasonId, month: number) {
  if (season === "S1" && month >= 10) return month - 12; // Nov → -1, Dec → 0
  return month;
}

const DAY = 86400000;

interface Bucket {
  k: number; // month index relative to Jan of crop year (A = Y*12 + k)
  days: number;
  kcSum: number;
  dim: number;
}

function kcAt(crop: Crop, x: number) {
  const { ini, mid, end } = crop.kc;
  if (x < 0.2) return ini;
  if (x < 0.5) return ini + ((mid - ini) * (x - 0.2)) / 0.3;
  if (x < 0.8) return mid;
  return mid + ((end - mid) * (x - 0.8)) / 0.2;
}

/** Split a crop window into calendar-month buckets (relative to crop year). */
function buildBuckets(crop: Crop, season: SeasonId, plantingMonth: number, refYear = 2001): Bucket[] {
  const off = monthOffset(season, plantingMonth);
  const k0 = off - 1;
  const startA = refYear * 12 + k0;
  const start = Date.UTC(Math.floor(startA / 12), ((startA % 12) + 12) % 12, 1);
  const buckets = new Map<number, Bucket>();
  const D = crop.growingDuration;
  for (let d = 0; d < D; d++) {
    const dt = new Date(start + d * DAY);
    const A = dt.getUTCFullYear() * 12 + dt.getUTCMonth();
    const k = A - refYear * 12;
    let b = buckets.get(k);
    if (!b) {
      const dim = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate();
      b = { k, days: 0, kcSum: 0, dim };
      buckets.set(k, b);
    }
    b.days += 1;
    b.kcSum += kcAt(crop, d / D);
  }
  return [...buckets.values()].sort((a, b) => a.k - b.k);
}

const monthOfK = (k: number) => (((k % 12) + 12) % 12) + 1;
const yearOfK = (Y: number, k: number) => Math.floor((Y * 12 + k) / 12);

export interface EngineContext {
  farm: FarmProfile;
  climate: PreparedClimate;
  wettestSmapMonths?: Set<number>;
  settings: SimulationSettings;
  /** optional monthly climatology of daily extremes (NASA POWER daily) */
  extremes?: ReturnType<typeof extremesClimatology> | null;
}

/** Bare-soil exposure classes and pest-break classes (documented on the methodology page). */
export const BARE_SOIL_THRESHOLDS = [2, 5];
export const PEST_BREAK_THRESHOLDS = [0.2, 0.5];

/** Days of living crop cover per month of a crop year (index 0 = Dec of Y-1 … 11 = Nov of Y). */
function coverForYear(all: SeasonResult[], cropYear: number) {
  const days = Array.from({ length: 12 }, () => new Map<string, number>());
  const base = cropYear * 12 - 1; // absolute month index of Dec (Y-1)
  for (const s of all) {
    if (!s.cropId || s.cropId === "fallow") continue;
    const start = Date.UTC(s.year, s.startOffset - 1, 1);
    for (let d = 0; d < s.durationDays; d++) {
      const dt = new Date(start + d * DAY);
      const k = dt.getUTCFullYear() * 12 + dt.getUTCMonth() - base;
      if (k < 0 || k > 11) continue;
      days[k].set(s.cropId, (days[k].get(s.cropId) ?? 0) + 1);
    }
  }
  return days.map((m, k) => {
    const A = base + k;
    const dim = new Date(Date.UTC(Math.floor(A / 12), (A % 12) + 1, 0)).getUTCDate();
    let top: string | null = null;
    let topDays = 0;
    let total = 0;
    m.forEach((v, id) => {
      total += v;
      if (v > topDays) {
        top = id;
        topDays = v;
      }
    });
    const covered = Math.min(1, total / dim);
    return { crop: covered >= 0.5 ? top : null, bare: 1 - covered, month: (A % 12) + 1 };
  });
}

interface SeasonCalc extends SeasonResult {
  perYear: number[]; // irrigation per historical year
  monthly: number[][]; // [chartIndex 0..13][hist]
}

function supplyFor(farm: FarmProfile, season: SeasonId, precipFactor: number) {
  let cap = SUPPLY_MM[farm.waterAvailability] * SOURCE_FACTOR[farm.irrigationSource];
  const drySeason = season === "S1" || season === "S2";
  // less rain also means less canal and pond water in the dry season (−20% rain → −15% supply)
  const drought = 1 - 0.75 * Math.max(0, 1 - precipFactor);
  if (farm.irrigationSource === "canal" && drySeason) {
    if (farm.salinityRisk === "occasional") cap *= 0.75;
    if (farm.salinityRisk === "frequent") cap *= 0.5;
    cap *= drought;
  }
  if (farm.irrigationSource === "pond" && drySeason) cap *= drought;
  return cap;
}

function stressLevelFor(median: number, cap: number): 0 | 1 | 2 | 3 {
  if (cap <= 0) return median <= 10 ? 0 : median <= 40 ? 1 : median <= 100 ? 2 : 3;
  const r = median / cap;
  return r < 0.5 ? 0 : r < 0.85 ? 1 : r < 1.1 ? 2 : 3;
}

function evaluateSlot(
  ctx: EngineContext,
  slot: SeasonalCropSlot,
  cropYear: number,
  prevCrop: Crop | null,
): SeasonCalc {
  const { farm, climate, settings } = ctx;
  const crop = getCrop(slot.cropId) ?? CROP_MAP.fallow;
  const isFallow = crop.id === "fallow";
  const buckets = buildBuckets(crop, slot.season, slot.plantingMonth);
  const hist = climate.years;
  const perc = PERCOLATION_MM_DAY[farm.soilType] * (farm.drainage === "poor" ? 0.7 : 1);
  const landPrep = LAND_PREP_MM[farm.soilType];

  const perYear: number[] = [];
  const monthly: number[][] = Array.from({ length: 14 }, () => [] as number[]);
  let etcSum = 0;
  let peffSum = 0;
  let floodSum = 0;
  hist.forEach((H) => {
    let total = 0;
    const monthTotals = new Array(14).fill(0);
    buckets.forEach((b, i) => {
      const cm = getMonth(climate, yearOfK(H, b.k), monthOfK(b.k));
      if (isFallow || !crop.irrigated) return;
      const etc = b.kcSum * cm.et0Day;
      const peff = (cm.peffMm * b.days) / b.dim;
      const flood = crop.flooded ? perc * b.days + (i === 0 ? landPrep : 0) : 0;
      const deficit = Math.max(0, etc + flood - peff);
      total += deficit;
      const ci = b.k + 2;
      if (ci >= 0 && ci < 14) monthTotals[ci] += deficit;
      etcSum += etc;
      peffSum += Math.min(peff, etc + flood);
      floodSum += flood;
    });
    perYear.push(total);
    monthTotals.forEach((v, ci) => monthly[ci].push(v));
  });
  const n = Math.max(hist.length, 1);
  const irrigation = {
    p10: quantile(perYear, 0.1),
    median: quantile(perYear, 0.5),
    p90: quantile(perYear, 0.9),
  };
  const capacityMm = supplyFor(farm, slot.season, climateAdjustment(settings.climateAssumption, settings.customClimate).precipFactor);
  const stressLevel = isFallow ? 0 : stressLevelFor(irrigation.median, capacityMm);

  /* ---------------- suitability (climatology of adjusted climate) ---------------- */
  const factors: SuitabilityFactor[] = [];
  let suitScore = 0;
  let limiting: FactorId | null = null;
  const risks: string[] = [];
  if (!isFallow) {
    const clim = buckets.map((b) => ({ b, cm: climate.climatology[monthOfK(b.k) - 1] }));
    const totalDays = buckets.reduce((s, b) => s + b.days, 0);
    const tMean = clim.reduce((s, { b, cm }) => s + cm.t2m * b.days, 0) / totalDays;
    const midDay = Math.floor(crop.growingDuration * 0.55);
    let acc = 0;
    let midTmax = clim[0].cm.tmaxMean;
    for (const { b, cm } of clim) {
      acc += b.days;
      if (acc > midDay) {
        midTmax = cm.tmaxMean;
        break;
      }
    }
    const fullMonths = clim.filter(({ b }) => b.days >= 10);
    const maxP = Math.max(...fullMonths.map(({ cm }) => cm.precipMm), 0);
    const salineMonths = fullMonths.some(({ b }) => [2, 3, 4, 5].includes(monthOfK(b.k)));
    const tr = crop.temperatureRange;

    const tScore =
      tMean >= tr.optMin && tMean <= tr.optMax
        ? 1
        : tMean < tr.optMin
          ? Math.max(0, (tMean - tr.min) / (tr.optMin - tr.min))
          : Math.max(0, (tr.max - tMean) / (tr.max - tr.optMax));
    factors.push({
      id: "temperature",
      score: tScore,
      key: "factor.temperature",
      values: { t: tMean.toFixed(1), min: tr.optMin, max: tr.optMax },
    });
    const hScore = midTmax <= crop.heatStressTmax ? 1 : Math.max(0.2, 1 - 0.15 * (midTmax - crop.heatStressTmax));
    factors.push({ id: "heat", score: hScore, key: "factor.heat", values: { tmax: midTmax.toFixed(1), thr: crop.heatStressTmax } });

    const lowWl = (() => {
      const d = farm.drainage;
      if (maxP > 300) return d === "poor" ? 0.25 : d === "moderate" ? 0.45 : 0.75;
      if (maxP > 250) return d === "poor" ? 0.35 : d === "moderate" ? 0.6 : 0.85;
      if (maxP > 150) return d === "poor" ? 0.65 : d === "moderate" ? 0.85 : 1;
      return 1;
    })();
    const wl = crop.waterloggingTolerance === "high" ? 1 : crop.waterloggingTolerance === "moderate" ? 1 - (1 - lowWl) / 2 : lowWl;
    factors.push({ id: "waterlogging", score: wl, key: "factor.waterlogging", values: { p: Math.round(maxP), drainage: farm.drainage } });

    const tex = crop.soilCompatibility[farm.soilType];
    let phF = 1;
    if (farm.soilPH !== null) {
      const d = farm.soilPH < crop.phRange.min ? crop.phRange.min - farm.soilPH : farm.soilPH > crop.phRange.max ? farm.soilPH - crop.phRange.max : 0;
      phF = Math.max(0.3, 1 - 0.3 * d);
    }
    factors.push({
      id: "soil",
      score: tex * phF,
      key: "factor.soil",
      values: { texture: farm.soilType, ph: farm.soilPH === null ? "?" : farm.soilPH.toFixed(1), phMin: crop.phRange.min, phMax: crop.phRange.max },
    });

    let sal = 1;
    if (farm.salinityRisk !== "none" && salineMonths) {
      const table =
        farm.salinityRisk === "occasional"
          ? { sensitive: 0.7, moderate: 0.85, tolerant: 1 }
          : { sensitive: 0.4, moderate: 0.65, tolerant: 0.9 };
      sal = table[crop.salinityTolerance];
      const pf = climateAdjustment(settings.climateAssumption, settings.customClimate).precipFactor;
      if (pf < 1) sal *= 1 - 0.5 * (1 - pf); // drier seasons push salt further inland
    }
    factors.push({ id: "salinity", score: sal, key: "factor.salinity", values: { risk: farm.salinityRisk, tol: crop.salinityTolerance } });

    const cal = crop.suitableSeasons.includes(slot.season) ? 1 : 0.6;
    factors.push({ id: "calendar", score: cal, key: "factor.calendar", values: { season: slot.season } });

    const min = Math.min(...factors.map((f) => f.score));
    const mean = factors.reduce((s, f) => s + f.score, 0) / factors.length;
    suitScore = 100 * (0.6 * min + 0.4 * mean);
    const worst = factors.reduce((a, b) => (b.score < a.score ? b : a));
    limiting = worst.score < 0.85 ? worst.id : null;

    if (hScore < 0.85) risks.push("risk.heat");
    if (wl < 0.8) risks.push("risk.waterlogging");
    if (farm.drainage === "poor" && crop.waterloggingTolerance !== "high" &&
        fullMonths.some(({ b }) => ctx.wettestSmapMonths?.has(monthOfK(b.k)))) risks.push("risk.smapWetMonths");
    if (sal < 0.85) risks.push("risk.salinity");
    if (cal < 1) risks.push("risk.calendar");
    if (crop.irrigated && irrigation.p90 > capacityMm && capacityMm > 0) risks.push("risk.dryYear");
    if (capacityMm <= 0 && irrigation.median > 40) risks.push("risk.rainfed");
  }
  const cls = suitScore >= 75 ? "good" : suitScore >= 50 ? "fair" : "poor";
  const credit = prevCrop?.nitrogenCredit ?? 0;
  const nitrogenNet = Math.max(0, crop.nitrogenNeed - credit);

  return {
    slotId: slot.id,
    cropId: isFallow ? (slot.cropId ? "fallow" : null) : crop.id,
    season: slot.season,
    year: cropYear,
    plantingMonth: slot.plantingMonth,
    startOffset: monthOffset(slot.season, slot.plantingMonth),
    durationDays: crop.growingDuration,
    irrigation,
    etcMm: etcSum / n,
    peffMm: peffSum / n,
    extraFloodMm: floodSum / n,
    capacityMm,
    stressRatio: capacityMm > 0 ? irrigation.median / capacityMm : irrigation.median > 0 ? Infinity : 0,
    stressLevel,
    suitability: { score: isFallow ? NaN : suitScore, cls, factors, limiting },
    nitrogenNet,
    risks,
    overlap: false,
    perYear,
    monthly,
  };
}

/* ----------------------------- scenario helpers ----------------------------- */

export function currentPracticeSlots(farm: FarmProfile): SeasonalCropSlot[] {
  return SEASON_ORDER.map((s) => ({
    id: `ref-${s}`,
    yearIndex: 0,
    season: s,
    cropId: farm.cropHistory.typicalPattern[s],
    plantingMonth: farm.cropHistory.plantingMonths?.[s] ?? SEASONS[s].defaultMonth,
  }));
}

export function slotsForYear(scenario: RotationScenario, t: number, farm: FarmProfile): SeasonalCropSlot[] {
  if (t === 0) return currentPracticeSlots(farm);
  const yi = (t - 1) % Math.max(1, scenario.cycleYears);
  const slots = scenario.seasonalCropSequence.filter((s) => s.yearIndex === yi);
  return SEASON_ORDER.map(
    (season) =>
      slots.find((s) => s.season === season) ?? {
        id: `empty-${yi}-${season}`,
        yearIndex: yi,
        season,
        cropId: null,
        plantingMonth: SEASONS[season].defaultMonth,
      },
  );
}

function soilPointsFor(seasons: { crop: Crop; prev: Crop | null }[]) {
  let total = 0;
  let floodedCount = 0;
  for (const { crop, prev } of seasons) {
    let p = crop.agronomicProperties.soilPoints;
    if (crop.flooded && prev?.flooded) p -= 0.6;
    if (crop.flooded) floodedCount++;
    total += p;
  }
  let mean = total / Math.max(1, seasons.length);
  if (floodedCount >= 3) mean -= 0.3;
  return mean;
}

function soilLevel(index: number): 1 | 2 | 3 | 4 | 5 {
  const [a, b, c, d] = SOIL_LEVEL_THRESHOLDS;
  return index <= a ? 1 : index <= b ? 2 : index <= c ? 3 : index <= d ? 4 : 5;
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

function shannon(ids: string[]) {
  const counts = new Map<string, number>();
  ids.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  const n = ids.length;
  if (!n) return 0;
  let h = 0;
  counts.forEach((c) => {
    const p = c / n;
    h -= p * Math.log(p);
  });
  return h;
}

/* ------------------------------- main runner ------------------------------- */

export interface EngineInput {
  farm: FarmProfile;
  scenarios: RotationScenario[];
  climate: ClimateDataset;
  settings: SimulationSettings;
  /** optional: improves the bare-soil (erosion) index with heavy-rain day counts */
  extremes?: DailyExtremes | null;
  /** Regional SMAP climatology informs a drainage warning only. */
  smap?: EnvironmentalSeries | null;
}

export interface EngineOutput {
  engineVersion: string;
  reference: ScenarioSimulation;
  results: Record<string, ScenarioSimulation>;
  /** same scenarios under historical baseline climate (for "why did this change") */
  baselineClimate: Record<string, ScenarioSimulation>;
  years: number[];
  climateStatus: DataStatus;
}

export const REFERENCE_ID = "__current_practice__";

function simulateScenario(ctx: EngineContext, scenario: RotationScenario, reference?: ScenarioSimulation): ScenarioSimulation {
  const { farm, settings } = ctx;
  const H = settings.horizon;
  const climateStatus: DataStatus = ctx.climate.dataset.status !== "illustrative" ? "estimated" : "illustrative";
  const expanded: { t: number; slots: SeasonalCropSlot[] }[] = [];
  for (let t = 0; t <= H; t++) expanded.push({ t, slots: slotsForYear(scenario, t, farm) });

  // previous crop chain across the whole horizon (for N credit and consecutive-rice logic)
  const flat = expanded.flatMap(({ t, slots }) => slots.map((s) => ({ t, s })));
  const prevHistCrop = getCrop(farm.cropHistory.previousCropId);
  const calcs: SeasonCalc[] = flat.map(({ t, s }, i) => {
    const prevSlot = i > 0 ? flat[i - 1].s : null;
    const prev = prevSlot ? getCrop(prevSlot.cropId) ?? CROP_MAP.fallow : prevHistCrop;
    return evaluateSlot(ctx, s, settings.startYear + t, prev);
  });

  // Check every active crop still in the ground at the next planting date.
  const planted = calcs.filter((s) => s.cropId && s.cropId !== "fallow").map((season) => ({
    season, start: Date.UTC(season.year, season.startOffset - 1, 1),
  })).sort((a, b) => a.start - b.start);
  for (let i = 0; i < planted.length; i++) {
    const first = planted[i];
    const end = first.start + first.season.durationDays * DAY;
    for (let j = i + 1; j < planted.length && planted[j].start < end; j++) {
      for (const season of [first.season, planted[j].season]) {
        if (!season.overlap) season.risks.push("risk.overlap");
        season.overlap = true;
      }
    }
  }

  const years: SimulationResult[] = [];
  let soilIndex = 0;
  const allCropIdsByYear: string[][] = [];
  expanded.forEach(({ t }, ti) => {
    const seasons = calcs.slice(ti * 3, ti * 3 + 3);
    const year = settings.startYear + t;
    const crops = seasons.map((s) => getCrop(s.cropId) ?? CROP_MAP.fallow);
    const prevCrops = seasons.map((_, i) => {
      const gi = ti * 3 + i;
      return gi > 0 ? getCrop(calcs[gi - 1].cropId) ?? CROP_MAP.fallow : prevHistCrop;
    });
    const yearPoints = soilPointsFor(crops.map((c, i) => ({ crop: c, prev: prevCrops[i] })));
    soilIndex = t === 0 ? yearPoints : (1 - SOIL_MEMORY_NEW) * soilIndex + SOIL_MEMORY_NEW * yearPoints;
    const soilScore = clamp(((soilIndex + 1) / 1.8) * 100);

    // diversity: trailing 3-year window (current practice included for early years)
    allCropIdsByYear.push(seasons.map((s) => s.cropId).filter((c): c is string => !!c && c !== "fallow"));
    const windowIds = allCropIdsByYear.slice(Math.max(0, ti - 2), ti + 1).flat();
    const h = shannon(windowIds);
    const families = new Set(windowIds.map((id) => CROP_MAP[id]?.family)).size;
    const legumeSeasons = windowIds.filter((id) => CROP_MAP[id]?.agronomicProperties.nFixing).length;
    const divScore = clamp((h / 1.1) * 100);

    // bare soil under rain (erosion / nutrient-loss proxy)
    const cover = coverForYear(calcs, year);
    const bareIndex = cover.reduce((sum, c) => {
      const clim = ctx.climate.climatology[c.month - 1];
      const heavy = ctx.extremes?.[c.month - 1]?.heavyRainDays ?? 0;
      return sum + c.bare * (clim.precipMm / 100 + heavy * 0.5);
    }, 0);
    const bareSoil = {
      months: cover.filter((c) => c.bare >= 0.5).length,
      index: bareIndex,
      cls: (bareIndex < BARE_SOIL_THRESHOLDS[0] ? "low" : bareIndex < BARE_SOIL_THRESHOLDS[1] ? "moderate" : "high") as "low" | "moderate" | "high",
    };

    // pest & disease cycle breaks: crop-family changes over the trailing 3-year window
    const win = calcs.slice(Math.max(0, ti - 2) * 3, ti * 3 + 3).map((s) => (s.cropId && s.cropId !== "fallow" ? CROP_MAP[s.cropId]?.family ?? s.cropId : null));
    let breaks = 0;
    let run = 0;
    let maxRun = 0;
    win.forEach((fam, i) => {
      if (i > 0 && (fam === null || win[i - 1] === null || fam !== win[i - 1])) breaks++;
      run = fam !== null && i > 0 && fam === win[i - 1] ? run + 1 : fam !== null ? 1 : 0;
      maxRun = Math.max(maxRun, run);
    });
    const transitions = Math.max(1, win.length - 1);
    const ratio = breaks / transitions;
    const pestBreak = {
      breaks,
      transitions,
      ratio,
      maxRun,
      cls: (ratio < PEST_BREAK_THRESHOLDS[0] ? "low" : ratio < PEST_BREAK_THRESHOLDS[1] ? "moderate" : "high") as "low" | "moderate" | "high",
    };

    // water
    const nh = ctx.climate.years.length;
    const yearTotals = Array.from({ length: nh }, (_, hi) => seasons.reduce((s, c) => s + (c.perYear[hi] ?? 0), 0));
    const monthlyIrrigation = Array.from({ length: 14 }, (_, ci) =>
      quantile(
        Array.from({ length: nh }, (_, hi) => seasons.reduce((s, c) => s + (c.monthly[ci][hi] ?? 0), 0)),
        0.5,
      ),
    );
    const waterDemand = {
      p10: quantile(yearTotals, 0.1),
      median: quantile(yearTotals, 0.5),
      p90: quantile(yearTotals, 0.9),
      unit: "mm" as const,
      m3PerHa: quantile(yearTotals, 0.5) * 10,
    };
    const active = seasons.filter((s) => s.cropId && s.cropId !== "fallow");
    const worst = active.reduce<SeasonCalc | null>((a, b) => (!a || b.stressLevel > a.stressLevel ? b : a), null);
    const waterRisk = {
      level: (worst?.stressLevel ?? 0) as 0 | 1 | 2 | 3,
      worstSeason: worst && worst.stressLevel > 0 ? worst.season : null,
      dryYearExceeds: active.some((s) => s.risks.includes("risk.dryYear")),
    };
    const suit = active.length ? active.reduce((s, c) => s + c.suitability.score, 0) / active.length : 50;
    const nitrogen = seasons.reduce((s, c) => s + c.nitrogenNet, 0);

    // economics (only with user-entered or explicitly illustrative inputs)
    let economics: SimulationResult["economics"] = null;
    if (active.length && active.every((s) => settings.economics[s.cropId!])) {
      let gm = 0;
      let illustrative = false;
      for (const s of active) {
        const e = settings.economics[s.cropId!];
        if (e.status === "illustrative") illustrative = true;
        const adj = s.suitability.cls === "good" ? 1 : s.suitability.cls === "fair" ? 0.85 : 0.6;
        gm += (e.yieldT * 1000 * e.priceVnd * adj) / 1e6 - e.costMVnd;
      }
      economics = { grossMargin: gm, status: illustrative ? "illustrative" : "estimated" };
    }

    // criteria
    const meanStress = active.length ? active.reduce((s, c) => s + c.stressLevel, 0) / active.length : 0;
    const refYear = reference?.years[ti];
    let income: number | null = null;
    if (economics) {
      const refGm = refYear?.economics?.grossMargin ?? economics.grossMargin;
      const riskySeasons = active.filter((s) => s.stressLevel >= 2 || s.suitability.cls === "poor").length;
      income = clamp(50 + (100 * (economics.grossMargin - refGm)) / Math.max(Math.abs(refGm), 1) - 8 * riskySeasons);
    }
    const criteriaScores: Record<CriterionId, number | null> = {
      soil: 0.7 * soilScore + 0.3 * divScore,
      water: clamp(100 * (1 - waterDemand.median / REF_IRRIGATION_MM)),
      drought: clamp(100 - (meanStress / 3) * 100 - (waterRisk.dryYearExceeds ? 10 : 0)),
      income,
      inputs: clamp(100 * (1 - nitrogen / REF_NITROGEN)),
      climate: suit,
    };
    const w = settings.weights;
    let wSum = 0;
    (Object.keys(criteriaScores) as CriterionId[]).forEach((k) => {
      if (criteriaScores[k] !== null) wSum += w[k] ?? 0;
    });
    const contributions = {} as Record<CriterionId, number>;
    let overall = 0;
    (Object.keys(criteriaScores) as CriterionId[]).forEach((k) => {
      const s = criteriaScores[k];
      const c = s === null || wSum === 0 ? 0 : ((w[k] ?? 0) * s) / wSum;
      contributions[k] = c;
      overall += c;
    });

    const soilMeasured = farm.soilSources.soilType.status === "observed";
    const climObs = ctx.climate.dataset.status !== "illustrative";
    const uncertainty: Record<string, Confidence> = {
      waterDemand: climObs ? (soilMeasured ? "medium" : "medium") : "low",
      waterRisk: climObs ? "medium" : "low",
      cropSuitability: climObs && soilMeasured ? "medium" : "low",
      rotationDiversity: "high",
      soilImprovementPotential: "low",
      nitrogen: "low",
      economics: economics?.status === "estimated" ? "medium" : "low",
    };
    years.push({
      scenarioId: scenario.id,
      year,
      isBaselineYear: t === 0,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      seasons: seasons.map(({ perYear: _p, monthly: _m, ...rest }) => rest),
      monthlyIrrigation,
      monthlyCover: cover.map((c) => c.crop),
      monthlyBare: cover.map((c) => c.bare),
      bareSoil,
      pestBreak,
      waterDemand,
      waterRisk,
      cropSuitability: { score: suit, cls: suit >= 75 ? "good" : suit >= 50 ? "fair" : "poor" },
      rotationDiversity: {
        shannon: h,
        score: divScore,
        distinctCrops: new Set(windowIds).size,
        families,
        legumeSeasons,
        cls: h < 0.4 ? "low" : h < 0.9 ? "moderate" : "high",
      },
      soilImprovementPotential: { index: soilIndex, level: soilLevel(soilIndex), yearPoints, score: soilScore },
      nitrogenNeed: nitrogen,
      economics,
      criteriaScores,
      contributions,
      overallScore: overall,
      metricSources: {
        waterDemand: "src.waterDemand",
        waterRisk: "src.waterRisk",
        cropSuitability: "src.suitability",
        rotationDiversity: "src.diversity",
        soilImprovementPotential: "src.soil",
        nitrogen: "src.nitrogen",
        economics: "src.economics",
      },
      assumptions: ["asm.et0", "asm.peff", "asm.flood", "asm.supply", "asm.soilMemory", "asm.noStorage"],
      uncertainty,
      dataStatus: {
        waterDemand: climateStatus,
        waterRisk: climateStatus,
        cropSuitability: climateStatus,
        rotationDiversity: "estimated",
        soilImprovementPotential: "estimated",
        nitrogen: "estimated",
        economics: economics ? economics.status : "unavailable",
      },
    });
  });
  return { scenarioId: scenario.id, years };
}

export function referenceScenario(farm: FarmProfile, settings: SimulationSettings): RotationScenario {
  return {
    id: REFERENCE_ID,
    name: "Current practice",
    kind: "conventional",
    farmId: farm.id,
    cycleYears: 1,
    seasonalCropSequence: currentPracticeSlots(farm),
    climateAssumption: settings.climateAssumption,
    farmerPriorityWeights: settings.weights,
    simulationHorizon: settings.horizon,
    createdAt: farm.createdAt,
  };
}

export function runEngine(input: EngineInput): EngineOutput {
  const { farm, scenarios, climate, settings } = input;
  const prepared = prepareClimate(climate, settings.climateAssumption, settings.customClimate);
  const extremes = input.extremes ? extremesClimatology(input.extremes) : null;
  const wettestSmapMonths = smapWetMonths(input.smap, farm);
  const ctx: EngineContext = { farm, climate: prepared, settings, extremes, wettestSmapMonths };
  const reference = simulateScenario(ctx, referenceScenario(farm, settings));
  const results: Record<string, ScenarioSimulation> = {};
  scenarios.forEach((s) => (results[s.id] = simulateScenario(ctx, s, reference)));

  const baselineClimate: Record<string, ScenarioSimulation> = {};
  if (settings.climateAssumption !== "baseline") {
    const base = prepareClimate(climate, "baseline");
    const bctx: EngineContext = { ...ctx, climate: base, settings: { ...settings, climateAssumption: "baseline" } };
    const bref = simulateScenario(bctx, referenceScenario(farm, settings));
    scenarios.forEach((s) => (baselineClimate[s.id] = simulateScenario(bctx, s, bref)));
    baselineClimate[REFERENCE_ID] = bref;
  }
  return {
    engineVersion: ENGINE_VERSION,
    reference,
    results,
    baselineClimate,
    years: Array.from({ length: settings.horizon + 1 }, (_, i) => settings.startYear + i),
    climateStatus: climate.status === "illustrative" ? "illustrative" : "estimated",
  };
}

/** Quick suitability screen of every crop for each season (used to build default strategies). */
export function screenCrops(farm: FarmProfile, climate: ClimateDataset, settings: SimulationSettings) {
  const prepared = prepareClimate(climate, settings.climateAssumption, settings.customClimate);
  const ctx: EngineContext = { farm, climate: prepared, settings };
  const out: Record<SeasonId, { cropId: string; suitability: number; irrigation: number }[]> = { S1: [], S2: [], S3: [] };
  for (const season of SEASON_ORDER) {
    for (const crop of Object.values(CROP_MAP)) {
      if (crop.id === "fallow") continue;
      const r = evaluateSlot(
        ctx,
        { id: "screen", yearIndex: 0, season, cropId: crop.id, plantingMonth: farm.cropHistory.plantingMonths?.[season] ?? SEASONS[season].defaultMonth },
        settings.startYear,
        null,
      );
      out[season].push({ cropId: crop.id, suitability: r.suitability.score, irrigation: r.irrigation.median });
    }
  }
  return out;
}

/** Monthly climate summary for the Overview charts. */
export function climateSummary(climate: ClimateDataset) {
  const p = prepareClimate(climate, "baseline");
  const months = p.climatology.map((m) => {
    const rows = [...p.byKey.values()].filter((r) => r.month === m.month);
    const precs = rows.map((r) => r.precipMm);
    return {
      month: m.month,
      precip: m.precipMm,
      precipP10: quantile(precs, 0.1),
      precipP90: quantile(precs, 0.9),
      et0: m.et0Day * new Date(Date.UTC(2001, m.month, 0)).getUTCDate(),
      t2m: m.t2m,
      tmax: m.tmaxMean,
      tmin: m.t2m - (m.tmaxMean - m.t2m),
      gwetTop: m.gwetTop,
      gwetRoot: m.gwetRoot,
    };
  });
  const annualByYear = p.years.map((y) => {
    const rows = [...p.byKey.values()].filter((r) => r.year === y);
    return {
      year: y,
      precip: rows.reduce((s, r) => s + r.precipMm, 0),
      t2m: rows.reduce((s, r) => s + r.t2m, 0) / Math.max(rows.length, 1),
      complete: rows.length === 12,
    };
  });
  const complete = annualByYear.filter((a) => a.complete);
  const meanAnnualPrecip = complete.reduce((s, a) => s + a.precip, 0) / Math.max(complete.length, 1);
  const meanT = complete.reduce((s, a) => s + a.t2m, 0) / Math.max(complete.length, 1);
  const recent = complete.slice(-3);
  const recentT = recent.reduce((s, a) => s + a.t2m, 0) / Math.max(recent.length, 1);
  const dryMonths = months.filter((m) => m.precip < m.et0 / 2).length;
  const drySeasonDeficit = months
    .filter((m) => [12, 1, 2, 3, 4].includes(m.month))
    .reduce((s, m) => s + (m.precip - m.et0), 0);
  const wetVals = months.filter((m) => m.gwetRoot !== null);
  const dryWet = wetVals.filter((m) => [2, 3, 4].includes(m.month));
  const wetWet = wetVals.filter((m) => [8, 9, 10].includes(m.month));
  return {
    months,
    annualByYear,
    meanAnnualPrecip,
    meanT,
    recentT,
    recentYears: recent.map((r) => r.year),
    dryMonths,
    drySeasonDeficit,
    soilWetDry: dryWet.length ? dryWet.reduce((s, m) => s + (m.gwetRoot ?? 0), 0) / dryWet.length : null,
    soilWetWet: wetWet.length ? wetWet.reduce((s, m) => s + (m.gwetRoot ?? 0), 0) / wetWet.length : null,
  };
}
