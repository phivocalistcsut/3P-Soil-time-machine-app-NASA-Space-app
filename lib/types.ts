/**
 * Core domain types for Soil Time Machine.
 * Every value shown in the UI carries a DataStatus so observed data,
 * computed estimates, illustrative demo values and gaps are never confused.
 */

import type { Evidence } from "./data/evidence";

export type Lang = "en" | "vi";
export type Localized = { en: string; vi: string };

/** OBSERVED = real historical observations · ESTIMATED = computed from assumptions ·
 *  ILLUSTRATIVE = demonstration examples · UNAVAILABLE = insufficient evidence */
export type DataStatus = "observed" | "estimated" | "illustrative" | "unavailable";
export type Confidence = "high" | "medium" | "low";

export type SeasonId = "S1" | "S2" | "S3";
export type SoilTexture = "clay" | "silty_clay" | "clay_loam" | "loam" | "sandy_loam" | "sand";
export type WaterAvailability = "abundant" | "moderate" | "limited";
export type IrrigationSource = "canal" | "groundwater" | "pond" | "rainfed";
export type Drainage = "good" | "moderate" | "poor";
export type SalinityRisk = "none" | "occasional" | "frequent";
export type PriorityId = "soil" | "water" | "drought" | "income" | "inputs";
export type CriterionId = PriorityId | "climate";
export type ClimateAssumption = "baseline" | "drier" | "wetter" | "warmer" | "custom";

/** Farmer-set sensitivity test: rainfall change in % and warming in °C (not a forecast). */
export interface CustomClimate {
  rainPct: number;
  deltaT: number;
}
export type DataMode = "live" | "offline";

export interface SourceTag {
  status: DataStatus;
  /** short source label, e.g. "User measurement", "ISRIC SoilGrids 250 m" */
  source: string;
}

export interface CropHistory {
  currentCropId: string;
  previousCropId: string | null;
  plantingSeason: SeasonId;
  /** Typical crop per season in the current practice (null = fallow). */
  typicalPattern: Record<SeasonId, string | null>;
  /** Farmer-entered planting dates for the current practice. */
  plantingMonths?: Partial<Record<SeasonId, number>>;
}

export interface FarmProfile {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  areaHa: number;
  /** Approximate field boundary as [lng, lat] ring (not closed). */
  boundary: [number, number][] | null;
  soilType: SoilTexture;
  soilPH: number | null;
  soilOrganicCarbon: number | null; // percent (g/100 g)
  clayPercent: number | null; // depth-weighted %, 0–30 cm
  socStockTCHa: number | null; // t C/ha, 0–30 cm
  soilSources: {
    soilType: SourceTag;
    soilPH: SourceTag;
    soilOrganicCarbon: SourceTag;
    clayPercent: SourceTag;
    socStockTCHa: SourceTag;
  };
  irrigationSource: IrrigationSource;
  waterAvailability: WaterAvailability;
  drainage: Drainage;
  salinityRisk: SalinityRisk;
  cropHistory: CropHistory;
  /** Ranked priorities, most important first. Unselected priorities are omitted. */
  farmerPriorities: PriorityId[];
  isDemo: boolean;
  createdAt: string;
}

export type WaterCategory = "very_high" | "high" | "moderate" | "low" | "none";
export type Tolerance = "high" | "moderate" | "low";
export type CropCategory = "cereal" | "legume" | "oilseed" | "root" | "vegetable" | "green_manure" | "fallow";

export interface Crop {
  id: string;
  name: Localized;
  category: CropCategory;
  family: string;
  icon: "wheat" | "bean" | "sprout" | "leaf" | "flower" | "carrot" | "citrus" | "pause";
  color: string;
  /** days from planting to harvest / incorporation */
  growingDuration: number;
  suitableSeasons: SeasonId[];
  waterRequirement: WaterCategory;
  /** FAO-56 single crop coefficients (ini / mid / end) */
  kc: { ini: number; mid: number; end: number };
  kcSource: string;
  flooded: boolean;
  irrigated: boolean;
  /** monthly mean air temperature envelope in °C */
  temperatureRange: { min: number; optMin: number; optMax: number; max: number };
  /** mean daily maximum (°C) above which heat stress around flowering is likely */
  heatStressTmax: number;
  phRange: { min: number; max: number };
  soilCompatibility: Record<SoilTexture, number>;
  waterloggingTolerance: Tolerance;
  salinityTolerance: "sensitive" | "moderate" | "tolerant";
  /** typical fertiliser N requirement, kg N/ha (illustrative regional guidance) */
  nitrogenNeed: number;
  /** N credit to the following crop, kg N/ha */
  nitrogenCredit: number;
  /** Estimated seasonal residue carbon inputs, with explicit sources and management assumptions. */
  rothc: {
    residueCTHa: number; // t C/ha returned per crop (roots + retained above-ground residues)
    dpmRpm: number;
    source: string;
    status: "estimated";
  };
  agronomicProperties: {
    nFixing: boolean;
    rootDepthM: number;
    residueReturn: "low" | "medium" | "high";
    note: Localized;
  };
}

export interface SeasonalCropSlot {
  id: string;
  yearIndex: number; // 0-based index inside the rotation cycle
  season: SeasonId;
  cropId: string | null; // null = fallow / empty
  plantingMonth: number; // 1-12
}

export type ScenarioKind = "conventional" | "fit" | "water" | "soil" | "custom";

export interface RotationScenario {
  id: string;
  name: string;
  kind: ScenarioKind;
  farmId: string;
  cycleYears: number;
  seasonalCropSequence: SeasonalCropSlot[];
  climateAssumption: ClimateAssumption;
  farmerPriorityWeights: Record<CriterionId, number>;
  simulationHorizon: number;
  createdAt: string;
}

/* ------------------------------ climate data ------------------------------ */

export interface ClimateMonth {
  year: number;
  month: number; // 1-12
  precipMm: number; // monthly total
  t2m: number; // mean air temperature °C
  t2mRange: number; // mean diurnal range °C
  rh2m: number; // %
  ws2m: number; // m/s
  rsMJ: number; // all-sky surface shortwave MJ/m²/day
  gwetTop: number | null; // 0-1 surface soil wetness
  gwetRoot: number | null; // 0-1 root-zone soil wetness
}

export interface ClimateDataset {
  status: "observed" | "estimated" | "illustrative";
  source: string;
  sourceUrl: string;
  evidence?: Evidence;
  retrievedAt: string;
  cached: boolean;
  period: [number, number];
  resolution: string;
  latitude: number;
  longitude: number;
  elevation: number;
  months: ClimateMonth[];
  note?: string;
}

/** Daily-weather extremes aggregated per calendar month (NASA POWER daily). */
export interface DailyMonthStat {
  year: number;
  month: number;
  days: number;
  heavyRainDays: number; // ≥ 50 mm/day
  veryHeavyRainDays: number; // ≥ 100 mm/day
  hotDays: number; // Tmax ≥ 35 °C
  frostDays: number; // Tmin ≤ 0 °C
  maxRainMm: number;
  maxTmax: number;
  minTmin: number;
}

export interface DailyExtremes {
  evidence?: Evidence;
  status: "observed" | "estimated";
  source: string;
  retrievedAt: string;
  cached: boolean;
  period: [number, number];
  resolution: string;
  latitude: number;
  longitude: number;
  thresholds: { heavyRainMm: number; veryHeavyRainMm: number; hotC: number; frostC: number };
  months: DailyMonthStat[];
}

/** MODIS vegetation index time series for the field's 250 m pixel. */
export interface NdviSeries {
  evidence?: Evidence;
  status: "observed";
  source: string;
  product: string;
  resolution: string;
  retrievedAt: string;
  cached: boolean;
  latitude: number;
  longitude: number;
  points: { date: string; ndvi: number | null; quality?: "good" | "marginal" | "rejected" | "missing"; reliability?: number; viQuality?: number }[];
}

/* --------------------------- simulation outputs --------------------------- */

export interface Range3 {
  p10: number;
  median: number;
  p90: number;
}

export type FactorId = "temperature" | "heat" | "waterlogging" | "soil" | "salinity" | "calendar";

export interface SuitabilityFactor {
  id: FactorId;
  score: number; // 0-1
  /** i18n key + values for the explanation */
  key: string;
  values: Record<string, string | number>;
}

export interface SeasonResult {
  slotId: string;
  cropId: string | null;
  season: SeasonId;
  year: number;
  plantingMonth: number;
  /** month offsets relative to crop-year start (0 = Dec of previous year) */
  startOffset: number;
  durationDays: number;
  irrigation: Range3; // mm
  etcMm: number;
  peffMm: number;
  extraFloodMm: number; // percolation + land preparation for flooded crops
  capacityMm: number;
  stressRatio: number;
  stressLevel: 0 | 1 | 2 | 3;
  suitability: { score: number; cls: "good" | "fair" | "poor"; factors: SuitabilityFactor[]; limiting: FactorId | null };
  nitrogenNet: number;
  risks: string[]; // i18n keys
  overlap: boolean;
}

export interface SimulationResult {
  scenarioId: string;
  year: number;
  isBaselineYear: boolean;
  seasons: SeasonResult[];
  monthlyIrrigation: number[]; // 14 values, Nov(prev)…Dec, median mm
  /** dominant crop per month of the crop year (index 0 = Dec of previous year … 11 = Nov), null = bare soil */
  monthlyCover: (string | null)[];
  /** share of each month (0–1) with no living crop cover */
  monthlyBare: number[];
  /** bare soil exposed to rain — a proxy for erosion and nutrient loss */
  bareSoil: { months: number; index: number; cls: "low" | "moderate" | "high" };
  /** how often the crop family changes between seasons — breaks pest and disease cycles */
  pestBreak: { breaks: number; transitions: number; ratio: number; maxRun: number; cls: "low" | "moderate" | "high" };
  waterDemand: Range3 & { unit: "mm"; m3PerHa: number };
  waterRisk: { level: 0 | 1 | 2 | 3; worstSeason: SeasonId | null; dryYearExceeds: boolean };
  cropSuitability: { score: number; cls: "good" | "fair" | "poor" };
  rotationDiversity: { shannon: number; score: number; distinctCrops: number; families: number; legumeSeasons: number; cls: "low" | "moderate" | "high" };
  soilImprovementPotential: {
    socTCHa: number; deltaTCHa: number; deltaPctPerYear: number;
    level: 1 | 2 | 3 | 4 | 5; score: number;
  } | null;
  /** Estimated inputs and inverse-spin-up mismatch; independent of the outcome ranking. */
  soilCarbonInputs: {
    equilibriumPlantC: number; referencePlantC: number; inputRatio: number;
    annualPlantC: number; vegetatedMonths: number; floodedMonths: number;
  } | null;
  nitrogenNeed: number;
  economics: { grossMargin: number; status: DataStatus } | null;
  criteriaScores: Record<CriterionId, number | null>;
  contributions: Record<CriterionId, number>;
  overallScore: number;
  metricSources: Record<string, string>;
  assumptions: string[];
  uncertainty: Record<string, Confidence>;
  dataStatus: Record<string, DataStatus>;
}

export interface ScenarioSimulation {
  scenarioId: string;
  years: SimulationResult[];
}

export interface EconomicInput {
  yieldT: number; // t/ha
  priceVnd: number; // VND per kg
  costMVnd: number; // million VND per ha
  status: "observed" | "estimated" | "illustrative";
  source?: string;
}

export interface SimulationSettings {
  startYear: number;
  horizon: number;
  climateAssumption: ClimateAssumption;
  customClimate?: CustomClimate;
  weights: Record<CriterionId, number>;
  economics: Record<string, EconomicInput>;
}

export interface SavedPlan {
  id: string;
  name: string;
  scenarioId: string;
  scenarioSnapshot: RotationScenario;
  savedAt: string;
  notes: string;
}
