import { getCrop, SEASONS, SEASON_ORDER } from "@/lib/data/crops";
import type { ClimateDataset, CriterionId, EconomicInput, FarmProfile, PriorityId, RotationScenario, SeasonId, SeasonalCropSlot, SimulationSettings } from "@/lib/types";
import { monthOffset, screenCrops } from "@/lib/engine/simulate";
import soilSnapshot from "@/data/soilgrids-thoi-lai.json";
import type { SoilTexture } from "@/lib/types";

export const DEMO_FARM_ID = "demo-thoi-lai";

/**
 * ILLUSTRATIVE demonstration farm in Thới Lai district, Cần Thơ (Mekong Delta).
 * The farm and its boundary are illustrative — not a real farm record.
 * Soil inputs are modeled SoilGrids estimates from the saved same-point lookup.
 * Climate for this location comes from real NASA POWER data (live or cached snapshot).
 */
export function createDemoFarm(): FarmProfile {
  return {
    id: DEMO_FARM_ID,
    name: "Thới Lai Demo Farm",
    latitude: 10.0706,
    longitude: 105.5599,
    areaHa: 2.5,
    boundary: [
      [105.55875, 10.0711],
      [105.5610, 10.07125],
      [105.56108, 10.07025],
      [105.55882, 10.07008],
    ],
    soilType: (soilSnapshot.texture as SoilTexture | null) ?? "clay",
    soilPH: soilSnapshot.ph,
    soilOrganicCarbon: soilSnapshot.socPercent,
    clayPercent: soilSnapshot.clayPercent0to30,
    socStockTCHa: soilSnapshot.socStockTCHa,
    soilSources: {
      soilType: { status: soilSnapshot.texture === null ? "illustrative" : "estimated", source: soilSnapshot.texture === null ? "Typical Mekong alluvial soil (illustrative)" : soilSnapshot.source },
      soilPH: { status: soilSnapshot.ph === null ? "unavailable" : "estimated", source: soilSnapshot.source },
      soilOrganicCarbon: { status: soilSnapshot.socPercent === null ? "unavailable" : "estimated", source: soilSnapshot.source },
      clayPercent: { status: soilSnapshot.clayPercent0to30 === null ? "unavailable" : "estimated", source: soilSnapshot.source },
      socStockTCHa: { status: soilSnapshot.socStockTCHa === null ? "unavailable" : "estimated", source: soilSnapshot.source },
    },
    irrigationSource: "canal",
    waterAvailability: "abundant",
    drainage: "moderate",
    salinityRisk: "occasional",
    cropHistory: {
      currentCropId: "rice",
      previousCropId: "rice",
      plantingSeason: "S3",
      typicalPattern: { S1: "rice", S2: "rice", S3: "rice" },
    },
    farmerPriorities: ["soil", "water", "income", "drought", "inputs"],
    isDemo: true,
    createdAt: "2026-11-07T00:00:00.000Z",
  };
}

/** Importance 0–5 from rank: 1st → 5 … 5th → 1. Climate suitability defaults to 3. */
export function weightsFromPriorities(priorities: PriorityId[]): Record<CriterionId, number> {
  const w: Record<CriterionId, number> = { soil: 0, water: 0, drought: 0, income: 0, inputs: 0, climate: 3 };
  priorities.forEach((p, i) => (w[p] = Math.max(1, 5 - i)));
  return w;
}

/** ILLUSTRATIVE order-of-magnitude economics so the demo can show the income view. */
export const ILLUSTRATIVE_ECONOMICS: Record<string, EconomicInput> = {
  rice: { yieldT: 6.0, priceVnd: 7000, costMVnd: 25, status: "illustrative" },
  maize: { yieldT: 6.0, priceVnd: 6000, costMVnd: 22, status: "illustrative" },
  mungbean: { yieldT: 1.2, priceVnd: 25000, costMVnd: 14, status: "illustrative" },
  soybean: { yieldT: 2.0, priceVnd: 14000, costMVnd: 16, status: "illustrative" },
  peanut: { yieldT: 3.0, priceVnd: 20000, costMVnd: 30, status: "illustrative" },
  sesame: { yieldT: 1.0, priceVnd: 35000, costMVnd: 15, status: "illustrative" },
  sweetpotato: { yieldT: 18, priceVnd: 5000, costMVnd: 45, status: "illustrative" },
  sesbania: { yieldT: 0, priceVnd: 0, costMVnd: 3, status: "illustrative" },
  fallow: { yieldT: 0, priceVnd: 0, costMVnd: 0, status: "illustrative" },
};

let uid = 0;
export const newId = (p: string) => `${p}-${Date.now().toString(36)}-${(uid++).toString(36)}`;

export function slot(yearIndex: number, season: SeasonId, cropId: string | null, plantingMonth?: number): SeasonalCropSlot {
  return { id: newId("slot"), yearIndex, season, cropId, plantingMonth: plantingMonth ?? SEASONS[season].defaultMonth };
}

/**
 * Build the three illustrative starting strategies for ANY farm. Crops are chosen by the
 * engine's own suitability screen for this farm's soil, climate and season — not hard-coded.
 */
export const DEFAULT_SCENARIO_NAMES: Record<string, { en: string; vi: string }> = {
  "scenario-a": { en: "A · Climate fit", vi: "A · Hợp khí hậu" },
  "scenario-b": { en: "B · Water-Aware", vi: "B · Tiết kiệm nước" },
  "scenario-c": { en: "C · Soil Restoration", vi: "C · Phục hồi đất" },
};

export function buildDefaultScenarios(farm: FarmProfile, climate: ClimateDataset, settings: SimulationSettings, lang: "en" | "vi" = "en"): RotationScenario[] {
  const screen = screenCrops(farm, climate, settings);
  const tp = farm.cropHistory.typicalPattern;
  const ranked = (season: SeasonId, objective: "fit" | "water" | "soil") => screen[season]
    .filter((row) => row.suitability >= 55)
    .sort((a, b) => objective === "water" ? a.irrigation - b.irrigation || b.suitability - a.suitability
      : objective === "soil" ? Number(!!getCrop(b.cropId)?.agronomicProperties.nFixing) - Number(!!getCrop(a.cropId)?.agronomicProperties.nFixing) || b.suitability - a.suitability
      : b.suitability - a.suitability);
  const seasonFor = (objective: "fit" | "water" | "soil") => SEASON_ORDER
    .map((season) => {
      const current = screen[season].find((crop) => crop.cropId === tp[season]);
      return { season, exposure: objective === "water" ? current?.irrigation ?? 0 : 100 - (current?.suitability ?? 100) };
    }).sort((a, b) => b.exposure - a.exposure).map(({ season }) => season);
  const canPlant = (pattern: typeof tp, season: SeasonId, candidate: string | null) => {
    const crop = getCrop(candidate);
    if (!crop || crop.id === "fallow") return true;
    const day = 86400000;
    const start = (year: number, s: SeasonId) =>
      Date.UTC(year, monthOffset(s, farm.cropHistory.plantingMonths?.[s] ?? SEASONS[s].defaultMonth) - 1, 1);
    const middleYear = settings.startYear + 1;
    const planting = start(middleYear, season);
    const harvest = planting + crop.growingDuration * day;
    return [middleYear - 1, middleYear, middleYear + 1].every((year) => SEASON_ORDER.every((neighbor) => {
      if (year === middleYear && neighbor === season) return true;
      const other = getCrop(pattern[neighbor]);
      if (!other || other.id === "fallow") return true;
      const otherStart = start(year, neighbor);
      return harvest <= otherStart || otherStart + other.growingDuration * day <= planting;
    }));
  };
  const patterns = new Set<string>([JSON.stringify(SEASON_ORDER.map((s) => tp[s] === "fallow" ? null : tp[s]))]);
  const alternative = (objective: "fit" | "water" | "soil") => {
    for (const season of seasonFor(objective)) {
      const family = getCrop(tp[season])?.family;
      const choices = ranked(season, objective);
      const ordered = [...choices.filter((c) => getCrop(c.cropId)?.family !== family), ...choices];
      for (const candidate of [...ordered.map((c) => c.cropId), null]) {
        if (!canPlant(tp, season, candidate)) continue;
        const chosen = { ...tp, [season]: candidate };
        const key = JSON.stringify(SEASON_ORDER.map((s) => chosen[s] === "fallow" ? null : chosen[s]));
        if (patterns.has(key)) continue;
        patterns.add(key);
        return chosen;
      }
    }
    return { ...tp };
  };
  const fit = alternative("fit");
  const water = alternative("water");
  const soil = alternative("soil");
  const slots = (pattern: typeof tp, year: number) => SEASON_ORDER.map((season) =>
    slot(year, season, pattern[season], farm.cropHistory.plantingMonths?.[season]));
  const base = {
    farmId: farm.id,
    climateAssumption: settings.climateAssumption,
    farmerPriorityWeights: settings.weights,
    simulationHorizon: settings.horizon,
    createdAt: new Date().toISOString(),
  };
  return [
    {
      ...base,
      id: "scenario-a",
      name: DEFAULT_SCENARIO_NAMES["scenario-a"][lang],
      kind: "conventional",
      cycleYears: 1,
      seasonalCropSequence: slots(fit, 0),
    },
    {
      ...base,
      id: "scenario-b",
      name: DEFAULT_SCENARIO_NAMES["scenario-b"][lang],
      kind: "water",
      cycleYears: 2,
      seasonalCropSequence: [...slots(water, 0), ...slots(fit, 1)],
    },
    {
      ...base,
      id: "scenario-c",
      name: DEFAULT_SCENARIO_NAMES["scenario-c"][lang],
      kind: "soil",
      cycleYears: 2,
      seasonalCropSequence: [...slots(soil, 0), ...slots(water, 1)],
    },
  ];
}

/** Planar approximation of polygon area (ha) — adequate for field-sized shapes. */
export function polygonAreaHa(ring: [number, number][]) {
  if (ring.length < 3) return 0;
  const lat0 = (ring.reduce((s, p) => s + p[1], 0) / ring.length) * (Math.PI / 180);
  const mx = 111320 * Math.cos(lat0);
  const my = 110540;
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    a += x1 * mx * (y2 * my) - x2 * mx * (y1 * my);
  }
  return Math.abs(a / 2) / 10000;
}

/** Offline gazetteer so location search works without a geocoding service. */
export const GAZETTEER: { name: string; lat: number; lon: number }[] = [
  { name: "Thới Lai, Cần Thơ", lat: 10.07, lon: 105.56 },
  { name: "Cần Thơ", lat: 10.0452, lon: 105.7469 },
  { name: "Cờ Đỏ, Cần Thơ", lat: 10.1, lon: 105.43 },
  { name: "Long Xuyên, An Giang", lat: 10.3864, lon: 105.4352 },
  { name: "Châu Đốc, An Giang", lat: 10.7009, lon: 105.1153 },
  { name: "Cao Lãnh, Đồng Tháp", lat: 10.46, lon: 105.6325 },
  { name: "Rạch Giá, Kiên Giang", lat: 10.0125, lon: 105.0809 },
  { name: "Vị Thanh, Hậu Giang", lat: 9.7845, lon: 105.4701 },
  { name: "Sóc Trăng", lat: 9.6025, lon: 105.9739 },
  { name: "Bạc Liêu", lat: 9.285, lon: 105.7244 },
  { name: "Cà Mau", lat: 9.1769, lon: 105.15 },
  { name: "Trà Vinh", lat: 9.9347, lon: 106.3453 },
  { name: "Vĩnh Long", lat: 10.2537, lon: 105.9722 },
  { name: "Bến Tre", lat: 10.2434, lon: 106.3756 },
  { name: "Mỹ Tho, Tiền Giang", lat: 10.36, lon: 106.36 },
  { name: "Tân An, Long An", lat: 10.5354, lon: 106.4137 },
  { name: "Hà Nội", lat: 21.0278, lon: 105.8342 },
  { name: "Thái Bình", lat: 20.4463, lon: 106.3366 },
  { name: "Huế", lat: 16.4637, lon: 107.5909 },
  { name: "Buôn Ma Thuột, Đắk Lắk", lat: 12.6667, lon: 108.05 },
];
