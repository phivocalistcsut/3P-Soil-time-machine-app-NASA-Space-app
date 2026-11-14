import assert from "node:assert/strict";
import test from "node:test";
import { historyYears, monthPeriod, pointFromQuery, vegetationDates, type EnvironmentalSeries } from "../lib/data/evidence";
import { getDemoSnapshot, getOfflineClimate } from "../lib/data/climate-datasets";
import { fieldBoundary } from "../lib/data/geometry";
import { buildDefaultScenarios, createDemoFarm, weightsFromPriorities } from "../lib/data/demo";
import { climateWithImerg, smapWetMonths } from "../lib/engine/environment";
import { runEngine } from "../lib/engine/simulate";
import { ProviderError, upstreamJson } from "../lib/services/http";
import { aggregateImerg } from "../lib/services/imerg";
import { fetchNdviSeries, normalizeNdvi } from "../lib/services/ndvi";
import { parsePowerMonthly, type PowerJson } from "../lib/services/power";
import { normalizeSmap } from "../lib/services/smap";
import type { FarmProfile, SimulationSettings } from "../lib/types";

const farm = createDemoFarm();
const settings: SimulationSettings = { startYear: 2026, horizon: 3, climateAssumption: "baseline",
  weights: weightsFromPriorities(farm.farmerPriorities), economics: {} };

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
