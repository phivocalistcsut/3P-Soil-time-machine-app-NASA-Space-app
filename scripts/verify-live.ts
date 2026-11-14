import assert from "node:assert/strict";
import { buildDefaultScenarios, createDemoFarm, weightsFromPriorities } from "../lib/data/demo";
import { climateWithImerg } from "../lib/engine/environment";
import { runEngine } from "../lib/engine/simulate";
import type { EnvironmentalSeries } from "../lib/data/evidence";
import type { ClimateDataset, DailyExtremes, NdviSeries, SimulationSettings } from "../lib/types";

const base = process.env.STM_VERIFY_URL ?? "http://127.0.0.1:3000";
const locations = [
  ["Thới Lai, Mekong Delta", 10.0706, 105.5599],
  ["Hương Trà, Central Vietnam", 16.4852, 107.493],
  ["Thai Binh, Northern Vietnam", 20.444, 106.312],
  ["Chiang Mai, Thailand", 18.788, 98.963],
] as const;
const farmTemplate = createDemoFarm();
const settings: SimulationSettings = { startYear: 2026, horizon: 3, climateAssumption: "baseline",
  weights: weightsFromPriorities(farmTemplate.farmerPriorities), economics: {} };

async function dataset<T>(id: string, lat: number, lon: number, start: string, end: string): Promise<T> {
  const query = new URLSearchParams({ lat: String(lat), lon: String(lon), start, end });
  const response = await fetch(`${base}/api/${id}?${query}`, { signal: AbortSignal.timeout(65000) });
  if (!response.ok) throw new Error(`${id} returned ${response.status}`);
  return response.json() as Promise<T>;
}

async function main() {
  const results: number[] = [];
  for (const [name, lat, lon] of locations) {
    const p = await Promise.allSettled([
      dataset<ClimateDataset>("climate", lat, lon, "2016", "2025"),
      dataset<DailyExtremes>("climate-daily", lat, lon, "2016", "2025"),
      dataset<NdviSeries>("ndvi", lat, lon, "2024-01-01", "2024-06-30"),
      dataset<EnvironmentalSeries>("imerg", lat, lon, "2016", "2025"),
      dataset<EnvironmentalSeries>("smap", lat, lon, "2016", "2025"),
    ] as const);
    const [monthly, daily, ndvi, imerg, smap] = p.map((x) => x.status === "fulfilled" ? x.value : null) as
      [ClimateDataset | null, DailyExtremes | null, NdviSeries | null, EnvironmentalSeries | null, EnvironmentalSeries | null];
    for (const x of [monthly, daily, ndvi, imerg, smap]) {
      if (x) {
        assert.deepEqual(x.evidence?.geometry.coordinates, [lon, lat]);
        assert.ok(Number.isFinite(Date.parse(x.evidence?.retrievedAt ?? "")));
      }
    }
    const climate = monthly ? climateWithImerg(monthly, imerg) : null;
    const farm = { ...farmTemplate, isDemo: false, latitude: lat, longitude: lon, boundary: null };
    const simulation = climate && runEngine({ farm, climate, scenarios: buildDefaultScenarios(farm, climate, settings), settings, extremes: daily, smap });
    const baselineMm = simulation && Math.round(simulation.reference.years[1].waterDemand.median);
    if (typeof baselineMm === "number") results.push(baselineMm);
    const annualRain = climate ? Math.round(climate.months.reduce((sum, m) => sum + m.precipMm, 0) / (climate.months.length / 12)) : null;
    console.log(JSON.stringify({
      name, lat, lon, powerMonths: monthly?.months.length, dailyMonths: daily?.months.length,
      ndviGood: ndvi?.points.filter((x) => x.ndvi !== null).length, ndviTotal: ndvi?.points.length,
      imergMonths: imerg?.observations.filter((x) => x.value !== null).length, smapValues: smap?.observations.filter((x) => x.value !== null).length,
      modelRain: !climate ? null : climate === monthly ? "POWER" : "IMERG", annualRain, baselineMm,
      scenarios: simulation && Object.values(simulation.results).map((r) => Math.round(r.years[1].waterDemand.median)),
      failures: p.flatMap((r) => r.status === "rejected" ? [String(r.reason)] : []),
    }));
  }
  assert.equal(results.length, locations.length);
  assert.ok(new Set(results).size > 1, "Expected downstream irrigation estimates to vary with location");
  for (const path of ["/api/climate?lat=&lon=105", "/api/ndvi?lat=91&lon=105", "/api/imerg?lat=10&lon=105&start=2000&end=2001", "/api/smap?lat=10&lon=105&start=2099"]) {
    assert.equal((await fetch(base + path)).status, 400, path);
  }
  const outsideSmap = await fetch(base + "/api/smap?lat=89&lon=105");
  assert.equal(outsideSmap.status, 404);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
