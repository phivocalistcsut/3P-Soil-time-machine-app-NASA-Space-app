import assert from "node:assert/strict";
import test from "node:test";
import { writeArrayBuffer } from "geotiff";
import { CROPS } from "../lib/data/crops";
import { resolveSoilInput, withRothCSoil } from "../lib/data/farm-soil";
import soilSnapshot from "../data/soilgrids-thoi-lai.json";
import { fetchSoilGrids } from "../lib/services/soilgrids";
import { historyYears, monthPeriod, pointFromQuery, vegetationDates, type EnvironmentalSeries } from "../lib/data/evidence";
import { getDemoSnapshot, getOfflineClimate } from "../lib/data/climate-datasets";
import { fieldBoundary } from "../lib/data/geometry";
import { buildDefaultScenarios, createDemoFarm, weightsFromPriorities } from "../lib/data/demo";
import { climateWithImerg, smapWetMonths } from "../lib/engine/environment";
import { runEngine } from "../lib/engine/simulate";
import { prepareClimate } from "../lib/engine/climate";
import { rothCMonths, soilCarbonRating } from "../lib/engine/soil-carbon";
import { ProviderError, upstreamJson } from "../lib/services/http";
import { aggregateImerg } from "../lib/services/imerg";
import { fetchNdviSeries, normalizeNdvi } from "../lib/services/ndvi";
import { parsePowerMonthly, type PowerJson } from "../lib/services/power";
import { normalizeSmap } from "../lib/services/smap";
import type { FarmProfile, SimulationSettings } from "../lib/types";

const farm = createDemoFarm();
const settings: SimulationSettings = { startYear: 2026, horizon: 3, climateAssumption: "baseline",
  weights: weightsFromPriorities(farm.farmerPriorities), economics: {} };

// Tiny georeferenced GeoTIFFs exercise the WCS request, decoder, pixel lookup AND unit conversion.
const SOIL_RAW: Record<string, number> = {
  "phh2o_0-5cm_mean": 60, "sand_0-5cm_mean": 300,
  "soc_0-5cm_mean": 200, "soc_5-15cm_mean": 100, "soc_15-30cm_mean": 50,
  "clay_0-5cm_mean": 200, "clay_5-15cm_mean": 300, "clay_15-30cm_mean": 400,
  "bdod_0-5cm_mean": 100, "bdod_5-15cm_mean": 120, "bdod_15-30cm_mean": 140,
};

function soilFetcher(overrides: Record<string, number | null> = {}, ids: string[] = []): typeof fetch {
  return async (request) => {
    const q = new URL(String(request)).searchParams;
    const id = q.get("COVERAGEID")!;
    ids.push(id);
    assert.equal(q.get("VERSION"), "2.0.1");
    assert.equal(q.getAll("SUBSET").length, 2);
    assert.ok(id in SOIL_RAW, `Unexpected coverage ${id}`);
    if (id in overrides && overrides[id] === null) return new Response(null, { status: 404 });
    const value = overrides[id] ?? SOIL_RAW[id];
    const bytes = writeArrayBuffer(new Float32Array([value]), {
      width: 1, height: 1, ModelPixelScale: [0.02, 0.02, 0], ModelTiepoint: [0, 0, 0, 104.99, 10.01, 0],
      GeographicTypeGeoKey: 4326, GTModelTypeGeoKey: 2, GTRasterTypeGeoKey: 1, GDAL_NODATA: "-9999",
    });
    return new Response(bytes, { headers: { "content-type": "image/tiff" } });
  };
}

test("SoilGrids reads eleven WCS layers, preserving topsoil fields and computing 0–30 cm stock", async () => {
  const ids: string[] = [];
  const soil = await fetchSoilGrids(10, 105, soilFetcher({}, ids));
  assert.equal(new Set(ids).size, 11);
  assert.equal(soil.ph, 6);
  assert.equal(soil.socPercent, 2); // 200 dg/kg = 20 g/kg = 2%
  assert.equal(soil.clayPercent, 20);
  assert.equal(soil.sandPercent, 30);
  assert.equal(soil.texture, "loam");
  assert.equal(soil.socStockTCHa, 32.5); // 20*1*5*.1 + 10*1.2*10*.1 + 5*1.4*15*.1
  assert.equal(soil.clayPercent0to30, 1000 / 30); // (20*5 + 30*10 + 40*15)/30
  assert.equal(soil.layers[2].bulkDensityGCm3, 1.4);
});

test("SoilGrids does not interpolate missing SOC, density or clay depths", async () => {
  for (const id of ["soc_5-15cm_mean", "bdod_15-30cm_mean", "clay_0-5cm_mean"]) {
    const soil = await fetchSoilGrids(10, 105, soilFetcher({ [id]: null }));
    assert.equal(soil.socStockTCHa, id.startsWith("clay") ? 32.5 : null);
    assert.equal(soil.clayPercent0to30, id.startsWith("clay") ? null : 1000 / 30);
    assert.equal(soil.ph, 6);
  }
  const nodata = await fetchSoilGrids(10, 105, soilFetcher({ "bdod_5-15cm_mean": -9999 }));
  assert.equal(nodata.socStockTCHa, null);
  const zeroDensity = await fetchSoilGrids(10, 105, soilFetcher({ "bdod_5-15cm_mean": 0 }));
  assert.equal(zeroDensity.socStockTCHa, null);
  const zeroCarbon = await fetchSoilGrids(10, 105, soilFetcher({ "soc_0-5cm_mean": 0 }));
  assert.equal(zeroCarbon.socPercent, 0);
  assert.equal(zeroCarbon.socStockTCHa, 22.5);
  await assert.rejects(fetchSoilGrids(10, 105, soilFetcher(Object.fromEntries(Object.keys(SOIL_RAW).map((id) => [id, null])))), { message: "unavailable" });
});

test("farmer 0–30 cm measurements take priority, retain zero and never invent missing soil inputs", () => {
  assert.deepEqual(resolveSoilInput("38,5", 30, "SoilGrids", 100), { value: 38.5, tag: { status: "observed", source: "Farmer soil test · 0–30 cm" } });
  assert.equal(resolveSoilInput("0", 30, "SoilGrids").value, 0);
  assert.equal(resolveSoilInput("", 30, "SoilGrids").tag.status, "estimated");
  assert.equal(resolveSoilInput("NaN", null, undefined).tag.status, "unavailable");
  assert.equal(resolveSoilInput("101", null, undefined, 100).value, null);
  const legacy = JSON.parse(JSON.stringify(farm));
  delete legacy.clayPercent;
  delete legacy.socStockTCHa;
  delete legacy.soilSources.clayPercent;
  delete legacy.soilSources.socStockTCHa;
  const upgraded = withRothCSoil(legacy);
  assert.equal(upgraded.clayPercent, null);
  assert.equal(upgraded.socStockTCHa, null);
  assert.equal(upgraded.soilSources.clayPercent.status, "unavailable");
  assert.equal(upgraded.soilOrganicCarbon, farm.soilOrganicCarbon);
  assert.equal(farm.clayPercent, soilSnapshot.clayPercent0to30);
  assert.equal(farm.socStockTCHa, soilSnapshot.socStockTCHa);
  assert.equal(farm.soilSources.socStockTCHa.status, farm.socStockTCHa === null ? "unavailable" : "estimated");
});

test("all catalog crops have sourced, non-negative estimated RothC residue inputs", () => {
  for (const crop of CROPS) {
    assert.ok(Number.isFinite(crop.rothc.residueCTHa) && crop.rothc.residueCTHa >= 0, crop.id);
    assert.equal(crop.rothc.status, "estimated");
    assert.ok(crop.rothc.dpmRpm > 0);
    assert.ok(crop.rothc.source.includes("https://"));
  }
  assert.equal(CROPS.find((c) => c.id === "fallow")!.rothc.residueCTHa, 0);
  const rice = CROPS.find((c) => c.id === "rice")!.rothc;
  assert.match(rice.source, /Only roots \+ stubble/);
  assert.ok(Math.abs(rice.residueCTHa - 1.074058592549) < 0.000001);
  // Non-tuber roots are based on vine biomass; harvested sweet-potato tubers cannot be credited as roots.
  assert.ok(Math.abs(CROPS.find((c) => c.id === "sweetpotato")!.rothc.residueCTHa - 0.55743036096) < 0.000001);
});

test("RothC integration anchors the initial stock, shares spin-up and is deterministic", () => {
  const climate = getDemoSnapshot();
  const scenarios = buildDefaultScenarios(farm, climate, settings);
  const input = { farm, climate, scenarios, settings: { ...settings, climateAssumption: "drier" as const } };
  const result = runEngine(input);
  assert.deepEqual(runEngine(input), result);
  const all = [result.reference, ...Object.values(result.results), ...Object.values(result.baselineClimate)];
  for (const simulation of all) {
    const start = simulation.years[0];
    assert.ok(start.isBaselineYear);
    assert.ok(Math.abs(start.soilImprovementPotential!.socTCHa - farm.socStockTCHa!) / farm.socStockTCHa! < 0.01);
    assert.equal(start.soilImprovementPotential!.deltaTCHa, 0);
    assert.equal(start.soilImprovementPotential!.deltaPctPerYear, 0);
    assert.equal(start.soilCarbonInputs!.equilibriumPlantC, result.reference.years[0].soilCarbonInputs!.equilibriumPlantC);
    for (const year of simulation.years) {
      assert.equal(year.dataStatus.soilImprovementPotential, "estimated");
      assert.ok(Number.isFinite(year.soilImprovementPotential!.socTCHa));
      assert.ok(Number.isFinite(year.overallScore));
      const soil = year.soilImprovementPotential!;
      assert.ok(Math.abs(year.criteriaScores.soil! - (0.7 * soil.score + 0.3 * year.rotationDiversity.score)) < 1e-10);
    }
  }
});

test("missing soil or an unidentifiable bare-fallow spin-up excludes the soil criterion", () => {
  const climate = getDemoSnapshot();
  const scenarios = buildDefaultScenarios(farm, climate, settings);
  for (const patch of [{ clayPercent: null }, { socStockTCHa: null }, { cropHistory: { ...farm.cropHistory, typicalPattern: { S1: "fallow", S2: "fallow", S3: "fallow" } } }]) {
    const result = runEngine({ farm: { ...farm, ...patch }, scenarios, climate, settings });
    for (const simulation of [result.reference, ...Object.values(result.results)]) for (const year of simulation.years) {
      assert.equal(year.soilImprovementPotential, null);
      assert.equal(year.criteriaScores.soil, null);
      assert.equal(year.dataStatus.soilImprovementPotential, "unavailable");
      assert.equal(year.contributions.soil, 0);
      assert.ok(Number.isFinite(year.overallScore));
    }
  }
});

test("RothC months align Dec–Nov climate, leap days and cross-year harvest carbon", () => {
  const climate = getDemoSnapshot();
  const prepared = prepareClimate(climate, "baseline");
  const initial = runEngine({ farm, climate, scenarios: [], settings }).reference.years[0];
  const next = { year: 2028, monthlyCover: Array(12).fill(null) as (string | null)[] };
  next.monthlyCover[0] = "rice";
  const crop = CROPS.find((c) => c.id === "rice")!;
  const carry = { ...initial.seasons[0], year: 2027, startOffset: 10, durationDays: 100, cropId: "rice" };
  const months = rothCMonths(next, prepared, [carry], true);
  assert.equal(months[0].tempC, prepared.climatology[11].t2m);
  assert.equal(months[0].panEvapMm, prepared.climatology[11].et0Day * 31 / 0.75);
  assert.equal(months[2].panEvapMm, prepared.climatology[1].et0Day * 29 / 0.75);
  assert.equal(months[0].waterRegime, "paddyFlooded");
  assert.equal(months[1].waterRegime, "paddyDrained");
  assert.equal(rothCMonths(next, prepared, [], false)[1].waterRegime, "upland");
  assert.ok(Math.abs(months[1].plantC - crop.rothc.residueCTHa) < 1e-12); // Oct 1 + 99 days -> Jan 8.
  assert.ok(Math.abs(months.reduce((sum, m) => sum + m.plantC, 0) - crop.rothc.residueCTHa) < 1e-12);
  assert.ok(months.every((m) => m.fymC === 0));
});

test("SOC levels and score follow the disclosed 4-per-1000 reference scale", () => {
  assert.equal(soilCarbonRating(-0.401).level, 1);
  assert.equal(soilCarbonRating(-0.4).level, 2);
  assert.equal(soilCarbonRating(-0.1).level, 2);
  assert.equal(soilCarbonRating(0).level, 3);
  assert.equal(soilCarbonRating(0.1).level, 4);
  assert.equal(soilCarbonRating(0.4).level, 5);
  assert.equal(soilCarbonRating(-2).score, 0);
  assert.equal(soilCarbonRating(0).score, 50);
  assert.equal(soilCarbonRating(2).score, 100);
});

test("point coordinates and historical dates reject invalid values", () => {
  const now = new Date("2026-11-14T00:00:00Z");
  assert.equal(pointFromQuery(new URLSearchParams("lon=0")), null);
  assert.equal(pointFromQuery(new URLSearchParams("lat=&lon=105")), null);
  assert.equal(pointFromQuery(new URLSearchParams("lat=91&lon=105")), null);
  assert.deepEqual(pointFromQuery(new URLSearchParams("lat=0&lon=0")), { lat: 0, lon: 0 });
  assert.equal(historyYears(new URLSearchParams("start=2026&end=2027"), 1984, now), null);
  assert.equal(historyYears(new URLSearchParams("start=2000&end=2025"), 1984, now), null);
  assert.equal(vegetationDates(new URLSearchParams("start=2024-02-30&end=2024-04-01"), now), null);
  assert.deepEqual(monthPeriod(2024, 2), ["2024-02-01", "2024-02-29"]);
  assert.equal(getOfflineClimate(16.4852, 107.493), null);
});

test("field geometry rejects self-crossings and returns a validated location for concave fields", () => {
  assert.equal(fieldBoundary([[0, 0], [0.001, 0.001], [0, 0.001], [0.001, 0]]), null);
  assert.equal(fieldBoundary([[0, 0], [0.001, 0], [0, 0]]), null);
  const field = fieldBoundary([[105, 10], [105.002, 10], [105.002, 10.001], [105.001, 10.001], [105.001, 10.002], [105, 10.002]]);
  assert.ok(field && field.areaHa > 2 && field.areaHa < 5);
  assert.ok(field.lat < 10.001 || field.lon < 105.001);
});

test("POWER checks reported units and never fills required inputs", () => {
  const units = { PRECTOTCORR: "mm/day", T2M: "C", T2M_RANGE: "C", RH2M: "%", WS2M: "m/s", ALLSKY_SFC_SW_DWN: "MJ/m^2/day" };
  const data: PowerJson = {
    geometry: { coordinates: [105, 10, 12] },
    parameters: Object.fromEntries(Object.entries(units).map(([k, unit]) => [k, { units: unit }])),
    properties: { parameter: Object.fromEntries(Object.keys(units).map((k) => [k, Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [`2024${String(i + 1).padStart(2, "0")}`, k === "PRECTOTCORR" ? 3 : 20]),
    )])) },
  };
  const opts = { lat: 10, lon: 105, start: 2024, end: 2024, retrievedAt: "2026-11-14T00:00:00Z", cached: false };
  const climate = parsePowerMonthly(data, opts);
  assert.equal(climate.months[1].precipMm, 87);
  assert.equal(climate.status, "estimated");
  data.properties!.parameter!.RH2M["202402"] = -999;
  assert.throws(() => parsePowerMonthly(data, opts), { message: "unavailable" });
  data.parameters!.PRECTOTCORR.units = "in/day";
  assert.throws(() => parsePowerMonthly(data, opts), { message: "upstream" });
});

test("ORNL one-pixel sample joins and masks quality bands", async () => {
  assert.equal(normalizeNdvi("2024-01-01", -2000, 0, 0).ndvi, -0.2);
  assert.equal(normalizeNdvi("2024-01-01", 7000, 1, 0).quality, "marginal");
  assert.equal(normalizeNdvi("2024-01-01", 7000, 1, 0).ndvi, 0.7);
  assert.equal(normalizeNdvi("2024-01-01", 7000, 2, 0).ndvi, null);
  assert.equal(normalizeNdvi("2024-01-01", 7000, 0, 1 << 10).ndvi, null);
  assert.equal(normalizeNdvi("2024-01-01", -3000, 0, 0).ndvi, null);
  const date = { modis_date: "A2024001", calendar_date: "2024-01-01" };
  const mock: typeof fetch = async (request) => {
    const url = new URL(String(request));
    if (url.pathname.endsWith("/dates")) return Response.json({ dates: [date] });
    const band = url.searchParams.get("band");
    return Response.json({ nrows: 1, ncols: 1, subset: [{ ...date, band, data: [band?.endsWith("_NDVI") ? 7500 : 0] }] });
  };
  const ndvi = await fetchNdviSeries(10, 105, { start: "2024-01-01", end: "2024-01-01" }, mock);
  assert.equal(ndvi.points[0].ndvi, 0.75);
  assert.equal(ndvi.evidence?.productId, "MOD13Q1.061");
  await assert.rejects(fetchNdviSeries(10, 105, { start: "2025-01-01", end: "2025-01-31" }, mock), { message: "unavailable" });
  // every composite cloudy: an empty series must not be returned (and cached) as an observation
  const cloudy: typeof fetch = async (request) => {
    const url = new URL(String(request));
    if (url.pathname.endsWith("/dates")) return Response.json({ dates: [date] });
    const band = url.searchParams.get("band");
    return Response.json({ nrows: 1, ncols: 1, subset: [{ ...date, band, data: [band?.endsWith("_NDVI") ? 7500 : band?.endsWith("_reliability") ? 3 : 0] }] });
  };
  await assert.rejects(fetchNdviSeries(10, 105, { start: "2024-01-01", end: "2024-01-01" }, cloudy), { message: "unavailable" });
  // a provider outage on most requests is thrown, not returned as gaps
  const flaky: typeof fetch = async (request) => {
    const url = new URL(String(request));
    if (url.pathname.endsWith("/dates")) return Response.json({ dates: [date] });
    if (!url.searchParams.get("band")?.endsWith("_NDVI")) return new Response("busy", { status: 400 });
    return Response.json({ nrows: 1, ncols: 1, subset: [{ ...date, band: url.searchParams.get("band"), data: [7500] }] });
  };
  await assert.rejects(fetchNdviSeries(10, 105, { start: "2024-01-01", end: "2024-01-01" }, flaky));
});

test("IMERG requires named source and rejects monthly totals with missing days", () => {
  const values = Object.fromEntries(Array.from({ length: 31 }, (_, i) => [`202401${String(i + 1).padStart(2, "0")}`, 2]));
  const json: PowerJson = { properties: { parameter: { IMERG_PRECTOT: values } },
    header: { sources: ["IMERG"], time_standard: "UTC" }, parameters: { IMERG_PRECTOT: { units: "mm/day" } } };
  const dataset = aggregateImerg(json, 10, 105, 2024, 2024);
  assert.equal(dataset.observations[0].value, 62);
  assert.equal(dataset.observations[1].value, null);
  json.header!.sources = ["MERRA2"];
  assert.throws(() => aggregateImerg(json, 10, 105, 2024, 2024), { message: "unavailable" });
});

test("SMAP scale, no-data and three-year climatology", () => {
  assert.equal(normalizeSmap(-99956, 100, 1000), 0.44);
  assert.equal(normalizeSmap(NaN, 100, 1000), null);
  assert.equal(normalizeSmap(-9999, 100, 1000), null);
  const archive = getDemoSnapshot();
  const series: EnvironmentalSeries = {
    status: "estimated", cached: false,
    evidence: { provider: "NASA", dataset: "SMAP", productId: "SMAP", geometry: { type: "Point", coordinates: [farm.longitude, farm.latitude] },
      period: ["2016-01-01", "2025-12-31"], resolution: "9 km", retrievedAt: archive.retrievedAt, sourceUrl: "", quality: "" },
    observations: archive.months.map((m) => ({ variable: "root_zone_soil_moisture", unit: "m³/m³", quality: "valid",
      period: monthPeriod(m.year, m.month), value: [8, 9, 10].includes(m.month) ? 0.5 : 0.2 })),
  };
  assert.deepEqual([...smapWetMonths(series, farm)], [8, 9, 10]);
  assert.equal(smapWetMonths({ ...series, observations: series.observations.slice(0, 24) }, farm).size, 0);
});

test("rate limits and upstream outages give controlled errors", async () => {
  let attempts = 0;
  const transient: typeof fetch = async () => (++attempts === 1 ? new Response(null, { status: 503 }) : Response.json({ ok: true }));
  assert.deepEqual(await upstreamJson("https://example.test", 2000, transient), { ok: true });
  const limited: typeof fetch = async () => new Response(null, { status: 429, headers: { "Retry-After": "120" } });
  await assert.rejects(upstreamJson("https://example.test", 1000, limited), (e: unknown) =>
    e instanceof ProviderError && e.code === "rate_limited");
  const unauthorized: typeof fetch = async () => new Response("provider response never forwarded", { status: 401 });
  await assert.rejects(upstreamJson("https://example.test", 1000, unauthorized), { message: "upstream" });
});

test("three plans are distinct and complete, same-point IMERG changes the model", () => {
  const climate = { ...getDemoSnapshot(), latitude: farm.latitude, longitude: farm.longitude };
  const imerg: EnvironmentalSeries = {
    status: "observed", cached: false,
    evidence: { provider: "NASA", dataset: "IMERG", productId: "IMERG", geometry: { type: "Point", coordinates: [farm.longitude, farm.latitude] },
      period: ["2016-01-01", "2025-12-31"], resolution: "0.1 degree", retrievedAt: climate.retrievedAt, sourceUrl: "", quality: "" },
    observations: climate.months.map((m) => ({ variable: "precipitation", unit: "mm/month", quality: "valid",
      period: monthPeriod(m.year, m.month), value: m.precipMm * 0.2 })),
  };
  const scenarios = buildDefaultScenarios(farm, climate, settings);
  const sequences = scenarios.map((s) => s.seasonalCropSequence.slice(0, 3).map((slot) => slot.cropId).join(","));
  assert.equal(new Set([Object.values(farm.cropHistory.typicalPattern).join(","), ...sequences]).size, 4);
  const original = runEngine({ farm, scenarios, climate, settings });
  const modelClimate = climateWithImerg(climate, imerg);
  const withImerg = runEngine({ farm, scenarios, climate: modelClimate, settings });
  assert.ok(withImerg.reference.years[1].waterDemand.median > original.reference.years[1].waterDemand.median);
  assert.equal(climateWithImerg(climate, { ...imerg, observations: imerg.observations.slice(1) }), climate);
  const missingSoil: FarmProfile = { ...farm, soilPH: null, soilOrganicCarbon: null, drainage: "poor" };
  assert.ok(Number.isFinite(runEngine({ farm: missingSoil, scenarios, climate, settings }).reference.years[1].overallScore));
  const overlap = { ...scenarios[0], seasonalCropSequence: scenarios[0].seasonalCropSequence.map((slot) => (
    { ...slot, cropId: "rice", plantingMonth: slot.season === "S1" ? 1 : slot.season === "S2" ? 3 : 9 }
  )) };
  assert.ok(runEngine({ farm, scenarios: [overlap], climate, settings }).results[overlap.id].years[1].seasons.some((s) => s.overlap));
});
