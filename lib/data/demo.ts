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
    // Centre of a rice-paddy block west of Thới Lai town (checked on Sentinel-2 imagery): the whole
    // 250 m MODIS pixel and the 2.5 ha boundary fall on paddy strips, away from canal-side houses.
    latitude: 10.0934,
    longitude: 105.5185,
    areaHa: 2.5,
    // 230 m × 110 m, rotated to follow the local paddy strips (≈ 27° north of east).
    boundary: [
      [105.519207, 10.094315],
      [105.519662, 10.093429],
      [105.517793, 10.092485],
      [105.517338, 10.093371],
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
const YIELD_SOURCE = "Historical yield: Can Tho Statistics Office 2024 annual report, Table 4 (ta/ha divided by 10); https://thongkecantho.gso.gov.vn/uploads/files/2025_01_cantho_so%20lieu%20ktxh%20nam%202024_02_1_2025.pdf";
const RICE_PRICE_SOURCE = "Historical illustrative rice price 7,000 VND/kg: IPSARD/VnSAT rice market report February 2025, Can Tho Dai Thom 8 at 7,000–7,100 VND/kg; https://thitruongnongsan.gov.vn/images/2013/DANGNHAP/VnSAT_Lua%20gao/2025/Th%C3%A1ng/Bao%20cao%20Lua%20gao_Thang%2002_2025.pdf";
const ASSUMED_PRICE_COST = "ILLUSTRATIVE scenario: price and cost are unvalidated placeholders, not market observations or forecasts. TODO(source): local farm budgets and current prices.";
export const ILLUSTRATIVE_ECONOMICS: Record<string, EconomicInput> = {
  rice: { yieldT: 6.298, priceVnd: 7000, costMVnd: 25, status: "illustrative", source: `${YIELD_SOURCE}, yield rounded to 3 decimals; ${RICE_PRICE_SOURCE}; cost 25 million VND/ha/crop is an unvalidated illustrative assumption.` },
  maize: { yieldT: 5.831, priceVnd: 6000, costMVnd: 22, status: "illustrative", source: `${YIELD_SOURCE}; ${ASSUMED_PRICE_COST}` },
  mungbean: { yieldT: 1.38, priceVnd: 25000, costMVnd: 14, status: "illustrative", source: `Historical yield: Cho Moi, An Giang, five-variety mean 2004, Table 6; https://sj.ctu.edu.vn/ql/docgia/download/baibao-4853/fn_19_lvdung.pdf; ${ASSUMED_PRICE_COST}` },
  soybean: { yieldT: 2.012, priceVnd: 14000, costMVnd: 16, status: "illustrative", source: `${YIELD_SOURCE}; ${ASSUMED_PRICE_COST}` },
  peanut: { yieldT: 1.763, priceVnd: 20000, costMVnd: 30, status: "illustrative", source: `${YIELD_SOURCE}; ${ASSUMED_PRICE_COST}` },
  sesame: { yieldT: 1.0, priceVnd: 35000, costMVnd: 15, status: "illustrative", source: `Yield reference: DH1 control, Mekong Delta trial, Bui Quang Dinh et al. 2018; https://tapchi.vaas.vn/sites/tapchi.vaas.vn/files/tapchi/2021-08/tc20-2018_1.pdf; ${ASSUMED_PRICE_COST}` },
  sweetpotato: { yieldT: 12.491, priceVnd: 5000, costMVnd: 45, status: "illustrative", source: `${YIELD_SOURCE}; ${ASSUMED_PRICE_COST}` },
  sesbania: { yieldT: 0, priceVnd: 0, costMVnd: 3, status: "illustrative", source: "Incorporated green manure: no marketed harvest; cost 3 million VND/ha is illustrative. TODO(source): seed and incorporation cost." },
  fallow: { yieldT: 0, priceVnd: 0, costMVnd: 0, status: "illustrative", source: "No crop revenue; no assigned operating cost. Land rent and overhead are not modeled." },
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
  /*
   * Three genuinely different strategies along the real Mekong trade-off (crops still chosen by the
   * engine's own suitability and irrigation screen for this farm):
   *   A · fit   — "rice – upland – rice": keep the main Winter–Spring rice and put the best-fitting upland
   *               crop in the thirstiest other season (usually Summer–Autumn).
   *   B · water — replace the season with the highest irrigation need (usually dry-season Winter–Spring rice,
   *               also the most salinity-exposed) with the upland crop that needs the least water.
   *   C · soil  — a legume in that same dry season (upland in dry soil decomposes carbon slowly) and, every
   *               other year, a green-manure crop instead of flood-season rice.
   * B and C give up the main rice season, so their income trade-off must be checked locally.
   */
  const activeSeasons = SEASON_ORDER.filter((s) => getCrop(tp[s]) && tp[s] !== "fallow");
  const current = (s: SeasonId) => screen[s].find((row) => row.cropId === tp[s]);
  const byNeed = [...activeSeasons].sort((a, b) => (current(b)?.irrigation ?? 0) - (current(a)?.irrigation ?? 0));
  const mainSeason = activeSeasons.includes("S1") ? "S1" : null;
  const fitSeason = byNeed.find((s) => s !== mainSeason);
  const dryValueSeason = byNeed[0];
  const restSeason = activeSeasons.find((s) => s !== dryValueSeason && s !== fitSeason) ??
    activeSeasons.find((s) => s !== dryValueSeason);
  const usable = (season: SeasonId, minSuit = 60) => screen[season].filter((row) => {
    const crop = getCrop(row.cropId);
    return crop && row.suitability >= minSuit && crop.id !== tp[season] && crop.category !== "green_manure" &&
      crop.category !== "fallow" && canPlant(tp, season, crop.id);
  });
  const pick = (rows: { cropId: string }[], avoid: (string | null)[]) =>
    (rows.find((r) => !avoid.includes(r.cropId)) ?? rows[0])?.cropId ?? null;
  const designed = (() => {
    if (!fitSeason || !dryValueSeason) return null;
    const fitCrop = pick([...usable(fitSeason)].sort((a, b) => b.suitability - a.suitability), []);
    const dryRows = usable(dryValueSeason);
    const waterCrop = pick([...dryRows].sort((a, b) => a.irrigation - b.irrigation || b.suitability - a.suitability), []);
    const legume = pick([...dryRows].filter((r) => getCrop(r.cropId)?.agronomicProperties.nFixing)
      .sort((a, b) => b.suitability - a.suitability), [waterCrop]);
    if (!fitCrop || !waterCrop) return null;
    const greenManure = restSeason ? screen[restSeason].filter((r) => getCrop(r.cropId)?.category === "green_manure" &&
      r.suitability >= 55 && canPlant(tp, restSeason, r.cropId)).sort((a, b) => b.suitability - a.suitability)[0]?.cropId ?? null : null;
    const soil = { ...tp, [dryValueSeason]: legume ?? waterCrop };
    return {
      fit: { ...tp, [fitSeason]: fitCrop },
      water: { ...tp, [dryValueSeason]: waterCrop },
      soil,
      soilRest: restSeason ? { ...soil, [restSeason]: greenManure } : soil,
    };
  })();
  const fallbackFit = designed ? null : alternative("fit");
  const fit = designed?.fit ?? fallbackFit!;
  const water = designed?.water ?? alternative("water");
  const soil = designed?.soil ?? alternative("soil");
  const waterYear2 = designed ? water : fit;
  const soilYear2 = designed?.soilRest ?? water;
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
      kind: "fit",
      cycleYears: 1,
      seasonalCropSequence: slots(fit, 0),
    },
    {
      ...base,
      id: "scenario-b",
      name: DEFAULT_SCENARIO_NAMES["scenario-b"][lang],
      kind: "water",
      cycleYears: designed ? 1 : 2,
      seasonalCropSequence: designed ? slots(water, 0) : [...slots(water, 0), ...slots(waterYear2, 1)],
    },
    {
      ...base,
      id: "scenario-c",
      name: DEFAULT_SCENARIO_NAMES["scenario-c"][lang],
      kind: "soil",
      cycleYears: 2,
      seasonalCropSequence: [...slots(soil, 0), ...slots(soilYear2, 1)],
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
